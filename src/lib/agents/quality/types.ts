/**
 * Quality Assessment Types
 * Multi-dimensional quality scoring system for agent outputs
 */

/**
 * Quality dimensions measured for each agent output
 * Each dimension is scored 0-100
 */
export interface QualityDimensions {
  /** Content quality - grammar, clarity, structure, attention to detail */
  confidence: number

  /** Task completion - all requested elements present, sufficient detail */
  completeness: number

  /** Task relevance - directly answers prompt, stays on topic */
  relevance: number

  /** Project consistency - matches established facts, character traits, story direction */
  consistency: number

  /** Creative merit - original ideas, compelling narrative (story/character departments) */
  creativity: number

  /** Technical accuracy - follows standards, feasible, production-ready (video/audio/visual departments) */
  technical: number
}

/**
 * Complete quality assessment result
 */
export interface QualityAssessment {
  /** Individual dimension scores (0-100) */
  dimensions: QualityDimensions

  /** Weighted overall score (0-100) */
  overallScore: number

  /** Quality decision based on thresholds */
  decision: QualityDecision

  /** Confidence in assessment (0-1) */
  confidence: number

  /** Identified issues (empty if none) */
  issues: string[]

  /** Improvement suggestions */
  suggestions: string[]

  /** Reasoning behind the decision */
  reasoning: string

  /** Timestamp of assessment */
  assessedAt: Date
}

/**
 * Quality decision types based on threshold rules
 */
export type QualityDecision =
  | 'REJECT'               // < 60: Critical issues, cannot proceed
  | 'RETRY'                // 60-74: Needs improvement, request revision
  | 'ACCEPT'               // 75-89: Meets standards, minor improvements optional
  | 'EXEMPLARY'            // 90-100: Exceptional quality, use as example

/**
 * Assessment level context
 */
export type AssessmentLevel = 'specialist' | 'department' | 'overall'

/**
 * Input for quality assessment
 */
export interface AssessmentInput {
  /** Content to assess */
  content: string

  /** Department context (story, character, visual, video, audio, production) */
  departmentId: string

  /** The task that was given to the agent */
  task?: string

  /** Expected outcome or requirements */
  expectedOutcome?: string

  /** Existing project context for consistency checking */
  projectContext?: Record<string, any>

  /** Assessment level */
  level?: AssessmentLevel

  /** Cache key for avoiding re-assessment */
  cacheKey?: string
}

/**
 * Department-specific scoring weights
 * Each department has different priorities for quality dimensions
 */
export interface ScoringWeights {
  confidence: number
  completeness: number
  relevance: number
  consistency: number
  creativity: number
  technical: number
}

/**
 * Quality thresholds for decision making
 */
export interface QualityThresholds {
  /** Minimum acceptable score */
  minimum: number

  /** Acceptable quality range start */
  acceptable: number

  /** Good quality range start */
  good: number

  /** Excellent quality range start */
  excellent: number
}

/**
 * Cached assessment result
 */
export interface CachedAssessment {
  assessment: QualityAssessment
  cacheKey: string
  expiresAt: Date
}

/**
 * LLM-based assessment response structure
 */
export interface LLMAssessmentResponse {
  qualityScore?: number
  relevanceScore?: number
  consistencyScore?: number
  completenessScore?: number
  creativityScore?: number
  technicalScore?: number
  overallScore: number
  confidence: number
  issues: string[]
  suggestions: string[]
  decision: string
  reasoning: string
}
