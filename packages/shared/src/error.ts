export type ErrorCategory =
  | 'auth'
  | 'conflict'
  | 'external'
  | 'internal'
  | 'notFound'
  | 'validation';

export type AppErrorParamValue = boolean | number | string | null;

export type AppErrorParams = Record<
  string,
  AppErrorParamValue | readonly AppErrorParamValue[]
>;

/** Safe to sync / persist / replay — never carries raw `cause` or stack. */
export type SerializedAppError = {
  category: ErrorCategory;
  code: string;
  correlationId?: string;
  params?: AppErrorParams;
};

export type AppErrorOptions = {
  category?: ErrorCategory;
  cause?: unknown;
  correlationId?: string;
  params?: AppErrorParams;
};

/**
 * Usable in both `throw` and `Result.err`. Carries a stable `code` (the i18n
 * key + log/alert identifier) and structured `params`; user-facing strings are
 * resolved at the UI boundary, never here.
 *
 * The live instance retains `cause` + stack for local logging; only `toJSON()`
 * (the synced/persisted/replayed form) strips them. `params` is serialized
 * verbatim — keep it redaction-safe.
 */
export class AppError extends Error {
  readonly category: ErrorCategory;
  readonly code: string;
  readonly correlationId: string | undefined;
  readonly params: AppErrorParams | undefined;

  constructor(code: string, options: AppErrorOptions = {}) {
    super(
      code,
      options.cause === undefined ? undefined : { cause: options.cause },
    );
    this.name = 'AppError';
    this.code = code;
    this.category = options.category ?? 'internal';
    this.correlationId = options.correlationId;
    this.params = options.params;
  }

  toJSON(): SerializedAppError {
    return {
      category: this.category,
      code: this.code,
      ...(this.correlationId === undefined
        ? {}
        : { correlationId: this.correlationId }),
      ...(this.params === undefined ? {} : { params: this.params }),
    };
  }
}

export const appError = (code: string, options?: AppErrorOptions): AppError =>
  new AppError(code, options);
