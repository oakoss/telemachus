# Data layer: TanStack DB + ElectricSQL + PGlite

- **Status:** Accepted — amended 2026-06-02 (on-device engine: PGlite → SQLite; see Amendment)
- **Date:** 2026-06-02
- **Authors:** @jbabin91

## Amendment (2026-06-02): on-device engine → SQLite

**This supersedes the PGlite leg of the decision below.** Since this ADR was written, **TanStack DB 0.6 (2026-03-25) shipped first-party persistence on SQLite** (wa-sqlite/OPFS in the browser; also Node/RN/Expo/Electron/Capacitor/Tauri/edge), and there is **no first-party TanStack DB ↔ PGlite integration** (only a single-maintainer community adapter). The on-device store therefore changes:

- **Client (browser/native): TanStack DB collections + first-party SQLite persistence** (`@tanstack/*-sqlite-persistence`) — leader-elected multi-tab + OPFS built in.
- **Server: Postgres + Drizzle + Electric** — unchanged.
- **PGlite: dropped** — not the client store (SQLite) and not the test DB; server tests run against real Postgres via Testcontainers (see [ADR-003](003-orm-drizzle.md)).

**Why:** (1) no first-party PGlite+TanStack-DB path — using it means a bus-factor-1 community adapter or our own binding; (2) adding Electric later is **additive** on the SQLite path (attach `electricCollectionOptions`) vs. a query-layer rewrite on PGlite; (3) on-device vector recall isn't load-bearing — memory recall is server-side (Postgres + pgvector), distilled blocks sync as text, and sqlite-vec covers the offline edge case; (4) SQLite unifies the web + native on-device store. Evidence: electric.ax (TanStack DB is the recommended client store; PGlite remains a standalone primitive but has no first-party TanStack-DB pairing) + the TanStack DB 0.6 release.

**Unchanged:** TanStack DB + ElectricSQL remain the data layer; the Jazz revisit-trigger (before Rung 5) stands; the persistence engine is a **swappable adapter under TanStack DB**. The original PGlite reasoning below is kept as the historical record.

**Assumption to de-risk early.** The "additive" claim above ((2): attach `electricCollectionOptions` to the SQLite-persistence path) is **unverified** — in particular whether the first-party SQLite persistence adapter composes with Electric sync on the same collection. Validate it with a **spike once the local-DB slice exists (E0)** — _before_ later rungs build collections on the pattern — not deferred to the sync rung. If it fails, trigger the revisit (the Jazz escape hatch, or alternative sync wiring) before the bet has compounded. (Tracked in bd.)

## Context

Telemachus needs a **reactive, local-first data layer** — the highest-stakes, hardest-to-swap choice, because all five wedge items are "reactive UI over synced local agent/conversation state" (the work surface, durable working memory, glass-box rewind+fork, the agent-native reactive data model, and local-first sync). The data layer _is_ the wedge engine.

Constraints that apply:

- **All-TypeScript**, build-our-own (references studied, never core dependencies).
- **Free / open-source + self-hostable** — no paid or hobby-tier SaaS (see [`Constraints` in scope-positioning](../ideas/scope-positioning.md)); deploy on the author's Proxmox / Coolify.
- **Personal-first**, conversation-primary; sits alongside the recommended (not yet committed) app stack — TanStack Start/Router with a React UI layer — each its own future ADR.

Evidence: a 4-candidate code+docs evaluation against the wedge requirements — [`../research/stack-data-layer.md`](../research/stack-data-layer.md) — covering this stack, Zero, Jazz, and LiveStore.

This decision is **scoped to the data / sync / local-store layer only**. The app framework (TanStack Start/Router), the React UI / component layer, the server runtime, and the model/LLM layer are _not_ decided here — they remain research recommendations for their own future ADRs.

## Decision

Adopt **TanStack DB + ElectricSQL + PGlite** as the data layer:

- **TanStack DB** — reactive client-side collections + differential live queries (the reactive-UI engine).
- **ElectricSQL** — Postgres→client read-path sync via shapes (the multi-device read sync).
- **PGlite** — embedded Postgres (WASM) as the local-first on-device store.

Self-hosted: Postgres + the Electric sync service + the app on the author's Proxmox server (Coolify VM or LXC). No managed cloud (no Electric Cloud).

## Consequences

**Easier / gained:**

- Reactive UI out of the box (sub-millisecond live queries) and full **local-first SQL** (PGlite is real Postgres on-device).
- **Free, OSS, self-hostable** end to end (MIT/Apache); no vendor lock-in, no bills.
- Native fit with the TanStack ecosystem; **covers Rungs 1–2 (chat + work surface) immediately** — pins/notes/messages are just reactive collections.

**Harder / accepted tradeoffs:**

- **Write-path sync is DIY.** Electric syncs reads only; writes go through our own API. We build the write loop (Electric "through-the-database" pattern: local PGlite write → change notify → API → Postgres → Electric syncs the row back).
- **No CRDT / automatic conflict resolution** (server-authoritative, last-write-wins). Acceptable for a single-user personal tool; if collaborative/CRDT editing is ever needed, add Yjs (Electric supports it) rather than re-platforming.
- **Glass-box (immutable run/step history + replay + fork) is a +1 architectural layer we own** — not provided by the stack. Mitigate by modeling `runs`/`runSteps` as **append-only/immutable from the start**, then building replay + branching on top.
- **Pre-1.0 maturity** — TanStack DB (beta), PGlite (alpha), Electric sync (beta). Pin versions, track changelogs, expect API shifts.

**Follow-up:**

- Thread #2 (data model) designs the concrete schema in these terms — append-only runs/steps; keep the model **swap-contained** so a future move (e.g. to Jazz) is bounded, not a rewrite.
- Revisit trigger recorded below.

## Alternatives considered

- **Jazz** — _strong runner-up._ Ships the two wedge differentiators natively: true CRDT multi-device sync **and** edit-history + branching (the glass-box foundation), unified in one library, lightest self-host, personal-first aligned. **Not chosen:** pre-v1 maturity (~3–5k★, recent breaking change), and **no SQL** (document/CoValue model, in-memory queries → weak analytics) — too much to bet a hard-to-swap foundation on right now. **Revisit trigger:** if the glass-box / CRDT +1 layers prove painful, re-evaluate Jazz before committing Rung 5 (glass-box). Evidence: [`../research/stack-data-layer.md`](../research/stack-data-layer.md).
- **LiveStore** — event-sourcing is philosophically native for glass-box run history + deterministic replay, with SQL. **Not chosen:** fork/branching is DIY (no native API), conflict resolution is beta/unimplemented, and the event log has no compaction yet (unbounded growth).
- **Zero (Rocicorp)** — most mature (GA) and the most idiomatic TanStack Start pairing. **Not chosen:** server-authoritative, **no offline writes**, no CRDT, no event-sourcing, heaviest infra, and Zero Cloud is paid — it fights both the local-first identity and the free/self-host constraint.
