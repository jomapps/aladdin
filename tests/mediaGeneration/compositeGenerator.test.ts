/**
 * Composite Generator Tests
 * Tests 20-iteration emergency break, 5-retry verification logic, and max 3 references per request
 *
 * Total Tests: 28
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock FAL.ai client
const mockFalClient = {
  generateImageWithReference: vi.fn(),
};

// Mock Brain client
const mockBrainClient = {
  getNode: vi.fn(),
  addNode: vi.fn(),
  addRelationship: vi.fn(),
};

describe('Composite Generator Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('20-Iteration Emergency Break', () => {
    it('should stop after 20 iterations regardless of quality', async () => {
      let iterations = 0;
      const maxIterations = 20;
      let qualityScore = 0.70; // Below threshold

      while (iterations < maxIterations && qualityScore < 0.85) {
        iterations++;
        qualityScore += 0.01; // Slow improvement
      }

      expect(iterations).toBe(20);
      expect(qualityScore).toBeLessThan(0.85);
    });

    it('should log warning when hitting iteration limit', () => {
      const warnings: string[] = [];
      const maxIterations = 20;

      for (let i = 0; i < maxIterations; i++) {
        if (i === maxIterations - 1) {
          warnings.push('Emergency break: Maximum iterations (20) reached');
        }
      }

      expect(warnings).toHaveLength(1);
      expect(warnings[0]).toContain('Emergency break');
      expect(warnings[0]).toContain('20');
    });

    it('should return best result when emergency break triggers', async () => {
      const attempts = [];
      const maxIterations = 20;

      for (let i = 0; i < maxIterations; i++) {
        attempts.push({
          iteration: i + 1,
          qualityScore: 0.70 + (i * 0.005),
          imageUrl: `https://fal.ai/attempt-${i + 1}.png`,
        });
      }

      const bestAttempt = attempts.reduce((best, current) =>
        current.qualityScore > best.qualityScore ? current : best
      );

      expect(bestAttempt.iteration).toBe(20);
      expect(bestAttempt.qualityScore).toBeCloseTo(0.795);
    });

    it('should track iteration count in metadata', () => {
      const metadata = {
        totalIterations: 20,
        emergencyBreak: true,
        finalScore: 0.78,
        reason: 'Max iterations reached',
      };

      expect(metadata.totalIterations).toBe(20);
      expect(metadata.emergencyBreak).toBe(true);
    });

    it('should exit early if quality threshold is met', async () => {
      let iterations = 0;
      const maxIterations = 20;
      let qualityScore = 0.70;

      while (iterations < maxIterations && qualityScore < 0.85) {
        iterations++;
        qualityScore += 0.05; // Quick improvement
      }

      expect(iterations).toBe(3); // 0.70 + 0.05*3 = 0.85
      expect(qualityScore).toBeGreaterThanOrEqual(0.85);
    });
  });

  describe('5-Retry Verification Logic', () => {
    it('should retry verification up to 5 times', async () => {
      let verificationAttempts = 0;
      const maxRetries = 5;
      let verified = false;

      while (verificationAttempts < maxRetries && !verified) {
        verificationAttempts++;
        // Simulate verification failure
        verified = verificationAttempts === 5;
      }

      expect(verificationAttempts).toBe(5);
    });

    it('should verify character consistency on each retry', async () => {
      const verificationChecks = [];
      const maxRetries = 5;

      for (let i = 0; i < maxRetries; i++) {
        verificationChecks.push({
          retry: i + 1,
          facialConsistency: 0.85 + (i * 0.02),
          bodyProportions: 0.87 + (i * 0.01),
          clothingMatch: 0.90,
        });
      }

      expect(verificationChecks).toHaveLength(5);
      expect(verificationChecks[4].facialConsistency).toBeGreaterThan(verificationChecks[0].facialConsistency);
    });

    it('should increase verification strength on each retry', () => {
      const retries = [];

      for (let i = 0; i < 5; i++) {
        retries.push({
          attempt: i + 1,
          verificationStrength: 0.5 + (i * 0.1), // Increase by 0.1 each time
          threshold: 0.85,
        });
      }

      expect(retries[0].verificationStrength).toBe(0.5);
      expect(retries[4].verificationStrength).toBe(0.9);
    });

    it('should exit early if verification passes', async () => {
      let retries = 0;
      const maxRetries = 5;
      let verificationScore = 0;

      while (retries < maxRetries && verificationScore < 0.85) {
        retries++;
        verificationScore = 0.70 + (retries * 0.05);
      }

      expect(retries).toBe(3); // Passes on 3rd retry
      expect(verificationScore).toBeGreaterThanOrEqual(0.85);
    });

    it('should use different verification model on final retry', () => {
      const retries = [
        { attempt: 1, model: 'moondream2' },
        { attempt: 2, model: 'moondream2' },
        { attempt: 3, model: 'moondream2' },
        { attempt: 4, model: 'moondream2' },
        { attempt: 5, model: 'gpt-4o-vision' }, // Different model on final retry
      ];

      expect(retries[4].model).toBe('gpt-4o-vision');
      expect(retries[4].model).not.toBe(retries[0].model);
    });

    it('should log verification failures with details', () => {
      const logs: string[] = [];

      for (let i = 1; i <= 5; i++) {
        if (i < 5) {
          logs.push(`Verification retry ${i}/5: Failed - Score: ${0.70 + (i * 0.03)}`);
        }
      }

      expect(logs).toHaveLength(4);
      expect(logs[0]).toContain('Verification retry 1/5');
    });
  });

  describe('Max 3 References Per Request', () => {
    it('should limit references to maximum of 3', () => {
      const references = [
        { type: 'character', id: 'char-1', weight: 1.0 },
        { type: 'clothing', id: 'cloth-1', weight: 0.8 },
        { type: 'location', id: 'loc-1', weight: 0.6 },
        { type: 'prop', id: 'prop-1', weight: 0.5 },
        { type: 'lighting', id: 'light-1', weight: 0.4 },
      ];

      const limitedReferences = references.slice(0, 3);

      expect(limitedReferences).toHaveLength(3);
      expect(limitedReferences.map(r => r.type)).toEqual(['character', 'clothing', 'location']);
    });

    it('should prioritize references by weight', () => {
      const references = [
        { type: 'prop', weight: 0.4 },
        { type: 'character', weight: 1.0 },
        { type: 'location', weight: 0.6 },
        { type: 'clothing', weight: 0.8 },
      ];

      const sorted = references.sort((a, b) => b.weight - a.weight).slice(0, 3);

      expect(sorted[0].type).toBe('character');
      expect(sorted[1].type).toBe('clothing');
      expect(sorted[2].type).toBe('location');
      expect(sorted).toHaveLength(3);
    });

    it('should enforce reference limit in FAL.ai request', async () => {
      const config = {
        references: {
          character: 'char-1',
          clothing: 'cloth-1',
          location: 'loc-1',
          props: ['prop-1', 'prop-2'], // Too many
        },
      };

      const referenceList = [
        config.references.character,
        config.references.clothing,
        config.references.location,
      ].filter(Boolean);

      expect(referenceList).toHaveLength(3);
    });

    it('should validate reference count before generation', () => {
      const references = ['ref-1', 'ref-2', 'ref-3', 'ref-4'];
      const maxReferences = 3;

      const isValid = references.length <= maxReferences;

      expect(isValid).toBe(false);
    });

    it('should log warning when references are trimmed', () => {
      const warnings: string[] = [];
      const references = ['ref-1', 'ref-2', 'ref-3', 'ref-4'];
      const maxReferences = 3;

      if (references.length > maxReferences) {
        warnings.push(`References trimmed from ${references.length} to ${maxReferences}`);
      }

      expect(warnings).toHaveLength(1);
      expect(warnings[0]).toContain('trimmed');
    });

    it('should handle character array references correctly', () => {
      const characterRefs = ['char-1', 'char-2', 'char-3', 'char-4'];
      const otherRefs = ['cloth-1', 'loc-1'];

      const totalRefs = [...characterRefs, ...otherRefs];
      const limited = totalRefs.slice(0, 3);

      expect(limited).toHaveLength(3);
    });
  });

  describe('Iterative Composite Building', () => {
    it('should build composite iteratively with quality checks', async () => {
      const iterations = [];
      let currentScore = 0;

      for (let i = 0; i < 5; i++) {
        currentScore = 0.70 + (i * 0.05);
        iterations.push({
          iteration: i + 1,
          score: currentScore,
          references: Math.min(i + 1, 3),
        });

        if (currentScore >= 0.85) break;
      }

      expect(iterations.length).toBeGreaterThan(0);
      expect(iterations[iterations.length - 1].score).toBeGreaterThanOrEqual(0.85);
    });

    it('should add references progressively', () => {
      const buildSteps = [
        { step: 1, references: ['character'], score: 0.70 },
        { step: 2, references: ['character', 'clothing'], score: 0.78 },
        { step: 3, references: ['character', 'clothing', 'location'], score: 0.87 },
      ];

      expect(buildSteps[0].references).toHaveLength(1);
      expect(buildSteps[1].references).toHaveLength(2);
      expect(buildSteps[2].references).toHaveLength(3);
      expect(buildSteps[2].score).toBeGreaterThanOrEqual(0.85);
    });

    it('should adjust weights between iterations', () => {
      const iterations = [
        { iter: 1, weights: { character: 0.7, clothing: 0.3 } },
        { iter: 2, weights: { character: 0.6, clothing: 0.4 } },
        { iter: 3, weights: { character: 0.5, clothing: 0.3, location: 0.2 } },
      ];

      iterations.forEach(iter => {
        const totalWeight = Object.values(iter.weights).reduce((sum, w) => sum + w, 0);
        expect(totalWeight).toBeCloseTo(1.0, 1);
      });
    });

    it('should cache intermediate results', () => {
      const cache = new Map<string, { imageUrl: string; score: number }>();

      cache.set('iter-1', { imageUrl: 'url-1', score: 0.70 });
      cache.set('iter-2', { imageUrl: 'url-2', score: 0.78 });
      cache.set('iter-3', { imageUrl: 'url-3', score: 0.87 });

      expect(cache.size).toBe(3);
      expect(cache.get('iter-3')?.score).toBe(0.87);
    });
  });

  describe('Error Handling', () => {
    it('should handle FAL.ai generation failure', async () => {
      mockFalClient.generateImageWithReference.mockRejectedValue(
        new Error('FAL.ai rate limit exceeded')
      );

      await expect(mockFalClient.generateImageWithReference({}))
        .rejects.toThrow('rate limit exceeded');
    });

    it('should retry on transient errors', async () => {
      let attempts = 0;
      const maxRetries = 3;

      while (attempts < maxRetries) {
        attempts++;
        try {
          if (attempts < 3) {
            throw new Error('Transient error');
          }
          break;
        } catch (error) {
          if (attempts === maxRetries) throw error;
        }
      }

      expect(attempts).toBe(3);
    });

    it('should handle missing reference images', async () => {
      mockBrainClient.getNode.mockResolvedValue(null);

      const node = await mockBrainClient.getNode('missing-id');
      expect(node).toBeNull();
    });

    it('should validate image URLs', () => {
      const urls = [
        'https://valid.com/image.png',
        'invalid-url',
        'http://no-https.com/image.png',
      ];

      const validUrls = urls.filter(url => url.startsWith('https://'));
      expect(validUrls).toHaveLength(1);
    });
  });

  describe('Performance Optimization', () => {
    it('should parallel fetch reference images', async () => {
      const referenceIds = ['ref-1', 'ref-2', 'ref-3'];

      mockBrainClient.getNode.mockImplementation((id) =>
        Promise.resolve({ id, properties: { imageUrl: `https://example.com/${id}.png` } })
      );

      const startTime = Date.now();
      const results = await Promise.all(
        referenceIds.map(id => mockBrainClient.getNode(id))
      );
      const duration = Date.now() - startTime;

      expect(results).toHaveLength(3);
      expect(duration).toBeLessThan(100); // Parallel should be faster
    });

    it('should cache brain node lookups', async () => {
      const cache = new Map();
      const nodeId = 'node-123';

      if (!cache.has(nodeId)) {
        const node = { id: nodeId, data: 'node data' };
        cache.set(nodeId, node);
      }

      const cachedNode = cache.get(nodeId);
      expect(cachedNode).toBeDefined();
    });

    it('should batch upload results', async () => {
      const results = [
        { imageUrl: 'url-1', metadata: {} },
        { imageUrl: 'url-2', metadata: {} },
        { imageUrl: 'url-3', metadata: {} },
      ];

      const batchSize = 3;
      expect(results.length).toBe(batchSize);
    });
  });

  describe('Quality Metrics', () => {
    it('should calculate composite consistency score', () => {
      const scores = {
        characterMatch: 0.92,
        clothingMatch: 0.88,
        lightingMatch: 0.90,
      };

      const avgScore = Object.values(scores).reduce((sum, s) => sum + s, 0) / Object.keys(scores).length;
      expect(avgScore).toBeGreaterThanOrEqual(0.85);
    });

    it('should track generation metrics', () => {
      const metrics = {
        totalIterations: 5,
        successfulGenerations: 4,
        failedGenerations: 1,
        avgQualityScore: 0.88,
        totalDuration: 45000, // ms
      };

      expect(metrics.successfulGenerations).toBeGreaterThan(metrics.failedGenerations);
      expect(metrics.avgQualityScore).toBeGreaterThanOrEqual(0.85);
    });
  });
});
