/**
 * Phase 6: Composite-to-Video Generation
 * Animates composite shots while maintaining reference consistency
 */

import { getFalClient } from '../fal/client'
import type {
  FalCompositeToVideoRequest,
  FalGenerateVideoResponse,
  FalRequestOptions,
} from '../fal/types'

/**
 * Generate video from composite image with references
 */
export async function generateCompositeToVideo(
  request: FalCompositeToVideoRequest,
  options: FalRequestOptions = {}
): Promise<FalGenerateVideoResponse> {
  const client = getFalClient()

  // Enhance request with camera movement and reference consistency
  const enhancedRequest = enhanceCameraMovement(request)

  return client.generateCompositeToVideo(enhancedRequest, options)
}

/**
 * Enhance camera movement parameters
 */
function enhanceCameraMovement(
  request: FalCompositeToVideoRequest
): FalCompositeToVideoRequest {
  const enhanced = { ...request }

  // Set default camera movement if not provided
  if (!enhanced.cameraMovement) {
    enhanced.cameraMovement = {
      type: 'static',
      speed: 'medium',
      easing: 'ease-in-out',
    }
  }

  // Add camera movement to prompt if specified
  if (enhanced.cameraMovement.type !== 'static') {
    const movementPrompt = generateCameraMovementPrompt(enhanced.cameraMovement)
    if (!enhanced.prompt.toLowerCase().includes('camera')) {
      enhanced.prompt += `, ${movementPrompt}`
    }
  }

  // Adjust motion strength based on camera movement
  if (!enhanced.motionStrength) {
    const movementType = enhanced.cameraMovement.type
    if (movementType === 'static') {
      enhanced.motionStrength = 0.3
    } else if (movementType === 'zoom-in' || movementType === 'zoom-out') {
      enhanced.motionStrength = 0.6
    } else if (movementType === 'dolly' || movementType === 'crane') {
      enhanced.motionStrength = 0.8
    } else {
      enhanced.motionStrength = 0.7
    }
  }

  return enhanced
}

/**
 * Generate camera movement prompt description
 */
function generateCameraMovementPrompt(
  movement: NonNullable<FalCompositeToVideoRequest['cameraMovement']>
): string {
  const { type, speed = 'medium', easing = 'ease-in-out' } = movement

  const speedDescriptors = {
    slow: 'slowly',
    medium: 'smoothly',
    fast: 'dynamically',
  }

  const movementDescriptors = {
    'pan-left': 'panning left',
    'pan-right': 'panning right',
    'zoom-in': 'zooming in',
    'zoom-out': 'zooming out',
    dolly: 'dolly movement',
    crane: 'crane shot',
    static: 'static shot',
  }

  const speedDesc = speedDescriptors[speed]
  const movementDesc = movementDescriptors[type]

  if (type === 'static') {
    return 'static camera, subtle ambient motion'
  }

  return `camera ${speedDesc} ${movementDesc} with ${easing} easing`
}

/**
 * Validate composite image and references
 */
export async function validateCompositeReferences(
  compositeImageUrl: string,
  referenceImages?: Array<{
    url: string
    type: 'character' | 'location' | 'style'
    weight?: number
  }>
): Promise<{
  valid: boolean
  error?: string
  warnings?: string[]
}> {
  const warnings: string[] = []

  try {
    // Validate composite image
    const compositeResponse = await fetch(compositeImageUrl, { method: 'HEAD' })
    if (!compositeResponse.ok) {
      return {
        valid: false,
        error: `Composite image not accessible: ${compositeResponse.statusText}`,
      }
    }

    const contentType = compositeResponse.headers.get('content-type')
    if (!contentType || !contentType.startsWith('image/')) {
      return {
        valid: false,
        error: `Composite image invalid content type: ${contentType}`,
      }
    }

    // Validate reference images if provided
    if (referenceImages && referenceImages.length > 0) {
      const referenceChecks = await Promise.all(
        referenceImages.map(async (ref) => {
          try {
            const response = await fetch(ref.url, { method: 'HEAD' })
            return {
              url: ref.url,
              accessible: response.ok,
              type: ref.type,
            }
          } catch {
            return {
              url: ref.url,
              accessible: false,
              type: ref.type,
            }
          }
        })
      )

      const inaccessibleRefs = referenceChecks.filter((check) => !check.accessible)
      if (inaccessibleRefs.length > 0) {
        warnings.push(
          `Some reference images are inaccessible: ${inaccessibleRefs.map(r => r.type).join(', ')}`
        )
      }

      // Warn if no character references for composite with characters
      const hasCharacterRef = referenceImages.some((ref) => ref.type === 'character')
      if (!hasCharacterRef) {
        warnings.push(
          'No character references provided. Character consistency may be affected.'
        )
      }
    }

    return {
      valid: true,
      warnings: warnings.length > 0 ? warnings : undefined,
    }
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Failed to validate composite references',
    }
  }
}

/**
 * Calculate optimal reference weights for consistency
 */
export function calculateReferenceWeights(references: Array<{
  type: 'character' | 'location' | 'style'
  weight?: number
}>): Array<{ type: string; weight: number }> {
  // Prioritize character consistency
  const weights = {
    character: 0.7,
    location: 0.2,
    style: 0.1,
  }

  return references.map((ref) => ({
    type: ref.type,
    weight: ref.weight || weights[ref.type],
  }))
}
