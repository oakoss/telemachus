# Decisions

This directory records the architectural decisions made for Telemachus. Each decision captures the context, the choice, and the consequences at the time it was written — a record for whenever someone wonders why we picked X over Y.

Decisions are not commandments. Future evidence can override them. The historical record stays.

## The stack at a glance

One-line index of what's decided; each row links its ADR (the full context, reasoning, and **source of truth**). Update a row in the same change as the ADR it summarizes — the index lives next to the source so it can't drift.

| ADR                                                  | Layer                   | Decision                                                                                          |
| ---------------------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------- |
| [001](001-data-layer-tanstack-db-electric-pglite.md) | Data layer              | TanStack DB + ElectricSQL; **SQLite** on-device (PGlite dropped; server tests via Testcontainers) |
| [002](002-app-framework-tanstack-start-nitro.md)     | App framework + deploy  | TanStack Start + Nitro (node preset → Coolify)                                                    |
| [003](003-orm-drizzle.md)                            | ORM                     | Drizzle (server Postgres)                                                                         |
| [004](004-auth-better-auth.md)                       | Auth                    | Better Auth                                                                                       |
| [005](005-ui-react-aria-intent.md)                   | UI                      | react-aria-components + Intent UI (Tailwind v4, copy-paste)                                       |
| [006](006-model-llm-layer.md)                        | Model / LLM             | TanStack AI + Ollama (build-our-own loop; external-runner first, Cookbook later)                  |
| [007](007-repo-shape-and-toolchain.md)               | Repo / toolchain        | Turborepo · Vitest/Playwright · Zod v4 · @xstate/store · lean oxlint + ESLint · knip + sherif     |
| [008](008-architecture-and-topology.md)              | Architecture / topology | Node; modular `packages/*`; Hono `core` + Start BFF; PWA → Tauri 2; Fumadocs                      |

## When to write a decision

- A choice between two or more meaningful technical options is being made
- The decision will be hard or expensive to reverse
- Future contributors (including future you) will benefit from knowing the reasoning

## When NOT to write a decision

- Implementation details that can change without breaking anything downstream
- Temporary or experimental work
- Stack, tooling, and vendor evaluations where nothing yet depends on the choice — these belong in [`../research/`](../research/) as recommendations. A decision is recorded only once something actually commits to the choice.

## Scope discipline

Two disciplines apply to every decision:

- **Scope tightly.** Decide only what you are actually deciding. If a question depends on another decision that is still pending, defer it to its own future decision and link the pending source. Do not pre-commit to downstream choices implicitly. Example: choosing the frontend framework should not implicitly lock the backend runtime.
- **Verify external-system claims.** Any claim about how an external library, tool, or API behaves must be verified against current docs or source before being asserted as fact. Reasoning from training data alone is not sufficient. If a claim cannot be verified, soften it or defer it.

## Format

- Filename: `NNN-short-kebab-title.md` (e.g. `001-name-and-oakoss-placement.md`)
- Number sequentially; do not reuse numbers
- Use the template at [`000-template.md`](000-template.md)

## Lifecycle

Decisions are immutable once accepted. To change one, write a new decision that supersedes it and update the old one's status to `Superseded by NNN`.

While Telemachus is pre-v0 with no code depending on these records, this lifecycle is soft: amending, relocating, or superseding a decision is cheap. Tighten it once the first packages and running code exist.
