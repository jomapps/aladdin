/**
 * Phase 5: FAL.ai Type Definitions
 * TypeScript types for FAL.ai image generation API
 */

export type FalModel =
  | 'fal-ai/flux/dev'
  | 'fal-ai/flux/schnell'
  | 'fal-ai/flux-pro'
  | 'fal-ai/stable-diffusion-v3'
  | 'fal-ai/stable-diffusion-xl'

export type FalImageFormat = 'png' | 'jpeg' | 'webp'

export interface FalClientConfig {
  apiKey: string
  baseUrl?: string
  timeout?: number
  retries?: number
  retryDelay?: number
}

export interface FalGenerateImageRequest {
  prompt: string
  model?: FalModel
  negativePrompt?: string
  imageSize?: {
    width: number
    height: number
  }
  numImages?: number
  seed?: number
  guidance?: number
  steps?: number
  format?: FalImageFormat
  enableSafetyChecker?: boolean
}

export interface FalGenerateImageWithReferenceRequest extends FalGenerateImageRequest {
  referenceImages: Array<{
    url: string
    weight?: number
    type?: 'character' | 'clothing' | 'location' | 'pose' | 'style'
  }>
  controlnetStrength?: number
  ipAdapterScale?: number
}

export interface FalImageResult {
  url: string
  width: number
  height: number
  contentType: string
  seed?: number
}

export interface FalGenerateImageResponse {
  images: FalImageResult[]
  seed: number
  prompt: string
  model: string
  timings: {
    inference: number
    total: number
  }
  metadata?: Record<string, any>
}

export interface FalErrorResponse {
  error: {
    message: string
    code: string
    status: number
  }
}

export interface FalRateLimitState {
  remaining: number
  reset: Date
  limit: number
}

export interface FalRequestOptions {
  retryOnRateLimit?: boolean
  priority?: 'low' | 'normal' | 'high'
  webhookUrl?: string
}

/**
 * Master Reference Generation Configuration
 */
export interface MasterReferenceConfig {
  subjectType: 'character' | 'location' | 'object'
  subjectId: string
  description: string
  projectId: string
  styleGuide?: {
    colorPalette?: string[]
    artStyle?: string
    lighting?: string
    mood?: string
  }
  resolution?: {
    width: number
    height: number
  }
  model?: FalModel
  qualityThreshold?: number
}

/**
 * 360° Profile Generation Configuration
 */
export interface Profile360Config {
  masterReferenceId: string
  subjectId: string
  projectId: string
  angles?: number[] // Default: [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330]
  resolution?: {
    width: number
    height: number
  }
  model?: FalModel
  parallelBatches?: number
}

/**
 * Composite Shot Generation Configuration
 */
export interface CompositeShotConfig {
  description: string
  projectId: string
  references: {
    character?: string | string[]
    clothing?: string | string[]
    location?: string
    props?: string[]
  }
  sceneDescription?: string
  lighting?: string
  cameraAngle?: string
  resolution?: {
    width: number
    height: number
  }
  model?: FalModel
}

/**
 * Consistency Verification Configuration
 */
export interface ConsistencyVerificationConfig {
  newImageId: string
  referenceSetId: string
  projectId: string
  thresholds?: {
    facial?: number
    color?: number
    style?: number
    overall?: number
  }
}

/**
 * Image Generation Result
 */
export interface ImageGenerationResult {
  success: boolean
  mediaId?: string
  url?: string
  width?: number
  height?: number
  seed?: number
  timings?: {
    generation: number
    upload: number
    total: number
  }
  metadata?: Record<string, any>
  error?: string
}

/**
 * 360° Profile Result
 */
export interface Profile360Result {
  success: boolean
  images: Array<{
    angle: number
    mediaId: string
    url: string
  }>
  masterReferenceId: string
  subjectId: string
  totalGenerationTime: number
  metadata?: Record<string, any>
  error?: string
}

/**
 * Composite Shot Result
 */
export interface CompositeShotResult {
  success: boolean
  mediaId?: string
  imageUrl?: string
  consistencyScore?: number
  usedReferences: string[]
  metadata?: Record<string, any>
  error?: string
}

/**
 * Consistency Verification Result
 */
export interface ConsistencyVerificationResult {
  success: boolean
  passed: boolean
  overallConsistency: number
  scores: {
    facial?: number
    color?: number
    style?: number
    composition?: number
  }
  differences: Array<{
    type: string
    severity: 'low' | 'medium' | 'high'
    description: string
  }>
  recommendations?: string[]
  metadata?: Record<string, any>
  error?: string
}
