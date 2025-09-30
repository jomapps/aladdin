/**
 * Grade Output Custom Tool
 * Department heads use this to grade specialist outputs
 */

import { getCustomToolDefinition } from '@codebuff/sdk'
import { z } from 'zod'

export const gradeOutputTool = getCustomToolDefinition({
  toolName: 'grade_output',
  description: 'Grade specialist output for quality and relevance',

  inputSchema: z.object({
    specialistId: z.string(),
    output: z.any(),
    gradingCriteria: z.object({
      quality: z.boolean().optional(),
      relevance: z.boolean().optional(),
      consistency: z.boolean().optional()
    }).optional()
  }),

  execute: async ({ specialistId, output, gradingCriteria = {} }) => {
    try {
      // Analyze output quality
      const quality = analyzeQuality(output)
      const relevance = analyzeRelevance(output)
      const consistency = analyzeConsistency(output)

      const overallScore = (
        quality * 0.4 +
        relevance * 0.3 +
        consistency * 0.3
      )

      const decision = overallScore >= 0.60 ? 'accept' :
                      overallScore >= 0.40 ? 'revise' : 'discard'

      const result = {
        specialistId,
        qualityScore: quality,
        relevanceScore: relevance,
        consistencyScore: consistency,
        overallScore,
        decision,
        issues: findIssues(output, overallScore),
        suggestions: generateSuggestions(output, overallScore)
      }

      return [{
        type: 'text',
        value: JSON.stringify(result, null, 2)
      }]
    } catch (error) {
      return [{
        type: 'text',
        value: `Error grading output: ${error instanceof Error ? error.message : 'Unknown error'}`
      }]
    }
  }
})

// Helper functions
function analyzeQuality(output: any): number {
  // Simple quality analysis
  if (!output || typeof output !== 'object') return 0.3

  const hasContent = Object.keys(output).length > 0
  const hasCompleteness = output.completeness && output.completeness > 0.5
  const hasConfidence = output.confidence && output.confidence > 0.5

  let score = 0.5
  if (hasContent) score += 0.2
  if (hasCompleteness) score += 0.15
  if (hasConfidence) score += 0.15

  return Math.min(score, 1.0)
}

function analyzeRelevance(output: any): number {
  // Check if output has relevant fields
  if (!output) return 0.3

  // For character-related outputs
  if (output.hairstyle || output.personality || output.appearance) {
    return 0.85
  }

  return 0.6
}

function analyzeConsistency(output: any): number {
  // Placeholder: would check against Brain in Phase 3
  return 0.75
}

function findIssues(output: any, score: number): string[] {
  const issues: string[] = []

  if (score < 0.5) {
    issues.push('Overall quality below threshold')
  }

  if (!output.confidence || output.confidence < 0.6) {
    issues.push('Low self-assessment confidence')
  }

  if (!output.completeness || output.completeness < 0.7) {
    issues.push('Output appears incomplete')
  }

  return issues
}

function generateSuggestions(output: any, score: number): string[] {
  const suggestions: string[] = []

  if (score < 0.6) {
    suggestions.push('Add more detail to improve quality')
  }

  if (!output.reasoning) {
    suggestions.push('Include reasoning for design choices')
  }

  return suggestions
}
