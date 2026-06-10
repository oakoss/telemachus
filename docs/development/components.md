# Component conventions

Adapted from the finance-tracker component guides (2026-06-10, bd `telemachus-zhq`) for this stack: react-aria-components + Intent UI copy-paste with Tailwind v4 + tailwind-variants ([ADR-005](../decisions/005-ui-react-aria-intent.md)). The Intent UI base lands at R1; these conventions govern what we copy in and what we build on top. Components live in `apps/web/src/components/` until a second surface forces a `packages/ui` extraction ([scaffold](../specs/scaffold.md)).

## Composition

- Prefer small, composable pieces over monolithic components; use compound components for multi-part UI.
- Keep layout scaffolding in shells/blocks (`DefaultShell`, `SidebarShell`), not in `ui` primitives.
- Extract reusable controls (table headers, pagination) only after they are actually reused — not speculatively.

### Naming for compound parts

Root container: `Root` (or the component name). Interactive element: `Trigger`. Content region: `Content`. Structural parts: `Header`, `Body`, `Footer`.

```tsx
<Menu.Root>
  <Menu.Trigger>Open</Menu.Trigger>
  <Menu.Content>
    <Menu.Item>One</Menu.Item>
  </Menu.Content>
</Menu.Root>
```

## data-attributes

Expose internal state and stable part names for styling — react-aria-components already emits `data-*` state attributes (`data-hovered`, `data-selected`, …); follow the same convention for our own parts:

- `data-slot` — stable part names, kebab-case (`data-slot="trigger"`). Don't encode styling intent in slot names.
- `data-state` — interactive state (`open`, `closed`, `active`, `loading`) where react-aria doesn't already provide one.

## State patterns

- Support controlled and uncontrolled usage when feasible: controlled takes `value`/`open` + `onValueChange`/`onOpenChange`; uncontrolled takes `defaultValue`/`defaultOpen`. (react-aria-components follows exactly this split.)
- Root components own shared state in compound patterns.

## Accessibility baseline

- Semantic elements first (`button`, `label`, `nav`, `ul/li`); react-aria-components supplies the ARIA wiring — don't fight it with redundant roles.
- Keyboard navigation works by default; visible focus indicators always.
- Icon-only controls get accessible names.
- `aria-invalid` on invalid inputs, `data-invalid` on their wrappers.
- One `<main>` per page, owned by the route-group shells ([routing](routing.md)) — enforced by `e2e/shells.e2e.ts`.

## Reduced motion

When animations land with the Intent UI base: one global `@media (prefers-reduced-motion: reduce)` rule in `globals.css` zeroing `transition-duration`/`animation-duration`, instead of per-component `motion-reduce:` overrides.

## Do not

- Divs acting like buttons.
- Placeholder-only labels.
- Empty links or buttons.
