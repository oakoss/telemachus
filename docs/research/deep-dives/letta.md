# Deep dive: Letta (MemGPT)

- **Status:** Code-level review, 2026-06-01 (code-present, not maturity-verified)
- **Repo:** [letta-ai/letta](https://github.com/letta-ai/letta) — Python, ~23k★ (approx., gh, 2026-06-01)
- **Role:** The key reference for the telemachus **durable-memory** and **glass-box** wedges. Features/architecture to reimplement in TS, not a dependency.

**Re-verified 2026-06-07:** no change — `letta-ai/letta` has been dormant since 2026-05-14 (0 commits in the window), ~23.2k★, latest release still v0.16.8 (fixes only). All 5 ◆ hold (rewind+fork still partial: conversation-fork yes, true step-rewind no; durable memory still persona-scoped, ◑). **Watch:** the _separate_ `letta-ai/letta-code` repo (active as of the 2026-06-07 re-check) edges toward durable project memory via git-backed MemFS + sleeptime reflection, but ships no scratchpad/checklist/rewind/step-fork and is out of this column's scope.

## Architecture

Stateful agent framework (formerly MemGPT). FastAPI + SQLAlchemy async ORM + **pgvector** (or Turbopuffer). Agent loop V3 (default). Python/TS SDKs, REST API, partial OpenAI-compat. "Groups" for multi-agent (incl. sleeptime).

## Memory architecture (the priority reference)

- **Core memory** — structured **editable blocks** (persona/human/notes…) rendered in every prompt; agent-editable (`core_memory_append/replace`), per-block char limits, line-numbered; optional **git-backed memFS** (hierarchical `system/persona`, `system/memories/`, diffs/commits/branches)
- **Archival memory** — vector-indexed passages (pgvector/Turbopuffer), tagged, semantic search, **shareable across agents** (Archives)
- **Recall memory** — recent-message sliding window, summarized/evicted on token budget (configurable `CompactionSettings`)
- **Sleeptime consolidation** — **background agents** (in a Group) that run after foreground turns to distill conversation into core memory (frequency-controlled, non-blocking) — the closest reference to _self-distilling_ durable memory
- Block versioning (`block_history`); conversation-scoped block overrides

## Glass-box / ADE

- **Step + Run tracking** — every LLM call = a Step (tokens/model/stop-reason/timestamps/error + metrics + provider trace), batched into Runs; REST `/v1/steps`, `/v1/runs`; step feedback (RLHF)
- **Immutable, versioned messages**, per-conversation lists; tool-call/return pairs tracked
- **Conversation fork** — branch at any point: shares prior messages (immutable, no copy), compiles fresh system prompt, continue from branch (`POST /v1/conversations/{id}/fork`)
- **Limits (vs telemachus glass-box):** NO true time-travel **rewind** (no state rollback mid-step), no step-level breakpoints, branching is conversation-level not step-level

## Other

- Agent loop V3 (non-tool returns, parallel tools, tool rules/approval, dry-run `build_request`); tools server/client-side + **MCP** (stdio/HTTP/SSE, OAuth); multi-provider + `llm_router` (auto-select); summarization (self vs external Haiku); Groups (sleeptime/workflow(dev)/broadcast); voice agents (beta); batch API; Anthropic prompt caching; Py + TS SDKs

## Telemachus wedge mapping

- **Durable working memory:** ✅ **strongest reference** — core blocks (survive shutdown, editable, resume by re-rendering) + archival (vector) + recall (compaction) + **sleeptime distillation**. Caveat: Letta's is _agent persona/fact_ memory; telemachus targets _project working-state_ ("decided/tried/next") — adapt the block + background-distill pattern to that.
- **Glass-box replay + fork:** ◑ partial — step/run inspection + provider trace + conversation fork are real references, but **no true rewind**; telemachus's "rewind to a step and fork an alternate path" goes beyond Letta.

## Reference patterns to study + reimplement (NOT dependencies)

Memory-block model (core/archival/recall split); **sleeptime background-consolidation** pattern; step/run + provider-trace schema for glass-box inspection; conversation-fork (share immutable messages + fresh system prompt); memFS git-backed memory (optional).
