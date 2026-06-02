# Authentication: Better Auth

- **Status:** Accepted
- **Date:** 2026-06-02
- **Authors:** @jbabin91

## Context

Telemachus needs authentication — session/identity for the app today, and a foundation for multi-device use later. Even personal-first wants a login boundary in front of the data.

Constraints that apply:

- **All-TypeScript**, **free / open-source + self-hostable** — no paid auth SaaS ([`Constraints` in scope-positioning](../ideas/scope-positioning.md)).
- Pairs with [ADR-002](002-app-framework-tanstack-start-nitro.md) (TanStack Start server functions), [ADR-003](003-orm-drizzle.md) (Drizzle), and [ADR-001](001-data-layer-tanstack-db-electric-pglite.md)'s server Postgres.

This decision is **scoped to the auth library and where auth state lives**. Which providers to enable (email/password, OAuth, passkeys) is deferred to build time.

Evidence (verified 2026-06-02): Better Auth ships a **Drizzle adapter** (generates/owns the auth tables through Drizzle) and a **`tanstackStartCookies`** plugin for cookie handling in Start. ([Better Auth Drizzle adapter](https://better-auth.com/docs/adapters/drizzle), [Better Auth installation](https://better-auth.com/docs/installation))

## Decision

Adopt **Better Auth**.

- **Drizzle adapter** — auth tables live in the **server Postgres**, managed via the Drizzle schema (ADR-003).
- **TanStack Start integration** — the `tanstackStartCookies` plugin for session cookies; auth checks run in Start server functions.
- **Auth is server-authoritative.** User/session/account records are **not** part of the local-first synced collections (ADR-001) — they stay server-side.

## Consequences

**Easier / gained:**

- TS-first, self-hostable, **no auth SaaS bills** (vs Clerk/Auth0/WorkOS).
- The Drizzle adapter generates the auth schema alongside our own tables; one migration story.
- Plugin model (OAuth providers, 2FA, passkeys, organizations) available when needed; integrates with Start server functions.

**Harder / accepted tradeoffs:**

- **Server-authoritative auth needs the server reachable to log in.** Local-first applies to _conversation/agent data_, not to identity. Offline use happens within an already-authenticated session.
- **Auth ≠ build-our-own.** Authentication is security-critical; we depend on Better Auth rather than rolling our own (the build-our-own rule targets the agent/LLM/TUI domain, not crypto/auth primitives).
- Pin versions and track releases.

**Follow-up:**

- Choose enabled providers (email/password vs OAuth vs passkey) at build time.
- Document the auth-state-vs-local-first boundary in the thread #2 data model.

## Alternatives considered

- **Clerk / Auth0 / WorkOS** — managed, polished, but **paid SaaS** → violates the free/OSS-only constraint.
- **Auth.js (NextAuth)** — OSS and has a Drizzle adapter. **Not chosen:** Better Auth was preferred for its TS-first configuration DX, first-class TanStack Start support, and plugin model.
- **Lucia** — was a popular OSS option, but has wound down to a learning resource rather than a maintained library. **Not chosen:** longevity risk.
- **Roll our own** — rejected: authentication is security-critical and not where build-our-own applies.
