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

/**
 * Phase 6: Video Generation Types
 */

export type FalVideoModel =
  | 'fal-ai/ltx-video'
  | 'fal-ai/runway-gen3'
  | 'fal-ai/minimax-video'
  | 'fal-ai/hunyuan-video'
  | 'fal-ai/mochi-v1'

export type FalVideoFormat = 'mp4' | 'webm' | 'mov'

export type FalVideoGenerationType = 'text-to-video' | 'image-to-video' | 'first-last-frame' | 'composite-to-video'

export interface FalVideoGenerationRequest {
  type: FalVideoGenerationType
  prompt: string
  model?: FalVideoModel
  duration?: number // seconds, max 7
  fps?: number // frames per second
  resolution?: {
    width: number
    height: number
  }
  format?: FalVideoFormat
  seed?: number
  motionStrength?: number // 0-1
  negativePrompt?: string
}

export interface FalTextToVideoRequest extends FalVideoGenerationRequest {
  type: 'text-to-video'
}

export interface FalImageToVideoRequest extends FalVideoGenerationRequest {
  type: 'image-to-video'
  imageUrl: string
  motionParameters?: {
    cameraMovement?: 'pan-left' | 'pan-right' | 'zoom-in' | 'zoom-out' | 'static'
    characterAction?: string
    sceneTransition?: boolean
  }
}

export interface FalFirstLastFrameRequest extends FalVideoGenerationRequest {
  type: 'first-last-frame'
  firstFrameUrl: string
  lastFrameUrl: string
  interpolationSteps?: number
}

export interface FalCompositeToVideoRequest extends FalVideoGenerationRequest {
  type: 'composite-to-video'
  compositeImageUrl: string
  referenceImages?: Array<{
    url: string
    type: 'character' | 'location' | 'style'
    weight?: number
  }>
  cameraMovement?: {
    type: 'pan-left' | 'pan-right' | 'zoom-in' | 'zoom-out' | 'dolly' | 'crane' | 'static'
    speed?: 'slow' | 'medium' | 'fast'
    easing?: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out'
  }
}

export interface FalVideoResult {
  url: string
  thumbnailUrl?: string
  width: number
  height: number
  duration: number
  fps: number
  fileSize: number
  format: FalVideoFormat
  seed?: number
}

export interface FalGenerateVideoResponse {
  video: FalVideoResult
  seed: number
  prompt: string
  model: string
  timings: {
    inference: number
    total: number
  }
  metadata?: Record<string, any>
}

/**
 * Video Generation Result
 */
export interface VideoGenerationResult {
  success: boolean
  mediaId?: string
  url?: string
  thumbnailUrl?: string
  width?: number
  height?: number
  duration?: number
  fps?: number
  fileSize?: number
  seed?: number
  qualityScore?: number
  timings?: {
    generation: number
    upload: number
    qualityCheck: number
    total: number
  }
  metadata?: Record<string, any>
  error?: string
}

/**
 * Video Quality Check Result
 */
export interface VideoQualityCheckResult {
  passed: boolean
  overallScore: number
  checks: {
    duration: {
      passed: boolean
      actual: number
      expected: number
    }
    resolution: {
      passed: boolean
      width: number
      height: number
    }
    fps: {
      passed: boolean
      actual: number
      minimum: number
    }
    consistency: {
      characterConsistency?: number
      locationConsistency?: number
      colorConsistency?: number
    }
    technical: {
      fileSize: number
      format: string
      corruption: boolean
    }
  }
  issues: Array<{
    type: string
    severity: 'low' | 'medium' | 'high' | 'critical'
    description: string
  }>
  recommendations?: string[]
}

/**
 * Scene Assembly Configuration
 */
export interface SceneAssemblyConfig {
  clips: Array<{
    videoUrl: string
    startTime?: number
    endTime?: number
    duration: number
  }>
  transitions?: Array<{
    type: 'cut' | 'fade' | 'dissolve' | 'wipe'
    duration?: number
    position: number // between clip index
  }>
  audioTracks?: Array<{
    url: string
    type: 'dialogue' | 'music' | 'sfx'
    startTime: number
    volume?: number
    fadeIn?: number
    fadeOut?: number
  }>
  outputFormat?: FalVideoFormat
  outputResolution?: {
    width: number
    height: number
  }
}

/**
 * Scene Assembly Result
 */
export interface SceneAssemblyResult {
  success: boolean
  mediaId?: string
  url?: string
  duration?: number
  clipCount?: number
  audioTrackCount?: number
  timings?: {
    concatenation: number
    transitions: number
    audioSync: number
    render: number
    upload: number
    total: number
  }
  metadata?: Record<string, any>
  error?: string
}
