/**
 * Database Migration Utilities
 * Handles migration from gather → qualified databases
 * Includes locking, validation, and data transformation
 */

import { ObjectId, Collection, Db } from 'mongodb'
import { gatherDB, GatherItem } from './gatherDatabase'
import { qualifiedDB, QualifiedItem } from './qualifiedDatabase'
import { validateProjectSlug, validateProjectId } from './databaseNaming'

export interface MigrationOptions {
  dryRun?: boolean
  batchSize?: number
  validateOnly?: boolean
  minQualityScore?: number
  skipLocking?: boolean // For testing only
}

export interface MigrationResult {
  success: boolean
  itemsMigrated: number
  itemsSkipped: number
  errors: string[]
  warnings: string[]
  databaseLocked: boolean
  summary: string
}

export interface GatherLockStatus {
  isLocked: boolean
  lockedAt?: Date
  lockedBy?: string
  reason?: string
  migratedToSlug?: string
}

/**
 * Lock status collection in gather database
 */
interface LockDocument {
  _id: ObjectId
  databaseName: string
  isLocked: boolean
  lockedAt: Date
  lockedBy: string
  reason: string
  migratedToSlug?: string
}

/**
 * Check if a gather database is locked
 */
export async function isGatherDatabaseLocked(projectId: string): Promise<GatherLockStatus> {
  try {
    const db = await gatherDB.getProjectDatabase(projectId)
    const lockCollection = db.collection<LockDocument>('_system_lock')

    const lockDoc = await lockCollection.findOne({ databaseName: `aladdin-gather-${projectId}` })

    if (!lockDoc) {
      return { isLocked: false }
    }

    return {
      isLocked: lockDoc.isLocked,
      lockedAt: lockDoc.lockedAt,
      lockedBy: lockDoc.lockedBy,
      reason: lockDoc.reason,
      migratedToSlug: lockDoc.migratedToSlug
    }
  } catch (error) {
    console.error('Error checking gather lock status:', error)
    return { isLocked: false }
  }
}

/**
 * Lock a gather database (called after qualification button pressed)
 */
export async function lockGatherDatabase(
  projectId: string,
  lockedBy: string,
  migratedToSlug: string,
  reason: string = 'Migrated to qualified database'
): Promise<boolean> {
  try {
    validateProjectId(projectId)
    validateProjectSlug(migratedToSlug)

    const db = await gatherDB.getProjectDatabase(projectId)
    const lockCollection = db.collection<LockDocument>('_system_lock')

    // Check if already locked
    const existing = await lockCollection.findOne({ databaseName: `aladdin-gather-${projectId}` })

    if (existing && existing.isLocked) {
      console.warn(`Gather database already locked for project: ${projectId}`)
      return false
    }

    // Create or update lock document
    const lockDoc: Omit<LockDocument, '_id'> = {
      databaseName: `aladdin-gather-${projectId}`,
      isLocked: true,
      lockedAt: new Date(),
      lockedBy,
      reason,
      migratedToSlug
    }

    await lockCollection.updateOne(
      { databaseName: `aladdin-gather-${projectId}` },
      { $set: lockDoc },
      { upsert: true }
    )

    console.log(`🔒 Locked gather database for project: ${projectId}`)
    return true
  } catch (error) {
    console.error('Error locking gather database:', error)
    throw new Error(`Failed to lock gather database: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Unlock a gather database (admin operation only)
 */
export async function unlockGatherDatabase(projectId: string, unlockedBy: string): Promise<boolean> {
  try {
    validateProjectId(projectId)

    const db = await gatherDB.getProjectDatabase(projectId)
    const lockCollection = db.collection<LockDocument>('_system_lock')

    const result = await lockCollection.updateOne(
      { databaseName: `aladdin-gather-${projectId}` },
      {
        $set: {
          isLocked: false,
          unlockedAt: new Date(),
          unlockedBy
        }
      }
    )

    if (result.modifiedCount > 0) {
      console.log(`🔓 Unlocked gather database for project: ${projectId}`)
      return true
    }

    return false
  } catch (error) {
    console.error('Error unlocking gather database:', error)
    throw new Error(`Failed to unlock gather database: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Validate a gather item for migration
 */
function validateGatherItemForMigration(item: GatherItem): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // Required fields check
  if (!item.content) errors.push('Missing content')
  if (!item.summary) errors.push('Missing summary')
  if (!item.context) errors.push('Missing context')
  if (!item.createdBy) errors.push('Missing createdBy')

  // Content validation
  try {
    const content = JSON.parse(item.content)
    if (typeof content !== 'object') {
      errors.push('Content is not a valid JSON object')
    }
  } catch (e) {
    errors.push('Content is not valid JSON')
  }

  // Quality score validation (if present)
  if (item.duplicateCheckScore !== undefined && item.duplicateCheckScore < 0.5) {
    errors.push('Quality score too low (< 0.5)')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Transform gather item to qualified item
 */
function transformGatherToQualified(
  item: GatherItem,
  projectSlug: string,
  collectionName: string
): Omit<QualifiedItem, '_id' | 'qualifiedAt' | 'version'> {
  const content = JSON.parse(item.content)

  return {
    projectId: item.projectId,
    projectSlug,
    name: item.summary || 'Untitled',
    collectionName,
    createdAt: item.createdAt,
    createdBy: item.createdBy,
    createdByType: item.isAutomated ? 'agent' : 'user',
    qualityRating: item.duplicateCheckScore || 0.7,
    brainValidated: true, // Assumes validation happened before qualification
    userApproved: true, // Assumes user approved for qualification
    gatherSourceId: item._id?.toString(),
    content,
    metadata: {
      originalSummary: item.summary,
      originalContext: item.context,
      qualificationNotes: 'Migrated from gather database',
      validationHistory: [{
        timestamp: new Date(),
        validator: 'migration-service',
        score: item.duplicateCheckScore || 0.7,
        notes: 'Automated migration validation'
      }],
      approvalHistory: [{
        timestamp: new Date(),
        approver: item.createdBy,
        action: 'approved' as const,
        notes: 'Qualified via migration process'
      }]
    }
  }
}

/**
 * Migrate gather items to qualified database
 */
export async function migrateGatherToQualified(
  projectId: string,
  projectSlug: string,
  collectionName: string,
  lockedBy: string,
  options: MigrationOptions = {}
): Promise<MigrationResult> {
  const {
    dryRun = false,
    batchSize = 100,
    validateOnly = false,
    minQualityScore = 0.5,
    skipLocking = false
  } = options

  const result: MigrationResult = {
    success: false,
    itemsMigrated: 0,
    itemsSkipped: 0,
    errors: [],
    warnings: [],
    databaseLocked: false,
    summary: ''
  }

  try {
    // Validate inputs
    validateProjectId(projectId)
    validateProjectSlug(projectSlug)

    // Check if gather database is already locked
    const lockStatus = await isGatherDatabaseLocked(projectId)
    if (lockStatus.isLocked && !skipLocking) {
      result.errors.push(`Gather database already locked since ${lockStatus.lockedAt}`)
      result.summary = 'Migration failed: Database already locked'
      return result
    }

    // Get all gather items
    const gatherItems = await gatherDB.getGatherItems(projectId, { limit: 10000 })

    if (gatherItems.items.length === 0) {
      result.warnings.push('No items found in gather database')
      result.summary = 'Migration completed: No items to migrate'
      result.success = true
      return result
    }

    console.log(`📦 Found ${gatherItems.total} items to migrate`)

    // Validate all items first
    const validationResults = gatherItems.items.map(item => ({
      item,
      validation: validateGatherItemForMigration(item)
    }))

    const invalidItems = validationResults.filter(r => !r.validation.valid)

    if (invalidItems.length > 0) {
      result.warnings.push(`Found ${invalidItems.length} invalid items that will be skipped`)
      invalidItems.forEach(({ item, validation }) => {
        result.warnings.push(`Item ${item._id}: ${validation.errors.join(', ')}`)
      })
    }

    if (validateOnly) {
      result.summary = `Validation completed: ${validationResults.length - invalidItems.length} valid, ${invalidItems.length} invalid`
      result.success = true
      return result
    }

    // Filter valid items
    const validItems = validationResults
      .filter(r => r.validation.valid)
      .filter(r => !r.item.duplicateCheckScore || r.item.duplicateCheckScore >= minQualityScore)
      .map(r => r.item)

    if (validItems.length === 0) {
      result.errors.push('No valid items meet quality threshold')
      result.summary = 'Migration failed: No valid items'
      return result
    }

    console.log(`✅ ${validItems.length} items passed validation`)

    if (dryRun) {
      result.itemsMigrated = validItems.length
      result.itemsSkipped = gatherItems.total - validItems.length
      result.summary = `Dry run completed: ${validItems.length} items would be migrated`
      result.success = true
      return result
    }

    // Lock gather database before migration
    if (!skipLocking) {
      const locked = await lockGatherDatabase(projectId, lockedBy, projectSlug, 'Migration in progress')
      result.databaseLocked = locked

      if (!locked) {
        result.errors.push('Failed to lock gather database')
        result.summary = 'Migration failed: Could not lock database'
        return result
      }
    }

    // Migrate items in batches
    let migrated = 0
    let skipped = 0

    for (let i = 0; i < validItems.length; i += batchSize) {
      const batch = validItems.slice(i, i + batchSize)

      for (const item of batch) {
        try {
          const qualifiedItem = transformGatherToQualified(item, projectSlug, collectionName)
          await qualifiedDB.createQualifiedItem(projectSlug, collectionName, qualifiedItem)
          migrated++
        } catch (error) {
          skipped++
          result.errors.push(
            `Failed to migrate item ${item._id}: ${error instanceof Error ? error.message : 'Unknown error'}`
          )
        }
      }

      console.log(`📊 Migrated ${migrated}/${validItems.length} items`)
    }

    result.itemsMigrated = migrated
    result.itemsSkipped = skipped + invalidItems.length
    result.success = migrated > 0
    result.summary = `Migration completed: ${migrated} items migrated, ${result.itemsSkipped} skipped`

    console.log(`✅ Migration completed: ${migrated} items migrated to qualified_${projectSlug}`)

    return result
  } catch (error) {
    result.errors.push(`Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    result.summary = 'Migration failed with errors'
    console.error('Migration error:', error)
    return result
  }
}

/**
 * Get migration status and statistics
 */
export async function getMigrationStatus(
  projectId: string,
  projectSlug: string
): Promise<{
  gatherLocked: GatherLockStatus
  gatherCount: number
  qualifiedCount: number
  canMigrate: boolean
  suggestions: string[]
}> {
  try {
    const lockStatus = await isGatherDatabaseLocked(projectId)
    const gatherCount = await gatherDB.getGatherCount(projectId)

    let qualifiedCount = 0
    try {
      // Try to get qualified count (collection might not exist yet)
      const collections = await qualifiedDB.listProjectCollections(projectSlug)
      if (collections.length > 0) {
        // Sum across all collections
        for (const coll of collections) {
          qualifiedCount += await qualifiedDB.getQualifiedCount(projectSlug, coll)
        }
      }
    } catch (e) {
      // Qualified database doesn't exist yet
      qualifiedCount = 0
    }

    const suggestions: string[] = []

    if (gatherCount === 0) {
      suggestions.push('No items in gather database to migrate')
    }

    if (lockStatus.isLocked) {
      suggestions.push('Gather database is locked - migration already completed')
    }

    if (!lockStatus.isLocked && gatherCount > 0) {
      suggestions.push(`Ready to migrate ${gatherCount} items to qualified database`)
    }

    return {
      gatherLocked: lockStatus,
      gatherCount,
      qualifiedCount,
      canMigrate: !lockStatus.isLocked && gatherCount > 0,
      suggestions
    }
  } catch (error) {
    console.error('Error getting migration status:', error)
    throw error
  }
}
