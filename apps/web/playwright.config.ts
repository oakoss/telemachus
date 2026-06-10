import { defineConfig, devices } from '@playwright/test';

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
    // The prod server doesn't load .env; default to the compose dev stack so
    // the Electric spec runs out of the box (it skips when the stack is down).
    env: {
      DATABASE_URL:
        process.env.DATABASE_URL ??
        'postgres://telemachus:telemachus@localhost:5432/telemachus',
      ELECTRIC_URL: process.env.ELECTRIC_URL ?? 'http://localhost:3010',
    },
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    url: 'http://localhost:3100',
  },
});
