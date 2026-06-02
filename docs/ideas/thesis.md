# Thesis: what Telemachus is

- **Author:** @jbabin91
- **Date:** 2026-06-01

A spiritual successor to Odysseus (see [`../research/landscape.md`](../research/landscape.md)) — not a fork, not a replacement. A ground-up, local-first AI workspace built around one inversion.

## What it is first

Telemachus is, first, a **personal** local-first chat + agent hub — built for its author, with product ambition optional and later. The **why**: a tool with [Odysseus's](../research/landscape.md) capabilities, rebuilt on a stack the author owns and wants to extend (TypeScript / TanStack), and made _better_ by closing Odysseus's gaps. Its **primary object is the conversation**; the first thing it's best at is the **work surface** (pinned-message checklist + notes scratchpad).

Scope is three concentric rings: **(1) parity** with Odysseus's surface (built because the author uses it), **(2) the wedge** — work surface, durable working memory, glass-box fork — the gaps that make it distinct, and **(3) best-of-breed imports** — features users love in similar tools that Odysseus lacks (catalogued in [`../research/differentiation-opportunities.md`](../research/differentiation-opportunities.md)). Built **wedge-first** and accreted by personal need. This is the _decided_ identity (the thread-1 scope decision; see [`scope-positioning.md`](scope-positioning.md)).

## The trajectory: toward agent-native

Most workspaces, Odysseus included, are **chat-native with agents bolted on**. Telemachus's _destination_ is the inverse — **agent-native**: durable, long-running agents become a first-class object (Rung 4+ on the [roadmap ladder](../specs/roadmap-ladder.md)), with chat as one window into what they are doing; eventually you do not _start_ an agent so much as _check in on_ one. This is the **recommended trajectory, not the starting identity**: the conversation is primary first, and the agent becomes primary as the headline differentiators (glass-box replay + fork) land.

## The pillars

- **Agent-native (trajectory)** — agents grow into first-class, persistent entities with their own memory, schedule, and inbox; chat starts as the primary object and becomes one view among several as agents mature.
- **Local-first** — the workspace lives on your hardware, works offline, and syncs across your devices. Local-_first_, a stronger guarantee than Odysseus's local-_hosted_.
- **Privacy-first** — sensitive work is pinned to local models by policy and cannot leave the box; only explicitly blessed, non-sensitive work may reach an API.
- **Glass-box** — every agent run is recorded, replayable, and **forkable**: rewind to a decision point and branch a different path. For a tool with privileged access to your data, this is the trust mechanism.

## The wedge

The landscape ([`../research/landscape.md`](../research/landscape.md)) and the broader survey ([`../research/differentiation-opportunities.md`](../research/differentiation-opportunities.md)) show the common features — MCP, multi-provider, subagents, skills, sandboxing, approval gating, checkpoints, multi-model compare — are table stakes. The under-served space, validated by both market coverage _and_ community demand, is:

1. **Glass-box replay / fork** of agent runs.
2. **Durable local working memory** — projects that remember prior decisions, what was tried and failed, and next steps; survive context resets and follow you across devices ("resume where I left off"). The band-aid ecosystem around this (handover plugins, continuity servers, manual progress files) is the demand proof.
3. An **agent-native reactive data model** — runs, steps, and conversation state as first-class, queryable, synced collections.
4. A **fully-reactive, synced frontend** over that state — home of the "work surface" (pinned-message checklist, notes scratchpad; see [`pinned-messages-and-notes.md`](pinned-messages-and-notes.md)) and the glass-box timeline.

They share one shape: **reactive UI over synced local agent/conversation state.** Borrow freely from the landscape (scheduled agents, self-authored skills, multi-channel routing, Plan/Act approval modes, Docker sandboxing). Own the wedge.

## Not yet decided

The stack is now largely decided — see the ADRs ([`../decisions/`](../decisions/)) and the **Decided** block in [`AGENTS.md`](../../AGENTS.md) as the source of truth. Open: the **server runtime** and where **local-first sync** enters (thread #5).
