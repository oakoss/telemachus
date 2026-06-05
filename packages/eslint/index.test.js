import { expect, test } from 'vitest';

import {
  config,
  react,
  sort,
  tailwind,
  tanstack,
  typeChecked,
} from './index.js';

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

// The react/tanstack/tailwind layers carry plugins oxlint has no rules for; the
// placeholder app can't trigger them, so guard that they engage.
test('react/tanstack/tailwind layers contribute their plugin rules', () => {
  const reactRules = mergedRules(react);
  // a recommended-typescript rule (not an opt-out) — proves the plugin loaded
  expect(reactRules['@eslint-react/no-access-state-in-setstate']).toBeDefined();
  expect(reactRules['@eslint-react/no-context-provider']).toBe('off');

  expect(
    mergedRules(tanstack)['@tanstack/router/create-route-property-order'],
  ).toBe('warn');

  expect(
    mergedRules(tailwind('./x.css'))['better-tailwindcss/no-duplicate-classes'],
  ).toBe('warn');

  const tw = config(tailwind('./MARKER.css'));
  const settings = tw.find((l) => l.settings?.['better-tailwindcss'])?.settings;
  expect(settings?.['better-tailwindcss'].entryPoint).toBe('./MARKER.css');
});

// The empty scaffold can't trigger sort rules, so prove the plugin resolved —
// inert rule strings exist even when the plugin fails to load.
test('sort layer wires the perfectionist plugin', () => {
  const plugin = config(sort).find((l) => l.plugins?.perfectionist)?.plugins
    .perfectionist;
  expect(plugin?.rules?.['sort-jsx-props']).toBeDefined();
  expect(plugin?.rules?.['sort-union-types']).toBeDefined();
  expect(plugin?.rules?.['sort-objects']).toBeDefined();

  const [, opts] = mergedRules(sort)['perfectionist/sort-jsx-props'];
  expect(opts.groups).toContain('callback');
  expect(opts.customGroups).toContainEqual(
    expect.objectContaining({
      groupName: 'callback',
      elementNamePattern: '^on.+',
    }),
  );
});
