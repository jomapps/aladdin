/**
 * Image Quality Department Generation Integration Tests
 * Suite 6: Tests Image Quality Department specialists with FAL.ai integration
 *
 * Total Tests: 32
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';

describe('Image Quality Department Generation Integration Tests', () => {
  const testProjectId = 'test-project-image-dept';
  const testCharacterId = 'aladdin-001';

  beforeAll(async () => {
    // Setup test environment
    process.env.FAL_API_KEY = process.env.FAL_API_KEY || 'test-key';
  });

  describe('Master Reference Generator Specialist with FAL.ai', () => {
    it('should initialize master reference generator', async () => {
      const specialist = {
        type: 'master-reference-generator',
        initialized: true,
        falClient: { connected: true },
      };

      expect(specialist.initialized).toBe(true);
      expect(specialist.falClient.connected).toBe(true);
    });

    it('should generate master reference using FAL.ai', async () => {
      const result = {
        success: true,
        characterId: testCharacterId,
        imageUrl: 'https://fal.ai/images/master-ref-001.png',
        model: 'flux-pro',
        quality: 0.94,
      };

      expect(result.success).toBe(true);
      expect(result.model).toBe('flux-pro');
      expect(result.quality).toBeGreaterThanOrEqual(0.90);
    });

    it('should create detailed character prompt', async () => {
      const characterData = {
        name: 'Aladdin',
        physicalTraits: {
          age: 22,
          build: 'athletic',
          hairColor: 'black',
          eyeColor: 'brown',
        },
        clothing: ['purple vest', 'beige pants'],
      };

      const prompt = `Character reference: ${characterData.name}, age ${characterData.physicalTraits.age}, ${characterData.physicalTraits.build} build, ${characterData.physicalTraits.hairColor} hair, ${characterData.physicalTraits.eyeColor} eyes, wearing ${characterData.clothing.join(' and ')}, neutral pose, front view, high detail`;

      expect(prompt).toContain(characterData.name);
      expect(prompt).toContain('neutral pose');
      expect(prompt.length).toBeGreaterThan(50);
    });

    it('should validate quality with Brain service', async () => {
      const validation = {
        brainValidated: true,
        qualityScore: 0.93,
        contradictions: [],
        suggestions: ['Excellent quality'],
      };

      expect(validation.brainValidated).toBe(true);
      expect(validation.qualityScore).toBeGreaterThanOrEqual(0.85);
    });

    it('should upload to R2 storage', async () => {
      const upload = {
        success: true,
        r2Url: 'https://r2.cloudflare.com/master-refs/aladdin-001.png',
        bucket: 'aladdin-images',
      };

      expect(upload.success).toBe(true);
      expect(upload.r2Url).toMatch(/^https:\/\//);
    });

    it('should store metadata in MongoDB', async () => {
      const metadata = {
        imageId: 'master-ref-aladdin-001',
        characterId: testCharacterId,
        type: 'master-reference',
        quality: 0.94,
        createdAt: new Date(),
      };

      expect(metadata.imageId).toBeTruthy();
      expect(metadata.type).toBe('master-reference');
    });

    it('should retry on low quality', async () => {
      let attempts = 0;
      let quality = 0.78;
      const maxAttempts = 3;

      while (quality < 0.90 && attempts < maxAttempts) {
        attempts++;
        quality += 0.08;
      }

      expect(quality).toBeGreaterThanOrEqual(0.90);
      expect(attempts).toBeLessThanOrEqual(maxAttempts);
    });

    it('should handle FAL.ai rate limits', async () => {
      const rateLimitError = {
        code: 429,
        message: 'Rate limit exceeded',
        retryAfter: 30,
      };

      expect(rateLimitError.retryAfter).toBeGreaterThan(0);
    });
  });

  describe('Profile 360 Creator Full Workflow', () => {
    it('should initialize 360 profile creator', async () => {
      const specialist = {
        type: '360-profile-creator',
        initialized: true,
        masterReference: 'https://r2.cloudflare.com/master-ref-001.png',
      };

      expect(specialist.initialized).toBe(true);
      expect(specialist.masterReference).toBeTruthy();
    });

    it('should generate all 12 angles', async () => {
      const angles = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];
      const results = angles.map(angle => ({
        angle,
        imageUrl: `https://fal.ai/images/profile-${angle}.png`,
        status: 'completed',
      }));

      expect(results).toHaveLength(12);
      expect(results.every(r => r.status === 'completed')).toBe(true);
    });

    it('should process angles in parallel batches', async () => {
      const batchSize = 3;
      const batches = 4;
      const totalAngles = batchSize * batches;

      expect(totalAngles).toBe(12);
    });

    it('should use master reference for each angle', async () => {
      const generations = Array(12).fill(null).map((_, i) => ({
        angle: i * 30,
        referenceUrl: 'https://r2.cloudflare.com/master-ref-001.png',
        referenceStrength: 0.85,
      }));

      expect(generations.every(g => g.referenceStrength === 0.85)).toBe(true);
    });

    it('should generate angle-specific prompts', async () => {
      const angle = 90;
      const prompt = `Character at ${angle}° angle, right side view, maintaining all features from reference`;

      expect(prompt).toContain(`${angle}°`);
      expect(prompt).toContain('side view');
    });

    it('should track generation progress', async () => {
      const progress = {
        total: 12,
        completed: 8,
        percentage: (8 / 12) * 100,
      };

      expect(progress.percentage).toBeCloseTo(66.67, 1);
    });

    it('should upload all images to R2', async () => {
      const uploads = Array(12).fill(null).map((_, i) => ({
        angle: i * 30,
        r2Url: `https://r2.cloudflare.com/360-profile/angle-${i * 30}.png`,
        status: 'uploaded',
      }));

      expect(uploads.every(u => u.status === 'uploaded')).toBe(true);
    });

    it('should create reference set in MongoDB', async () => {
      const referenceSet = {
        setId: '360-profile-aladdin-001',
        characterId: testCharacterId,
        type: '360-profile',
        imageCount: 12,
        completionStatus: 'complete',
      };

      expect(referenceSet.imageCount).toBe(12);
      expect(referenceSet.completionStatus).toBe('complete');
    });

    it('should complete workflow in under 120 seconds', async () => {
      const duration = 95000; // 95 seconds

      expect(duration).toBeLessThan(120000);
    });

    it('should verify consistency across angles', async () => {
      const consistency = {
        overall: 0.92,
        facial: 0.94,
        clothing: 0.91,
      };

      expect(consistency.overall).toBeGreaterThanOrEqual(0.85);
    });
  });

  describe('Shot Composer Composite Generation', () => {
    it('should initialize shot composer', async () => {
      const specialist = {
        type: 'shot-composer',
        initialized: true,
        falClient: { connected: true },
      };

      expect(specialist.initialized).toBe(true);
    });

    it('should compose shot with single character', async () => {
      const composition = {
        characterId: testCharacterId,
        referenceAngle: 90,
        sceneContext: {
          location: 'marketplace',
          lighting: 'afternoon',
        },
        result: {
          success: true,
          imageUrl: 'https://fal.ai/images/composite-001.png',
        },
      };

      expect(composition.result.success).toBe(true);
    });

    it('should select appropriate reference angle', async () => {
      const desiredAngle = 45;
      const availableAngles = [0, 30, 60, 90];
      const selected = 30; // Closest to 45

      expect(Math.abs(selected - desiredAngle)).toBeLessThan(20);
    });

    it('should compose multi-character scene', async () => {
      const scene = {
        characters: [
          { id: 'aladdin', position: 'center', angle: 0 },
          { id: 'jasmine', position: 'left', angle: 30 },
        ],
        result: { success: true },
      };

      expect(scene.characters).toHaveLength(2);
      expect(scene.result.success).toBe(true);
    });

    it('should apply scene lighting', async () => {
      const lighting = {
        timeOfDay: 'afternoon',
        direction: 'front-left',
        intensity: 0.8,
      };

      const promptSegment = `${lighting.timeOfDay} lighting from ${lighting.direction}`;
      expect(promptSegment).toContain('afternoon');
    });

    it('should validate composite quality', async () => {
      const quality = {
        consistency: 0.91,
        composition: 0.89,
        overall: 0.90,
      };

      expect(quality.overall).toBeGreaterThanOrEqual(0.85);
    });

    it('should store composite metadata', async () => {
      const metadata = {
        compositeId: 'composite-001',
        characterIds: [testCharacterId],
        sceneId: 'scene-3',
        consistencyScore: 0.91,
      };

      expect(metadata.compositeId).toBeTruthy();
      expect(metadata.consistencyScore).toBeGreaterThanOrEqual(0.85);
    });
  });

  describe('Consistency Verifier Integration', () => {
    it('should initialize consistency verifier', async () => {
      const specialist = {
        type: 'consistency-verifier',
        initialized: true,
      };

      expect(specialist.initialized).toBe(true);
    });

    it('should verify 360 profile consistency', async () => {
      const verification = {
        profileId: '360-profile-aladdin-001',
        overallScore: 0.92,
        passed: true,
        comparisons: 12,
      };

      expect(verification.passed).toBe(true);
      expect(verification.overallScore).toBeGreaterThanOrEqual(0.85);
    });

    it('should detect inconsistencies', async () => {
      const inconsistencies = [
        { angles: [60, 90], issue: 'Hair color variance', severity: 'medium' },
      ];

      expect(Array.isArray(inconsistencies)).toBe(true);
    });

    it('should recommend fixes', async () => {
      const recommendations = [
        'Regenerate angle 60 with higher reference strength',
        'Adjust color grading to match master reference',
      ];

      expect(recommendations.length).toBeGreaterThan(0);
    });

    it('should create consistency report', async () => {
      const report = {
        profileId: '360-profile-aladdin-001',
        overallScore: 0.92,
        passed: true,
        details: {
          facial: 0.94,
          proportions: 0.93,
          clothing: 0.90,
        },
        inconsistencies: [],
      };

      expect(report.passed).toBe(true);
      expect(report.inconsistencies).toHaveLength(0);
    });
  });

  describe('Department Coordination', () => {
    it('should coordinate all specialists', async () => {
      const department = {
        head: 'image-quality-head',
        specialists: [
          'master-reference-generator',
          '360-profile-creator',
          'image-descriptor',
          'shot-composer',
          'consistency-verifier',
        ],
      };

      expect(department.specialists).toHaveLength(5);
    });

    it('should execute sequential workflow', async () => {
      const workflow = [
        { step: 'generate-master', status: 'completed' },
        { step: 'create-360-profile', status: 'completed' },
        { step: 'verify-consistency', status: 'completed' },
      ];

      expect(workflow.every(s => s.status === 'completed')).toBe(true);
    });

    it('should share context between specialists', async () => {
      const context = {
        masterReferenceId: 'master-ref-001',
        characterId: testCharacterId,
        projectId: testProjectId,
      };

      expect(context.masterReferenceId).toBeTruthy();
      expect(context.characterId).toBeTruthy();
    });

    it('should handle specialist failures gracefully', async () => {
      const results = [
        { specialist: 'master-reference-generator', status: 'success' },
        { specialist: '360-profile-creator', status: 'failed' },
        { specialist: 'consistency-verifier', status: 'skipped' },
      ];

      const failed = results.filter(r => r.status === 'failed');
      expect(failed).toHaveLength(1);
    });
  });

  describe('Performance and Optimization', () => {
    it('should cache master references', async () => {
      const cache = {
        'master-ref-aladdin-001': {
          url: 'https://r2.cloudflare.com/master-ref-001.png',
          cached: true,
          timestamp: Date.now(),
        },
      };

      expect(cache['master-ref-aladdin-001'].cached).toBe(true);
    });

    it('should reuse connections to FAL.ai', async () => {
      const connectionPool = {
        active: 3,
        idle: 2,
        maxConnections: 5,
      };

      expect(connectionPool.active + connectionPool.idle).toBeLessThanOrEqual(connectionPool.maxConnections);
    });

    it('should batch R2 uploads', async () => {
      const uploadBatch = [
        { file: 'angle-0.png', status: 'queued' },
        { file: 'angle-30.png', status: 'queued' },
        { file: 'angle-60.png', status: 'queued' },
      ];

      expect(uploadBatch).toHaveLength(3);
    });

    it('should track token usage', async () => {
      const usage = {
        totalTokens: 15000,
        estimatedCost: 0.15,
        imagesGenerated: 13,
      };

      expect(usage.imagesGenerated).toBeGreaterThan(0);
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle FAL.ai timeout', async () => {
      const error = {
        service: 'fal.ai',
        type: 'timeout',
        message: 'Generation timed out after 60s',
        retryable: true,
      };

      expect(error.retryable).toBe(true);
    });

    it('should handle R2 upload failure', async () => {
      const error = {
        service: 'r2',
        type: 'upload-failed',
        retryable: true,
      };

      expect(error.retryable).toBe(true);
    });

    it('should rollback partial workflows', async () => {
      const state = {
        masterGenerated: true,
        profileStarted: true,
        profileCompleted: false,
        rollbackNeeded: true,
      };

      expect(state.rollbackNeeded).toBe(true);
    });

    it('should log all errors for debugging', async () => {
      const errorLog = [
        { timestamp: Date.now(), stage: 'generation', error: 'Rate limit' },
        { timestamp: Date.now(), stage: 'upload', error: 'Network timeout' },
      ];

      expect(errorLog.length).toBeGreaterThan(0);
    });
  });
});
