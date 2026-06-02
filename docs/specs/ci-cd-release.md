# Spec: CI / CD / release & docs deploy

- **Status:** Draft
- **Date:** 2026-06-02
- **Authors:** @jbabin91
- **Related:** [ADR-002](../decisions/002-app-framework-tanstack-start-nitro.md) (Nitro → Coolify), [ADR-003](../decisions/003-orm-drizzle.md) (Drizzle/Testcontainers), [ADR-007](../decisions/007-repo-shape-and-toolchain.md) (toolchain), [ADR-008](../decisions/008-architecture-and-topology.md) (topology / Coolify / Fumadocs), [`scaffold.md`](scaffold.md) (E0), [`foundations.md`](foundations.md) (supply-chain, first-run, ingress, backup seams). bd: under epic `telemachus-8zj` (E0).

## Overview

How the repo gates changes, cuts releases, and ships — for a **self-hostable OSS** project with two deploy audiences: the author's own instance (Coolify on Proxmox) and strangers self-hosting. The pipeline: **CI gates PRs → Changesets versions/releases → CD publishes a container image (app) + a static docs site**. Free/OSS + self-host only; everything here uses GitHub-native free tiers or self-hostable tools.

## Scope

**In:**

- **CI** on GitHub Actions: a job split + a single aggregate gate used for branch protection.
- **Release tooling:** Changesets (version + changelog + tag/GitHub Release).
- **CD (app):** build + publish a container image to GHCR; deploy via Coolify's pull model.
- **Docs deploy:** Fumadocs-on-TanStack-Start as a static site on GitHub Pages.
- **Repo hygiene:** Renovate (dependency + GitHub Actions updates); optional CodeQL + secret scanning.

**Out:**

- npm package publishing — deferred until any `@oakoss/*` package is actually public (all `packages/*` are internal now). Changesets will version private packages without publishing.
- Native (Tauri) build/sign/release pipelines — a later rung.
- A bespoke SSH/`compose up` deploy from CI — rejected (couples CI to private infra, helps no self-hoster; the pull model replaces it).
- **Host provisioning / model-runner install** (Ollama, GPU drivers, model pulls) — a separate, larger thread. **Decided: external runner first; managed serving (the "Cookbook") is a later rung** ([ADR-006](../decisions/006-model-llm-layer.md), [roadmap](roadmap.md)). This spec assumes the app reaches an already-running OpenAI-compatible endpoint; how that endpoint lands on the host is out of scope here.

## Architecture

### CI (GitHub Actions)

Jobs (run in parallel — public repo, free minutes):

| Job             | Does                                               | Notes                                                                                   |
| --------------- | -------------------------------------------------- | --------------------------------------------------------------------------------------- |
| **static**      | `oxfmt --check`, `oxlint`, `tsc` (via `turbo run`) | fast; format is check-mode                                                              |
| **unit**        | Vitest unit                                        | no DB                                                                                   |
| **integration** | Vitest + **Testcontainers** (real Postgres)        | `ubuntu-latest` (Docker preinstalled); Linux only                                       |
| **e2e**         | Playwright (+ axe a11y)                            | E0 = smoke (placeholder + `/health`); DB-backed at R1+                                  |
| **summary**     | aggregate gate                                     | `if: always()`, `needs: [static,unit,integration,e2e]`, **fails if any need ≠ success** |

- **Branch protection requires only `summary`** — adding/removing jobs never breaks required-check config (the GitHub footgun).
- **Turbo-driven + cached** — `turbo run` skips unchanged packages; cache via `actions/cache` (or a self-hosted remote cache, e.g. `ducktors/turborepo-remote-cache` on Proxmox). Optional `--filter=...[origin/main]` for affected-only PRs.
- **`jdx/mise-action`** so CI and local share one pinned Node/pnpm version (mise is the source of truth).
- **`concurrency`** — a per-ref `group` + `cancel-in-progress: true` to kill superseded runs.
- Upload Playwright report/traces as artifacts on failure.

### Release (Changesets)

Changeset per PR → Changesets "Version Packages" PR → on merge: version bump + changelog + **git tag + GitHub Release**. The release fans out to CD (app image) and docs. Private packages are versioned, **not** published; npm publish wires in only when a package goes public.

### CD — app

- The release tag triggers a **build-and-publish** workflow → **GHCR** (`ghcr.io/oakoss/telemachus`), tagged with the SHA, `latest`, and the semver. The image is the production `Dockerfile` (Nitro node build; bd `8zj.6.2`). Gated on the CI `summary`.
- **Author's instance: Coolify pull model** — Coolify watches GHCR and pulls the new image, so a home-network Coolify needs **no inbound exposure**. (A push-to-deploy webhook is the alternative, requiring the Tailscale/Cloudflare Tunnel ingress seam in [`foundations.md`](foundations.md).)
- **Self-hoster deliverables:** a production `docker-compose.yml` (app-from-GHCR + Postgres + a TLS reverse proxy; Ollama external/optional) + a deploy doc covering env, **first-run bootstrap**, volumes, and **DB backup/restore** (foundations seams).

### Docs — GitHub Pages

- `apps/docs` (Fumadocs on TanStack Start, [ADR-008](../decisions/008-architecture-and-topology.md)) built **static** (`spa: { enabled: true }` + `prerender: { enabled: true, crawlLinks: true }`) and deployed with `actions/deploy-pages`. Search is a client-side static index, so no server needed.
- **Caveats (confirm when `apps/docs` lands):** the TanStack Start static/SPA path rides an **experimental Vite plugin** (pin it); the docs app must stay **server-function-free**; **base path** under a project subpath is fiddly — use a **custom domain at root** to sidestep it (+ a `404.html` SPA fallback). **Fallback:** if static proves flaky, run docs as a small Nitro node container on Coolify like the app.

### Hygiene

- **Renovate** (`.github/renovate.json`) — dependency updates **and** GitHub Actions version bumps; monorepo + pnpm-catalog aware; batched PRs that run through CI. Worth it: the stack is **pre-1.0-heavy** (TanStack Start/DB/AI, Electric, Better Auth, the experimental Fumadocs static plugin) — frequent breaking releases.
- **Optional (free on public repos):** GitHub CodeQL + secret scanning — pairs with the supply-chain seam in [`foundations.md`](foundations.md).

## Behavior

- **PR opened/updated** → CI jobs run in parallel; `summary` reports one status; merge blocked unless `summary` is green.
- **Renovate** opens batched dependency/action PRs → same CI gate.
- **Merge to main** → docs deploy (latest); a Changesets "Version Packages" PR accrues.
- **Merge the Version PR** → tag + GitHub Release → app image to GHCR → Coolify pulls; docs (optionally) snapshot a version.

## Testing

- CI itself is validated by a green run on the E0 skeleton (all jobs + `summary`).
- The publish + deploy workflows are exercised once there's an image/docs site to ship (~R1 / when `apps/docs` lands) — verify GHCR push, Coolify pull, and a static docs build before relying on them.

## Decisions vs open

**Decided (2026-06-02):** GitHub Actions; the 5-job split + single `summary` gate; Testcontainers integration job on Linux; Changesets for releases (incl. images); **GHCR multi-arch images (amd64 for the Proxmox deploy + arm64 to run the prod container on the M2 for local testing / arm self-hosters)** + Coolify pull model; GitHub Pages for docs (static, with the caveats above); Renovate for deps + Actions.

**Leans (confirm):**

- **Docs domain** — custom domain at root (dodges GH Pages base-path pain) vs project subpath.
- **Docs trigger** — main-push for "latest" now; release-tagged versioned docs later.

**Open / later:**

- **arm64 build cost** — native GitHub arm64 Linux runners (fast) vs QEMU emulation (slow); verify availability, and if QEMU is too slow, build arm64 on release tags only (not every PR).
- npm publishing scope — which `@oakoss/*` packages ever go public.
- Turbo remote cache — `actions/cache` vs a self-hosted server.
- Coolify's registry-watch/auto-redeploy specifics — verify when wiring CD.

## Sequencing

- **E0:** CI (the 5 jobs + gate), Renovate, Changesets setup — these work on the skeleton.
- **~R1 / when artifacts exist:** GHCR publish (needs the `Dockerfile`), Coolify deploy wiring, the self-hoster compose + deploy doc.
- **When `apps/docs` lands:** the GitHub Pages workflow (+ confirm the static caveats).
