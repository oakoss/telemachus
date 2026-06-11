import { defineConfig } from 'vitest/config';

// Container pull + boot dominates wall time, so the suite gets generous timeouts.
export default defineConfig({
  test: {
    environment: 'node',
    globalSetup: ['./src/global-setup.ts'],
    hookTimeout: 120_000,
    include: ['src/**/*.integration.test.ts'],
    testTimeout: 60_000,
  },
});
