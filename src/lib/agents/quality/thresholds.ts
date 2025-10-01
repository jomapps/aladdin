/**
 * Quality Thresholds & Decision Logic
 * Determines accept/reject decisions based on quality scores
 */

import { QualityDecision, QualityThresholds, AssessmentLevel } from './types'

/**
 * Quality thresholds by assessment level
 */
export const QUALITY_THRESHOLDS: Record<AssessmentLevel, QualityThresholds> = {
  /**
   * Specialist/Individual Agent Outputs
   */
  specialist: {
    minimum: 60,      // Below = REJECT
    acceptable: 75,   // 75-89 = ACCEPT
    good: 90,         // 90-100 = EXEMPLARY
    excellent: 95,    // Reserved for future use
  },

  /**
   * Department-Level Aggregated Quality
   */
  department: {
    minimum: 60,      // Below = REJECT
    acceptable: 75,   // 75-89 = ACCEPT
    good: 90,         // 90-100 = EXEMPLARY
    excellent: 95,    // Reserved for future use
  },

  /**
   * Overall Project-Level Quality
   */
  overall: {
    minimum: 60,      // Below = REJECT
    acceptable: 75,   // 75-89 = ACCEPT
    good: 90,         // 90-100 = EXEMPLARY
    excellent: 95,    // Reserved for future use
  },
}

/**
 * Consistency thresholds (separate from quality thresholds)
 */
export const CONSISTENCY_THRESHOLDS = {
  minimum: 60,      // Below = flag inconsistencies
  acceptable: 75,   // 75-84 = minor inconsistencies
  good: 85,         // 85+ = consistent
}

/**
 * Determine quality decision based on overall and consistency scores
 *
 * Decision Matrix:
 * - < 60: REJECT (critical issues, cannot proceed)
 * - 60-74: RETRY (needs improvement, request revision)
 * - 75-89: ACCEPT (meets standards, minor improvements optional)
 * - 90-100: EXEMPLARY (exceptional quality, use as example)
 *
 * Consistency modifier:
 * - Low consistency (< 60) can downgrade decision to RETRY
 */
export function getQualityDecision(
  overallScore: number,
  consistencyScore: number,
  level: AssessmentLevel = 'specialist'
): QualityDecision {
  const thresholds = QUALITY_THRESHOLDS[level]

  // Check consistency first - low consistency downgrades decision
  const hasConsistencyIssues = consistencyScore < CONSISTENCY_THRESHOLDS.minimum

  // Reject if below minimum threshold
  if (overallScore < thresholds.minimum) {
    return 'REJECT'
  }

  // Retry if below acceptable or has consistency issues
  if (overallScore < thresholds.acceptable || hasConsistencyIssues) {
    return 'RETRY'
  }

  // Exemplary if above good threshold with good consistency
  if (overallScore >= thresholds.good && consistencyScore >= CONSISTENCY_THRESHOLDS.good) {
    return 'EXEMPLARY'
  }

  // Accept for everything else
  return 'ACCEPT'
}

/**
 * Get threshold range label for a score
 */
export function getScoreLabel(score: number, level: AssessmentLevel = 'specialist'): string {
  const thresholds = QUALITY_THRESHOLDS[level]

  if (score < thresholds.minimum) {
    return 'Below Minimum'
  } else if (score < thresholds.acceptable) {
    return 'Needs Improvement'
  } else if (score < thresholds.good) {
    return 'Acceptable'
  } else if (score < thresholds.excellent) {
    return 'Good'
  } else {
    return 'Excellent'
  }
}

/**
 * Check if score requires attention
 */
export function requiresAttention(
  overallScore: number,
  consistencyScore: number,
  level: AssessmentLevel = 'specialist'
): boolean {
  const decision = getQualityDecision(overallScore, consistencyScore, level)
  return decision === 'REJECT' || decision === 'RETRY'
}

/**
 * Get recommended action based on decision
 */
export function getRecommendedAction(decision: QualityDecision): string {
  switch (decision) {
    case 'REJECT':
      return 'Critical quality issues detected. Output cannot be used. Regenerate with different approach.'
    case 'RETRY':
      return 'Quality below acceptable threshold. Request revision with specific improvements.'
    case 'ACCEPT':
      return 'Quality meets standards. Output approved for use. Optional minor improvements suggested.'
    case 'EXEMPLARY':
      return 'Exceptional quality achieved. Output exceeds expectations. Can be used as example.'
    default:
      return 'Unknown decision type'
  }
}

/**
 * Validate that a score is within valid range (0-100)
 */
export function validateScore(score: number): boolean {
  return !isNaN(score) && score >= 0 && score <= 100
}

/**
 * Clamp score to valid range
 */
export function clampScore(score: number): number {
  return Math.max(0, Math.min(100, score))
}
