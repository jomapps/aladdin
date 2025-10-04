/**
 * Query Brain Tool
 * Semantic search across project knowledge using Neo4j brain service
 */

import { z } from 'zod'
import type { AladdinTool } from '../types'
import { getBrainClient } from '@/lib/brain/client'

export const queryBrainTool: AladdinTool = {
  name: 'query_brain',
  description:
    'Query the Neo4j brain service for semantic search across project knowledge. Use this to find relevant information about characters, scenes, story elements, and production data.',
  parameters: z.object({
    query: z.string().describe('Natural language query to search for'),
    projectId: z.string().optional().describe('Project ID to search within (uses context if not provided)'),
    limit: z.number().optional().describe('Maximum number of results to return (default: 10)'),
    minScore: z.number().optional().describe('Minimum relevance score (0-1, default: 0.7)'),
  }),
  execute: async (args, context) => {
    const brainClient = getBrainClient()

    const results = await brainClient.query({
      query: args.query,
      projectId: args.projectId || context.projectId,
      limit: args.limit || 10,
      minScore: args.minScore || 0.7,
    })

    return {
      success: true,
      results: results.nodes || [],
      count: results.nodes?.length || 0,
    }
  },
}

