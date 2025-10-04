/**
 * Media Generation Pipeline Types
 * Complete type definitions for scene generation system
 */

/**
 * Scene status values for PayloadCMS tracking
 */
export type SceneStatus =
  | 'pending'
  | 'analyzing'
  | 'compositing'
  | 'verifying'
  | 'generating_video'
  | 'extracting_frame'
  | 'completed'
  | 'failed'

/**
 * Camera angle types for character selection
 */
export type CameraAngle =
  | 'front'
  | 'side'
  | 'back'
  | 'three_quarter'
  | 'top'
  | 'bottom'
  | 'dutch'

/**
 * Composite step types
 */
export type CompositeStepType =
  | 'location'
  | 'character'
  | 'prop'
  | 'lighting'
  | 'effect'

/**
 * Scene data structure from PayloadCMS/Brain
 */
export interface Scene {
  id: string
  episodeId: string
  projectId: string
  sceneNumber: number
  description: string
  location?: string
  timeOfDay?: string
  cameraAngle?: CameraAngle
  characters?: string[] // Character IDs
  props?: string[] // Prop IDs
  dialogue?: {
    characterId: string
    text: string
  }[]
  status?: SceneStatus
  composite_iterations?: CompositeIteration[]
  final_composite_url?: string
  video_url?: string
  last_frame_url?: string
  error?: string
  createdAt?: Date
  updatedAt?: Date
}

/**
 * Shot agent decision output
 */
export interface ShotDecision {
  sceneId: string
  compositeSteps: CompositeStep[]
  characterAngles: Record<string, CameraAngle> // characterId -> angle
  pacing: {
    duration: number // seconds
    motion_strength: number // 0-1
    transition_type?: string
  }
  reasoning: string
}

/**
 * Composite step definition
 */
export interface CompositeStep {
  step: number
  type: CompositeStepType
  description: string
  references: ReferenceImage[] // Max 3 per step
  prompt: string
}

/**
 * Reference image for composite
 */
export interface ReferenceImage {
  url: string
  type: 'character' | 'location' | 'prop' | 'style'
  weight?: number // 0-1, default 1.0
  characterId?: string
  angle?: CameraAngle
}

/**
 * Composite iteration tracking
 */
export interface CompositeIteration {
  iteration: number
  step: CompositeStep
  input_image_url?: string // Previous iteration result
  output_image_url: string
  verification: VerificationResult
  timestamp: Date
}

/**
 * Two-step verification result
 */
export interface VerificationResult {
  brain: BrainVerification
  fal: FalVerification
  overall_pass: boolean
  combined_score: number // 0-1
}

/**
 * Brain multimodal verification
 */
export interface BrainVerification {
  passed: boolean
  score: number // 0-1
  feedback: string
  issues?: string[]
}

/**
 * FAL vision model verification
 */
export interface FalVerification {
  passed: boolean
  score: number // 0-1
  description: string
  meets_requirements: boolean
}

/**
 * Video generation result
 */
export interface VideoResult {
  video_url: string
  duration: number
  fps: number
  resolution: {
    width: number
    height: number
  }
}

/**
 * Last frame extraction result
 */
export interface LastFrameResult {
  frame_url: string
  timestamp: number // position in video
}

/**
 * Scene generation error types
 */
export class SceneGenerationError extends Error {
  constructor(
    message: string,
    public sceneId: string,
    public phase: SceneStatus,
    public details?: any
  ) {
    super(message)
    this.name = 'SceneGenerationError'
  }
}

export class CompositeGenerationError extends Error {
  constructor(
    message: string,
    public sceneId: string,
    public iteration: number,
    public step: CompositeStep,
    public details?: any
  ) {
    super(message)
    this.name = 'CompositeGenerationError'
  }
}

export class VerificationError extends Error {
  constructor(
    message: string,
    public sceneId: string,
    public iteration: number,
    public verificationResults: VerificationResult,
    public details?: any
  ) {
    super(message)
    this.name = 'VerificationError'
  }
}

/**
 * PayloadCMS update payload
 */
export interface SceneUpdatePayload {
  status?: SceneStatus
  composite_iterations?: CompositeIteration[]
  final_composite_url?: string
  video_url?: string
  last_frame_url?: string
  error?: string
}

/**
 * Configuration options
 */
export interface SceneGeneratorConfig {
  maxCompositeIterations?: number // default 20
  maxVerificationRetries?: number // default 5
  verificationThreshold?: number // default 0.7
  enableParallelVerification?: boolean // default true
}
