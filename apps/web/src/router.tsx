import { createRouter as createTanStackRouter } from '@tanstack/react-router';
import {
  createIsomorphicFn,
  getGlobalStartContext,
} from '@tanstack/react-start';

import { CSP_NONCE_META } from '#/lib/csp.ts';
import { routeTree } from '#/routeTree.gen.ts';

// getGlobalStartContext() throws outside a request scope (e.g. Start resolving a
// serverFn redirect after the middleware context ends).
const getCspNonce = createIsomorphicFn()
  .server(() => {
    try {
      return getGlobalStartContext()?.nonce;
    } catch {
      // Non-render path — no nonce needed.
    }
  })
  .client(
    () =>
      document
        .querySelector(`meta[property="${CSP_NONCE_META}"]`)
        ?.getAttribute('content') ?? undefined,
  );

export function getRouter() {
  const nonce = getCspNonce();
  const router = createTanStackRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
    ...(nonce === undefined ? {} : { ssr: { nonce } }),
  });

  return router;
}

declare module '@tanstack/react-router' {
  // Module augmentation requires an interface, not a type alias.
  // oxlint-disable-next-line typescript/consistent-type-definitions
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
