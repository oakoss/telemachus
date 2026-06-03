import js from '@eslint/js';
import oxlint from 'eslint-plugin-oxlint';
import { defineConfig, globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';

// Non-type-checked base. Type-aware linting is oxlint-first; the ESLint typed
// layer is added per-package where projectService/tsconfig context exists.
// oxlint config goes last so it disables rules oxlint already covers.
export const base = defineConfig(
  globalIgnores([
    '**/dist/**',
    '**/build/**',
    '**/coverage/**',
    '**/.output/**',
    '**/*.gen.ts',
  ]),
  js.configs.recommended,
  tseslint.configs.recommended,
  oxlint.configs['flat/recommended'],
);
