import { startPostgres } from './index';

// Workers inherit DATABASE_URL because vitest forks them after globalSetup
// resolves.
export default async function setup() {
  const postgres = await startPostgres();
  process.env.DATABASE_URL = postgres.databaseUrl;
  return async () => {
    await postgres.stop();
  };
}
