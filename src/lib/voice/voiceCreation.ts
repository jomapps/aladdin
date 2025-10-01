/**
 * Phase 6: Custom Voice Creation
 * Creates character voices using ElevenLabs
 */

import { getElevenLabsClient } from './client'

export interface CreateVoiceOptions {
  characterName: string
  characterDescription?: string
  voiceCharacteristics: {
    age: 'young' | 'middle-aged' | 'old'
    gender: 'male' | 'female' | 'neutral'
    accent?: string
    tone?: 'warm' | 'cold' | 'energetic' | 'calm'
    pace?: 'fast' | 'medium' | 'slow'
  }
  sampleAudioUrls?: string[]
}

export interface VoiceCreationResult {
  success: boolean
  voiceId?: string
  voiceName?: string
  error?: string
}

/**
 * Create custom voice for character
 */
export async function createCustomVoice(
  options: CreateVoiceOptions
): Promise<VoiceCreationResult> {
  try {
    const client = getElevenLabsClient()

    // If sample audio provided, use instant voice cloning
    if (options.sampleAudioUrls && options.sampleAudioUrls.length > 0) {
      const voice = await client.createVoice({
        name: `${options.characterName}_voice`,
        description: options.characterDescription,
        files: options.sampleAudioUrls,
        labels: {
          age: options.voiceCharacteristics.age,
          gender: options.voiceCharacteristics.gender,
          accent: options.voiceCharacteristics.accent || 'neutral',
          tone: options.voiceCharacteristics.tone || 'neutral',
        },
      })

      return {
        success: true,
        voiceId: voice.voice_id,
        voiceName: voice.name,
      }
    }

    // Otherwise, select from pre-made voices
    const voices = await client.getVoices()
    const matchingVoice = findMatchingVoice(voices.voices, options.voiceCharacteristics)

    if (!matchingVoice) {
      return {
        success: false,
        error: 'No matching voice found for character characteristics',
      }
    }

    return {
      success: true,
      voiceId: matchingVoice.voice_id,
      voiceName: matchingVoice.name,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Voice creation failed',
    }
  }
}

/**
 * Find matching voice from library
 */
function findMatchingVoice(voices: any[], characteristics: CreateVoiceOptions['voiceCharacteristics']): any | null {
  // Filter by gender
  let candidates = voices.filter((voice) => {
    const labels = voice.labels || {}
    return labels.gender === characteristics.gender || !labels.gender
  })

  // Filter by age if specified
  if (characteristics.age) {
    const ageMatch = candidates.filter((voice) => {
      const labels = voice.labels || {}
      return labels.age === characteristics.age
    })
    if (ageMatch.length > 0) {
      candidates = ageMatch
    }
  }

  // Filter by accent if specified
  if (characteristics.accent) {
    const accentMatch = candidates.filter((voice) => {
      const labels = voice.labels || {}
      return labels.accent === characteristics.accent
    })
    if (accentMatch.length > 0) {
      candidates = accentMatch
    }
  }

  // Return first match or null
  return candidates.length > 0 ? candidates[0] : null
}

/**
 * Test voice quality
 */
export async function testVoiceQuality(
  voiceId: string,
  testText: string = 'Hello, this is a test of the voice.'
): Promise<{
  success: boolean
  audioBuffer?: Buffer
  error?: string
}> {
  try {
    const client = getElevenLabsClient()

    const audioBuffer = await client.textToSpeech({
      text: testText,
      voiceId,
    })

    return {
      success: true,
      audioBuffer,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Voice test failed',
    }
  }
}
