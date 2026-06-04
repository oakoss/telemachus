import { expect, test } from 'vitest';

import {
  AppError,
  createAppEnv,
  createConsoleLogger,
  createIdGenerator,
  noopReporter,
  ok,
  systemClock,
} from './index';

test('public API is reachable through the package entry', () => {
  expect(typeof createIdGenerator).toBe('function');
  expect(typeof ok).toBe('function');
  expect(typeof systemClock.now).toBe('function');
  expect(typeof createAppEnv).toBe('function');
  expect(typeof createConsoleLogger).toBe('function');
  expect(typeof noopReporter.captureError).toBe('function');
  expect(new AppError('x')).toBeInstanceOf(Error);
});
