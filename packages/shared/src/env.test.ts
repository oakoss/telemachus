import { expect, test } from 'vitest';

import { createAppEnv } from './env';
import { AppError } from './error';

const DATABASE_URL =
  'postgres://telemachus:telemachus@localhost:5432/telemachus';

test('applies defaults for a minimal valid environment', () => {
  const env = createAppEnv({ DATABASE_URL });
  expect(env.NODE_ENV).toBe('development');
  expect(env.LOG_LEVEL).toBe('info');
  expect(env.DATABASE_URL).toBe(DATABASE_URL);
  expect(env.ELECTRIC_URL).toBe('http://localhost:3010');
});

test('rejects a non-http ELECTRIC_URL', () => {
  expect(() =>
    createAppEnv({ DATABASE_URL, ELECTRIC_URL: 'ftp://electric:3000' }),
  ).toThrow(AppError);
});

test('requires ELECTRIC_URL in production', () => {
  let caught: unknown;
  try {
    createAppEnv({ DATABASE_URL, NODE_ENV: 'production' });
  } catch (error) {
    caught = error;
  }
  expect(caught).toBeInstanceOf(AppError);
  expect((caught as AppError).params?.issues).toEqual([
    expect.stringContaining('ELECTRIC_URL'),
  ]);
});

test('accepts an explicit ELECTRIC_URL in production', () => {
  const env = createAppEnv({
    DATABASE_URL,
    ELECTRIC_URL: 'http://electric.internal:3000',
    NODE_ENV: 'production',
  });
  expect(env.ELECTRIC_URL).toBe('http://electric.internal:3000');
});

test('reads provided values', () => {
  const env = createAppEnv({
    DATABASE_URL,
    ELECTRIC_URL: 'http://electric.lan:4000',
    LOG_LEVEL: 'warn',
    NODE_ENV: 'production',
  });
  expect(env.NODE_ENV).toBe('production');
  expect(env.LOG_LEVEL).toBe('warn');
  expect(env.ELECTRIC_URL).toBe('http://electric.lan:4000');
});

test('throws env.invalid carrying the failing field in issues', () => {
  let caught: unknown;
  try {
    createAppEnv({ DATABASE_URL, NODE_ENV: 'staging' });
  } catch (error) {
    caught = error;
  }
  expect(caught).toBeInstanceOf(AppError);
  const e = caught as AppError;
  expect(e.code).toBe('env.invalid');
  expect(e.category).toBe('internal');
  expect(e.params?.issues).toEqual([expect.stringContaining('NODE_ENV')]);
});

test('requires DATABASE_URL', () => {
  let caught: unknown;
  try {
    createAppEnv({});
  } catch (error) {
    caught = error;
  }
  expect(caught).toBeInstanceOf(AppError);
  expect((caught as AppError).params?.issues).toEqual([
    expect.stringContaining('DATABASE_URL'),
  ]);
});

test('rejects a DATABASE_URL that is not a postgres connection string', () => {
  expect(() => createAppEnv({ DATABASE_URL: 'http://localhost/db' })).toThrow(
    AppError,
  );
});

test('accepts a postgresql:// connection string', () => {
  const url = 'postgresql://u:p@db.internal:5432/app';
  expect(createAppEnv({ DATABASE_URL: url }).DATABASE_URL).toBe(url);
});

test('rejects a scheme-only DATABASE_URL with no host', () => {
  expect(() => createAppEnv({ DATABASE_URL: 'postgres://' })).toThrow(AppError);
});

test('treats an empty DATABASE_URL as missing', () => {
  expect(() => createAppEnv({ DATABASE_URL: '' })).toThrow(AppError);
});
