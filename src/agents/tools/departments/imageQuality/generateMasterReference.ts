/**
 * Generate Master Reference Tool
 * Triggers master reference image generation via FAL.ai
 */

import { z } from 'zod'
import { tool } from '@codebuff/sdk'
import { generateMasterReference } from '@/lib/images/masterReference'

const GenerateMasterReferenceInput = z.object({
  subjectType: z.enum(['character', 'location', 'object']).describe('Type of subject'),
  subjectId: z.string().describe('Unique identifier for the subject'),
  description: z.string().describe('Detailed visual description'),
  projectId: z.string().describe('Project identifier'),
  styleGuide: z
    .object({
      colorPalette: z.array(z.string()).optional(),
      artStyle: z.string().optional(),
      lighting: z.string().optional(),
      mood: z.string().optional(),
    })
    .optional()
    .describe('Style guide specifications'),
  resolution: z
    .object({
      width: z.number().default(1024),
      height: z.number().default(1024),
    })
    .optional()
    .describe('Image resolution'),
  model: z.string().optional().describe('FAL.ai model to use'),
  qualityThreshold: z.number().min(0).max(1).optional().describe('Minimum quality threshold'),
})

export const generateMasterReferenceTool = tool({
  name: 'generate_master_reference',
  description:
    'Generate a master reference image for a character, location, or object using FAL.ai. This creates the definitive visual reference that all subsequent images must match.',
  input: GenerateMasterReferenceInput,
  execute: async ({
    subjectType,
    subjectId,
    description,
    projectId,
    styleGuide,
    resolution,
    model,
    qualityThreshold,
  }) => {
    try {
      const result = await generateMasterReference({
        subjectType,
        subjectId,
        description,
        projectId,
        styleGuide,
        resolution,
        model: model as any,
        qualityThreshold,
      })

      if (!result.success) {
        return {
          success: false,
          error: result.error,
          message: 'Failed to generate master reference',
        }
      }

      return {
        success: true,
        mediaId: result.mediaId,
        url: result.url,
        width: result.width,
        height: result.height,
        seed: result.seed,
        timings: result.timings,
        metadata: result.metadata,
        message: `Master reference generated successfully: ${result.url}`,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Exception during master reference generation',
      }
    }
  },
})
