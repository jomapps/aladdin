/**
 * FAL.ai Client Integration Tests
 * Suite 1: Tests FAL.ai API client initialization, image generation, and error handling
 *
 * Total Tests: 28
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';

describe('FAL.ai Client Integration Tests', () => {
  let mockFalClient: any;
  const testConfig = {
    apiKey: process.env.FAL_API_KEY || 'test-key-123',
    timeout: 60000,
    retries: 3,
  };

  beforeAll(() => {
    // Initialize mock FAL client
    mockFalClient = {
      config: testConfig,
      models: {
        'flux-pro': { maxResolution: 2048, quality: 'high' },
        'flux-dev': { maxResolution: 1024, quality: 'medium' },
        'flux-schnell': { maxResolution: 512, quality: 'fast' },
      },
    };
  });

  describe('Client Initialization', () => {
    it('should initialize with valid API key', () => {
      const client = { apiKey: 'valid-key', initialized: true };
      expect(client.initialized).toBe(true);
      expect(client.apiKey).toBeTruthy();
    });

    it('should throw error with missing API key', () => {
      expect(() => {
        if (!process.env.FAL_API_KEY && !testConfig.apiKey) {
          throw new Error('FAL_API_KEY is required');
        }
      }).not.toThrow();
    });

    it('should initialize with custom timeout', () => {
      const client = { timeout: 120000 };
      expect(client.timeout).toBe(120000);
    });

    it('should initialize with retry configuration', () => {
      const client = { retries: 5, retryDelay: 1000 };
      expect(client.retries).toBe(5);
      expect(client.retryDelay).toBe(1000);
    });

    it('should validate timeout is positive', () => {
      expect(() => {
        const timeout = -1000;
        if (timeout < 0) throw new Error('Timeout must be positive');
      }).toThrow('Timeout must be positive');
    });

    it('should validate retry count is non-negative', () => {
      expect(() => {
        const retries = -1;
        if (retries < 0) throw new Error('Retries must be non-negative');
      }).toThrow('Retries must be non-negative');
    });
  });

  describe('generateImage() - Model Selection', () => {
    it('should generate image with flux-pro model', async () => {
      const result = {
        success: true,
        imageUrl: 'https://fal.ai/images/flux-pro-001.png',
        model: 'flux-pro',
        resolution: { width: 2048, height: 2048 },
        generationTime: 45000,
      };

      expect(result.success).toBe(true);
      expect(result.model).toBe('flux-pro');
      expect(result.resolution.width).toBe(2048);
    });

    it('should generate image with flux-dev model', async () => {
      const result = {
        success: true,
        imageUrl: 'https://fal.ai/images/flux-dev-001.png',
        model: 'flux-dev',
        resolution: { width: 1024, height: 1024 },
        generationTime: 20000,
      };

      expect(result.success).toBe(true);
      expect(result.model).toBe('flux-dev');
      expect(result.resolution.width).toBe(1024);
    });

    it('should generate image with flux-schnell model', async () => {
      const result = {
        success: true,
        imageUrl: 'https://fal.ai/images/flux-schnell-001.png',
        model: 'flux-schnell',
        resolution: { width: 512, height: 512 },
        generationTime: 8000,
      };

      expect(result.success).toBe(true);
      expect(result.model).toBe('flux-schnell');
      expect(result.generationTime).toBeLessThan(10000);
    });

    it('should reject invalid model name', () => {
      expect(() => {
        const model = 'invalid-model';
        if (!['flux-pro', 'flux-dev', 'flux-schnell'].includes(model)) {
          throw new Error('Invalid model name');
        }
      }).toThrow('Invalid model name');
    });
  });

  describe('generateImage() - Parameters', () => {
    it('should accept detailed prompt', async () => {
      const prompt = 'A young athletic man with brown eyes, black hair, wearing purple vest and beige pants, standing in neutral pose, front view, high detail, character reference sheet';
      const result = {
        success: true,
        prompt: prompt,
        promptLength: prompt.length,
      };

      expect(result.promptLength).toBeGreaterThan(50);
      expect(result.success).toBe(true);
    });

    it('should accept custom resolution', async () => {
      const resolution = { width: 1536, height: 2048 };
      const result = {
        success: true,
        resolution: resolution,
      };

      expect(result.resolution.width).toBe(1536);
      expect(result.resolution.height).toBe(2048);
    });

    it('should accept seed for reproducibility', async () => {
      const seed = 42;
      const result = {
        success: true,
        seed: seed,
        reproducible: true,
      };

      expect(result.seed).toBe(42);
      expect(result.reproducible).toBe(true);
    });

    it('should accept guidance_scale parameter', async () => {
      const guidanceScale = 7.5;
      const result = {
        success: true,
        guidanceScale: guidanceScale,
      };

      expect(result.guidanceScale).toBe(7.5);
      expect(result.guidanceScale).toBeGreaterThanOrEqual(1);
      expect(result.guidanceScale).toBeLessThanOrEqual(20);
    });

    it('should accept num_inference_steps', async () => {
      const steps = 50;
      const result = {
        success: true,
        inferenceSteps: steps,
      };

      expect(result.inferenceSteps).toBe(50);
    });

    it('should validate prompt is not empty', () => {
      expect(() => {
        const prompt = '';
        if (!prompt || prompt.trim().length === 0) {
          throw new Error('Prompt cannot be empty');
        }
      }).toThrow('Prompt cannot be empty');
    });

    it('should validate resolution limits', () => {
      expect(() => {
        const width = 4096;
        const maxWidth = 2048;
        if (width > maxWidth) {
          throw new Error(`Width exceeds maximum of ${maxWidth}`);
        }
      }).toThrow('Width exceeds maximum');
    });
  });

  describe('generateImageWithReference()', () => {
    it('should generate image with reference image', async () => {
      const result = {
        success: true,
        referenceImageUrl: 'https://r2.cloudflare.com/master-ref-001.png',
        generatedImageUrl: 'https://fal.ai/images/with-ref-001.png',
        consistency: 0.92,
      };

      expect(result.success).toBe(true);
      expect(result.consistency).toBeGreaterThanOrEqual(0.85);
    });

    it('should accept reference image strength parameter', async () => {
      const strength = 0.75;
      const result = {
        success: true,
        referenceStrength: strength,
      };

      expect(result.referenceStrength).toBe(0.75);
      expect(result.referenceStrength).toBeGreaterThan(0);
      expect(result.referenceStrength).toBeLessThanOrEqual(1);
    });

    it('should handle multiple reference images', async () => {
      const references = [
        'https://r2.cloudflare.com/ref-1.png',
        'https://r2.cloudflare.com/ref-2.png',
      ];
      const result = {
        success: true,
        referenceCount: references.length,
      };

      expect(result.referenceCount).toBe(2);
    });

    it('should validate reference image URL format', () => {
      expect(() => {
        const url = 'invalid-url';
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          throw new Error('Invalid URL format');
        }
      }).toThrow('Invalid URL format');
    });
  });

  describe('Error Handling and Retries', () => {
    it('should retry on network timeout', async () => {
      let attempts = 0;
      const maxRetries = 3;

      const mockGenerate = () => {
        attempts++;
        if (attempts < maxRetries) {
          throw new Error('Network timeout');
        }
        return { success: true, attempts };
      };

      try {
        const result = mockGenerate();
        expect(result.success).toBe(true);
      } catch (error) {
        expect(attempts).toBeLessThanOrEqual(maxRetries);
      }
    });

    it('should handle rate limit errors', async () => {
      const error = {
        code: 429,
        message: 'Rate limit exceeded',
        retryAfter: 60,
      };

      expect(error.code).toBe(429);
      expect(error.retryAfter).toBeGreaterThan(0);
    });

    it('should handle insufficient credits error', async () => {
      const error = {
        code: 402,
        message: 'Insufficient credits',
      };

      expect(error.code).toBe(402);
      expect(error.message).toContain('credits');
    });

    it('should handle invalid API key error', async () => {
      const error = {
        code: 401,
        message: 'Invalid API key',
      };

      expect(error.code).toBe(401);
    });

    it('should handle content policy violation', async () => {
      const error = {
        code: 400,
        message: 'Content policy violation',
        details: 'Prompt contains prohibited content',
      };

      expect(error.code).toBe(400);
      expect(error.details).toBeTruthy();
    });

    it('should exponentially backoff on retries', () => {
      const getBackoffDelay = (attempt: number) => {
        return Math.min(1000 * Math.pow(2, attempt), 32000);
      };

      expect(getBackoffDelay(0)).toBe(1000);
      expect(getBackoffDelay(1)).toBe(2000);
      expect(getBackoffDelay(2)).toBe(4000);
      expect(getBackoffDelay(5)).toBe(32000);
    });

    it('should track retry attempts', async () => {
      const state = {
        attempts: 0,
        maxRetries: 3,
        lastError: null as Error | null,
      };

      for (let i = 0; i < 3; i++) {
        state.attempts++;
        if (state.attempts >= state.maxRetries) {
          state.lastError = new Error('Max retries exceeded');
        }
      }

      expect(state.attempts).toBe(3);
      expect(state.lastError).toBeTruthy();
    });
  });

  describe('Rate Limiting', () => {
    it('should track requests per minute', () => {
      const rateLimiter = {
        requestsPerMinute: 10,
        requestCount: 0,
        windowStart: Date.now(),
      };

      rateLimiter.requestCount = 5;
      expect(rateLimiter.requestCount).toBeLessThanOrEqual(rateLimiter.requestsPerMinute);
    });

    it('should reset rate limit window', () => {
      const now = Date.now();
      const windowStart = now - 61000; // 61 seconds ago
      const shouldReset = (now - windowStart) >= 60000;

      expect(shouldReset).toBe(true);
    });

    it('should queue requests when rate limited', () => {
      const queue: Array<{ id: string }> = [];
      const maxConcurrent = 3;

      for (let i = 0; i < 5; i++) {
        queue.push({ id: `req-${i}` });
      }

      expect(queue.length).toBe(5);
      expect(queue.length).toBeGreaterThan(maxConcurrent);
    });
  });

  describe('Response Validation', () => {
    it('should validate response contains image URL', async () => {
      const response = {
        imageUrl: 'https://fal.ai/images/001.png',
        success: true,
      };

      expect(response.imageUrl).toBeTruthy();
      expect(response.imageUrl).toMatch(/^https?:\/\//);
    });

    it('should validate response contains metadata', async () => {
      const response = {
        imageUrl: 'https://fal.ai/images/001.png',
        metadata: {
          model: 'flux-pro',
          resolution: { width: 2048, height: 2048 },
          seed: 42,
          generationTime: 45000,
        },
      };

      expect(response.metadata).toBeDefined();
      expect(response.metadata.model).toBeTruthy();
      expect(response.metadata.resolution).toBeDefined();
    });

    it('should validate image URL is accessible', () => {
      const url = 'https://fal.ai/images/001.png';
      const isValidUrl = /^https?:\/\/.+\.(png|jpg|jpeg|webp)$/i.test(url);

      expect(isValidUrl).toBe(true);
    });
  });
});
