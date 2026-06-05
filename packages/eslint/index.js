import eslintReact from '@eslint-react/eslint-plugin';
import js from '@eslint/js';
import pluginRouter from '@tanstack/eslint-plugin-router';
import vitest from '@vitest/eslint-plugin';
import betterTailwind from 'eslint-plugin-better-tailwindcss';
import oxlint from 'eslint-plugin-oxlint';
import perfectionist from 'eslint-plugin-perfectionist';
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
// enable. typeAware:true also drops the type-aware rules oxlint runs, leaving
// ESLint only the rules oxlint doesn't cover.
const oxlintDisable = oxlint.buildFromOxlintConfigFile(
  path.join(import.meta.dirname, '../../.oxlintrc.json'),
  { typeAware: true },
);

export const node = defineConfig({
  languageOptions: { globals: globals.node },
});

export const browser = defineConfig({
  languageOptions: { globals: globals.browser },
});

export const test = defineConfig({
  ...vitest.configs.recommended,
  files: ['**/*.{test,spec}.{ts,tsx}'],
});

// oxlint owns react/jsx-a11y/hooks natively; this layer adds @eslint-react's
// semantic rules on top. The dedupe doesn't touch @eslint-react/*, so the
// opt-outs (per telemachus-8zj.10) are set manually.
export const react = defineConfig({
  files: ['**/*.{jsx,tsx}'],
  extends: [eslintReact.configs['recommended-typescript']],
  rules: {
    '@eslint-react/no-context-provider': 'off',
    '@eslint-react/no-nested-component-definitions': 'off',
    '@eslint-react/set-state-in-effect': 'off',
  },
});

export const tanstack = defineConfig(pluginRouter.configs['flat/recommended']);

// Each app passes its Tailwind entry CSS, resolved from the app cwd.
export function tailwind(entryPoint) {
  return defineConfig({
    files: ['**/*.{jsx,tsx}'],
    plugins: { 'better-tailwindcss': betterTailwind },
    settings: { 'better-tailwindcss': { entryPoint } },
    rules: {
      'better-tailwindcss/enforce-shorthand-classes': 'warn',
      'better-tailwindcss/no-deprecated-classes': 'warn',
      'better-tailwindcss/no-duplicate-classes': 'warn',
    },
  });
}

// perfectionist owns sorting oxfmt/oxlint don't cover — imports stay with
// oxfmt. jsx-props per telemachus-8zj.10; sort-objects scoped to
// config/component/story files because object-key order is often semantic.
export const sort = defineConfig([
  {
    files: ['**/*.{ts,tsx}'],
    plugins: { perfectionist },
    rules: {
      'perfectionist/sort-intersection-types': [
        'error',
        { type: 'alphabetical' },
      ],
      'perfectionist/sort-interfaces': ['error', { type: 'alphabetical' }],
      'perfectionist/sort-object-types': ['error', { type: 'alphabetical' }],
      'perfectionist/sort-union-types': ['error', { type: 'alphabetical' }],
    },
  },
  {
    files: ['**/*.{jsx,tsx}'],
    plugins: { perfectionist },
    rules: {
      'perfectionist/sort-jsx-props': [
        'error',
        {
          type: 'alphabetical',
          groups: ['shorthand-prop', 'unknown', 'callback'],
          customGroups: [
            { groupName: 'callback', elementNamePattern: '^on.+' },
          ],
        },
      ],
    },
  },
  {
    files: [
      '**/*.config.{js,ts}',
      '**/*.stories.tsx',
      '**/src/components/**/*.{ts,tsx}',
    ],
    plugins: { perfectionist },
    rules: {
      'perfectionist/sort-objects': ['error', { type: 'alphabetical' }],
    },
  },
]);

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
