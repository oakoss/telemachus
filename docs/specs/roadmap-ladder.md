# Spec: roadmap ladder

- **Status:** Draft
- **Date:** 2026-06-01
- **Authors:** @jbabin91
- **Related:** [`../ideas/thesis.md`](../ideas/thesis.md), [`../research/differentiation-opportunities.md`](../research/differentiation-opportunities.md), [`../ideas/pinned-messages-and-notes.md`](../ideas/pinned-messages-and-notes.md), [`../research/feature-matrix.md`](../research/feature-matrix.md)

## Overview

A proposed **capability sequence** for Telemachus — wedge-first, each rung independently shippable and built on the one before. The ordering front-loads the validated differentiators that are cheap to build, and defers table-stakes machinery until a differentiator needs it.

## Scope

This sequences _capabilities_, not dates, and it is not a commitment. **Rungs are ordering handles, not release versions** — actual version numbers (`0.1`, `1.0`) get assigned to real releases separately, as oakoss/ui does, and a release may span several rungs. It assumes the **decided stack** (TanStack Start + TanStack DB + the rest — see [`../decisions/`](../decisions/) and the **Decided** block in [`../../AGENTS.md`](../../AGENTS.md), the source of truth). If it changes, the rung _order_ mostly holds because it's organized around the data model, not the framework. Out of scope here: the detailed per-rung implementation specs (each earns its own spec when it's next).

## The ladder

### Rung 1 — Tracer bullet

Streaming chat against a local model (Ollama via TanStack AI), with the finished message settling into a TanStack DB collection. Proves the whole spine: shell → streaming → the streaming-vs-DB boundary → persisted, queryable state. Nothing else.

### Rung 2 — The work surface _(first differentiator)_

Pinned-message checklist + jump-nav, and a per-session notes scratchpad. Pure reactive UI over synced collections (`pins`, `notes`) — minimal agent machinery, so it's cheap, demoable, and makes the wedge visible immediately. Validated, unclaimed (Tier 1.1–1.2).

### Rung 3 — Tools + approval

Tool calling through TanStack AI, with Plan/Act modes and per-action approval gating. Table stakes, but the foundation everything agentic needs. Borrow the proven UX (Cline Plan/Act, Goose smart approval).

### Rung 4 — Persistent agents + run model

Agents as first-class, durable objects; `runs` and `runSteps` as first-class collections fed by agent activity (AG-UI events). Chat becomes one view; "check in on an agent" becomes possible. This is the data model the headline differentiators ride on.

### Rung 5 — Glass-box replay + fork _(headline differentiator)_

Built on Rung 4's `runSteps`: a replayable timeline you can rewind to any step and **fork** an alternate path. The high-wow, dead-center-on-thesis feature nobody ships natively (Tier 1.3).

### Rung 6 — Durable local working memory _(flagship local-first bet)_

Project-level memory distilled from run/conversation history: decisions, what was tried and failed, files touched, next steps. "Resume where I left off" without re-explaining (Tier 1.4). Builds on Rung 4's history; pairs with sync for the cross-device promise.

### Cross-cutting — Local-first sync

True multi-device CRDT sync via ElectricSQL over the existing collections. The backbone behind "follows you across devices." Timing is flexible: build single-device on local TanStack DB from Rung 1, and introduce sync when multi-device matters (naturally alongside Rung 6's cross-device promise). Tier 1.5.

### Later — Workspace surfaces & table-stakes depth

Per-component context breakdown + interactive pruning (Tier 2, the still-open slice); MCP host; model router (privacy-aware); skills + registry; domain surfaces (email/calendar). Sequenced by need, not pre-committed.

## Sequencing principles

- **Wedge before breadth.** Rung 2's work surface and Rung 5's glass-box are why Telemachus exists; ship visible differentiation early rather than after a long table-stakes slog.
- **The data model is the spine.** Differentiators (Rungs 5, 6) ride on the `runs`/`runSteps`/conversation collections, so the agent/run model (Rung 4) precedes them.
- **Cheap-and-demoable first.** Rung 2 is deliberately low-machinery, high-visibility — proof the reactive-UI-over-synced-state bet works before heavier rungs.
- **Sync is a backbone, not a gate.** Local single-device first; layer CRDT sync when multi-device earns it.

## Open questions

- Does Rung 2 (work surface) need the Rung 4 agent/run model at all, or can it ship on a chat-only data model? (Likely chat-only — pins/notes reference messages, not runs.)
- Where exactly does sync enter — backbone from Rung 1, or layered at Rung 6? Trade-off: earlier sync de-risks the architecture; later sync ships differentiators faster.
- Is durable working memory (Rung 6) distinct enough from vector memory to warrant its own subsystem, or a view over run/conversation history + a distillation step?
