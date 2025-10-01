/**
 * Weights Tests
 */

import { describe, it, expect } from 'vitest'
import {
  DEPARTMENT_WEIGHTS,
  BALANCED_WEIGHTS,
  getDepartmentWeights,
  validateWeights,
  calculateWeightedScore,
} from './weights'

describe('Quality Weights', () => {
  describe('DEPARTMENT_WEIGHTS', () => {
    it('should have weights for all departments', () => {
      const departments = ['story', 'character', 'visual', 'video', 'audio', 'production']

      for (const dept of departments) {
        expect(DEPARTMENT_WEIGHTS[dept]).toBeDefined()
      }
    })

    it('should have all weights sum to 1.0 for each department', () => {
      for (const [dept, weights] of Object.entries(DEPARTMENT_WEIGHTS)) {
        const sum = Object.values(weights).reduce((acc, val) => acc + val, 0)
        expect(sum).toBeCloseTo(1.0, 2) // Allow 0.01 tolerance
      }
    })

    it('should prioritize creativity for story department', () => {
      const weights = DEPARTMENT_WEIGHTS.story
      expect(weights.creativity).toBeGreaterThanOrEqual(0.20)
    })

    it('should prioritize consistency for character department', () => {
      const weights = DEPARTMENT_WEIGHTS.character
      expect(weights.consistency).toBeGreaterThanOrEqual(0.25)
    })

    it('should prioritize technical for audio department', () => {
      const weights = DEPARTMENT_WEIGHTS.audio
      expect(weights.technical).toBeGreaterThanOrEqual(0.35)
    })

    it('should prioritize technical for video department', () => {
      const weights = DEPARTMENT_WEIGHTS.video
      expect(weights.technical).toBeGreaterThanOrEqual(0.30)
    })
  })

  describe('getDepartmentWeights', () => {
    it('should return correct weights for known department', () => {
      const weights = getDepartmentWeights('story')
      expect(weights).toEqual(DEPARTMENT_WEIGHTS.story)
    })

    it('should return balanced weights for unknown department', () => {
      const weights = getDepartmentWeights('unknown-dept')
      expect(weights).toEqual(BALANCED_WEIGHTS)
    })

    it('should be case insensitive', () => {
      const weights = getDepartmentWeights('STORY')
      expect(weights).toEqual(DEPARTMENT_WEIGHTS.story)
    })
  })

  describe('validateWeights', () => {
    it('should validate correct weights', () => {
      expect(validateWeights(DEPARTMENT_WEIGHTS.story)).toBe(true)
      expect(validateWeights(BALANCED_WEIGHTS)).toBe(true)
    })

    it('should reject weights that do not sum to 1.0', () => {
      const badWeights = {
        confidence: 0.5,
        completeness: 0.2,
        relevance: 0.1,
        consistency: 0.1,
        creativity: 0.05,
        technical: 0.05,
        // Sum = 1.0 but let's modify
      }
      badWeights.confidence = 0.6 // Now sum = 1.1
      expect(validateWeights(badWeights)).toBe(false)
    })
  })

  describe('calculateWeightedScore', () => {
    it('should calculate weighted score correctly', () => {
      const dimensions = {
        confidence: 80,
        completeness: 90,
        relevance: 85,
        consistency: 88,
        creativity: 92,
        technical: 75,
      }

      const weights = DEPARTMENT_WEIGHTS.story
      const score = calculateWeightedScore(dimensions, weights)

      expect(score).toBeGreaterThan(0)
      expect(score).toBeLessThanOrEqual(100)

      // Manual calculation to verify
      const expected =
        80 * weights.confidence +
        90 * weights.completeness +
        85 * weights.relevance +
        88 * weights.consistency +
        92 * weights.creativity +
        75 * weights.technical

      expect(score).toBeCloseTo(expected, 1)
    })

    it('should handle missing dimensions gracefully', () => {
      const dimensions = {
        confidence: 80,
        completeness: 90,
        // Other dimensions missing
      }

      const weights = DEPARTMENT_WEIGHTS.story
      const score = calculateWeightedScore(dimensions, weights)

      expect(score).toBeGreaterThan(0)
      expect(score).toBeLessThanOrEqual(100)
    })

    it('should return 0 for empty dimensions', () => {
      const dimensions = {}
      const weights = DEPARTMENT_WEIGHTS.story
      const score = calculateWeightedScore(dimensions, weights)

      expect(score).toBe(0)
    })
  })

  describe('department-specific weight verification', () => {
    it('story department should emphasize creativity and consistency', () => {
      const weights = DEPARTMENT_WEIGHTS.story
      expect(weights.creativity).toBeGreaterThanOrEqual(weights.technical)
      expect(weights.consistency).toBeGreaterThanOrEqual(weights.confidence)
    })

    it('audio department should emphasize technical over creativity', () => {
      const weights = DEPARTMENT_WEIGHTS.audio
      expect(weights.technical).toBeGreaterThan(weights.creativity)
      expect(weights.technical).toBeGreaterThanOrEqual(0.35)
    })

    it('production department should emphasize completeness', () => {
      const weights = DEPARTMENT_WEIGHTS.production
      expect(weights.completeness).toBeGreaterThanOrEqual(0.25)
    })
  })
})
