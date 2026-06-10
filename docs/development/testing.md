# Testing conventions

Adapted from the finance-tracker testing guide (2026-06-10, bd `telemachus-zhq`) for this stack: Vitest + Playwright ([ADR-007](../decisions/007-repo-shape-and-toolchain.md)), real Postgres via Testcontainers for server integration tests ([ADR-003](../decisions/003-orm-drizzle.md)), Zod v4. CI policy lives in [`../specs/ci-cd-release.md`](../specs/ci-cd-release.md) (wiring tracked in bd `telemachus-8zj.7`).

## Commands

```bash
pnpm test                  # all unit tests, per package via Turbo
pnpm -F @oakoss/web test:e2e   # Playwright against the prod nitro build (port 3100)
```

The Electric e2e specs need the compose stack (`docker compose --profile electric up -d`) and skip cleanly without it; `REQUIRE_ELECTRIC=1` turns that skip into a failure for environments that promise the stack.

## Test tiers

| Tier            | Scope                                                                                                           | Where                                              |
| --------------- | --------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| **Unit**        | Pure functions and module contracts; no server, DB, or browser                                                  | `src/**/*.test.ts` next to the source, per package |
| **Integration** | Server services + Drizzle schema against **real Postgres** (Testcontainers, throwaway container per suite — R1) | `*.integration.test.ts` (lands with the R1 schema) |
| **E2E**         | User-visible behavior through the real app build                                                                | `apps/web/e2e/*.e2e.ts`                            |

Server handlers (route files, BFF wrappers) stay thin delegators — test them via e2e, not integration; the logic they delegate to gets the unit/integration coverage.

## Vitest configuration

- **Each package has its own `vitest.config.ts`, separate from `vite.config.ts`.** TanStack Start's vite config registers Nitro and the router plugin — none of that should load during unit tests. The standalone config keeps tests fast and side-effect-free (`apps/web/vitest.config.ts` is just `environment: 'jsdom'`).
- Browser-flavored packages use `jsdom`; server/library packages use `node`. A single file needing the other environment takes a `// @vitest-environment node` header instead of a config change.
- Mock at the package seam (`vi.mock('@oakoss/db')`), reset with `mockReset` + `vi.resetModules()` in `beforeEach` — see `apps/web/src/lib/electric-smoke.test.ts` for the house pattern.

## Test factories (R1, with the Drizzle schema)

When real tables land, factories live in a `test/factories/` directory and follow this shape:

- `createX(overrides?)` returns a plain object — unit tests, no DB.
- `insertX(db, overrides?)` inserts and returns the row via `.returning()`.
- **Always pass `db` as a parameter** — never import a connection singleton; fixtures own the connection and its rollback.
- Param types: `Pick<XInsert, RequiredFKs> & Partial<XInsert>` when the entity has required foreign keys, plain `Partial<XInsert>` otherwise. Entity/insert types derive from the Drizzle schema (`drizzle-orm/zod` — the deprecated `drizzle-zod` package's successor; verify against the drizzle-orm version R1 pins), not hand-written.
- Composite factories (`insertConversationWithUser(db)`) collapse multi-step setup into one call; add them when a second test repeats the setup, not before.
- One integration test file per service, named after it.

Isolation model to adopt with Testcontainers: file-scoped transaction rolled back at the end, per-test `SAVEPOINT`, and a wrapped fixture for services that call `.transaction()` internally (nested transactions become savepoints, preserving isolation).

## E2E conventions

- Specs run against the **prod nitro build** (`playwright.config.ts` webServer), so the enforcing CSP and real bundles are exercised — not the dev server.
- **Locator priority:** `getByRole` → `getByText` → `getByLabel` → `getByPlaceholder` → `getByAltText` → `getByTitle` → `getByTestId` (last resort, explicit contract). No CSS/XPath selectors. Narrow with `.filter({ hasText })` and chain locators instead of nesting selectors.
- Assert behavior, not markup: roles, labels, persisted state across reload — assertions that survive a redesign (the suite survived the route-group restructure untouched).
- Trap silent failures with `trapErrors`/`expectNoErrors` from `e2e/support/trap-errors.ts` — it catches console errors, structured-logger error lines, page errors, and failed requests.
- Shared helpers go in `e2e/support/`; custom fixtures (auth sessions, entity setup) arrive via `test.extend` when auth lands at R1, with a setup project seeding per-worker users and `storageState` reuse.
- **Tags** (adopt when CI lands, `telemachus-8zj.7`): `@smoke` for the PR gate's core paths, `@a11y` for axe/keyboard scans, `@authenticated` once sessions exist — CI greps tags into tiers instead of running everything everywhere.
