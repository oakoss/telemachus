export type Clock = { now: () => number };

export const systemClock: Clock = { now: () => Date.now() };

export type TestClock = Clock & {
  advance: (deltaMs: number) => void;
  set: (ms: number) => void;
};

/** For tests and deterministic replay. */
export function fixedClock(initialMs = 0): TestClock {
  let current = initialMs;
  return {
    advance: (deltaMs) => {
      current += deltaMs;
    },
    now: () => current,
    set: (ms) => {
      current = ms;
    },
  };
}
