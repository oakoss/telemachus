import { expect, test } from 'vitest';

import { config } from './index.js';

// Guards the oxlint→ESLint dedupe (buildFromOxlintConfigFile reading the root
// .oxlintrc.json). A caret bump of eslint-plugin-oxlint, a plugin behavior
// change, or a broken path to the config would silently stop disabling these —
// the empty scaffold's lint suite can't catch it (no code triggers the rules).
test('disables oxlint-covered rules in ESLint, type-aware included', () => {
  const rules = Object.assign(
    {},
    ...config().flatMap((layer) => (layer.rules ? [layer.rules] : [])),
  );

  expect(rules['no-var']).toBe('off');
  expect(rules['@typescript-eslint/no-floating-promises']).toBe('off');
  expect(rules['@typescript-eslint/require-await']).toBe('off');
});
