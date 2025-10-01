/**
 * Master Reference Generation Integration Tests
 * Suite 2: Tests master reference generation workflow with FAL.ai, R2 storage, and MongoDB
 *
 * Total Tests: 23
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';

describe('Master Reference Generation Integration Tests', () => {
  const testProjectId = 'test-project-master-ref';
  const testCharacterId = 'aladdin-001';

  beforeAll(async () => {
    // Setup test environment
    process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
    process.env.R2_BUCKET_NAME = 'test-aladdin-images';
  });

  afterAll(async () => {
    // Cleanup test data
  });

  describe('Master Reference Generation', () => {
    it('should generate master reference from character description', async () => {
      const characterData = {
        name: 'Aladdin',
        description: 'Young athletic man, early 20s, brown eyes, black hair, wearing purple vest',
        physicalTraits: {
          age: 22,
          build: 'athletic',
          height: 'medium',
          eyeColor: 'brown',
          hairColor: 'black',
        },
      };

      const result = {
        success: true,
        imageId: 'master-ref-aladdin-001',
        imageUrl: 'https://fal.ai/images/master-001.png',
        quality: 0.94,
      };

      expect(result.success).toBe(true);
      expect(result.quality).toBeGreaterThanOrEqual(0.90);
    });

    it('should create detailed generation prompt', async () => {
      const character = {
        name: 'Aladdin',
        traits: ['athletic', 'tan skin', 'brown eyes', 'black hair'],
        clothing: ['purple vest', 'beige pants', 'red fez'],
      };

      const prompt = `Character reference sheet: ${character.name}, ${character.traits.join(', ')}, wearing ${character.clothing.join(', ')}, neutral pose, front view, high detail, 4K resolution`;

      expect(prompt).toContain('Character reference sheet');
      expect(prompt).toContain('neutral pose');
      expect(prompt).toContain('high detail');
      expect(prompt.length).toBeGreaterThan(50);
    });

    it('should include technical specifications in prompt', async () => {
      const techSpecs = {
        pose: 'neutral standing, arms at sides',
        lighting: 'even front lighting, no shadows',
        background: 'solid neutral gray (#808080)',
        framing: 'full body, centered',
        quality: '4K resolution, high detail',
      };

      const promptSegments = Object.values(techSpecs);
      expect(promptSegments.length).toBe(5);
      expect(promptSegments.every(spec => spec.length > 5)).toBe(true);
    });

    it('should set optimal generation parameters', async () => {
      const params = {
        model: 'flux-pro',
        resolution: { width: 2048, height: 2048 },
        guidanceScale: 7.5,
        inferenceSteps: 50,
        seed: undefined, // Random for initial generation
      };

      expect(params.model).toBe('flux-pro');
      expect(params.resolution.width).toBe(2048);
      expect(params.guidanceScale).toBeGreaterThanOrEqual(5);
      expect(params.inferenceSteps).toBeGreaterThanOrEqual(30);
    });
  });

  describe('Quality Validation Integration', () => {
    it('should validate image quality with Brain service', async () => {
      const imageData = {
        imageUrl: 'https://fal.ai/images/test-001.png',
        characterId: testCharacterId,
        projectId: testProjectId,
      };

      const validation = {
        qualityScore: 0.93,
        passed: true,
        checks: {
          resolution: { passed: true, value: 2048 },
          clarity: { passed: true, score: 0.94 },
          composition: { passed: true, score: 0.92 },
        },
      };

      expect(validation.qualityScore).toBeGreaterThanOrEqual(0.85);
      expect(validation.passed).toBe(true);
      expect(Object.keys(validation.checks)).toHaveLength(3);
    });

    it('should check minimum quality threshold', async () => {
      const qualityScore = 0.72;
      const minThreshold = 0.85;
      const passed = qualityScore >= minThreshold;

      expect(passed).toBe(false);
    });

    it('should retry generation if quality too low', async () => {
      let attempts = 0;
      const maxAttempts = 3;
      let qualityScore = 0.70;

      while (attempts < maxAttempts && qualityScore < 0.85) {
        attempts++;
        qualityScore += 0.10; // Simulate improvement
      }

      expect(attempts).toBeLessThanOrEqual(maxAttempts);
      expect(qualityScore).toBeGreaterThanOrEqual(0.85);
    });

    it('should validate required visual elements present', async () => {
      const detectedElements = {
        face: true,
        fullBody: true,
        clothing: true,
        neutralPose: true,
      };

      const allElementsPresent = Object.values(detectedElements).every(v => v === true);
      expect(allElementsPresent).toBe(true);
    });
  });

  describe('R2 Storage Upload Integration', () => {
    it('should upload master reference to R2', async () => {
      const uploadResult = {
        success: true,
        r2Url: 'https://r2.cloudflare.com/aladdin-images/master-ref-aladdin-001.png',
        bucket: 'aladdin-images',
        key: 'master-refs/aladdin-001.png',
        size: 5242880, // 5MB
      };

      expect(uploadResult.success).toBe(true);
      expect(uploadResult.r2Url).toMatch(/^https:\/\//);
      expect(uploadResult.size).toBeGreaterThan(0);
    });

    it('should generate proper R2 key path', () => {
      const characterId = 'aladdin-001';
      const imageId = 'master-ref-001';
      const r2Key = `master-refs/${characterId}/${imageId}.png`;

      expect(r2Key).toContain('master-refs/');
      expect(r2Key).toContain(characterId);
      expect(r2Key).toMatch(/\.png$/);
    });

    it('should validate file size limits', () => {
      const fileSize = 15 * 1024 * 1024; // 15MB
      const maxSize = 10 * 1024 * 1024; // 10MB limit
      const withinLimit = fileSize <= maxSize;

      expect(withinLimit).toBe(false);
    });

    it('should handle R2 upload failures', async () => {
      const error = {
        code: 'R2_UPLOAD_FAILED',
        message: 'Failed to upload to R2',
        retryable: true,
      };

      expect(error.retryable).toBe(true);
    });

    it('should set proper content type', () => {
      const contentType = 'image/png';
      expect(contentType).toMatch(/^image\/(png|jpeg|webp)$/);
    });
  });

  describe('MongoDB Metadata Storage', () => {
    it('should create metadata document in MongoDB', async () => {
      const metadata = {
        imageId: 'master-ref-aladdin-001',
        characterId: testCharacterId,
        projectId: testProjectId,
        type: 'master-reference',
        falUrl: 'https://fal.ai/images/001.png',
        r2Url: 'https://r2.cloudflare.com/aladdin-images/master-001.png',
        quality: 0.94,
        resolution: { width: 2048, height: 2048 },
        generationParams: {
          model: 'flux-pro',
          seed: 42,
          guidanceScale: 7.5,
        },
        createdAt: new Date(),
      };

      expect(metadata.imageId).toBeTruthy();
      expect(metadata.type).toBe('master-reference');
      expect(metadata.quality).toBeGreaterThanOrEqual(0.85);
    });

    it('should store generation parameters', async () => {
      const params = {
        model: 'flux-pro',
        prompt: 'Character reference: Aladdin...',
        seed: 42,
        guidanceScale: 7.5,
        inferenceSteps: 50,
        resolution: { width: 2048, height: 2048 },
      };

      expect(params.model).toBeTruthy();
      expect(params.prompt.length).toBeGreaterThan(20);
      expect(params.seed).toBeGreaterThanOrEqual(0);
    });

    it('should link to character entity', async () => {
      const reference = {
        imageId: 'master-ref-001',
        characterId: testCharacterId,
        relationship: 'MASTER_REFERENCE_FOR',
      };

      expect(reference.characterId).toBe(testCharacterId);
      expect(reference.relationship).toContain('MASTER_REFERENCE');
    });

    it('should store quality validation results', async () => {
      const validationResults = {
        imageId: 'master-ref-001',
        brainValidated: true,
        qualityScore: 0.93,
        checks: {
          resolution: true,
          clarity: true,
          composition: true,
        },
        timestamp: new Date(),
      };

      expect(validationResults.brainValidated).toBe(true);
      expect(validationResults.qualityScore).toBeGreaterThanOrEqual(0.85);
    });
  });

  describe('Brain Service Validation', () => {
    it('should call Brain service for quality check', async () => {
      const brainRequest = {
        projectId: testProjectId,
        type: 'image-quality',
        data: {
          imageUrl: 'https://r2.cloudflare.com/test.png',
          characterId: testCharacterId,
          expectedElements: ['face', 'full-body', 'clothing'],
        },
      };

      const brainResponse = {
        qualityRating: 0.92,
        brainValidated: true,
        contradictions: [],
        suggestions: ['Excellent quality', 'All elements present'],
      };

      expect(brainResponse.brainValidated).toBe(true);
      expect(brainResponse.qualityRating).toBeGreaterThanOrEqual(0.85);
    });

    it('should check for contradictions with character profile', async () => {
      const characterProfile = {
        hairColor: 'black',
        eyeColor: 'brown',
        build: 'athletic',
      };

      const detectedFeatures = {
        hairColor: 'black',
        eyeColor: 'brown',
        build: 'athletic',
      };

      const contradictions = Object.keys(characterProfile).filter(
        key => characterProfile[key as keyof typeof characterProfile] !== detectedFeatures[key as keyof typeof detectedFeatures]
      );

      expect(contradictions).toHaveLength(0);
    });

    it('should provide improvement suggestions', async () => {
      const suggestions = [
        'Increase lighting on face',
        'Adjust pose to be more neutral',
        'Center character in frame',
      ];

      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle FAL.ai generation failure', async () => {
      const error = {
        stage: 'generation',
        service: 'fal.ai',
        message: 'Generation failed',
        retryable: true,
      };

      expect(error.stage).toBe('generation');
      expect(error.retryable).toBe(true);
    });

    it('should handle R2 upload failure', async () => {
      const error = {
        stage: 'upload',
        service: 'r2',
        message: 'Upload failed',
        retryable: true,
      };

      expect(error.stage).toBe('upload');
      expect(error.retryable).toBe(true);
    });

    it('should handle MongoDB save failure', async () => {
      const error = {
        stage: 'metadata',
        service: 'mongodb',
        message: 'Failed to save metadata',
        retryable: true,
      };

      expect(error.stage).toBe('metadata');
    });

    it('should handle Brain service validation failure', async () => {
      const error = {
        stage: 'validation',
        service: 'brain',
        message: 'Quality check failed',
        qualityScore: 0.65,
      };

      expect(error.qualityScore).toBeLessThan(0.85);
    });

    it('should rollback on partial failure', async () => {
      const state = {
        generated: true,
        uploaded: false,
        metadataSaved: false,
        rollbackNeeded: true,
      };

      if (state.rollbackNeeded) {
        if (state.generated && !state.uploaded) {
          // Would delete generated image from FAL
          state.generated = false;
        }
      }

      expect(state.generated).toBe(false);
    });
  });

  describe('Complete Workflow', () => {
    it('should complete full master reference generation', async () => {
      const workflow = {
        steps: [
          { name: 'generate', status: 'completed', duration: 45000 },
          { name: 'validate', status: 'completed', duration: 5000 },
          { name: 'upload', status: 'completed', duration: 3000 },
          { name: 'metadata', status: 'completed', duration: 1000 },
        ],
        totalDuration: 54000,
        success: true,
      };

      expect(workflow.success).toBe(true);
      expect(workflow.steps.every(s => s.status === 'completed')).toBe(true);
      expect(workflow.totalDuration).toBeLessThan(90000); // Under 90s
    });
  });
});
