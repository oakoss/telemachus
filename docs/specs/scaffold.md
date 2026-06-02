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

- Turborepo + pnpm workspace; the `apps/*` + `packages/*` skeleton with explicit package boundaries (no barrels — t3code pattern).
- Toolchain wired into Turbo pipelines: oxlint + oxfmt, Vitest, Playwright, TypeScript (strict), mise/Node pin, the existing lefthook hooks.
- `apps/web` — a TanStack Start app that boots, renders a placeholder, dev-serves, and builds via the Nitro **node** preset.
- `packages/db` — PGlite via the **leader-elected multi-tab worker** (`PGliteWorker`, not a plain `Worker`), persisted to **OPFS** with `navigator.storage.persist()` + Drizzle wired, with a trivial migration + query proving the path (no real tables yet). The worker is leader-elected from the start because the RPC contract is shaped by it (foundations tags multi-tab coordination + storage persistence as `R1-scaffold` seams); quota-pressure/eviction handling defers to thread #5.
- `packages/shared` — the foundations utilities R1 needs: UUIDv7 ids, Zod-validated env, a Pino logger behind an interface (+ a correlation-id field), and a typed result/error shape.
- `packages/core` — a Hono app skeleton mounted **in-process** behind the Start BFF (a `/health` + `/version` route); not a separate service.
- A strict **CSP** on the app from the first commit — `wasm-unsafe-eval` + `worker-src`/`child-src blob:` and the PGlite WASM asset origin; pairs with the reproducible-WASM-bootstrap + SRI seam ([`foundations.md`](foundations.md)).

**Out (later rungs / threads):**

- The concrete `conversations/messages/parts/...` tables → R1 build, per [`data-model.md`](data-model.md).
- Streaming, Ollama, TanStack AI → R1.
- Better Auth providers/flows → R1+ (the adapter wiring may stub here).
- `packages/extensions`, `packages/ui` extraction, `apps/docs` (Fumadocs), native (Tauri), the standalone `core` service, CI provider → deferred.

## Architecture

Modular monorepo (ADR-008), Node runtime (ADR-008), one Drizzle schema (ADR-003).

| Path              | What                                                                                                                  | Notes                                                       |
| ----------------- | --------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `apps/web`        | TanStack Start app — UI shell + server functions (the web **BFF**)                                                    | Nitro node preset → Coolify later                           |
| `packages/core`   | Hono app: agent runtime + domain logic                                                                                | in-process at R1; extractable to a service at Rung 4        |
| `packages/db`     | Drizzle schema + PGlite **leader-elected worker** client (OPFS-persisted) + server-Postgres client + migration runner | one schema, both stores (ADR-003)                           |
| `packages/shared` | Zod schemas/types, env, logger, ids, result/error                                                                     | the foundations utils; explicit subpath exports, no barrels |
| `packages/config` | shared tsconfig base, oxlint/oxfmt config                                                                             | tooling-only                                                |

Control flow at R1: browser → `apps/web` (Start server fns = BFF) → `packages/core` (in-process) → DB. The web app reads its local PGlite (in the worker) reactively; the core owns domain/agent logic. The split is a **seam**, collapsed in-process now.

## Data model

E0 builds **no domain tables** — it stands up the _mechanism_: `packages/db` boots PGlite in a worker, runs a Drizzle migration, and executes a query, proving the worker ↔ main-thread path and the migration runner. The actual schema (UUIDv7 PKs, ownerId, tombstones, the chat spine) is applied at R1 from [`data-model.md`](data-model.md). The PGlite **pgvector extension** is loaded in the bootstrap even though no `vector` column exists yet (foundations: load-time seam). PGlite persists to **OPFS** (with `navigator.storage.persist()`); quota/eviction handling defers to thread #5.

## Behavior

- `pnpm dev` runs the web app (+ watching packages); `turbo lint|typecheck|test|build` are green on an empty skeleton.
- The app renders a placeholder route over the React-Aria/Intent-UI base with the theme provider mounted (light/dark seam).
- `packages/db` demo: a worker-hosted PGlite instance answers a `select 1`-style query from the app via the typed worker RPC contract.
- `/health` and `/version` (build SHA + schema version) respond from the in-process core; `/health` is exposed on the app's HTTP surface so the orchestrator (Coolify readiness) can probe it directly, not only through the BFF hop.
- Errors surface through the typed error shape + logger (with correlation id); no `console.log`.

## Testing

- **Unit (Vitest):** `packages/shared` — ids, env parsing, logger redaction, result/error.
- **Integration (Vitest):** `packages/db` — migration runs + query returns against PGlite.
- **E2E smoke (Playwright):** app boots and renders the placeholder; `/health` returns ok. axe check on the placeholder (a11y baseline).
- All wired into `turbo test`; green required before E0 is "shipped."

## Proposed stories (→ bd, under epic `telemachus-8zj`)

Vertical-ish setup increments; first one is the thinnest "it boots."

1. **Monorepo boots** — Turbo + pnpm workspace + tsconfig base + lint/format/typecheck/test pipelines green on empty packages.
2. **Web app renders** — `apps/web` (TanStack Start) boots, renders a placeholder, builds via Nitro node preset; CSP in place.
3. **Local DB path** — `packages/db`: PGlite via the leader-elected `PGliteWorker` (OPFS-persisted) + Drizzle + migration runner; a query runs from the app over the typed worker contract.
4. **Foundations utils** — `packages/shared`: UUIDv7, Zod env, Pino logger (+ correlation id, redaction), result/error.
5. **Core skeleton** — `packages/core`: in-process Hono app with `/health` + `/version`, mounted behind the Start BFF.

## Open questions

- **Components location:** start copy-paste Intent UI in `apps/web` vs. a `packages/ui` from day one? (Lean `apps/web` until a second surface exists.)
- **pnpm catalog** for single-version dependency management across packages (t3code pattern) — adopt now or later?
- **CI provider** + when (GitHub Actions vs. Coolify build) — deferred, but a `turbo` CI task target should exist.
- **tsconfig strictness** ceiling (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`) — set high now (cheap) or relax?
- **Better Auth** wiring depth in E0 — schema/adapter stub vs. nothing until R1.
