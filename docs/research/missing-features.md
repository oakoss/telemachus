# Missing features — what Telemachus should build

- **Status:** Research synthesis, 2026-06-01 (snapshot; re-verify before committing roadmap)
- **Purpose:** Distill the 10 deep dives + [`community-requests.md`](community-requests.md) into _what to build_ — the differentiator + priority backlog. Feeds [`feature-matrix.md`](feature-matrix.md) (net-new rows) and [`../ideas/scope-positioning.md`](../ideas/scope-positioning.md) (ring 3).
- **Honesty rules:** each item names its **closest existing** reference and **provenance**, so we claim _"nobody ships it well,"_ not _"we invented it."_ Build-our-own throughout — references are studied, never imported.

## Tier 1 — Net-new (nobody ships it; the wedge)

Confirmed absent across all 10 popular projects (~376k★ OpenClaw down to ~12k★ t3code).

| Feature                                                                                                                                 | Closest existing                                                                                                   | Provenance / demand                                                                            | Build-risk                                                                                                                       |
| --------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **Work surface** — in-conversation pinned-message → checklist + notes scratchpad beside the thread                                      | Open WebUI _global_ Notes; OpenAI shipped pinned _chats_; Lobe Activity.notes (not per-thread)                     | LibreChat #6743 (unmerged) + OpenAI Dev Community ×2 + shadcn X — recurs across ≥3 communities | **Low** — pure reactive UI over `pins`/`notes` collections; chat-only spine. First differentiator (roadmap Rung 2).              |
| **Durable distilled _working_ memory** — project state "decided / tried / next", resume without re-explaining                           | Letta (memory blocks + sleeptime distillation) — but _agent-persona_ memory; Lobe (5-layer _user-modeling_ memory) | Quiet/emerging demand (band-aid ecosystem: handover plugins, CONTINUITY MCP, progress files)   | **Med** — distillation step + schema; reuse Letta's block + background-consolidate _pattern_, retarget to project working-state. |
| **Glass-box rewind + fork a run** — step the run, rewind to a decision point, fork an alternate path                                    | Conversation-fork in LibreChat / Letta / OpenCode; LangGraph time-travel (not reviewed)                            | Quiet demand; the trust mechanism for a privileged tool                                        | **High** — needs `runs`/`runSteps` model + replay; true step-rewind beyond anyone surveyed.                                      |
| **Agent-native reactive data model + synced frontend** — runs/steps/conversation/pins/notes/memory as live queryable synced collections | Lobe (Drizzle + reactive store); none expose it as the product model                                               | None (architectural)                                                                           | **Med-High** — the engine the other three ride on; TanStack DB lean.                                                             |
| **True local-first CRDT multi-device sync**                                                                                             | All surveyed are server+clients (OpenClaw Gateway, OWUI server)                                                    | Low explicit demand, high strategic value                                                      | **High** — ElectricSQL lean; backbone, timing flexible.                                                                          |

These items share one shape — **reactive UI over synced local agent/conversation state** (local-first sync is the backbone they ride on) — so they all rest on the data model (thread #2). The work surface is the cheap, demoable first proof.

## Tier 2 — Import gaps (proven elsewhere; the parity baseline lacks)

Lower-risk adds (someone ships it; study + reimplement):

| Feature                                       | Best reference(s)                                                               | Notes                                                       |
| --------------------------------------------- | ------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| **Tool approval (allow / ask / deny)**        | OpenCode `PermissionV2` (arity matching, reply modes, subagent inheritance)     | Also high community demand (LibreChat 47👍). Plan/Act rung. |
| **Skills registry**                           | Hermes skills.sh, OpenClaw ClawHub                                              | Odysseus has skills, no registry.                           |
| **Editable / white-box memory**               | Lobe (5-layer editable), Letta (memory blocks)                                  | Tier-2 wedge-adjacent.                                      |
| **Multi-device sync / Gateway**               | OpenClaw (node pairing, WS relay)                                               | Distinct from CRDT sync; an interim.                        |
| **Serverless hibernation**                    | Hermes (Modal/Daytona sleep-when-idle)                                          | For durable always-on agents.                               |
| **Sandboxed exec backends**                   | Hermes (6 backends), OpenClaw (Docker/SSH/OpenShell), OpenCode (containers/PTY) |                                                             |
| **Model routing / fallback**                  | Hermes (error-classified failover), OpenCode (ProviderV2)                       |                                                             |
| **Per-component context breakdown + pruning** | (Tier-2 gap; Cursor/OWUI have context bar)                                      | The still-open slice.                                       |
| **Deep research**                             | Odysseus, Open WebUI                                                            | Table stakes for a workspace.                               |

## Tier 3 — High-demand table stakes (from the sweep; not differentiators, but wanted)

Cover these even though they don't differentiate — they're the loud demand:

- **Chat organization — folders / projects / tags** (LibreChat #1 request, 175👍; OWUI/Lobe have it)
- **Cost / token-usage visibility per conversation** (LibreChat 68👍, t3code 23👍)
- **Voice input (STT) + realtime** (OpenCode 191👍, OWUI 71👍, LibreChat 54👍)
- **Custom system prompts per scope** (OpenCode 150👍)
- **Model auto-discovery from OpenAI-compatible endpoints** (OpenCode 140👍)
- **Async steering — queue/steer follow-ups + completion/approval notifications** (t3code 29👍 ×2; fits "check in on an agent" + work surface)
- **`/btw` side-context injection** (OpenCode 273👍; adjacent to the work surface)

## Deprioritized — off identity (personal-first)

Loud on multi-user chat workspaces, but **not** for a personal-first tool: admin panel (LibreChat 113👍), teams/groups/workspaces (46👍), shared-chat auth, RBAC/LDAP/SAML/SSO. Revisit only if the optional "product later" path opens. (Keep lightweight 2FA at most.)

## What this implies for build order

- **Data model (thread #2) first** — all Tier-1 items are live queries over synced collections, so the schema is the spine.
- **Work surface (Rung 2)** is the cheapest Tier-1 proof; ship it early.
- **Tier-3 org/cost/voice** are demand-validated table stakes — fold into early rungs, not deferred to "later."
- **Glass-box fork (thread #3)** and **durable memory (thread #4)** ride on the run/history model — design after #2.
