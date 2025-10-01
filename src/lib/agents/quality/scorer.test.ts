/**
 * Quality Scorer Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { QualityScorer } from './scorer'
import { LLMClient } from '../../llm/client'
import Redis from 'ioredis'

// Mock Redis
vi.mock('ioredis')

// Mock LLM Client
const createMockLLMClient = () => {
  return {
    completeJSON: vi.fn(),
    complete: vi.fn(),
    chat: vi.fn(),
  } as unknown as LLMClient
}

describe('QualityScorer', () => {
  let mockLLM: LLMClient
  let scorer: QualityScorer

  beforeEach(() => {
    mockLLM = createMockLLMClient()
    scorer = new QualityScorer(mockLLM, { enableCache: false })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('assessQuality', () => {
    it('should assess quality with all dimensions for story department', async () => {
      const mockResponse = {
        qualityScore: 85,
        relevanceScore: 90,
        consistencyScore: 80,
        completenessScore: 88,
        creativityScore: 92,
        technicalScore: 0,
        overallScore: 87,
        confidence: 0.9,
        issues: ['Minor pacing issue'],
        suggestions: ['Consider tightening dialogue'],
        decision: 'ACCEPT',
        reasoning: 'Strong narrative with good character development',
      }

      vi.mocked(mockLLM.completeJSON).mockResolvedValue(mockResponse)

      const assessment = await scorer.assessQuality({
        content: 'A compelling opening scene with strong character introduction...',
        departmentId: 'story',
        task: 'Create opening scene',
        expectedOutcome: 'Compelling narrative hook',
      })

      expect(assessment.overallScore).toBeGreaterThan(0)
      expect(assessment.decision).toBe('ACCEPT')
      expect(assessment.dimensions.creativity).toBeGreaterThan(0)
      expect(assessment.confidence).toBeGreaterThanOrEqual(0)
      expect(assessment.confidence).toBeLessThanOrEqual(1)
      expect(assessment.issues).toHaveLength(1)
      expect(assessment.suggestions).toHaveLength(1)
    })

    it('should assess quality for technical departments with technical score', async () => {
      const mockResponse = {
        qualityScore: 88,
        relevanceScore: 85,
        consistencyScore: 90,
        completenessScore: 92,
        creativityScore: 0,
        technicalScore: 95,
        overallScore: 90,
        confidence: 0.95,
        issues: [],
        suggestions: ['Consider 4K resolution upgrade'],
        decision: 'EXEMPLARY',
        reasoning: 'Excellent technical specifications',
      }

      vi.mocked(mockLLM.completeJSON).mockResolvedValue(mockResponse)

      const assessment = await scorer.assessQuality({
        content: 'Video specifications: 1080p, 60fps, H.264 codec...',
        departmentId: 'video',
        task: 'Define video specifications',
      })

      expect(assessment.overallScore).toBeGreaterThanOrEqual(90)
      expect(assessment.decision).toBe('EXEMPLARY')
      expect(assessment.dimensions.technical).toBeGreaterThan(0)
      expect(assessment.dimensions.creativity).toBe(0)
    })

    it('should handle REJECT decision for low quality', async () => {
      const mockResponse = {
        qualityScore: 40,
        relevanceScore: 50,
        consistencyScore: 35,
        completenessScore: 45,
        creativityScore: 30,
        overallScore: 42,
        confidence: 0.85,
        issues: ['Incomplete story arc', 'Poor character development', 'Grammar issues'],
        suggestions: ['Develop full character backstory', 'Fix grammar and spelling'],
        decision: 'REJECT',
        reasoning: 'Multiple critical quality issues',
      }

      vi.mocked(mockLLM.completeJSON).mockResolvedValue(mockResponse)

      const assessment = await scorer.assessQuality({
        content: 'A poorly written scene...',
        departmentId: 'story',
      })

      expect(assessment.overallScore).toBeLessThan(60)
      expect(assessment.decision).toBe('REJECT')
      expect(assessment.issues.length).toBeGreaterThan(0)
    })

    it('should handle RETRY decision for below acceptable quality', async () => {
      const mockResponse = {
        qualityScore: 65,
        relevanceScore: 70,
        consistencyScore: 68,
        completenessScore: 62,
        creativityScore: 72,
        overallScore: 67,
        confidence: 0.75,
        issues: ['Missing character motivation'],
        suggestions: ['Add backstory', 'Develop internal conflict'],
        decision: 'RETRY',
        reasoning: 'Needs improvement in character development',
      }

      vi.mocked(mockLLM.completeJSON).mockResolvedValue(mockResponse)

      const assessment = await scorer.assessQuality({
        content: 'A character with basic traits...',
        departmentId: 'character',
      })

      expect(assessment.overallScore).toBeGreaterThanOrEqual(60)
      expect(assessment.overallScore).toBeLessThan(75)
      expect(assessment.decision).toBe('RETRY')
    })

    it('should clamp scores to valid range', async () => {
      const mockResponse = {
        qualityScore: 150, // Invalid - should be clamped
        relevanceScore: -10, // Invalid - should be clamped
        consistencyScore: 80,
        completenessScore: 90,
        creativityScore: 85,
        overallScore: 110, // Invalid - should be clamped
        confidence: 1.5, // Invalid - should be clamped
        issues: [],
        suggestions: [],
        decision: 'ACCEPT',
        reasoning: 'Test invalid scores',
      }

      vi.mocked(mockLLM.completeJSON).mockResolvedValue(mockResponse)

      const assessment = await scorer.assessQuality({
        content: 'Test content',
        departmentId: 'story',
      })

      expect(assessment.dimensions.confidence).toBeLessThanOrEqual(100)
      expect(assessment.dimensions.relevance).toBeGreaterThanOrEqual(0)
      expect(assessment.overallScore).toBeLessThanOrEqual(100)
      expect(assessment.confidence).toBeLessThanOrEqual(1)
    })
  })

  describe('quickCheck', () => {
    it('should perform quick quality check', async () => {
      const mockResponse = {
        overallScore: 82,
        decision: 'ACCEPT',
        reasoning: 'Good quality content',
      }

      vi.mocked(mockLLM.completeJSON).mockResolvedValue(mockResponse)

      const score = await scorer.quickCheck('Test content', 'story')

      expect(score).toBe(82)
      expect(mockLLM.completeJSON).toHaveBeenCalledWith(
        expect.stringContaining('Quickly assess'),
        expect.objectContaining({ maxTokens: 500 })
      )
    })
  })

  describe('checkConsistency', () => {
    it('should check consistency with project context', async () => {
      const mockResponse = {
        consistencyScore: 88,
        inconsistencies: ['Minor timeline discrepancy'],
        reasoning: 'Mostly consistent with established lore',
      }

      vi.mocked(mockLLM.completeJSON).mockResolvedValue(mockResponse)

      const score = await scorer.checkConsistency(
        'Character appears in modern setting',
        { setting: 'medieval', era: '1200s' },
        'character'
      )

      expect(score).toBe(88)
      expect(mockLLM.completeJSON).toHaveBeenCalledWith(
        expect.stringContaining('Check if this character output is consistent'),
        expect.any(Object)
      )
    })
  })

  describe('caching', () => {
    it('should cache assessment results when enabled', async () => {
      const mockRedis = {
        get: vi.fn().mockResolvedValue(null),
        setex: vi.fn().mockResolvedValue('OK'),
        del: vi.fn().mockResolvedValue(1),
        keys: vi.fn().mockResolvedValue([]),
        quit: vi.fn().mockResolvedValue('OK'),
      }

      vi.mocked(Redis).mockImplementation(() => mockRedis as any)

      const scorerWithCache = new QualityScorer(mockLLM, {
        enableCache: true,
        cacheTTL: 3600,
      })

      const mockResponse = {
        qualityScore: 85,
        relevanceScore: 90,
        consistencyScore: 80,
        completenessScore: 88,
        creativityScore: 92,
        overallScore: 87,
        confidence: 0.9,
        issues: [],
        suggestions: [],
        decision: 'ACCEPT',
        reasoning: 'Good quality',
      }

      vi.mocked(mockLLM.completeJSON).mockResolvedValue(mockResponse)

      await scorerWithCache.assessQuality({
        content: 'Test content',
        departmentId: 'story',
      })

      expect(mockRedis.get).toHaveBeenCalled()
      expect(mockRedis.setex).toHaveBeenCalled()

      await scorerWithCache.close()
    })
  })

  describe('error handling', () => {
    it('should throw error when LLM assessment fails', async () => {
      vi.mocked(mockLLM.completeJSON).mockRejectedValue(new Error('LLM API error'))

      await expect(
        scorer.assessQuality({
          content: 'Test content',
          departmentId: 'story',
        })
      ).rejects.toThrow('Quality assessment failed')
    })
  })
})
