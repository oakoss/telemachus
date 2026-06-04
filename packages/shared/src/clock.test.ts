import { expect, test } from 'vitest';

import { fixedClock, systemClock } from './clock';

test('fixedClock returns, sets, and advances a controlled time', () => {
  const clock = fixedClock(1000);
  expect(clock.now()).toBe(1000);
  clock.set(2000);
  expect(clock.now()).toBe(2000);
  clock.advance(500);
  expect(clock.now()).toBe(2500);
});

test('systemClock tracks wall-clock time', () => {
  const before = Date.now();
  expect(systemClock.now()).toBeGreaterThanOrEqual(before);
});
