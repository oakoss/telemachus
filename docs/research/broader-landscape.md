# Broader landscape: the wider AI app space

- **Date:** 2026-06-01
- **Scope:** Survey beyond the four core projects ([`feature-matrix.md`](feature-matrix.md)), to (a) make our feature taxonomy complete and (b) see which features are already universal vs rare. Covers four adjacent categories. Companion to [`differentiation-opportunities.md`](differentiation-opportunities.md), which ranks the gaps.
- **Method & sources:** Four parallel research sweeps on 2026-06-01 across each category's READMEs, docs sites, and forums. Star counts and a few feature claims are secondary-sourced; treat as approximate. `?` = unverified.

## Category 1 — Self-hosted chat UIs / all-in-one workspaces

Apps: Open WebUI, LibreChat, Lobe Chat, AnythingLLM, big-AGI, Cherry Studio, Msty, Chatbox, Jan.

Standout features worth stealing:

- **Multi-model side-by-side / "beam"** — big-AGI (Beam), Msty (Parallel Multiverse), Open WebUI (Many Models). Run N models on one prompt, compare/merge.
- **Visual branch tree** — Msty Flowchart (graph view of the conversation tree); most others bury branches behind prev/next.
- **Editable "white-box" memory** — Lobe (user reads + edits what the agent remembers); AnythingLLM managed memories.
- **Context/request visibility** — big-AGI Inspector (see exactly what was sent), LibreChat reasoning UI.
- **Notes workspace + Channels + artifact KV store** — Open WebUI (the most complete self-hosted ChatGPT+PKM hybrid).
- **Enterprise governance** — Open WebUI (RBAC, SCIM, LDAP, OpenTelemetry) is far ahead.

## Category 2 — Local-first desktop AI & PKM assistants

Apps: Jan, Khoj, GPT4All, Reor (archived), Witsy, Letta (ex-MemGPT), Leon, Obsidian plugins (Smart Connections, Copilot for Obsidian).

Standout features worth stealing:

- **Self-editing persistent agent memory** — Letta: memory survives context eviction; reasoning + tool calls persisted to a DB (the strongest "agent that learns" model, and effectively replayable).
- **Notes scratchpad** — Witsy is one of the few with an actual scratchpad workspace.
- **Automatic semantic note-linking** — Reor (related notes with zero manual links).
- **OS-wide AI surface** — Witsy "Prompt Anywhere" / AI Commands (not trapped in one window).
- **Scheduled automations / newsletters** — Khoj.

Category-wide weakness: **true local-first sync (CRDT, offline-merge, no central server) is essentially absent** — sync is either none, server-centric, file-backup, or inherited from Obsidian.

## Category 3 — AI coding agents & IDEs (for UX cross-pollination)

Apps: Cursor, Windsurf, Zed, Cline, Roo Code, Aider, Continue, Goose, Codex CLI.

Standout agent-UX worth stealing into a general workspace:

- **Plan vs Act modes** — Cline originated it; now near-universal (read-only exploration vs full execution).
- **Smart / risk-based approval** — Goose's middle tier between manual and full-auto.
- **Boomerang / Orchestrator subtask delegation** with per-subtask context isolation — Roo Code; plus cost/request guardrails that auto-halt autonomy.
- **Learned permission policies** persisted to a file as you approve — Continue.
- **Checkpoints / rewind** of edits — Cursor, Windsurf, Zed, Cline, Roo (shadow git), Aider (git `/undo`).
- **Fork Chat + async subagent trees + Cloud Agents w/ Computer Use** — Cursor.
- **Agent Client Protocol** (host external CLI agents in-editor) — Zed.
- **Sandbox-enforced graduated approval + built-in pre-commit review agent** — Codex.

## Category 4 — Agent-builder platforms & research assistants

Apps: Dify, Flowise, n8n, Morphic, Perplexica/Vane, SillyTavern, AutoGen Studio, CrewAI Studio, Langflow.

Standout features worth stealing:

- **Live glass-box state** — Dify's Variable Inspect panel (every workflow variable's current value, in real time).
- **Tool-level human-in-the-loop** — n8n: approval bound to the tool (a gated tool can't fire without approval).
- **Replayable executions** — n8n re-runs a logged execution with the exact data per node.
- **OTel-native tracing** — AutoGen Studio, Open WebUI (interoperable observability).
- **Bidirectional MCP** — Langflow (flows consume MCP tools and expose themselves as MCP servers).
- **Bundled local search** — Morphic/Vane (self-host with SearXNG, citations + follow-ups, no external key).

## The feature universe (complete taxonomy observed)

Captured so Telemachus's feature planning starts from a complete map, not a partial one:

- **Interfaces:** web · TUI · CLI · desktop · mobile/PWA · voice (wake/talk/TTS/STT) · messaging channels · IDE · agent Canvas · OS-wide prompt
- **Conversation:** multi-turn · streaming · edit/regenerate · branching/forking (+ visual tree) · multi-model side-by-side/beam · prompt library/personas · pinned messages · notes scratchpad
- **Agents:** single/multi · subagents (trees, boomerang) · plan-vs-act · autonomy controls · background/async/cloud · scheduling/cron · recipes
- **Tools/MCP:** built-in tools · MCP client · MCP host/server · code interpreter/sandbox · web search · browser automation · computer use
- **Skills/extensibility:** skills (+ self-authored) · registry · plugins · custom commands · SDK
- **Memory:** vector/semantic · persistent agent memory (editable/white-box) · procedural · session search · knowledge graph · note-linking
- **Models:** local backends · many API providers · routing/fallback · BYO-key · subscription auth
- **Execution/sandbox:** Docker/SSH/remote · per-session isolation · hibernation
- **Permissions/safety:** approval flows (manual/smart/auto) · read-only/plan · tool-level HITL · learned permissions · sandbox-enforced
- **Domain:** email · calendar · documents/editing · deep research (citations, follow-ups, report canvas) · coding (LSP, git/PR, IDE) · image/video gen
- **Local-first/sync:** local-hosted vs local-first · offline · multi-device sync (server vs CRDT) · gateway · telemetry posture
- **Observability:** run/session history · run replay · trajectory capture · glass-box step inspection · variable/context inspector · OTel tracing · cost/usage · rewind+fork
- **RAG/knowledge:** doc chat · vector DBs · knowledge stacks/bases · web ingestion
- **Collaboration:** multi-user · RBAC · channels · sharing
- **Deployment:** Docker · native · desktop · companion apps · install methods

Snapshot as of 2026-06-01; this space moves weekly. Re-verify specifics before relying on them.
