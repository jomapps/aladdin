/**
 * Phase 3: Celery-Redis Task Queue Client
 * Enqueue tasks for asynchronous Brain processing
 */

import Redis from 'ioredis'
import type { BrainSyncTask } from '../brain/types'

export interface TaskPayload {
  type: 'validate' | 'embed' | 'index' | 'sync'
  entityType: string
  entityId: string
  projectId: string
  priority: number
  payload?: any
}

export class TaskQueueClient {
  private redis: Redis
  private readonly queueName = 'brain_tasks'

  constructor(redisUrl?: string) {
    const url = redisUrl || process.env.REDIS_URL || 'redis://localhost:6379'
    this.redis = new Redis(url, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      retryStrategy(times: number) {
        const delay = Math.min(times * 50, 2000)
        return delay
      },
    })

    this.redis.on('connect', () => {
      console.log('✅ Redis connected for task queue')
    })

    this.redis.on('error', (error: Error) => {
      console.error('❌ Redis error:', error.message)
    })
  }

  /**
   * Enqueue a Brain processing task
   */
  async enqueueTask(task: TaskPayload): Promise<string> {
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const fullTask: BrainSyncTask = {
      id: taskId,
      type: task.type,
      entityType: task.entityType,
      entityId: task.entityId,
      projectId: task.projectId,
      status: 'pending',
      priority: task.priority,
      createdAt: new Date(),
    }

    // Create Celery-compatible message format
    const celeryTask = {
      task: 'brain.tasks.process_entity',
      id: taskId,
      args: [task],
      kwargs: {},
      retries: 0,
      eta: null,
      expires: null,
      priority: task.priority,
    }

    try {
      // Push to Redis list (Celery queue)
      await this.redis.lpush(this.queueName, JSON.stringify(celeryTask))

      // Store task metadata
      await this.redis.hset(`task:${taskId}`, {
        ...fullTask,
        createdAt: fullTask.createdAt.toISOString(),
      })

      // Set expiry for task metadata (7 days)
      await this.redis.expire(`task:${taskId}`, 7 * 24 * 60 * 60)

      console.log(`📤 Enqueued task: ${taskId} (${task.type} - ${task.entityType})`)

      return taskId
    } catch (error: any) {
      console.error('❌ Failed to enqueue task:', error.message)
      throw new Error(`Failed to enqueue task: ${error.message}`)
    }
  }

  /**
   * Get task status
   */
  async getTaskStatus(taskId: string): Promise<BrainSyncTask | null> {
    try {
      const taskData = await this.redis.hgetall(`task:${taskId}`)

      if (!taskData || Object.keys(taskData).length === 0) {
        return null
      }

      return {
        id: taskData.id,
        type: taskData.type as any,
        entityType: taskData.entityType,
        entityId: taskData.entityId,
        projectId: taskData.projectId,
        status: taskData.status as any,
        priority: parseInt(taskData.priority, 10),
        retryCount: taskData.retryCount ? parseInt(taskData.retryCount, 10) : undefined,
        error: taskData.error,
        createdAt: new Date(taskData.createdAt),
        processedAt: taskData.processedAt ? new Date(taskData.processedAt) : undefined,
      }
    } catch (error: any) {
      console.error('❌ Failed to get task status:', error.message)
      return null
    }
  }

  /**
   * Update task status
   */
  async updateTaskStatus(
    taskId: string,
    status: 'pending' | 'processing' | 'completed' | 'failed',
    error?: string
  ): Promise<void> {
    try {
      const updates: Record<string, any> = {
        status,
      }

      if (status === 'completed' || status === 'failed') {
        updates.processedAt = new Date().toISOString()
      }

      if (error) {
        updates.error = error
      }

      await this.redis.hset(`task:${taskId}`, updates)

      console.log(`✅ Updated task ${taskId} status: ${status}`)
    } catch (error: any) {
      console.error('❌ Failed to update task status:', error.message)
    }
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<{
    pendingTasks: number
    activeTasks: number
    completedToday: number
  }> {
    try {
      const pendingTasks = await this.redis.llen(this.queueName)

      // Count active and completed tasks (simplified)
      const keys = await this.redis.keys('task:*')
      let activeTasks = 0
      let completedToday = 0

      for (const key of keys.slice(0, 100)) {
        // Limit to avoid performance issues
        const status = await this.redis.hget(key, 'status')
        const processedAt = await this.redis.hget(key, 'processedAt')

        if (status === 'processing') {
          activeTasks++
        }

        if (status === 'completed' && processedAt) {
          const processedDate = new Date(processedAt)
          const today = new Date()
          if (processedDate.toDateString() === today.toDateString()) {
            completedToday++
          }
        }
      }

      return {
        pendingTasks,
        activeTasks,
        completedToday,
      }
    } catch (error: any) {
      console.error('❌ Failed to get queue stats:', error.message)
      return {
        pendingTasks: 0,
        activeTasks: 0,
        completedToday: 0,
      }
    }
  }

  /**
   * Clear failed tasks older than specified days
   */
  async clearOldTasks(daysOld = 7): Promise<number> {
    try {
      const keys = await this.redis.keys('task:*')
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysOld)

      let deletedCount = 0

      for (const key of keys) {
        const createdAt = await this.redis.hget(key, 'createdAt')
        const status = await this.redis.hget(key, 'status')

        if (createdAt && status === 'failed') {
          const taskDate = new Date(createdAt)
          if (taskDate < cutoffDate) {
            await this.redis.del(key)
            deletedCount++
          }
        }
      }

      console.log(`🗑️  Cleared ${deletedCount} old failed tasks`)
      return deletedCount
    } catch (error: any) {
      console.error('❌ Failed to clear old tasks:', error.message)
      return 0
    }
  }

  /**
   * Health check for Redis connection
   */
  async healthCheck(): Promise<boolean> {
    try {
      const pong = await this.redis.ping()
      return pong === 'PONG'
    } catch {
      return false
    }
  }

  /**
   * Close Redis connection
   */
  async close(): Promise<void> {
    await this.redis.quit()
    console.log('✅ Redis connection closed')
  }
}

/**
 * Global task queue client instance
 */
let taskQueueClient: TaskQueueClient | null = null

export function getTaskQueueClient(redisUrl?: string): TaskQueueClient {
  if (!taskQueueClient) {
    taskQueueClient = new TaskQueueClient(redisUrl)
  }
  return taskQueueClient
}

/**
 * Helper function to enqueue a Brain task
 */
export async function enqueueBrainTask(task: TaskPayload): Promise<string> {
  const client = getTaskQueueClient()
  return client.enqueueTask(task)
}

export { TaskQueueClient as default }
