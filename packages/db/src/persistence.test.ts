import { beforeEach, expect, test, vi } from 'vitest';

// Mock the browser persistence + db core so the OPFS open never runs in node;
// these tests cover the factory's own logic (memoization, defaulting,
// passthrough). OPFS behavior is proven by the apps/web Playwright E2E.
const openDatabase = vi.fn<() => Promise<unknown>>();
const coordinator = vi.fn();
const createBrowserPersistence = vi.fn((options: unknown) => options);
const persistedCollectionOptions = vi.fn((options: unknown) => options);
const createCollection = vi.fn((options: unknown) => options);

vi.mock('@tanstack/browser-db-sqlite-persistence', () => ({
  BrowserCollectionCoordinator: class {
    constructor(config: unknown) {
      coordinator(config);
    }
  },
  createBrowserWASQLitePersistence: createBrowserPersistence,
  openBrowserWASQLiteOPFSDatabase: openDatabase,
  persistedCollectionOptions,
}));
vi.mock('@tanstack/db', () => ({ createCollection }));

const getKey = (row: { id: string }) => row.id;

beforeEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
  openDatabase.mockResolvedValue({});
});

const loadFactory = async () => {
  const mod = await import('./persistence');
  return mod.createPersistedCollection;
};

test('opens the OPFS database + coordinator once, shared across collections', async () => {
  const createPersistedCollection = await loadFactory();
  await createPersistedCollection({ getKey, id: 'a' });
  await createPersistedCollection({ getKey, id: 'b' });
  expect(openDatabase).toHaveBeenCalledTimes(1);
  expect(coordinator).toHaveBeenCalledTimes(1);
});

test('defaults schemaVersion to 1 and forwards id + getKey', async () => {
  const createPersistedCollection = await loadFactory();
  await createPersistedCollection({ getKey, id: 'notes' });
  expect(persistedCollectionOptions).toHaveBeenCalledWith(
    expect.objectContaining({ getKey, id: 'notes', schemaVersion: 1 }),
  );
});

test('forwards an explicit schemaVersion', async () => {
  const createPersistedCollection = await loadFactory();
  await createPersistedCollection({ getKey, id: 'notes', schemaVersion: 3 });
  expect(persistedCollectionOptions).toHaveBeenCalledWith(
    expect.objectContaining({ schemaVersion: 3 }),
  );
});

test('retries the open after a failure instead of caching the rejection', async () => {
  openDatabase.mockRejectedValueOnce(new Error('opfs')).mockResolvedValue({});
  const createPersistedCollection = await loadFactory();
  await expect(createPersistedCollection({ getKey, id: 'a' })).rejects.toThrow(
    'opfs',
  );
  await createPersistedCollection({ getKey, id: 'a' });
  expect(openDatabase).toHaveBeenCalledTimes(2);
});

// The prune / reload knobs are inherited from the library unless we pass them;
// pin that getPersistence sends our owned defaults so a library default shift
// can't silently change replay retention or the full-reload cutover.
test('forwards the owned prune + reload thresholds to the persistence factory', async () => {
  const mod = await import('./persistence');
  await mod.createPersistedCollection({ getKey, id: 'a' });
  expect(createBrowserPersistence).toHaveBeenCalledWith(
    expect.objectContaining({
      appliedTxPruneMaxAgeSeconds: mod.APPLIED_TX_PRUNE_MAX_AGE_SECONDS,
      appliedTxPruneMaxRows: mod.APPLIED_TX_PRUNE_MAX_ROWS,
      pullSinceReloadThreshold: mod.PULL_SINCE_RELOAD_THRESHOLD,
    }),
  );
});

test('createPersistence overrides the thresholds + store names', async () => {
  const mod = await import('./persistence');
  await mod.createPersistence({
    appliedTxPruneMaxAgeSeconds: 3600,
    appliedTxPruneMaxRows: 1,
    pullSinceReloadThreshold: 0,
    store: { coordinatorName: 'iso-coord', databaseName: 'iso.sqlite' },
  });
  expect(openDatabase).toHaveBeenCalledWith({ databaseName: 'iso.sqlite' });
  expect(coordinator).toHaveBeenCalledWith({ dbName: 'iso-coord' });
  expect(createBrowserPersistence).toHaveBeenCalledWith(
    expect.objectContaining({
      appliedTxPruneMaxAgeSeconds: 3600,
      appliedTxPruneMaxRows: 1,
      pullSinceReloadThreshold: 0,
    }),
  );
});

// The owned constants exist to pin replay retention against a silent library
// default drift — assert they still equal the library's exported defaults
// (un-mocked) so a bump that moves the floor fails here, loudly.
// PULL_SINCE_RELOAD_THRESHOLD can't be pinned this way: the browser package
// doesn't re-export its default, so the forwarding test above is its only guard.
test('owned prune defaults track the library exported defaults', async () => {
  const actual = (await vi.importActual(
    '@tanstack/browser-db-sqlite-persistence',
  )) as {
    DEFAULT_APPLIED_TX_PRUNE_MAX_AGE_SECONDS: number;
    DEFAULT_APPLIED_TX_PRUNE_MAX_ROWS: number;
  };
  const mod = await import('./persistence');
  expect(mod.APPLIED_TX_PRUNE_MAX_ROWS).toBe(
    actual.DEFAULT_APPLIED_TX_PRUNE_MAX_ROWS,
  );
  expect(mod.APPLIED_TX_PRUNE_MAX_AGE_SECONDS).toBe(
    actual.DEFAULT_APPLIED_TX_PRUNE_MAX_AGE_SECONDS,
  );
});

test('an injected persistence bypasses the singleton store', async () => {
  const mod = await import('./persistence');
  const injected = { sentinel: true } as never;
  await mod.createPersistedCollection({
    getKey,
    id: 'a',
    persistence: injected,
  });
  expect(openDatabase).not.toHaveBeenCalled();
  expect(persistedCollectionOptions).toHaveBeenCalledWith(
    expect.objectContaining({ persistence: injected }),
  );
});

// The probe's OPFS behavior is proven by the E2E, but its control flow — the
// two guards and the version-0 floor it pulls from — is pure coordinator logic
// node can cover with a fake persistence.
const fakePersistence = (pullSince?: unknown) =>
  ({ coordinator: pullSince ? { pullSince } : {} }) as never;

test('probeReplayWindowPruned throws when the coordinator lacks pullSince', async () => {
  const mod = await import('./persistence');
  await expect(
    mod.probeReplayWindowPruned(fakePersistence(), 'c'),
  ).rejects.toThrow('does not support pullSince');
});

test('probeReplayWindowPruned throws on a failed pullSince', async () => {
  const mod = await import('./persistence');
  const pullSince = vi.fn().mockResolvedValue({ error: 'boom', ok: false });
  await expect(
    mod.probeReplayWindowPruned(fakePersistence(pullSince), 'c'),
  ).rejects.toThrow('pullSince failed: boom');
});

test('probeReplayWindowPruned returns requiresFullReload from row version 0', async () => {
  const mod = await import('./persistence');
  const pullSince = vi
    .fn()
    .mockResolvedValue({ ok: true, requiresFullReload: true });
  await expect(
    mod.probeReplayWindowPruned(fakePersistence(pullSince), 'notes'),
  ).resolves.toBe(true);
  expect(pullSince).toHaveBeenCalledWith('notes', 0);
});

test('probeReplayWindowPruned returns false for a servable window', async () => {
  const mod = await import('./persistence');
  const pullSince = vi
    .fn()
    .mockResolvedValue({ ok: true, requiresFullReload: false });
  await expect(
    mod.probeReplayWindowPruned(fakePersistence(pullSince), 'c'),
  ).resolves.toBe(false);
});
