/**
 * Quality Validation Gates
 * Quality checks at various stages of agent execution
 */

import type { DepartmentReport, OrchestratorResult } from '@/agents/types'

export interface QualityGate {
  name: string
  threshold: number
  passed: boolean
  score: number
  issues: string[]
}

/**
 * Validate specialist output quality
 */
export function validateSpecialistQuality(
  output: any,
  threshold: number = 0.50
): QualityGate {
  const issues: string[] = []
  let score = 0.7 // Base score

  // Check confidence
  if (!output.confidence || output.confidence < 0.6) {
    issues.push('Low confidence score')
    score -= 0.1
  }

  // Check completeness
  if (!output.completeness || output.completeness < 0.7) {
    issues.push('Output appears incomplete')
    score -= 0.1
  }

  // Check for actual content
  if (!output || Object.keys(output).length < 2) {
    issues.push('Insufficient content')
    score -= 0.2
  }

  score = Math.max(0, Math.min(1, score))

  return {
    name: 'Specialist Output Quality',
    threshold,
    passed: score >= threshold,
    score,
    issues
  }
}

/**
 * Validate department report quality
 */
export function validateDepartmentQuality(
  report: DepartmentReport,
  threshold: number = 0.60
): QualityGate {
  const issues: string[] = []
  let score = report.departmentQuality

  // Check relevance
  if (report.relevance < 0.5) {
    issues.push('Low relevance to request')
    score -= 0.1
  }

  // Check for accepted outputs
  const acceptedCount = report.outputs.filter(o => o.decision === 'accept').length
  if (acceptedCount === 0 && report.status === 'complete') {
    issues.push('No accepted outputs from specialists')
    score -= 0.3
  }

  // Add department-specific issues
  issues.push(...report.issues)

  score = Math.max(0, Math.min(1, score))

  return {
    name: `${report.department} Department Quality`,
    threshold,
    passed: score >= threshold,
    score,
    issues
  }
}

/**
 * Validate orchestrator result quality
 */
export function validateOrchestratorQuality(
  result: OrchestratorResult,
  threshold: number = 0.75
): QualityGate {
  const issues: string[] = []
  let score = result.overallQuality

  // Check completeness
  if (result.completeness < 0.8) {
    issues.push('Incomplete department coverage')
    score -= 0.1
  }

  // Check consistency
  if (result.consistency < 0.7) {
    issues.push('Low cross-department consistency')
    score -= 0.1
  }

  // Check brain validation
  if (!result.brainValidated) {
    issues.push('Brain validation failed')
    score -= 0.2
  } else if (result.brainQualityScore < 0.7) {
    issues.push('Low brain quality score')
    score -= 0.1
  }

  score = Math.max(0, Math.min(1, score))

  return {
    name: 'Overall Orchestration Quality',
    threshold,
    passed: score >= threshold,
    score,
    issues
  }
}

/**
 * Run all quality gates on orchestrator result
 */
export function runAllQualityGates(result: OrchestratorResult): {
  passed: boolean
  gates: QualityGate[]
  overallScore: number
} {
  const gates: QualityGate[] = []

  // Department quality gates
  for (const report of result.departmentReports) {
    gates.push(validateDepartmentQuality(report))
  }

  // Overall quality gate
  gates.push(validateOrchestratorQuality(result))

  const passed = gates.every(g => g.passed)
  const overallScore = result.overallQuality

  return {
    passed,
    gates,
    overallScore
  }
}

/**
 * Get recommendation based on quality gates
 */
export function getQualityRecommendation(gates: QualityGate[]): {
  action: 'ingest' | 'modify' | 'discard'
  reason: string
} {
  const failedGates = gates.filter(g => !g.passed)

  if (failedGates.length === 0) {
    return {
      action: 'ingest',
      reason: 'All quality gates passed'
    }
  }

  const criticalFailures = failedGates.filter(g => g.score < 0.5)

  if (criticalFailures.length > 0) {
    return {
      action: 'discard',
      reason: `Critical quality issues: ${criticalFailures.map(g => g.name).join(', ')}`
    }
  }

  return {
    action: 'modify',
    reason: `Quality issues need addressing: ${failedGates.map(g => g.issues.join('; ')).join(', ')}`
  }
}
