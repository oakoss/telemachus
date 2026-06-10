// Curated: getPersistence and DEFAULT_SCHEMA_VERSION stay intra-package so
// consumers can't bypass the collection factories or couple to the migration
// baseline.
export {
  type ElectricPersistedCollectionConfig,
  createElectricPersistedCollection,
} from './electric';
export {
  type PersistedCollectionConfig,
  createPersistedCollection,
} from './persistence';
