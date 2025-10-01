/**
 * Phase 3: Task Handler Registration
 * Handlers for different Brain task types
 */

import type { TaskPayload } from './client'
import { getContentValidator } from '../brain/validator'
import { getJinaEmbeddings } from '../brain/embeddings'
import { getNeo4jConnection } from '../brain/neo4j'
import { addNode, updateNode, deleteNode } from '../brain/queries'
import { getTaskQueueClient } from './client'

export class TaskHandler {
  /**
   * Process a Brain task
   */
  async processTask(task: TaskPayload): Promise<void> {
    const client = getTaskQueueClient()

    try {
      console.log(`🔄 Processing task: ${task.type} - ${task.entityType}/${task.entityId}`)

      // Update task status to processing
      await client.updateTaskStatus(task.entityId, 'processing')

      // Route to appropriate handler
      switch (task.type) {
        case 'validate':
          await this.handleValidation(task)
          break

        case 'embed':
          await this.handleEmbedding(task)
          break

        case 'index':
          await this.handleIndexing(task)
          break

        case 'sync':
          await this.handleSync(task)
          break

        default:
          throw new Error(`Unknown task type: ${task.type}`)
      }

      // Update task status to completed
      await client.updateTaskStatus(task.entityId, 'completed')

      console.log(`✅ Task completed: ${task.entityId}`)
    } catch (error: any) {
      console.error(`❌ Task failed: ${task.entityId}`, error.message)

      // Update task status to failed
      await client.updateTaskStatus(task.entityId, 'failed', error.message)

      // Rethrow for retry logic
      throw error
    }
  }

  /**
   * Handle validation task
   */
  private async handleValidation(task: TaskPayload): Promise<void> {
    const validator = getContentValidator()

    const result = await validator.validate({
      content: task.payload,
      type: task.entityType,
      projectId: task.projectId,
    })

    console.log(
      `📊 Validation result for ${task.entityId}: ${result.qualityScore.toFixed(2)} (${result.valid ? 'valid' : 'invalid'})`
    )

    // If valid, proceed to embedding and indexing
    if (result.valid) {
      await this.handleEmbedding(task)
      await this.handleIndexing(task)
    }
  }

  /**
   * Handle embedding generation task
   */
  private async handleEmbedding(task: TaskPayload): Promise<void> {
    const jina = getJinaEmbeddings()

    const embedding = await jina.generateContentEmbedding(task.payload, task.entityType)

    console.log(
      `🧬 Generated embedding for ${task.entityId}: ${embedding.dimensions} dimensions`
    )

    // Store embedding in Neo4j
    await this.handleIndexing({
      ...task,
      payload: {
        ...task.payload,
        embedding: embedding.vector,
      },
    })
  }

  /**
   * Handle Neo4j indexing task
   */
  private async handleIndexing(task: TaskPayload): Promise<void> {
    const neo4j = getNeo4jConnection()
    await neo4j.connect()

    // Check if node already exists
    const existingNode = await neo4j.executeRead(
      'MATCH (n:BrainNode {entityId: $entityId, projectId: $projectId}) RETURN n',
      { entityId: task.entityId, projectId: task.projectId }
    )

    if (existingNode.length > 0) {
      // Update existing node
      await updateNode(neo4j, task.entityId, task.payload, task.payload.embedding)
      console.log(`🔄 Updated node in Neo4j: ${task.entityId}`)
    } else {
      // Create new node
      await addNode(neo4j, task.entityType as any, task.payload, task.payload.embedding)
      console.log(`✨ Created new node in Neo4j: ${task.entityId}`)
    }
  }

  /**
   * Handle general sync task
   */
  private async handleSync(task: TaskPayload): Promise<void> {
    if (task.payload?.action === 'delete') {
      // Handle deletion
      const neo4j = getNeo4jConnection()
      await neo4j.connect()

      await deleteNode(neo4j, task.entityId, true)
      console.log(`🗑️  Deleted node from Neo4j: ${task.entityId}`)
    } else {
      // Regular sync - validate, embed, and index
      await this.handleValidation(task)
    }
  }

  /**
   * Batch process multiple tasks
   */
  async processBatch(tasks: TaskPayload[]): Promise<{
    successful: number
    failed: number
    errors: Array<{ taskId: string; error: string }>
  }> {
    let successful = 0
    let failed = 0
    const errors: Array<{ taskId: string; error: string }> = []

    for (const task of tasks) {
      try {
        await this.processTask(task)
        successful++
      } catch (error: any) {
        failed++
        errors.push({
          taskId: task.entityId,
          error: error.message,
        })
      }
    }

    return { successful, failed, errors }
  }
}

/**
 * Global task handler instance
 */
let taskHandler: TaskHandler | null = null

export function getTaskHandler(): TaskHandler {
  if (!taskHandler) {
    taskHandler = new TaskHandler()
  }
  return taskHandler
}

/**
 * Register task handlers (called on server startup)
 */
export async function registerTaskHandlers(): Promise<void> {
  const handler = getTaskHandler()

  console.log('✅ Task handlers registered')

  // Note: In production, this would connect to the actual Celery worker
  // For now, this is a placeholder for the handler registration
}

export { TaskHandler as default }
