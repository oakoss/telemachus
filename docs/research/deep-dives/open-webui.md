# Deep dive: Open WebUI

- **Status:** Code-level review, 2026-06-01 (code-present, not maturity-verified)
- **Repo:** [open-webui/open-webui](https://github.com/open-webui/open-webui) — Python, ~139.6k★ (approx., gh, 2026-06-01)
- **Role:** The **category leader** telemachus most resembles (conversation-primary self-host chat workspace) — primary parity/import reference. Python → features to reimplement in TS, not a dependency.

## Architecture

FastAPI + SQLAlchemy backend, **SvelteKit** frontend, Socket.io (real-time), Redis (sessions). SQLite/Postgres + **9 vector DB backends** (Chroma/PGVector/Qdrant/Milvus/ES/OpenSearch/Pinecone/S3Vector/Oracle). AGPLv3.

## Feature inventory

- **Chat:** markdown/LaTeX, edit/delete/regenerate, reactions/feedback, folders + tags, archive, **chat-level pinning**, share links, last-read, usage stats; **clone conversation** (`/clone` w/ `branchPointMessageId`, named clone not fork); no replay-from-checkpoint
- **Workspace Notes** (separate from chat): collaborative rich notes, pinned notes, access grants, full-text search — **global/workspace-level, NOT per-conversation**
- **Models/providers:** Ollama (local+remote), OpenAI-compatible (OpenRouter/LMStudio/Mistral/Groq…), multi-backend load-balancing, custom model proxies + param overrides, per-model access control
- **RAG/knowledge:** doc library + hierarchical knowledge bases, multi-format + OCR (Tika/Docling/Mistral OCR/PaddleOCR), chunk+embed, 9 VDBs, `#` doc/URL reference in chat, hash dedup
- **Web search:** 15+ providers (SearXNG/Google/Brave/Kagi/Tavily/Perplexity/DDG/Exa…)
- **Functions/Tools/Pipelines/Filters:** write Python in-UI (Valves params, stateful KV storage, GitHub import); OpenAPI tools; **pipeline middleware** (request/response filters per model, priority-ordered); skills library
- **MCP:** HTTP servers w/ OAuth, tool + resource access
- **Image gen:** DALL-E, Gemini/Imagen, AUTOMATIC1111, ComfyUI (workflows + inpainting)
- **Voice:** STT (Whisper local/OpenAI/Azure/Deepgram), TTS (Azure/ElevenLabs/OpenAI/local + cache), hands-free voice/video call mode
- **Memory:** per-user free-form memory, vectorized recall — **per-user, NOT per-conversation; not auto-loaded on resume**
- **Prompts:** slash-command templates (versioned, params, sharing) + built-in task prompts (title/tags/follow-up/search-query/image-prompt/autocomplete/MOA)
- **Multi-user:** RBAC + fine-grained permissions, resource AccessGrants, groups, local auth + OAuth2 + LDAP/AD + **SCIM 2.0** + SSO trusted-headers, Redis multi-session
- **Channels:** real-time public/private channels + DMs, **pinned messages (channels only)**, reactions, @mentions, webhooks, Socket.io
- **Automations + Calendar:** cron-scheduled conversations (rrule), runs tracked, local calendar w/ events/recurrence/sharing, automations shown as virtual calendar events
- **Evaluations:** model comparison via feedback, **Elo leaderboards**
- **Mobile/PWA, admin/observability** (OTEL traces/metrics/logs), cloud storage (S3/GCS/Azure)

## Telemachus wedge checklist (probed)

- **(a) pinned message → checklist:** ❌ — message pinning only in channels; no checklist conversion
- **(b) per-conversation notes scratchpad:** ❌ — Notes are global/workspace, not beside the thread
- **(c) durable distilled working memory:** ◑ — per-user vectorized memory; a Chat `summary` column exists but is **unused** (never auto-loaded on resume)
- **(d) run replay + fork:** ◑ — conversation **clone** only; no message-level replay/branch

**Confirms the wedge:** the 139k★ category leader has Notes + pinning + per-user memory — but **not** the per-conversation work surface or distilled working-state resume. Whitespace holds.

## Reference patterns to reimplement (NOT a dependency)

Dual access control (resource AccessGrants + fine-grained role permissions); functions/pipelines/filters extensibility model; multi-loader RAG + VDB abstraction; cron automations + calendar; real-time channels (Socket.io); built-in task-prompt set.
