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
const DEFAULT_SCHEMA_VERSION = 1;

// One OPFS database + leader-elected coordinator for the whole app, opened
// lazily on first use (browser-only) and shared by every collection.
let persistence:
  | Promise<ReturnType<typeof createBrowserWASQLitePersistence>>
  | undefined;

const getPersistence = () =>
  (persistence ??= (async () => {
    const database = await openBrowserWASQLiteOPFSDatabase({
      databaseName: DATABASE_NAME,
    });
    const coordinator = new BrowserCollectionCoordinator({
      dbName: COORDINATOR_NAME,
    });
    return createBrowserWASQLitePersistence({ coordinator, database });
  })().catch((error: unknown) => {
    // Don't cache a rejected open — let the next caller retry a transient OPFS
    // failure (quota, a locked VFS, an unsupported context) rather than wedging
    // the session until reload.
    persistence = undefined;
    throw error;
  }));

export type PersistedCollectionConfig<
  T extends object,
  K extends string | number,
> = { getKey: (item: T) => K; id: string; schemaVersion?: number };

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
      persistence: await getPersistence(),
      schemaVersion: config.schemaVersion ?? DEFAULT_SCHEMA_VERSION,
    }),
  );
