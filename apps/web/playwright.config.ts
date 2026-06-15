import { defineConfig, devices } from '@playwright/test';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Load the gitignored root .env so the e2e webServer honors local overrides
// (e.g. POSTGRES_PORT=5433 when another app owns 5432). loadEnvFile leaves
// already-set vars untouched, so an explicit shell/CI override still wins.
const rootEnv = fileURLToPath(new URL('../../.env', import.meta.url));
if (existsSync(rootEnv)) process.loadEnvFile(rootEnv);

const postgresPort = process.env.POSTGRES_PORT ?? '5432';

export default defineConfig({
  forbidOnly: !!process.env.CI,
  fullyParallel: true,
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  reporter: process.env.CI ? 'github' : 'list',
  retries: process.env.CI ? 2 : 0,
  testDir: './e2e',
  testMatch: '**/*.e2e.ts',
  use: { baseURL: 'http://localhost:3100', trace: 'on-first-retry' },
  // Dedicated port so reuseExistingServer can't accidentally pick up a dev server.
  webServer: {
    command: 'pnpm build && PORT=3100 node .output/server/index.mjs',
    // The prod server doesn't load .env itself; pass the connection through
    // here, sourced from the root .env above (port follows POSTGRES_PORT) so
    // the Electric spec runs out of the box (it skips when the stack is down).
    env: {
      DATABASE_URL:
        process.env.DATABASE_URL ??
        `postgres://telemachus:telemachus@localhost:${postgresPort}/telemachus`,
      ELECTRIC_URL: process.env.ELECTRIC_URL ?? 'http://localhost:3010',
    },
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    url: 'http://localhost:3100',
  },
});
