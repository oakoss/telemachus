# Idea: pinned messages + notes scratchpad

- **Author:** @jbabin91
- **Date:** 2026-06-01

## Source

A request from shadcn (on x.com) directed at "Codex, Cursor, and OpenCode":

1. **Pinned messages** — pin assistant messages to the sidebar for things to track but not address yet; render as a checklist with jump-to navigation.
2. **Notes** — a scratchpad for thoughts while working.

## Finding

None of the projects surveyed ([`../research/feature-matrix.md`](../research/feature-matrix.md)) implement either as drawn, and the broader survey ([`../research/broader-landscape.md`](../research/broader-landscape.md)) only turned up adjacent pieces. The request being aimed at OpenCode is itself evidence OpenCode lacks it. Nearest adjacencies, none of which match the per-conversation work-surface shadcn drew:

- **Notes** — **Open WebUI Notes** and **Witsy Scratchpad** are the closest existing: standalone note panels, not a per-session scratchpad beside the thread. Agent markdown-memory files (Hermes/OpenClaw) are the agent's store, not a user scratchpad. Odysseus's Notes/Tasks is a separate documents surface.
- **Pinned messages** — tools pin _conversations_, not _messages-as-checklist_. OpenCode's `todowrite` is agent-authored todos with no jump-nav.

Demand is corroborated by independent requests: an OpenAI Dev Community "Pinned Messages / Notes" thread, shadcn's X request, and a Cursor-forum "Note/Scratchpad per-Chat" thread ask for the same combination — see [`../research/differentiation-opportunities.md`](../research/differentiation-opportunities.md). (The earlier LibreChat #6743 "Pins, Notes, Variables" citation no longer resolves upstream as of 2026-06-07.)

## Why it fits Telemachus

Both are textbook reactive-collection UI — the wedge made concrete:

- **Pinned messages** → a `pins` collection (message id + label + checked state). A live query renders the sidebar checklist; selecting one scrolls to the source message; checking it is a mutation.
- **Notes** → a per-session `notes` scratchpad — a synced collection that persists with the conversation and follows you across devices.

Because the UI is driven off live queries over synced collections, this is close to free once the chat/agent data model exists. It is also a validated differentiator: an influential voice asked for it and no incumbent has it.

## Status

Committed as **Rung 2** (the work surface): schema in [`../specs/data-model.md`](../specs/data-model.md) (`pins` / `notes`), sequence in [`../specs/roadmap.md`](../specs/roadmap.md). This doc remains the origin/provenance — the shadcn request that prompted it.
