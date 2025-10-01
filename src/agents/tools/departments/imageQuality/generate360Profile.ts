/**
 * Generate 360° Profile Tool
 * Generates 12 images at 30° intervals for turnaround sheets
 */

import { z } from 'zod'
import { tool } from '@codebuff/sdk'
import { generate360Profile } from '@/lib/images/profile360'

const Generate360ProfileInput = z.object({
  masterReferenceId: z.string().describe('Master reference image ID'),
  subjectId: z.string().describe('Subject identifier'),
  projectId: z.string().describe('Project identifier'),
  angles: z
    .array(z.number())
    .optional()
    .describe('Custom angles (default: 0°, 30°, 60°, ..., 330°)'),
  resolution: z
    .object({
      width: z.number().default(1024),
      height: z.number().default(1024),
    })
    .optional()
    .describe('Image resolution'),
  model: z.string().optional().describe('FAL.ai model to use'),
  parallelBatches: z.number().min(1).max(12).optional().describe('Number of parallel batches'),
})

export const generate360ProfileTool = tool({
  name: 'generate_360_profile',
  description:
    'Generate a complete 360° profile turnaround (12 images at 30° intervals) for a character or object. Uses master reference to ensure consistency across all angles.',
  input: Generate360ProfileInput,
  execute: async ({
    masterReferenceId,
    subjectId,
    projectId,
    angles,
    resolution,
    model,
    parallelBatches,
  }) => {
    try {
      const result = await generate360Profile({
        masterReferenceId,
        subjectId,
        projectId,
        angles,
        resolution,
        model: model as any,
        parallelBatches,
      })

      if (!result.success) {
        return {
          success: false,
          error: result.error,
          message: 'Failed to generate 360° profile',
        }
      }

      return {
        success: true,
        images: result.images,
        masterReferenceId: result.masterReferenceId,
        subjectId: result.subjectId,
        totalGenerationTime: result.totalGenerationTime,
        metadata: result.metadata,
        message: `360° profile generated successfully: ${result.images.length} images`,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Exception during 360° profile generation',
      }
    }
  },
})
