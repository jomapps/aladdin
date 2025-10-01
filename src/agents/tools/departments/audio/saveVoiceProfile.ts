/**
 * Save Voice Profile Tool
 * Saves voice profile data to MongoDB
 */

import { z } from 'zod';
import { tool } from '@codebuff/sdk';
import { MongoClient } from 'mongodb';

const SaveVoiceProfileInput = z.object({
  voiceId: z.string().describe('Unique voice profile identifier'),
  characterId: z.string().describe('Associated character ID'),
  characterName: z.string().describe('Character name'),
  voiceCharacteristics: z.object({
    gender: z.enum(['male', 'female', 'neutral', 'multiple']),
    age: z.enum(['child', 'teen', 'young-adult', 'adult', 'elderly']),
    tone: z.array(z.string()).describe('Tone descriptors (e.g., warm, gruff, cheerful)'),
    pitch: z.enum(['very-low', 'low', 'medium', 'high', 'very-high']),
    pace: z.enum(['very-slow', 'slow', 'moderate', 'fast', 'very-fast']),
    accent: z.string().optional().describe('Accent or dialect'),
  }).describe('Voice characteristics'),
  emotionalRange: z.object({
    primaryEmotions: z.array(z.string()).describe('Primary emotional expressions'),
    intensity: z.enum(['subtle', 'moderate', 'intense', 'dramatic']),
    versatility: z.number().min(0).max(1).describe('Emotional range versatility (0-1)'),
  }).optional(),
  technicalSpecs: z.object({
    modelId: z.string().optional().describe('TTS model identifier'),
    sampleRate: z.number().optional().describe('Audio sample rate (Hz)'),
    format: z.string().optional().describe('Audio format (e.g., mp3, wav)'),
    referenceAudioUrl: z.string().optional().describe('Reference audio URL'),
  }).optional(),
  metadata: z.object({
    createdBy: z.string().optional(),
    version: z.string().default('1.0'),
    tags: z.array(z.string()).optional(),
  }).optional(),
});

export const saveVoiceProfileTool = tool({
  name: 'save_voice_profile',
  description: 'Save voice profile and characteristics to MongoDB',
  input: SaveVoiceProfileInput,
  execute: async ({
    voiceId,
    characterId,
    characterName,
    voiceCharacteristics,
    emotionalRange,
    technicalSpecs,
    metadata
  }) => {
    try {
      const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
      const client = new MongoClient(mongoUri);

      await client.connect();
      const db = client.db('aladdin');
      const collection = db.collection('voice_profiles');

      const document = {
        voiceId,
        characterId,
        characterName,
        voiceCharacteristics,
        emotionalRange: emotionalRange || {
          primaryEmotions: ['neutral'],
          intensity: 'moderate',
          versatility: 0.5,
        },
        technicalSpecs: technicalSpecs || {},
        metadata: {
          ...metadata,
          version: metadata?.version || '1.0',
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await collection.updateOne(
        { voiceId },
        { $set: document },
        { upsert: true }
      );

      await client.close();

      return {
        success: true,
        voiceId,
        characterId,
        characterName,
        operation: result.upsertedId ? 'created' : 'updated',
        message: `Voice profile for '${characterName}' saved successfully`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to save voice profile',
      };
    }
  },
});
