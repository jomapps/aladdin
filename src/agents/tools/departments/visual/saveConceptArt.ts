/**
 * Save Concept Art Tool
 * Saves concept art metadata to MongoDB
 */

import { z } from 'zod';
import { tool } from '@codebuff/sdk';
import { MongoClient } from 'mongodb';

const SaveConceptArtInput = z.object({
  artId: z.string().describe('Unique art piece identifier'),
  title: z.string().describe('Concept art title'),
  category: z.enum(['character', 'environment', 'prop', 'lighting', 'camera']).describe('Art category'),
  styleGuide: z.object({
    colorPalette: z.array(z.string()).optional(),
    mood: z.string().optional(),
    inspirations: z.array(z.string()).optional(),
    techniques: z.array(z.string()).optional(),
  }).describe('Style guide specifications'),
  visualElements: z.object({
    composition: z.string().optional(),
    lighting: z.string().optional(),
    perspective: z.string().optional(),
    details: z.array(z.string()).optional(),
  }).optional(),
  references: z.array(z.string()).optional().describe('Reference image URLs or IDs'),
  metadata: z.object({
    createdBy: z.string().optional(),
    relatedCharacters: z.array(z.string()).optional(),
    relatedScenes: z.array(z.string()).optional(),
  }).optional(),
});

export const saveConceptArtTool = tool({
  name: 'save_concept_art',
  description: 'Save concept art metadata and style guide to MongoDB',
  input: SaveConceptArtInput,
  execute: async ({ artId, title, category, styleGuide, visualElements, references, metadata }) => {
    try {
      const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
      const client = new MongoClient(mongoUri);

      await client.connect();
      const db = client.db('aladdin');
      const collection = db.collection('concept_art');

      const document = {
        artId,
        title,
        category,
        styleGuide,
        visualElements: visualElements || {},
        references: references || [],
        metadata: metadata || {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await collection.updateOne(
        { artId },
        { $set: document },
        { upsert: true }
      );

      await client.close();

      return {
        success: true,
        artId,
        operation: result.upsertedId ? 'created' : 'updated',
        message: `Concept art '${title}' saved successfully`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to save concept art',
      };
    }
  },
});
