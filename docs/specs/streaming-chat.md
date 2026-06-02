# Spec: streaming chat, end-to-end (R1)

- **Status:** Draft
- **Date:** 2026-06-02
- **Authors:** @jbabin91
- **Related:** [`scaffold.md`](scaffold.md) (E0 precursor), [`data-model.md`](data-model.md) (schema), [ADR-001](../decisions/001-data-layer-tanstack-db-electric-pglite.md) (data layer + SQLite amendment), [ADR-004](../decisions/004-auth-better-auth.md) (auth), [ADR-006](../decisions/006-model-llm-layer.md) (model/LLM), [ADR-008](../decisions/008-architecture-and-topology.md) (topology), [`foundations.md`](foundations.md). bd epic: `telemachus-1or`.

## Overview

The first vertical slice: a user message goes to a local model (Ollama via TanStack AI), streams back into the UI, and the **finished** message settles into a TanStack DB collection (SQLite-persisted) that survives reload. Proves the whole spine end-to-end — auth → request → BFF → `core` → LLM → SSE stream → client state → persisted, queryable local row. Nothing else (no tools, no work surface, no agent/run model).

## Scope

**In:**

- **Minimal Better Auth** ([ADR-004](../decisions/004-auth-better-auth.md)) — a real session (email/password is fine) so `ownerId` is a genuine user on every row from day one. Auth tables in **server Postgres** via the Drizzle adapter.
- **Chat-spine tables** ([data-model.md](data-model.md)): `conversations`, `messages`, `parts` — with the foundations baked in (UUIDv7 ids, `ownerId`, UTC `updatedAt`, `deletedAt`). **Parts: `text` (+ `reasoning` if the model emits it) only.**
- **The streaming path:** browser `useChat` → Start server fn (BFF; verifies session) → in-process Hono `core` → `chat({ adapter: ollama, messages })` → `toServerSentEventsResponse` → BFF passes the stream through verbatim. Model selection via `forwardedProps` (Ollama default, OpenAI-compatible).
- **Streaming → persistence boundary:** in-flight tokens live in **client state** (`useChat` / `@xstate/store`); on `RunFinished`, write the finalized user + assistant `messages` and their `parts` to the local TanStack DB collection (SQLite). The rendered thread = **persisted messages (live query) ⊕ the in-flight streaming message**.
- **Stop/abort:** a stop button — `AbortController` threaded browser → BFF → `core` → `chat({ abortController })` → Ollama halts.
- **Error states:** model unreachable, stream dropped mid-way. On error, discard the transient in-flight message and surface the error (no partial persisted in R1 — see Open questions).
- **Conversation create + list**, linear append (`parentId` set linearly, `currentMessageId` = latest), a minimal `config` (`{ provider:'ollama', model, temperature? }`).

**Out (later rungs):**

- Work surface (pins/notes) → R2 · tools + approval → R3 · `runs`/`runSteps` → R4 · branching/fork UI → R5 · durable memory → R6.
- **Electric / server-side chat sync → deferred.** R1 chat data is **local-only** (SQLite); the server is used only for the **LLM proxy** + **auth**. The data-model write-path (TanStack DB mutation → write API → Postgres → Electric) lands at the sync rung; R1 persists locally.
- Conversation auto-titling, attachments, multi-model compare.

## Architecture

Builds on E0's packages. Two server uses (LLM proxy, auth); chat data stays on-device.

- **`apps/web` (Start BFF):** `useChat` client + a `/api/chat` server fn that authenticates (Better Auth), then calls the in-process `core` and **returns the SSE `Response` verbatim** (no buffering — Coolify/Traefik must not buffer `text/event-stream`).
- **`packages/core` (Hono, in-process):** owns the `chat()` call + the Ollama adapter (the build-our-own loop starts here, trivial at R1: one model call, no tools). Pure Web `Request`/`Response` so it lifts out at Rung 4 unchanged.
- **`packages/db`:** the `conversations`/`messages`/`parts` collections persisted to SQLite; the server Drizzle schema holds the Better Auth tables (+ the same chat tables, unused until sync).
- **Ollama:** local (`:11434`) in dev; the author's Proxmox box in deploy. Reached via an OpenAI-compatible endpoint, host/model from config.

Control + data flow:

```text
send → useChat → /api/chat (BFF: auth) → core.chat(ollama) → SSE ⇒ stream to client state
                                                                   ⇩ on RunFinished
                                          write finalized messages+parts → TanStack DB (SQLite)
render: live query over persisted messages ⊕ the in-flight streaming message
```

## Data model (R1 subset)

Per [data-model.md](data-model.md), applied via the client SQLite persistence (`schemaVersion` 1) + the server Drizzle schema:

- `conversations` (id, ownerId, title, config, currentMessageId, timestamps, deletedAt)
- `messages` (id, conversationId, ownerId, parentId, role, model/provider, finishReason, error, timestamps, deletedAt)
- `parts` (id, messageId, conversationId, ownerId, runStepId=null, seq, type∈{text,reasoning}, state, text, providerMetadata, timestamps)

No `runStepId` population yet (null until R4); no `runs`/`threads`/`memory` tables. `ownerId` comes from the Better Auth session.

## Behavior

- **New chat → type → send:** the assistant message renders **streaming** token-by-token (and a reasoning block if emitted).
- **On finish:** the user + assistant messages persist; a reload shows the full thread from the local collection.
- **Stop:** the stop button aborts the run; Ollama halts; the partial transient is discarded (not persisted).
- **Error:** model down / stream dropped → the transient is discarded and an error surfaces (typed error + logger with correlation id); the conversation stays usable.
- **Conversation list:** prior conversations are listed; selecting one loads its thread; a model picker drives `config`.

## Testing

- **Unit (Vitest):** the finalize mapping (`useChat` message → `messages`+`parts` rows), the `config`/`forwardedProps` wiring, error→discard logic.
- **Integration (Vitest):** send → stream (mocked Ollama / OpenAI-compatible) → finalized rows land in the collection; the BFF auth gate rejects unauthenticated calls; abort halts the stream.
- **E2E (Playwright):** sign in → send a message → see it stream → reload and see it persisted; stop mid-stream; error path with Ollama unreachable; axe check on the chat view.

## Proposed stories (→ bd, under epic `telemachus-1or`)

1. **Identity** — minimal Better Auth (server Postgres, Drizzle adapter); a session → `ownerId` available client + server. _(prereq)_
2. **Chat tables** — `conversations`/`messages`/`parts` as SQLite-persisted collections + the server Drizzle schema; a message round-trips to SQLite and survives reload. _(prereq, the spine)_
3. **Streaming send** _(the tracer)_ — `useChat` → BFF(auth) → `core` → Ollama via TanStack AI → SSE renders streaming; on `RunFinished`, persist the finalized message + parts. The thin end-to-end slice. _(blocked by 1, 2)_
4. **Stop/abort + errors** — `AbortController` through the path; error states (model down, stream dropped → discard transient + surface). _(blocked by 3)_
5. **Conversation list + model picker** — list/select conversations, new chat, `config` via `forwardedProps`. _(blocked by 3)_

## Open questions

- **Error-partial handling:** R1 discards a half-streamed message on error. Later (R4/R5) a partial may be persisted with an `error` + finish-reason for the glass-box record — decide when runs land.
- **Model list source:** hardcode a default vs. query Ollama's `/api/tags` for the picker. (Lean: a configured default + optional `/api/tags`.)
- **Auth providers:** email/password vs. a dev-only session for R1. (Lean: email/password, minimal.)
- **`config` fields** beyond `{provider, model, temperature}` — extend as needed; keep it open jsonb.
- **SSR vs client-only** for the chat route at R1 (PGlite→SQLite worker hydration) — confirm at build (ties to ADR-002's SSR↔local-first note).
