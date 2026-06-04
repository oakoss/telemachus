import { expect, test } from 'vitest';

import { AppError, createIdGenerator, ok, systemClock } from './index';

test('public API is reachable through the package entry', () => {
  expect(typeof createIdGenerator).toBe('function');
  expect(typeof ok).toBe('function');
  expect(typeof systemClock.now).toBe('function');
  expect(new AppError('x')).toBeInstanceOf(Error);
});
