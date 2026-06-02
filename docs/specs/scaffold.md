# Spec: scaffold & foundations (E0)

- **Status:** Draft
- **Date:** 2026-06-02
- **Authors:** @jbabin91
- **Related:** [ADR-007](../decisions/007-repo-shape-and-toolchain.md) (repo/toolchain), [ADR-008](../decisions/008-architecture-and-topology.md) (topology), [`foundations.md`](foundations.md) (cross-cutting seams), [`roadmap.md`](roadmap.md) (Rung 0), [`data-model.md`](data-model.md) (schema R1 builds). bd epic: `telemachus-8zj`.

## Overview

The minimal monorepo skeleton + the cross-cutting **seams** that are brutal to retrofit, so that Rung 1's first vertical slice (streaming chat → persisted row) can be built on top without rework. E0 is **precursor infrastructure**, not a feature — it ships when the repo boots, the app renders, a local DB query runs, and lint/typecheck/test are green.

Bias: **thin.** Stand up the structure and the seams R1 will immediately touch; pull everything else in vertically as later rungs need it. Don't build the data-model tables, auth providers, the chat, or a standalone `core` service here.

## Scope

**In:**

- Turborepo + pnpm workspace (with a pnpm **catalog** for single-version deps across packages — t3code pattern); the `apps/*` + `packages/*` skeleton with explicit package boundaries (no barrels).
- Toolchain wired into Turbo pipelines: **lean oxlint** (native-only, root nested config) **+ ESLint** (per-package presets) **+ oxfmt**, Vitest, Playwright, TypeScript (**strict**, with `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes`), mise/Node pin, the existing lefthook hooks. Lint topology: [ADR-007](../decisions/007-repo-shape-and-toolchain.md).
- `apps/web` — a TanStack Start app that boots, renders a placeholder, dev-serves, and builds via the Nitro **node** preset.
- `packages/db` — **TanStack DB collections + first-party SQLite persistence** (`@tanstack/browser-db-sqlite-persistence`, wa-sqlite/OPFS); leader-elected multi-tab + OPFS are **built in** (no DIY worker binding). A trivial persisted collection + query proves the path (no real tables yet). **Drizzle = server-side** (Postgres) only; server tests run against real Postgres via Testcontainers (not PGlite). (Per [ADR-001](../decisions/001-data-layer-tanstack-db-electric-pglite.md)'s amendment: on-device = SQLite, not PGlite.)
- `packages/shared` — the foundations utilities R1 needs: UUIDv7 ids, Zod-validated env, a Pino logger behind an interface (+ a correlation-id field), and a typed result/error shape.
- `packages/core` — a Hono app skeleton mounted **in-process** behind the Start BFF (a `/health` + `/version` route); not a separate service.
- A strict **CSP** on the app from the first commit — `wasm-unsafe-eval` + `worker-src`/`child-src blob:` and the wa-sqlite WASM asset origin; pairs with the reproducible-WASM-bootstrap + SRI seam ([`foundations.md`](foundations.md)).
- **Dev environment + services** — a `docker-compose.yml` for **dev backing services** (Postgres now; Electric/MinIO at later rungs), a production **`Dockerfile`** (Nitro build → Coolify), `.env.example`, and a dev-setup doc. The **app runs on the host for dev** (`pnpm dev`); Docker is for **dev services + test databases (Testcontainers) + the deploy image**, not the dev app.
- **DB lifecycle scripts** — `db:generate` / `db:migrate` / `db:seed` / `db:studio` / `db:reset` (drizzle-kit + a custom seed/reset) as `packages/db` package scripts + Turbo tasks; pairs with the migration-discipline seam ([`foundations.md`](foundations.md)).

**Out (later rungs / threads):**

- The concrete `conversations/messages/parts/...` tables → R1 build, per [`data-model.md`](data-model.md).
- Streaming, Ollama, TanStack AI → R1.
- Better Auth (config, tables, client) → **R1 story 1** (`telemachus-1or.1`); **none in E0**. E0 stands up the server Drizzle schema + migration runner the Better Auth adapter plugs into at R1.
- `packages/extensions`, `packages/ui` extraction, `apps/docs` (Fumadocs), native (Tauri), the standalone `core` service → deferred. CI itself lands in E0 (see the CI / CD / release decision below); the **CD** image-publish/deploy and **docs** deploy are the deferred parts.

## Architecture

Modular monorepo (ADR-008), Node runtime (ADR-008), server-side Drizzle (Postgres) with client TanStack DB collections (ADR-003 amendment).

| Path                  | What                                                                                                               | Notes                                                                                                                |
| --------------------- | ------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `apps/web`            | TanStack Start app — UI shell + server functions (the web **BFF**)                                                 | Nitro node preset → Coolify later                                                                                    |
| `packages/core`       | Hono app: agent runtime + domain logic                                                                             | in-process at R1; extractable to a service at Rung 4                                                                 |
| `packages/db`         | TanStack DB collections + SQLite persistence (wa-sqlite/OPFS); server Drizzle schema (Postgres) + migration runner | client = SQLite, server = Postgres ([ADR-001](../decisions/001-data-layer-tanstack-db-electric-pglite.md) amendment) |
| `packages/shared`     | Zod schemas/types, env, logger, ids, result/error                                                                  | the foundations utils; explicit subpath exports, no barrels                                                          |
| `packages/typescript` | shared tsconfig bases (base/react/node)                                                                            | `extends`-only; ~no deps                                                                                             |
| `packages/eslint`     | ESLint flat-config presets (base/react/node/test/e2e) + plugin deps                                                | imported per-package; **oxlint/oxfmt configs live at the repo root** (oxlint via nested per-package configs)         |

Control flow at R1: browser → `apps/web` (Start server fns = BFF) → `packages/core` (in-process) → DB. The web app reads its local **TanStack DB collections** (SQLite-persisted) reactively; the core owns domain/agent logic. The split is a **seam**, collapsed in-process now.

## Data model

E0 builds **no domain tables** — it stands up the _mechanism_: `packages/db` boots a **TanStack DB collection persisted to SQLite** (wa-sqlite/OPFS) and a trivial query, proving persistence + reactivity survive reload. The actual schema (UUIDv7 PKs, ownerId, tombstones, the chat spine) is applied at R1 from [`data-model.md`](data-model.md). **No on-device pgvector** — semantic recall is server-side (Postgres). Storage persistence (OPFS, `navigator.storage.persist()`) + multi-tab are handled by the persistence adapter; quota/eviction defers to thread #5.

## Behavior

- `pnpm dev` runs the web app (+ watching packages); `turbo lint|typecheck|test|build` are green on an empty skeleton.
- The app renders a placeholder route over the React-Aria/Intent-UI base with the theme provider mounted (light/dark seam).
- `packages/db` demo: a TanStack DB collection persisted to SQLite answers a live query from the app and survives reload.
- `/health` and `/version` (build SHA + schema version) respond from the in-process core; `/health` is exposed on the app's HTTP surface so the orchestrator (Coolify readiness) can probe it directly, not only through the BFF hop.
- Errors surface through the typed error shape + logger (with correlation id); no `console.log`.

## Testing

- **Unit (Vitest):** `packages/shared` — ids, env parsing, logger redaction, result/error.
- **Integration (Vitest):** `packages/db` — a persisted TanStack DB collection writes + live-queries; the server Drizzle migration runs against real Postgres (Testcontainers — a throwaway container per suite).
- **E2E smoke (Playwright):** app boots and renders the placeholder; `/health` returns ok. axe check on the placeholder (a11y baseline).
- All wired into `turbo test`; green required before E0 is "shipped."

## Proposed stories (→ bd, under epic `telemachus-8zj`)

Vertical-ish setup increments; first one is the thinnest "it boots."

1. **Monorepo boots** — Turbo + pnpm workspace + tsconfig base + lint/format/typecheck/test pipelines green on empty packages.
2. **Web app renders** — `apps/web` (TanStack Start) boots, renders a placeholder, builds via Nitro node preset; CSP in place.
3. **Local DB path** — `packages/db`: TanStack DB + first-party SQLite persistence (wa-sqlite/OPFS); a persisted collection + live query runs from the app and survives reload. (Server Drizzle/Postgres schema is separate.)
4. **Foundations utils** — `packages/shared`: UUIDv7, Zod env, Pino logger (+ correlation id, redaction), result/error.
5. **Core skeleton** — `packages/core`: in-process Hono app with `/health` + `/version`, mounted behind the Start BFF.
6. **Dev environment & services** — `docker-compose.yml` (Postgres for dev), production `Dockerfile` (Coolify), `.env.example`, dev-setup doc. The app stays on the host for dev.

## Decisions & open questions

**Decided (2026-06-02):**

- **tsconfig strictness — high.** `strict` + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes` from commit 1; ratcheting up later is painful.
- **pnpm catalog — adopt now.** Single-version dependency management across packages from scaffold (t3code pattern).
- **Components in `apps/web`.** Copy-paste Intent UI lives in `apps/web` until a second surface needs it; extract a `packages/ui` then.
- **No Better Auth in E0.** Auth config/tables/client are R1 story 1 (`telemachus-1or.1`); E0 only stands up the server Drizzle schema + migration runner the adapter plugs into.
- **App: host for dev, Docker for deploy.** No dev container — `pnpm dev` on the host. Docker runs **backing services** (Compose: Postgres) and packages the **production image** (Coolify); the dev app itself stays on the host.
- **Tests: real Postgres via Testcontainers.** Integration tests run against a throwaway Postgres container per suite (full fidelity incl. pgvector); E2E too once it exercises the DB (R1+). PGlite dropped; Docker is required for the integration suite.
- **CI / CD / release — GitHub Actions.** Static/unit/integration/e2e jobs + a single aggregate gate (the required check for branch protection); Changesets releases; GHCR image → Coolify pull deploy; docs on GitHub Pages; Renovate for deps + Actions. Full plan: [`ci-cd-release.md`](ci-cd-release.md).
