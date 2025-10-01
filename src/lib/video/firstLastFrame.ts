/**
 * Phase 6: First-Last Frame Video Generation
 * Interpolates between keyframes for smooth transitions
 */

import { getFalClient } from '../fal/client'
import type {
  FalFirstLastFrameRequest,
  FalGenerateVideoResponse,
  FalRequestOptions,
} from '../fal/types'

/**
 * Generate video from first and last keyframes
 */
export async function generateFirstLastFrameVideo(
  request: FalFirstLastFrameRequest,
  options: FalRequestOptions = {}
): Promise<FalGenerateVideoResponse> {
  const client = getFalClient()

  // Calculate optimal interpolation steps based on duration and fps
  const optimalSteps = calculateInterpolationSteps(
    request.duration || 5,
    request.fps || 24
  )

  const enhancedRequest = {
    ...request,
    interpolationSteps: request.interpolationSteps || optimalSteps,
    prompt: enhanceTransitionPrompt(request.prompt),
  }

  return client.generateFirstLastFrameVideo(enhancedRequest, options)
}

/**
 * Calculate optimal interpolation steps
 */
function calculateInterpolationSteps(duration: number, fps: number): number {
  // Total frames needed
  const totalFrames = duration * fps

  // Interpolation steps should be power of 2 for best quality
  // Common values: 8, 16, 32, 64
  const steps = [8, 16, 32, 64]

  // Find closest power of 2 to total frames / 2
  const target = totalFrames / 2
  const optimal = steps.reduce((prev, curr) =>
    Math.abs(curr - target) < Math.abs(prev - target) ? curr : prev
  )

  return optimal
}

/**
 * Enhance prompt for smooth transitions
 */
function enhanceTransitionPrompt(prompt: string): string {
  let enhanced = prompt

  // Add smoothness descriptors
  if (!prompt.toLowerCase().includes('smooth')) {
    enhanced += ', smooth transition'
  }

  // Add temporal consistency
  if (!prompt.toLowerCase().includes('consistent')) {
    enhanced += ', temporally consistent'
  }

  // Add quality descriptors
  if (!prompt.toLowerCase().includes('quality')) {
    enhanced += ', high quality interpolation'
  }

  return enhanced
}

/**
 * Validate keyframes for video generation
 */
export async function validateKeyframes(
  firstFrameUrl: string,
  lastFrameUrl: string
): Promise<{
  valid: boolean
  error?: string
  warnings?: string[]
}> {
  const warnings: string[] = []

  try {
    // Validate both frames exist and are accessible
    const [firstResponse, lastResponse] = await Promise.all([
      fetch(firstFrameUrl, { method: 'HEAD' }),
      fetch(lastFrameUrl, { method: 'HEAD' }),
    ])

    if (!firstResponse.ok) {
      return {
        valid: false,
        error: `First frame not accessible: ${firstResponse.statusText}`,
      }
    }

    if (!lastResponse.ok) {
      return {
        valid: false,
        error: `Last frame not accessible: ${lastResponse.statusText}`,
      }
    }

    // Check content types
    const firstType = firstResponse.headers.get('content-type')
    const lastType = lastResponse.headers.get('content-type')

    if (!firstType || !firstType.startsWith('image/')) {
      return {
        valid: false,
        error: `First frame invalid content type: ${firstType}`,
      }
    }

    if (!lastType || !lastType.startsWith('image/')) {
      return {
        valid: false,
        error: `Last frame invalid content type: ${lastType}`,
      }
    }

    // Warn if formats are different
    if (firstType !== lastType) {
      warnings.push(
        `Keyframes have different formats: ${firstType} vs ${lastType}. This may affect quality.`
      )
    }

    return {
      valid: true,
      warnings: warnings.length > 0 ? warnings : undefined,
    }
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Failed to validate keyframes',
    }
  }
}

/**
 * Estimate video duration from keyframes
 */
export function estimateVideoDuration(
  interpolationSteps: number,
  fps: number
): number {
  // Each interpolation step generates frames
  // Total frames = interpolation steps * 2 (approximate)
  const estimatedFrames = interpolationSteps * 2
  return estimatedFrames / fps
}
