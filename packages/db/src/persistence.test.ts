import { beforeEach, expect, test, vi } from 'vitest';

// Mock the browser persistence + db core so the OPFS open never runs in node;
// these tests cover the factory's own logic (memoization, defaulting,
// passthrough). OPFS behavior is proven by the apps/web Playwright E2E.
const openDatabase = vi.fn<() => Promise<unknown>>();
const coordinator = vi.fn();
const createPersistence = vi.fn(() => ({ persistence: true }));
const persistedCollectionOptions = vi.fn((options: unknown) => options);
const createCollection = vi.fn((options: unknown) => options);

vi.mock('@tanstack/browser-db-sqlite-persistence', () => ({
  BrowserCollectionCoordinator: class {
    constructor(config: unknown) {
      coordinator(config);
    }
  },
  createBrowserWASQLitePersistence: createPersistence,
  openBrowserWASQLiteOPFSDatabase: openDatabase,
  persistedCollectionOptions,
}));
vi.mock('@tanstack/db', () => ({ createCollection }));

const getKey = (row: { id: string }) => row.id;

// resetModules clears the module-level `persistence` singleton between tests.
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
