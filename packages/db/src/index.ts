// Curated: getPersistence and DEFAULT_SCHEMA_VERSION stay intra-package so
// consumers can't bypass the collection factories or couple to the migration
// baseline. createPersistence is exposed as the seam for an isolated or
// retention-tuned store (it still feeds createPersistedCollection), and
// probeReplayWindowPruned as the diagnostic seam over that store's replay
// window — both keep their library coupling inside this package.
export {
  type ElectricPersistedCollectionConfig,
  createElectricPersistedCollection,
} from './electric';
export {
  type PersistedCollectionConfig,
  createPersistedCollection,
  createPersistence,
  probeReplayWindowPruned,
} from './persistence';
