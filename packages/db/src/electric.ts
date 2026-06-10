import type { Row } from '@electric-sql/client';

import { persistedCollectionOptions } from '@tanstack/browser-db-sqlite-persistence';
import { createCollection } from '@tanstack/db';
import {
  type ElectricCollectionConfig,
  electricCollectionOptions,
} from '@tanstack/electric-db-collection';

import { DEFAULT_SCHEMA_VERSION, getPersistence } from './persistence';

// schema?: never pins the schemaless electricCollectionOptions overload: row
// types are compile-time assertions against the Postgres wire shape, with no
// runtime validation on the read path. Revisit when R1 collections carry
// real schemas (telemachus-1or).
export type ElectricPersistedCollectionConfig<T extends Row<unknown>> =
  ElectricCollectionConfig<T> & { schema?: never; schemaVersion?: number };

// ADR-001's "Electric is additive" bet (telemachus-8zj.8): the Electric sync
// adapter spreads into the same persisted wrapper — and the same OPFS database
// — that sync-absent collections use, with no change to either seam.
export const createElectricPersistedCollection = async <
  T extends Row<unknown>,
>({
  schemaVersion,
  ...electricConfig
}: ElectricPersistedCollectionConfig<T>) =>
  createCollection(
    persistedCollectionOptions({
      ...electricCollectionOptions(electricConfig),
      persistence: await getPersistence(),
      schemaVersion: schemaVersion ?? DEFAULT_SCHEMA_VERSION,
    }),
  );
