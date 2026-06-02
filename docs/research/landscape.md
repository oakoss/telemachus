# Landscape: existing self-hosted AI workspace & agent projects

- **Date:** 2026-06-01
- **Scope:** Survey of active projects in the self-hosted / local-first AI workspace and agent space, to understand what already exists, what patterns recur, and where the gaps are. Informs Telemachus's direction; commits to nothing.
- **Sources:** GitHub repositories and project sites, fetched 2026-06-01 (linked inline).
- **Note:** the initial 4-project narrative pass (Odysseus + Hermes / OpenClaw / OpenCode). The survey later widened to **10** code-level deep dives — see [`feature-matrix.md`](feature-matrix.md) (10-project grid) and [`broader-landscape.md`](broader-landscape.md) (adjacent categories) for the complete picture. This doc stays the depth read on those four.

## Odysseus — the reference project

[`pewdiepie-archdaemon/odysseus`](https://github.com/pewdiepie-archdaemon/odysseus) — the project Telemachus is a spiritual successor to. Not a competitor we are reacting to; the starting point we are reimagining from.

- **What it is:** Self-hosted AI workspace pitched as a privacy-first, local-first alternative to ChatGPT/Claude. MIT. Note: the repo is very new (created 2026-05-31); its ~20k stars reflect the creator's existing audience, not codebase maturity — treat the whole project as pre-release and its feature list as intent.
- **Stack:** Python 3.11+ / FastAPI backend; vanilla JS frontend (~49% of the repo), static HTML/CSS, PWA. ChromaDB + fastembed (ONNX) for vector memory. Model serving via vLLM, llama.cpp, Ollama, OpenRouter, OpenAI. Built on OpenCode (`anomalyco/opencode`) as its underlying agent loop — so it layers on another project in this survey.
- **Features:** chat + agents, deep research, model comparison, document editing, vector memory/skills, email (IMAP/SMTP) triage, calendar/tasks (CalDAV), MCP servers, mobile PWA.
- **Read for Telemachus:** the Python backend is well-suited to the ML ecosystem and worth learning from; the monolithic vanilla-JS frontend is the part most likely to strain at this feature density. The thesis to _succeed_ (not copy) is in [`../ideas/thesis.md`](../ideas/thesis.md).

## Comparable active projects

### Hermes Agent (Nous Research)

[`nousresearch/hermes-agent`](https://github.com/nousresearch/hermes-agent) — a self-improving agent framework. Python (~85%) / TypeScript (~11%).

- **Distinctive:** a learning loop — the agent authors skills from experience and refines them during use, with procedural memory persisting across sessions.
- **Ideas worth taking:** self-authored (not just human-written) skills; scheduled/cron agents that wake on their own; subagent spawning for parallel work; isolated execution backends (local/Docker/SSH/Modal/Daytona) with hibernation between sessions to avoid idle cost; conversation search with LLM summarization.

### OpenClaw

[`openclaw/openclaw`](https://github.com/openclaw/openclaw) — a local-first personal AI assistant. Node 24+ / TypeScript / pnpm. The closest sibling to Telemachus's thesis.

- **Distinctive:** a unified control plane over messaging channels (WhatsApp/Telegram/Slack/Discord/20+) routed through a local Gateway, plus an agent-driven Live Canvas.
- **Ideas worth taking:** multi-channel inbox as a first-class concept; channel → agent routing with per-agent isolation (Docker-sandboxed non-main sessions); the agent Canvas (a visual workspace, not just a chat log); voice wake + Talk Mode; companion apps (macOS menu bar, iOS, Android); a skills system with a registry.

### OpenCode

[`anomalyco/opencode`](https://github.com/anomalyco/opencode) — an open-source AI coding agent. TypeScript (~66%), Turborepo monorepo, Node/Bun. ~168k stars.

- **Distinctive:** a dual-agent model — a full-access **Build** agent and a read-only **Plan** agent that asks permission before running commands, toggled with Tab.
- **Ideas worth taking:** the Plan/Build approval split (a proven safety UX); a dedicated subagent for complex searches; the Turborepo + Bun monorepo structure; desktop-app distribution.

## Cross-cutting signals

Patterns that recur across multiple projects — strong signal they are table stakes, not differentiators:

| Pattern                           | Hermes             | OpenClaw | OpenCode        |
| --------------------------------- | ------------------ | -------- | --------------- |
| MCP as the extensibility spine    | ✅                 | ✅       | ✅              |
| Multi-provider (incl. OpenRouter) | ✅                 | ✅       | ✅              |
| Subagent spawning                 | ✅                 | ✅       | ✅              |
| Skills + registry                 | ✅ (self-authored) | ✅       | —               |
| Sandboxed execution (Docker)      | ✅                 | ✅       | ✅              |
| Permission / approval gating      | —                  | ✅       | ✅ (Plan/Build) |
| TS / Bun / pnpm / Turborepo       | partial            | ✅       | ✅              |

## Gaps observed

What none of the surveyed projects appear to do — the open space Telemachus could own:

- **Glass-box agent runs** — rewinding an agent run to a decision point and _forking_ an alternate path. The projects stream agent activity; none treat a run as a replayable, branchable record.
- **Agent-native reactive data model** — treating runs/steps as first-class, queryable, synced state rather than transient chat/canvas output.
- **Fully-reactive, synced frontend over agent state** — offline-capable live queries across agent activity, rather than a chat-plus-channels UI.

These observations feed the positioning in [`../ideas/thesis.md`](../ideas/thesis.md). Snapshot as of 2026-06-01; these projects move, so re-check before treating any gap as durable.
