/**
 * Assemble Scene Tool
 */

import { z } from 'zod'
import { tool } from '@codebuff/sdk'
import { assembleScene } from '@/lib/video/assembleScene'

const AssembleSceneInput = z.object({
  projectId: z.string(),
  sceneId: z.string(),
  clips: z.array(z.object({
    videoUrl: z.string(),
    duration: z.number(),
    startTime: z.number().optional(),
    endTime: z.number().optional(),
  })),
  transitions: z.array(z.object({
    type: z.enum(['cut', 'fade', 'dissolve', 'wipe']),
    position: z.number(),
    duration: z.number().optional(),
  })).optional(),
  audioTracks: z.array(z.object({
    url: z.string(),
    type: z.enum(['dialogue', 'music', 'sfx']),
    startTime: z.number(),
    volume: z.number().optional(),
  })).optional(),
})

export const assembleSceneTool = tool({
  name: 'assemble_scene',
  description: 'Assemble scene from multiple video clips with transitions and audio tracks',
  input: AssembleSceneInput,
  execute: async (input) => {
    try {
      const result = await assembleScene(input, input.projectId, input.sceneId)
      return result.success ? {
        success: true,
        mediaId: result.mediaId,
        url: result.url,
        duration: result.duration,
        message: `Scene assembled: ${result.clipCount} clips`
      } : { success: false, error: result.error }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  },
})
