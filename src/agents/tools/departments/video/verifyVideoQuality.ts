/**
 * Verify Video Quality Tool
 */

import { z } from 'zod'
import { tool } from '@codebuff/sdk'
import { verifyVideoQuality } from '@/lib/video/qualityCheck'

const VerifyVideoQualityInput = z.object({
  videoUrl: z.string(),
  expectedDuration: z.number().max(7),
  expectedResolution: z.object({ width: z.number(), height: z.number() }),
  minimumFps: z.number().default(24),
  checkConsistency: z.boolean().optional(),
})

export const verifyVideoQualityTool = tool({
  name: 'verify_video_quality',
  description: 'Verify video meets quality standards (duration ≤ 7s, resolution, fps, consistency)',
  input: VerifyVideoQualityInput,
  execute: async (input) => {
    try {
      const result = await verifyVideoQuality(input)
      return {
        passed: result.passed,
        overallScore: result.overallScore,
        issues: result.issues,
        recommendations: result.recommendations,
      }
    } catch (error) {
      return { passed: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  },
})
