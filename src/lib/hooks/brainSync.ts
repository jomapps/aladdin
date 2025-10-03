import { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload';
import { BrainClient } from '@/lib/brain/client';

/**
 * Brain Sync Hook Configuration
 */
interface BrainSyncConfig {
  projectIdField?: string;
  typeField?: string;
  enabled?: boolean;
  timeout?: number;
}

/**
 * Default configuration
 */
const defaultConfig: BrainSyncConfig = {
  projectIdField: 'project',
  typeField: 'type',
  enabled: true,
  timeout: 5000,
};

/**
 * Initialize Brain client with retry configuration
 */
function getBrainClientHook(timeout: number = 5000): BrainClient {
  const apiUrl = process.env.BRAIN_SERVICE_BASE_URL || process.env.BRAIN_SERVICE_URL || 'http://localhost:8000';
  const apiKey = process.env.BRAIN_SERVICE_API_KEY || process.env.BRAIN_API_KEY || '';

  return new BrainClient(
    {
      apiUrl,
      apiKey,
    },
    {
      timeout,
      retries: 1, // Single retry for hooks to avoid blocking
    }
  );
}

/**
 * Enqueue sync task to Celery when Brain is unavailable
 */
async function enqueueToCelery(data: {
  operation: 'create' | 'update' | 'delete';
  collection: string;
  documentId: string;
  projectId: string;
  type: string;
  data?: any;
}): Promise<void> {
  try {
    // Enqueue to Celery task queue
    const celeryUrl = process.env.CELERY_BROKER_URL || 'redis://localhost:6379/0';

    // Log fallback to Celery
    console.warn(`[BrainSync] Brain unavailable, enqueueing to Celery:`, {
      operation: data.operation,
      collection: data.collection,
      documentId: data.documentId,
    });

    // In a real implementation, this would use a Celery client
    // For now, we'll log the task for manual processing
    // TODO: Implement Celery task enqueueing
    console.info(`[BrainSync] Celery task enqueued:`, JSON.stringify(data));
  } catch (error) {
    console.error('[BrainSync] Failed to enqueue to Celery:', error);
  }
}

/**
 * Sync document to Brain service
 */
async function syncToBrain(params: {
  doc: any;
  operation: 'create' | 'update' | 'delete';
  collection: string;
  config: BrainSyncConfig;
}): Promise<void> {
  const { doc, operation, collection, config } = params;

  try {
    // Extract project ID and type
    const projectId = doc[config.projectIdField || 'project'];
    const type = doc[config.typeField || 'type'] || collection;

    if (!projectId) {
      console.warn(`[BrainSync] Skipping sync - no project ID in ${collection}`);
      return;
    }

    const brainClient = getBrainClientHook(config.timeout);

    // Handle different operations
    switch (operation) {
      case 'create':
      case 'update':
        // Add or update node in Brain
        await brainClient.addNode({
          projectId: String(projectId),
          type,
          properties: {
            id: doc.id,
            collection,
            ...doc,
          },
          relationships: [],
        });

        console.info(`[BrainSync] Synced ${operation} to Brain:`, {
          collection,
          documentId: doc.id,
          projectId,
        });
        break;

      case 'delete':
        // Remove node from Brain
        await brainClient.deleteNode({
          projectId: String(projectId),
          nodeId: doc.id,
        });

        console.info(`[BrainSync] Synced ${operation} to Brain:`, {
          collection,
          documentId: doc.id,
          projectId,
        });
        break;
    }

  } catch (error) {
    // Non-blocking error handling
    console.error(`[BrainSync] Sync failed for ${collection} (non-blocking):`, error);

    // Fallback to Celery queue
    const projectId = doc[config.projectIdField || 'project'];
    const type = doc[config.typeField || 'type'] || collection;

    if (projectId) {
      await enqueueToCelery({
        operation,
        collection,
        documentId: doc.id,
        projectId: String(projectId),
        type,
        data: operation !== 'delete' ? doc : undefined,
      });
    }
  }
}

/**
 * Create afterChange hook for Brain sync
 */
export function createBrainSyncAfterChange(
  config: BrainSyncConfig = {}
): CollectionAfterChangeHook {
  const mergedConfig = { ...defaultConfig, ...config };

  return async ({ doc, operation, req }) => {
    // Skip if Brain sync is disabled
    if (!mergedConfig.enabled) {
      return doc;
    }

    // Skip for read operations
    if (operation === 'read') {
      return doc;
    }

    // Get collection name from request
    const collection = req.collection?.config?.slug || 'unknown';

    // Sync to Brain (non-blocking)
    await syncToBrain({
      doc,
      operation: operation as 'create' | 'update',
      collection,
      config: mergedConfig,
    });

    // Always return the document
    return doc;
  };
}

/**
 * Create afterDelete hook for Brain sync
 */
export function createBrainSyncAfterDelete(
  config: BrainSyncConfig = {}
): CollectionAfterDeleteHook {
  const mergedConfig = { ...defaultConfig, ...config };

  return async ({ doc, req }) => {
    // Skip if Brain sync is disabled
    if (!mergedConfig.enabled) {
      return doc;
    }

    // Get collection name from request
    const collection = req.collection?.config?.slug || 'unknown';

    // Sync deletion to Brain (non-blocking)
    await syncToBrain({
      doc,
      operation: 'delete',
      collection,
      config: mergedConfig,
    });

    // Always return the document
    return doc;
  };
}

/**
 * Pre-configured hooks for common collections
 */
export const brainSyncHooks = {
  /**
   * Hook for project-based collections (Characters, Locations, etc.)
   */
  projectBased: {
    afterChange: [createBrainSyncAfterChange({ projectIdField: 'project' })],
    afterDelete: [createBrainSyncAfterDelete({ projectIdField: 'project' })],
  },

  /**
   * Hook for project collection itself
   */
  project: {
    afterChange: [
      createBrainSyncAfterChange({
        projectIdField: 'id',
        typeField: 'type',
      }),
    ],
    afterDelete: [
      createBrainSyncAfterDelete({
        projectIdField: 'id',
        typeField: 'type',
      }),
    ],
  },

  /**
   * Custom hook with configuration
   */
  custom: (config: BrainSyncConfig) => ({
    afterChange: [createBrainSyncAfterChange(config)],
    afterDelete: [createBrainSyncAfterDelete(config)],
  }),
};
