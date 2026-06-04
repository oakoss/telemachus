import { v7 } from 'uuid';

import type { Clock } from './clock';

import { type AppError, appError } from './error';
import { type Result, err, ok } from './result';

/** A UUIDv7 branded by entity (e.g. `Uuid<'conversation'>`), stored as a plain `uuid`. */
export type Uuid<Brand extends string = string> = string & {
  readonly __uuidBrand: Brand;
};

/** Returns 16 random bytes — inject a deterministic one for tests/replay. */
export type RngFn = () => Uint8Array;

export type IdGenerator<Brand extends string = string> = () => Uuid<Brand>;

const MAX_UUID_V7_MS = 0xff_ff_ff_ff_ff_ff; // UUIDv7's timestamp is a 48-bit ms field

const UUID_V7_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Brand a string already known to be a valid uuid — trusted internal boundaries only, no validation. */
export const unsafeUuid = <Brand extends string = string>(
  value: string,
): Uuid<Brand> => value as Uuid<Brand>;

/** Validate + brand an externally-sourced string (DB row, sync payload, URL param). */
export const asUuid = <Brand extends string = string>(
  value: string,
): Result<Uuid<Brand>, AppError> =>
  UUID_V7_RE.test(value)
    ? ok(unsafeUuid<Brand>(value))
    : err(
        appError('id.invalidUuid', {
          category: 'validation',
          params: { value },
        }),
      );

/**
 * A UUIDv7 generator bound to an injected clock (and optional rng), so id
 * generation stays deterministic under test and faithful replay. Exact ordering
 * lives in explicit `seq` fields, never the id — same-millisecond ids are not
 * mutually ordered (and can't be across devices anyway).
 */
export const createIdGenerator = <Brand extends string = string>(
  clock: Clock,
  rng?: RngFn,
): IdGenerator<Brand> => {
  return () => {
    const msecs = clock.now();
    if (!Number.isInteger(msecs) || msecs < 0 || msecs > MAX_UUID_V7_MS) {
      throw appError('id.invalidClock', { params: { msecs } });
    }
    return unsafeUuid<Brand>(
      v7({ msecs, ...(rng === undefined ? {} : { rng }) }),
    );
  };
};
