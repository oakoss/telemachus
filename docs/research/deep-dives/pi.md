# Deep dive: pi

- **Status:** Code-level review, 2026-06-01
- **Repo:** [earendil-works/pi](https://github.com/earendil-works/pi) — **TypeScript** (Biome, tsgo), ~58.7k★ (approx., gh, 2026-06-01; v0.78.0)
- **Role:** Import source + **the strongest "reusable library" reference** — pi ships **4 independently npm-published packages** (study and reimplement, not consume). Web UI + Slack bot live in a separate repo, `earendil-works/pi-chat`.

**Re-verified 2026-06-07:** ~60.7k★ (+~2k), v0.78.1, 59 commits — maintenance-class: provider coverage (ZAI CN, Ant Ling, NVIDIA NIM, MiniMax-M3), OpenRouter/Bedrock/OpenAI-Responses compat hardening, project trust gating, a cache-hit-rate footer. No ◆ movement; no matrix flips (trust gating reinforces but doesn't lift the ◑ on tool-approval/sandboxing).

## Architecture

Monorepo of focused, published packages. **Biome** (not oxlint) for lint/format; **tsgo** compiler; TypeBox schemas; ES2022/Node16; `erasableSyntaxOnly` + `rewriteRelativeImportExtensions`. Supply-chain hardening (exact pins, npm shrinkwrap, min-release-age). Tool-calling **native (no MCP)**.

## The four packages (all published, full types + sourcemaps)

| Package                               | What it is                                                                                                                                                                                                                                                                                                                                                          | Maturity (as a reference)    |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| **`@earendil-works/pi-ai`**           | **Unified multi-provider LLM API** — 27+ providers (Anthropic/OpenAI/Gemini/Vertex/Mistral/Groq/Cerebras/Bedrock/xAI/OpenRouter/Cloudflare/openai-compatible…); streaming + partial-JSON tool-calling, thinking levels, image I/O, **OAuth (subscription + device-code)**, model auto-discovery + metadata, cross-provider mid-session handoff, cost/token tracking | Production-grade             |
| **`@earendil-works/pi-agent-core`**   | **Agent loop + harness** — `Agent`, `runAgentLoop()`/`Continue`, `AgentHarness` (prompts/skills), session repos (JSONL/Memory), compaction + branch summaries, skills loader. Transport-agnostic (pluggable `convertToLlm`, hooks)                                                                                                                                  | Production-grade             |
| **`@earendil-works/pi-tui`**          | **Terminal UI framework** — differential rendering, CSI-2026 synchronized output, components (Text/Editor/Markdown/SelectList/Image/…), themes, autocomplete, Kitty/iTerm2 inline images. _(OpenClaw depends on this.)_                                                                                                                                             | Production-grade, standalone |
| **`@earendil-works/pi-coding-agent`** | The `pi` CLI + SDK — interactive TUI / print / JSON / **RPC (JSONL)** / embeddable SDK; extension system (lifecycle hooks, tool registration/overrides, slash commands, UI widgets/overlays, EventBus); built-in tools (read/write/edit/bash/find/ls/grep)                                                                                                          | CLI + SDK (`./hooks` export) |

## Feature inventory (highlights)

- **Agent CLI/loop:** interactive/print/JSON/RPC/SDK modes; sessions with **branching/forking/cloning/tree nav**; compaction w/ custom instructions; HTML export + GitHub gist sharing; hot-reload (keybindings/extensions/skills/prompts); `/login /model /compact /export /tree /fork /reload`
- **Tools:** built-ins with diff preview + truncation guards; extension-registered custom tools + overrides (TypeBox schemas)
- **LLM API:** see `pi-ai` above — the most complete standalone provider abstraction in the survey, with subscription-OAuth (Claude Pro/Max, ChatGPT, Copilot)
- **Skills:** Markdown (frontmatter `name`/`description`/`disable-model-invocation`), `/skill:name`, ignore-file support
- **Extensibility:** `onSessionStart/onMessage/onToolExecution/onCompaction`, command/keybinding/UI registration, EventBus, prompt templates, themes (hot-reload)
- **Not present here:** MCP (tool-calling native), vLLM pod manager (point at self-hosted via openai-compatible), web UI / Slack (separate `pi-chat` repo)

## Why pi matters for telemachus

pi is the strongest **design reference** for the hardest all-TS parts: `pi-ai` (provider abstraction), `pi-agent-core` (agent loop / sessions / compaction), and `pi-tui` demonstrate clean, proven TS API shapes — and that this domain factors cleanly into focused packages.

**Telemachus builds its own — it does not consume these packages.** The wedge (reactive synced collections) needs the agent loop + LLM layer wired directly to our data model, not a black-box dependency. Use pi as an **API-design + architecture reference to study and reimplement**, never a dep. (Biome not oxlint, no MCP, no reactive/sync model — all independently push toward a from-scratch build.)
