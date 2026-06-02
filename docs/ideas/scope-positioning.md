# Scope & positioning: what Telemachus is first

- **Status:** Decided (scope), 2026-06-01
- **Author:** @jbabin91
- **Related:** [`thesis.md`](thesis.md), [`../research/feature-matrix.md`](../research/feature-matrix.md), [`../research/missing-features.md`](../research/missing-features.md), [`../research/community-requests.md`](../research/community-requests.md), [`../research/deep-dives/`](../research/deep-dives/), [`../research/differentiation-opportunities.md`](../research/differentiation-opportunities.md), [`../specs/roadmap-ladder.md`](../specs/roadmap-ladder.md), [`pinned-messages-and-notes.md`](pinned-messages-and-notes.md)

## The question

The research docs answer **how** Telemachus differs (the wedge). They did not answer **what it is first, and for whom**. This doc records that decision and its reasoning (open thread #1 from the 2026-06-01 handoff).

## The decision

**Telemachus is, first, a personal local-first chat + agent hub — built for its author, with product ambition optional and later.**

- **Why it exists:** a tool with [Odysseus's](../research/landscape.md) capabilities, rebuilt on a stack the author owns and wants to extend (**TypeScript / TanStack**), and made _better_ by closing Odysseus's gaps.
- **Primary object:** the **conversation**. First thing it's best at: the **work surface** (pinned-message checklist + notes scratchpad).
- **Optimization target:** _a better tool for the author_ — not adoption.
- **Decided now:** personal-first; conversation-primary; scope = parity + wedge + best-of-breed imports (below); built wedge-first.
- **Recommended trajectory (not the starting identity):** agent-native — agents become first-class at Rung 4+, glass-box replay + fork at Rung 5. See [`thesis.md`](thesis.md).

## Constraints (decided)

- **Free / open-source only.** No paid or hobby-tier SaaS dependencies — it's a hobby project; the author won't pay to run it. Prefer OSS that self-hosts; avoid any tool whose only viable path is a paid/limited cloud tier. Applies to every tech/dependency choice and ADR.
- **Self-hosted on own infra.** Deployment target = the author's **Proxmox** server (a **Coolify** VM, or a dedicated LXC). Model serving (Ollama/vLLM/llama.cpp), sync server, DB, and app all run there — no external hosting bills.

## Scope: three concentric rings

1. **Parity** — Odysseus's feature surface (chat, agent, cookbook, deep research, compare, documents, memory/skills, email, notes/tasks, calendar, mobile, extras). Built because the author _uses_ it. Accreted over time, not up front.
2. **The wedge (net-new — nobody ships it)** — work surface, durable distilled working memory, glass-box rewind+fork, agent-native reactive data model, local-first sync. **Validated across 10 code-level deep dives** (none ship them) with cross-community demand provenance for the work surface. The part that makes Telemachus distinct, not a port. Detailed in [`../research/missing-features.md`](../research/missing-features.md) (Tier 1) + the ◆ rows of [`../research/feature-matrix.md`](../research/feature-matrix.md).
3. **Best-of-breed imports** — capabilities proven in the surveyed projects (Odysseus, Open WebUI, LibreChat, Lobe Chat, Hermes, OpenClaw, Letta, OpenCode, t3code, pi) that the parity baseline lacks. Sourced from [`../research/missing-features.md`](../research/missing-features.md) (Tier 2) + [`../research/community-requests.md`](../research/community-requests.md). **References only — studied and reimplemented, never imported as dependencies** (build-our-own, all-TypeScript).

**Build order:** wedge-first (cheap, demoable, motivating), with rings 1 and 3 accreted on the TanStack spine **by personal need** — pulled by what the author actually reaches for, not by parity pressure.

## Build-our-own + the demand-validated basics

- **References, not dependencies.** Every surveyed project — including the TypeScript ones (OpenClaw, OpenCode, t3code, pi) — is an API-design / architecture reference to **study and reimplement**. Telemachus is built from scratch in TypeScript; no third-party agent / LLM / TUI library becomes a core dependency. (Deep dives: [`../research/deep-dives/`](../research/deep-dives/).)
- **Cover the loud table stakes.** The demand sweep ([`../research/community-requests.md`](../research/community-requests.md)) shows the loudest asks are **chat organization (folders/projects), cost/usage visibility, and voice input** — fold these into early rungs even though they don't differentiate.
- **Deprioritize multi-user.** The other loud demand (admin / teams / RBAC / SSO) is **off the personal-first identity** — skip until/unless the optional product path opens.

## Why "personal-first" makes parity safe

A general hub at feature parity is, _for a product aimed at strangers_, "a feature-parity slog you'd lose." **Personal-first neutralizes the critique:** the author is the user, so the payoff is owning the tool, in a stack he loves, extensible by him. Parity is a fine goal because he uses the features; "better stack" is valuable _to him_ even though it's invisible to outsiders. The competitive frame doesn't apply until the optional "product later" path is taken.

## The real risk (revised)

Not "losing to incumbents" — it's **one-person scope and time**. Three concentric rings is a large surface for a solo passion project. Managed by:

- **Wedge-first ordering** — something worth using exists long before parity lands.
- **Demand-pulled accretion** — build a parity/import feature when the author actually wants it, not to complete a checklist.
- **Reusing the research** — rings 2 and 3 are already sourced; no fresh survey needed before building.

## Framing: the "primary object" cut

"What is it first" reduces to: **what do you open the app to?** Each wedge cluster implies a different primary object and home screen. (Competitor column is _reference, not threat_, given personal-first.)

| Primary object              | Home screen                | Flagship feature                 | Reference points                |
| --------------------------- | -------------------------- | -------------------------------- | ------------------------------- |
| **Conversation** _(chosen)_ | a chat with a work surface | the work surface (Rung 2)        | LibreChat, Open WebUI, Odysseus |
| Project                     | a workspace that remembers | durable memory / resume (Rung 6) | PKM tools, Cursor resume        |
| Agent                       | a roster of running agents | glass-box replay + fork (Rung 5) | Letta ADE, dev observability    |

The [thesis](thesis.md) bets **agent** as the _destination_; the roadmap's cheapest first win is **conversation**; the strongest local-first flagship is **project**. We start at **conversation** because Rungs 1–2 need zero agent machinery and produce a visible win fastest, and _move toward_ agent-native as the headline rungs land.

## Positioning against Odysseus (the predecessor)

Odysseus is the reference point; its actual shape confirms the bet:

- **Odysseus is itself conversation-primary + general.** Its start screen is a new-chat composer with an **Agent / Chat toggle** and a model picker, over a sidebar of destinations (Search, Chats, Email, Tools, Calendar, Compare, Cookbook, Deep Research, Gallery, Library, Brain, Notes, Tasks, Theme). Agent vs chat is a **mode of a message**, not a first-class object — the "chat-native with agents bolted on" the thesis critiques.
- **Telemachus's starting shape deliberately resembles Odysseus** (that's the parity goal) but on **TypeScript / TanStack** instead of Odysseus's Python/ChromaDB/vLLM world. Distinction comes from (a) the **in-thread work surface**, (b) **best-of-breed imports**, and (c) the **agent-native trajectory** Odysseus does not pursue.
- **The work surface is genuinely distinct.** Odysseus has **Notes** and **Tasks** as _separate sidebar destinations_. Telemachus's work surface is **pins + notes beside the active thread** — a per-conversation surface, not a standalone panel. The Tier-1.1/1.2 gap the research found; Odysseus does not close it.
- **Memory contrast (input to thread #4):** Odysseus does _vector recall_ (ChromaDB / fastembed). Telemachus's Rung-6 bet is _distilled working state_ ("what was decided / tried / next"). That distinction is the differentiator, not raw retrieval.

## The stack as motivation

The stack is no longer a neutral recommendation — **"better stack" is part of the _why_.** **TypeScript is the lane** (vs Odysseus's Python). The **data layer is decided:** TanStack DB + ElectricSQL + PGlite ([ADR-001](../decisions/001-data-layer-tanstack-db-electric-pglite.md)), after the 4-candidate evaluation in [`../research/stack-data-layer.md`](../research/stack-data-layer.md). The **rest of the stack** (TanStack Start/Router, a React UI / component layer, the server runtime, the model/LLM layer) **remains recommended, not committed** — each gets its own ADR when something depends on it. See [`thesis.md`](thesis.md).

## How this resolves open roadmap questions

- **Roadmap open Q** ([roadmap-ladder](../specs/roadmap-ladder.md), _Open questions_): "Does Rung 2 need the agent/run model?" → **No. Ship chat-only.** Starting data spine: `conversations / messages / pins / notes`. The agent/run model arrives at Rung 4 when the trajectory demands it.

## Still open (not decided here)

- **Consolidated feature inventory — done.** [`../research/missing-features.md`](../research/missing-features.md) (rings + provenance + build-risk), the rebuilt [`../research/feature-matrix.md`](../research/feature-matrix.md) (10-project comparison), and [`../research/community-requests.md`](../research/community-requests.md) (demand) now cover it.
- Data model / collection schema beyond the Rung 1–2 chat spine (thread #2). **Natural next thread** — the wedge rides on it.
- Glass-box "fork" semantics (thread #3).
- Durable working-memory design — distilled working state vs. vector recall (thread #4).
- Where local-first sync enters (thread #5).
- **Stack:** the **data layer is decided** ([ADR-001](../decisions/001-data-layer-tanstack-db-electric-pglite.md): TanStack DB + Electric + PGlite); the **rest** (app framework, UI layer, runtime, model layer) remains _recommended, not committed_.
