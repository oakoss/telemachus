import vitest from '@vitest/eslint-plugin';
import { defineConfig } from 'eslint/config';

import { base } from './base.js';

export const test = defineConfig(base, {
  ...vitest.configs.recommended,
  files: ['**/*.{test,spec}.{ts,tsx}'],
});
