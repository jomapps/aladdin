/**
 * Verify Image Consistency Tool (Phase 5)
 * Validates image consistency using FAL.ai and Brain embeddings
 */

import { z } from 'zod'
import { tool } from '@codebuff/sdk'
import { verifyConsistency as verifyImageConsistency } from '@/lib/images/consistency'

const VerifyImageConsistencyInput = z.object({
  newImageId: z.string().describe('ID of the new image to verify'),
  referenceSetId: z.string().describe('ID of the reference set to compare against'),
  projectId: z.string().describe('Project identifier'),
  thresholds: z
    .object({
      facial: z.number().min(0).max(1).optional().describe('Facial consistency threshold'),
      color: z.number().min(0).max(1).optional().describe('Color consistency threshold'),
      style: z.number().min(0).max(1).optional().describe('Style consistency threshold'),
      overall: z.number().min(0).max(1).optional().describe('Overall consistency threshold'),
    })
    .optional()
    .describe('Consistency thresholds'),
})

export const verifyImageConsistencyTool = tool({
  name: 'verify_image_consistency',
  description:
    'Verify that a newly generated image is consistent with a reference set using Brain embeddings. Analyzes facial features, colors, style, and composition.',
  input: VerifyImageConsistencyInput,
  execute: async ({ newImageId, referenceSetId, projectId, thresholds }) => {
    try {
      const result = await verifyImageConsistency({
        newImageId,
        referenceSetId,
        projectId,
        thresholds,
      })

      if (!result.success) {
        return {
          success: false,
          error: result.error,
          message: 'Failed to verify image consistency',
        }
      }

      const statusMessage = result.passed
        ? `✓ Image consistency verification PASSED (${(result.overallConsistency * 100).toFixed(1)}%)`
        : `✗ Image consistency verification FAILED (${(result.overallConsistency * 100).toFixed(1)}%)`

      return {
        success: true,
        passed: result.passed,
        overallConsistency: result.overallConsistency,
        scores: result.scores,
        differences: result.differences,
        recommendations: result.recommendations,
        metadata: result.metadata,
        message: statusMessage,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Exception during image consistency verification',
      }
    }
  },
})
