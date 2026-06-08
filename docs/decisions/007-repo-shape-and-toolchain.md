# Repo shape & R1 toolchain: Turborepo, Vitest/Playwright, Zod, XState Store

- **Status:** Accepted
- **Date:** 2026-06-02
- **Authors:** @jbabin91

## Context

Before R1 code, the repository needs a structure and a set of foundational dev libraries: a monorepo layout (room for desktop/mobile later), testing, runtime validation, and client-side UI state.

Constraints that apply:

- **All-TypeScript**, **free / open-source**.
- Pairs with the prior ADRs — validation feeds [ADR-003](003-orm-drizzle.md) (Drizzle), [ADR-004](004-auth-better-auth.md) (Better Auth), and [ADR-006](006-model-llm-layer.md) (TanStack AI structured output); state complements [ADR-001](001-data-layer-tanstack-db-electric-pglite.md) (TanStack DB holds _data_ state).

This decision is **scoped to repo shape + these libraries**. The concrete package boundaries, the Turbo task pipeline, and CI land at **E0** (the scaffold) — detailed in [`scaffold.md`](../specs/scaffold.md) + [`ci-cd-release.md`](../specs/ci-cd-release.md); the desktop/mobile shells come later ([ADR-008](008-architecture-and-topology.md)).

Evidence (verified 2026-06-02): Zod v4 is stable; `@xstate/store` v3 is a <1kb event-based store with first-class TS, selectors, **and atoms** (Zustand-and-Jotai in one), from the XState family. ([XState Store v3](https://stately.ai/blog/2025-02-26-xstate-store-v3))

**Re-verified 2026-06-07:** Zod holds — v4 remains the stable major (current 4.4.3; no v5, only 4.5.0 canaries). **The `@xstate/store` pin is stale:** v4.0.0 shipped 2026-05-27 and v4.1.0 on 2026-05-29 — both _before_ this ADR's 2026-06-02 date, so the cited "v3" (and the linked v3 blog post) were already a major behind at authoring. v4 retains and expands the cited **atoms** (`createAtomConfig` / `createReducerAtom` / `createAsyncAtom` + `useAtomState`) and adds Standard Schema support (a Zod synergy). v4 is breaking: **ESM-only**, framework imports move to dedicated packages (`@xstate/store/react` → `@xstate/store-react`), `createStoreWithProducer` removed, `undoRedo` now `.with(undoRedo())`. **The decision now selects v4** (the current major; bullet below updated) — v3 was already a major behind at authoring. Wiring it up when client UI state is built is tracked in `telemachus-ubl`. The rationale (tiny atom store + statechart-family upgrade path) is unchanged; nothing is installed yet.

## Decision

- **Monorepo: Turborepo** — `apps/` + `packages/`, with task caching/orchestration. Shared config as **split packages** (`packages/typescript` = tsconfig bases, `packages/eslint` = flat-config presets) so a package needing only a tsconfig doesn't pull lint deps. Single app today; structured for desktop/mobile/shared packages later.
- **Testing: Vitest** (unit/integration, Vite-native) **+ Playwright** (e2e/browser); integration runs against real Postgres via **Testcontainers** ([ADR-003](003-orm-drizzle.md)).
- **Lint / format: lean oxlint + ESLint, oxfmt.** **oxlint** = the fast pass — **native rules only (no jsPlugins)**, one root run via **nested configs** (`extends` a shared base; `options.typeAware: true` is root-only). **ESLint** = all third-party plugins + the type-aware **gap**, via per-package presets from `packages/eslint` (authored with `defineConfig`/`globalIgnores` from `eslint/config`), deduped against the root oxlint config with **`eslint-plugin-oxlint`**. **Type-aware = oxlint-first** (tsgolint), ESLint filling uncovered rules; **migrate ESLint→oxlint only as oxlint goes native** (the dedupe self-maintains). **oxfmt** formats JS/TS + JSON/JSONC/CSS/HTML/YAML; markdownlint covers markdown. **Hooks:** the full gate — oxlint + ESLint + `tsc` typecheck — runs on **pre-commit** (Turbo-cached) so every commit lands green without fix-up commits; CI re-runs it as the backstop.
- **CI / release: GitHub Actions + Changesets + Renovate** — a job split + a single aggregate gate, Changesets-driven releases (incl. the GHCR image), Renovate for deps/Actions. Full plan: [`ci-cd-release.md`](../specs/ci-cd-release.md).
- **Validation / schema: Zod (v4)** — runtime schemas at every boundary (server functions, env, forms), shared with Drizzle, Better Auth, and TanStack AI structured output.
- **Client UI state: `@xstate/store` (v4)** — tiny stores + atoms for ephemeral UI state. Data state stays in TanStack DB. The XState family gives a statechart upgrade path for the agent run/step model (Rungs 4–5). (v4 is the current major; see _Re-verified 2026-06-07_ for the v3→v4 breaking-change notes.)

## Consequences

**Easier / gained:**

- Monorepo is ready for multi-surface (web now; desktop/mobile later) without a retrofit.
- One validation library across the whole stack; Vite-native testing; a tiny state lib with a statechart path that fits the agent orchestration ahead.

**Harder / accepted tradeoffs:**

- **Turborepo adds config for a currently-single-app repo** — accepted; starting as a monorepo is cheaper than converting one later.
- **`@xstate/store` is less of an ecosystem default than TanStack Store** — accepted for the atoms + statechart-family synergy.
- **Zod v4** is recent — pin versions.

**Follow-up:**

- Package boundaries + the Turbo pipeline land at **E0** (the scaffold) — see [`scaffold.md`](../specs/scaffold.md).
- **Decided at E0 (2026-06-03):** non-JS-file formatting → **oxfmt** (JSON/JSONC/YAML/CSS/HTML) + **markdownlint** (md), not Prettier/dprint; cross-package types resolve from **source** via per-package `exports` → `./src` (`moduleResolution: bundler`, no build) rather than tsconfig `paths`; **knip** (unused files/deps/exports) + **sherif** (package.json/workspace consistency — `unordered-dependencies` disabled, oxfmt owns ordering) adopted for repo hygiene, to run in CI + locally (CI at E0.7). Pairs with the no-barrels / explicit-exports rule.
- **oxlint type-aware enabled at E0.9 (2026-06-03), made config-level at E0.2 (2026-06-04):** `oxlint-tsgolint` + **`.oxlintrc.json` `options.typeAware: true`** (not the `--type-aware` flag), so oxlint is type-aware **everywhere it runs, including the lefthook pre-commit gate**. One canonical config (the editor's `oxc.typeAware` matches it) — chosen over splitting flag usage across hooks, accepting a slightly slower pre-commit that needs `tsgolint`. Per-package `tsconfig.json`s are the type-info anchors — **no root tsconfig needed** (tsgolint resolves each package's config from a root run; verified empirically). The ESLint dedupe (`eslint-plugin-oxlint`) reads the real root `.oxlintrc.json` via `buildFromOxlintConfigFile(…, { typeAware: true })`, so ESLint drops exactly the rules oxlint covers — type-aware included — and keeps only the gap.
- **ESLint sorting via `eslint-plugin-perfectionist` (E0.2, 2026-06-04):** perfectionist owns the sorting oxfmt/oxlint don't — **JSX props** (fills the `.10` `jsx-sort-props` gap; `@eslint-react` has no equivalent), union/intersection types, interface/object-type members, and **scoped** object keys (config/component/story files only — object-key order is often semantic). **Imports stay with oxfmt** — perfectionist's `sort-imports`/`sort-named-imports` are deliberately not enabled.
- **`@oakoss/eslint` authored in TypeScript (E0.2, 2026-06-05):** the preset moved from hand-written `index.js` + `index.d.ts` to **raw TS source** (`src/index.ts`, exported as `./src/index.ts`) — **no build**, resolved from source like every other package (it was the lone exception to the source-resolution rule above; now it conforms). The 4 `eslint.config.*` are now `.ts`. **jiti, not native Node or a build:** Node's native type-stripping (stable since v24.12) **deliberately refuses `.ts` under `node_modules`** — where pnpm symlinks workspace packages — with no override flag, so it can't load `@oakoss/eslint` as `.ts`; **jiti** transpiles the whole chain including `node_modules` (the path ESLint's docs prescribe). jiti is a required root devDep; knip ignores it and config loading silently fails if it's removed. A **tsdown build → `dist` (JS + generated `.d.ts`)** is the alternative and the _only_ option if `@oakoss/eslint` is ever **published to npm**, but it adds the repo's first build step + a `lint: dependsOn ^build` dependency for no benefit while private, so it's deferred. Export types are now inferred `Config[]` (no hand-maintained `.d.ts` to drift).

## Alternatives considered

- **Single package (no monorepo)** — simpler now, but retrofitting a monorepo when desktop/mobile arrive costs more. **Not chosen.**
- **pnpm workspaces without Turbo** — viable; Turbo adds caching/task orchestration worth it across packages. **Turbo chosen.**
- **Nx** — more powerful but heavier/opinionated than Turbo for this scale. **Not chosen.**
- **TanStack Store** (state) — ecosystem-native and tiny, but lacks the statechart family path. **Not chosen** (close call).
- **Valibot / ArkType** (validation) — strong, smaller/faster options, but Zod's ubiquity + ecosystem integration (incl. TanStack AI) won. **Not chosen.**
- **Jest** (testing) — Vitest preferred for Vite-native speed + ESM.
