// Ascending severity; keep in sync with LEVEL_RANK.
export const LOG_LEVELS = [
  'trace',
  'debug',
  'info',
  'warn',
  'error',
  'fatal',
] as const;
export type LogLevel = (typeof LOG_LEVELS)[number];

/** Structured log fields. Values should be JSON-serializable; non-plain objects (Date, Map, Error) flatten or drop. */
export type LogFields = Record<string, unknown>;

export type Logger = {
  /** A logger that adds `bindings` (e.g. a correlationId) to every line. */
  child: (bindings: LogFields) => Logger;
  debug: (message: string, fields?: LogFields) => void;
  error: (message: string, fields?: LogFields) => void;
  fatal: (message: string, fields?: LogFields) => void;
  info: (message: string, fields?: LogFields) => void;
  trace: (message: string, fields?: LogFields) => void;
  warn: (message: string, fields?: LogFields) => void;
};

const LEVEL_RANK: Record<LogLevel, number> = {
  debug: 20,
  error: 50,
  fatal: 60,
  info: 30,
  trace: 10,
  warn: 40,
};

const REDACTED = '[REDACTED]';

const DEFAULT_REDACT_KEYS: readonly string[] = [
  'apikey',
  'authorization',
  'cookie',
  'password',
  'secret',
  'token',
];

/** Recursively replace values under sensitive keys (matched case-insensitively) with a placeholder. */
export const redact = (
  value: unknown,
  keys: readonly string[] = DEFAULT_REDACT_KEYS,
): unknown => {
  if (Array.isArray(value)) {
    return value.map((item) => redact(item, keys));
  }
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) =>
        keys.some((k) => k.toLowerCase() === key.toLowerCase())
          ? [key, REDACTED]
          : [key, redact(item, keys)],
      ),
    );
  }
  return value;
};

type ConsoleLike = { log: (line: string) => void };

export type ConsoleLoggerOptions = {
  bindings?: LogFields;
  level?: LogLevel;
  redactKeys?: readonly string[];
  write?: (line: string) => void;
};

/**
 * Isomorphic JSON-line logger with level filtering, correlation bindings, and
 * key redaction. The Pino binding (server) implements the same `Logger`.
 */
export const createConsoleLogger = (
  options: ConsoleLoggerOptions = {},
): Logger => {
  const level = options.level ?? 'info';
  const bindings = options.bindings ?? {};
  const redactKeys = options.redactKeys ?? DEFAULT_REDACT_KEYS;
  const write =
    options.write ??
    ((line: string) => {
      (globalThis as { console?: ConsoleLike }).console?.log(line);
    });
  const threshold = LEVEL_RANK[level];

  const log = (
    msgLevel: LogLevel,
    message: string,
    fields?: LogFields,
  ): void => {
    if (LEVEL_RANK[msgLevel] < threshold) {
      return;
    }
    let line: string;
    try {
      // Reserved keys overlay last so caller fields can't shadow level/message.
      line = JSON.stringify(
        redact(
          { ...bindings, ...fields, level: msgLevel, message },
          redactKeys,
        ),
      );
    } catch {
      line = JSON.stringify({
        level: msgLevel,
        logError: 'unserializable log fields',
        message,
      });
    }
    write(line);
  };

  return {
    child: (childBindings) =>
      createConsoleLogger({
        ...options,
        bindings: { ...bindings, ...childBindings },
      }),
    debug: (message, fields) => log('debug', message, fields),
    error: (message, fields) => log('error', message, fields),
    fatal: (message, fields) => log('fatal', message, fields),
    info: (message, fields) => log('info', message, fields),
    trace: (message, fields) => log('trace', message, fields),
    warn: (message, fields) => log('warn', message, fields),
  };
};

const noop = (): void => {
  // no-op sink for tests
};

export const silentLogger: Logger = {
  child: () => silentLogger,
  debug: noop,
  error: noop,
  fatal: noop,
  info: noop,
  trace: noop,
  warn: noop,
};
