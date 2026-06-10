import { createConsoleLogger } from '@oakoss/shared';
import { useLiveQuery } from '@tanstack/react-db';
import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';

import {
  getElectricSmokeNotes,
  newElectricSmokeNoteId,
} from '#/lib/electric-smoke.ts';

const logger = createConsoleLogger({ bindings: { route: '/electric-smoke' } });

// Readiness gates on the Electric sync's markReady, not on SQLite hydration —
// with Electric down, preload() pends forever (the client retries 5xx
// internally without surfacing an error). The deadline turns that silent hang
// into a rejection the errorComponent can show.
const PRELOAD_DEADLINE_MS = 10_000;

// ssr: false — OPFS, wa-sqlite worker, and the Electric shape stream are browser-only.
export const Route = createFileRoute('/electric-smoke')({
  ssr: false,
  loader: async () => {
    const notes = await getElectricSmokeNotes();
    let deadline: ReturnType<typeof setTimeout> | undefined;
    try {
      await Promise.race([
        notes.preload(),
        new Promise((_resolve, reject) => {
          deadline = setTimeout(() => {
            reject(new Error('sync backend unreachable — preload timed out'));
          }, PRELOAD_DEADLINE_MS);
        }),
      ]);
    } finally {
      clearTimeout(deadline);
    }
    return { notes };
  },
  component: ElectricSmoke,
  errorComponent: LoaderError,
});

// A failed open is un-cached (lib/electric-smoke.ts), so navigating again
// retries — tell the user that instead of the router's generic boundary.
function LoaderError({ error }: { error: Error }) {
  // In an effect: logging during render double-fires under StrictMode and
  // double-counts in the e2e error trap.
  useEffect(() => {
    logger.error('collection open failed', {
      errorMessage: error.message,
      errorStack: error.stack,
    });
  }, [error]);
  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold">Electric smoke</h1>
      <p className="mt-4 text-lg text-red-700">
        The local data failed to load — the sync backend may be unreachable.
        Reload the page to retry.
      </p>
    </div>
  );
}

const SAVE_LABELS = {
  error: 'Sync failed',
  idle: '',
  saved: 'Synced to Postgres',
  saving: 'Syncing…',
} as const;

function ElectricSmoke() {
  const { notes } = Route.useLoaderData();
  const [text, setText] = useState('');
  const [saveState, setSaveState] = useState<keyof typeof SAVE_LABELS>('idle');
  const [failedCount, setFailedCount] = useState(0);
  const latestInsertRef = useRef(0);

  const { data } = useLiveQuery((q) =>
    q
      .from({ note: notes })
      .orderBy(({ note }) => note.created_at, 'asc')
      .orderBy(({ note }) => note.id, 'asc'),
  );

  const addNote = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    // isPersisted settles only after the write API confirms the insert AND
    // Electric streams the txid back — "saved" here means round-tripped.
    const tx = notes.insert({
      created_at: Date.now(),
      id: newElectricSmokeNoteId(),
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
        logger.error('sync failed', {
          ...(error instanceof Error
            ? { errorMessage: error.message, errorStack: error.stack }
            : { errorMessage: String(error) }),
          text: trimmed,
        });
        // The optimistic row rolls back on failure — restore the draft (unless
        // the user already typed something new) so it can be retried, and bump
        // the sticky counter so even a stale failure stays visible. Known
        // ambiguity for a real implementation (R1): if the server committed
        // but the response was lost, retrying the restored draft duplicates.
        setText((current) => current || trimmed);
        setFailedCount((count) => count + 1);
        if (seq === latestInsertRef.current) setSaveState('error');
      },
    );
  };

  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold">Electric smoke</h1>
      <p className="mt-4 text-lg">
        SQLite-persisted TanStack DB collection with ElectricSQL sync attached
        additively. Notes round-trip through Postgres and survive a reload.
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
          {failedCount} {failedCount === 1 ? 'note' : 'notes'} failed to sync
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
