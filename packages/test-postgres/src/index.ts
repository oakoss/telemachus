import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import {
  GenericContainer,
  Network,
  type StartedTestContainer,
  Wait,
} from 'testcontainers';

// Real pgvector fidelity is why Testcontainers replaced PGlite (ADR-003
// amendment); pg17 matches the compose pin.
const POSTGRES_IMAGE = 'pgvector/pgvector:pg17';
// Track the compose pin (docker-compose.yml); bump both together.
const ELECTRIC_IMAGE = 'electricsql/electric:1.6.9';
const ELECTRIC_PORT = 3000;

const CREDENTIALS = {
  database: 'telemachus',
  password: 'telemachus',
  user: 'telemachus',
} as const;

// wal_level=logical lets Electric attach its replication slot; harmless on the
// Postgres-only path.
const newPostgres = () =>
  new PostgreSqlContainer(POSTGRES_IMAGE)
    .withCommand(['postgres', '-c', 'wal_level=logical'])
    .withDatabase(CREDENTIALS.database)
    .withPassword(CREDENTIALS.password)
    .withUsername(CREDENTIALS.user);

type Resource = undefined | { stop: () => Promise<unknown> };

// Docker won't remove a network with live endpoints, so tiers run sequentially;
// within each tier, stops are concurrent. All tiers run even on failure so a
// partial error can't silently strand the rest.
const stopTiers = async (...tiers: Resource[][]) => {
  const failures: unknown[] = [];
  for (const tier of tiers) {
    const results = await Promise.allSettled(
      tier.flatMap((resource) => (resource ? [resource.stop()] : [])),
    );
    failures.push(
      ...results.flatMap((result) =>
        result.status === 'rejected' ? [result.reason] : [],
      ),
    );
  }
  if (failures.length > 0) {
    throw new AggregateError(failures, 'stack teardown failed');
  }
};

type Stoppable = { stop: () => Promise<void> };
export type PostgresHandle = Stoppable & { databaseUrl: string };
export type StackHandle = PostgresHandle & { electricUrl: string };

export async function startPostgres(): Promise<PostgresHandle> {
  const container = await newPostgres().start();
  return {
    databaseUrl: container.getConnectionUri(),
    stop: () => stopTiers([container]),
  };
}

// Mirrors the compose stack so the Electric write-path round-trip runs in CI,
// not only against a developer's `docker compose up`.
export async function startStack(): Promise<StackHandle> {
  const network = await new Network().start();
  let postgres: StartedPostgreSqlContainer | undefined;
  let electric: StartedTestContainer | undefined;
  try {
    postgres = await newPostgres()
      .withNetwork(network)
      .withNetworkAliases('postgres')
      .start();
    electric = await new GenericContainer(ELECTRIC_IMAGE)
      .withEnvironment({
        DATABASE_URL: `postgresql://${CREDENTIALS.user}:${CREDENTIALS.password}@postgres:5432/${CREDENTIALS.database}?sslmode=disable`,
        // Dev/test only: no API auth inside the throwaway network.
        ELECTRIC_INSECURE: 'true',
      })
      .withExposedPorts(ELECTRIC_PORT)
      .withNetwork(network)
      .withStartupTimeout(90_000)
      .withWaitStrategy(
        Wait.forHttp('/v1/health', ELECTRIC_PORT).forStatusCode(200),
      )
      .start();
  } catch (error) {
    // A failed Electric boot must not strand the Postgres + network already up.
    try {
      await stopTiers([electric, postgres], [network]);
    } catch (cleanupError) {
      // Log but don't rethrow: the startup error is what the caller acted on.
      process.stderr.write(
        `stack startup failed; cleanup also failed (resources may be stranded): ${String(cleanupError)}\n`,
      );
    }
    throw error;
  }

  return {
    databaseUrl: postgres.getConnectionUri(),
    electricUrl: `http://${electric.getHost()}:${electric.getMappedPort(ELECTRIC_PORT)}`,
    stop: () => stopTiers([electric, postgres], [network]),
  };
}
