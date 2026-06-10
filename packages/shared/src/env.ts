import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

import { appError } from './error';
import { LOG_LEVELS } from './logger';

export type EnvSource = Record<string, string | undefined>;

/**
 * Validate + type the environment. Vars are server-side for now; `client` vars
 * (with `clientPrefix: 'VITE_'`) — and moving the universal ones to `shared` —
 * land at R1, when t3-env starts throwing if a server var is read on the client.
 */
export const createAppEnv = (runtimeEnv: EnvSource) =>
  createEnv({
    emptyStringAsUndefined: true,
    onValidationError: (issues) => {
      throw appError('env.invalid', {
        params: {
          issues: issues.map((issue) => {
            const path = (issue.path ?? [])
              .map((seg) =>
                typeof seg === 'object' ? String(seg.key) : String(seg),
              )
              .join('.');
            return `${path}: ${issue.message}`;
          }),
        },
      });
    },
    runtimeEnv,
    server: {
      // No default: a connection string must be explicit, so dev creds can't
      // silently become a deployment's.
      DATABASE_URL: z.url({
        protocol: /^postgres(ql)?$/,
        hostname: /.+/,
        error: 'must be a postgres:// connection string',
      }),
      // Dev/test default matches the compose `electric` profile's loopback
      // port. Production requires it explicitly — a loopback fallback there
      // would boot clean and fail at the first shape request instead.
      ELECTRIC_URL:
        runtimeEnv.NODE_ENV === 'production'
          ? z.url({ protocol: /^https?$/, hostname: /.+/ })
          : z
              .url({ protocol: /^https?$/, hostname: /.+/ })
              .default('http://localhost:3010'),
      LOG_LEVEL: z.enum(LOG_LEVELS).default('info'),
      NODE_ENV: z
        .enum(['development', 'production', 'test'])
        .default('development'),
    },
  });

export type Env = ReturnType<typeof createAppEnv>;
