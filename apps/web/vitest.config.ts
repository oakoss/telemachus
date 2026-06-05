import { defineConfig } from 'vitest/config';

export default defineConfig({
  // passWithNoTests: the scaffold has no tests yet; remove it once the first
  // test lands so an empty collection fails CI instead of silently passing.
  test: { environment: 'jsdom', passWithNoTests: true },
});
