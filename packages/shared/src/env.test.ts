import { expect, test } from 'vitest';

import { createAppEnv } from './env';
import { AppError } from './error';

test('applies defaults for a minimal environment', () => {
  const env = createAppEnv({});
  expect(env.NODE_ENV).toBe('development');
  expect(env.LOG_LEVEL).toBe('info');
});

test('reads provided values', () => {
  const env = createAppEnv({ LOG_LEVEL: 'warn', NODE_ENV: 'production' });
  expect(env.NODE_ENV).toBe('production');
  expect(env.LOG_LEVEL).toBe('warn');
});

test('throws env.invalid carrying the failing field in issues', () => {
  let caught: unknown;
  try {
    createAppEnv({ NODE_ENV: 'staging' });
  } catch (error) {
    caught = error;
  }
  expect(caught).toBeInstanceOf(AppError);
  const e = caught as AppError;
  expect(e.code).toBe('env.invalid');
  expect(e.category).toBe('internal');
  expect(e.params?.issues).toEqual([expect.stringContaining('NODE_ENV')]);
});
