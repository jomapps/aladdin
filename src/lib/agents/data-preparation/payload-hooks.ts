/**
 * PayloadCMS Hooks for Data Preparation Agent
 * Automatically processes all data changes through the agent
 */

import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'
import { getBrainServiceInterceptor } from './interceptor'

/**
 * Configuration for PayloadCMS hooks
 */
export interface PayloadHookConfig {
  enabled?: boolean
  projectIdField?: string
  async?: boolean
  bypassCollections?: string[]
}

const defaultConfig: PayloadHookConfig = {
  enabled: true,
  projectIdField: 'project',
  async: false,
  bypassCollections: ['users', 'media', 'payload-preferences', 'payload-migrations'],
}

/**
 * Create afterChange hook for automatic brain sync
 */
export function createDataPrepAfterChange(
  config: PayloadHookConfig = {},
): CollectionAfterChangeHook {
  const mergedConfig = { ...defaultConfig, ...config }

  return async ({ doc, req, operation, collection }) => {
    // Skip if disabled
    if (!mergedConfig.enabled) {
      return doc
    }

    // Skip for read operations
    if (operation === 'read') {
      return doc
    }

    // Get collection slug
    const collectionSlug = collection?.slug || req.collection?.config?.slug || 'unknown'

    // Skip bypassed collections
    if (mergedConfig.bypassCollections?.includes(collectionSlug)) {
      console.log(`[DataPrepHook] Bypassing collection: ${collectionSlug}`)
      return doc
    }

    // Get project ID
    const projectId = doc[mergedConfig.projectIdField!] || doc.id

    // For conversations, projectId can be null (GLOBAL chat)
    if (!projectId && collectionSlug !== 'conversations') {
      console.warn(`[DataPrepHook] No project ID found for ${collectionSlug}:${doc.id}`)
      return doc
    }

    // For conversations, userId is required
    if (collectionSlug === 'conversations' && !req.user?.id) {
      console.warn(`[DataPrepHook] No user ID found for conversation:${doc.id}`)
      return doc
    }

    try {
      // Get brain service - will throw error if not configured
      const brainService = getBrainServiceInterceptor()

      // Prepare options
      const options = {
        projectId: typeof projectId === 'object' ? projectId.id : projectId,
        entityType: collectionSlug,
        sourceCollection: collectionSlug,
        sourceId: doc.id,
        userId: req.user?.id,
        createdByType: 'user' as const,
      }

      // Store through interceptor (async or sync)
      if (mergedConfig.async) {
        // Queue for async processing
        const jobId = await brainService.storeAsync(doc, options)
        console.log(`[DataPrepHook] Queued ${collectionSlug}:${doc.id} (Job: ${jobId})`)
      } else {
        // Sync processing
        await brainService.store(doc, options)
        console.log(`[DataPrepHook] Synced ${collectionSlug}:${doc.id}`)
      }
    } catch (error: any) {
      console.error(`[DataPrepHook] Error syncing ${collectionSlug}:${doc.id}:`, error)

      // If Brain service is not configured, fail the operation
      if (error.message?.includes('Brain API configuration missing')) {
        throw new Error(
          `Brain service is required but not configured. Cannot create ${collectionSlug}. ` +
            `Please set BRAIN_SERVICE_BASE_URL and BRAIN_SERVICE_API_KEY environment variables.`,
        )
      }

      // For other errors, also fail to ensure data consistency
      throw new Error(
        `Failed to sync ${collectionSlug} to Brain service: ${error.message || 'Unknown error'}`,
      )
    }

    return doc
  }
}

/**
 * Create afterDelete hook for brain cleanup
 */
export function createDataPrepAfterDelete(
  config: PayloadHookConfig = {},
): CollectionAfterDeleteHook {
  const mergedConfig = { ...defaultConfig, ...config }

  return async ({ doc, req, collection }) => {
    // Skip if disabled
    if (!mergedConfig.enabled) {
      return doc
    }

    // Get collection slug
    const collectionSlug = collection?.slug || req.collection?.config?.slug || 'unknown'

    // Skip bypassed collections
    if (mergedConfig.bypassCollections?.includes(collectionSlug)) {
      return doc
    }

    try {
      // Delete from brain service
      const brainUrl = process.env.BRAIN_SERVICE_URL || 'http://localhost:8000'
      const response = await fetch(`${brainUrl}/api/entities/${doc.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Brain service delete failed: ${response.statusText}`)
      }

      // Clear cache
      const cacheManager = (await import('./cache-manager')).default
      await cacheManager.clearPattern(`brain:${collectionSlug}:${doc.id}`)

      console.log(`[DataPrepHook] Deleted ${collectionSlug}:${doc.id} from brain`)
    } catch (error) {
      console.error(`[DataPrepHook] Error deleting ${collectionSlug}:${doc.id}:`, error)
      // Don't throw - allow deletion to continue even if brain service fails
    }

    return doc
  }
}

/**
 * Pre-configured hooks for common use cases
 */
export const dataPrepHooks = {
  /**
   * Standard hooks for project-based collections
   */
  projectBased: (config: PayloadHookConfig = {}) => ({
    afterChange: [
      createDataPrepAfterChange({
        ...config,
        projectIdField: 'project',
      }),
    ],
    afterDelete: [createDataPrepAfterDelete(config)],
  }),

  /**
   * Hooks for project collection itself
   */
  project: (config: PayloadHookConfig = {}) => ({
    afterChange: [
      createDataPrepAfterChange({
        ...config,
        projectIdField: 'id',
      }),
    ],
    afterDelete: [createDataPrepAfterDelete(config)],
  }),

  /**
   * Async hooks (queued processing)
   */
  async: (config: PayloadHookConfig = {}) => ({
    afterChange: [
      createDataPrepAfterChange({
        ...config,
        async: true,
      }),
    ],
    afterDelete: [createDataPrepAfterDelete(config)],
  }),

  /**
   * Custom hooks with full configuration
   */
  custom: (config: PayloadHookConfig) => ({
    afterChange: [createDataPrepAfterChange(config)],
    afterDelete: [createDataPrepAfterDelete(config)],
  }),
}
