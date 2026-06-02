# Model / LLM layer: TanStack AI + pluggable local serving

- **Status:** Accepted
- **Date:** 2026-06-02
- **Authors:** @jbabin91

## Context

Telemachus is a chat + agent hub, so it needs: a **provider abstraction** (talk to many LLMs, local and remote), **streaming + tool-calling + structured output**, **local model serving** on the self-host target, and an **agent loop**.

Constraints that apply:

- **All-TypeScript**, **free / open-source + self-hostable** ([`Constraints` in scope-positioning](../ideas/scope-positioning.md)); model serving runs on the author's **Proxmox** server.
- **Build-our-own** applies to the **agent loop** (the wedge); it does not forbid an infrastructure SDK for the commodity provider/transport plumbing.
- Pairs with [ADR-001](001-data-layer-tanstack-db-electric-pglite.md) (the agent loop wires to reactive collections), [ADR-002](002-app-framework-tanstack-start-nitro.md) (server functions), and [ADR-005](005-ui-react-aria-intent.md) (the chat surface references AG-UI / assistant-ui).

This decision is **scoped to the provider/transport layer, local serving, and agent-loop ownership**. Embeddings / vector memory (thread #4), MCP + tool/approval specifics (Rung 3), and which providers are actually enabled are deferred.

Evidence (verified 2026-06-02): [`@tanstack/ai`](https://github.com/TanStack/ai) v0.26.0 (npm `latest`) — provider-agnostic TS AI SDK (streaming chat, tool calling, agents), adapters incl. `@tanstack/ai-ollama` + OpenAI-compatible, structured output via Zod/ArkType/Valibot, **AG-UI compliant**. For single-user serving all three are viable but **not equal on speed**: llama.cpp is fastest (≈4× Ollama on the same hardware in the cited benchmark), Ollama is easiest (OpenAI-compatible at `:11434`), vLLM targets concurrent multi-user (NVIDIA-only, heavy). Odysseus treats all of them as pluggable backends behind an OpenAI-compatible API. ([serving comparison](https://www.decodesfuture.com/articles/llama-cpp-vs-ollama-vs-vllm-local-llm-stack-guide))

## Decision

- **Provider / streaming / tool-transport: TanStack AI** (`@tanstack/ai` + adapters). Provider-agnostic, AG-UI compliant, Zod structured output. **Not** the Vercel AI SDK.
- **Local serving: target an OpenAI-compatible HTTP endpoint; default Ollama** (self-hosted on Proxmox), with **llama.cpp** (speed) and **vLLM** (concurrency) as swap-in backends. Serving binaries are managed over HTTP from Node — no Python.
- **Agent loop / orchestration: build our own** (reference pi's `pi-agent-core`, OpenCode). The loop, sessions, compaction, and tool execution wire directly to the ADR-001 collections. TanStack AI supplies the provider/transport, **not** the agent runtime.

## Consequences

**Easier / gained:**

- Provider-agnostic multi-LLM (local + remote) **without the Vercel AI SDK**, cohesive with the TanStack ecosystem; Zod structured output reused from ADR-007; AG-UI interop aligns with the assistant-ui chat references (ADR-005).
- **Ollama's ease + pluggable serving** — free, self-hosted, no lock-in; swap to **llama.cpp for speed** (≈4× single-user) or vLLM for concurrency without app changes.
- The **owned agent loop is the wedge** — glass-box run/step capture (ADR-001) lives in our loop, not a black box.

**Harder / accepted tradeoffs:**

- **TanStack AI is pre-1.0** (v0.26.0, fast-moving) — pin versions, track releases.
- **Building the agent loop is real work** — accepted; it's the differentiator.
- **Managing serving binaries from Node** (process supervision, health checks, port probing) is ours — reference Odysseus's model-serving manager.

**Follow-up:**

- Embeddings / vector memory — thread #4.
- MCP client + tool approval — Rung 3.
- Provider enablement (which remotes, keys) at build time; hardware-fit model recommendations (reimplement `llmfit`) later.

## Alternatives considered

- **Vercel AI SDK** — the popular default. **Not chosen:** TanStack AI covers the same ground natively inside the chosen ecosystem; no reason to pull in a Vercel-centric SDK.
- **Build-our-own provider layer** (pi-`ai` style) — maximum own-code, but maintaining 27+ providers' quirks + OAuth is high-cost commodity work. **Not chosen:** TanStack AI is better leverage; we reserve build-our-own for the agent loop + data wiring.
- **Single serving backend** (Ollama-only or vLLM-only) — **Not chosen:** OpenAI-compatible + pluggable avoids lock-in and fits single-user-now / maybe-concurrent-later.
- **LangChain / LangGraph** (agent frameworks) — heavier, and owning the loop is the wedge. **Not chosen** as the runtime (LangGraph stays a glass-box _reference_ for thread #3).
