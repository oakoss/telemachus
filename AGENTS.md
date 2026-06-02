# Project Instructions for AI Agents

Instructions and context for AI coding agents working on this project. This is the single source of truth; `CLAUDE.md` imports it.

<!-- BEGIN BEADS INTEGRATION v:1 profile:minimal hash:6cd5cc61 -->

## Beads Issue Tracker

This project uses **bd (beads)** for issue tracking. Run `bd prime` to see full workflow context and commands.

### Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --claim  # Claim work
bd close <id>         # Complete work
```

### Rules

- Use `bd` for ALL task tracking — do NOT use TodoWrite, TaskCreate, or markdown TODO lists
- Run `bd prime` for detailed command reference and session close protocol
- Use `bd remember` for persistent knowledge — do NOT use MEMORY.md files

**Architecture in one line:** issues live in a local Dolt DB; sync uses `refs/dolt/data` on your git remote; `.beads/issues.jsonl` is a passive export. See <https://github.com/gastownhall/beads/blob/main/docs/SYNC_CONCEPTS.md> for details and anti-patterns.

## Agent Context Profiles

The managed Beads block is task-tracking guidance, not permission to override repository, user, or orchestrator instructions.

- **Conservative (default)**: Use `bd` for task tracking. Do not run git commits, git pushes, or Dolt remote sync unless explicitly asked. At handoff, report changed files, validation, and suggested next commands.
- **Minimal**: Keep tool instruction files as pointers to `bd prime`; use the same conservative git policy unless active instructions say otherwise.
- **Team-maintainer**: Only when the repository explicitly opts in, agents may close beads, run quality gates, commit, and push as part of session close. A current "do not commit" or "do not push" instruction still wins.

## Session Completion

This protocol applies when ending a Beads implementation workflow. It is subordinate to explicit user, repository, and orchestrator instructions.

1. **File issues for remaining work** - Create beads for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **Handle git/sync by active profile**:

   ```bash
   # Conservative/minimal/default: report status and proposed commands; wait for approval.
   git status

   # Team-maintainer opt-in only, unless current instructions forbid it:
   git pull --rebase
   git push
   git status
   ```

5. **Hand off** - Summarize changes, validation, issue status, and any blocked sync/commit/push step

**Critical rules:**

- Explicit user or orchestrator instructions override this Beads block.
- Do not commit or push without clear authority from the active profile or the current user request.
- If a required sync or push is blocked, stop and report the exact command and error.
<!-- END BEADS INTEGRATION -->

## Git & commits

**Never `git commit`, `git push`, or `dolt`-sync without explicit, per-action permission from the current user.** This restates the conservative default above, with the clarification that has bitten before:

- **Approval does not carry forward.** A "commit now" authorizes _that_ change only — it does not authorize committing the next batch. Re-confirm every time.
- After a review passes, **mark the review sentinel, then stop and ask** ("reviewed; ready to commit — suggested message: …") and wait for the explicit go. Committing is never part of "finishing" the work.
- Doing the work (writing/editing files, running reviews) is always fine; turning it into a commit is the gated step.

## Project

Telemachus — a personal-first, local-first chat + agent hub; a spiritual successor to Odysseus. Research/ideas phase; no application code yet.

**Decided:** the name; placement under oakoss; the thread-1 scope — personal-first; the conversation is the primary object; scope = parity with Odysseus + the wedge + best-of-breed imports; built wedge-first; agent-native is the _trajectory_, not the launch identity. **Stack:** data layer ([ADR-001](docs/decisions/001-data-layer-tanstack-db-electric-pglite.md)) = TanStack DB + ElectricSQL, SQLite on-device (PGlite dropped; server tests use real Postgres via Testcontainers); app framework + deploy ([ADR-002](docs/decisions/002-app-framework-tanstack-start-nitro.md)) = TanStack Start + Nitro (node preset → Coolify); ORM ([ADR-003](docs/decisions/003-orm-drizzle.md)) = Drizzle; auth ([ADR-004](docs/decisions/004-auth-better-auth.md)) = Better Auth; UI ([ADR-005](docs/decisions/005-ui-react-aria-intent.md)) = react-aria-components + Intent UI (copy-paste); model/LLM ([ADR-006](docs/decisions/006-model-llm-layer.md)) = TanStack AI + pluggable Ollama serving (build-our-own agent loop); repo + toolchain ([ADR-007](docs/decisions/007-repo-shape-and-toolchain.md)) = Turborepo, Vitest/Playwright, Zod v4, @xstate/store; runtime + architecture ([ADR-008](docs/decisions/008-architecture-and-topology.md)) = Node (revisit Bun), modular `packages/*` (core/extensions/shared), **Hono** `core` service + Start-as-BFF (extract at Rung 4), native PWA→Tauri 2, extensions = internal `packages/extensions`, docs site = Fumadocs on TanStack Start. **Free / OSS only, self-hosted** (Proxmox / Coolify) — no paid or hobby-tier SaaS.

**Stack is fully decided** ([ADR-001](docs/decisions/001-data-layer-tanstack-db-electric-pglite.md)–[008](docs/decisions/008-architecture-and-topology.md)). Remaining open items are **per-thread design** (e.g. where local-first sync enters, thread #5), not stack choices. TypeScript is the lane; UI/component enhancements are referenced from HeroUI/AI kits and reimplemented (own-the-code), never added as dependencies.

See `docs/` for the substance — `ideas/` (thesis, scope-positioning), `research/` (landscape, differentiation), `specs/` (roadmap ladder), `decisions/` (ADRs) — and run `bd prime` for project memory and the open threads (#2 data model, #3 fork semantics, #4 durable memory, #5 sync).

## Build & Test

_No build yet. Add commands here once application code exists._
