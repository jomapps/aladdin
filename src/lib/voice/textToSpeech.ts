/**
 * Phase 6: Text-to-Speech Generation
 * Generates voice audio from dialogue text
 */

import { getElevenLabsClient } from './client'
import { uploadVideoToR2 } from '../storage/r2Upload'

export interface TextToSpeechOptions {
  text: string
  characterId: string
  voiceId?: string
  projectId: string
  sceneId?: string
  modelId?: string
  voiceSettings?: {
    stability?: number
    similarityBoost?: number
    style?: number
    useSpeakerBoost?: boolean
  }
}

export interface TextToSpeechResult {
  success: boolean
  mediaId?: string
  audioUrl?: string
  duration?: number
  error?: string
}

/**
 * Generate speech from text
 */
export async function generateTextToSpeech(
  options: TextToSpeechOptions
): Promise<TextToSpeechResult> {
  try {
    const client = getElevenLabsClient()

    // Get voice ID (from character profile or options)
    const voiceId = options.voiceId || (await getCharacterVoiceId(options.characterId))

    if (!voiceId) {
      return {
        success: false,
        error: `No voice configured for character ${options.characterId}`,
      }
    }

    // Generate speech
    const audioBuffer = await client.textToSpeech({
      text: options.text,
      voiceId,
      modelId: options.modelId,
      stability: options.voiceSettings?.stability,
      similarityBoost: options.voiceSettings?.similarityBoost,
      style: options.voiceSettings?.style,
      useSpeakerBoost: options.voiceSettings?.useSpeakerBoost,
    })

    // Convert buffer to temporary URL for upload
    // In production, would save to temp file first
    const tempUrl = `data:audio/mpeg;base64,${audioBuffer.toString('base64')}`

    // Upload to R2
    const uploadResult = await uploadVideoToR2({
      videoUrl: tempUrl,
      projectId: options.projectId,
      sceneId: options.sceneId,
      metadata: {
        type: 'dialogue-audio',
        characterId: options.characterId,
        voiceId,
        text: options.text,
      },
    })

    if (!uploadResult.success) {
      return {
        success: false,
        error: `Failed to upload audio: ${uploadResult.error}`,
      }
    }

    // Estimate duration (rough approximation: 150 words per minute)
    const wordCount = options.text.split(/\s+/).length
    const estimatedDuration = (wordCount / 150) * 60

    return {
      success: true,
      mediaId: uploadResult.mediaId,
      audioUrl: uploadResult.url,
      duration: estimatedDuration,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Text-to-speech generation failed',
    }
  }
}

/**
 * Get character voice ID from character profile
 */
async function getCharacterVoiceId(characterId: string): Promise<string | null> {
  // In production, would query PayloadCMS for character voice profile
  // Placeholder implementation
  return null
}

/**
 * Generate dialogue for multiple characters
 */
export async function generateDialogueSequence(
  dialogue: Array<{
    characterId: string
    text: string
    voiceId?: string
  }>,
  projectId: string,
  sceneId: string
): Promise<{
  success: boolean
  audioTracks?: Array<{
    characterId: string
    mediaId: string
    url: string
    duration: number
  }>
  error?: string
}> {
  try {
    const audioTracks = []

    for (const line of dialogue) {
      const result = await generateTextToSpeech({
        text: line.text,
        characterId: line.characterId,
        voiceId: line.voiceId,
        projectId,
        sceneId,
      })

      if (!result.success) {
        return {
          success: false,
          error: `Failed to generate audio for character ${line.characterId}: ${result.error}`,
        }
      }

      audioTracks.push({
        characterId: line.characterId,
        mediaId: result.mediaId!,
        url: result.audioUrl!,
        duration: result.duration || 0,
      })
    }

    return {
      success: true,
      audioTracks,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Dialogue sequence generation failed',
    }
  }
}

/**
 * Apply voice effects to audio
 */
export function getVoiceSettings(
  characterEmotion: 'neutral' | 'happy' | 'sad' | 'angry' | 'fearful' | 'surprised'
): {
  stability: number
  similarityBoost: number
  style: number
} {
  const emotionSettings = {
    neutral: { stability: 0.5, similarityBoost: 0.75, style: 0.0 },
    happy: { stability: 0.6, similarityBoost: 0.8, style: 0.2 },
    sad: { stability: 0.4, similarityBoost: 0.7, style: -0.2 },
    angry: { stability: 0.3, similarityBoost: 0.9, style: 0.5 },
    fearful: { stability: 0.3, similarityBoost: 0.65, style: -0.3 },
    surprised: { stability: 0.5, similarityBoost: 0.85, style: 0.3 },
  }

  return emotionSettings[characterEmotion]
}
