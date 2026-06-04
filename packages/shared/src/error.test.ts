import { expect, test } from 'vitest';

import { AppError, appError } from './error';

test('defaults category to internal and sets message to code', () => {
  const e = appError('something.broke');
  expect(e).toBeInstanceOf(Error);
  expect(e).toBeInstanceOf(AppError);
  expect(e.message).toBe('something.broke');
  expect(e.code).toBe('something.broke');
  expect(e.category).toBe('internal');
  expect(e.cause).toBeUndefined();
});

test('toJSON omits correlationId and params when unset', () => {
  expect(appError('something.broke').toJSON()).toEqual({
    category: 'internal',
    code: 'something.broke',
  });
  expect('correlationId' in appError('x').toJSON()).toBe(false);
});

test('retains cause on the instance but never serializes it', () => {
  const inner = new Error('inner secret');
  const e = appError('validation.tooLong', {
    category: 'validation',
    cause: inner,
    correlationId: 'corr-1',
    params: { max: 100 },
  });
  expect(e.cause).toBe(inner);
  expect(e.toJSON()).toEqual({
    category: 'validation',
    code: 'validation.tooLong',
    correlationId: 'corr-1',
    params: { max: 100 },
  });
  const json = JSON.stringify(e);
  expect(json).not.toContain('inner secret');
  expect(json).not.toContain('stack');
});
