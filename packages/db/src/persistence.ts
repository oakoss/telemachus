import { memoizeAsync } from '@oakoss/shared';
import {
  BrowserCollectionCoordinator,
  createBrowserWASQLitePersistence,
  openBrowserWASQLiteOPFSDatabase,
  persistedCollectionOptions,
} from '@tanstack/browser-db-sqlite-persistence';
import { createCollection } from '@tanstack/db';

const DATABASE_NAME = 'telemachus.sqlite';
const COORDINATOR_NAME = 'telemachus';
// Owned here so a library default change can't silently shift our on-device
// migration baseline.
export const DEFAULT_SCHEMA_VERSION = 1;

// The browser persistence factory prunes the applied_tx replay log and, when a
// resuming/follower tab falls behind the pruned floor, signals
// requiresFullReload so the collection re-reads from the store instead of
// replaying (telemachus-t1v; recovery is internal to @tanstack/db). These pin
// the retention window and the incremental-vs-full-reload cutover so a library
// bump can't silently change how long replay catch-up stays available or how
// often a follower full-reloads. Values match the library's own 0.2.0 defaults
// — owned here, not inherited.
export const APPLIED_TX_PRUNE_MAX_ROWS = 1000;
export const APPLIED_TX_PRUNE_MAX_AGE_SECONDS = 24 * 60 * 60;
export const PULL_SINCE_RELOAD_THRESHOLD = 128;

export type Persistence = Awaited<ReturnType<typeof createPersistence>>;

export type PersistenceOptions = {
  appliedTxPruneMaxAgeSeconds?: number;
  appliedTxPruneMaxRows?: number;
  pullSinceReloadThreshold?: number;
  // Both names move together: a database without its own coordinator would
  // isolate the store yet share leadership with the shared one.
  store?: { coordinatorName: string; databaseName: string };
};

// Overrides let a test or isolated store tune the prune / reload thresholds
// without touching the shared singleton getPersistence() wraps.
export const createPersistence = async (options: PersistenceOptions = {}) => {
  const database = await openBrowserWASQLiteOPFSDatabase({
    databaseName: options.store?.databaseName ?? DATABASE_NAME,
  });
  const coordinator = new BrowserCollectionCoordinator({
    dbName: options.store?.coordinatorName ?? COORDINATOR_NAME,
  });
  return createBrowserWASQLitePersistence({
    appliedTxPruneMaxAgeSeconds:
      options.appliedTxPruneMaxAgeSeconds ?? APPLIED_TX_PRUNE_MAX_AGE_SECONDS,
    appliedTxPruneMaxRows:
      options.appliedTxPruneMaxRows ?? APPLIED_TX_PRUNE_MAX_ROWS,
    coordinator,
    database,
    pullSinceReloadThreshold:
      options.pullSinceReloadThreshold ?? PULL_SINCE_RELOAD_THRESHOLD,
  });
};

export const getPersistence = memoizeAsync(() => createPersistence());

export type PersistedCollectionConfig<
  T extends object,
  K extends string | number,
> = {
  getKey: (item: T) => K;
  id: string;
  persistence?: Persistence;
  schemaVersion?: number;
};

// Sync-absent persistedCollectionOptions, so a sync adapter (Electric,
// telemachus-8zj.8) spreads in additively without changing callers.
export const createPersistedCollection = async <
  T extends object,
  K extends string | number,
>(
  config: PersistedCollectionConfig<T, K>,
) =>
  createCollection(
    persistedCollectionOptions<T, K>({
      getKey: config.getKey,
      id: config.id,
      persistence: config.persistence ?? (await getPersistence()),
      schemaVersion: config.schemaVersion ?? DEFAULT_SCHEMA_VERSION,
    }),
  );

// pullSince is the only requiresFullReload surface, so this probe lives beside
// the persistence config it depends on — a library protocol change then breaks
// here, not in every caller reaching through the coordinator. Returns true once
// the prune has trimmed the applied_tx floor past version 0; recovery itself is
// internal to @tanstack/db (telemachus-t1v). pullSince routes a follower tab to
// the leader over RPC, so this must not force leadership — doing so would block
// the probe on the leader's lock.
export const probeReplayWindowPruned = async (
  persistence: Persistence,
  collectionId: string,
): Promise<boolean> => {
  const { coordinator } = persistence;
  if (!coordinator?.pullSince) {
    throw new Error('persistence coordinator does not support pullSince');
  }
  const result = await coordinator.pullSince(collectionId, 0);
  if (!result.ok) {
    throw new Error(`pullSince failed: ${result.error}`);
  }
  return result.requiresFullReload;
};
