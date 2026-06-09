import { beforeEach, expect, test, vi } from 'vitest';

// Mock the seam: these tests cover the route-level singleton's memoization and
// retry-after-rejection behavior, not OPFS.
const createPersistedCollection = vi.fn<() => Promise<unknown>>();

vi.mock('@oakoss/db', () => ({ createPersistedCollection }));

beforeEach(() => {
  createPersistedCollection.mockReset();
  vi.resetModules();
});

const loadGetSmokeNotes = async () => {
  const mod = await import('./db-smoke');
  return mod.getSmokeNotes;
};

test('opens the collection once, shared across calls', async () => {
  createPersistedCollection.mockResolvedValue({ ready: true });
  const getSmokeNotes = await loadGetSmokeNotes();
  await getSmokeNotes();
  await getSmokeNotes();
  expect(createPersistedCollection).toHaveBeenCalledTimes(1);
});

test('deduplicates concurrent in-flight opens', async () => {
  createPersistedCollection.mockResolvedValue({ ready: true });
  const getSmokeNotes = await loadGetSmokeNotes();
  const first = getSmokeNotes();
  const second = getSmokeNotes();
  expect(second).toBe(first);
  await Promise.all([first, second]);
  expect(createPersistedCollection).toHaveBeenCalledTimes(1);
});

test('retries a failed open instead of caching the rejection', async () => {
  createPersistedCollection
    .mockRejectedValueOnce(new Error('opfs'))
    .mockResolvedValue({ ready: true });
  const getSmokeNotes = await loadGetSmokeNotes();
  await expect(getSmokeNotes()).rejects.toThrow('opfs');
  await expect(getSmokeNotes()).resolves.toEqual({ ready: true });
  expect(createPersistedCollection).toHaveBeenCalledTimes(2);
});
