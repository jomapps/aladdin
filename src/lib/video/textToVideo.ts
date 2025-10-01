/**
 * Phase 6: Text-to-Video Generation
 * Generates video from text prompts with prompt engineering
 */

import { getFalClient } from '../fal/client'
import type {
  FalTextToVideoRequest,
  FalGenerateVideoResponse,
  FalRequestOptions,
  FalVideoModel,
} from '../fal/types'

/**
 * Generate video from text prompt
 */
export async function generateTextToVideo(
  request: FalTextToVideoRequest,
  options: FalRequestOptions = {}
): Promise<FalGenerateVideoResponse> {
  const client = getFalClient()

  // Enhance prompt with video-specific techniques
  const enhancedPrompt = enhanceVideoPrompt(request.prompt)

  // Select optimal model based on requirements
  const model = selectVideoModel(request)

  // Generate video
  return client.generateTextToVideo(
    {
      ...request,
      prompt: enhancedPrompt,
      model,
      duration: Math.min(request.duration || 5, 7), // Enforce 7s max
      fps: request.fps || 24,
      resolution: request.resolution || { width: 1024, height: 576 },
    },
    options
  )
}

/**
 * Enhance prompt for better video generation
 */
function enhanceVideoPrompt(prompt: string): string {
  // Add cinematic quality keywords if not present
  const cinematicKeywords = [
    'cinematic',
    'high quality',
    'professional',
    'smooth motion',
    'detailed',
  ]

  let enhanced = prompt

  // Add motion descriptors
  if (!prompt.toLowerCase().includes('motion') && !prompt.toLowerCase().includes('moving')) {
    enhanced += ', smooth natural motion'
  }

  // Add quality descriptors
  if (!cinematicKeywords.some((kw) => prompt.toLowerCase().includes(kw))) {
    enhanced += ', cinematic quality, highly detailed'
  }

  // Add temporal consistency
  if (
    !prompt.toLowerCase().includes('consistent') &&
    !prompt.toLowerCase().includes('stable')
  ) {
    enhanced += ', temporally consistent'
  }

  return enhanced
}

/**
 * Select optimal video model based on requirements
 */
function selectVideoModel(request: FalTextToVideoRequest): FalVideoModel {
  if (request.model) {
    return request.model
  }

  // Default selection logic
  const duration = request.duration || 5

  // For longer videos, use more capable models
  if (duration > 5) {
    return 'fal-ai/runway-gen3' // Better for longer sequences
  }

  // For high motion, use motion-optimized model
  if (request.motionStrength && request.motionStrength > 0.7) {
    return 'fal-ai/mochi-v1' // Better motion handling
  }

  // Default: fast and good quality
  return 'fal-ai/ltx-video'
}

/**
 * Create negative prompt for video generation
 */
export function createVideoNegativePrompt(customNegatives?: string): string {
  const defaultNegatives = [
    'blurry',
    'distorted',
    'low quality',
    'artifacts',
    'flickering',
    'jittery motion',
    'inconsistent',
    'morphing',
    'warping',
    'glitchy',
  ]

  if (customNegatives) {
    return `${defaultNegatives.join(', ')}, ${customNegatives}`
  }

  return defaultNegatives.join(', ')
}
