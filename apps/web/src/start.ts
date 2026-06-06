import {
  createCsrfMiddleware,
  createMiddleware,
  createStart,
} from '@tanstack/react-start';
import { setResponseHeader } from '@tanstack/react-start/server';

import { buildCsp } from '#/lib/csp.ts';

// Prod-only: Vite dev serves inline scripts + eval (HMR) that a strict policy
// blocks. The e2e smoke runs the prod nitro build, so it stays fully gated.
const cspMiddleware = createMiddleware().server(({ next }) => {
  if (import.meta.env.DEV) return next();

  const nonce = crypto.randomUUID();
  const header = buildCsp(nonce);
  // Singular setResponseHeader — the plural is unreliable in global middleware
  // (TanStack/router#5407). Nonce travels via context; Start stamps every script.
  setResponseHeader(header.name, header.value);
  return next({ context: { nonce } });
});

// Defining start.ts disables Start's auto-installed CSRF guard; re-add it scoped
// to server functions only. Applying CSRF to every request would 403 legitimate
// top-level navigations (search/email links send Sec-Fetch-Site: cross-site).
const csrfMiddleware = createCsrfMiddleware({
  filter: (ctx) => ctx.handlerType === 'serverFn',
});

export const startInstance = createStart(() => ({
  requestMiddleware: [cspMiddleware, csrfMiddleware],
}));
