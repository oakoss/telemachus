# Community-requested features (value-filtered sweep)

- **Status:** Research, 2026-06-01 (snapshot; re-verify before committing roadmap)
- **Scope:** Demand-signal layer — what users _actively request_, across the 10 deep-dived projects + broader communities. Companion to [`differentiation-opportunities.md`](differentiation-opportunities.md) (which it refreshes/widens) and the deep dives.
- **Method:** Top-reacted **open** issues per repo via GitHub search API (ranked by 👍 + comments) + targeted web search (OpenAI Dev Community, comparison/wishlist articles). Lobe Chat routes requests through Discussions (not issue-searchable here) — its features are covered in its deep dive.
- **Value filter (per request — kept only if all hold):** (1) recurring across ≥2 communities **or** high engagement; (2) aligned with telemachus's _personal-first, conversation-primary_ identity; (3) not already covered by parity/imports; (4) broadly useful, not niche. Everything else dropped, not listed.
- **Honest caveat:** AI-tool vote counts are modest; we weight **independent recurrence across communities** over raw votes. Demand evidence is "as-reported"; counts drift.

## 1. Validates a net-new wedge item (demand provenance)

- **Work surface — pinned messages + per-conversation notes.** _Provenance:_ OpenAI Dev Community ["Pinned Messages"](https://community.openai.com/t/feature-request-pinned-messages/1122291) and ["Pinned Messages or Notes in ChatGPT Conversations"](https://community.openai.com/t/pinned-messages-or-notes-in-chatgpt-conversations/1146841); shadcn's X request; the earlier LibreChat **#6743** "Pins, Notes, Variables" citation no longer resolves upstream as of 2026-06-07. Recurs across ≥2 communities. OpenAI/Open WebUI ship pinned _chats_ (conversation-level) and _global_ notes — the requested **in-conversation pins-as-checklist + notes beside the thread** is still open everywhere. → Confirms the wedge is wanted.
- **Durable working memory** and **glass-box rewind+fork** did **not** surface as loud community requests — these are _quiet/emerging_ demand (the bet), not mass-validated asks. Honest signal: telemachus is _ahead_ of explicit demand here, not chasing it.

## 2. High-demand parity/import (table-stakes that are genuinely wanted)

The loudest requests overall are organization + cost + voice — telemachus should cover these even though they aren't differentiators:

- **Chat organization — folders / projects / tags.** LibreChat **175👍** (its #1 request); Open WebUI + Lobe already have folders. The single strongest demand in the sweep.
- **Cost / token-usage visibility per conversation.** LibreChat 68👍; t3code "usage/quota visibility" 23👍.
- **Voice input (STT) + realtime API.** OpenCode "Speech-to-Text voice input" **191👍**; Open WebUI "openai real-time api" 71👍; LibreChat 54👍.
- **Tool-call approval — "ask before tool call" / exec denylist.** LibreChat 47👍; OpenClaw exec-approval denylist. Confirms the allow/ask/deny import (Plan/Act rung).
- **Custom system prompts per scope** (global/project/custom). OpenCode 150👍.
- **Model auto-discovery from OpenAI-compatible endpoints.** OpenCode 140👍 (Odysseus already probes providers).
- **More local-model + web-search providers.** pi local-LLM 38👍; Hermes SearXNG/Brave requests.

## 3. New UX ideas worth considering (value-adding, less obvious)

- **Async steering — queue/steer follow-ups + notify on completion / approval-required.** t3code 29👍 ×2. Strong fit for the agent-native trajectory ("check in on an agent") and the work surface (surface "needs you" / "done" without watching the stream).
- **`/btw` side-context injection.** OpenCode **273👍** — inject context mid-run without derailing the main thread. Adjacent to the work-surface/steering idea; worth a design look.
- **Expand collapsed pasted text** (OpenCode 234👍) — small UX, high demand among power users.
- **Memory consolidation/dedup + eval benchmarks** (Letta requests) — informs durable-memory wedge _quality_ (LOCOMO/LongMemEval).
- **Agent teams / A2A multi-agent** (OpenCode "Agent Teams" 181👍; Hermes A2A 28👍) — agent orchestration; later rung, fits the agent-native destination.

## 4. Deprioritized given personal-first (a useful filter outcome)

Much of the _loudest_ demand on the multi-user chat workspaces is **off telemachus's identity**: admin panel (LibreChat 113👍), teams/groups/workspaces (46👍), shared-chat auth (Open WebUI 41👍), RBAC/LDAP/SAML/SSO. These are enterprise/multi-user concerns — **low priority for a personal-first tool**. (Keep only lightweight security like 2FA, which Odysseus already has, if/when a "product later" path opens.)

**Takeaway:** the loud demand is _organization, cost, voice, approval_ (cover these as high-demand table stakes) and _multi-user/admin_ (skip — off-identity). The wedge is _quiet_ demand with cross-community recurrence (the bet). Telemachus wins by shipping the wedge **and** not neglecting the high-demand org/cost/voice basics.

## Sources

- GitHub search API: top-reacted open issues across the 10 repos (2026-06-01)
- [OpenAI Dev Community: Pinned Messages](https://community.openai.com/t/feature-request-pinned-messages/1122291) · [Pinned Messages or Notes in ChatGPT Conversations](https://community.openai.com/t/pinned-messages-or-notes-in-chatgpt-conversations/1146841)
- Comparison/wishlist articles (elest.io, onyx.app, tokenmix.ai, portkey.ai) — Open WebUI/LibreChat/Lobe positioning, 2026
