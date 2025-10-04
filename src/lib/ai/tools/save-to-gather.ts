/**
 * Save to Gather Tool
 * Save unqualified content to the gather database
 */

import { z } from 'zod'
import type { AladdinTool } from '../types'
import { gatherDB } from '@/lib/db/gatherDatabase'

export const saveToGatherTool: AladdinTool = {
  name: 'save_to_gather',
  description:
    'Save content to the gather database (unqualified content staging area). Use this to store generated content, ideas, or drafts that need review before qualification.',
  parameters: z.object({
    content: z.string().describe('Content to save'),
    summary: z.string().optional().describe('Brief summary of the content'),
    context: z.string().optional().describe('Context about where this content came from or how it should be used'),
    type: z.string().optional().describe('Content type (e.g., character-idea, scene-draft, dialogue-snippet)'),
    metadata: z.record(z.any()).optional().describe('Additional metadata'),
  }),
  execute: async (args, context) => {
    const result = await gatherDB.save({
      projectId: context.projectId,
      content: args.content,
      summary: args.summary,
      context: args.context,
      type: args.type,
      metadata: args.metadata,
      createdBy: context.userId || 'ai-agent',
      createdByType: 'agent',
    })

    return {
      success: true,
      id: result.id,
      message: 'Content saved to gather database',
    }
  },
}

