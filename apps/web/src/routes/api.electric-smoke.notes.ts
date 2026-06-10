import { createFileRoute } from '@tanstack/react-router';

import { handleNoteInsert } from '#/lib/server/electric-smoke.ts';

// Write API (telemachus-8zj.8): writes go through Postgres, never directly
// into Electric — Electric is read-path only (ADR-001).
export const Route = createFileRoute('/api/electric-smoke/notes')({
  server: { handlers: { POST: ({ request }) => handleNoteInsert(request) } },
});
