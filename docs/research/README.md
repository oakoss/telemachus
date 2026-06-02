# Research Notes

Findings from investigations that inform decisions but are not decisions themselves. Examples: stack and tooling evaluations, ecosystem surveys, prior-art reviews, performance studies.

## When to add research notes

- After investigating an option that we may revisit
- After comparing multiple alternatives where the trade-offs matter
- After surveying prior art or the ecosystem for ideas and gaps

## Format

- Filename: `short-kebab-title.md` (e.g. `stack-options.md`, `prior-art.md`)
- Include date, scope, and sources at the top
- Cite primary sources (URLs fetched, repo paths, npm registry data)

## Why this exists

Future contributors should be able to see "we looked at X and chose Y because Z" without re-litigating. Research notes prevent repeat investigations — and, until something commits to a choice, they are where stack and tooling recommendations live, not [`../decisions/`](../decisions/).
