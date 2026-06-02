# Feature matrix: Odysseus, Hermes Agent, OpenClaw, OpenCode

- **Date:** 2026-06-01
- **Scope:** Granular, category-by-category comparison of the four projects surveyed in [`landscape.md`](landscape.md) — what differentiates them, and where the whitespace is. Companion to the narrative survey.
- **Method & sources:** Compiled from per-project inventories gathered 2026-06-01 from each project's README, docs site, and release history (Odysseus repo + landing page; `nousresearch/hermes-agent` + docs; `openclaw/openclaw` + docs.openclaw.ai; `anomalyco/opencode` + opencode.ai/docs).
- **Confidence:** Star counts and some feature claims are as-reported from marketing/secondary sources and flagged; `?` marks unverified. Odysseus is ~2 days old (created 2026-05-31), so its feature list is best read as intent, not shipped maturity.

Legend: ✅ yes · ◑ partial/adjacent · — no · ? unverified

| Capability                           | Odysseus              | Hermes            | OpenClaw                | OpenCode          |
| ------------------------------------ | --------------------- | ----------------- | ----------------------- | ----------------- |
| Web UI                               | ✅                    | ✅                | ✅                      | ◑ newer           |
| TUI                                  | —                     | ✅ new            | ✅                      | ✅ primary        |
| CLI                                  | —                     | ✅                | ✅                      | ✅                |
| Desktop app                          | ◑ macOS               | —                 | ✅ menubar              | ◑ beta, newest    |
| Mobile                               | ✅ PWA                | ◑ Termux          | ✅ iOS/Android          | —                 |
| Voice                                | —                     | ✅                | ✅ wake/talk            | —                 |
| Messaging channels                   | ◑ notify only         | ✅ 23             | ✅ 20+                  | —                 |
| IDE integration                      | —                     | ◑ MCP             | ◑                       | ✅                |
| Agent Canvas                         | —                     | —                 | ✅                      | —                 |
| Multi-agent / subagents              | ?                     | ✅ Kanban swarm   | ✅ routing              | ✅ Plan/Build + 3 |
| Scheduling / cron                    | ✅                    | ✅                | ✅                      | ◑ GH Actions      |
| Read-only / plan mode                | ◑ roles               | ◑                 | ◑                       | ✅ Plan/Build     |
| MCP client                           | ✅                    | ✅                | ✅                      | ✅                |
| MCP host / server                    | ✅                    | ✅                | ✅                      | —                 |
| Skills (self-authored)               | ✅                    | ✅                | ✅                      | ✅                |
| Skills registry                      | —                     | ✅ skills.sh      | ✅ ClawHub              | ◑ community       |
| Vector memory                        | ✅ Chroma             | — FTS             | ✅ hybrid               | ◑                 |
| Session search                       | ?                     | ✅ FTS5           | ✅                      | ?                 |
| Local models (Ollama/vLLM/llama.cpp) | ✅                    | ✅                | ✅                      | ✅                |
| Many API providers                   | ◑ 2 core              | ✅ 300+           | ✅ 40+                  | ✅ 75+            |
| Model routing / fallback             | ?                     | ✅                | ✅                      | ◑                 |
| Sandboxed execution                  | ◑                     | ✅ 6 backends     | ✅ Docker/SSH/OpenShell | ◑                 |
| Hibernation                          | —                     | ✅                | ?                       | —                 |
| Approval flows                       | ◑ roles               | ✅                | ✅                      | ✅ allow/ask/deny |
| Email                                | ✅                    | ◑ channel         | ✅                      | —                 |
| Calendar                             | ✅ CalDAV             | ?                 | ✅                      | —                 |
| Documents / editing                  | ✅                    | ◑                 | ✅                      | ◑ code            |
| Deep research                        | ✅                    | ◑                 | ✅                      | —                 |
| Coding depth                         | ◑ (built on OpenCode) | ✅                | ✅                      | ✅ focus          |
| Multi-device sync                    | ◑ server+PWA          | ◑ cross-channel   | ◑ nodes+Gateway         | ◑ share links     |
| True local-first CRDT sync           | —                     | —                 | —                       | —                 |
| Run / session history                | ?                     | ✅                | ✅                      | ✅                |
| Run replay                           | —                     | ✅ trajectory     | ◑ backfill              | ◑ share           |
| Rewind + fork a run                  | —                     | ◑ session lineage | —                       | ◑ git undo        |
| Glass-box replay + fork              | —                     | —                 | —                       | —                 |
| Pinned messages (shadcn ①)           | —                     | —                 | —                       | —                 |
| Notes scratchpad (shadcn ②)          | ◑ separate            | ◑ agent files     | ◑ agent files           | —                 |

## Corrections to the narrative survey

- **Odysseus is built on OpenCode** (`anomalyco/opencode`) — it uses OpenCode as its underlying agent loop. Two projects in this survey, one layered on the other.
- **Odysseus is extremely young** — repo created 2026-05-31; ~20k stars reflects the creator's audience, not codebase maturity. Read its feature list as intent.

## Inter-project gaps (who owns what)

- **Coding** → OpenCode owns it (Plan/Build, LSP, git/PR, IDE). The others are generalists.
- **Channel breadth + agent swarms** → Hermes (23 channels, Kanban) and OpenClaw (20+, Workboard).
- **"Everything personal assistant"** → OpenClaw is closest to the full workspace.
- **Productivity domain** (email/calendar/docs/research) → Odysseus and OpenClaw.
- **Self-improving skills** → Hermes strongest, then OpenClaw/Odysseus.

## Whitespace — what no one does well

The open space a new project could own:

1. **Glass-box replay + fork** of agent runs (session lineage and git-undo are adjacent, not it).
2. **Agent-native reactive data model + fully-reactive synced frontend.**
3. **True local-first CRDT multi-device sync** (all are server+clients or share-links).
4. **Pinned messages as a checklist + jump-nav** (shadcn ①).
5. **In-context notes scratchpad** (shadcn ②).

## Implications for Telemachus

Gaps 1, 2, 4, and 5 are the _same shape_ — reactive UI over synced agent/conversation state, which is the wedge in [`../ideas/thesis.md`](../ideas/thesis.md). The shadcn-sourced pair is detailed in [`../ideas/pinned-messages-and-notes.md`](../ideas/pinned-messages-and-notes.md). Snapshot as of 2026-06-01; these projects move fast — re-check before treating any gap as durable.
