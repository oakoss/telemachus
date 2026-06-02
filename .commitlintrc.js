import { defineConfig } from 'czg';

export default defineConfig({
  extends: ['@commitlint/config-conventional'],
  prompt: {
    alias: {
      ci: 'ci: update workflows',
      deps: 'chore(deps): bump dependencies',
      docs: 'docs: update docs',
      tokens: 'feat(tokens): update design tokens',
      a11y: 'fix(a11y): improve accessibility',
    },
    allowCustomScopes: true,
    allowEmptyScopes: true,
    scopes: [
      'tokens',
      'primitives',
      'recipes',
      'registry',
      'mcp-server',
      'docs-site',
      'a11y',
      'i18n',
      'ci',
      'deps',
      'tooling',
      'docs',
    ],
    skipQuestions: ['breaking', 'footer', 'issues'],
  },
  rules: {
    'body-max-line-length': [0, 'always'],
    'footer-max-line-length': [0, 'always'],
    'header-max-length': [2, 'always', 200],
  },
});
