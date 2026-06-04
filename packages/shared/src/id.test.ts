import { expect, test } from 'vitest';

import { fixedClock } from './clock';
import { AppError } from './error';
import { asUuid, createIdGenerator, unsafeUuid } from './id';

const fixedRng = (): Uint8Array => new Uint8Array(16).fill(0xab);

test('generates a valid UUIDv7 carrying the injected timestamp', () => {
  const ms = 1_700_000_000_000;
  const id = createIdGenerator(fixedClock(ms))();
  expect(id[14]).toBe('7'); // version nibble
  expect(['8', '9', 'a', 'b']).toContain(id[19]); // variant nibble
  const tsHex = id.replaceAll('-', '').slice(0, 12);
  expect(Number.parseInt(tsHex, 16)).toBe(ms);
});

test('produces distinct ids within the same millisecond (default rng)', () => {
  const newId = createIdGenerator(fixedClock(1_700_000_000_000));
  expect(newId()).not.toBe(newId());
});

test('is fully deterministic when clock and rng are injected', () => {
  const ms = 1_700_000_000_000;
  const a = createIdGenerator(fixedClock(ms), fixedRng)();
  const b = createIdGenerator(fixedClock(ms), fixedRng)();
  expect(a).toBe(b);
});

test('throws on a bad clock value instead of minting a malformed id', () => {
  expect(() => createIdGenerator(fixedClock(Number.NaN))()).toThrow(AppError);
});

test('asUuid validates v7 shape; unsafeUuid brands without checking', () => {
  const id = createIdGenerator(fixedClock(1_700_000_000_000))();
  expect(asUuid(id).ok).toBe(true);
  expect(asUuid('not-a-uuid').ok).toBe(false);
  expect(unsafeUuid('passthrough')).toBe('passthrough');
});
