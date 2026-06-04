import { expect, test } from 'vitest';

import { createConsoleLogger, redact, silentLogger } from './logger';

const collect = (): { lines: string[]; write: (line: string) => void } => {
  const lines: string[] = [];
  return { lines, write: (line) => void lines.push(line) };
};

test('redact replaces sensitive keys recursively, keeps the rest', () => {
  expect(
    redact({ nested: { ok: 1, token: 't' }, password: 's', user: 'a' }),
  ).toEqual({
    nested: { ok: 1, token: '[REDACTED]' },
    password: '[REDACTED]',
    user: 'a',
  });
});

test('redact recurses into arrays, including array-nested secrets', () => {
  expect(redact([{ ok: 1, token: 't' }])).toEqual([
    { ok: 1, token: '[REDACTED]' },
  ]);
  expect(redact({ items: [{ password: 's' }] })).toEqual({
    items: [{ password: '[REDACTED]' }],
  });
});

test('redact matches keys case-insensitively', () => {
  expect(redact({ Authorization: 'Bearer x', PASSWORD: 'p' })).toEqual({
    Authorization: '[REDACTED]',
    PASSWORD: '[REDACTED]',
  });
});

test('filters messages below the configured level', () => {
  const { lines, write } = collect();
  const log = createConsoleLogger({ level: 'warn', write });
  log.info('skip me');
  log.warn('keep me');
  expect(lines).toHaveLength(1);
  expect(lines[0]).toContain('keep me');
  expect(lines[0]).toContain('"level":"warn"');
});

test('child binds fields and inherits the parent level + redaction', () => {
  const { lines, write } = collect();
  const log = createConsoleLogger({ level: 'warn', write }).child({
    correlationId: 'c1',
  });
  log.info('dropped');
  log.warn('kept', { password: 'hunter2' });
  expect(lines).toHaveLength(1);
  expect(lines[0]).toContain('"correlationId":"c1"');
  expect(lines[0]).toContain('[REDACTED]');
  expect(lines[0]).not.toContain('hunter2');
});

test('honors custom redactKeys (and ignores defaults when overridden)', () => {
  const { lines, write } = collect();
  const log = createConsoleLogger({ redactKeys: ['SSN'], write });
  log.info('x', { ssn: '123', token: 't' });
  expect(lines[0]).toContain('[REDACTED]'); // ssn, matched case-insensitively
  expect(lines[0]).toContain('"token":"t"'); // not in the custom list
});

test('reserved level/message keys cannot be shadowed by caller fields', () => {
  const { lines, write } = collect();
  const log = createConsoleLogger({ write });
  log.warn('real', { level: 'info', message: 'fake' });
  expect(lines[0]).toContain('"level":"warn"');
  expect(lines[0]).toContain('"message":"real"');
  expect(lines[0]).not.toContain('fake');
});

test('never throws on unserializable (cyclic) fields', () => {
  const { lines, write } = collect();
  const log = createConsoleLogger({ write });
  const cyclic: Record<string, unknown> = {};
  cyclic.self = cyclic;
  expect(() => log.info('cycle', cyclic)).not.toThrow();
  expect(lines[0]).toContain('unserializable log fields');
});

test('silentLogger emits nothing and never throws', () => {
  expect(() => {
    silentLogger.info('x');
    silentLogger.child({ a: 1 }).error('y');
  }).not.toThrow();
});
