import { expect, test, vi } from 'vitest';

import { memoizeAsync } from './memoize';

test('calls the factory once and shares the result', async () => {
  const factory = vi.fn(() => Promise.resolve('value'));
  const get = memoizeAsync(factory);
  await expect(get()).resolves.toBe('value');
  await expect(get()).resolves.toBe('value');
  expect(factory).toHaveBeenCalledTimes(1);
});

test('deduplicates concurrent in-flight calls', async () => {
  const factory = vi.fn(() => Promise.resolve({ ready: true }));
  const get = memoizeAsync(factory);
  const first = get();
  const second = get();
  expect(second).toBe(first);
  await Promise.all([first, second]);
  expect(factory).toHaveBeenCalledTimes(1);
});

test('retries after a rejection instead of caching it', async () => {
  const factory = vi
    .fn<() => Promise<string>>()
    .mockRejectedValueOnce(new Error('transient'))
    .mockResolvedValue('recovered');
  const get = memoizeAsync(factory);
  await expect(get()).rejects.toThrow('transient');
  await expect(get()).resolves.toBe('recovered');
  expect(factory).toHaveBeenCalledTimes(2);
});

test('keeps sharing the recovered result after a retry', async () => {
  const factory = vi
    .fn<() => Promise<string>>()
    .mockRejectedValueOnce(new Error('transient'))
    .mockResolvedValue('recovered');
  const get = memoizeAsync(factory);
  await get().catch(() => null);
  await get();
  await get();
  expect(factory).toHaveBeenCalledTimes(2);
});
