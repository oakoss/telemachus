# Feature matrix — 10-project comparison

- **Date:** 2026-06-01 (snapshot; projects move fast — re-verify before committing roadmap)
- **Scope:** High-level capability comparison across the 10 code-level [deep dives](deep-dives/). The deep dives hold the finer detail; this is the at-a-glance "who has what + where the whitespace is." Companion to [`landscape.md`](landscape.md), [`differentiation-opportunities.md`](differentiation-opportunities.md), [`community-requests.md`](community-requests.md), and [`missing-features.md`](missing-features.md).
- **Method & confidence:** From the 2026-06-01 code-level deep dives (shallow-clone sweeps). Cells are _code-present_, not maturity-verified; `?` = unverified. Star counts are `gh`-reported, approximate. Pierre (diffs/trees) is a UI-component reference, intentionally **not** a column (see [`deep-dives/pierre.md`](deep-dives/pierre.md)).

**Legend:** ✅ yes · ◑ partial/adjacent · — no · ? unverified
**Columns:** Ody=Odysseus · OWUI=Open WebUI · LibC=LibreChat · Lobe=Lobe Chat · Herm=Hermes · Claw=OpenClaw · Letta=Letta · OCode=OpenCode · t3=t3code · pi=pi
**Build language:** Ody=Py · OWUI=Py · LibC=TS · Lobe=TS · Herm=Py · Claw=TS · Letta=Py · OCode=TS · t3=TS · pi=TS

## Capability matrix

### Surfaces

| Capability      | Ody | OWUI | LibC | Lobe | Herm | Claw | Letta | OCode | t3  | pi  |
| --------------- | --- | ---- | ---- | ---- | ---- | ---- | ----- | ----- | --- | --- |
| Web UI          | ✅  | ✅   | ✅   | ✅   | ✅   | ◑    | ◑     | ◑     | ✅  | —   |
| TUI             | —   | —    | —    | —    | ✅   | ✅   | —     | ✅    | ◑   | ✅  |
| CLI             | —   | —    | —    | —    | ✅   | ✅   | ✅    | ✅    | ✅  | ✅  |
| Desktop app     | ◑   | —    | —    | ✅   | ✅   | ✅   | —     | ◑     | ✅  | —   |
| Mobile / native | ✅  | ✅   | ◑    | ✅   | ◑    | ✅   | —     | —     | ✅  | —   |
| Voice (STT/TTS) | ✅  | ✅   | ◑    | ✅   | ✅   | ✅   | ◑     | —     | —   | —   |

### Chat & agents

| Capability                     | Ody | OWUI | LibC | Lobe | Herm | Claw | Letta | OCode | t3  | pi  |
| ------------------------------ | --- | ---- | ---- | ---- | ---- | ---- | ----- | ----- | --- | --- |
| Multi-provider chat            | ✅  | ✅   | ✅   | ✅   | ✅   | ✅   | ✅    | ✅    | ✅  | ✅  |
| Branch / fork conversation     | ◑   | ◑    | ✅   | ✅   | ◑    | —    | ✅    | ◑     | ✅  | ✅  |
| Blind model compare            | ✅  | ✅   | —    | —    | —    | —    | —     | —     | —   | —   |
| Context compaction             | ✅  | ?    | ?    | ✅   | ✅   | ✅   | ✅    | ✅    | ✅  | ✅  |
| Agent loop + tools             | ✅  | ◑    | ✅   | ✅   | ✅   | ✅   | ✅    | ✅    | ✅  | ✅  |
| Subagents / multi-agent        | ?   | —    | ✅   | ✅   | ✅   | ✅   | ✅    | ✅    | —   | ◑   |
| Plan / read-only mode          | ◑   | —    | —    | —    | —    | —    | —     | ✅    | ✅  | ◑   |
| Tool approval (allow/ask/deny) | ◑   | —    | ◑    | —    | ✅   | ✅   | ✅    | ✅    | ✅  | ◑   |
| Scheduling / cron              | ✅  | ✅   | —    | ◑    | ✅   | ✅   | —     | —     | —   | —   |

### Models, tools, extensibility

| Capability                  | Ody | OWUI | LibC | Lobe | Herm | Claw | Letta | OCode | t3  | pi  |
| --------------------------- | --- | ---- | ---- | ---- | ---- | ---- | ----- | ----- | --- | --- |
| Many providers              | ◑   | ✅   | ✅   | ✅   | ✅   | ✅   | ✅    | ✅    | ✅  | ✅  |
| Local serving (Ollama/vLLM) | ✅  | ✅   | ✅   | ✅   | ✅   | ✅   | ✅    | ✅    | ◑   | ◑   |
| Model routing / fallback    | ?   | ◑    | ◑    | ◑    | ✅   | ✅   | ✅    | ◑     | ◑   | ◑   |
| Hardware-fit cookbook       | ✅  | —    | —    | —    | —    | —    | —     | —     | —   | ◑   |
| MCP client                  | ✅  | ✅   | ✅   | ✅   | ✅   | ✅   | ✅    | ✅    | —   | —   |
| MCP host / server           | ✅  | —    | —    | —    | ✅   | ✅   | —     | —     | —   | —   |
| Skills (self-authored)      | ✅  | ✅   | ✅   | ◑    | ✅   | ✅   | ◑     | ✅    | —   | ✅  |
| Skills registry             | —   | —    | —    | ◑    | ✅   | ✅   | —     | ◑     | —   | ◑   |
| Plugins / functions         | ✅  | ✅   | ✅   | ✅   | ✅   | ✅   | —     | ✅    | —   | ✅  |
| Sandboxed execution         | ◑   | ◑    | ✅   | ✅   | ✅   | ✅   | ◑     | ✅    | ✅  | ◑   |

### Knowledge & memory

| Capability                               | Ody | OWUI | LibC | Lobe | Herm | Claw | Letta | OCode | t3  | pi  |
| ---------------------------------------- | --- | ---- | ---- | ---- | ---- | ---- | ----- | ----- | --- | --- |
| RAG / knowledge base                     | ✅  | ✅   | ✅   | ✅   | ◑    | ✅   | ◑     | —     | —   | —   |
| Vector memory                            | ✅  | ✅   | ◑    | ✅   | ◑    | ✅   | ✅    | —     | —   | —   |
| Editable / white-box memory              | —   | ◑    | ◑    | ✅   | ✅   | ✅   | ✅    | —     | —   | —   |
| **Durable distilled _working_ memory** ◆ | ◑   | ◑    | ◑    | ◑    | ◑    | ◑    | ◑     | —     | —   | —   |

### Domain surfaces

| Capability          | Ody | OWUI | LibC | Lobe | Herm | Claw | Letta | OCode | t3  | pi  |
| ------------------- | --- | ---- | ---- | ---- | ---- | ---- | ----- | ----- | --- | --- |
| Email               | ✅  | —    | —    | —    | ✅   | ✅   | —     | —     | —   | —   |
| Calendar            | ✅  | ✅   | —    | —    | ?    | ✅   | —     | —     | —   | —   |
| Documents / editor  | ✅  | ◑    | ◑    | ✅   | ◑    | ◑    | —     | ✅    | ✅  | —   |
| Image generation    | ✅  | ✅   | ✅   | ✅   | ?    | ✅   | —     | —     | —   | ◑   |
| Web / deep research | ✅  | ✅   | ✅   | ✅   | ◑    | ✅   | —     | ◑     | —   | —   |
| Messaging channels  | ◑   | ◑    | —    | —    | ✅   | ✅   | —     | —     | —   | ◑   |

### Organization & demand-driven UX

| Capability                   | Ody | OWUI | LibC | Lobe | Herm | Claw | Letta | OCode | t3  | pi  |
| ---------------------------- | --- | ---- | ---- | ---- | ---- | ---- | ----- | ----- | --- | --- |
| Folders / projects / tags    | ✅  | ✅   | —    | ✅   | ?    | ?    | —     | —     | —   | —   |
| Cost / usage visibility      | ✅  | ✅   | ◑    | ✅   | ✅   | ?    | ✅    | ✅    | ◑   | ✅  |
| Async steer / queue + notify | ?   | —    | —    | ◑    | —    | ◑    | —     | —     | ◑   | ✅  |

### Sync, multi-user, glass-box

| Capability                        | Ody | OWUI | LibC | Lobe | Herm | Claw | Letta | OCode | t3  | pi  |
| --------------------------------- | --- | ---- | ---- | ---- | ---- | ---- | ----- | ----- | --- | --- |
| Multi-user / RBAC                 | ✅  | ✅   | ✅   | ✅   | ◑    | ◑    | ✅    | ✅    | —   | —   |
| Multi-device sync                 | ◑   | ◑    | ◑    | ◑    | ◑    | ✅   | ✅    | ◑     | ✅  | —   |
| **True local-first CRDT sync** ◆  | —   | —    | —    | —    | —    | —    | —     | —     | —   | —   |
| Run / session history             | ◑   | ✅   | ✅   | ✅   | ✅   | ✅   | ✅    | ✅    | ✅  | ✅  |
| Run replay / resume               | —   | —    | ✅   | ◑    | ✅   | —    | ✅    | ◑     | ✅  | —   |
| **Rewind-to-step + fork a run** ◆ | —   | —    | ◑    | ◑    | ◑    | —    | ◑     | ◑     | ◑   | ◑   |

### Work surface (net-new) ◆

| Capability                              | Ody | OWUI | LibC | Lobe | Herm | Claw | Letta | OCode | t3  | pi  |
| --------------------------------------- | --- | ---- | ---- | ---- | ---- | ---- | ----- | ----- | --- | --- |
| **Pinned-message → checklist** ◆        | —   | —    | —    | —    | —    | —    | —     | —     | —   | —   |
| **Per-conversation notes scratchpad** ◆ | —   | ◑    | —    | ◑    | —    | —    | —     | —     | —   | —   |

◆ = **net-new / whitespace** (telemachus wedge); see provenance + closest-existing in [`missing-features.md`](missing-features.md). Two cell-level notes: the **durable distilled _working_ memory** ◆ row scores the narrower _project working-state_ variant — Lobe and Letta are ✅ for their _own_ (user/persona) memory in their deep dives, but ◑ for this variant (nobody ships it, hence ◆). **Agent-native reactive data model** (whitespace #4 below) is architectural — it has no per-project row (it's the engine the others ride on), so the table scores 5 ◆ rows while the summary lists it as a 6th item.

## Corrections / notes

- **Odysseus _appears_ built on OpenCode** (observed, not independently confirmed) — two projects here, one layered on the other.
- All cells are **code-present**, not maturity/stability-verified (several repos are days-to-months old). Star counts are `gh`-reported and approximate.
- Lobe Chat routes feature requests through Discussions (not issue-searchable here); its cells come from the code deep dive.

## Who leads where

- **Conversation-primary chat workspace** (telemachus's category): **Open WebUI** (breadth/leader), LibreChat (multi-provider + MCP depth), Lobe (memory + branching), Odysseus (productivity domain).
- **Coding depth**: OpenCode (Plan/Build, LSP, PermissionV2), t3code (provider-broker GUI), pi (toolkit).
- **Channel breadth + swarm**: Hermes (~25 channels, Kanban, 6 sandboxes, hibernation), OpenClaw (~22 channels, Gateway multi-device, Agent Canvas).
- **Memory**: Letta (blocks + sleeptime distillation), Lobe (5-layer editable), OpenClaw (memory-wiki + LanceDB).
- **Everything-assistant**: OpenClaw is closest to the full personal workspace.

## Whitespace — confirmed net-new across all 10 (◆)

1. **Work surface** — in-conversation pinned-message→checklist + per-conversation notes. _(Provenance: LibreChat #6743 unmerged, OpenAI Dev Community ×2, shadcn X.)_ OWUI/Lobe notes are global/non-thread; nobody ships the per-conversation surface.
2. **Glass-box rewind-to-step + fork a run** — conversation-_fork_ exists (LibreChat/Letta/OCode); true step-rewind absent everywhere.
3. **Durable distilled _working_ memory** — Letta's blocks + sleeptime is closest, but it's agent-persona memory; project working-state resume ("decided/tried/next") is open.
4. **Agent-native reactive data model + synced frontend** — nobody exposes runs/steps/conversation as the live, queryable, synced product model.
5. **True local-first CRDT multi-device sync** — all are server+clients.

These share one shape — **reactive UI over synced local agent/conversation state** — the wedge in [`../ideas/thesis.md`](../ideas/thesis.md).

## Implications for Telemachus

- **Net-new (◆) = the wedge.** Validated by absence across 10 popular projects + cross-community demand provenance (work surface).
- **Cover the loud table stakes** the sweep surfaced — folders/projects org, cost visibility, voice input — even though they don't differentiate.
- **Deprioritize multi-user/RBAC** (off the personal-first identity), despite it being common here.
- **Strongest design references** (study + reimplement, never depend): OpenCode (PermissionV2, provider abstraction, Effect runtime), Letta (memory blocks + sleeptime), Lobe (editable memory, PGlite-local), LibreChat (MCP manager + SSE resume), pi (provider abstraction + agent-loop API shapes).
