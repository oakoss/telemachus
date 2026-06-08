# Deep dive: t3code

- **Status:** Code-level review, 2026-06-01
- **Repo:** [pingdotgg/t3code](https://github.com/pingdotgg/t3code) — **TypeScript monorepo**, ~12k★ (Theo / ping.gg)
- **Role:** Import source + **architecture/tooling reference** — its **Vite+ ("vp") + pnpm + mise + oxlint + oxfmt + AGENTS.md** monorepo closely mirrors telemachus's _recommended (not committed)_ TS direction and shares tooling telemachus also uses (pnpm, oxlint/oxfmt, AGENTS.md). The structural template is the bigger win. _(Migrated off Bun/Turbo in 2026-06 — see Re-verified.)_

**Re-verified 2026-06-07:** ~12.5k★, active (59 commits; v0.0.25). Two shifts: (1) **toolchain migrated Bun/Turbo → Vite+ ("vp") + pnpm** (#2899; Effect typecheck via patched `tsgo`) — the Role/Architecture summaries above now reflect this (it moves t3code _closer_ to telemachus's pnpm direction); the detailed _Architecture & tooling template_ section below is the pre-migration 2026-06-01 snapshot, pending a deeper re-dive; (2) **T3 Cloud relay** (#2837) — a central Cloudflare-Worker relay (DPoP tokens, Clerk OAuth, WS tickets, APNs push/Live Activity), server-mediated, **not** CRDT/local-first. No ◆ movement; no matrix flips.

## Architecture

Minimal web GUI brokering **multiple agent providers** (Codex, Claude Agent SDK, OpenCode, Cursor). **Effect**-based, server-authoritative **event-sourced** orchestration. pnpm monorepo (Vite+ build). Provider-neutral contracts. Native apps via Electron + Expo RN.

## Feature inventory

- **Agent loop/modes:** Effect state machine (turns/checkpoints/reverts); Full-access vs Supervised (`approvalPolicy`/`sandboxMode`); multi-turn input queue; interrupt/stop via Effect scopes
- **Providers:** Codex / Claude Agent SDK / OpenCode / Cursor; per-provider model defaults; custom OpenAI-compatible models; opaque per-provider `resumeCursor` (never synthesized cross-provider)
- **Tools/approval:** WebSocket-pushed approval prompts; `canUseTool` hook; provider-native allow/deny; canonical `ProviderRuntimeEvent` normalization across drivers
- **Sessions:** ProviderSessionDirectory; **thread checkpoints + revert**; activity-log timeline; provider-aware resume
- **Editor/IDE:** in-browser editor (Lexical + Shiki); **xterm.js terminal** (split/new/close via WS); TanStack Router file-tree; `@pierre/diffs` viewer; git state polling + worktree via SSH
- **Native apps:** Electron desktop (per-instance Node backend, electron-updater); Expo RN iOS/Android (EAS builds, beta); **SSH remote launch** (spawns remote t3 server; detects nvm/asdf/mise/fnm/nodenv)
- **Sync/remote:** **Tailscale** (tailnet IP, MagicDNS, HTTPS Serve), pairing flow (owner token), hosted web app, LAN/HTTP discovery
- **UX:** custom keybindings (`~/.t3/keybindings.json`), command palette
- **MCP / Voice:** none yet (roadmap)
- **Misc:** OTLP traces/metrics + Pino logging; hermetic provider-neutral determinism; event-sourced server-authoritative state

## Architecture & tooling template (the priority for telemachus)

_Captured 2026-06-01, pre-migration: t3code has since moved Bun/Turbo → Vite+ ("vp") + pnpm (#2899), so the `turbo.json` / Bun-catalog / mise-pins-bun specifics below describe the **old** layout — the post-migration tooling structure needs a deeper re-dive (not done this pass)._

- **Monorepo:** `apps/` (server = provider dispatch + orchestration; web = React 19 + Vite + Tailwind 4 + TanStack Router; desktop = Electron; mobile = Expo; marketing = Astro) + `packages/` (`contracts` = schema-only Effect/Zod, **explicit subpath exports, no barrel**; `shared` = runtime utils; `client-runtime`; effect wrappers for ACP/Codex; `ssh`; `tailscale`)
- **turbo.json:** `build` (`^build`, outputs dist/dist-electron), `dev` (no cache, persistent, depends on contracts#build), `typecheck`/`test` (after `^build`); 60+ centralized `globalEnv`
- **Bun:** workspace **catalog** (single version source across packages), overrides, `patchedDependencies` (patch-package via Bun), exact `packageManager` + engines pin
- **mise:** pins exact node + bun
- **oxlint + oxfmt:** plugins (eslint/oxc/react/unicorn/typescript), **custom in-tree `oxlint-plugin-t3code`** (e.g. `no-inline-schema-compile` perf rule); oxfmt with `sortPackageJson`; ignore generated `routeTree.gen.ts` + mobile native
- **tsconfig.base:** NodeNext, all strict + `noUncheckedIndexAccess`/`exactOptionalPropertyTypes`, `allowImportingTsExtensions`, **@effect/language-service plugin** (errors on barrel imports + global Date/Console/Random/Fetch in Effect); no `paths`
- **Conventions:** `AGENTS.md` canonical + `CLAUDE.md` **symlink**; `.plans/` (numbered design docs), `TODO.md`, `KEYBINDINGS.md`, `REMOTE.md`; all scripts are TS run via Bun; vitest (+ Playwright browser tests)

## Worth referencing (adapt the conventions in our own repo; don't depend on t3code)

Patterns to study and re-create ourselves: explicit subpath exports over barrels; Effect language-service guardrails; Bun catalog dedup; in-tree custom oxlint plugin; centralized turbo globalEnv; mise toolchain pin; SSH-remote-launch with multi-version-manager detection; schema-only `contracts` package consumed by all apps.
