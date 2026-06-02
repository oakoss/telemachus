# App framework & deployment: TanStack Start + Nitro

- **Status:** Accepted
- **Date:** 2026-06-02
- **Authors:** @jbabin91

## Context

Telemachus needs a full-stack React **app framework** (SSR, server functions, routing) and a **deployment story** that lands on the self-host target without paid-platform lock-in.

Constraints that apply:

- **All-TypeScript**; pairs with the decided data layer ([ADR-001](001-data-layer-tanstack-db-electric-pglite.md): TanStack DB + ElectricSQL + PGlite) and the TanStack ecosystem (Router, Query, DB).
- **Free / open-source + self-hostable** — no paid hosting tier ([`Constraints` in scope-positioning](../ideas/scope-positioning.md)); deploy on the author's **Proxmox** server (a **Coolify** VM or LXC).

This decision is **scoped to the app framework and its deployment layer only**. The ORM, auth, and UI component layers are decided separately ([ADR-003](003-orm-drizzle.md), [ADR-004](004-auth-better-auth.md), [ADR-005](005-ui-react-aria-intent.md)). The exact server runtime version and CI pipeline are not decided here.

Evidence (verified 2026-06-02): TanStack Start's hosting docs recommend the **Nitro** package (v3, via its built-in `nitro/vite` plugin) as the deployment layer; Nitro is host-agnostic and emits per-target presets, including a **node preset** that produces `.output/server/index.mjs` — a standalone Node server. ([TanStack Start hosting](https://tanstack.com/start/latest/docs/framework/react/guide/hosting))

## Decision

Adopt **TanStack Start** as the application framework, with **Nitro** (v3, via the `nitro/vite` plugin) as the server/deployment layer.

Build for self-hosting with Nitro's **node preset** and run it on the author's Proxmox/Coolify infrastructure (Docker image or Node process). Nitro's other presets (Cloudflare Workers, Bun, Vercel, Netlify) remain available but unused unless a future need arises.

## Consequences

**Easier / gained:**

- SSR + server functions, file-based routing (TanStack Router), and end-to-end TypeScript in one framework.
- Native fit with the rest of the stack — TanStack DB collections and TanStack Query slot in idiomatically.
- **Universal deploy via Nitro**: the node preset is a plain Node server, trivial to run under Coolify/Docker on Proxmox — no platform bills, no lock-in. Switching deploy targets later is a preset change, not a rewrite.

**Harder / accepted tradeoffs:**

- **Pre-1.0 framework.** TanStack Start is young; expect API shifts. Pin versions, track releases.
- **Nitro v3 + `nitro/vite` is under active development** (per the hosting docs) — the deploy plugin may change; pin and watch changelogs.
- **SSR ↔ local-first hydration needs care.** PGlite lives in the browser; server-rendered output must reconcile with the client-side reactive store (ties to ADR-001's write-path).

**Follow-up:**

- Server runtime (Node LTS version, container base) and the build/deploy pipeline get decided when R1 build starts.

## Alternatives considered

- **Next.js** — the most mature full-stack React option and self-hostable (`next start` / Docker). **Not chosen:** heavier and Vercel-gravitational; the App Router model and TanStack Router/DB don't pair as idiomatically as Start does; ecosystem cohesion with the decided data layer was the tie-breaker.
- **React Router 7 / Remix** — capable full-stack framework with good self-host support. **Not chosen:** TanStack Start was preferred for first-class alignment with TanStack Router/Query/DB, which we're already committed to.
- **Plain Vite SPA + separate API** — maximum simplicity, but loses integrated SSR + server functions and splits the app into two deploys. **Not chosen:** the integrated model is worth more than the simplicity here.
- **SolidStart / other** — not React; out of scope given the React + TanStack direction.
