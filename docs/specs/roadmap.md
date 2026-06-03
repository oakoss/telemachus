# Roadmap

- **Status:** Living
- **Date:** 2026-06-01 (updated 2026-06-02)
- **Authors:** @jbabin91
- **Related:** [`../ideas/thesis.md`](../ideas/thesis.md), [`data-model.md`](data-model.md), [`foundations.md`](foundations.md), [`../research/differentiation-opportunities.md`](../research/differentiation-opportunities.md), [`../ideas/pinned-messages-and-notes.md`](../ideas/pinned-messages-and-notes.md)

## What this is

The capability sequence for Telemachus — wedge-first, each rung independently shippable and built on the one before. The order front-loads the validated differentiators that are cheap to build and defers table-stakes machinery until a differentiator needs it.

**This doc is the _why_ and the _order_. bd is the _what_ and the _status_** — epics, stories, tasks, dependencies, and progress live in bd (`bd ready`, `bd epic status`). This doc names the rungs and their rationale; it does not track completion (so it can't drift from bd).

It assumes the decided stack — the ADRs ([`../decisions/`](../decisions/)) are the source of truth (stack-at-a-glance in [`../decisions/README.md`](../decisions/README.md)). The rung _order_ is organized around the data model ([`data-model.md`](data-model.md)), so it mostly holds even if a stack choice changes. Rungs are ordering handles, not release versions — version numbers (`0.1`, `1.0`) attach to real releases separately, and a release may span several rungs.

## How rungs become work

- **Epic = a rung / capability** — one epic per rung, plus an **E0** for scaffold + foundations.
- **Story = a vertical slice** — a thin, end-to-end, demoable increment ("send a message, watch it stream from Ollama, see it persist as a queryable row"). The **first story in a rung is the thinnest end-to-end path**; later stories thicken it.
- **Task = the layered steps** inside a slice (schema · worker · stream handler · renderer · test). Tasks may be horizontal; the story is what guarantees they integrate end-to-end.

## The rungs

### Rung 1 — Streaming chat, end-to-end

Streaming chat against a local model (Ollama via TanStack AI), with the finished message settling into a TanStack DB collection (SQLite-persisted). Proves the whole spine end-to-end: shell → streaming → the streaming-vs-DB boundary → persisted, queryable state. Nothing else.

### Rung 2 — The work surface _(first differentiator)_

Pinned-message checklist + jump-nav, and a per-conversation notes scratchpad. Pure reactive UI over synced collections (`pins`, `notes`) — minimal agent machinery, so it's cheap, demoable, and makes the wedge visible immediately. Validated, unclaimed (Tier 1.1–1.2).

### Rung 3 — Tools + approval

Tool calling through TanStack AI, with Plan/Act modes and per-action approval gating. Table stakes, but the foundation everything agentic needs. Borrow the proven UX (Cline Plan/Act, Goose smart approval).

### Rung 4 — Persistent agents + run model

Agents as first-class, durable objects; `runs` and `runSteps` as first-class collections fed by agent activity (AG-UI events). Chat becomes one view; "check in on an agent" becomes possible. This is the data model the headline differentiators ride on.

### Rung 5 — Glass-box replay + fork _(headline differentiator)_

Built on Rung 4's `runSteps`: a replayable timeline you can rewind to any step and **fork** an alternate path. The high-wow, dead-center-on-thesis feature nobody ships natively (Tier 1.3).

### Rung 6 — Durable local working memory _(flagship local-first bet)_

Project-level memory distilled from run/conversation history: decisions, what was tried and failed, files touched, next steps. "Resume where I left off" without re-explaining (Tier 1.4). Builds on Rung 4's history; pairs with sync for the cross-device promise.

### Cross-cutting — Local-first sync

True multi-device sync via ElectricSQL over the existing collections (server-authoritative LWW; CRDT/Yjs only if collaborative editing is needed — see [ADR-001](../decisions/001-data-layer-tanstack-db-electric-pglite.md)). The backbone behind "follows you across devices." Timing is flexible: build single-device on local TanStack DB from Rung 1, and introduce sync when multi-device matters (naturally alongside Rung 6's cross-device promise). Tier 1.5.

### Model provisioning — the Cookbook _(self-host advantage)_

A managed model-serving layer (Odysseus's strongest differentiator): **hardware-detect → recommend → download → serve**. The **external runner is the floor from Rung 1** (the app is a client to an OpenAI-compatible endpoint via the provider abstraction, [ADR-006](../decisions/006-model-llm-layer.md)); the Cookbook is **additive on that seam**, so it's deferred without a refactor cost. Sequenced by need, cheap parts first: hardware-fit scoring (`hwfit` — portable pure logic) and **attach-before-supervise for Ollama**, then model download, then the OS-matrix-heavy parts (build/manage llama.cpp/vLLM, process supervision) last. Reference: [`../research/deep-dives/odysseus.md`](../research/deep-dives/odysseus.md).

### Later — Workspace surfaces & table-stakes depth

Per-component context breakdown + interactive pruning (Tier 2, the still-open slice); MCP host; model router (privacy-aware); skills + registry; domain surfaces (email/calendar). Sequenced by need, not pre-committed.

## Sequencing principles

- **Wedge before breadth.** Rung 2's work surface and Rung 5's glass-box are why Telemachus exists; ship visible differentiation early rather than after a long table-stakes slog.
- **The data model is the spine.** Differentiators (Rungs 5, 6) ride on the `runs`/`runSteps`/conversation collections, so the agent/run model (Rung 4) precedes them.
- **Cheap-and-demoable first.** Rung 2 is deliberately low-machinery, high-visibility — proof the reactive-UI-over-synced-state bet works before heavier rungs.
- **Sync is a backbone, not a gate.** Local single-device first; layer sync when multi-device earns it.

## Open questions

- **(resolved)** Does Rung 2 need the Rung 4 agent/run model? → **No — chat-only.** Pins/notes reference messages, not runs ([`data-model.md`](data-model.md); [`../ideas/scope-positioning.md`](../ideas/scope-positioning.md)).
- **(partly resolved)** Is durable working memory (Rung 6) its own subsystem or a view over history? → The data model commits to a distilled `memoryBlock` tier with optional pgvector recall ([`data-model.md`](data-model.md)); the depth (distillation/consolidation) is **thread #4**.
- **(open)** Where does sync enter — backbone from Rung 1, or layered at Rung 6? Earlier sync de-risks the architecture; later sync ships differentiators faster. Owned by **thread #5**.
