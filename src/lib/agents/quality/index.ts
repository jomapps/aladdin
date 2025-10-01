/**
 * Quality Assessment System
 * Multi-dimensional quality scoring for agent outputs
 *
 * @module agents/quality
 *
 * @example
 * ```typescript
 * import { createQualityScorer } from '@/lib/agents/quality'
 *
 * const scorer = createQualityScorer()
 *
 * const assessment = await scorer.assessQuality({
 *   content: agentOutput,
 *   departmentId: 'story',
 *   task: 'Create opening scene',
 *   expectedOutcome: 'Compelling narrative hook',
 *   projectContext: { genre: 'thriller', setting: 'modern' }
 * })
 *
 * console.log('Overall Score:', assessment.overallScore)
 * console.log('Decision:', assessment.decision)
 * console.log('Feedback:', assessment.suggestions)
 * ```
 */

// Types
export type {
  QualityDimensions,
  QualityAssessment,
  QualityDecision,
  AssessmentLevel,
  AssessmentInput,
  ScoringWeights,
  QualityThresholds,
  CachedAssessment,
  LLMAssessmentResponse,
} from './types'

// Scorer
export {
  QualityScorer,
  createQualityScorer,
  type QualityScorerConfig,
} from './scorer'

// Weights
export {
  DEPARTMENT_WEIGHTS,
  BALANCED_WEIGHTS,
  getDepartmentWeights,
  validateWeights,
  calculateWeightedScore,
} from './weights'

// Thresholds
export {
  QUALITY_THRESHOLDS,
  CONSISTENCY_THRESHOLDS,
  getQualityDecision,
  getScoreLabel,
  requiresAttention,
  getRecommendedAction,
  validateScore,
  clampScore,
} from './thresholds'

// Prompts
export {
  buildAssessmentPrompt,
  buildQuickAssessmentPrompt,
  buildConsistencyCheckPrompt,
} from './prompts'
