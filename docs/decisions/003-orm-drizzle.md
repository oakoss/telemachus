# ORM / data access: Drizzle

- **Status:** Accepted — amended 2026-06-02 (Drizzle is the server ORM; client store = TanStack DB/SQLite; see Amendment)
- **Date:** 2026-06-02
- **Authors:** @jbabin91

## Amendment (2026-06-02): Drizzle is the server-side ORM

Per [ADR-001](001-data-layer-tanstack-db-electric-pglite.md)'s 2026-06-02 amendment, the client on-device store is **TanStack DB collections + SQLite persistence**, not Drizzle-on-PGlite. Drizzle's role narrows accordingly:

- **Drizzle = the server ORM** (Postgres): schema, `drizzle-kit` migrations, queries, and the Better Auth adapter.
- **The client does not use Drizzle directly.** Client schema = TanStack DB collection schemas (Standard Schema / Zod), populated by Electric shapes mapped from the server Postgres schema.
- **"One schema, both stores" → one server Drizzle schema as the source of truth; client collection types derive from it** (via shapes / generated types). That type-flow is a thread-#2 design item.
- **Server tests run against real Postgres via Testcontainers** (a throwaway container per suite) for full dialect/extension fidelity (pgvector, etc.); **PGlite is not used**. Drizzle + Postgres + `drizzle-kit` otherwise unchanged.

The original (one-schema-both-PGlite-and-Postgres) reasoning below is kept as the historical record.

## Context

The decided data layer ([ADR-001](001-data-layer-tanstack-db-electric-pglite.md)) has two Postgres-dialect stores: **PGlite** (WASM Postgres) on the client and **server Postgres** (the ElectricSQL source). We need a typed data-access layer — schema, queries, migrations — ideally **one schema definition driving both stores**.

Constraints that apply:

- **All-TypeScript**, **free / open-source**; runs in the browser (PGlite/WASM) and on the server, so it must not be Node-only.
- Pairs with [ADR-002](002-app-framework-tanstack-start-nitro.md) (TanStack Start), [ADR-004](004-auth-better-auth.md) (better-auth generates its schema through this ORM), and feeds TanStack DB collections (ADR-001).

This decision is **scoped to the ORM / query / migration layer only**. The concrete schema (tables, columns, relations) is thread #2's data-model work, not decided here.

Evidence (verified 2026-06-02): Drizzle is the near-universal ORM for TanStack Start; it targets the Postgres dialect for both `node-postgres`/`postgres-js` (server) and a **PGlite driver** (`drizzle-orm/pglite`) for the local store, with `drizzle-kit` for migrations. Prisma's engine is Node-oriented and conflicts with edge/WASM targets. ([Better Auth Drizzle adapter](https://better-auth.com/docs/adapters/drizzle))

## Decision

Adopt **Drizzle (drizzle-orm)** as the ORM / query builder.

- One Drizzle **schema** (Postgres dialect) drives both stores.
- **Local:** the PGlite driver (`drizzle-orm/pglite`) over the on-device PGlite store.
- **Server:** `node-postgres`/`postgres-js` over the server Postgres.
- **Migrations:** `drizzle-kit`.

## Consequences

**Easier / gained:**

- **One schema, both stores.** Same Postgres-dialect definitions for PGlite and server Postgres — no drift between client and server tables.
- SQL-first, lightweight, tree-shakeable, runs in the browser (no Node-only engine). Types flow into TanStack DB collections and better-auth.
- `drizzle-kit` gives versioned migrations.

**Harder / accepted tradeoffs:**

- **Schema must stay dialect-compatible** across PGlite and server Postgres. Both are Postgres, so risk is low, but PGlite's WASM build can lag on extensions — verify any extension-dependent feature on PGlite before relying on it.
- **Migration choreography is ours.** Ordering migrations across PGlite and server Postgres (and against ADR-001's write-path) is an explicit design responsibility.
- Drizzle's relational query API is still maturing; pin versions.

**Follow-up:**

- Thread #2 (data model) defines the concrete schema in Drizzle terms — including the append-only `runs`/`runSteps` from ADR-001's glass-box mitigation.

## Alternatives considered

- **Prisma** — most popular Node ORM. **Not chosen:** its query engine is Node-oriented and fights edge/WASM targets (PGlite in the browser), and it's heavier than the explicit-SQL style Start projects favor.
- **Kysely** — excellent typed query builder. **Not chosen:** no first-class schema/migration story to match Drizzle's, and we want one schema object feeding migrations + better-auth.
- **Raw SQL / no ORM** — maximum control, but loses end-to-end types and migrations across two stores.
- **TanStack DB alone** — handles reactive client collections, not server schema/migrations or the auth tables. Drizzle complements it rather than competing.
