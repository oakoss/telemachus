import { createConsoleLogger } from '@oakoss/shared';
import { useLiveQuery } from '@tanstack/react-db';
import { createFileRoute } from '@tanstack/react-router';
import { useRef, useState } from 'react';

import {
  getReloadSmoke,
  newReloadNoteId,
  probeReloadWindow,
} from '#/lib/reload-smoke.ts';

const logger = createConsoleLogger({ bindings: { route: '/reload-smoke' } });

// ssr: false — OPFS and the wa-sqlite worker exist only in the browser.
export const Route = createFileRoute('/_public/reload-smoke')({
  ssr: false,
  loader: async () => {
    const { notes } = await getReloadSmoke();
    await notes.preload();
    return { notes };
  },
  component: ReloadSmoke,
});

const SAVE_LABELS = {
  error: 'Save failed',
  idle: '',
  saved: 'Saved to SQLite',
  saving: 'Saving…',
} as const;

const PROBE_LABELS = {
  error: 'Replay window check failed',
  idle: '',
  pruned: 'Replay window pruned: full reload required',
  servable: 'Replay window intact: incremental catch-up',
} as const;

function ReloadSmoke() {
  const { notes } = Route.useLoaderData();
  const [text, setText] = useState('');
  const [saveState, setSaveState] = useState<keyof typeof SAVE_LABELS>('idle');
  const [probeState, setProbeState] =
    useState<keyof typeof PROBE_LABELS>('idle');
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
    const tx = notes.insert({
      createdAt: Date.now(),
      id: newReloadNoteId(),
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
        logger.error('note save failed', {
          errorMessage: error instanceof Error ? error.message : String(error),
        });
        if (seq === latestInsertRef.current) setSaveState('error');
      },
    );
  };

  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold">Reload smoke</h1>
      <p className="mt-4 text-lg">
        Replay log pruned to one row, so a catch-up from an old version forces
        requiresFullReload. Notes survive the full reload because the prune
        trims only the replay log, not the rows.
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
      <button
        className="mt-4 rounded-sm border border-gray-400 px-4 py-2 font-semibold"
        type="button"
        onClick={() => {
          probeReloadWindow().then(
            (pruned) => {
              setProbeState(pruned ? 'pruned' : 'servable');
            },
            (error: unknown) => {
              logger.error('replay probe failed', {
                errorMessage:
                  error instanceof Error ? error.message : String(error),
              });
              setProbeState('error');
            },
          );
        }}
      >
        Check replay window
      </button>
      <p
        aria-live="polite"
        className="mt-2 text-sm"
        data-replay-pruned={probeState === 'idle' ? undefined : probeState}
      >
        {PROBE_LABELS[probeState]}
      </p>
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
