# Stack research: the reactive / local-first data layer

- **Status:** Research — **resolved by [ADR-001](../decisions/001-data-layer-tanstack-db-electric-pglite.md)** (adopted the lean). Snapshot 2026-06-02; these move fast, re-verify if reopened.
- **Purpose:** Evaluate the **data layer = the wedge engine** before committing. Highest-stakes, hardest-to-swap choice: all five wedge items are "reactive UI over synced local agent/conversation state".
- **Method:** 4 parallel code+docs deep dives (2026-06-02), scored against the wedge requirements. Leading hypothesis going in: TanStack DB + ElectricSQL (the author's lean).

## Requirements (from the wedge)

Reactive live queries · local-first (offline, on-device) · multi-device sync (ideally CRDT — wedge item) · **glass-box: immutable run/step history + replay + fork** (the headline wedge) · durable working memory (a collection) · SQL/rich query (analytics, nice-to-have) · all-TS + self-hostable + personal-first (light infra) · pairs with TanStack Start/Router · maturity (it's the foundation).

## Comparison

Legend: ✅ strong/native · ◑ partial/DIY · — weak/absent

| Dimension                             | **Lean:** TanStack DB + Electric + PGlite       | Zero                             | Jazz                                                                 | LiveStore                                |
| ------------------------------------- | ----------------------------------------------- | -------------------------------- | -------------------------------------------------------------------- | ---------------------------------------- |
| Reactive live queries                 | ✅ (differential dataflow)                      | ✅ (ZQL)                         | ✅ (CoValues)                                                        | ✅ (reactive SQLite)                     |
| Local-first store                     | ✅ PGlite (full PG/WASM)                        | ◑ reads only                     | ✅ IndexedDB                                                         | ✅ SQLite/WASM                           |
| Offline writes                        | ◑ DIY queue/replay                              | — rejects offline                | ✅ queue + sync                                                      | ✅ queue + rebase                        |
| Multi-device sync                     | ◑ read-path only; writes via your API           | ◑ server-authoritative           | ✅ **native CRDT, P2P**                                              | ◑ git-style push/pull                    |
| Conflict resolution                   | — (server LWW; Yjs opt-in)                      | — custom server mutators         | ◑ CRDT LWW + branch-merge                                            | — **beta, not implemented**              |
| **Glass-box history / replay / fork** | — bolt-on                                       | — bolt-on                        | ✅ **edit-history + branching native**                               | ◑ **event-log replay native; fork DIY**  |
| SQL / rich query                      | ✅ full Postgres                                | ✅ ZQL                           | — document, in-memory JS                                             | ✅ full SQLite                           |
| Durable memory                        | ✅ collection                                   | ✅ table                         | ✅ CoValues + history                                                | ◑ eventlog (no compaction yet)           |
| All-TS / self-host / personal-first   | ✅ / ✅ / ◑ (PG+Electric server)                | ✅ / ◑ / — (heavy infra)         | ✅ / ✅ / ✅ (pure-local ok)                                         | ✅ / ✅ / ✅                             |
| TanStack Start pairing                | ✅✅                                            | ✅ (idiomatic)                   | ◑ (router-agnostic React)                                            | ◑ (React; orthogonal to TQ)              |
| Maturity                              | ◑ TanStack DB β · PGlite 0.4α · Electric sync β | ✅ **GA v1.x**                   | ◑ pre-v1, ~3–5k★, recent breaking change                             | ◑ 0.4β, ~3.6k★ (prod use: Overtone)      |
| Stack shape                           | 2 libs + your write API                         | cohesive (server-centric)        | **1 unified lib** (replaces DB+sync)                                 | store + pluggable sync backend           |
| Cost / license (self-host)            | ✅ free OSS (MIT/Apache) — avoid Electric Cloud | ◑ OSS self-host; Zero Cloud paid | ✅ free OSS (MIT) — self-host `jazz-run sync`, avoid Jazz Cloud tier | ✅ free OSS (Apache) — self-host backend |

## Cost & hosting (decided constraint)

**Free / open-source only — no paid or hobby-tier SaaS** (it's a hobby project). Self-hosted on the author's **Proxmox** server (a **Coolify** VM or a dedicated LXC).

- All three viable candidates are **OSS + fully self-hostable for free** — the constraint doesn't change the contest, but it **rules out the managed clouds** (Electric Cloud, Jazz Cloud beyond free tier, Zero Cloud) and **eliminates SaaS-only options** (Convex, hosted InstantDB).
- **Self-host shapes:** lean = Postgres + Electric server + app; Jazz = a single `jazz-run sync` server + app (**lightest — no Postgres**); LiveStore = a Node/custom sync backend + app. Coolify/Docker on Proxmox handles any of these.
- Reinforces **dropping Zero** (Zero Cloud paid + heaviest infra) and **slightly favors Jazz** on home-server simplicity.

## Per-candidate verdict

- **Lean (TanStack DB + Electric + PGlite)** — the **safe, SQL-capable, TanStack-ecosystem-native** base; excellent reactive + local-first + self-host; **fully covers Rungs 1–2**. Gaps: the two wedge _differentiators_ — CRDT sync and glass-box history/fork — are **+1 architectural layers you build and own** (event-sourcing schema + replay + branching; Yjs for CRDT). Pre-1.0 across all three libs.
- **Zero** — most mature (GA) + best ZQL/TanStack pairing, but **server-authoritative, no offline writes, no CRDT, no event-sourcing, heavy infra** (zero-cache + Postgres mandatory). Fights the local-first / personal-first identity. **Eliminate** for Telemachus.
- **Jazz** — the **most wedge-aligned**: native **CRDT sync** (the sync wedge) + native **edit-history + branching** (the glass-box foundation) + reactive + local-first + personal-first, **unified in one library**. Costs: pre-v1 maturity (~3–5k★), **no SQL** (document model, in-memory queries → weak analytics), LWW conflict for deeply-nested state.
- **LiveStore** — **event-sourcing = philosophically native** for glass-box run history + deterministic replay, _with_ SQL + local-first. Costs: **fork is DIY** (no native branching API), **conflict resolution is beta/unimplemented**, no eventlog compaction yet (unbounded growth).

## The decision (a values tradeoff)

- **Safe + SQL + the TanStack ecosystem you're invested in; build the wedge layers yourself** → **the lean**.
- **Wedge differentiators native (CRDT + history/fork), unified + personal-first; accept younger + no-SQL** → **Jazz**.
- **Glass-box-via-event-sourcing native + SQL; accept beta sync + DIY fork** → **LiveStore**.
- **Timing:** Rungs 1–2 (the near-term build = the work surface) are _pure reactive collections_ — **all four do that well**. The wedge gaps only bite at Rungs 5–6 (glass-box, CRDT sync). But the data layer is the **hardest thing to swap later**, so choosing well now matters.

## Recommendation

1. **Drop Zero** — wrong model (server-authoritative, no offline writes) for a local-first personal tool.
2. **The real contest is the lean vs Jazz** (LiveStore third — event-sourcing is great for glass-box, but DIY fork + beta conflict resolution + no CRDT make it riskier than Jazz for the same wedge goals).
3. **Jazz ships the wedge's two hardest items natively and unifies the stack — the most coherent bet on paper — but pre-v1 maturity and no SQL are real risks for a foundation you can't easily swap.** The lean covers the near-term and defers the wedge to owned layers.
4. **This is too foundational to decide purely on paper.** Recommended: **spike the Rung-1 tracer on both the lean and Jazz** (the tracer — streaming chat settling into a collection — is the roadmap's R1 anyway, so this isn't extra work). Let DX + felt wedge-fit decide, then write the first ADR. If committing now without a spike: **the lean is the defensible default** (matches the TanStack investment + SQL + near-term fit, wedge as known +1 work), with **Jazz the thing to revisit** if those layers prove painful.

> **Resolved ([ADR-001](../decisions/001-data-layer-tanstack-db-electric-pglite.md)):** committed to the lean **without** the spike; **Jazz** is the recorded revisit trigger (re-evaluate before Rung 5 if the glass-box / CRDT layers prove painful). The recommendation above is retained as the reasoning of record.

## Not deep-dived (noted, lower priority)

Triplit, PowerSync, RxDB, InstantDB, Convex (server-centric), Yjs/Automerge (CRDT primitives — relevant as an _add-on_ to the lean for collab/CRDT, not a full data layer).
