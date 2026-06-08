# Deep dive: OpenCode

- **Status:** Code-level review, 2026-06-01
- **Repo:** [anomalyco/opencode](https://github.com/anomalyco/opencode) — **TypeScript/Bun**, ~168k★ (approx., gh, 2026-06-01; v1.15.x)
- **Role:** Landscape + import source + **TS design/architecture references**. Odysseus is **built on** OpenCode (confirmed by the Odysseus author, 2026-06-07; see [`odysseus.md`](odysseus.md)) — its underlying coding-agent engine. Coding depth is its focus.

## Architecture

Bun monorepo, **Effect** runtime throughout (typed errors, resource cleanup, concurrency). Drizzle + SQLite (versioned migrations). Hono HTTP API + WebSocket. TUI = OpenTUI (Solid.js). Provider layer on Vercel AI SDK. Console/cloud packages (SST + Stripe).

## Feature inventory

- **Agent modes:** **Plan (read-only)** / **Build (full-access)** / General; subagent system with **permission inheritance** (`.opencode/agent/*.md`)
- **Tools (18+):** read/write/edit, shell (PTY, cross-platform), glob/grep (ripgrep), **LSP**, git, webfetch, apply_patch, repo_overview/clone, skill/task/plan/question, truncate
- **Permission system (allow/ask/deny):** rule-based with pattern + **arity matching** (`shell("npm*")`); reply modes once/always/reject; sources config/session/env; deny-by-default; Effect error boundaries
- **Models (75+):** ProviderV2 schema over Vercel AI SDK (Anthropic/OpenAI/Google/Bedrock/Groq/Mistral/OpenRouter/Copilot/xAI/Cerebras/openai-compatible for Ollama/LM Studio/vLLM); protocol adapters (`packages/llm`); capability flags; fallback chain; keyring auth
- **LSP / code intelligence:** JSON-RPC client (diagnostics/hover/completion/definition); multi-language; `opencode debug lsp`
- **Git/PR:** clone/diff/patch, **GitHub PR creation/issues + Actions** (Octokit, GraphQL+REST), `opencode pr`
- **Sessions:** SQLite/Drizzle, cursor pagination, compaction, **resume** (`--resume`), **share** (web URLs, beta), replay state machine
- **MCP:** `@modelcontextprotocol/sdk`, auto-discovery, OAuth callback, graceful degradation
- **Skills:** Markdown (frontmatter), discovered from repo root / `.claude/` / `.agents/` / node_modules
- **IDE:** **VS Code extension** (marketplace), **Zed extension**, LSP in TUI
- **Surfaces:** TUI (OpenTUI/Solid, 550+ files), CLI (run/serve/models/pr/db/mcp/debug/acp), **Electron desktop** (beta), Astro web + SolidJS web app
- **Sandboxing:** container templates (`packages/containers`), PTY (`@lydell/node-pty` + Bun PTY)
- **Workspace adapters:** local / remote / **git worktree** (isolated per-session, auto-cleanup)
- **Observability:** structured logging, **OpenTelemetry** spans (model/provider/cost), stats/analytics
- **Auth/cloud:** OpenAuth.js (GitHub/GitLab OAuth, magic link, keyring); console (SST + Hono + Stripe, usage tracking)

## Reference patterns to study + reimplement (NOT dependencies)

Build our own, informed by these designs — do not depend on opencode packages:

- **Effect-based agent runtime** (boot/lifecycle/stream/processor) — typed errors, concurrent tools, cleanup
- **ProviderV2 + protocol adapters** (`@opencode-ai/core`, `packages/llm`) — swap backends without touching agent code
- **PermissionV2** ruleset (allow/ask/deny, arity, subagent inheritance) — the strongest tool-approval design seen
- Tool registry (schema-driven, MCP marshalling), LSP client, Drizzle session schema + migrations + replay, **MCP integration**, Hono HTTP+WS API, OpenTUI components, auto-generated SDK (OpenAPI), **git-worktree workspace adapter**
