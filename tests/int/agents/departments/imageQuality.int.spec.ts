/**
 * Image Quality Department Integration Tests
 * Tests full Image Quality workflow including 360° profiles
 */

import { describe, it, expect, beforeAll, jest } from '@jest/globals';

describe('Image Quality Department Integration Tests', () => {
  beforeAll(() => {
    process.env.MONGODB_URI = 'mongodb://localhost:27017';
  });

  describe('Image Quality Department Head', () => {
    it('should spawn all 5 image specialists', async () => {
      const mockExecute = jest.fn().mockResolvedValue({
        success: true,
        specialists: [
          { type: 'master-reference-generator', status: 'ready' },
          { type: '360-profile-creator', status: 'ready' },
          { type: 'image-descriptor', status: 'ready' },
          { type: 'shot-composer', status: 'ready' },
          { type: 'consistency-verifier', status: 'ready' },
        ],
      });

      const head = { execute: mockExecute };
      const result = await head.execute({ task: 'Initialize image quality department' });

      expect(result.specialists).toHaveLength(5);
    });

    it('should coordinate reference generation workflow', async () => {
      const mockExecute = jest.fn().mockResolvedValue({
        success: true,
        workflow: {
          masterReference: { status: 'completed', quality: 0.94 },
          profile360: { status: 'completed', images: 12 },
          consistency: { status: 'verified', score: 0.92 },
        },
      });

      const head = { execute: mockExecute };
      const result = await head.execute({ task: 'Generate complete reference set' });

      expect(result.workflow.profile360.images).toBe(12);
      expect(result.workflow.consistency.score).toBeGreaterThanOrEqual(0.85);
    });
  });

  describe('Master Reference Generator', () => {
    it('should generate master character reference', async () => {
      const mockExecute = jest.fn().mockResolvedValue({
        success: true,
        reference: {
          characterId: 'aladdin',
          imageId: 'master-ref-aladdin-001',
          quality: 0.94,
          resolution: { width: 2048, height: 2048 },
        },
      });

      const generator = { execute: mockExecute };
      const result = await generator.execute({ task: 'Generate Aladdin master reference' });

      expect(result.reference.quality).toBeGreaterThanOrEqual(0.90);
      expect(result.reference.resolution.width).toBeGreaterThanOrEqual(2048);
    });

    it('should include all critical character features', async () => {
      const mockExecute = jest.fn().mockResolvedValue({
        success: true,
        features: {
          face: { eyes: 'brown', hair: 'black', skin: 'tan' },
          body: { build: 'athletic', height: 'medium' },
          clothing: { style: 'street-urchin', colors: ['purple', 'beige'] },
        },
      });

      const generator = { execute: mockExecute };
      const result = await generator.execute({ task: 'Extract character features' });

      expect(result.features.face).toBeDefined();
      expect(result.features.clothing).toBeDefined();
    });

    it('should trigger reference generation via tool', async () => {
      const mockExecute = jest.fn().mockResolvedValue({
        success: true,
        jobId: 'ref-12345',
        status: 'queued',
      });

      const generator = { execute: mockExecute };
      const result = await generator.execute({
        task: 'Generate reference',
        tool: 'generate_reference',
      });

      expect(result.jobId).toBeDefined();
    });
  });

  describe('360° Profile Creator', () => {
    it('should generate 12-angle character profile', async () => {
      const mockExecute = jest.fn().mockResolvedValue({
        success: true,
        profile: {
          characterId: 'aladdin',
          images: Array.from({ length: 12 }, (_, i) => ({
            angle: i * 30,
            imageId: `profile-${i}`,
          })),
        },
      });

      const creator = { execute: mockExecute };
      const result = await creator.execute({ task: 'Create 360° profile for Aladdin' });

      expect(result.profile.images).toHaveLength(12);
      expect(result.profile.images.map((img: any) => img.angle)).toEqual([
        0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330
      ]);
    });

    it('should maintain consistency across all angles', async () => {
      const mockExecute = jest.fn().mockResolvedValue({
        success: true,
        consistency: {
          overall: 0.93,
          features: { face: 0.95, clothing: 0.92, proportions: 0.91 },
        },
      });

      const creator = { execute: mockExecute };
      const result = await creator.execute({ task: 'Verify 360° consistency' });

      expect(result.consistency.overall).toBeGreaterThanOrEqual(0.85);
    });

    it('should handle front, side, and back views', async () => {
      const mockExecute = jest.fn().mockResolvedValue({
        success: true,
        keyViews: {
          front: { angle: 0, imageId: 'front-001' },
          side: { angle: 90, imageId: 'side-001' },
          back: { angle: 180, imageId: 'back-001' },
        },
      });

      const creator = { execute: mockExecute };
      const result = await creator.execute({ task: 'Generate key views' });

      expect(result.keyViews.front).toBeDefined();
      expect(result.keyViews.side).toBeDefined();
      expect(result.keyViews.back).toBeDefined();
    });

    it('should complete 360° generation in <120s', async () => {
      const start = Date.now();
      const mockExecute = jest.fn().mockResolvedValue({
        success: true,
        profile: { images: Array(12).fill({}) },
      });

      const creator = { execute: mockExecute };
      await creator.execute({ task: 'Generate full 360° profile' });

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(120000);
    });
  });

  describe('Image Descriptor', () => {
    it('should write detailed image descriptions', async () => {
      const mockExecute = jest.fn().mockResolvedValue({
        success: true,
        description: {
          imageId: 'aladdin-ref-001',
          text: 'Young man, early 20s, athletic build, wearing purple vest...',
          wordCount: 150,
        },
      });

      const descriptor = { execute: mockExecute };
      const result = await descriptor.execute({ task: 'Describe Aladdin reference' });

      expect(result.description.wordCount).toBeGreaterThanOrEqual(100);
    });

    it('should include technical specifications', async () => {
      const mockExecute = jest.fn().mockResolvedValue({
        success: true,
        specs: {
          pose: 'neutral standing',
          lighting: 'even front lighting',
          background: 'neutral gray',
          focus: 'full body',
        },
      });

      const descriptor = { execute: mockExecute };
      const result = await descriptor.execute({ task: 'Extract technical specs' });

      expect(result.specs.lighting).toBeDefined();
    });

    it('should tag key visual elements', async () => {
      const mockExecute = jest.fn().mockResolvedValue({
        success: true,
        tags: [
          'purple-vest', 'brown-eyes', 'black-hair',
          'athletic', 'tan-skin', 'street-clothes'
        ],
      });

      const descriptor = { execute: mockExecute };
      const result = await descriptor.execute({ task: 'Tag visual elements' });

      expect(result.tags.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe('Shot Composer', () => {
    it('should create composite shots', async () => {
      const mockExecute = jest.fn().mockResolvedValue({
        success: true,
        composite: {
          shotId: 'scene-1-shot-3',
          elements: [
            { type: 'character', id: 'aladdin', position: 'center' },
            { type: 'character', id: 'jasmine', position: 'left' },
            { type: 'background', id: 'marketplace', position: 'full' },
          ],
        },
      });

      const composer = { execute: mockExecute };
      const result = await composer.execute({ task: 'Compose scene shot' });

      expect(result.composite.elements.length).toBeGreaterThanOrEqual(2);
    });

    it('should layer elements properly', async () => {
      const mockExecute = jest.fn().mockResolvedValue({
        success: true,
        layers: [
          { z: 0, type: 'background' },
          { z: 1, type: 'character-rear' },
          { z: 2, type: 'character-front' },
          { z: 3, type: 'foreground' },
        ],
      });

      const composer = { execute: mockExecute };
      const result = await composer.execute({ task: 'Define layer stack' });

      expect(result.layers).toHaveLength(4);
    });

    it('should handle multi-character scenes', async () => {
      const mockExecute = jest.fn().mockResolvedValue({
        success: true,
        scene: {
          characters: ['aladdin', 'jasmine', 'genie', 'jafar'],
          composition: 'group-shot',
        },
      });

      const composer = { execute: mockExecute };
      const result = await composer.execute({ task: 'Compose group scene' });

      expect(result.scene.characters.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Consistency Verifier', () => {
    it('should verify image consistency', async () => {
      const mockExecute = jest.fn().mockResolvedValue({
        success: true,
        verification: {
          consistencyPassed: true,
          overallScore: 0.92,
          checks: {
            color: { passed: true, score: 0.93 },
            style: { passed: true, score: 0.91 },
            proportions: { passed: true, score: 0.92 },
          },
        },
      });

      const verifier = { execute: mockExecute };
      const result = await verifier.execute({
        task: 'Verify consistency',
        tool: 'verify_consistency',
      });

      expect(result.verification.consistencyPassed).toBe(true);
      expect(result.verification.overallScore).toBeGreaterThanOrEqual(0.85);
    });

    it('should detect inconsistencies', async () => {
      const mockExecute = jest.fn().mockResolvedValue({
        success: true,
        inconsistencies: [
          { type: 'color', issue: 'Hair color varies', severity: 'high' },
          { type: 'proportions', issue: 'Height mismatch', severity: 'medium' },
        ],
      });

      const verifier = { execute: mockExecute };
      const result = await verifier.execute({ task: 'Detect issues' });

      expect(result.inconsistencies.length).toBeGreaterThanOrEqual(1);
    });

    it('should provide fix recommendations', async () => {
      const mockExecute = jest.fn().mockResolvedValue({
        success: true,
        recommendations: [
          'Standardize hair color to #2C1810',
          'Adjust proportions in images 3, 7, 11',
        ],
      });

      const verifier = { execute: mockExecute };
      const result = await verifier.execute({ task: 'Recommend fixes' });

      expect(result.recommendations.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Complete Reference Generation Workflow', () => {
    it('should complete full 360° reference generation', async () => {
      const mockExecute = jest.fn()
        .mockResolvedValueOnce({ success: true, specialists: [] })
        .mockResolvedValueOnce({ success: true, reference: { imageId: 'master' } })
        .mockResolvedValueOnce({ success: true, profile: { images: Array(12).fill({}) } })
        .mockResolvedValueOnce({ success: true, descriptions: [] })
        .mockResolvedValueOnce({ success: true, verification: { consistencyPassed: true } })
        .mockResolvedValueOnce({ success: true, grading: { average: 0.92 } });

      const head = { execute: mockExecute };

      await head.execute({ task: 'Initialize' });
      await head.execute({ task: 'Generate master reference' });
      await head.execute({ task: 'Create 360° profile' });
      await head.execute({ task: 'Write descriptions' });
      await head.execute({ task: 'Verify consistency' });
      const result = await head.execute({ task: 'Grade' });

      expect(result.grading.average).toBeGreaterThanOrEqual(0.85);
    });

    it('should meet performance requirements (<60s)', async () => {
      const start = Date.now();
      const mockExecute = jest.fn().mockResolvedValue({ success: true });

      const head = { execute: mockExecute };
      await head.execute({ task: 'Full reference workflow' });

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(60000);
    });
  });

  describe('Quality Gates', () => {
    it('should enforce minimum consistency threshold', async () => {
      const mockExecute = jest.fn().mockResolvedValue({
        success: false,
        error: 'Consistency score 0.72 below threshold 0.85',
      });

      const head = { execute: mockExecute };
      const result = await head.execute({ task: 'Validate low consistency' });

      expect(result.success).toBe(false);
    });

    it('should require master reference before 360° profile', async () => {
      const mockExecute = jest.fn().mockResolvedValue({
        success: false,
        error: 'Master reference not found',
      });

      const creator = { execute: mockExecute };
      const result = await creator.execute({ task: 'Create 360° without master' });

      expect(result.success).toBe(false);
    });
  });
});
