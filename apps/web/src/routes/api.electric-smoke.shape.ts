import { createFileRoute } from '@tanstack/react-router';

import { handleShapeRequest } from '#/lib/server/electric-smoke.ts';

// Shape proxy (telemachus-8zj.8): the browser never talks to Electric
// directly — same-origin keeps connect-src 'self' intact and the Electric
// port off the client.
export const Route = createFileRoute('/api/electric-smoke/shape')({
  server: { handlers: { GET: ({ request }) => handleShapeRequest(request) } },
});
