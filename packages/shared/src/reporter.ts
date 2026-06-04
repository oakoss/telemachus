import type { AppError } from './error';

export type ReportContext = { correlationId?: string };

/** Pluggable error-reporting sink. Default is a no-op; wire a real reporter (self-hosted Sentry/GlitchTip) via config. */
export type ErrorReporter = {
  captureError: (error: AppError | Error, context?: ReportContext) => void;
};

export const noopReporter: ErrorReporter = {
  captureError() {
    // No-op: the boundary always calls this; a real reporter replaces it via config.
  },
};
