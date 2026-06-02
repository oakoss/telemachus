# Deep dive: Hermes Agent

- **Status:** Code-level review, 2026-06-01
- **Repo:** [NousResearch/hermes-agent](https://github.com/NousResearch/hermes-agent) — Python, ~176k★ (approx., gh, 2026-06-01)
- **Role:** Landscape + import source. Standouts: **messaging-channel breadth, sandbox backends, self-improving skills + skills.sh, model routing/fallback, trajectory replay.**

## Architecture

Python agent framework. CLI REPL (`prompt_toolkit`), Electron desktop (`apps/desktop`), React/Vite web (`web/`), Ink TUI (`ui-tui/`). SQLite (FTS5) state. Plugin architecture (`plugins/` with `plugin.yaml`). Nous Portal for managed models/tools.

## Feature inventory

- **Chat/UI:** CLI REPL, Electron desktop, React web SPA, Ink TUI; FTS5 history; message sanitization (credential filtering)
- **Agent loop:** ~99 built-in tools, concurrent tool execution, guardrails (idempotency/rate-limit/repeat-failure), **delegate tool (subagent spawning)**, **Kanban/swarm multi-agent board**, shared iteration budget, approval gating
- **Models:** 200+ via OpenAI/Anthropic/OpenRouter/Nous Portal/Bedrock/Azure/Mistral/etc.; **smart failover by classified error type** + credential rotation; per-provider adapters; lazy dep loading; reasoning/extended-thinking; Anthropic prompt caching; 1M-context support
- **Memory:** **agent-curated skills** (auto-generate from successful runs + self-improvement via curator daemon); FTS5 cross-session search; Honcho (dialectic user modeling); pluggable backends (Mem0/Supermemory); context engine; multi-strategy compression
- **Messaging (~25 platforms):** Telegram, Discord, Slack, WhatsApp, Signal, WeChat, WeCom, Feishu, DingTalk, Matrix, Mattermost, Teams, Email, SMS, iMessage (BlueBubbles), Home Assistant, QQ, IRC, Google Chat, ntfy, SimpleX, LINE, generic webhook + API server. Cross-platform thread continuity (same session ID across channels), webhook/polling auto-routing, media handling, rate limiting
- **Voice:** STT (faster-whisper/Mistral Voxtral/OpenAI), TTS (Edge/OpenAI/ElevenLabs + plugins); voice-memo transcription; audio streaming
- **Sandboxing (6 backends):** local, Docker, SSH, Singularity/Apptainer, **Modal** (serverless GPU), **Daytona** — Modal/Daytona give **hibernation** (sleep-when-idle); browser automation (Chromium/CDP, fingerprint spoof); macOS computer-use via MCP
- **Skills + registry:** auto-generation, self-improvement, lifecycle (active/stale/archived), 27 core + 20 optional bundles, **agentskills.io** standard, prompt-injection preprocessing
- **Scheduling:** croniter jobs, **natural-language → cron**, systemd/daemon, zero-context isolated execution
- **MCP:** server runtime + SSE, **MCP OAuth** (refresh tokens), exposes itself as a tool server, **ACP (agent-to-agent RPC)**
- **History/replay:** session storage + `/resume`, **trajectory JSONL (ShareGPT) export** for training, trajectory compression, batch generation, experimental replay/rewind
- **Auth/security:** OAuth2 (Google Workspace/GitHub), credential rotation/pool, file-safety (sandbox-escape detection), approval gates, MCP permissions, rate limiting
- **Platforms:** TUI/CLI/Electron/Android(Termux); Nix; multi-stage Docker (s6-rc, GPU); native Windows; observability plugin; achievements/gamification

## Notable imports for Telemachus

Channel breadth + cross-channel continuity; swarm/Kanban multi-agent; serverless **hibernation** (Modal/Daytona); error-classified model failover; self-improving curator skills; trajectory replay (adjacent to the glass-box wedge). Python codebase — features to re-engineer in TS, not borrow code.
