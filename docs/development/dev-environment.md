# Dev environment

Bootstrap and day-to-day commands. The app runs **on the host** (`pnpm dev`); Docker is for backing services, test databases, and the deploy image only ([scaffold](../specs/scaffold.md)).

## Prerequisites

- [mise](https://mise.jdx.dev/) — provides the pinned toolchain (`.mise.toml`: Node 24, pnpm 11). `mise install` in the repo root.
- Docker (Desktop on macOS) — backing services + Testcontainers.

## Bootstrap

```bash
mise install
pnpm install
cp .env.example .env   # then edit — DATABASE_URL is required, no default
pnpm services:up       # Postgres 17 (wal_level=logical), loopback-only; waits for healthy
pnpm dev               # vite dev server on :3000
```

`pnpm install` enforces the supply-chain posture: 1-day release cooldown (`minimumReleaseAge`) and deny-by-default install scripts (`allowBuilds` in `pnpm-workspace.yaml`) — a new dep failing to install the day it's published is working as intended.

## Services and ports

| Service  | Default host port | Compose                                                     |
| -------- | ----------------- | ----------------------------------------------------------- |
| Postgres | `5432`            | `pnpm services:up` (also: `services:down`, `services:logs`) |
| Electric | `3010`            | `docker compose --profile electric up -d`                   |

Both bind loopback-only. Electric is behind a profile so the default stack stays Postgres-only; the `/electric-smoke` demo and its e2e specs need the profile up.

**Port collisions:** another project's Postgres on 5432 (it happens — `finance-tracker-app` claims it) means bumping `POSTGRES_PORT` in `.env` and mirroring the port in `DATABASE_URL`. Same pattern for `ELECTRIC_PORT`/`ELECTRIC_URL`. Compose reads `.env` for substitution automatically; nothing else to change.

## Running the app

- `pnpm dev` — host dev server on `:3000`, HMR, **no CSP** (the policy is production-gated; HMR would violate it).
- Prod build: `pnpm build`, then `PORT=3100 node apps/web/.output/server/index.mjs` — the enforcing CSP and real bundles. The prod server does **not** load `.env`; pass `DATABASE_URL` and `ELECTRIC_URL` in the environment (both are required in production — `ELECTRIC_URL`'s loopback default is dev/test-only).

## Gate and tests

```bash
pnpm lint && pnpm typecheck && pnpm test   # pre-commit runs lint+typecheck+format (lefthook)
pnpm build
pnpm knip && pnpm sherif                   # monorepo hygiene
pnpm -F @oakoss/web test:e2e               # Playwright vs the prod build on :3100
```

The e2e webServer defaults `DATABASE_URL`/`ELECTRIC_URL` to the compose dev values — override via the environment when ports are bumped:

```bash
DATABASE_URL='postgres://telemachus:telemachus@localhost:5433/telemachus' \
  REQUIRE_ELECTRIC=1 pnpm -F @oakoss/web test:e2e
```

Electric specs skip cleanly when the stack is down; `REQUIRE_ELECTRIC=1` makes a missing stack fail instead (use it whenever you brought the profile up and expect those specs to run). Conventions: [testing.md](testing.md).
