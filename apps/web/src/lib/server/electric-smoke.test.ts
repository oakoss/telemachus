import { expect, test } from 'vitest';

import { buildShapeUrl, handleNoteInsert } from './electric-smoke';

const ELECTRIC_URL = 'http://localhost:3010';

test('forwards Electric protocol params and pins the table', () => {
  const upstream = buildShapeUrl(
    'http://localhost:3100/api/electric-smoke/shape?offset=-1&handle=h1&live=true',
    ELECTRIC_URL,
  );
  expect(upstream.origin).toBe(ELECTRIC_URL);
  expect(upstream.pathname).toBe('/v1/shape');
  expect(upstream.searchParams.get('offset')).toBe('-1');
  expect(upstream.searchParams.get('handle')).toBe('h1');
  expect(upstream.searchParams.get('live')).toBe('true');
  expect(upstream.searchParams.get('table')).toBe('electric_smoke_notes');
});

test('drops shape-definition params a client tries to smuggle', () => {
  const upstream = buildShapeUrl(
    'http://localhost:3100/api/electric-smoke/shape?offset=-1&table=pg_authid&where=1%3D1&columns=id&replica=full',
    ELECTRIC_URL,
  );
  expect(upstream.searchParams.get('table')).toBe('electric_smoke_notes');
  expect(upstream.searchParams.get('where')).toBeNull();
  expect(upstream.searchParams.get('columns')).toBeNull();
  expect(upstream.searchParams.get('replica')).toBeNull();
});

const postNote = (body: BodyInit, headers: Record<string, string> = {}) =>
  handleNoteInsert(
    new Request('http://localhost:3100/api/electric-smoke/notes', {
      body,
      headers: { 'content-type': 'application/json', ...headers },
      method: 'POST',
    }),
  );

test('rejects a cross-origin POST with 403 (Origin fallback)', async () => {
  const response = await postNote(
    JSON.stringify({ created_at: 1, id: crypto.randomUUID(), text: 'x' }),
    { origin: 'https://evil.example' },
  );
  expect(response.status).toBe(403);
});

test('rejects a cross-site POST with 403 (Sec-Fetch-Site)', async () => {
  const response = await postNote(
    JSON.stringify({ created_at: 1, id: crypto.randomUUID(), text: 'x' }),
    { 'sec-fetch-site': 'cross-site' },
  );
  expect(response.status).toBe(403);
});

test('passes a same-origin browser POST through the gate', async () => {
  // 400 (not 403) proves the origin gate let the request reach parsing.
  const response = await postNote('not json', {
    origin: 'http://localhost:3100',
    'sec-fetch-site': 'same-origin',
  });
  expect(response.status).toBe(400);
});

test('rejects malformed JSON with a distinct 400', async () => {
  const response = await postNote('not json');
  expect(response.status).toBe(400);
  expect(await response.json()).toEqual({ error: 'invalid JSON body' });
});

test('rejects a schema-invalid note with 400 naming the failing fields', async () => {
  const response = await postNote(
    JSON.stringify({ created_at: -5, id: 'not-a-uuid', text: '' }),
  );
  expect(response.status).toBe(400);
  const body = (await response.json()) as {
    error: { properties?: Record<string, unknown> };
  };
  expect(Object.keys(body.error.properties ?? {})).toEqual(
    expect.arrayContaining(['created_at', 'id', 'text']),
  );
});
