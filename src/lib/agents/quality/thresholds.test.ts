/**
 * Thresholds Tests
 */

import { describe, it, expect } from 'vitest'
import {
  QUALITY_THRESHOLDS,
  CONSISTENCY_THRESHOLDS,
  getQualityDecision,
  getScoreLabel,
  requiresAttention,
  getRecommendedAction,
  validateScore,
  clampScore,
} from './thresholds'

describe('Quality Thresholds', () => {
  describe('QUALITY_THRESHOLDS', () => {
    it('should have thresholds for all assessment levels', () => {
      expect(QUALITY_THRESHOLDS.specialist).toBeDefined()
      expect(QUALITY_THRESHOLDS.department).toBeDefined()
      expect(QUALITY_THRESHOLDS.overall).toBeDefined()
    })

    it('should have thresholds in ascending order', () => {
      for (const level of Object.values(QUALITY_THRESHOLDS)) {
        expect(level.minimum).toBeLessThan(level.acceptable)
        expect(level.acceptable).toBeLessThan(level.good)
        expect(level.good).toBeLessThanOrEqual(level.excellent)
      }
    })
  })

  describe('getQualityDecision', () => {
    it('should return REJECT for scores below minimum', () => {
      const decision = getQualityDecision(50, 80, 'specialist')
      expect(decision).toBe('REJECT')
    })

    it('should return RETRY for scores between minimum and acceptable', () => {
      const decision = getQualityDecision(65, 80, 'specialist')
      expect(decision).toBe('RETRY')
    })

    it('should return RETRY for low consistency even with good score', () => {
      const decision = getQualityDecision(85, 50, 'specialist')
      expect(decision).toBe('RETRY')
    })

    it('should return ACCEPT for scores between acceptable and good', () => {
      const decision = getQualityDecision(80, 80, 'specialist')
      expect(decision).toBe('ACCEPT')
    })

    it('should return EXEMPLARY for scores above good with good consistency', () => {
      const decision = getQualityDecision(92, 90, 'specialist')
      expect(decision).toBe('EXEMPLARY')
    })

    it('should not return EXEMPLARY with low consistency', () => {
      const decision = getQualityDecision(95, 70, 'specialist')
      expect(decision).not.toBe('EXEMPLARY')
    })

    describe('edge cases', () => {
      it('should handle exact threshold values correctly', () => {
        expect(getQualityDecision(60, 80, 'specialist')).toBe('RETRY')
        expect(getQualityDecision(75, 80, 'specialist')).toBe('ACCEPT')
        expect(getQualityDecision(90, 85, 'specialist')).toBe('EXEMPLARY')
      })

      it('should handle perfect scores', () => {
        const decision = getQualityDecision(100, 100, 'specialist')
        expect(decision).toBe('EXEMPLARY')
      })

      it('should handle minimum scores', () => {
        const decision = getQualityDecision(0, 0, 'specialist')
        expect(decision).toBe('REJECT')
      })
    })
  })

  describe('getScoreLabel', () => {
    it('should return correct labels for score ranges', () => {
      expect(getScoreLabel(50, 'specialist')).toBe('Below Minimum')
      expect(getScoreLabel(65, 'specialist')).toBe('Needs Improvement')
      expect(getScoreLabel(80, 'specialist')).toBe('Acceptable')
      expect(getScoreLabel(92, 'specialist')).toBe('Good')
      expect(getScoreLabel(98, 'specialist')).toBe('Excellent')
    })
  })

  describe('requiresAttention', () => {
    it('should return true for REJECT and RETRY', () => {
      expect(requiresAttention(50, 80, 'specialist')).toBe(true)
      expect(requiresAttention(65, 80, 'specialist')).toBe(true)
      expect(requiresAttention(85, 50, 'specialist')).toBe(true)
    })

    it('should return false for ACCEPT and EXEMPLARY', () => {
      expect(requiresAttention(80, 80, 'specialist')).toBe(false)
      expect(requiresAttention(95, 90, 'specialist')).toBe(false)
    })
  })

  describe('getRecommendedAction', () => {
    it('should return appropriate action for each decision type', () => {
      const rejectAction = getRecommendedAction('REJECT')
      expect(rejectAction).toContain('Critical')
      expect(rejectAction).toContain('cannot be used')

      const retryAction = getRecommendedAction('RETRY')
      expect(retryAction).toContain('revision')

      const acceptAction = getRecommendedAction('ACCEPT')
      expect(acceptAction).toContain('approved')

      const exemplaryAction = getRecommendedAction('EXEMPLARY')
      expect(exemplaryAction).toContain('Exceptional')
    })
  })

  describe('validateScore', () => {
    it('should validate scores in range 0-100', () => {
      expect(validateScore(0)).toBe(true)
      expect(validateScore(50)).toBe(true)
      expect(validateScore(100)).toBe(true)
    })

    it('should reject scores outside range', () => {
      expect(validateScore(-10)).toBe(false)
      expect(validateScore(150)).toBe(false)
      expect(validateScore(NaN)).toBe(false)
    })
  })

  describe('clampScore', () => {
    it('should clamp scores to valid range', () => {
      expect(clampScore(-10)).toBe(0)
      expect(clampScore(150)).toBe(100)
      expect(clampScore(50)).toBe(50)
    })

    it('should handle edge cases', () => {
      expect(clampScore(0)).toBe(0)
      expect(clampScore(100)).toBe(100)
    })
  })

  describe('CONSISTENCY_THRESHOLDS', () => {
    it('should have consistency thresholds defined', () => {
      expect(CONSISTENCY_THRESHOLDS.minimum).toBeDefined()
      expect(CONSISTENCY_THRESHOLDS.acceptable).toBeDefined()
      expect(CONSISTENCY_THRESHOLDS.good).toBeDefined()
    })

    it('should have thresholds in ascending order', () => {
      expect(CONSISTENCY_THRESHOLDS.minimum).toBeLessThan(CONSISTENCY_THRESHOLDS.acceptable)
      expect(CONSISTENCY_THRESHOLDS.acceptable).toBeLessThan(CONSISTENCY_THRESHOLDS.good)
    })
  })
})
