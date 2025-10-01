/**
 * Save Story Structure Tool
 * Saves story/episode structure to MongoDB
 */

import { z } from 'zod';
import { tool } from '@codebuff/sdk';
import { MongoClient } from 'mongodb';

const SaveStoryStructureInput = z.object({
  storyId: z.string().describe('Unique story identifier'),
  title: z.string().describe('Story/episode title'),
  type: z.enum(['series', 'episode', 'scene', 'act']).describe('Structure type'),
  structure: z.object({
    acts: z.array(z.object({
      number: z.number(),
      title: z.string(),
      scenes: z.array(z.string()),
      duration: z.number().optional(),
    })).optional(),
    episodes: z.array(z.object({
      number: z.number(),
      title: z.string(),
      synopsis: z.string(),
      acts: z.array(z.string()),
    })).optional(),
    narrative: z.object({
      setup: z.string(),
      conflict: z.string(),
      resolution: z.string(),
    }).optional(),
  }).describe('Story structure details'),
  metadata: z.object({
    genre: z.string().optional(),
    themes: z.array(z.string()).optional(),
    targetLength: z.number().optional(),
    createdBy: z.string().optional(),
  }).optional(),
});

export const saveStoryStructureTool = tool({
  name: 'save_story_structure',
  description: 'Save story or episode structure to MongoDB',
  input: SaveStoryStructureInput,
  execute: async ({ storyId, title, type, structure, metadata }) => {
    try {
      const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
      const client = new MongoClient(mongoUri);

      await client.connect();
      const db = client.db('aladdin');
      const collection = db.collection('story_structures');

      const document = {
        storyId,
        title,
        type,
        structure,
        metadata: metadata || {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await collection.updateOne(
        { storyId },
        { $set: document },
        { upsert: true }
      );

      await client.close();

      return {
        success: true,
        storyId,
        operation: result.upsertedId ? 'created' : 'updated',
        message: `Story structure '${title}' saved successfully`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to save story structure',
      };
    }
  },
});
