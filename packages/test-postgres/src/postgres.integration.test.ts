import postgres from 'postgres';
import { afterAll, beforeAll, expect, it } from 'vitest';

let sql: ReturnType<typeof postgres>;

beforeAll(() => {
  const url = process.env.DATABASE_URL;
  if (url === undefined)
    throw new Error('globalSetup did not set DATABASE_URL');
  sql = postgres(url);
});

afterAll(async () => {
  await sql.end();
});

it('stores and retrieves a pgvector embedding against real Postgres', async () => {
  await sql`CREATE EXTENSION IF NOT EXISTS vector`;
  await sql`
    CREATE TABLE embeddings (id int PRIMARY KEY, embedding vector(3))
  `;
  await sql`INSERT INTO embeddings VALUES (1, '[1,2,3]'), (2, '[9,9,9]')`;

  const [nearest] = await sql<{ id: number }[]>`
    SELECT id FROM embeddings ORDER BY embedding <-> '[1,2,3]' LIMIT 1
  `;

  expect(nearest?.id).toBe(1);
});
