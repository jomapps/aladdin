/**
 * Suite 1: Video Generation Methods Tests
 * Tests all 4 video generation methods with various parameters
 *
 * Total Tests: 35+
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { FalClient } from '@/lib/fal/client';
import type {
  FalTextToVideoRequest,
  FalImageToVideoRequest,
  FalFirstLastFrameRequest,
  FalCompositeToVideoRequest,
} from '@/lib/fal/types';

describe('Video Generation Methods Tests', () => {
  let falClient: FalClient;
  const testVideoUrl = 'https://example.com/test-video.mp4';
  const testImageUrl = 'https://example.com/test-image.png';

  beforeAll(async () => {
    process.env.FAL_API_KEY = process.env.FAL_API_KEY || 'test-fal-key';
    falClient = new FalClient({ apiKey: process.env.FAL_API_KEY });
  });

  afterAll(async () => {
    // Cleanup
  });

  describe('Text-to-Video Generation', () => {
    it('should generate video from text prompt with default parameters', async () => {
      const request: FalTextToVideoRequest = {
        type: 'text-to-video',
        prompt: 'Aladdin walking through bustling marketplace',
      };

      const response = await falClient.generateTextToVideo(request);

      expect(response.video).toBeDefined();
      expect(response.video.url).toContain('https://');
      expect(response.video.duration).toBeLessThanOrEqual(7);
      expect(response.video.format).toBe('mp4');
      expect(response.seed).toBeTypeOf('number');
    });

    it('should generate video with custom duration (5 seconds)', async () => {
      const request: FalTextToVideoRequest = {
        type: 'text-to-video',
        prompt: 'Jasmine in palace garden',
        duration: 5,
      };

      const response = await falClient.generateTextToVideo(request);

      expect(response.video.duration).toBeCloseTo(5, 0.5);
      expect(response.video.duration).toBeLessThanOrEqual(7);
    });

    it('should enforce maximum duration of 7 seconds', async () => {
      const request: FalTextToVideoRequest = {
        type: 'text-to-video',
        prompt: 'Long scene of desert sunset',
        duration: 15, // Request more than max
      };

      const response = await falClient.generateTextToVideo(request);

      expect(response.video.duration).toBeLessThanOrEqual(7);
    });

    it('should generate video with custom FPS', async () => {
      const request: FalTextToVideoRequest = {
        type: 'text-to-video',
        prompt: 'Genie transforming',
        fps: 30,
        duration: 5,
      };

      const response = await falClient.generateTextToVideo(request);

      expect(response.video.fps).toBe(30);
    });

    it('should generate video with custom resolution', async () => {
      const request: FalTextToVideoRequest = {
        type: 'text-to-video',
        prompt: 'Magic carpet flying',
        resolution: { width: 1280, height: 720 },
      };

      const response = await falClient.generateTextToVideo(request);

      expect(response.video.width).toBe(1280);
      expect(response.video.height).toBe(720);
    });

    it('should generate video with negative prompt', async () => {
      const request: FalTextToVideoRequest = {
        type: 'text-to-video',
        prompt: 'Character in marketplace',
        negativePrompt: 'blurry, low quality, distorted faces',
      };

      const response = await falClient.generateTextToVideo(request);

      expect(response.video.url).toBeTruthy();
      expect(response.prompt).toContain('Character in marketplace');
    });

    it('should generate video with deterministic seed', async () => {
      const request: FalTextToVideoRequest = {
        type: 'text-to-video',
        prompt: 'Aladdin portrait',
        seed: 12345,
      };

      const response = await falClient.generateTextToVideo(request);

      expect(response.seed).toBe(12345);
    });

    it('should track generation timings', async () => {
      const request: FalTextToVideoRequest = {
        type: 'text-to-video',
        prompt: 'Quick test video',
        duration: 3,
      };

      const response = await falClient.generateTextToVideo(request);

      expect(response.timings.inference).toBeGreaterThan(0);
      expect(response.timings.total).toBeGreaterThan(response.timings.inference);
      expect(response.timings.total).toBeLessThan(120000); // Under 2 minutes
    });
  });

  describe('Image-to-Video Generation', () => {
    it('should generate video from single image with motion', async () => {
      const request: FalImageToVideoRequest = {
        type: 'image-to-video',
        prompt: 'Aladdin smiling and waving',
        imageUrl: testImageUrl,
      };

      const response = await falClient.generateImageToVideo(request);

      expect(response.video.url).toBeTruthy();
      expect(response.video.duration).toBeLessThanOrEqual(7);
    });

    it('should generate video with custom motion strength', async () => {
      const request: FalImageToVideoRequest = {
        type: 'image-to-video',
        prompt: 'Character breathing gently',
        imageUrl: testImageUrl,
        motionStrength: 0.3, // Subtle motion
      };

      const response = await falClient.generateImageToVideo(request);

      expect(response.video.url).toBeTruthy();
    });

    it('should generate video with camera pan-left', async () => {
      const request: FalImageToVideoRequest = {
        type: 'image-to-video',
        prompt: 'Panoramic view of marketplace',
        imageUrl: testImageUrl,
        motionParameters: {
          cameraMovement: 'pan-left',
        },
      };

      const response = await falClient.generateImageToVideo(request);

      expect(response.video.url).toBeTruthy();
    });

    it('should generate video with zoom-in camera movement', async () => {
      const request: FalImageToVideoRequest = {
        type: 'image-to-video',
        prompt: 'Close-up on character face',
        imageUrl: testImageUrl,
        motionParameters: {
          cameraMovement: 'zoom-in',
        },
      };

      const response = await falClient.generateImageToVideo(request);

      expect(response.video.url).toBeTruthy();
    });

    it('should generate video with character action', async () => {
      const request: FalImageToVideoRequest = {
        type: 'image-to-video',
        prompt: 'Aladdin turning head',
        imageUrl: testImageUrl,
        motionParameters: {
          characterAction: 'turning head to look right',
        },
      };

      const response = await falClient.generateImageToVideo(request);

      expect(response.video.url).toBeTruthy();
    });

    it('should handle high motion strength', async () => {
      const request: FalImageToVideoRequest = {
        type: 'image-to-video',
        prompt: 'Dynamic action scene',
        imageUrl: testImageUrl,
        motionStrength: 0.9,
      };

      const response = await falClient.generateImageToVideo(request);

      expect(response.video.url).toBeTruthy();
    });

    it('should generate video with scene transition', async () => {
      const request: FalImageToVideoRequest = {
        type: 'image-to-video',
        prompt: 'Transition to next scene',
        imageUrl: testImageUrl,
        motionParameters: {
          sceneTransition: true,
        },
      };

      const response = await falClient.generateImageToVideo(request);

      expect(response.video.url).toBeTruthy();
    });
  });

  describe('First-Last-Frame Interpolation', () => {
    const firstFrameUrl = 'https://example.com/first-frame.png';
    const lastFrameUrl = 'https://example.com/last-frame.png';

    it('should generate video from first and last keyframes', async () => {
      const request: FalFirstLastFrameRequest = {
        type: 'first-last-frame',
        prompt: 'Smooth transition from pose A to pose B',
        firstFrameUrl,
        lastFrameUrl,
      };

      const response = await falClient.generateFirstLastFrameVideo(request);

      expect(response.video.url).toBeTruthy();
      expect(response.video.duration).toBeLessThanOrEqual(7);
    });

    it('should generate video with custom interpolation steps', async () => {
      const request: FalFirstLastFrameRequest = {
        type: 'first-last-frame',
        prompt: 'Character movement interpolation',
        firstFrameUrl,
        lastFrameUrl,
        interpolationSteps: 24,
      };

      const response = await falClient.generateFirstLastFrameVideo(request);

      expect(response.video.url).toBeTruthy();
    });

    it('should generate smooth transition with high interpolation', async () => {
      const request: FalFirstLastFrameRequest = {
        type: 'first-last-frame',
        prompt: 'Ultra-smooth character turn',
        firstFrameUrl,
        lastFrameUrl,
        interpolationSteps: 32,
        duration: 5,
      };

      const response = await falClient.generateFirstLastFrameVideo(request);

      expect(response.video.url).toBeTruthy();
      expect(response.video.duration).toBeCloseTo(5, 0.5);
    });

    it('should handle different frame resolutions', async () => {
      const request: FalFirstLastFrameRequest = {
        type: 'first-last-frame',
        prompt: 'Wide shot transition',
        firstFrameUrl,
        lastFrameUrl,
        resolution: { width: 1920, height: 1080 },
      };

      const response = await falClient.generateFirstLastFrameVideo(request);

      expect(response.video.width).toBe(1920);
      expect(response.video.height).toBe(1080);
    });
  });

  describe('Composite-to-Video Generation', () => {
    const compositeUrl = 'https://example.com/composite-scene.png';

    it('should generate video from composite image', async () => {
      const request: FalCompositeToVideoRequest = {
        type: 'composite-to-video',
        prompt: 'Animated scene with characters',
        compositeImageUrl: compositeUrl,
      };

      const response = await falClient.generateCompositeToVideo(request);

      expect(response.video.url).toBeTruthy();
      expect(response.video.duration).toBeLessThanOrEqual(7);
    });

    it('should generate video with character references', async () => {
      const request: FalCompositeToVideoRequest = {
        type: 'composite-to-video',
        prompt: 'Scene with Aladdin and Jasmine',
        compositeImageUrl: compositeUrl,
        referenceImages: [
          { url: 'https://example.com/aladdin-ref.png', type: 'character', weight: 1.0 },
          { url: 'https://example.com/jasmine-ref.png', type: 'character', weight: 1.0 },
        ],
      };

      const response = await falClient.generateCompositeToVideo(request);

      expect(response.video.url).toBeTruthy();
    });

    it('should generate video with location reference', async () => {
      const request: FalCompositeToVideoRequest = {
        type: 'composite-to-video',
        prompt: 'Marketplace scene animation',
        compositeImageUrl: compositeUrl,
        referenceImages: [
          { url: 'https://example.com/marketplace.png', type: 'location', weight: 0.8 },
        ],
      };

      const response = await falClient.generateCompositeToVideo(request);

      expect(response.video.url).toBeTruthy();
    });

    it('should generate video with dolly camera movement', async () => {
      const request: FalCompositeToVideoRequest = {
        type: 'composite-to-video',
        prompt: 'Smooth dolly shot',
        compositeImageUrl: compositeUrl,
        cameraMovement: {
          type: 'dolly',
          speed: 'slow',
          easing: 'ease-in-out',
        },
      };

      const response = await falClient.generateCompositeToVideo(request);

      expect(response.video.url).toBeTruthy();
    });

    it('should generate video with crane shot', async () => {
      const request: FalCompositeToVideoRequest = {
        type: 'composite-to-video',
        prompt: 'Dramatic crane shot',
        compositeImageUrl: compositeUrl,
        cameraMovement: {
          type: 'crane',
          speed: 'medium',
        },
      };

      const response = await falClient.generateCompositeToVideo(request);

      expect(response.video.url).toBeTruthy();
    });

    it('should generate video with multiple reference types', async () => {
      const request: FalCompositeToVideoRequest = {
        type: 'composite-to-video',
        prompt: 'Complex scene with multiple elements',
        compositeImageUrl: compositeUrl,
        referenceImages: [
          { url: 'https://example.com/char1.png', type: 'character', weight: 1.0 },
          { url: 'https://example.com/char2.png', type: 'character', weight: 1.0 },
          { url: 'https://example.com/location.png', type: 'location', weight: 0.7 },
          { url: 'https://example.com/style.png', type: 'style', weight: 0.5 },
        ],
      };

      const response = await falClient.generateCompositeToVideo(request);

      expect(response.video.url).toBeTruthy();
    });

    it('should generate video with custom motion strength', async () => {
      const request: FalCompositeToVideoRequest = {
        type: 'composite-to-video',
        prompt: 'Subtle animation',
        compositeImageUrl: compositeUrl,
        motionStrength: 0.4,
      };

      const response = await falClient.generateCompositeToVideo(request);

      expect(response.video.url).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid image URL', async () => {
      const request: FalImageToVideoRequest = {
        type: 'image-to-video',
        prompt: 'Test video',
        imageUrl: 'invalid-url',
      };

      await expect(falClient.generateImageToVideo(request)).rejects.toThrow();
    });

    it('should handle missing API key', async () => {
      const clientWithoutKey = new FalClient({ apiKey: '' });
      const request: FalTextToVideoRequest = {
        type: 'text-to-video',
        prompt: 'Test',
      };

      await expect(clientWithoutKey.generateTextToVideo(request)).rejects.toThrow();
    });

    it('should handle network timeout', async () => {
      const slowClient = new FalClient({
        apiKey: process.env.FAL_API_KEY!,
        timeout: 100, // Very short timeout
      });

      const request: FalTextToVideoRequest = {
        type: 'text-to-video',
        prompt: 'Test video',
      };

      await expect(slowClient.generateTextToVideo(request)).rejects.toThrow();
    });
  });

  describe('Webhook Integration', () => {
    it('should support webhook URL for async processing', async () => {
      const webhookUrl = 'https://example.com/webhook';
      const request: FalTextToVideoRequest = {
        type: 'text-to-video',
        prompt: 'Async video generation',
      };

      const response = await falClient.generateTextToVideo(request, {
        webhookUrl,
      });

      expect(response.video.url).toBeTruthy();
    });

    it('should subscribe to webhook notifications', async () => {
      const webhookUrl = 'https://example.com/webhook/notify';
      const requestId = 'req-12345';

      const subscription = await falClient.subscribeToWebhook(webhookUrl, requestId);

      expect(subscription.subscriptionId).toBeTruthy();
    });
  });

  describe('Performance Metrics', () => {
    it('should complete text-to-video under 120 seconds', async () => {
      const startTime = Date.now();

      const request: FalTextToVideoRequest = {
        type: 'text-to-video',
        prompt: 'Performance test video',
        duration: 5,
      };

      const response = await falClient.generateTextToVideo(request);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(120000);
      expect(response.video.url).toBeTruthy();
    });

    it('should complete image-to-video under 90 seconds', async () => {
      const startTime = Date.now();

      const request: FalImageToVideoRequest = {
        type: 'image-to-video',
        prompt: 'Performance test',
        imageUrl: testImageUrl,
      };

      const response = await falClient.generateImageToVideo(request);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(90000);
      expect(response.video.url).toBeTruthy();
    });
  });
});
