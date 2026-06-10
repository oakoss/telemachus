# Routing conventions (`apps/web/src/routes/`)

Adapted from the finance-tracker ruleset (2026-06-10, bd `telemachus-utf`) for this stack: TanStack Start + file-based routing, Zod v4 validation ([ADR-007](../decisions/007-repo-shape-and-toolchain.md)), TanStack DB collections instead of TanStack Query ([ADR-001](../decisions/001-data-layer-tanstack-db-electric-pglite.md)).

## File conventions

- **Flat route files** for simple pages (`sign-in.tsx`); **`route.tsx`** for layout routes inside a folder.
- **`_prefix` folders** are pathless grouping routes (no URL segment); **`$param`** for dynamic segments, **`$`** for splats; a **`-` prefix** excludes a file from routing.
- **Filenames are kebab-case** — lint-enforced project-wide (`unicorn/filename-case`, root `.oxlintrc.json`, with ignores for `$param` and `-excluded` files).

## Route groups

| Group     | Shell                                                       | Guard                                                      |
| --------- | ----------------------------------------------------------- | ---------------------------------------------------------- |
| `_public` | `DefaultShell` (header + `<main>`)                          | none                                                       |
| `_auth`   | centered card (own `<main>`)                                | reverse guard → `/dashboard` at R1 (`telemachus-1or.1`)    |
| `_app`    | `SidebarShell` + `AppHeader` (composed in `_app/route.tsx`) | auth middleware in `beforeLoad` at R1 (`telemachus-1or.1`) |

Shells live in `src/components/` and own the page landmarks — `__root.tsx` deliberately renders bare `{children}` (a root `<main>` would nest inside the shells' `<main>`). The shells are plain placeholder markup until the react-aria/Intent-UI base lands ([ADR-005](../decisions/005-ui-react-aria-intent.md), R1).

## Route files stay thin

- **Server logic never lives inline in route files.** Handlers live in `src/lib/server/{feature}.ts` as plain, unit-testable functions; the route file is a one-line delegator (see `api.electric-smoke.*.ts`). At R1+, domain logic moves behind `packages/core` per [ADR-008](../decisions/008-architecture-and-topology.md) — the route/BFF layer stays a delegator either way.
- **Feature UI lives in `src/components/`** (module folders when a real module structure emerges); route files compose.
- **Loaders preload TanStack DB collections** — `await collection.preload()` under `ssr: false` (TanStack DB is client-only; the loader runs in the browser). Guard against a sync backend that never marks ready — race `preload()` with a deadline that rejects into the route's `errorComponent` (see `_public/electric-smoke.tsx`). There is no `queryClient.ensureQueryData` here; that's the finance-tracker (TanStack Query) equivalent.

## Route option ordering

Lint-enforced by `@tanstack/router/create-route-property-order` (the `tanstack` layer in `@oakoss/eslint`) — **the rule is the source of truth**; the gist of its order: `params`/`validateSearch` → `search` → `loaderDeps`/`ssr` → `context` → `beforeLoad` → `loader` → lifecycle/head (`onEnter`, `head`, `scripts`, …). Don't fight it by hand — `eslint --fix` reorders.

(`component`/`errorComponent` are unordered render props; keep them last by convention.)

## URL-driven state

- **Prefer search params over `useState`** for anything that should survive refresh or be shareable: filters, pagination, sorting, modal-open state (`?modal=create-x`, `?edit=<id>`), active tabs. Ephemeral drafts (e.g. an in-progress text input that becomes a row on submit) stay in component state.
- **Validate with `validateSearch` + Zod v4** — Zod schemas pass directly (Standard Schema; no adapter). Read via `Route.useSearch()`.
- **Debounce text-input writes to the URL.** The chosen tool is `useDebouncedCallback` from `@tanstack/react-pacer` — the dependency is added with its first real consumer, not before (`knip` fails the gate on unused deps).
