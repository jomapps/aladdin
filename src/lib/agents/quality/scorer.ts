/**
 * Quality Scorer
 * LLM-based quality assessment with caching
 */

import { LLMClient, getLLMClient } from '../../llm/client'
import Redis from 'ioredis'
import {
  AssessmentInput,
  QualityAssessment,
  QualityDimensions,
  LLMAssessmentResponse,
  CachedAssessment,
} from './types'
import {
  buildAssessmentPrompt,
  buildQuickAssessmentPrompt,
  buildConsistencyCheckPrompt,
} from './prompts'
import { getDepartmentWeights, calculateWeightedScore } from './weights'
import { getQualityDecision, clampScore, validateScore, getRecommendedAction } from './thresholds'

/**
 * Quality Scorer Configuration
 */
export interface QualityScorerConfig {
  /** Enable Redis caching */
  enableCache?: boolean
  /** Cache TTL in seconds (default: 1 hour) */
  cacheTTL?: number
  /** LLM temperature for assessment (default: 0.2 for consistency) */
  temperature?: number
  /** Max tokens for LLM response */
  maxTokens?: number
}

/**
 * QualityScorer Class
 * Assesses agent outputs using LLM and caches results
 */
export class QualityScorer {
  private llmClient: LLMClient
  private redis: Redis | null = null
  private config: Required<QualityScorerConfig>

  constructor(llmClient: LLMClient, config: QualityScorerConfig = {}) {
    this.llmClient = llmClient
    this.config = {
      enableCache: config.enableCache ?? true,
      cacheTTL: config.cacheTTL ?? 3600,
      temperature: config.temperature ?? 0.2,
      maxTokens: config.maxTokens ?? 2000,
    }

    // Initialize Redis for caching if enabled
    if (this.config.enableCache && process.env.REDIS_URL) {
      try {
        this.redis = new Redis(process.env.REDIS_URL)
      } catch (error) {
        console.warn('[QualityScorer] Redis initialization failed, caching disabled:', error)
        this.redis = null
      }
    }
  }

  /**
   * Assess quality of agent output
   * Main entry point for quality assessment
   */
  async assessQuality(input: AssessmentInput): Promise<QualityAssessment> {
    const cacheKey = input.cacheKey || this.generateCacheKey(input)

    // Check cache first
    if (this.redis) {
      const cached = await this.getCachedAssessment(cacheKey)
      if (cached) {
        console.log('[QualityScorer] Cache hit for', cacheKey)
        return cached.assessment
      }
    }

    // Perform LLM assessment
    const assessment = await this.performAssessment(input)

    // Cache result
    if (this.redis) {
      await this.cacheAssessment(cacheKey, assessment)
    }

    return assessment
  }

  /**
   * Perform LLM-based quality assessment
   */
  private async performAssessment(input: AssessmentInput): Promise<QualityAssessment> {
    const prompt = buildAssessmentPrompt(input)

    try {
      // Call LLM for assessment
      const response = await this.llmClient.completeJSON<LLMAssessmentResponse>(prompt, {
        temperature: this.config.temperature,
        maxTokens: this.config.maxTokens,
      })

      // Extract and validate dimension scores
      const dimensions = this.extractDimensions(response, input.departmentId)

      // Calculate weighted overall score
      const weights = getDepartmentWeights(input.departmentId)
      const calculatedOverall = calculateWeightedScore(dimensions, weights)

      // Use LLM's overall score if close to calculated, otherwise use calculated
      const overallScore =
        Math.abs(response.overallScore - calculatedOverall) < 5
          ? response.overallScore
          : calculatedOverall

      // Determine decision
      const decision = this.normalizeDecision(
        response.decision,
        overallScore,
        dimensions.consistency,
        input.level,
      )

      // Build assessment result
      const assessment: QualityAssessment = {
        dimensions,
        overallScore: clampScore(overallScore),
        decision,
        confidence: Math.max(0, Math.min(1, response.confidence || 0.8)),
        issues: response.issues || [],
        suggestions: response.suggestions || [],
        reasoning: response.reasoning || 'No reasoning provided',
        assessedAt: new Date(),
      }

      return assessment
    } catch (error) {
      console.error('[QualityScorer] Assessment failed:', error)
      throw new Error(
        `Quality assessment failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  /**
   * Extract dimension scores from LLM response
   */
  private extractDimensions(
    response: LLMAssessmentResponse,
    departmentId: string,
  ): QualityDimensions {
    const department = departmentId.toLowerCase()
    const isCreativeDept = department === 'story' || department === 'character'
    const isTechnicalDept =
      department === 'video' || department === 'audio' || department === 'visual'

    return {
      confidence: clampScore(response.qualityScore || 0),
      completeness: clampScore(response.completenessScore || 0),
      relevance: clampScore(response.relevanceScore || 0),
      consistency: clampScore(response.consistencyScore || 0),
      creativity: isCreativeDept ? clampScore(response.creativityScore || 0) : 0,
      technical: isTechnicalDept ? clampScore(response.technicalScore || 0) : 0,
    }
  }

  /**
   * Normalize decision from LLM response
   */
  private normalizeDecision(
    llmDecision: string,
    overallScore: number,
    consistencyScore: number,
    level?: string,
  ) {
    const normalized = llmDecision.toUpperCase()

    // Validate LLM decision matches threshold rules
    const expectedDecision = getQualityDecision(
      overallScore,
      consistencyScore,
      (level as any) || 'specialist',
    )

    // If LLM decision is within 1 threshold tier of expected, use it
    const validDecisions = ['REJECT', 'RETRY', 'ACCEPT', 'EXEMPLARY']
    if (validDecisions.includes(normalized)) {
      return normalized as any
    }

    // Otherwise use calculated decision
    return expectedDecision
  }

  /**
   * Quick quality check (faster, less detailed)
   */
  async quickCheck(content: string, departmentId: string): Promise<number> {
    const prompt = buildQuickAssessmentPrompt(content, departmentId)

    try {
      const response = await this.llmClient.completeJSON<{
        overallScore: number
        decision: string
        reasoning: string
      }>(prompt, {
        temperature: this.config.temperature,
        maxTokens: 500,
      })

      return clampScore(response.overallScore)
    } catch (error) {
      console.error('[QualityScorer] Quick check failed:', error)
      throw error
    }
  }

  /**
   * Consistency-only check
   */
  async checkConsistency(
    content: string,
    existingContext: Record<string, any>,
    departmentId: string,
  ): Promise<number> {
    const prompt = buildConsistencyCheckPrompt(content, existingContext, departmentId)

    try {
      const response = await this.llmClient.completeJSON<{
        consistencyScore: number
        inconsistencies: string[]
        reasoning: string
      }>(prompt, {
        temperature: this.config.temperature,
        maxTokens: 1000,
      })

      return clampScore(response.consistencyScore)
    } catch (error) {
      console.error('[QualityScorer] Consistency check failed:', error)
      throw error
    }
  }

  /**
   * Generate cache key from input
   */
  private generateCacheKey(input: AssessmentInput): string {
    const contentHash = this.hashString(input.content)
    const contextHash = input.projectContext
      ? this.hashString(JSON.stringify(input.projectContext))
      : 'no-context'

    return `quality:${input.departmentId}:${contentHash}:${contextHash}`
  }

  /**
   * Simple string hash function
   */
  private hashString(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36)
  }

  /**
   * Get cached assessment
   */
  private async getCachedAssessment(cacheKey: string): Promise<CachedAssessment | null> {
    if (!this.redis) return null

    try {
      const cached = await this.redis.get(cacheKey)
      if (!cached) return null

      const parsed = JSON.parse(cached) as CachedAssessment

      // Check if expired
      if (new Date(parsed.expiresAt) < new Date()) {
        await this.redis.del(cacheKey)
        return null
      }

      return parsed
    } catch (error) {
      console.warn('[QualityScorer] Cache retrieval failed:', error)
      return null
    }
  }

  /**
   * Cache assessment result
   */
  private async cacheAssessment(cacheKey: string, assessment: QualityAssessment): Promise<void> {
    if (!this.redis) return

    try {
      const cached: CachedAssessment = {
        assessment,
        cacheKey,
        expiresAt: new Date(Date.now() + this.config.cacheTTL * 1000),
      }

      await this.redis.setex(cacheKey, this.config.cacheTTL, JSON.stringify(cached))
    } catch (error) {
      console.warn('[QualityScorer] Cache storage failed:', error)
    }
  }

  /**
   * Clear cache for specific key or all quality assessments
   */
  async clearCache(cacheKey?: string): Promise<void> {
    if (!this.redis) return

    try {
      if (cacheKey) {
        await this.redis.del(cacheKey)
      } else {
        const keys = await this.redis.keys('quality:*')
        if (keys.length > 0) {
          await this.redis.del(...keys)
        }
      }
    } catch (error) {
      console.warn('[QualityScorer] Cache clear failed:', error)
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{ totalKeys: number; keysByDepartment: Record<string, number> }> {
    if (!this.redis) {
      return { totalKeys: 0, keysByDepartment: {} }
    }

    try {
      const keys = await this.redis.keys('quality:*')
      const keysByDepartment: Record<string, number> = {}

      for (const key of keys) {
        const dept = key.split(':')[1]
        keysByDepartment[dept] = (keysByDepartment[dept] || 0) + 1
      }

      return {
        totalKeys: keys.length,
        keysByDepartment,
      }
    } catch (error) {
      console.warn('[QualityScorer] Cache stats failed:', error)
      return { totalKeys: 0, keysByDepartment: {} }
    }
  }

  /**
   * Close Redis connection
   */
  async close(): Promise<void> {
    if (this.redis) {
      await this.redis.quit()
      this.redis = null
    }
  }
}

/**
 * Create quality scorer instance with singleton LLM client
 */
export function createQualityScorer(config?: QualityScorerConfig): QualityScorer {
  const llmClient = getLLMClient()
  return new QualityScorer(llmClient, config)
}
