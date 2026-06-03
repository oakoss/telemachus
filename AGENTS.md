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

**Firm constraints (guardrails — these shape every choice):** free / OSS only, self-hosted (Proxmox / Coolify) — no paid or hobby-tier SaaS; **build-our-own**, all-TypeScript — surveyed projects are references to reimplement, never dependencies; **personal-first**.

**Where things live:** [`docs/README.md`](docs/README.md) is the map. Stack/architecture decisions → [`docs/decisions/`](docs/decisions/) (the ADRs are the source of truth; stack-at-a-glance in its [README](docs/decisions/README.md)). Scope/identity → [`docs/ideas/scope-positioning.md`](docs/ideas/scope-positioning.md). Sequence/rungs → [`docs/specs/roadmap.md`](docs/specs/roadmap.md). Status, open threads, and project memory → `bd prime` / `bd ready`.

## Documentation

Keep docs aligned — **one source of truth per concern; everywhere else links, never restates** (the map is [`docs/README.md`](docs/README.md)). When creating or updating a doc:

- State a fact in its **canonical home only**; from anywhere else, **link** to it — don't copy the content (copies drift).
- **Never declare a derivative the source of truth.** The ADRs are the record for decisions; bd is the record for status. An index/summary points _at_ them; it is not _them_.
- The **stack-at-a-glance** index ([`docs/decisions/README.md`](docs/decisions/README.md)) is updated **in the same change** as the ADR it summarizes.
- **bd memories** may summarize for fast recall, but must point to the canonical doc — not a second authority.
- Before adding a new doc, check the map: if the concern already has a home, extend it rather than starting a parallel one.

## Build & Test

_No build yet. Add commands here once application code exists._
