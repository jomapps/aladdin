/**
 * Phase 6: Image-to-Video Generation
 * Animates single images with motion parameters
 */

import { getFalClient } from '../fal/client'
import type {
  FalImageToVideoRequest,
  FalGenerateVideoResponse,
  FalRequestOptions,
} from '../fal/types'

/**
 * Generate video from single image with motion
 */
export async function generateImageToVideo(
  request: FalImageToVideoRequest,
  options: FalRequestOptions = {}
): Promise<FalGenerateVideoResponse> {
  const client = getFalClient()

  // Enhance motion parameters
  const enhancedRequest = enhanceMotionParameters(request)

  return client.generateImageToVideo(enhancedRequest, options)
}

/**
 * Enhance motion parameters for better animation
 */
function enhanceMotionParameters(request: FalImageToVideoRequest): FalImageToVideoRequest {
  const enhanced = { ...request }

  // Set default motion strength if not provided
  if (!enhanced.motionStrength) {
    // Adjust based on camera movement
    const movement = enhanced.motionParameters?.cameraMovement
    if (movement === 'static') {
      enhanced.motionStrength = 0.3 // Subtle motion for static shots
    } else if (movement === 'zoom-in' || movement === 'zoom-out') {
      enhanced.motionStrength = 0.6 // Moderate for zoom
    } else {
      enhanced.motionStrength = 0.7 // Higher for pans
    }
  }

  // Enhance prompt with motion context
  if (enhanced.motionParameters?.cameraMovement && enhanced.motionParameters.cameraMovement !== 'static') {
    const movementDescriptions = {
      'pan-left': 'camera slowly panning left',
      'pan-right': 'camera slowly panning right',
      'zoom-in': 'camera smoothly zooming in',
      'zoom-out': 'camera smoothly pulling back',
    }

    const movementDesc = movementDescriptions[enhanced.motionParameters.cameraMovement]
    if (movementDesc && !enhanced.prompt.toLowerCase().includes('camera')) {
      enhanced.prompt += `, ${movementDesc}`
    }
  }

  // Add character action context
  if (enhanced.motionParameters?.characterAction) {
    if (!enhanced.prompt.toLowerCase().includes('action')) {
      enhanced.prompt += `, ${enhanced.motionParameters.characterAction}`
    }
  }

  return enhanced
}

/**
 * Validate image URL before video generation
 */
export async function validateImageForVideo(imageUrl: string): Promise<{
  valid: boolean
  error?: string
  metadata?: {
    width: number
    height: number
    format: string
  }
}> {
  try {
    // Fetch image headers to validate
    const response = await fetch(imageUrl, { method: 'HEAD' })

    if (!response.ok) {
      return {
        valid: false,
        error: `Image not accessible: ${response.statusText}`,
      }
    }

    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.startsWith('image/')) {
      return {
        valid: false,
        error: `Invalid content type: ${contentType}`,
      }
    }

    return {
      valid: true,
      metadata: {
        width: 0, // Would need actual image fetch to get dimensions
        height: 0,
        format: contentType.split('/')[1],
      },
    }
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Failed to validate image',
    }
  }
}
