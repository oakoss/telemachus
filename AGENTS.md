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

### Commit & PR conventions

- **Bead IDs go in the commit footer, never the subject line or PR title.** Reference a bead with a trailer — `Refs: telemachus-8zj.7.1` (or `Closes: <id>`) — and keep subjects and PR titles human-readable. Bead IDs aren't GitHub issues, so they don't auto-link; the footer keeps the trace without cluttering the subject. Conventional Commits otherwise (commitlint `config-conventional`).

## Project

Telemachus — a personal-first, local-first chat + agent hub; a spiritual successor to Odysseus. Early build: monorepo scaffold + foundations (E0).

**Firm constraints (guardrails — these shape every choice):** free / OSS only, self-hosted (Proxmox / Coolify) — no paid or hobby-tier SaaS; **build-our-own**, all-TypeScript — surveyed projects are references to reimplement, never dependencies; **personal-first**.

**Where things live:** [`docs/README.md`](docs/README.md) is the map. Stack/architecture decisions → [`docs/decisions/`](docs/decisions/) (the ADRs are the source of truth; stack-at-a-glance in its [README](docs/decisions/README.md)). Scope/identity → [`docs/ideas/scope-positioning.md`](docs/ideas/scope-positioning.md). Sequence/rungs → [`docs/specs/roadmap.md`](docs/specs/roadmap.md). Status, open threads, and project memory → `bd prime` / `bd ready`.

## Documentation

Keep docs aligned — **one source of truth per concern; everywhere else links, never restates** (the map is [`docs/README.md`](docs/README.md)). When creating or updating a doc:

- State a fact in its **canonical home only**; from anywhere else, **link** to it — don't copy the content (copies drift).
- **Never declare a derivative the source of truth.** The ADRs are the record for decisions; bd is the record for status. An index/summary points _at_ them; it is not _them_.
- The **stack-at-a-glance** index ([`docs/decisions/README.md`](docs/decisions/README.md)) is updated **in the same change** as the ADR it summarizes.
- **bd memories** may summarize for fast recall, but must point to the canonical doc — not a second authority.
- Before adding a new doc, check the map: if the concern already has a home, extend it rather than starting a parallel one.

## Comments

Comments earn their place by explaining **WHY or non-obvious context, never WHAT**. If the code explains itself, it needs **no comment — not even a one-liner**.

- A good comment is **accurate** (matches the code; delete it when it goes stale), **earns its place** (captures intent, a gotcha, or an invariant the code can't show), and is **concise**.
- Don't restate the code, add section markers (`// ===== helpers =====`), or narrate (`// Here we…`, `// Let's…`, `// This…`).
- No hedging or filler (`obviously`, `basically`, `just`), and no `Note:` / `Important:` prefixes when the surrounding text already conveys the weight.
- TODOs need a bead reference; cross-references that belong in the commit/PR (`added for X`, `used by Y`) stay out of the code.
- When in doubt, delete it — if it's worth keeping, make it tighter.

## Build & Test

Turborepo + pnpm monorepo. The full gate (runs on pre-commit) is `pnpm lint` (oxlint + ESLint + markdownlint) + `pnpm typecheck`; rounded out by `pnpm test` (Vitest), `pnpm build`, `pnpm format` / `format:check` (oxfmt), and `pnpm knip` / `pnpm sherif` (monorepo hygiene). The full script list lives in the root `package.json`; toolchain rationale in [ADR-007](docs/decisions/007-repo-shape-and-toolchain.md).
