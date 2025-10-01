/**
 * Get World Context Tool
 * Retrieves world building context from MongoDB
 */

import { z } from 'zod';
import { tool } from '@codebuff/sdk';
import { MongoClient } from 'mongodb';

const GetWorldContextInput = z.object({
  worldId: z.string().describe('World identifier (e.g., "agrabah")'),
  includeLocations: z.boolean().default(true).describe('Include location details'),
  includeHistory: z.boolean().default(true).describe('Include historical lore'),
  includeRules: z.boolean().default(true).describe('Include world rules/magic system'),
});

export const getWorldContextTool = tool({
  name: 'get_world_context',
  description: 'Retrieve world building context and lore from MongoDB',
  input: GetWorldContextInput,
  execute: async ({ worldId, includeLocations, includeHistory, includeRules }) => {
    try {
      const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
      const client = new MongoClient(mongoUri);

      await client.connect();
      const db = client.db('aladdin');
      const collection = db.collection('world_context');

      const world = await collection.findOne({ worldId });

      if (!world) {
        await client.close();
        return {
          success: false,
          error: `World '${worldId}' not found`,
          message: 'World context not available',
        };
      }

      // Build filtered response based on flags
      const response: any = {
        worldId: world.worldId,
        name: world.name,
        description: world.description,
        setting: world.setting,
      };

      if (includeLocations && world.locations) {
        response.locations = world.locations;
      }

      if (includeHistory && world.history) {
        response.history = world.history;
      }

      if (includeRules && world.rules) {
        response.rules = world.rules;
      }

      await client.close();

      return {
        success: true,
        world: response,
        message: `World context for '${world.name}' retrieved successfully`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to retrieve world context',
      };
    }
  },
});
