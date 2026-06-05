# Foundations: cross-cutting concerns to scaffold early

- **Status:** Living checklist, 2026-06-02
- **Author:** @jbabin91
- **Purpose:** The "touch every file later" concerns — things to **decide or scaffold before R1** so they aren't brutal retrofits. Not features; the substrate features sit on.
- **Companion docs:** the stack is in [`../decisions/`](../decisions/); the schema-level items below land in **thread #2** (data model). This is a living doc — expand it as more surface.

## How to read

Each item is tagged by **retrofit pain**, with the recommended early action and where it's recorded:

- **(now)** — brutal to retrofit; decide/scaffold before or during R1.
- **(seam)** — cheap to leave a seam now, miserable to add after code hardens.
- **(later)** — design-aware now, build when its rung arrives.

"Recorded:" points to the thread, ADR, or "R1-scaffold" (do it as the first code lands) that owns it.

## Data & schema — _mostly thread #2_

- **(now) Client-generated IDs** — **`UUIDv7`** (time-sortable, RFC 9562), client-minted offline, stored as a native Postgres `uuid`; never DB auto-increment (changing PKs later is the worst refactor). **Decided 2026-06-03:** ULID dropped — its base32 edge is lost in a `uuid` column, and UUIDv7 is the standard with native Postgres/Drizzle/Electric support. **NanoID** is reserved for a later **share-link / public-handle** seam — a revocable share-_token_ (own table), additive, never the PK. Branded TS id types + the generator (the `uuid` lib's `v7({ msecs })` behind an owned `IdGenerator` seam — injected clock + rng for deterministic replay/tests; exact ordering uses an explicit `seq`, not the id) land at `.4` (`packages/shared`). _Recorded: #2._
- **(now) Sync-ready row shape** — every syncable row carries **UTC timestamps**, an **`updatedAt`/version (logical clock)**, and **soft-delete tombstones** (can't hard-delete rows other devices haven't synced). _Recorded: #2 / #5._
- **(seam) Cascade / referential delete semantics** — deleting a conversation must tombstone its children (messages/parts/pins/notes) and **converge that cascade across devices + both stores** (client SQLite, server Postgres). A single-row tombstone (above) doesn't define cascade; adding it after deletes ship is a second deletion model. _Recorded: #2 / #5._
- **(now) Ownership/workspace scoping** — put an `ownerId`/workspace on rows even while single-user, so multi-user becomes _additive, not a rewrite_. (Features stay deprioritized; the schema hook is near-free now.) _Recorded: #2._
- **(now) Attachment / blob storage** — chat with files/images needs a blob strategy (object store / MinIO vs OPFS handle + reference; **not** in-row bytea — blobs don't belong in Electric shapes). Deciding after messages are modeled means a schema migration + sync-path rework. _Recorded: #2._
- **(now) Idempotency keys** — for webhooks, retries, and **agent steps** (re-running a step must not double-execute side effects). _Recorded: #2 / #3._
- **(now) Migration discipline** — **server** Drizzle/Postgres migrations (`drizzle-kit`) + **client** TanStack DB persistence `schemaVersion` migrations (SQLite); two systems now (client store ≠ server), each versioned + backward-compatible. _Recorded: #2._
- **(seam) Field-level encryption at rest** — if message/memory content must be encrypted before it leaves the device (privacy pillar), the encryption boundary must exist before rows are written/synced; adding it later means re-encrypting the store and breaking shapes. _Recorded: #2 / security ADR._
- **(seam) Search indexing (FTS / `pgvector`)** — **server-side** (Postgres + pgvector); affects the server schema. On-device recall (if ever) would use sqlite-vec, not pgvector. _Recorded: #2 / #4._
- **(seam) PII retention / right-to-erasure** — tombstones handle sync deletes, not hard purge across devices + backups; designing purge after tombstones ship is a second deletion model. _Recorded: #2 / #5._
- **(seam) Schema ↔ app-version handshake** — a cached PWA client hitting a newer schema needs version gating + a forced-refresh path. _Recorded: #5 / R1-scaffold._
- **(seam) Export/import friendliness** — keep the schema serialisable for full backup/restore (Odysseus ships JSON export/import). _Recorded: #2._
- **(seam) Settings/preferences store** — per-conversation `config` has a home; global prefs don't. Decide the **synced vs device-local split** up front: synced (theme, default model, UI prefs) vs device-local (which models are downloaded on _this_ box, local paths). Choosing after a settings table exists means re-homing rows + sync-path rework. _Recorded: #2 / #5._

## Sync & offline (local-first) — _mostly thread #5_

- **(now) Multi-tab coordination** — **handled first-party** by TanStack DB's SQLite persistence (BroadcastChannel + `navigator.locks` leader election); no DIY worker binding. Still ensure the agent loop / sync don't run duplicated per tab. _Recorded: #5 / R1-scaffold._
- **(seam) Clock-skew / hybrid logical clock** — the logical clock assumes trustworthy device time; multi-device LWW with skewed clocks silently loses writes. A HLC seam is cheap now, the lost data is unrecoverable later. **The clock must be an injected dependency** (not inline `Date.now()`) so it's swappable for the HLC, tests, and faithful replay; id-gen and the model provider follow the same injection seam (the agent loop stays deterministic + mockable). _Recorded: #5 / #3._
- **(seam) Migration ordering across un-synced devices** — a device offline for N migrations reconnecting to a newer-schema server needs a catch-up/replay path; brutal to add after the migration runner exists. _Recorded: #5._
- **(seam) Optimistic write + rollback UX** — consistent pending / synced / error / conflict states across the UI, not per-component. _Recorded: #5._
- **(seam) Offline detection + write queue** — online/offline signal and a durable local write queue (the Electric write-path). _Recorded: #5._
- **(seam) Offline session continuity** — Better Auth is server-authoritative (ADR-004), but local-first reads must work offline, so the read path can't gate on a live server session check. Cache the session with an offline grace window; refresh when back online and let writes ride the queue meanwhile. Auth wired as "verify the server every action" makes offline use a later sweep. _Recorded: ADR-004 / #5._
- **(seam) Storage persistence & quota** — TanStack DB SQLite persistence = wa-sqlite + **OPFS**; browsers can evict. Call `navigator.storage.persist()`; handle quota/eviction. _Recorded: #5 / R1-scaffold._
- **(seam) Partial replication / shape scoping** — decide _how much_ data is resident on-device. Eagerly materializing every message/conversation doesn't scale (a 5k-message thread, 1k conversations = a storage + query wall); design **windowed Electric shapes** + a lazy "load older history" path. R1 is local-only, so the trap is R1 queries assuming full residency — keep them windowed from the start; retrofitting windowing touches every read path. (Data-residency analogue of list virtualization, which is render-only.) _Recorded: #5 / #2._
- **(later) Conflict semantics** — server LWW now; Yjs/CRDT only if collab is needed. _Recorded: #5._

## Runtime & threading

- **(now) DB off the main thread** — TanStack DB's SQLite persistence runs wa-sqlite in a dedicated worker (OPFS sync-access handles) — first-party, so the off-main-thread boundary and the worker ↔ main RPC are handled for us (no custom worker contract to own). _Recorded: R1-scaffold (ADR-008)._
- **(seam) Compute workers** — embeddings (transformers.js/onnxruntime-web), local STT/TTS (whisper/kokoro WASM) run in workers. _Recorded: R1._
- **(seam) Service Worker** — gates PWA offline, caching, and web push. _Recorded: R1._
- **(seam) Graceful shutdown / health checks** — the `core` daemon supervises model-serving child processes; Coolify needs health/readiness + clean restart. _Recorded: ADR-008 / R1._
- **(seam) Performance budget** — code-splitting + lazy-load (wa-sqlite WASM + worker assets); a bundle budget from the start. _Recorded: R1._

## Real-time transport

- **(now) Transport abstraction** — the UI subscribes to _events_, never hardcodes `fetch`/`ws`. Default **SSE** for token streaming + **AG-UI** (Hono + TanStack AI native); reserve **WebSockets** for bidirectional/presence later. _Recorded: future ADR (transport)._
- **(now) Stream resume + reconnection/backpressure** — long agent runs drop connections; resuming a half-finished run is brutal to add later. _Recorded: future ADR / R1._
- **(now) Cancellation/abort** — thread `AbortController` through the agent loop and LLM calls from day one. _Recorded: ADR-006 / R1._
- **(seam) Streaming-output persistence boundary** — where a half-streamed message/tool-call is durably written (so a crash mid-stream neither loses nor duplicates it); ties to the optimistic-write states. _Recorded: #3 / R1._
- **(seam) Async-delivery guarantee** — "agent finished while you were away" needs at-least-once delivery + dedupe over the notification seam, not just a live tab. The delivery contract is the retrofit, not the transport. _Recorded: #5 / feature._

## Security — _candidate for its own ADR (security model)_

- **(now) AuthZ / resource-level permissions** — Better Auth (ADR-004) is _authn_; who-can-read-which-conversation/run is a separate model. Once `ownerId` exists, retrofitting authz after queries assume "single user sees everything" touches every read path. _Recorded: security ADR / #2._
- **(now) CSP** — set a strict Content-Security-Policy from commit 1; WASM (wa-sqlite) + workers + any inline make a later CSP retrofit miserable. (Tauri adds an IPC allowlist.) _Recorded: security ADR / R1._
- **(now) Secrets at rest** — API keys, model endpoints, integration creds encrypted at rest; a secrets seam (server Postgres encrypted, or OS keychain on native). _Recorded: security ADR._
- **(now) Untrusted-content trust boundary** — agents ingest web/doc/email content; treat all tool inputs/outputs as untrusted, with prompt-injection detection + context sandboxing. _Recorded: ADR-006 / #3._
- **(now) Tool/code-execution sandboxing** — Docker/microVM/permissioned isolation for agent-run shell/code. _Recorded: security ADR._
- **(now) Model-routing privacy policy** — the privacy-first pillar ("sensitive work pinned to local models, can't leave the box") is an authorization policy in the model-routing seam; design it in, don't bolt on. _Recorded: ADR-006 / security ADR._
- **(seam) Audit log** — tool executions, credential use, model-routing decisions; an append-only trail is near-free if seeded with the run/step model, painful to reconstruct later. _Recorded: #3 / security ADR._
- **(seam) Web basics** — CSRF/CORS, security headers, **rate limiting**, scoped API tokens for the Hono `core` API. _Recorded: security ADR._
- **(seam) XSS / markdown sanitization** — sanitise rendered LLM/user/tool markdown + HTML. _Recorded: R1._
- **(seam) Secret/PII redaction in logs** — redaction in the logger seam. _Recorded: R1._
- **(seam) Supply chain** — lockfile, `npm audit`, exact pins + min-release-age (pi's pattern). _Recorded: R1._

## LLM / agent specifics — _mostly ADR-006 / threads #3–4_

- **(now) Replay determinism** — capture seeds, model version, and params in the run/step record so a glass-box replay is faithful. Painful to retrofit into the run model. _Recorded: #3._
- **(now) Prompt + tool-schema versioning** — replay also needs the _exact_ prompt template and tool definitions used at run time pinned/captured; once prompts evolve, uncaptured old runs become unreplayable. _Recorded: #3._
- **(seam) Token counting + per-provider tokenizers** — abstract tokenization; counts differ per model. _Recorded: ADR-006._
- **(seam) Context-window management + compaction** — auto-summarise near the limit (Odysseus does). _Recorded: ADR-006 / #4._
- **(seam) Cost/usage accounting** — hook token/cost capture into the LLM layer from the start (a top community ask). _Recorded: ADR-006._
- **(seam) Model capability matrix** — feature-detect tools/vision/json-mode/thinking per model. _Recorded: ADR-006._
- **(seam) Provider failover / backoff / retry** — fallback chains (Odysseus has them). _Recorded: ADR-006._
- **(seam) Model-endpoint abstraction → managed provisioning** — route all model access through a provider/endpoint resolver (never a hardcoded URL; ADR-006) and earmark an endpoints/providers registry. The managed-serving **Cookbook** (hardware-detect → recommend → download → serve, Odysseus-style; attach-before-supervise for Ollama) rides this seam and is a **later rung** — external runner is the floor. Holding the seam now keeps the Cookbook additive (no refactor). _Recorded: ADR-006 / roadmap._

## Integrations & jobs

- **(seam) MCP / external-tool connection lifecycle** — tool credentials + connection state share the secrets seam; leave a hook now even though the MCP host arrives at Rung 3. _Recorded: Rung 3 / security ADR._
- **(seam) Self-host ingress** — receiving webhooks / reaching `core` from outside the home network needs a tunnel (**Tailscale Funnel** on the free Personal tier, or **Cloudflare Tunnel** free). _Recorded: ADR-008 / deploy._
- **(seam) Job/queue** — scheduled + long-running agent runs need a queue; **pg-boss** (Postgres-backed) reuses the DB we already have. _Recorded: ADR-008 / R1._
- **(later) Webhooks** — inbound + outbound (HMAC-signed, like Odysseus), with idempotency + retry/queue. _Recorded: ADR / feature._
- **(later) Notifications** — one seam over web push (SW + VAPID), ntfy, email, in-app. _Recorded: feature._

## i18n / l10n / formatting

- **(seam) i18n from day one** — route every user-facing string through `t()` even English-only, via a standalone **`@oakoss/i18n`** package (wraps **Paraglide (inlang)** or Lingui behind our `t()` interface), landing at the **UI rung**. Errors localize **at the UI boundary** via `errors.<code>` keys (+ a `_category` fallback); `packages/shared` stays i18n-agnostic — it emits stable `code`s, the backend never localizes, and dev-facing text (logs, `Error.message`) is English. _Recorded: ADR (i18n) / #2._
- **(seam) Date/time/number formatting** — one util on **`Intl`** (+ Temporal or `date-fns-tz`); store UTC, render per locale/tz, never hardcode. _Recorded: R1._
- **(later) ICU pluralization / message format** — if early strings are concatenations, converting to ICU plurals later is a full string sweep. _Recorded: ADR (i18n)._
- **(later) RTL + `html lang` + locale routing** — react-aria handles much of RTL; wire the rest when a second locale lands. _Recorded: ADR (i18n)._
- **(later) Grapheme-aware text** — unicode-safe truncation/counting. _Recorded: R1._

## Accessibility

- **(seam) a11y testing in CI** — axe-in-Playwright regression tests (react-aria-components already covers component a11y). _Recorded: R1._
- **(seam) Live regions for streaming** — announce streaming tokens/agent status politely. _Recorded: R1._
- **(seam) Focus, motion, contrast** — focus management across route changes, `prefers-reduced-motion`, forced-colors/high-contrast, contrast-checked theme tokens. _Recorded: R1 / ADR-005._

## UI patterns — _set the convention once; painful to unify later_

- **(seam) List virtualization** — TanStack Virtual for long chat/run-step logs from the start. _Recorded: R1._
- **(seam) URL-as-state / deep-linking** — conversation/run/step addressable via Router search params; shareable. _Recorded: R1._
- **(seam) Consistent async states** — empty / loading (skeleton) / error patterns. _Recorded: R1._
- **(seam) Responsive/mobile-web** — design responsive from the start (PWA precedes native). _Recorded: R1._
- **(later) Undo/redo** — command pattern for the work surface + editor. _Recorded: feature._
- **(later) Command palette + keyboard registry** — one shortcut registry, not scattered handlers. **Lean: TanStack Hotkeys** (`@tanstack/react-hotkeys`) — singleton Hotkey Manager, cross-platform `Mod`, multi-key sequences, cheatsheet UI, SSR-friendly; complements react-aria-components (RAC = component keyboard/focus, Hotkeys = global app shortcuts). Alpha (Feb 2026) — pin. First use ~R2 (jump-nav) / the palette. _Recorded: feature._
- **(later) Clipboard, drag-drop/upload** — copy for code/messages; attachment DnD. _Recorded: feature._

## Errors, observability, config

- **(now) Typed error model + boundaries** — **Decided 2026-06-03 (lands at `.4`):** hybrid — **`Result<T, AppError>`** at boundaries (validation, parsing, I/O, every agent tool/step) + **`throw`** for invariants/programmer bugs. **`AppError`** = `{ code, category, params?, cause?, correlationId }`, `extends Error` (`.message = code`), **no user-facing string** (localized at the UI boundary via `errors.<code>`). Must be **serializable** (`toJSON`, narrowed for sync/persist/replay — code + category + safe params, never raw `cause`/stack) since errors cross the run-step, Electric-sync, and glass-box-replay boundaries. The boundary maps `code`→i18n, logs internal detail (via the logger, redacted), and reports. _Recorded: `.4` / #3._
- **(seam) Correlation/trace IDs** — one id threaded request→run→step→tool from the start, carried on a **context object shaped to become an OpenTelemetry trace context** (`trace_id`/`span_id`) so the OTel tracer adopts it later without a rewrite. The **same injected context feeds logger, error-reporter, and the future tracer/metrics** — one shape, many sinks (the injected-port convention). _Recorded: R1 / `.4`._
- **(seam) Logger abstraction** — an interface with redaction (never raw `console.log` at call sites); a **console default** ships at `.4`, with **Pino** as the server-side implementation later. First of the **injected observability ports** — logger, error-reporter, and later metrics/tracer share one shape (injected interface + no-op/default + boundary call), so each new concern is additive. _Recorded: R1 / `.4`._
- **(now) Typed env/config** — **`@t3-oss/env-core`** (Zod v4; `createAppEnv(runtimeEnv)` in `packages/shared`) over a hand-rolled validator, for **client/server secret isolation** (server vars throw if read client-side; `clientPrefix: 'VITE_'` for client vars later) + `emptyStringAsUndefined`; validation failures throw our `AppError` (`env.invalid`) via `onValidationError`. Vars are server-side at E0; the `client`/`shared` split lands at R1 with the web app + secrets. _Recorded: `.4` / R1._
- **(seam) Health / version endpoint** — a `/version` surfacing build SHA + schema version supports the schema↔app handshake and debugging. _Recorded: R1._
- **(later) Tracing** — OpenTelemetry across the agent runtime. _Recorded: feature._
- **(seam) Crash/error reporting** — behind an **`ErrorReporter` port** (same injected-port shape as the logger; no-op default shipped at `.4`, the boundary already calls it), so adding **self-hosted Sentry or GlitchTip** later is a config swap with zero call-site changes. Redact + honor "sensitive stays local" **before** capture; never a third-party SaaS (cost/self-host rule). _Recorded: `.4` / feature._
- **(later) Feature flags** — gate wedge features during build. _Recorded: feature._

## Build, deploy & project hygiene

- **(seam) Reproducible WASM/asset bootstrap** — wa-sqlite, transformers.js, whisper/kokoro WASM are large downloaded assets; pin versions + integrity (SRI) + a caching strategy before load paths scatter. _Recorded: R1._
- **(now) Developer environment + local services** — one documented toolchain (mise: Node/pnpm) + `docker-compose` for dev backing services (Postgres now; Electric/MinIO later) + `.env.example`. The app runs on the host for dev; Docker packages the deploy image (Coolify) + runs services + test databases (Testcontainers, real Postgres). Ollama is native on macOS (Metal GPU), Docker on Linux. Confirm whether the wa-sqlite OPFS VFS needs cross-origin isolation (COOP/COEP) on the dev server (interacts with the CSP item). _Recorded: R1-scaffold (E0)._
- **(seam) First-run bootstrap** — how a fresh self-host instance seeds its DB, generates VAPID keys, and provisions the first user; ad-hoc bootstrap scripts are hard to unify later. Pairs with the typed-env seam. _Recorded: R1._
- **(seam) Licensing** — the project's own license (oakoss MIT/Apache) + third-party attribution (copied Intent UI etc. are MIT — keep the notice). _Recorded: R1._
- **(later) Server-DB backup/restore runbook** — beyond app-level JSON export; the self-hoster's Postgres backup/restore is the data-loss blast radius. _Recorded: ops/feature._
- **(later) API versioning** — version the `core` API for native clients that lag the server. _Recorded: ADR-008 / feature._
- **(later) Analytics** — opt-in, privacy-respecting, self-hosted if at all. _Recorded: feature._

## Still to expand

This list is not exhaustive — it is the starting substrate. Add concerns as they surface; promote any that grow teeth into their own ADR (the **security model** and **real-time transport** are the two most likely first).
