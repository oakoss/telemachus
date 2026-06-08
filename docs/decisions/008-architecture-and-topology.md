# Architecture & monorepo topology: modular packages, Hono core, Start BFF

- **Status:** Accepted
- **Date:** 2026-06-02
- **Authors:** @jbabin91

## Context

ADRs 001–007 settled the stack. This records **how the system is structured and run**: the module decomposition, where the agent runtime lives, the web client's API path, the server runtime, the native-app strategy, and the extension mechanism.

Constraints that apply:

- **All-TypeScript**, **free / open-source + self-hostable** (Proxmox / Coolify); **build-our-own** for the agent runtime; **personal-first** (so productization is deferred).
- Builds on [ADR-002](002-app-framework-tanstack-start-nitro.md) (TanStack Start + Nitro), [ADR-006](006-model-llm-layer.md) (the agent loop), and [ADR-007](007-repo-shape-and-toolchain.md) (Turborepo).

This decision is **scoped to topology, modularity, runtime, native strategy, and extension placement**. Concrete package boundaries, the Turbo pipeline, the `core` API/AG-UI contract, the extension API surface, and the native build are deferred to when each is built.

Evidence (verified 2026-06-02): Hono is a tiny **multi-runtime** (Node/Bun/Deno/edge) MIT web framework with **Hono RPC** (type-safe client) and first-class streaming; Tauri 2 targets **desktop and mobile** at ~10× smaller / ~5× less RAM than Electron; Fumadocs supports **TanStack Start**; t3code demonstrates a modular package layout (schema-only `contracts`, explicit subpath exports, no barrels). ([Hono](https://hono.dev) · [Tauri vs Electron](https://rustify.rs/articles/rust-tauri-vs-electron-2026) · [Fumadocs × TanStack Start](https://www.fumadocs.dev/docs/manual-installation/tanstack-start))

**Re-verified 2026-06-07:** holds, no material change. Hono 4.12.23, `@tauri-apps/cli` 2.11.2 (Tauri still on the 2.x line — no v3), and Fumadocs 16.9.3 are all current with no breaking changes since 2026-06-02; Hono RPC + streaming and the Fumadocs × TanStack Start integration are intact.

## Decision

1. **Modular monorepo from the ground up.** Turborepo with a deliberate `packages/*` decomposition — `core` (agent runtime + domain/business logic), `extensions` (internal extension system), `shared`/`contracts` (schemas, types) — each a real package with explicit boundaries (explicit subpath exports, **no barrel files**). `apps/*` are thin shells (`web`, `docs`, later `desktop`/`mobile`). **Business/core logic lives in packages, never baked into an app.**
2. **Dedicated backend = a Hono `core` service — seam now, extract at Rung 4.** The agent runtime + domain logic live in `packages/core`, exposed via a **Hono** API (Hono RPC for typed calls; SSE / AG-UI for the agent stream). R1 runs `core` **in-process** inside the TanStack Start server (Nitro node); at **Rung 4** (persistent agents + run model) it extracts into a **standalone Hono service** when runs must outlive a request. Hono's portability keeps that extraction low-friction.
3. **TanStack Start = the web BFF.** Start server functions own auth/session, SSR, and web-shaped data, calling `core` (in-process now, over Hono later). **Native apps consume the same Hono `core` API.**
4. **Runtime: Node (LTS) now, revisit Bun.** Nitro node preset for the app and the `core` service; re-evaluate Bun once the agent runtime + serving management are proven and Bun's long-process / native-addon story matures. Hono and Nitro both run on either, so the door stays open. pnpm stays the package manager.
5. **Native: PWA-first → Tauri 2.** Ship the web app as an installable PWA (cheap parity), then **Tauri 2** for native desktop + mobile when it's a priority. The on-device store is **SQLite everywhere** (TanStack DB persistence — wa-sqlite/OPFS in the browser, op-sqlite on native) per [ADR-001](001-data-layer-tanstack-db-electric-pglite.md)'s 2026-06-02 amendment, so web and native share one store; confirm Tauri's adapter firsthand when native work starts.
6. **Extensions: an internal `packages/extensions`.** Reference pi's extension model (lifecycle hooks, tool/command/UI registration on the agent runtime). It is a monorepo package the apps reference — **not published**. A public extensions SDK is deferred until/unless the product path opens.
7. **Docs site: `apps/docs` on TanStack Start + Fumadocs** (MDX + Shiki). Recorded here for completeness; minor and swappable.

## Consequences

**Easier / gained:**

- Clean seams — any package (core, extensions, shared) can be tested, replaced, or extracted independently; the **agent runtime isn't trapped in the web framework**.
- **One Hono `core` API** serves the web (via the Start BFF) and, later, native clients — no second API to build for native.
- **Portable runtime** (Node now; Bun/edge later via Hono + Nitro) and **cheap native** (PWA now; Tauri 2 later).
- Extensibility without forking core; docs on the same framework as the app.

**Harder / accepted tradeoffs:**

- **More upfront structure** (many packages, explicit boundaries) for a solo project — accepted; modularity is a stated principle and cheaper than retrofitting.
- **A `core` + BFF is two server surfaces** to reason about even while co-located, and the BFF adds an indirection hop — mitigated by keeping `core` in-process until Rung 4.
- **Native local store** is now uniform — SQLite everywhere (wa-sqlite browser / op-sqlite native) per ADR-001's amendment; confirm the Tauri adapter at native time. (Sync = thread #5.)

**Follow-up:**

- Concrete package boundaries + the Turbo pipeline at R1.
- The `core` API / AG-UI contract at Rung 3–4; the extension API surface when the first extension is built.
- A native ADR when Tauri work starts; thread #5 covers the native local store + sync.

## Alternatives considered

- **Start monolith only** (no `core` package, no Hono). Simpler, but a long-lived agent runtime + background runs don't fit request-scoped server functions, and native clients would have no clean API. **Not chosen:** we keep the seam (in-process now, Hono-extractable).
- **Dedicated backend from day one.** **Not chosen:** premature for R1 (the tracer needs no separate process); design the seam, collapse it into the monolith until Rung 4.
- **Other backend frameworks** — Express/Fastify (heavier, less portable), Nest (heavy/opinionated), **Elysia** (Bun-first, conflicts with Node-now). **Hono chosen** for multi-runtime portability, tiny size, Hono RPC type-safety, and first-class streaming for an AG-UI agent API.
- **Electron** (native) — heavier (bundled Chromium), desktop-only. **Tauri 2 chosen:** smaller/lighter, desktop **and** mobile, free/OSS.
- **Published extensions SDK now** — off the personal-first identity; **deferred**.
- **Flat single-package repo** — rejected per the modular-from-the-ground-up principle.
