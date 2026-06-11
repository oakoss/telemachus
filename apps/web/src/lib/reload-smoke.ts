import {
  createPersistedCollection,
  createPersistence,
  probeReplayWindowPruned,
} from '@oakoss/db';
import {
  type Uuid,
  createIdGenerator,
  memoizeAsync,
  systemClock,
} from '@oakoss/shared';

export type ReloadNote = {
  createdAt: number;
  id: Uuid<'reload-note'>;
  text: string;
};

export const newReloadNoteId = createIdGenerator<'reload-note'>(systemClock);

const COLLECTION_ID = 'reload-smoke-notes';

// Prune the applied_tx replay log to a single row so any catch-up from an older
// version can't be served incrementally — the adapter must signal
// requiresFullReload, the prune behavior telemachus-t1v accounts for. The
// default 1000-row window can't be reached in a test (needs ≥1000 txs / 24h);
// an isolated store keeps this off the shared one.
export const getReloadSmoke = memoizeAsync(async () => {
  const persistence = await createPersistence({
    appliedTxPruneMaxRows: 1,
    store: {
      coordinatorName: 'telemachus-reload-smoke',
      databaseName: 'telemachus-reload-smoke.sqlite',
    },
  });
  const notes = await createPersistedCollection<
    ReloadNote,
    Uuid<'reload-note'>
  >({ getKey: (note) => note.id, id: COLLECTION_ID, persistence });
  return { notes, persistence };
});

// Drives the recovery contract telemachus-t1v depends on: with the replay log
// pruned to one row, a catch-up from version 0 reports requiresFullReload. The
// app can't induce the real trigger (a follower's dropped tx:committed
// broadcast → seq gap), so probe pullSince directly on the live OPFS stack.
export const probeReloadWindow = async (): Promise<boolean> => {
  const { persistence } = await getReloadSmoke();
  return probeReplayWindowPruned(persistence, COLLECTION_ID);
};
