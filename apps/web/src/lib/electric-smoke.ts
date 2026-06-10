import { createElectricPersistedCollection } from '@oakoss/db';
import {
  type Uuid,
  createConsoleLogger,
  createIdGenerator,
  memoizeAsync,
  systemClock,
} from '@oakoss/shared';
import { z } from 'zod';

import type { SmokeNoteRow } from './server/electric-smoke.ts';

const logger = createConsoleLogger({ bindings: { module: 'electric-smoke' } });

const insertResponseSchema = z.object({ txid: z.number().int() });

// Derived from the server row (type-only import — erased at build) so the
// wire shape has one definition; only the id brand is client-side.
export type ElectricSmokeNote = { id: Uuid<'electric-smoke-note'> } & Omit<
  SmokeNoteRow,
  'id'
>;

export const newElectricSmokeNoteId =
  createIdGenerator<'electric-smoke-note'>(systemClock);

export const getElectricSmokeNotes = memoizeAsync(() =>
  createElectricPersistedCollection<ElectricSmokeNote>({
    getKey: (note) => note.id,
    id: 'electric-smoke-notes',
    onInsert: async ({ transaction }) => {
      // Posting only mutations[0] from a batched transaction would silently
      // drop the rest after the txid clears optimistic state.
      if (transaction.mutations.length !== 1) {
        throw new Error(
          `expected exactly one mutation, got ${transaction.mutations.length}`,
        );
      }
      const [mutation] = transaction.mutations;
      const response = await fetch('/api/electric-smoke/notes', {
        body: JSON.stringify(mutation.modified),
        headers: { 'content-type': 'application/json' },
        method: 'POST',
      });
      if (!response.ok) {
        const detail = await response.text().catch(() => '');
        throw new Error(
          `write API failed: ${response.status}${detail ? ` — ${detail}` : ''}`,
        );
      }
      // Validated, not cast: a malformed txid would resolve the insert with
      // an id Electric never streams, wedging the optimistic row silently.
      const { txid } = insertResponseSchema.parse(await response.json());
      return { txid };
    },
    shapeOptions: {
      // Outage-shaped errors (5xx/429/network) never reach this handler — the
      // client retries them internally with unbounded backoff and resumes on
      // recovery; outage observability is the proxy's server-side logs. This
      // fires only for terminal errors (4xx config bugs), which would
      // otherwise stop the stream with nothing observing it.
      onError: (error) => {
        logger.error('shape stream error', {
          errorMessage: error instanceof Error ? error.message : String(error),
        });
      },
      // Electric streams int8 as BigInt by default; created_at is epoch ms,
      // safely inside Number range, and the row type says number.
      parser: { int8: Number },
      // ShapeStream constructs `new URL(url)` with no base, so the proxy path
      // must be absolute; browser-only is fine under the route's ssr: false.
      url: new URL(
        '/api/electric-smoke/shape',
        globalThis.location.origin,
      ).toString(),
    },
  }),
);
