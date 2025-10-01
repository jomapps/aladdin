/**
 * Generate Video Tool
 * Triggers video generation via FAL.ai with all 4 methods
 */

import { z } from 'zod'
import { tool } from '@codebuff/sdk'
import { generateVideo } from '@/lib/video/generateVideo'

const GenerateVideoInput = z.object({
  type: z.enum(['text-to-video', 'image-to-video', 'first-last-frame', 'composite-to-video']),
  prompt: z.string(),
  projectId: z.string(),
  sceneId: z.string().optional(),
  model: z.string().optional(),
  duration: z.number().max(7).optional(),
  fps: z.number().optional(),
  resolution: z.object({ width: z.number(), height: z.number() }).optional(),
  imageUrl: z.string().optional(),
  firstFrameUrl: z.string().optional(),
  lastFrameUrl: z.string().optional(),
  compositeImageUrl: z.string().optional(),
  motionStrength: z.number().min(0).max(1).optional(),
  cameraMovement: z.object({
    type: z.enum(['pan-left', 'pan-right', 'zoom-in', 'zoom-out', 'dolly', 'crane', 'static']),
    speed: z.enum(['slow', 'medium', 'fast']).optional(),
  }).optional(),
})

export const generateVideoTool = tool({
  name: 'generate_video',
  description: 'Generate video using one of 4 methods: text-to-video, image-to-video, first-last-frame, or composite-to-video. Max 7 seconds duration.',
  input: GenerateVideoInput,
  execute: async (input) => {
    try {
      const request: any = {
        type: input.type,
        prompt: input.prompt,
        model: input.model,
        duration: Math.min(input.duration || 5, 7),
        fps: input.fps,
        resolution: input.resolution,
        motionStrength: input.motionStrength,
      }

      // Add type-specific fields
      if (input.type === 'image-to-video') {
        request.imageUrl = input.imageUrl
      } else if (input.type === 'first-last-frame') {
        request.firstFrameUrl = input.firstFrameUrl
        request.lastFrameUrl = input.lastFrameUrl
      } else if (input.type === 'composite-to-video') {
        request.compositeImageUrl = input.compositeImageUrl
        request.cameraMovement = input.cameraMovement
      }

      const result = await generateVideo({
        type: input.type,
        request,
        projectId: input.projectId,
        sceneId: input.sceneId,
      })

      if (!result.success) {
        return {
          success: false,
          error: result.error,
        }
      }

      return {
        success: true,
        mediaId: result.mediaId,
        url: result.url,
        duration: result.duration,
        qualityScore: result.qualityScore,
        message: `Video generated successfully: ${result.url}`,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  },
})
