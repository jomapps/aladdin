/**
 * Phase 6: Unified Video Generation Interface
 * Routes video generation requests to appropriate methods
 */

import { getFalClient } from '../fal/client'
import type {
  FalVideoGenerationType,
  FalTextToVideoRequest,
  FalImageToVideoRequest,
  FalFirstLastFrameRequest,
  FalCompositeToVideoRequest,
  VideoGenerationResult,
} from '../fal/types'
import { generateTextToVideo } from './textToVideo'
import { generateImageToVideo } from './imageToVideo'
import { generateFirstLastFrameVideo } from './firstLastFrame'
import { generateCompositeToVideo } from './compositeToVideo'
import { verifyVideoQuality } from './qualityCheck'
import { uploadVideoToR2 } from '../storage/r2Upload'

export interface GenerateVideoOptions {
  type: FalVideoGenerationType
  request:
    | FalTextToVideoRequest
    | FalImageToVideoRequest
    | FalFirstLastFrameRequest
    | FalCompositeToVideoRequest
  projectId: string
  sceneId?: string
  skipQualityCheck?: boolean
  webhookUrl?: string
}

/**
 * Unified video generation interface that routes to appropriate method
 */
export async function generateVideo(
  options: GenerateVideoOptions
): Promise<VideoGenerationResult> {
  const startTime = Date.now()

  try {
    let videoUrl: string
    let videoResponse: any

    // Route to appropriate generation method
    switch (options.type) {
      case 'text-to-video':
        videoResponse = await generateTextToVideo(
          options.request as FalTextToVideoRequest,
          { webhookUrl: options.webhookUrl }
        )
        break

      case 'image-to-video':
        videoResponse = await generateImageToVideo(
          options.request as FalImageToVideoRequest,
          { webhookUrl: options.webhookUrl }
        )
        break

      case 'first-last-frame':
        videoResponse = await generateFirstLastFrameVideo(
          options.request as FalFirstLastFrameRequest,
          { webhookUrl: options.webhookUrl }
        )
        break

      case 'composite-to-video':
        videoResponse = await generateCompositeToVideo(
          options.request as FalCompositeToVideoRequest,
          { webhookUrl: options.webhookUrl }
        )
        break

      default:
        throw new Error(`Unknown video generation type: ${options.type}`)
    }

    videoUrl = videoResponse.video.url
    const generationTime = Date.now() - startTime

    // Quality check (unless skipped)
    let qualityScore = 1.0
    let qualityCheckTime = 0

    if (!options.skipQualityCheck) {
      const qualityStart = Date.now()
      const qualityResult = await verifyVideoQuality({
        videoUrl,
        expectedDuration: options.request.duration || 5,
        expectedResolution: options.request.resolution || { width: 1024, height: 576 },
        minimumFps: options.request.fps || 24,
      })
      qualityCheckTime = Date.now() - qualityStart

      if (!qualityResult.passed) {
        return {
          success: false,
          error: `Video quality check failed: ${qualityResult.issues.map(i => i.description).join(', ')}`,
          qualityScore: qualityResult.overallScore,
        }
      }

      qualityScore = qualityResult.overallScore
    }

    // Upload to R2
    const uploadStart = Date.now()
    const uploadResult = await uploadVideoToR2({
      videoUrl,
      projectId: options.projectId,
      sceneId: options.sceneId,
      metadata: {
        type: options.type,
        prompt: options.request.prompt,
        model: options.request.model || 'fal-ai/ltx-video',
        seed: videoResponse.seed,
        duration: videoResponse.video.duration,
        fps: videoResponse.video.fps,
        resolution: {
          width: videoResponse.video.width,
          height: videoResponse.video.height,
        },
      },
    })
    const uploadTime = Date.now() - uploadStart

    if (!uploadResult.success) {
      return {
        success: false,
        error: `Failed to upload video to R2: ${uploadResult.error}`,
      }
    }

    return {
      success: true,
      mediaId: uploadResult.mediaId,
      url: uploadResult.url,
      thumbnailUrl: videoResponse.video.thumbnailUrl,
      width: videoResponse.video.width,
      height: videoResponse.video.height,
      duration: videoResponse.video.duration,
      fps: videoResponse.video.fps,
      fileSize: videoResponse.video.fileSize,
      seed: videoResponse.seed,
      qualityScore,
      timings: {
        generation: generationTime,
        upload: uploadTime,
        qualityCheck: qualityCheckTime,
        total: Date.now() - startTime,
      },
      metadata: {
        type: options.type,
        model: videoResponse.model,
        prompt: options.request.prompt,
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during video generation',
    }
  }
}
