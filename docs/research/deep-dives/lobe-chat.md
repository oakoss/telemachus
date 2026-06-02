# Deep dive: Lobe Chat

- **Status:** Code-level review, 2026-06-01 (code-present, not maturity-verified)
- **Repo:** [lobehub/lobe-chat](https://github.com/lobehub/lobe-chat) — **TypeScript** (Next.js), ~78k★ (approx., gh, 2026-06-01)
- **Role:** Import source + **TS design references** (study + reimplement, never a dependency). Standout: the most developed **editable/white-box memory** in the survey.

## Architecture

Next.js app; **Drizzle ORM** with **hybrid search (BM25/ParadeDB + vector cosine)**, PGlite fallback for local. **Zustand** modular slice stores (class-based action slices, shallow-equality subscriptions). tRPC service layer (lambdaClient). Electron desktop + PWA. better-auth.

## Feature inventory

- **Chat:** per-agent main conversation + persisted **topics**; **message threads** (Continuation/Standalone/Isolation) with fork-from-message; nested messages (parentId); Lexical rich-text editor; artifact rendering (Code/React/Python/HTML portals); message TTS/translation; "Ask AI" page-selection context capture
- **Agents/marketplace:** agent marketplace (per-locale), **agent groups** (hierarchical, supervisor orchestration, agent↔agent via sub_agent scope), 50+ built-in agents, inline agent builder, agent eval (benchmark + **trajectory replay**)
- **Models/providers:** multi-provider via agent-runtime + model-bank; OpenAPI provider config w/ OAuth; LLM tracing (tokens/cost/latency)
- **Tools/MCP:** MCP (http/stdio/cloud gateway; desktop IPC for stdio); 50+ built-in tools (Calculator, Claude Code, Cloud Sandbox, Memory, …); custom plugins; tool-call telemetry; market discovery
- **Knowledge/RAG:** knowledge-base CRUD, file uploads + async extraction queue, file-loaders (PDF/MD), RAG eval, cloud storage
- **Memory (white-box — the standout):** see below
- **Image gen / Voice:** cloud image service (batch); message-level TTS; STT via Web Audio
- **Multi-user/sync:** better-auth + OAuth (Casdoor webhooks); per-user data isolation; PostgreSQL **or PGlite (local-first capable)**; Electron + PWA (offline service worker)
- **Misc:** Brief system (Decision/Error/Insight/Result task cards w/ Confirm/Retry actions), notebooks (code exec), task manager (side-panel task scope), i18n (40+), PostHog analytics, BM25+vector full-text search, web browsing + Python sandbox

## Editable / white-box memory (Tier-2 wedge-adjacent)

**Five-layer model** (base `UserMemory` + per-layer tables), all editable with tags/metadata/status/merge-strategies + access metrics + hybrid search:

1. **Context** — current situation, scope, urgency/impact scores, subjects/objects
2. **Activity** — events w/ narrative, **notes**, feedback, time range, status
3. **Experience** — Situation→Action→Outcome + keyLearning + confidence
4. **Identity** — self/other/org, role, relationship, episodic date (global identities injected into chat context)
5. **Preference** — conclusion directives, priority scores, suggestions
   Plus **persona generation** (distilled summary from identity + experience). This is a strong reference for telemachus's durable-memory wedge — though Lobe's is a _user-modeling_ memory, not the _project working-state_ ("what was decided/tried/next") telemachus targets.

## Telemachus wedge checklist (probed)

- **(a) pinned messages → checklist:** ❌ — only agent/group pinning, not message-level
- **(b) per-conversation notes scratchpad:** ◑ partial — Activity layer has a `notes` field, but not a per-thread UI scratchpad
- **(c) durable distilled working memory:** ✅ — Context layer + persona distillation (user-modeling flavor)
- **(d) run replay + fork:** ◑ partial — agent trajectory replay (eval) + message fork via threads; not a unified rewind+fork of a run

## Reference patterns to study + reimplement (NOT dependencies)

- **5-layer editable memory schema** (base + typed child tables, editable metadata, hybrid retrieval) — closest reference for a white-box, user-editable memory store
- **Scope-driven message-map keys** (`{scope}_{scopeId}[_{topicId}][_{subTopicId}]`) for main/thread/group/sub-agent/task conversations
- Thread-branching model (Continuation/Standalone/Isolation, sourceMessageId/parentThreadId)
- Zustand modular-slice store pattern; Drizzle + BM25/vector hybrid search with PGlite local fallback (relevant to telemachus's local-first/pglite lean)
- Brief system (async task coordination cards)
