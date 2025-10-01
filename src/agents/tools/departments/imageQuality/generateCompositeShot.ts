/**
 * Generate Composite Shot Tool
 * Creates composite images using multiple reference images
 */

import { z } from 'zod'
import { tool } from '@codebuff/sdk'
import { generateCompositeShot } from '@/lib/images/compositeShot'

const GenerateCompositeShotInput = z.object({
  description: z.string().describe('Scene description for the composite shot'),
  projectId: z.string().describe('Project identifier'),
  references: z
    .object({
      character: z
        .union([z.string(), z.array(z.string())])
        .optional()
        .describe('Character reference ID(s)'),
      clothing: z
        .union([z.string(), z.array(z.string())])
        .optional()
        .describe('Clothing reference ID(s)'),
      location: z.string().optional().describe('Location reference ID'),
      props: z.array(z.string()).optional().describe('Prop reference IDs'),
    })
    .describe('Reference images to use in composite'),
  sceneDescription: z.string().optional().describe('Additional scene context'),
  lighting: z.string().optional().describe('Lighting description'),
  cameraAngle: z.string().optional().describe('Camera angle specification'),
  resolution: z
    .object({
      width: z.number().default(1024),
      height: z.number().default(1024),
    })
    .optional()
    .describe('Image resolution'),
  model: z.string().optional().describe('FAL.ai model to use'),
})

export const generateCompositeShotTool = tool({
  name: 'generate_composite_shot',
  description:
    'Generate a composite shot by combining multiple reference images (character, clothing, location, props). Uses FAL.ai to create a cohesive final image.',
  input: GenerateCompositeShotInput,
  execute: async ({
    description,
    projectId,
    references,
    sceneDescription,
    lighting,
    cameraAngle,
    resolution,
    model,
  }) => {
    try {
      const result = await generateCompositeShot({
        description,
        projectId,
        references,
        sceneDescription,
        lighting,
        cameraAngle,
        resolution,
        model: model as any,
      })

      if (!result.success) {
        return {
          success: false,
          error: result.error,
          message: 'Failed to generate composite shot',
        }
      }

      return {
        success: true,
        mediaId: result.mediaId,
        imageUrl: result.imageUrl,
        consistencyScore: result.consistencyScore,
        usedReferences: result.usedReferences,
        metadata: result.metadata,
        message: `Composite shot generated successfully with ${result.usedReferences?.length || 0} references`,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Exception during composite shot generation',
      }
    }
  },
})
