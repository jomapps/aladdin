/**
 * Score Calculator
 *
 * Calculates project-level readiness scores from department evaluations
 */

export interface DepartmentScore {
  departmentSlug: string
  departmentNumber: number
  rating: number
  weight?: number
}

/**
 * Calculate overall project readiness score from department ratings
 *
 * Uses weighted average if weights provided, otherwise simple average
 */
export function calculateProjectReadinessScore(scores: DepartmentScore[]): number {
  if (scores.length === 0) {
    return 0
  }

  // Check if any weights are provided
  const hasWeights = scores.some((s) => s.weight !== undefined && s.weight > 0)

  if (hasWeights) {
    // Weighted average
    const totalWeight = scores.reduce((sum, s) => sum + (s.weight || 0), 0)
    const weightedSum = scores.reduce((sum, s) => sum + s.rating * (s.weight || 0), 0)
    return Math.round(weightedSum / totalWeight)
  } else {
    // Simple average
    const sum = scores.reduce((total, s) => total + s.rating, 0)
    return Math.round(sum / scores.length)
  }
}

/**
 * Calculate completeness percentage (how many departments evaluated)
 */
export function calculateCompleteness(
  evaluatedCount: number,
  totalDepartments: number,
): number {
  if (totalDepartments === 0) return 0
  return Math.round((evaluatedCount / totalDepartments) * 100)
}

/**
 * Determine if project is ready for production
 */
export function isProjectReady(
  projectReadinessScore: number,
  minThreshold: number = 80,
): boolean {
  return projectReadinessScore >= minThreshold
}

/**
 * Get recommendation based on readiness score
 */
export function getRecommendation(
  score: number,
): 'ready' | 'needs_improvement' | 'not_ready' {
  if (score >= 80) return 'ready'
  if (score >= 60) return 'needs_improvement'
  return 'not_ready'
}

/**
 * Calculate consistency score (how close ratings are to each other)
 */
export function calculateConsistency(ratings: number[]): number {
  if (ratings.length === 0) return 0

  const mean = ratings.reduce((sum, r) => sum + r, 0) / ratings.length
  const variance =
    ratings.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / ratings.length
  const stdDev = Math.sqrt(variance)

  // Convert to 0-100 scale (lower std dev = higher consistency)
  // Assuming max std dev of 50 (very inconsistent)
  const consistency = Math.max(0, 100 - (stdDev / 50) * 100)

  return Math.round(consistency)
}
