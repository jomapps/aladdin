/**
 * Video Export Orchestrator
 * Handles video export to multiple formats (MP4, WebM, MOV)
 */

import { ExportJob, ExportOptions, ExportFormat } from './formatHandlers'
import { ExportQueue } from './exportQueue'
import { ExportStorage } from './exportStorage'
import { getPayloadClient } from '@/lib/payload'

export interface VideoExportRequest {
  videoId: string
  format: ExportFormat
  quality?: 'low' | 'medium' | 'high' | 'ultra'
  resolution?: string
  fps?: number
  userId: string
  options?: ExportOptions
}

export class VideoExporter {
  private queue: ExportQueue
  private storage: ExportStorage

  constructor() {
    this.queue = new ExportQueue()
    this.storage = new ExportStorage()
  }

  async exportVideo(request: VideoExportRequest): Promise<ExportJob> {
    const { videoId, format, quality = 'high', resolution, fps, userId, options = {} } = request

    // Fetch video data
    const video = await payload.findByID({ collection: 'videos', id: videoId })
    if (!video) throw new Error(`Video ${videoId} not found`)

    // Create export job
    const job: ExportJob = {
      id: this.generateJobId(),
      videoId,
      userId,
      format,
      quality,
      resolution: resolution || video.resolution || '1920x1080',
      fps: fps || video.fps || 30,
      status: 'pending',
      progress: 0,
      createdAt: new Date(),
      options: {
        includeAudio: options.includeAudio ?? true,
        codec: options.codec,
        bitrate: options.bitrate,
        watermark: options.watermark,
        ...options,
      },
    }

    // Add to queue
    await this.queue.addJob(job)

    // Start processing
    this.processJob(job.id).catch((error) => {
      console.error(`Export job ${job.id} failed:`, error)
    })

    return job
  }

  private async processJob(jobId: string): Promise<void> {
    try {
      const job = await this.queue.getJob(jobId)
      if (!job) throw new Error(`Job ${jobId} not found`)

      // Update status
      await this.queue.updateJobStatus(jobId, 'processing', 0)

      // Fetch video with scenes and layers
      const video = await payload.findByID({
        collection: 'videos',
        id: job.videoId,
        depth: 3,
      })

      // Process scenes sequentially
      const totalScenes = video.scenes?.length || 0
      for (let i = 0; i < totalScenes; i++) {
        const progress = Math.round(((i + 1) / totalScenes) * 100)
        await this.queue.updateJobStatus(jobId, 'processing', progress)
      }

      // Generate output file
      const outputPath = await this.generateVideoFile(job, video)

      // Upload to storage
      const url = await this.storage.uploadExport(outputPath, job)

      // Complete job
      await this.queue.completeJob(jobId, url)

      // Log to activity
      await payload.create({
        collection: 'activity-logs',
        data: {
          user: job.userId,
          action: 'export',
          entityType: 'video',
          entityId: job.videoId,
          metadata: {
            jobId,
            format: job.format,
            quality: job.quality,
            resolution: job.resolution,
            url,
          },
          timestamp: new Date(),
        },
      })
    } catch (error) {
      await this.queue.failJob(jobId, error instanceof Error ? error.message : 'Unknown error')
    }
  }

  private async generateVideoFile(job: ExportJob, video: any): Promise<string> {
    // Placeholder for actual video rendering
    // In production, this would use FFmpeg or similar
    return `/tmp/export-${job.id}.${job.format}`
  }

  async getJob(jobId: string): Promise<ExportJob | null> {
    return this.queue.getJob(jobId)
  }

  async getJobStatus(jobId: string): Promise<{ status: string; progress: number; url?: string }> {
    const job = await this.queue.getJob(jobId)
    if (!job) throw new Error(`Job ${jobId} not found`)

    return {
      status: job.status,
      progress: job.progress,
      url: job.outputUrl,
    }
  }

  async getUserJobs(userId: string, limit = 20): Promise<ExportJob[]> {
    return this.queue.getUserJobs(userId, limit)
  }

  async cancelJob(jobId: string): Promise<void> {
    await this.queue.cancelJob(jobId)
  }

  private generateJobId(): string {
    return `export-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}

export const videoExporter = new VideoExporter()
