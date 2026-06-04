import { expect, test } from 'vitest';

import {
  andThen,
  err,
  isErr,
  isOk,
  map,
  mapErr,
  ok,
  type Result,
  unwrapOr,
} from './result';

// A genuine union type (not a narrowed literal), matching real call sites.
const asResult = (good: boolean): Result<number, string> =>
  good ? ok(2) : err('e');

test('ok / err construct and narrow', () => {
  expect(ok(1)).toEqual({ ok: true, value: 1 });
  expect(err('boom')).toEqual({ error: 'boom', ok: false });
  expect(isOk(ok(1))).toBe(true);
  expect(isOk(err('boom'))).toBe(false);
  expect(isErr(err('boom'))).toBe(true);
  expect(isErr(ok(1))).toBe(false);
});

test('map / mapErr only touch the matching side', () => {
  expect(map(asResult(true), (n) => n + 1)).toEqual(ok(3));
  expect(map(asResult(false), (n) => n + 1)).toEqual(err('e'));
  expect(mapErr(asResult(false), (s) => s.toUpperCase())).toEqual(err('E'));
  expect(mapErr(asResult(true), (s) => s)).toEqual(ok(2));
});

test('andThen chains, unwrapOr falls back', () => {
  expect(andThen(asResult(true), (n) => ok(n * 2))).toEqual(ok(4));
  expect(andThen(asResult(false), (n) => ok(n))).toEqual(err('e'));
  expect(unwrapOr(asResult(true), 0)).toBe(2);
  expect(unwrapOr(asResult(false), 0)).toBe(0);
});
