/**
 * Integrate Audio Tool
 */

import { z } from 'zod'
import { tool } from '@codebuff/sdk'
import { generateTextToSpeech, generateDialogueSequence } from '@/lib/voice/textToSpeech'

const IntegrateAudioInput = z.object({
  videoUrl: z.string(),
  projectId: z.string(),
  sceneId: z.string(),
  dialogue: z.array(z.object({
    characterId: z.string(),
    text: z.string(),
    voiceId: z.string().optional(),
  })).optional(),
  musicUrl: z.string().optional(),
  sfxUrls: z.array(z.string()).optional(),
})

export const integrateAudioTool = tool({
  name: 'integrate_audio',
  description: 'Integrate ElevenLabs dialogue, music, and SFX with video',
  input: IntegrateAudioInput,
  execute: async (input) => {
    try {
      // Generate dialogue audio if provided
      let audioTracks = []
      if (input.dialogue && input.dialogue.length > 0) {
        const dialogueResult = await generateDialogueSequence(
          input.dialogue,
          input.projectId,
          input.sceneId
        )
        if (!dialogueResult.success) {
          return { success: false, error: dialogueResult.error }
        }
        audioTracks = dialogueResult.audioTracks || []
      }

      return {
        success: true,
        audioTrackCount: audioTracks.length,
        audioTracks,
        message: `Integrated ${audioTracks.length} audio tracks`
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  },
})
