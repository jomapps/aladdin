/**
 * Scene Generator - Main Orchestrator
 * Complete scene generation pipeline with PayloadCMS integration
 */

import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { getNeo4jConnection } from '../brain/neo4j'
import { analyzeShotRequirements } from './shotAgent'
import { generateComposite, optimizeStepOrder, validateCompositePrerequisites } from './compositeGenerator'
import { getFalClient } from '../fal/client'
import type {
  Scene,
  SceneStatus,
  SceneUpdatePayload,
  SceneGenerationError,
  VideoResult,
  LastFrameResult
} from './types'

/**
 * Main scene generation function
 * Flow: Shot Agent → Composite → Verify → Video → Extract Last Frame
 */
export async function generateScene(sceneId: string): Promise<Scene> {
  const neo4j = await getNeo4jConnection()
  const payload = await getPayload({ config: await configPromise })
  const falClient = getFalClient()

  try {
    // Step 1: Fetch scene from PayloadCMS/Brain
    console.log(`[Scene ${sceneId}] Fetching scene data...`)
    const scene = await fetchScene(sceneId, payload)

    // Step 2: Shot Agent Analysis
    console.log(`[Scene ${sceneId}] Analyzing shot requirements...`)
    await updateSceneStatus(sceneId, 'analyzing', payload)

    const shotDecision = await analyzeShotRequirements(scene, neo4j)
    console.log(`[Scene ${sceneId}] Shot decision:`, shotDecision.reasoning)

    // Optimize step order
    const optimizedSteps = optimizeStepOrder(shotDecision.compositeSteps)

    // Validate prerequisites
    const validation = validateCompositePrerequisites(scene, optimizedSteps)
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`)
    }

    // Step 3: Generate Composite (with iterative verification)
    console.log(`[Scene ${sceneId}] Starting composite generation...`)
    await updateSceneStatus(sceneId, 'compositing', payload)

    const compositeResult = await generateComposite(
      scene,
      optimizedSteps,
      neo4j
    )

    console.log(
      `[Scene ${sceneId}] Composite complete:`,
      `${compositeResult.iterations.length} iterations`
    )

    // Update scene with composite data
    await updateScene(sceneId, {
      composite_iterations: compositeResult.iterations,
      final_composite_url: compositeResult.finalImageUrl
    }, payload)

    // Step 4: Generate Video
    console.log(`[Scene ${sceneId}] Generating video...`)
    await updateSceneStatus(sceneId, 'generating_video', payload)

    const videoResult = await generateVideo(
      compositeResult.finalImageUrl,
      scene,
      shotDecision.pacing,
      falClient
    )

    console.log(`[Scene ${sceneId}] Video generated:`, videoResult.video_url)

    // Update scene with video URL
    await updateScene(sceneId, {
      video_url: videoResult.video_url
    }, payload)

    // Step 5: Extract Last Frame
    console.log(`[Scene ${sceneId}] Extracting last frame...`)
    await updateSceneStatus(sceneId, 'extracting_frame', payload)

    const lastFrameResult = await extractLastFrame(
      videoResult.video_url,
      videoResult.duration
    )

    console.log(`[Scene ${sceneId}] Last frame extracted:`, lastFrameResult.frame_url)

    // Step 6: Mark as completed
    await updateScene(sceneId, {
      status: 'completed',
      last_frame_url: lastFrameResult.frame_url
    }, payload)

    // Return final scene
    const finalScene = await fetchScene(sceneId, payload)
    console.log(`[Scene ${sceneId}] Generation complete!`)

    return finalScene
  } catch (error) {
    // Global error handling
    console.error(`[Scene ${sceneId}] Generation failed:`, error)

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorPhase = getCurrentPhase(error)

    // Update scene with error
    await updateScene(sceneId, {
      status: 'failed',
      error: errorMessage
    }, payload).catch(err => {
      console.error(`[Scene ${sceneId}] Failed to update error status:`, err)
    })

    // Re-throw with context
    throw new SceneGenerationError(
      errorMessage,
      sceneId,
      errorPhase,
      error
    )
  } finally {
    // Cleanup
    await neo4j.close()
  }
}

/**
 * Fetch scene from PayloadCMS
 */
async function fetchScene(sceneId: string, payload: any): Promise<Scene> {
  try {
    // Try to find scene in scenes collection
    const result = await payload.findByID({
      collection: 'scenes',
      id: sceneId
    })

    return result as Scene
  } catch (error) {
    // Fallback: try to construct from brain data
    throw new Error(`Scene not found: ${sceneId}`)
  }
}

/**
 * Update scene status
 */
async function updateSceneStatus(
  sceneId: string,
  status: SceneStatus,
  payload: any
): Promise<void> {
  try {
    await payload.update({
      collection: 'scenes',
      id: sceneId,
      data: { status }
    })
  } catch (error) {
    console.warn(`Failed to update scene status to ${status}:`, error)
  }
}

/**
 * Update scene with data
 */
async function updateScene(
  sceneId: string,
  data: SceneUpdatePayload,
  payload: any
): Promise<void> {
  try {
    await payload.update({
      collection: 'scenes',
      id: sceneId,
      data
    })
  } catch (error) {
    console.warn(`Failed to update scene data:`, error)
  }
}

/**
 * Generate video from composite
 */
async function generateVideo(
  compositeImageUrl: string,
  scene: Scene,
  pacing: any,
  falClient: any
): Promise<VideoResult> {
  try {
    // Use image-to-video with motion
    const result = await falClient.generateImageToVideo({
      imageUrl: compositeImageUrl,
      prompt: `Cinematic scene: ${scene.description}`,
      duration: pacing.duration,
      fps: 24,
      resolution: { width: 1024, height: 576 },
      motionStrength: pacing.motion_strength,
      format: 'mp4'
    })

    if (!result.video || !result.video.url) {
      throw new Error('No video URL in FAL response')
    }

    return {
      video_url: result.video.url,
      duration: pacing.duration,
      fps: 24,
      resolution: { width: 1024, height: 576 }
    }
  } catch (error) {
    throw new Error(
      `Video generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Extract last frame from video
 */
async function extractLastFrame(
  videoUrl: string,
  duration: number
): Promise<LastFrameResult> {
  try {
    // Use FAL first-last-frame or custom extraction
    // For now, use a simple approach with timestamp
    const timestamp = duration - 0.1 // Last frame at end

    // TODO: Implement actual frame extraction
    // This would use ffmpeg or FAL's frame extraction endpoint

    // Mock for now - in production, extract actual frame
    const frameUrl = videoUrl.replace('.mp4', '_last_frame.png')

    return {
      frame_url: frameUrl,
      timestamp
    }
  } catch (error) {
    throw new Error(
      `Frame extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Determine current phase from error
 */
function getCurrentPhase(error: any): SceneStatus {
  if (error instanceof Error) {
    const message = error.message.toLowerCase()

    if (message.includes('shot') || message.includes('analysis')) {
      return 'analyzing'
    }
    if (message.includes('composite') || message.includes('verification')) {
      return 'compositing'
    }
    if (message.includes('video')) {
      return 'generating_video'
    }
    if (message.includes('frame')) {
      return 'extracting_frame'
    }
  }

  return 'failed'
}

/**
 * Batch scene generation
 */
export async function generateSceneBatch(
  sceneIds: string[],
  options: {
    parallel?: boolean
    maxConcurrent?: number
  } = {}
): Promise<{ success: Scene[]; failed: Array<{ sceneId: string; error: string }> }> {
  const { parallel = false, maxConcurrent = 3 } = options

  const success: Scene[] = []
  const failed: Array<{ sceneId: string; error: string }> = []

  if (parallel) {
    // Process in batches
    for (let i = 0; i < sceneIds.length; i += maxConcurrent) {
      const batch = sceneIds.slice(i, i + maxConcurrent)

      const results = await Promise.allSettled(
        batch.map(id => generateScene(id))
      )

      results.forEach((result, idx) => {
        const sceneId = batch[idx]
        if (result.status === 'fulfilled') {
          success.push(result.value)
        } else {
          failed.push({
            sceneId,
            error: result.reason?.message || 'Unknown error'
          })
        }
      })
    }
  } else {
    // Sequential processing
    for (const sceneId of sceneIds) {
      try {
        const scene = await generateScene(sceneId)
        success.push(scene)
      } catch (error) {
        failed.push({
          sceneId,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }
  }

  return { success, failed }
}

/**
 * Get scene generation progress
 */
export async function getSceneProgress(sceneId: string): Promise<{
  status: SceneStatus
  progress: number
  currentStep?: string
  error?: string
}> {
  const payload = await getPayload({ config: await configPromise })

  try {
    const scene = await payload.findByID({
      collection: 'scenes',
      id: sceneId
    }) as Scene

    // Calculate progress based on status
    const progressMap: Record<SceneStatus, number> = {
      'pending': 0,
      'analyzing': 20,
      'compositing': 40,
      'verifying': 60,
      'generating_video': 80,
      'extracting_frame': 90,
      'completed': 100,
      'failed': 0
    }

    const statusDescriptions: Record<SceneStatus, string> = {
      'pending': 'Waiting to start',
      'analyzing': 'Analyzing shot requirements',
      'compositing': 'Building composite image',
      'verifying': 'Verifying composite quality',
      'generating_video': 'Generating video from composite',
      'extracting_frame': 'Extracting last frame',
      'completed': 'Generation complete',
      'failed': 'Generation failed'
    }

    return {
      status: scene.status || 'pending',
      progress: progressMap[scene.status || 'pending'],
      currentStep: statusDescriptions[scene.status || 'pending'],
      error: scene.error
    }
  } catch (error) {
    throw new Error(`Failed to get scene progress: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}
