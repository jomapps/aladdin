/**
 * Database Module Index
 * Central export point for the three-tier database system
 */

// Gather Database (Tier 1: Unqualified content collection)
export {
  gatherDB,
  getGatherDatabase,
  getGatherCollection,
  lockGatherDatabase,
  unlockGatherDatabase,
  isGatherDatabaseLocked,
  getGatherLockStatus,
  type GatherItem,
  type AutomationMetadata,
  type GatherQueryOptions,
  type GatherQueryResult,
} from './gatherDatabase'

// Qualified Database (Tier 2: Validated and approved content)
export {
  qualifiedDB,
  getQualifiedDatabase,
  getQualifiedCollection,
  createQualifiedItem,
  getQualifiedItems,
  listQualifiedCollections,
  type QualifiedItem,
  type QualifiedQueryOptions,
  type QualifiedQueryResult,
} from './qualifiedDatabase'

// Open Database (Tier 3: Flexible schema for dynamic content)
export {
  openDB,
  getOpenDatabase,
  getOpenCollection,
  createOpenCollection,
  listOpenCollections,
  deleteOpenCollection,
  deleteOpenDatabase,
} from './openDatabase'

// Migration Utilities (Gather → Qualified)
export {
  migrateGatherToQualified,
  isGatherDatabaseLocked as checkGatherLock,
  lockGatherDatabase as lockGather,
  unlockGatherDatabase as unlockGather,
  getMigrationStatus,
  type MigrationOptions,
  type MigrationResult,
  type GatherLockStatus,
} from './migration'

// Database Naming Utilities
export {
  validateProjectSlug,
  validateProjectId,
  getGatherDatabaseName,
  getQualifiedDatabaseName,
  getOpenDatabaseName,
  extractProjectSlugFromDbName,
  extractProjectIdFromGatherDb,
  validateCollectionName,
  generateCollectionName,
  isGatherDatabase,
  isQualifiedDatabase,
  isOpenDatabase,
  getDatabaseTier,
  validateDatabaseName,
} from './databaseNaming'
