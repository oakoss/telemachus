import { expect, test } from 'vitest';

import { appError } from './error';
import { noopReporter } from './reporter';

test('noopReporter swallows errors without throwing', () => {
  expect(() => noopReporter.captureError(appError('x'))).not.toThrow();
  expect(() =>
    noopReporter.captureError(new Error('y'), { correlationId: 'c1' }),
  ).not.toThrow();
});
