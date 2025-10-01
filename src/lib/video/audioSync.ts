/**
 * Phase 6: Audio Synchronization
 * Manages audio track integration with video
 */

import type { SceneAssemblyConfig } from '../fal/types'

export type AudioTrackType = 'dialogue' | 'music' | 'sfx'

export interface AudioTrack {
  url: string
  type: AudioTrackType
  startTime: number // seconds
  volume?: number // 0-1
  fadeIn?: number // seconds
  fadeOut?: number // seconds
}

/**
 * Sync multiple audio tracks with video
 */
export async function syncAudioTracks(
  videoUrl: string,
  audioTracks: SceneAssemblyConfig['audioTracks']
): Promise<string | null> {
  if (!audioTracks || audioTracks.length === 0) {
    return videoUrl
  }

  try {
    // Sort tracks by priority: dialogue > sfx > music
    const sortedTracks = sortTracksByPriority(audioTracks)

    // Mix audio tracks with proper levels
    const mixedAudioUrl = await mixAudioTracks(sortedTracks)
    if (!mixedAudioUrl) {
      return null
    }

    // Sync with video
    const syncedVideoUrl = await syncAudioWithVideo(videoUrl, mixedAudioUrl)
    return syncedVideoUrl
  } catch (error) {
    console.error('Audio sync failed:', error)
    return null
  }
}

/**
 * Sort audio tracks by priority
 */
function sortTracksByPriority(
  tracks: NonNullable<SceneAssemblyConfig['audioTracks']>
): AudioTrack[] {
  const priorityOrder = { dialogue: 0, sfx: 1, music: 2 }
  return [...tracks].sort((a, b) => priorityOrder[a.type] - priorityOrder[b.type])
}

/**
 * Mix multiple audio tracks
 */
async function mixAudioTracks(tracks: AudioTrack[]): Promise<string | null> {
  try {
    // In production, would use ffmpeg to mix audio
    // Apply volume normalization, crossfades, etc.

    // ffmpeg -i audio1.mp3 -i audio2.mp3 -filter_complex "[0:a][1:a]amix=inputs=2:duration=longest" output.mp3

    return tracks[0].url // Placeholder
  } catch (error) {
    console.error('Audio mixing failed:', error)
    return null
  }
}

/**
 * Sync audio track with video
 */
async function syncAudioWithVideo(
  videoUrl: string,
  audioUrl: string
): Promise<string | null> {
  try {
    // In production, would use ffmpeg to replace/add audio track
    // ffmpeg -i video.mp4 -i audio.mp3 -c:v copy -map 0:v:0 -map 1:a:0 output.mp4

    return videoUrl // Placeholder
  } catch (error) {
    console.error('Audio-video sync failed:', error)
    return null
  }
}

/**
 * Apply audio normalization
 */
export async function normalizeAudio(audioUrl: string): Promise<string | null> {
  try {
    // Apply loudness normalization (EBU R128 standard)
    // ffmpeg -i input.mp3 -af loudnorm=I=-16:TP=-1.5:LRA=11 output.mp3

    return audioUrl // Placeholder
  } catch (error) {
    console.error('Audio normalization failed:', error)
    return null
  }
}

/**
 * Apply fade in/out to audio track
 */
export async function applyAudioFade(
  audioUrl: string,
  fadeIn: number = 0,
  fadeOut: number = 0,
  duration: number
): Promise<string | null> {
  try {
    if (fadeIn === 0 && fadeOut === 0) {
      return audioUrl
    }

    // ffmpeg -i input.mp3 -af "afade=t=in:st=0:d=2,afade=t=out:st=8:d=2" output.mp3

    return audioUrl // Placeholder
  } catch (error) {
    console.error('Audio fade failed:', error)
    return null
  }
}

/**
 * Layer audio tracks with ducking (reduce music when dialogue plays)
 */
export async function applyDucking(
  musicTrackUrl: string,
  dialogueTrackUrl: string,
  duckingLevel: number = 0.3 // Reduce music to 30% during dialogue
): Promise<string | null> {
  try {
    // Use sidechain compression to duck music when dialogue is present
    // ffmpeg -i music.mp3 -i dialogue.mp3 -filter_complex "[0:a][1:a]sidechaincompress=threshold=0.1:ratio=20" output.mp3

    return musicTrackUrl // Placeholder
  } catch (error) {
    console.error('Ducking application failed:', error)
    return null
  }
}

/**
 * Validate audio track configuration
 */
export function validateAudioTracks(
  tracks: SceneAssemblyConfig['audioTracks'],
  videoDuration: number
): {
  valid: boolean
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []

  if (!tracks || tracks.length === 0) {
    return { valid: true, errors, warnings }
  }

  tracks.forEach((track, index) => {
    // Check start time
    if (track.startTime < 0) {
      errors.push(`Track ${index + 1} has negative start time`)
    }

    if (track.startTime > videoDuration) {
      warnings.push(`Track ${index + 1} starts after video ends (${track.startTime}s > ${videoDuration}s)`)
    }

    // Check volume
    if (track.volume !== undefined && (track.volume < 0 || track.volume > 1)) {
      errors.push(`Track ${index + 1} volume ${track.volume} is out of range (0-1)`)
    }

    // Check fades
    if (track.fadeIn && track.fadeIn < 0) {
      errors.push(`Track ${index + 1} has negative fade-in duration`)
    }

    if (track.fadeOut && track.fadeOut < 0) {
      errors.push(`Track ${index + 1} has negative fade-out duration`)
    }
  })

  // Check for overlapping dialogue tracks
  const dialogueTracks = tracks.filter((t) => t.type === 'dialogue')
  if (dialogueTracks.length > 1) {
    warnings.push('Multiple dialogue tracks detected. Ensure they do not overlap.')
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Get recommended audio levels by track type
 */
export function getRecommendedAudioLevels(): Record<AudioTrackType, number> {
  return {
    dialogue: 1.0, // Full volume, highest priority
    sfx: 0.8, // Slightly reduced
    music: 0.5, // Background level
  }
}

/**
 * Calculate audio mix for scene
 */
export function calculateAudioMix(tracks: AudioTrack[]): {
  dialogue: number
  music: number
  sfx: number
} {
  const levels = {
    dialogue: 1.0,
    music: 0.5,
    sfx: 0.8,
  }

  // If dialogue present, duck music more
  const hasDialogue = tracks.some((t) => t.type === 'dialogue')
  if (hasDialogue) {
    levels.music = 0.3 // Duck music when dialogue plays
  }

  return levels
}
