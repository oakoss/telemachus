# Implementation Specs

Detailed implementation plans written AFTER a direction is set — a decision recorded, or an idea matured enough to build. One spec per significant feature.

## When to write a spec

- Implementing a non-trivial feature (the agent runtime, glass-box replay, local-first sync)
- Implementing a system-wide capability (the MCP host, the model router, the sync layer)
- When the implementation will span multiple PRs

## When NOT to write a spec

- Trivial changes where the approach is obvious
- Bug fixes
- Detail that fits in a PR description

## Format

- Filename: `short-kebab-title.md` (e.g. `agent-runtime.md`, `v0-tracer-bullet.md`)
- No numbering — specs are organized by topic, not chronology
- Use the template at [`_template.md`](_template.md)

## Lifecycle

Specs are living documents. Update them when the implementation diverges from the plan, and mark them `Superseded` when replaced.
