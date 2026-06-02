# Spec: data model (thread #2)

- **Status:** Draft
- **Date:** 2026-06-02
- **Authors:** @jbabin91
- **Related:** [ADR-001](../decisions/001-data-layer-tanstack-db-electric-pglite.md) (data layer), [ADR-003](../decisions/003-orm-drizzle.md) (Drizzle), [`foundations.md`](foundations.md) (cross-cutting), [`roadmap.md`](roadmap.md) (rungs), [`../ideas/pinned-messages-and-notes.md`](../ideas/pinned-messages-and-notes.md) (work surface).

## Purpose

The collection schema the whole app rides on. Designed once up front because IDs, sync-shape, and the append-only run model are [foundations](foundations.md) that are brutal to retrofit. Covers the **chat spine** (Rungs 1–2), the **glass-box seam** (`threads`/`runs`/`runSteps`, shaped now, built at Rungs 4–5), and the **memory seam** (Rung 6). Grounded in a field-level survey of LibreChat, Open WebUI, Lobe Chat, ChatGPT export, OpenCode, pi, t3code, LangGraph, Letta, and mem0 (sources at the end).

## Principles (what the survey settled)

- **Normalized rows, never a JSON-blob conversation.** Each message/part is an independent row so ElectricSQL syncs it incrementally and LWW/tombstones apply per row. (Open WebUI's `chat: JSON` makes the whole conversation one sync unit + one LWW cell — rejected.)
- **`parentId` tree + a durable active-leaf pointer.** Branch = walk `parentId` up from the leaf. The leaf pointer is **stored, synced data** (`conversations.currentMessageId`), not recomputed (LibreChat) nor blobbed (Open WebUI).
- **Append-only glass-box.** `runs`/`runSteps` are append-only with parent pointers (pi's tree + LangGraph's `parent_config`): **rewind-to-step + fork = append a new step whose parent is step N, then move the leaf — never mutate or delete the original.** Finalized steps freeze; only the in-flight step mutates. Compaction **appends a summary node** referencing the kept range; originals stay.
- **AG-UI / AI-SDK `parts` shape** (TanStack AI is AG-UI-compliant): message content is an ordered union of typed parts; tool-call + result are **one part** with a `state`.
- **Distilled memory first, vector additive.** Letta-style editable blocks are the spine, synced to the client as **text**; **semantic recall is server-side** (server Postgres + pgvector). The client (SQLite) holds distilled blocks, not vectors; recall is strictly additive (thread #4), with sqlite-vec an option for the offline edge case. (Per [ADR-001](../decisions/001-data-layer-tanstack-db-electric-pglite.md)'s amendment, the on-device store is SQLite — pgvector lives server-side.)
- **Foundations in every table** ([foundations.md](foundations.md)): UUIDv7 PKs (time-sortable → free ordering, no `childrenIds` arrays), `ownerId` scoping, UTC `createdAt`/`updatedAt`, soft-delete `deletedAt` tombstones, idempotency keys where writes retry.

### Common columns (every table)

```ts
id:        uuid          // UUIDv7, client-generated
ownerId:   uuid          // scope; FK users (better-auth)
createdAt: timestamptz
updatedAt: timestamptz    // LWW resolution; HLC seam for clock-skew (thread #5)
deletedAt: timestamptz?   // tombstone (soft delete; never hard-delete synced rows)
```

## Chat spine (Rungs 1–2)

```ts
conversations
  ...common
  title:                    text         // default 'New Chat'
  config:                   jsonb        // model/preset bundle (provider, model, system, params, tools) — one column, not 40 loose ones
  folderId:                 uuid?        // FK folders
  pinned:                   boolean      // default false
  archived:                 boolean      // default false
  currentMessageId:         uuid?        // durable active-branch head (the leaf)
  forkedFromConversationId: uuid?        // cross-conversation fork lineage
  historySummary:           text?        // distilled working-memory seed (Lobe pattern)

messages
  ...common
  conversationId: uuid       // FK conversations
  parentId:       uuid?      // FK messages — the tree edge; null at root
  threadId:       uuid?      // FK threads (branch/run this message belongs to)
  role:           enum('system'|'user'|'assistant'|'tool')
  model:          text?      // per-message (mid-thread model switching)
  provider:       text?
  pinned:         boolean    // default false (mirrors a pin existing; see pins)
  summary:        text?      // per-message distill (memory seed)
  tokenCount:     int?
  finishReason:   text?
  error:          jsonb?
  messageGroupId: uuid?      // groups parallel multi-model responses to one prompt (blind-compare)

parts                         // AG-UI/AI-SDK ordered union; content lives here, not on messages
  ...common
  messageId:        uuid      // FK messages
  conversationId:   uuid      // denormalized for the Electric shape (shapes filter one table; can't join through messages)
  runStepId:        uuid?     // FK runSteps — which agent step produced it (null for plain chat)
  seq:              int       // explicit order within a message (UUIDv7 also sorts, seq is the tiebreaker/reorder key)
  type:             enum('text'|'reasoning'|'tool'|'file'|'source-url'|'source-document'|'data'|'step-start')
  state:            text?     // tool: input-streaming|input-available|output-available|output-error · text/reasoning: streaming|done
  text:             text?     // text / reasoning
  toolCallId:       text?     // tool
  toolName:         text?
  input:            jsonb?    // tool args
  output:           jsonb?    // tool result
  errorText:        text?
  mediaType:        text?     // file / source
  filename:         text?
  url:              text?     // file/source URL or blob reference (see foundations: blob storage)
  data:             jsonb?    // data-* custom parts
  providerMetadata: jsonb?
```

> **Tool-part lifecycle & the streaming-persistence boundary.** In-flight part state (tool `input-streaming`→`output-available`; text/reasoning `streaming`→`done`) streams over the live channel (SSE) into client state and is **not written to the persisted collection until it finalizes** — only the finalized row syncs. `parts` is _mutate-while-in-flight-locally, then immutable-and-synced_; sync never replicates half-states. Foundations seam: [streaming-output persistence boundary](foundations.md) — pin at R1.

### Work surface (Rung 2 — net-new, no schema to copy)

```ts
pins                          // pinned-message → checklist (the shadcn-validated wedge)
  ...common
  conversationId: uuid
  messageId:      uuid        // jump-to target
  label:          text?       // editable checklist label (defaults to a message snippet)
  checked:        boolean     // default false
  sortKey:        text        // checklist ordering

notes                         // per-conversation scratchpad
  ...common
  conversationId: uuid
  title:          text?       // supports >1 note per conversation
  content:        jsonb       // rich text (editor document)
  sortKey:        text
```

### Organization

```ts
folders         ...common · parentId: uuid? (nestable) · name: text · sortKey: text
tags            ...common · name: text · color: text?
conversationTags  ...common · conversationId · tagId      // join row carries sync metadata (id/updatedAt/deletedAt) so tag-removal tombstones round-trip through Electric; unique(conversationId, tagId)
```

## Branching & the active path

- **Edit / regenerate** appends a **sibling** message (same `parentId`) and moves `conversations.currentMessageId` to the new head. The old branch is retained; it's just off the active path.
- **`threads`** (Lobe's first-class fork primitive) names a branch and is where glass-box runs attach. A bare chat lives in an implicit/default thread; an explicit fork creates a `threads` row.
- **Reconstruct the visible thread** by walking `parentId` from `currentMessageId` to root — ChatGPT/pi semantics, but with the leaf stored as syncable data.

```ts
threads
  ...common
  conversationId:      uuid
  title:               text?
  type:                enum('continuation'|'isolation'|'run')   // continuation/isolation from Lobe (its full set: continuation/standalone/isolation/eval); `run` is ours = an agent run
  status:              text?
  sourceMessageId:     uuid?     // the message this thread forks from
  parentThreadId:      uuid?     // self-ref lineage
  activeLeafMessageId: uuid?     // per-thread leaf (falls back to conversation.currentMessageId)
  lastActiveAt:        timestamptz
```

## Glass-box seam (Rungs 4–5) — append-only

Shaped now per [ADR-001](../decisions/001-data-layer-tanstack-db-electric-pglite.md); fields firm up at their rungs. **Rewind+fork never mutates history** — it appends rows with parent pointers and moves a leaf pointer.

```ts
runs                          // one agent invocation
  ...common
  threadId:       uuid
  conversationId: uuid        // denormalized for sync shape/scope
  messageId:      uuid?       // the assistant message this run produces
  parentRunId:    uuid?       // fork source
  model:          jsonb       // {providerId, modelId}
  status:         enum('pending'|'streaming'|'done'|'error'|'aborted')
  tokens:         jsonb?      // {input, output, reasoning, cache}
  cost:           numeric?
  error:          jsonb?
  replayMeta:     jsonb?      // {seed?, params, promptRef, toolsRef} — replay determinism (foundations): pin prompt template + tool-schema versions
  idempotencyKey: text?       // dedupe retried runs
  traceId:        text?       // correlation id threaded request→run→step→tool (foundations: the propagation seam is the painful retrofit — add now)
  startedAt:      timestamptz?
  completedAt:    timestamptz?

runSteps                      // one LLM call + its tool executions
  ...common
  runId:        uuid
  parentStepId: uuid?         // rewind-to-step-N fork pointer (LangGraph parent_config)
  seq:          int
  stepTokens:   jsonb?
  cost:         numeric?
  finishReason: text?
  idempotencyKey: text?       // step-level dedupe — re-running a step must not double-execute side effects (foundations)
  traceId:      text?         // inherited from the run
  startedAt:    timestamptz?
  finishedAt:   timestamptz?
  // parts reference runStepId — that's how a step's text/tool/reasoning output is stored

compactions                   // summary-as-append; never deletes originals (pi)
  ...common
  threadId:       uuid
  parentId:       uuid?       // position in the tree
  kind:           enum('compaction'|'branch_summary')
  summary:        text
  firstKeptStepId: uuid?      // compaction: feed summary + everything from here forward
  fromStepId:     uuid?       // branch_summary: the abandoned branch summarized
  tokensBefore:   int?
  details:        jsonb?      // e.g. read/modified files
```

## Memory seam (Rung 6) — distilled first, vector additive

```ts
memoryBlock                   // Letta block model = distilled working memory
  ...common
  projectId:    uuid?         // scope ≈ Letta agent; the "project" primary-object (future entity); null = owner/global
  conversationId: uuid?       // optional narrower scope
  threadId:     uuid?
  label:        text          // 'decided' | 'tried_failed' | 'next_steps' | 'context' | custom
  description:  text?         // what the block is for — guides the agent on when/how to edit it (Letta)
  kind:         enum('working'|'fact'|'preference')
  value:        text          // distilled, always-rendered content
  charLimit:    int           // our default 5000; enforced before injection
  readOnly:     boolean       // default false (Letta) — agent can't edit when true
  status:       enum('active'|'superseded'|'archived')
  sourceRef:    jsonb?        // provenance {messageId, toolCallId, ...}
  // embedding lives SERVER-SIDE only (server Postgres + pgvector); the client SQLite store holds text blocks, not vectors. Recall is server-side (thread #4); sqlite-vec is the option if offline recall is ever wanted.

memoryHistory                 // audit / glass-box for memory mutations
  ...common
  memoryBlockId: uuid
  oldValue:      text?
  newValue:      text?
  event:         enum('add'|'update'|'delete'|'noop')   // mem0's reconcile contract
  actor:         enum('user'|'agent'|'system')
```

Memory collection interface: `write`, `consolidate(candidates) → add|update|delete|noop`, `getForContext(scope) → Block[]` (always-rendered, offline-capable from synced text), `recall(query) → Block[]` (vector tier — **server-side** Postgres + pgvector; unavailable offline). Distilled tier mandatory; vector tier strictly additive — the key difference from Odysseus's vector-store-as-all-memory.

## Sync & write-path (ElectricSQL)

- **Read-path:** Electric **shapes** per table, scoped by `ownerId` (+ `conversationId` for messages/parts/pins/notes). The client subscribes; TanStack DB live-queries render.
- **Write-path:** local **TanStack DB optimistic mutation** (UUIDv7 minted client-side) → write API → server Postgres → Electric syncs the row back into the collection (`electricCollectionOptions`); offline writes via `@tanstack/offline-transactions`. A branch switch is a single-cell LWW: move the **leaf pointer** (`currentMessageId` / `activeLeafMessageId`), nothing else.
- **Deletes** set `deletedAt` (tombstone); never hard-delete a synced row.
- **Append-only** for `runs`/`runSteps`/finalized `parts`/`compactions` means sync replicates inserts, not rewrites — the ideal Electric workload.

## Data-access boundaries

TanStack DB does not replace TanStack Query — they layer (same team). **TanStack Query is a server-state cache/sync layer, not a fetcher** — the fetching is native `fetch` or (mostly) **TanStack Start server functions**; Query orchestrates caching, dedup, staleness, and loading/error around it. What handles what:

- **Synced reactive data** (conversations/messages/parts/…) → **TanStack DB collections** (Electric-synced; SQLite-local until sync lands).
- **Non-Electric reactive server-state** (e.g. a model list, settings) → a **Query Collection** (`@tanstack/query-db-collection`, `queryCollectionOptions`) — its `queryFn` fetches via a Start server fn / `fetch`, TanStack Query supplies the cache/staleness layer, and TanStack DB makes it a live-queryable, joinable collection.
- **One-off reads** (no collection needed) → a **Start server fn** does the fetch — wrap it in **TanStack Query** when you want caching/dedup/refetch, or call it directly in a Router loader when you don't.
- **Auth / session** → **Better Auth's own client** (`createAuthClient` / `useSession`, nanostore-reactive) — not Query, not a collection.
- **Streaming** → **TanStack AI** `useChat` (SSE) — not Query.

Rule of thumb: reach for TanStack Query _through_ a Query Collection when non-Electric data should be reactive; standalone only for simple cached fetches. (R1 needs none of the standalone-Query cases — auth + `useChat` + local collections cover it.)

## Import / export interop

ChatGPT export is the interop target: a **top-level `current_node`** plus a **`mapping`** of `{ <id>: {id, message, parent, children} }`. It round-trips cleanly — `mapping` nodes ↔ `messages.parentId`, `current_node` ↔ `conversations.currentMessageId`. Also covers Open WebUI / LibreChat imports. Map `author.role → role`, `content.parts → parts`.

## Open questions (deferred to their threads/rungs)

- Exact `config` (preset) jsonb shape — settle at R1 build.
- Whether **`projects`** becomes a first-class entity (the "project" primary-object) — affects `memoryBlock.projectId` scope; revisit with Rung 6 / a future thread.
- Full **fork semantics** — does message-branch fully unify with run-fork, or stay parallel mechanisms sharing the append-only pattern? Owned by **thread #3**.
- **pgvector** enablement + embedding model — **thread #4**.
- **HLC vs plain `updatedAt`** for clock-skew, and where sync enters — **thread #5**.
- **Blob/attachment** storage backing `parts.url` (object store / OPFS) — [foundations.md](foundations.md); R3+.
- **Cascade-tombstone policy** — soft-deleting a message should tombstone its `parts`/`pins` so no live rows are orphaned at a tombstoned parent. Define at R1.
- **Field-level encryption boundary** — `messages`/`parts`/`memoryBlock` content columns are the encryption-at-rest candidates ([foundations.md](foundations.md)); owned by the security ADR.
- **Schema/row version stamping** — for the schema↔app handshake + offline-migration catch-up ([foundations.md](foundations.md)); a version discriminator is painful to add after rows exist — revisit with thread #5.

## Sources

- Conversation/message/branching: [LibreChat schema](https://github.com/danny-avila/LibreChat/blob/main/packages/data-schemas/src/schema/message.ts) · [Open WebUI DB structure](https://github.com/taylorwilsdon/open-webui-analytics/blob/main/database_structure.md) · [Lobe Chat message.ts](https://github.com/lobehub/lobe-chat/blob/main/packages/database/src/schemas/message.ts) / [topic.ts](https://github.com/lobehub/lobe-chat/blob/main/packages/database/src/schemas/topic.ts) · [ChatGPT export format](https://ai-chat-importer.com/guides/chatgpt-export-format-explained)
- Parts / runs / fork: [AI SDK UIMessage](https://ai-sdk.dev/docs/reference/ai-sdk-core/ui-message) · [AG-UI events](https://docs.ag-ui.com/concepts/events) · [OpenCode message/part](https://deepwiki.com/sst/opencode/2.2-message-and-prompt-system) · [pi session format](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/session-format.md) / [compaction](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/compaction.md) · [LangGraph persistence](https://docs.langchain.com/oss/python/langgraph/persistence)
- Memory: [Letta memory blocks](https://docs.letta.com/guides/agents/memory-blocks) · [mem0 history/storage](https://deepwiki.com/mem0ai/mem0/3.3-history-and-storage-management) · local [`../research/deep-dives/odysseus.md`](../research/deep-dives/odysseus.md)
