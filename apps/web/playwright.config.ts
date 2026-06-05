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
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    url: 'http://localhost:3100',
  },
});
