import { beforeEach, expect, test, vi } from 'vitest';

// Mock the seam: these tests cover the route-level singleton's memoization and
// retry-after-rejection behavior, not OPFS or Electric.
const createElectricPersistedCollection = vi.fn<() => Promise<unknown>>();

vi.mock('@oakoss/db', () => ({ createElectricPersistedCollection }));

beforeEach(() => {
  createElectricPersistedCollection.mockReset();
  vi.resetModules();
});

const loadGetElectricSmokeNotes = async () => {
  const mod = await import('./electric-smoke');
  return mod.getElectricSmokeNotes;
};

test('opens the collection once, shared across calls', async () => {
  createElectricPersistedCollection.mockResolvedValue({ ready: true });
  const getElectricSmokeNotes = await loadGetElectricSmokeNotes();
  await getElectricSmokeNotes();
  await getElectricSmokeNotes();
  expect(createElectricPersistedCollection).toHaveBeenCalledTimes(1);
});

test('deduplicates concurrent in-flight opens', async () => {
  createElectricPersistedCollection.mockResolvedValue({ ready: true });
  const getElectricSmokeNotes = await loadGetElectricSmokeNotes();
  const first = getElectricSmokeNotes();
  const second = getElectricSmokeNotes();
  expect(second).toBe(first);
  await Promise.all([first, second]);
  expect(createElectricPersistedCollection).toHaveBeenCalledTimes(1);
});

test('retries a failed open instead of caching the rejection', async () => {
  createElectricPersistedCollection
    .mockRejectedValueOnce(new Error('electric'))
    .mockResolvedValue({ ready: true });
  const getElectricSmokeNotes = await loadGetElectricSmokeNotes();
  await expect(getElectricSmokeNotes()).rejects.toThrow('electric');
  await expect(getElectricSmokeNotes()).resolves.toEqual({ ready: true });
  expect(createElectricPersistedCollection).toHaveBeenCalledTimes(2);
});
