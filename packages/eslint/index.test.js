import { expect, test } from 'vitest';

import { config, typeChecked } from './index.js';

function mergedRules(...layers) {
  return Object.assign(
    {},
    ...config(...layers).flatMap((layer) => (layer.rules ? [layer.rules] : [])),
  );
}

// Guards the oxlint→ESLint dedupe (buildFromOxlintConfigFile reading the root
// .oxlintrc.json). A caret bump of eslint-plugin-oxlint, a plugin behavior
// change, or a broken path to the config would silently stop disabling these —
// the empty scaffold's lint suite can't catch it (no code triggers the rules).
test('disables oxlint-covered rules in ESLint, type-aware included', () => {
  const rules = mergedRules();

  expect(rules['no-var']).toBe('off');
  expect(rules['@typescript-eslint/no-floating-promises']).toBe('off');
  expect(rules['@typescript-eslint/require-await']).toBe('off');
});

// The dedupe only disables rules oxlint *enables*; the typeChecked layer must
// mirror oxlint's *disables* or ESLint re-enforces what oxlint allows.
test('mirrors oxlint-disabled type-aware rules in the typeChecked layer', () => {
  const rules = mergedRules(typeChecked);

  expect(rules['@typescript-eslint/no-explicit-any']).toBe('off');
  expect(rules['@typescript-eslint/no-unsafe-assignment']).toBe('off');
});
