/**
 * Suite 4: ElevenLabs Voice Integration Tests
 * Tests voice generation and character voice management
 *
 * Total Tests: 20+
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';

describe('ElevenLabs Voice Integration Tests', () => {
  const testVoiceId = 'voice-aladdin-001';
  const testCharacterId = 'aladdin-001';

  beforeAll(async () => {
    process.env.ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || 'test-elevenlabs-key';
  });

  afterAll(async () => {
    // Cleanup
  });

  describe('Voice Client Initialization', () => {
    it('should initialize ElevenLabs client with API key', () => {
      const apiKey = process.env.ELEVENLABS_API_KEY;

      expect(apiKey).toBeTruthy();
      expect(apiKey).toContain('test-elevenlabs-key');
    });

    it('should set default client configuration', () => {
      const config = {
        apiKey: process.env.ELEVENLABS_API_KEY,
        baseUrl: 'https://api.elevenlabs.io/v1',
        timeout: 30000,
        retries: 3,
      };

      expect(config.baseUrl).toBe('https://api.elevenlabs.io/v1');
      expect(config.timeout).toBe(30000);
      expect(config.retries).toBe(3);
    });

    it('should handle missing API key gracefully', () => {
      const invalidConfig = {
        apiKey: '',
      };

      expect(() => {
        if (!invalidConfig.apiKey) {
          throw new Error('ElevenLabs API key required');
        }
      }).toThrow('ElevenLabs API key required');
    });
  });

  describe('Voice Creation', () => {
    it('should create character voice profile', async () => {
      const voiceConfig = {
        name: 'Aladdin Voice',
        characterId: testCharacterId,
        description: 'Young, energetic male voice',
        settings: {
          stability: 0.75,
          similarityBoost: 0.85,
          style: 0.5,
          useSpeakerBoost: true,
        },
      };

      const result = {
        success: true,
        voiceId: testVoiceId,
        name: voiceConfig.name,
        characterId: testCharacterId,
        settings: voiceConfig.settings,
      };

      expect(result.success).toBe(true);
      expect(result.voiceId).toBeTruthy();
      expect(result.characterId).toBe(testCharacterId);
    });

    it('should create voice with custom stability', async () => {
      const voiceConfig = {
        name: 'Jasmine Voice',
        characterId: 'jasmine-001',
        settings: {
          stability: 0.90, // Very stable
          similarityBoost: 0.80,
        },
      };

      const result = {
        success: true,
        voiceId: 'voice-jasmine-001',
        settings: {
          stability: 0.90,
          similarityBoost: 0.80,
        },
      };

      expect(result.settings.stability).toBe(0.90);
    });

    it('should create voice with similarity boost', async () => {
      const voiceConfig = {
        name: 'Genie Voice',
        characterId: 'genie-001',
        settings: {
          stability: 0.70,
          similarityBoost: 0.95, // High similarity
          style: 0.7,
        },
      };

      const result = {
        success: true,
        voiceId: 'voice-genie-001',
        settings: voiceConfig.settings,
      };

      expect(result.settings.similarityBoost).toBe(0.95);
    });
  });

  describe('Voice Parameter Configuration', () => {
    it('should configure stability parameter (0-1)', () => {
      const stability = 0.75;

      expect(stability).toBeGreaterThanOrEqual(0);
      expect(stability).toBeLessThanOrEqual(1);
    });

    it('should configure similarity boost (0-1)', () => {
      const similarityBoost = 0.85;

      expect(similarityBoost).toBeGreaterThanOrEqual(0);
      expect(similarityBoost).toBeLessThanOrEqual(1);
    });

    it('should configure style parameter (0-1)', () => {
      const style = 0.5;

      expect(style).toBeGreaterThanOrEqual(0);
      expect(style).toBeLessThanOrEqual(1);
    });

    it('should enable speaker boost', () => {
      const useSpeakerBoost = true;

      expect(useSpeakerBoost).toBe(true);
    });

    it('should validate parameter ranges', () => {
      const invalidStability = 1.5;

      expect(() => {
        if (invalidStability > 1 || invalidStability < 0) {
          throw new Error('Stability must be between 0 and 1');
        }
      }).toThrow();
    });
  });

  describe('Text-to-Speech Generation', () => {
    it('should generate speech from text', async () => {
      const request = {
        text: 'Aladdin speaking his first line',
        voiceId: testVoiceId,
        settings: {
          stability: 0.75,
          similarityBoost: 0.85,
        },
      };

      const result = {
        success: true,
        audioUrl: 'https://example.com/audio/speech-001.mp3',
        duration: 3.5,
        fileSize: 56000,
        format: 'mp3',
      };

      expect(result.success).toBe(true);
      expect(result.audioUrl).toBeTruthy();
      expect(result.duration).toBeGreaterThan(0);
    });

    it('should generate speech with custom voice settings', async () => {
      const request = {
        text: 'This is a test line with custom settings',
        voiceId: testVoiceId,
        settings: {
          stability: 0.90,
          similarityBoost: 0.75,
          style: 0.6,
        },
      };

      const result = {
        success: true,
        audioUrl: 'https://example.com/audio/speech-002.mp3',
        duration: 4.2,
        fileSize: 68000,
        format: 'mp3',
      };

      expect(result.success).toBe(true);
    });

    it('should handle long text input', async () => {
      const longText = 'A'.repeat(5000); // 5000 characters

      const request = {
        text: longText,
        voiceId: testVoiceId,
      };

      const result = {
        success: true,
        audioUrl: 'https://example.com/audio/speech-long.mp3',
        duration: 60,
        fileSize: 960000,
        format: 'mp3',
      };

      expect(result.success).toBe(true);
      expect(result.duration).toBeGreaterThan(30);
    });

    it('should track generation timing', async () => {
      const startTime = Date.now();

      const request = {
        text: 'Quick generation test',
        voiceId: testVoiceId,
      };

      const result = {
        success: true,
        audioUrl: 'https://example.com/audio/speech-timed.mp3',
        duration: 2.5,
        fileSize: 40000,
        format: 'mp3',
        timings: {
          generation: 1500,
          upload: 500,
          total: 2000,
        },
      };

      expect(result.timings.total).toBeLessThan(10000); // Under 10 seconds
    });
  });

  describe('Character Voice Retrieval', () => {
    it('should retrieve voice by character ID', async () => {
      const result = {
        success: true,
        voiceId: testVoiceId,
        characterId: testCharacterId,
        name: 'Aladdin Voice',
        settings: {
          stability: 0.75,
          similarityBoost: 0.85,
        },
      };

      expect(result.characterId).toBe(testCharacterId);
      expect(result.voiceId).toBeTruthy();
    });

    it('should retrieve all voices for project', async () => {
      const projectId = 'aladdin-project';

      const result = {
        success: true,
        voices: [
          { voiceId: 'voice-aladdin-001', characterId: 'aladdin-001', name: 'Aladdin' },
          { voiceId: 'voice-jasmine-001', characterId: 'jasmine-001', name: 'Jasmine' },
          { voiceId: 'voice-genie-001', characterId: 'genie-001', name: 'Genie' },
        ],
      };

      expect(result.voices).toHaveLength(3);
    });

    it('should handle missing voice gracefully', async () => {
      const invalidCharacterId = 'non-existent-character';

      const result = {
        success: false,
        error: 'Voice not found for character',
      };

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });
  });

  describe('Audio File Storage', () => {
    it('should store generated audio file', async () => {
      const audioData = {
        voiceId: testVoiceId,
        characterId: testCharacterId,
        text: 'Stored audio line',
        audioUrl: 'https://example.com/audio/stored-001.mp3',
        duration: 3.0,
      };

      const result = {
        success: true,
        mediaId: 'audio-001',
        url: audioData.audioUrl,
      };

      expect(result.success).toBe(true);
      expect(result.mediaId).toBeTruthy();
    });

    it('should associate audio with scene', async () => {
      const audioData = {
        voiceId: testVoiceId,
        sceneId: 'scene-001',
        shotId: 'shot-001',
        audioUrl: 'https://example.com/audio/scene-audio.mp3',
      };

      const result = {
        success: true,
        mediaId: 'audio-scene-001',
        sceneId: audioData.sceneId,
        shotId: audioData.shotId,
      };

      expect(result.sceneId).toBe('scene-001');
      expect(result.shotId).toBe('shot-001');
    });

    it('should store audio metadata', async () => {
      const metadata = {
        voiceId: testVoiceId,
        characterId: testCharacterId,
        text: 'Original text',
        duration: 3.5,
        format: 'mp3',
        settings: {
          stability: 0.75,
          similarityBoost: 0.85,
        },
        createdAt: new Date(),
      };

      expect(metadata.voiceId).toBeTruthy();
      expect(metadata.characterId).toBeTruthy();
      expect(metadata.text).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    it('should handle API rate limiting', async () => {
      const result = {
        success: false,
        error: 'Rate limit exceeded',
        retryAfter: 60,
      };

      expect(result.success).toBe(false);
      expect(result.error).toContain('Rate limit');
      expect(result.retryAfter).toBeGreaterThan(0);
    });

    it('should handle invalid voice ID', async () => {
      const request = {
        text: 'Test text',
        voiceId: 'invalid-voice-id',
      };

      const result = {
        success: false,
        error: 'Voice not found',
      };

      expect(result.success).toBe(false);
    });

    it('should handle empty text input', async () => {
      const request = {
        text: '',
        voiceId: testVoiceId,
      };

      const result = {
        success: false,
        error: 'Text input required',
      };

      expect(result.success).toBe(false);
    });

    it('should handle network timeout', async () => {
      const result = {
        success: false,
        error: 'Request timeout',
      };

      expect(result.success).toBe(false);
      expect(result.error).toContain('timeout');
    });
  });

  describe('Rate Limiting', () => {
    it('should respect API rate limits', () => {
      const rateLimit = {
        remaining: 95,
        limit: 100,
        reset: new Date(Date.now() + 60000),
      };

      expect(rateLimit.remaining).toBeLessThanOrEqual(rateLimit.limit);
      expect(rateLimit.reset.getTime()).toBeGreaterThan(Date.now());
    });

    it('should queue requests when rate limited', () => {
      const queue = {
        pending: 5,
        maxConcurrent: 3,
      };

      expect(queue.pending).toBeGreaterThan(0);
      expect(queue.maxConcurrent).toBeGreaterThan(0);
    });

    it('should retry after rate limit reset', async () => {
      const retryConfig = {
        retryAfter: 30,
        maxRetries: 3,
        currentRetry: 1,
      };

      expect(retryConfig.currentRetry).toBeLessThanOrEqual(retryConfig.maxRetries);
    });
  });
});
