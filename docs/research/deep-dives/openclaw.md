# Deep dive: OpenClaw

- **Status:** Code-level review, 2026-06-01
- **Repo:** [openclaw/openclaw](https://github.com/openclaw/openclaw) — **TypeScript** (Node + pnpm workspace), ~376k★ (approx., gh, 2026-06-01)
- **Role:** Landscape + import source + **TS design/architecture references** (it's TS, so the patterns are directly studyable — but reimplemented, never imported). Closest to a full "everything" personal-assistant workspace.

**Re-verified 2026-06-07:** ~377k★, very active (2,286 commits; stable v2026.6.1). New: Skill Workshop governance (propose→approve→rollback), Workboard orchestration primitives (still a Gateway-_global_ Kanban), a memory-core **"dreaming"** consolidation subsystem (persona/general → `MEMORY.md`) + memory-wiki ChatGPT-import with rollback. As the closest sibling, checked strictly: **all 5 ◆ still open** — Canvas is agent A2UI (not a user checklist/notes surface); `session-fork` is subagent context inheritance (not run rewind+fork); "dreaming" is general memory, not project working-state (stays ◑); Gateway is still WS-RPC over SQLite (no reactive synced model); zero CRDT. No matrix flips.

## Architecture

Thin core + thick plugins (136 bundled/external extensions). **Live Gateway** = control plane (WebSocket RPC, additive versioning); local-first agent loop = the product. SQLite-first state (Kysely). Native companions: macOS (Swift 6.2 menubar), iOS (Swift), Android (Kotlin). TUI via `@earendil-works/pi-tui`.

## Feature inventory

- **Agent loop** (`packages/agent-core/src/agent-loop.ts`): streaming, tool-call detect/repair, `agentLoop()` + `agentLoopContinue()`; **4 executor kinds** (core/plugin/channel/MCP); tool planner with availability filtering; multi-agent workspace isolation; session commands (`/think`, `/compact`, `/trace`, etc.); context compaction
- **Agent Canvas / Workboard:** agent-driven visual workspace (SwiftUI A2UI); multi-agent planning/run-tracking board (beta)
- **Models:** 40+ providers (Anthropic/OpenAI/Google/Bedrock/Groq/xAI/OpenRouter/Ollama/vLLM/SGLang/…); Codex via ACP; per-agent routing/failover; image gen (DALL-E/Midjourney/Runway/Imagen/…), video (Runway/Pixverse), music (Lyria/Suno/Udio); embeddings (Cohere/Voyage/OpenAI/Google)
- **Memory:** QMD storage + **LanceDB** vector + reranking; active-memory (runtime semantic expansion); memory-wiki; per-agent SQLite
- **Messaging (22+):** Discord, Slack, Telegram, WhatsApp, Signal, Google Chat, Teams, iMessage, Matrix, Feishu, LINE, Mattermost, Nextcloud Talk, IRC, Nostr, Synology, Tlon, Twitch, Zalo, WeChat, QQ, WebChat — channel-plugin SDK (transport abstraction), DM pairing/allowlist, thread binding, draft streaming
- **Voice:** wake word (Swabble, iOS/macOS), continuous Talk (OpenAI Realtime relay), Deepgram streaming STT, TTS (ElevenLabs/OpenAI/Azure/system)
- **Sandboxing:** Docker (default) / SSH tunnel / **OpenShell (NVIDIA, GPU)**; per-agent policy, tool allow/deny
- **Skills + ClawHub:** bundled/workspace/managed(npm) skills; **Skill Workshop** (proposal→approval flow with preview/rollback); public registry clawhub.ai
- **Scheduling:** SQLite cron jobs, inbound webhooks, Gmail Pub/Sub push
- **MCP:** client (stdio/SSE) **and host/server** (`createOpenClawChannelMcpServer` exposes Gateway channels as MCP tools)
- **Multi-device (Nodes + Gateway):** device pairing (setup codes/QR), per-node capabilities (Voice/Camera/Screen), Gateway WebSocket RPC relay
- **Web/integrations:** web search (Brave/DDG/Tavily/Exa/SearXNG/Perplexity), web fetch/readability, document extract (PDF/DOCX), Google OAuth (Gmail/Sheets/Docs/Calendar)
- **Auth/security:** OAuth + device-code + API key; security audit modules; SQLite secret storage (SecretRef); DM pairing safety; sandbox isolation
- **Misc:** activity logs (GitHub audit), error tracking (cluster + replay), OTEL metrics, i18n, link understanding, artifact browser (inline image/video/PDF)

## Reference patterns to study + reimplement (NOT dependencies)

We build our own; these are design references only, never imports:

- `packages/agent-core` — composable streaming **agent loop** + tool-repair
- **Tool planner / 4-executor model** (core/plugin/channel/MCP)
- `packages/gateway-protocol` — WebSocket RPC + **multi-device sync** (node pairing, session relay)
- **MCP host bridge** (channel commands → MCP stdio)
- Channel plugin SDK (22+ transport adapters), Swabble wake-word lib, media-core, markdown-core (skip-on-stream), tool-call-repair, Kysely SQLite patterns, Zod config + doctor auto-migration
