import { ELECTRIC_PROTOCOL_QUERY_PARAMS } from '@electric-sql/client';
import {
  type Env,
  createAppEnv,
  createConsoleLogger,
  memoizeAsync,
} from '@oakoss/shared';
import postgres from 'postgres';
import { z } from 'zod';

const logger = createConsoleLogger({ bindings: { module: 'electric-smoke' } });

export const noteSchema = z.object({
  created_at: z.number().int().nonnegative(),
  id: z.uuid(),
  text: z.string().min(1).max(1000),
});
export type SmokeNoteRow = z.infer<typeof noteSchema>;

let env: Env | null = null;
export const getEnv = () => (env ??= createAppEnv(process.env));

let sql: null | ReturnType<typeof postgres> = null;
const getSql = () => (sql ??= postgres(getEnv().DATABASE_URL));

// Throwaway spike table (telemachus-8zj.8) — real tables arrive with the R1
// Drizzle schema + migrations. created_at is epoch ms (int8); the client
// parses int8 back to a number (see lib/electric-smoke.ts).
export const ensureTable = memoizeAsync(
  async () =>
    getSql()`
      CREATE TABLE IF NOT EXISTS electric_smoke_notes (
        id uuid PRIMARY KEY,
        text text NOT NULL,
        created_at bigint NOT NULL
      )
    `,
);

// The txid must come from the SAME transaction as the insert — Electric
// streams it back with the change, letting the client drop its optimistic
// state exactly when the synced row arrives (the 8zj.8 write-path de-dupe).
export const insertSmokeNote = async (note: SmokeNoteRow) => {
  await ensureTable();
  return getSql().begin(async (tx) => {
    const [row] = await tx<
      [{ txid: string }]
    >`SELECT pg_current_xact_id()::xid::text AS txid`;
    const txid = Number(row.txid);
    // Guarded before the INSERT so a malformed txid aborts the transaction —
    // a committed row reported as failed would duplicate on retry. An
    // unstreamable txid would wedge the client's optimistic state silently.
    if (!Number.isSafeInteger(txid)) {
      throw new TypeError(
        `pg_current_xact_id returned non-integer txid: ${row.txid}`,
      );
    }
    await tx`INSERT INTO electric_smoke_notes ${tx({
      created_at: note.created_at,
      id: note.id,
      text: note.text,
    })}`;
    return txid;
  });
};

// Only Electric protocol params (offset, handle, live, …) pass through;
// shape-definition params (where, columns, replica) are dropped and the table
// is pinned, so clients can't redefine the server-owned shape.
export const buildShapeUrl = (requestUrl: string, electricUrl: string) => {
  const upstream = new URL('/v1/shape', electricUrl);
  const incoming = new URL(requestUrl).searchParams;
  for (const key of ELECTRIC_PROTOCOL_QUERY_PARAMS) {
    const value = incoming.get(key);
    if (value !== null) upstream.searchParams.set(key, value);
  }
  upstream.searchParams.set('table', 'electric_smoke_notes');
  return upstream;
};

export const handleShapeRequest = async (request: Request) => {
  // Misconfiguration and outage get distinct bodies — an env typo presented
  // as outage-shaped sends a responder to restart a healthy database.
  let electricUrl: string;
  try {
    electricUrl = getEnv().ELECTRIC_URL;
  } catch (error) {
    logger.error('env invalid', {
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    return Response.json({ error: 'server misconfigured' }, { status: 503 });
  }
  try {
    await ensureTable();
  } catch (error) {
    logger.error('database unreachable', {
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    return Response.json({ error: 'database unavailable' }, { status: 503 });
  }
  const upstream = buildShapeUrl(request.url, electricUrl);

  let response: Response;
  try {
    response = await fetch(upstream, { signal: request.signal });
  } catch (error) {
    // A client navigating away aborts its live long-poll mid-flight; that's
    // a normal disconnect, not a proxy failure.
    if (request.signal.aborted) {
      return new Response(null, { status: 204 });
    }
    // A distinct 503 lets callers (and the e2e probe) tell "Electric is
    // down" apart from a proxy bug's 500.
    logger.error('electric unreachable', {
      errorMessage: error instanceof Error ? error.message : String(error),
      upstream: upstream.origin,
    });
    return Response.json({ error: 'electric unreachable' }, { status: 503 });
  }

  // 409 is protocol-normal (must-refetch); anything else non-ok deserves a
  // server-side trace — the client's console is useless for 3am debugging.
  if (!response.ok && response.status !== 409) {
    logger.warn('electric responded non-ok', {
      status: response.status,
      upstream: upstream.origin,
    });
  }

  const headers = new Headers(response.headers);
  // fetch already decoded the body; stale encoding headers would make the
  // client mis-read the stream.
  headers.delete('content-encoding');
  headers.delete('content-length');
  return new Response(response.body, { headers, status: response.status });
};

export const handleNoteInsert = async (request: Request) => {
  // Sec-Fetch-Site is the primary cross-site check: browsers set it and a
  // reverse proxy can't distort it. The Origin-vs-request.url fallback only
  // covers clients without it, and is dev-only — behind a proxy request.url
  // carries the internal origin, so it must not survive into the R1 write
  // path (use the configured public origin or a CSRF token there).
  const fetchSite = request.headers.get('sec-fetch-site');
  if (fetchSite === null) {
    const origin = request.headers.get('origin');
    if (origin !== null && origin !== new URL(request.url).origin) {
      return Response.json({ error: 'cross-origin' }, { status: 403 });
    }
  } else if (fetchSite !== 'same-origin' && fetchSite !== 'none') {
    return Response.json({ error: 'cross-origin' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'invalid JSON body' }, { status: 400 });
  }
  const parsed = noteSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: z.treeifyError(parsed.error) },
      { status: 400 },
    );
  }

  try {
    const txid = await insertSmokeNote(parsed.data);
    return Response.json({ txid });
  } catch (error) {
    logger.error('note insert failed', {
      errorMessage: error instanceof Error ? error.message : String(error),
      noteId: parsed.data.id,
    });
    return Response.json({ error: 'persist failed' }, { status: 500 });
  }
};
