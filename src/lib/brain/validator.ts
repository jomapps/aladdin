/**
 * Phase 3: Brain Content Validator
 * Main validation logic with quality scoring and contradiction detection
 */

import type { ValidationResult, BrainValidationRequest, QualityScoring, Contradiction } from './types'
import { getBrainClient } from './client'
import { getJinaEmbeddings } from './embeddings'
import { getNeo4jConnection } from './neo4j'
import { getNode, getNodesByType, semanticSearch } from './queries'
import { detectContradictions } from './consistency'
import { calculateQualityScore } from './qualityScoring'

export class ContentValidator {
  /**
   * Validate content for quality, consistency, and contradictions
   */
  async validate(request: BrainValidationRequest): Promise<ValidationResult> {
    const { content, type, projectId, context } = request

    try {
      // Step 1: Calculate quality scores
      const qualityScoring = await calculateQualityScore(content, type)

      // Step 2: Generate embedding for semantic analysis
      const jina = getJinaEmbeddings()
      const embedding = await jina.generateContentEmbedding(content, type)

      // Step 3: Find similar existing content
      const neo4j = getNeo4jConnection()
      await neo4j.connect()

      const similarContent = await semanticSearch(neo4j, embedding.vector, {
        types: [type],
        projectId,
        limit: 10,
        threshold: 0.75,
      })

      // Step 4: Detect contradictions
      const contradictions = await detectContradictions(
        content,
        type,
        projectId,
        similarContent,
        context
      )

      // Step 5: Generate suggestions
      const suggestions = this.generateSuggestions(
        content,
        type,
        qualityScoring,
        contradictions,
        similarContent
      )

      // Step 6: Calculate overall validity
      const valid = this.determineValidity(qualityScoring, contradictions)

      return {
        valid,
        qualityScore: qualityScoring.overall,
        coherenceScore: qualityScoring.coherence,
        creativityScore: qualityScoring.creativity,
        completenessScore: qualityScoring.completeness,
        contradictions,
        suggestions,
        metadata: {
          similarContentCount: similarContent.length,
          embeddingDimensions: embedding.dimensions,
          analysisTimestamp: new Date().toISOString(),
        },
      }
    } catch (error: any) {
      console.error('Validation error:', error)

      return {
        valid: false,
        qualityScore: 0,
        coherenceScore: 0,
        creativityScore: 0,
        completenessScore: 0,
        contradictions: [],
        suggestions: [`Validation failed: ${error.message}`],
        metadata: {
          error: error.message,
        },
      }
    }
  }

  /**
   * Batch validate multiple items
   */
  async validateBatch(requests: BrainValidationRequest[]): Promise<ValidationResult[]> {
    const results = await Promise.all(requests.map(req => this.validate(req)))
    return results
  }

  /**
   * Determine overall validity based on quality and contradictions
   */
  private determineValidity(
    quality: QualityScoring,
    contradictions: Contradiction[]
  ): boolean {
    // Fail if overall quality is too low
    if (quality.overall < 0.4) {
      return false
    }

    // Fail if there are critical contradictions
    const criticalContradictions = contradictions.filter(c => c.severity === 'critical')
    if (criticalContradictions.length > 0) {
      return false
    }

    // Fail if there are too many high-severity contradictions
    const highSeverityContradictions = contradictions.filter(
      c => c.severity === 'high' || c.severity === 'critical'
    )
    if (highSeverityContradictions.length > 2) {
      return false
    }

    return true
  }

  /**
   * Generate improvement suggestions
   */
  private generateSuggestions(
    content: any,
    type: string,
    quality: QualityScoring,
    contradictions: Contradiction[],
    similarContent: any[]
  ): string[] {
    const suggestions: string[] = []

    // Quality-based suggestions
    if (quality.coherence < 0.6) {
      suggestions.push('Consider improving internal consistency and logical flow')
    }

    if (quality.creativity < 0.5) {
      suggestions.push('Add more unique or original elements to stand out')
    }

    if (quality.completeness < 0.7) {
      suggestions.push('Fill in missing details to create a more complete profile')
    }

    // Contradiction-based suggestions
    if (contradictions.length > 0) {
      const criticalCount = contradictions.filter(c => c.severity === 'critical').length
      const highCount = contradictions.filter(c => c.severity === 'high').length

      if (criticalCount > 0) {
        suggestions.push(
          `Resolve ${criticalCount} critical contradiction(s) with existing content`
        )
      }

      if (highCount > 0) {
        suggestions.push(`Address ${highCount} high-severity contradiction(s)`)
      }

      // Add specific contradiction resolutions
      contradictions
        .filter(c => c.suggestedResolution)
        .forEach(c => {
          if (c.suggestedResolution) {
            suggestions.push(c.suggestedResolution)
          }
        })
    }

    // Similarity-based suggestions
    if (similarContent.length > 3) {
      suggestions.push(
        'Very similar content already exists - consider making this more distinct'
      )
    }

    // Type-specific suggestions
    if (type === 'character') {
      if (!content.personality?.traits || content.personality.traits.length < 3) {
        suggestions.push('Add more personality traits for depth (aim for 5-7)')
      }

      if (!content.backstory || content.backstory.length < 100) {
        suggestions.push('Expand backstory with more detail and history')
      }

      if (!content.appearance?.description) {
        suggestions.push('Add physical appearance description')
      }
    }

    if (type === 'scene') {
      if (!content.mood) {
        suggestions.push('Define the mood or atmosphere of the scene')
      }

      if (!content.characters || content.characters.length === 0) {
        suggestions.push('Specify which characters are in this scene')
      }
    }

    return suggestions
  }

  /**
   * Quick validation check (for real-time feedback)
   */
  async quickValidate(
    content: any,
    type: string
  ): Promise<{ score: number; issues: string[] }> {
    const quality = await calculateQualityScore(content, type)
    const issues: string[] = []

    if (quality.coherence < 0.5) {
      issues.push('Low coherence score - check for inconsistencies')
    }

    if (quality.completeness < 0.5) {
      issues.push('Incomplete content - add more details')
    }

    return {
      score: quality.overall,
      issues,
    }
  }
}

/**
 * Get global validator instance
 */
let validatorInstance: ContentValidator | null = null

export function getContentValidator(): ContentValidator {
  if (!validatorInstance) {
    validatorInstance = new ContentValidator()
  }
  return validatorInstance
}

export { ContentValidator as default }
