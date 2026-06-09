import { createConsoleLogger } from '@oakoss/shared';
import { useLiveQuery } from '@tanstack/react-db';
import { createFileRoute } from '@tanstack/react-router';
import { useRef, useState } from 'react';

import { getSmokeNotes, newSmokeNoteId } from '#/lib/db-smoke.ts';

const logger = createConsoleLogger({ bindings: { route: '/db-smoke' } });

// ssr: false — OPFS and the wa-sqlite worker exist only in the browser.
// The loader hydrates the collection before first paint so the list never flashes empty.
export const Route = createFileRoute('/db-smoke')({
  ssr: false,
  loader: async () => {
    const notes = await getSmokeNotes();
    await notes.preload();
    return { notes };
  },
  component: DbSmoke,
});

const SAVE_LABELS = {
  error: 'Save failed',
  idle: '',
  saved: 'Saved to SQLite',
  saving: 'Saving…',
} as const;

function DbSmoke() {
  const { notes } = Route.useLoaderData();
  const [text, setText] = useState('');
  const [saveState, setSaveState] = useState<keyof typeof SAVE_LABELS>('idle');
  const [failedCount, setFailedCount] = useState(0);
  const latestInsertRef = useRef(0);

  const { data } = useLiveQuery((q) =>
    q
      .from({ note: notes })
      .orderBy(({ note }) => note.createdAt, 'asc')
      .orderBy(({ note }) => note.id, 'asc'),
  );

  const addNote = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    // The insert applies optimistically; isPersisted settles once the row is
    // durable in OPFS. The seq guard keeps a stale settlement from overwriting
    // a newer insert's status.
    const tx = notes.insert({
      createdAt: Date.now(),
      id: newSmokeNoteId(),
      text: trimmed,
    });
    setText('');
    setSaveState('saving');
    const seq = ++latestInsertRef.current;
    tx.isPersisted.promise.then(
      () => {
        if (seq === latestInsertRef.current) setSaveState('saved');
      },
      (error: unknown) => {
        // Non-reserved keys: the logger overlays `message` with its own.
        logger.error('persist failed', {
          ...(error instanceof Error
            ? { errorMessage: error.message, errorStack: error.stack }
            : { errorMessage: String(error) }),
          text: trimmed,
        });
        // The optimistic row rolls back on failure — restore the draft (unless
        // the user already typed something new) so it can be retried, and bump
        // the sticky counter so even a stale failure stays visible.
        setText((current) => current || trimmed);
        setFailedCount((count) => count + 1);
        if (seq === latestInsertRef.current) setSaveState('error');
      },
    );
  };

  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold">DB smoke</h1>
      <p className="mt-4 text-lg">
        TanStack DB collection persisted to SQLite via wa-sqlite/OPFS. Notes
        survive a reload.
      </p>
      <form
        className="mt-6 flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          addNote();
        }}
      >
        <input
          aria-label="Note text"
          className="rounded-sm border border-gray-400 px-3 py-2"
          placeholder="Write a note"
          value={text}
          onChange={(event) => {
            setText(event.target.value);
          }}
        />
        <button
          className="rounded-sm bg-blue-700 px-4 py-2 font-semibold text-white"
          type="submit"
        >
          Add note
        </button>
      </form>
      <p
        aria-live="polite"
        className="mt-2 text-sm"
        data-save-state={saveState}
      >
        {SAVE_LABELS[saveState]}
      </p>
      {failedCount > 0 && (
        <p aria-live="polite" className="mt-1 text-sm text-red-700">
          {failedCount} {failedCount === 1 ? 'note' : 'notes'} failed to save
        </p>
      )}
      <ul aria-label="Notes" className="mt-6 flex flex-col gap-2">
        {data.map((note) => (
          <li
            className="rounded-sm border border-gray-300 px-3 py-2"
            key={note.id}
          >
            {note.text}
          </li>
        ))}
      </ul>
    </div>
  );
}
