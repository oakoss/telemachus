# Development conventions

Code-level conventions for working in this repo — the rules a PR is reviewed against, as opposed to [`../specs/`](../specs/) (what to build) and [`../decisions/`](../decisions/) (why the stack is what it is).

- [`dev-environment.md`](dev-environment.md) — bootstrap, services/ports (and collisions), run matrix, gate + e2e commands.
- [`routing.md`](routing.md) — `apps/web/src/routes/`: file conventions, route groups, thin route files, option ordering, URL-driven state.
- [`testing.md`](testing.md) — test tiers, vitest config rule, factory pattern (R1), e2e conventions (locators, error trapping, tags).
- [`components.md`](components.md) — composition, compound naming, data-attributes, state patterns, a11y baseline.
