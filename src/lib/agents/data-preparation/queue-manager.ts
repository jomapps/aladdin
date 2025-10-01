/**
 * Queue Manager - BullMQ-based queue for async processing
 */

import { Queue, Worker, Job } from 'bullmq'
import type { QueueJob } from './types'

export class QueueManager {
  private queue: Queue
  private worker: Worker | null = null
  private queueConfig: {
    concurrency: number
    maxRetries: number
  }
  private jobs: Map<string, QueueJob> = new Map()
  private isConnected: boolean = false

  constructor(
    redisConfig: { url: string },
    queueConfig: { concurrency: number; maxRetries: number },
  ) {
    this.queueConfig = queueConfig

    // Parse Redis URL
    const redisUrl = new URL(redisConfig.url)
    const connection = {
      host: redisUrl.hostname,
      port: parseInt(redisUrl.port || '6379'),
      password: redisUrl.password || undefined,
    }

    // Initialize BullMQ Queue
    this.queue = new Queue('data-preparation', {
      connection,
      defaultJobOptions: {
        attempts: queueConfig.maxRetries,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        removeOnComplete: 100, // Keep last 100 completed jobs
        removeOnFail: 500, // Keep last 500 failed jobs
      },
    })

    // Handle queue events
    this.queue.on('error', (err) => {
      console.error('[QueueManager] Queue error:', err)
      this.isConnected = false
    })

    console.log('[QueueManager] Queue initialized')
    this.isConnected = true
  }

  /**
   * Add job to queue
   */
  async add(type: 'prepare-data' | 'prepare-batch', data: any): Promise<string> {
    try {
      const job = await this.queue.add(
        type,
        {
          data: data.data,
          options: data.options,
        },
        {
          jobId: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        },
      )

      console.log('[QueueManager] Job added:', job.id)
      return job.id!
    } catch (error) {
      console.error('[QueueManager] Error adding job:', error)
      throw error
    }
  }

  /**
   * Get job status
   */
  async getJob(jobId: string): Promise<QueueJob | null> {
    try {
      const job = await this.queue.getJob(jobId)
      if (!job) return null

      const state = await job.getState()
      const progress = job.progress as number | undefined

      return {
        id: job.id!,
        type: job.name as 'prepare-data' | 'prepare-batch',
        data: job.data.data,
        options: job.data.options,
        status: this.mapBullMQState(state),
        attempts: job.attemptsMade,
        progress,
        result: job.returnvalue,
        error: job.failedReason,
        createdAt: new Date(job.timestamp),
        updatedAt: new Date(job.processedOn || job.timestamp),
      }
    } catch (error) {
      console.error('[QueueManager] Error getting job:', error)
      return null
    }
  }

  /**
   * Start worker to process jobs
   */
  startWorker(processor: (job: Job) => Promise<any>): void {
    if (this.worker) {
      console.log('[QueueManager] Worker already running')
      return
    }

    // Parse Redis URL
    const redisUrl = new URL(process.env.REDIS_URL || 'redis://localhost:6379')
    const connection = {
      host: redisUrl.hostname,
      port: parseInt(redisUrl.port || '6379'),
      password: redisUrl.password || undefined,
    }

    this.worker = new Worker('data-preparation', processor, {
      connection,
      concurrency: this.queueConfig.concurrency,
    })

    // Handle worker events
    this.worker.on('completed', (job) => {
      console.log('[QueueManager] Job completed:', job.id)
    })

    this.worker.on('failed', (job, err) => {
      console.error('[QueueManager] Job failed:', job?.id, err)
    })

    this.worker.on('error', (err) => {
      console.error('[QueueManager] Worker error:', err)
    })

    console.log('[QueueManager] Worker started with concurrency:', this.queueConfig.concurrency)
  }

  /**
   * Stop worker
   */
  async stopWorker(): Promise<void> {
    if (this.worker) {
      await this.worker.close()
      this.worker = null
      console.log('[QueueManager] Worker stopped')
    }
  }

  /**
   * Close queue connection
   */
  async close(): Promise<void> {
    await this.stopWorker()
    await this.queue.close()
    console.log('[QueueManager] Queue closed')
  }

  /**
   * Map BullMQ state to our status
   */
  private mapBullMQState(state: string): QueueJob['status'] {
    switch (state) {
      case 'completed':
        return 'completed'
      case 'failed':
        return 'failed'
      case 'active':
        return 'processing'
      case 'waiting':
      case 'delayed':
      case 'paused':
      default:
        return 'pending'
    }
  }
}
