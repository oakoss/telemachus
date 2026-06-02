# Repo shape & R1 toolchain: Turborepo, Vitest/Playwright, Zod, XState Store

- **Status:** Accepted
- **Date:** 2026-06-02
- **Authors:** @jbabin91

## Context

Before R1 code, the repository needs a structure and a set of foundational dev libraries: a monorepo layout (room for desktop/mobile later), testing, runtime validation, and client-side UI state.

Constraints that apply:

- **All-TypeScript**, **free / open-source**.
- Pairs with the prior ADRs — validation feeds [ADR-003](003-orm-drizzle.md) (Drizzle), [ADR-004](004-auth-better-auth.md) (Better Auth), and [ADR-006](006-model-llm-layer.md) (TanStack AI structured output); state complements [ADR-001](001-data-layer-tanstack-db-electric-pglite.md) (TanStack DB holds _data_ state).

This decision is **scoped to repo shape + these libraries**. The concrete package boundaries, the Turbo task pipeline, the CI setup, and the desktop/mobile shells are deferred to R1.

Evidence (verified 2026-06-02): Zod v4 is stable; `@xstate/store` v3 is a <1kb event-based store with first-class TS, selectors, **and atoms** (Zustand-and-Jotai in one), from the XState family. ([XState Store v3](https://stately.ai/blog/2025-02-26-xstate-store-v3))

## Decision

- **Monorepo: Turborepo** — `apps/` + `packages/`, with task caching/orchestration. Single app today; structured for desktop/mobile/shared packages later.
- **Testing: Vitest** (unit/integration, Vite-native) **+ Playwright** (e2e/browser).
- **Validation / schema: Zod (v4)** — runtime schemas at every boundary (server functions, env, forms), shared with Drizzle, Better Auth, and TanStack AI structured output.
- **Client UI state: `@xstate/store` (v3)** — tiny stores + atoms for ephemeral UI state. Data state stays in TanStack DB. The XState family gives a statechart upgrade path for the agent run/step model (Rungs 4–5).

## Consequences

**Easier / gained:**

- Monorepo is ready for multi-surface (web now; desktop/mobile later) without a retrofit.
- One validation library across the whole stack; Vite-native testing; a tiny state lib with a statechart path that fits the agent orchestration ahead.

**Harder / accepted tradeoffs:**

- **Turborepo adds config for a currently-single-app repo** — accepted; starting as a monorepo is cheaper than converting one later.
- **`@xstate/store` is less of an ecosystem default than TanStack Store** — accepted for the atoms + statechart-family synergy.
- **Zod v4** is recent — pin versions.

**Follow-up:**

- Define package boundaries + the Turbo pipeline at R1; CI later.

## Alternatives considered

- **Single package (no monorepo)** — simpler now, but retrofitting a monorepo when desktop/mobile arrive costs more. **Not chosen.**
- **pnpm workspaces without Turbo** — viable; Turbo adds caching/task orchestration worth it across packages. **Turbo chosen.**
- **Nx** — more powerful but heavier/opinionated than Turbo for this scale. **Not chosen.**
- **TanStack Store** (state) — ecosystem-native and tiny, but lacks the statechart family path. **Not chosen** (close call).
- **Valibot / ArkType** (validation) — strong, smaller/faster options, but Zod's ubiquity + ecosystem integration (incl. TanStack AI) won. **Not chosen.**
- **Jest** (testing) — Vitest preferred for Vite-native speed + ESM.
