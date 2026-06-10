/**
 * Memoize an async factory: concurrent callers share the one in-flight
 * promise, and a rejected attempt is un-cached so the next call retries
 * instead of wedging every future caller on the stale failure.
 */
export const memoizeAsync = <T>(
  factory: () => Promise<T>,
): (() => Promise<T>) => {
  let cached: null | Promise<T> = null;
  return () =>
    (cached ??= factory().catch((error: unknown) => {
      cached = null;
      throw error;
    }));
};
