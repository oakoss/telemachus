import js from '@eslint/js';
import vitest from '@vitest/eslint-plugin';
import oxlint from 'eslint-plugin-oxlint';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import path from 'node:path';
import tseslint from 'typescript-eslint';

const base = defineConfig(
  globalIgnores([
    '**/dist/**',
    '**/build/**',
    '**/coverage/**',
    '**/.output/**',
    '**/*.gen.ts',
  ]),
  js.configs.recommended,
  tseslint.configs.recommended,
);

// Read from the real root .oxlintrc.json so the dedupe tracks exactly what we
// enable. typeAware:true also drops the type-aware rules oxlint runs on
// pre-push/CI, leaving ESLint only the rules oxlint doesn't cover.
const oxlintDisable = oxlint.buildFromOxlintConfigFile(
  path.join(import.meta.dirname, '../../.oxlintrc.json'),
  { typeAware: true },
);

export const node = defineConfig({
  languageOptions: { globals: globals.node },
});

export const test = defineConfig({
  ...vitest.configs.recommended,
  files: ['**/*.{test,spec}.{ts,tsx}'],
});

// projectService auto-detects each package's tsconfig; root config files
// (e.g. vitest.config.ts) fall outside src/ and stay on the base parser.
export const typeChecked = defineConfig({
  files: ['**/src/**/*.{ts,tsx}'],
  languageOptions: { parserOptions: { projectService: true } },
  extends: [
    tseslint.configs.recommendedTypeChecked,
    tseslint.configs.stylisticTypeChecked,
  ],
  // The oxlint dedupe only disables rules oxlint *enables*. These are rules
  // oxlint intentionally *disables*, so mirror them here or ESLint re-enforces
  // what oxlint allows (e.g. it would flag `any` that oxlint permits).
  rules: {
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unnecessary-condition': 'off',
    '@typescript-eslint/no-unsafe-argument': 'off',
    '@typescript-eslint/no-unsafe-assignment': 'off',
    '@typescript-eslint/no-unsafe-call': 'off',
    '@typescript-eslint/no-unsafe-member-access': 'off',
    '@typescript-eslint/no-unsafe-return': 'off',
    '@typescript-eslint/only-throw-error': 'off',
    '@typescript-eslint/restrict-template-expressions': 'off',
  },
});

// Enforces base-first / oxlint-last ordering so consumers can't wire it wrong.
// oxlint-last disables ESLint rules that oxlint already covers.
export function config(...layers) {
  return defineConfig(base, ...layers, oxlintDisable);
}
