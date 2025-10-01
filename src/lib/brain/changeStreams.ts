/**
 * Phase 3: MongoDB Change Stream Watchers
 * Real-time monitoring of database changes for Brain synchronization
 */

import type { ChangeStream, Document } from 'mongodb'
import type { ChangeStreamEvent, BrainSyncTask } from './types'
import { getMongoClient } from '../db/openDatabase'
import { enqueueBrainTask } from '../tasks/client'

export class ChangeStreamManager {
  private streams: Map<string, ChangeStream> = new Map()
  private isRunning = false

  /**
   * Start watching all relevant collections
   */
  async startWatching(projectSlugs: string[]): Promise<void> {
    if (this.isRunning) {
      console.warn('⚠️  Change streams already running')
      return
    }

    console.log('🔄 Starting MongoDB change streams...')

    for (const slug of projectSlugs) {
      await this.watchProjectCollections(slug)
    }

    this.isRunning = true
    console.log(`✅ Watching ${this.streams.size} collections`)
  }

  /**
   * Watch all collections for a project
   */
  private async watchProjectCollections(projectSlug: string): Promise<void> {
    const collections = ['characters', 'scenes', 'locations', 'dialogue']

    for (const collectionName of collections) {
      await this.watchCollection(projectSlug, collectionName)
    }
  }

  /**
   * Watch a specific collection for changes
   */
  async watchCollection(projectSlug: string, collectionName: string): Promise<void> {
    try {
      const client = await getMongoClient()
      const db = client.db(`open_${projectSlug}`)
      const collection = db.collection(collectionName)

      // Create change stream with pipeline
      const pipeline = [
        {
          $match: {
            operationType: { $in: ['insert', 'update', 'replace', 'delete'] },
          },
        },
      ]

      const changeStream = collection.watch(pipeline, {
        fullDocument: 'updateLookup', // Get full document on updates
      })

      // Handle change events
      changeStream.on('change', async (change: any) => {
        await this.handleChange(projectSlug, collectionName, change)
      })

      changeStream.on('error', (error: Error) => {
        console.error(`❌ Change stream error for ${projectSlug}/${collectionName}:`, error)
        // Attempt to restart stream
        setTimeout(() => {
          this.watchCollection(projectSlug, collectionName)
        }, 5000)
      })

      const streamKey = `${projectSlug}:${collectionName}`
      this.streams.set(streamKey, changeStream)

      console.log(`✅ Watching ${projectSlug}/${collectionName}`)
    } catch (error: any) {
      console.error(`❌ Failed to watch ${projectSlug}/${collectionName}:`, error.message)
    }
  }

  /**
   * Handle a change event
   */
  private async handleChange(
    projectSlug: string,
    collectionName: string,
    change: any
  ): Promise<void> {
    const event: ChangeStreamEvent = {
      operationType: change.operationType,
      documentKey: change.documentKey,
      fullDocument: change.fullDocument,
      updateDescription: change.updateDescription,
      ns: change.ns,
    }

    console.log(`📝 Change detected: ${projectSlug}/${collectionName} - ${event.operationType}`)

    try {
      // Determine task type based on operation
      let taskType: 'validate' | 'embed' | 'index' | 'sync' = 'sync'

      if (event.operationType === 'insert') {
        taskType = 'validate' // Validate new content
      } else if (event.operationType === 'update' || event.operationType === 'replace') {
        taskType = 'embed' // Re-embed updated content
      } else if (event.operationType === 'delete') {
        // Handle deletion in Brain
        await this.handleDeletion(projectSlug, collectionName, event.documentKey._id.toString())
        return
      }

      // Enqueue task for Brain processing
      await enqueueBrainTask({
        type: taskType,
        entityType: collectionName,
        entityId: event.documentKey._id.toString(),
        projectId: projectSlug,
        priority: this.calculatePriority(taskType, event),
        payload: event.fullDocument,
      })
    } catch (error: any) {
      console.error('❌ Failed to handle change:', error.message)
    }
  }

  /**
   * Handle content deletion
   */
  private async handleDeletion(
    projectSlug: string,
    collectionName: string,
    entityId: string
  ): Promise<void> {
    await enqueueBrainTask({
      type: 'sync',
      entityType: collectionName,
      entityId,
      projectId: projectSlug,
      priority: 5,
      payload: { action: 'delete' },
    })

    console.log(`🗑️  Queued deletion task for ${projectSlug}/${collectionName}/${entityId}`)
  }

  /**
   * Calculate task priority based on type and event
   */
  private calculatePriority(taskType: string, event: ChangeStreamEvent): number {
    // Priority scale: 1 (highest) to 10 (lowest)

    if (taskType === 'validate') {
      return 2 // High priority for new content
    }

    if (taskType === 'embed') {
      return 5 // Medium priority for updates
    }

    if (taskType === 'sync') {
      return 7 // Lower priority for general sync
    }

    return 5 // Default medium priority
  }

  /**
   * Stop watching a specific collection
   */
  async stopWatchingCollection(projectSlug: string, collectionName: string): Promise<void> {
    const streamKey = `${projectSlug}:${collectionName}`
    const stream = this.streams.get(streamKey)

    if (stream) {
      await stream.close()
      this.streams.delete(streamKey)
      console.log(`⏹️  Stopped watching ${projectSlug}/${collectionName}`)
    }
  }

  /**
   * Stop all change streams
   */
  async stopAll(): Promise<void> {
    console.log('⏹️  Stopping all change streams...')

    const closePromises = Array.from(this.streams.values()).map(stream => stream.close())
    await Promise.all(closePromises)

    this.streams.clear()
    this.isRunning = false

    console.log('✅ All change streams stopped')
  }

  /**
   * Get status of running streams
   */
  getStatus(): {
    isRunning: boolean
    streamCount: number
    streams: string[]
  } {
    return {
      isRunning: this.isRunning,
      streamCount: this.streams.size,
      streams: Array.from(this.streams.keys()),
    }
  }

  /**
   * Add new project to watch list
   */
  async addProject(projectSlug: string): Promise<void> {
    if (this.isRunning) {
      await this.watchProjectCollections(projectSlug)
      console.log(`✅ Added project to watch list: ${projectSlug}`)
    }
  }

  /**
   * Remove project from watch list
   */
  async removeProject(projectSlug: string): Promise<void> {
    const collections = ['characters', 'scenes', 'locations', 'dialogue']

    for (const collectionName of collections) {
      await this.stopWatchingCollection(projectSlug, collectionName)
    }

    console.log(`⏹️  Removed project from watch list: ${projectSlug}`)
  }
}

/**
 * Global change stream manager instance
 */
let changeStreamManager: ChangeStreamManager | null = null

export function getChangeStreamManager(): ChangeStreamManager {
  if (!changeStreamManager) {
    changeStreamManager = new ChangeStreamManager()
  }
  return changeStreamManager
}

/**
 * Initialize change streams for all active projects
 */
export async function initializeChangeStreams(projectSlugs: string[]): Promise<void> {
  const manager = getChangeStreamManager()
  await manager.startWatching(projectSlugs)
}

export { ChangeStreamManager as default }
