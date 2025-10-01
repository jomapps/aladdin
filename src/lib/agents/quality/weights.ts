/**
 * Department-Specific Scoring Weights
 * Different departments prioritize different quality dimensions
 */

import { ScoringWeights } from './types'

/**
 * Scoring weights by department
 * Weights must sum to 100% (1.0) per department
 */
export const DEPARTMENT_WEIGHTS: Record<string, ScoringWeights> = {
  /**
   * Story Department
   * Prioritizes: Creativity, Consistency, Completeness
   */
  story: {
    creativity: 0.25,      // Original narrative ideas
    consistency: 0.25,     // Story coherence
    completeness: 0.20,    // All plot elements present
    relevance: 0.15,       // Addresses story prompt
    technical: 0.10,       // Writing mechanics
    confidence: 0.05,      // Assessment confidence
  },

  /**
   * Character Department
   * Prioritizes: Consistency, Completeness, Creativity
   */
  character: {
    consistency: 0.30,     // Character trait consistency
    completeness: 0.25,    // Full character development
    creativity: 0.20,      // Original character concepts
    relevance: 0.15,       // Fits character brief
    technical: 0.05,       // Character design technical aspects
    confidence: 0.05,      // Assessment confidence
  },

  /**
   * Visual Department
   * Prioritizes: Technical, Creativity, Consistency
   */
  visual: {
    technical: 0.30,       // Visual quality standards
    creativity: 0.25,      // Visual originality
    consistency: 0.20,     // Style consistency
    completeness: 0.15,    // All visual elements present
    relevance: 0.05,       // Matches visual brief
    confidence: 0.05,      // Assessment confidence
  },

  /**
   * Video Department
   * Prioritizes: Technical, Completeness, Consistency
   */
  video: {
    technical: 0.35,       // Video production standards
    completeness: 0.25,    // All video requirements met
    consistency: 0.20,     // Visual continuity
    creativity: 0.10,      // Cinematography creativity
    relevance: 0.05,       // Matches video brief
    confidence: 0.05,      // Assessment confidence
  },

  /**
   * Audio Department
   * Prioritizes: Technical, Completeness, Consistency
   */
  audio: {
    technical: 0.40,       // Audio quality standards
    completeness: 0.25,    // All audio elements present
    consistency: 0.20,     // Audio continuity
    creativity: 0.10,      // Sound design creativity
    relevance: 0.03,       // Matches audio brief
    confidence: 0.02,      // Assessment confidence
  },

  /**
   * Production Department
   * Prioritizes: Technical, Completeness, Relevance
   */
  production: {
    technical: 0.30,       // Production standards
    completeness: 0.30,    // All deliverables present
    relevance: 0.20,       // Addresses production needs
    consistency: 0.15,     // Production workflow consistency
    creativity: 0.03,      // Production innovation
    confidence: 0.02,      // Assessment confidence
  },
}

/**
 * Get scoring weights for a department
 * Falls back to balanced weights if department not found
 */
export function getDepartmentWeights(departmentId: string): ScoringWeights {
  const weights = DEPARTMENT_WEIGHTS[departmentId.toLowerCase()]

  if (!weights) {
    console.warn(`[QualityWeights] Unknown department: ${departmentId}, using balanced weights`)
    return BALANCED_WEIGHTS
  }

  return weights
}

/**
 * Balanced weights for unknown departments or general assessment
 */
export const BALANCED_WEIGHTS: ScoringWeights = {
  confidence: 0.15,
  completeness: 0.20,
  relevance: 0.20,
  consistency: 0.20,
  creativity: 0.15,
  technical: 0.10,
}

/**
 * Validate that weights sum to approximately 1.0
 */
export function validateWeights(weights: ScoringWeights): boolean {
  const sum = Object.values(weights).reduce((acc, val) => acc + val, 0)
  const tolerance = 0.01
  return Math.abs(sum - 1.0) < tolerance
}

/**
 * Calculate weighted overall score from dimensions
 */
export function calculateWeightedScore(
  dimensions: Record<string, number>,
  weights: ScoringWeights
): number {
  let total = 0
  let weightSum = 0

  for (const [dimension, weight] of Object.entries(weights)) {
    const score = dimensions[dimension]
    if (score !== undefined && !isNaN(score)) {
      total += score * weight
      weightSum += weight
    }
  }

  return weightSum > 0 ? total / weightSum : 0
}
