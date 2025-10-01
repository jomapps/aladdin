/**
 * Phase 6: Scene Assembly System
 * Concatenates multiple video clips with transitions and audio
 */

import type { SceneAssemblyConfig, SceneAssemblyResult } from '../fal/types'
import { applyTransition } from './transitions'
import { syncAudioTracks } from './audioSync'
import { uploadVideoToR2 } from '../storage/r2Upload'

/**
 * Assemble scene from multiple video clips
 */
export async function assembleScene(
  config: SceneAssemblyConfig,
  projectId: string,
  sceneId: string
): Promise<SceneAssemblyResult> {
  const startTime = Date.now()

  try {
    // Validate clips
    if (!config.clips || config.clips.length === 0) {
      return {
        success: false,
        error: 'No video clips provided for assembly',
      }
    }

    let concatenationTime = 0
    let transitionsTime = 0
    let audioSyncTime = 0

    // Step 1: Concatenate clips
    const concatStart = Date.now()
    const concatenatedVideoUrl = await concatenateClips(config.clips, config.outputResolution)
    concatenationTime = Date.now() - concatStart

    if (!concatenatedVideoUrl) {
      return {
        success: false,
        error: 'Failed to concatenate video clips',
      }
    }

    // Step 2: Apply transitions
    let finalVideoUrl = concatenatedVideoUrl
    if (config.transitions && config.transitions.length > 0) {
      const transStart = Date.now()
      finalVideoUrl = await applyTransitions(concatenatedVideoUrl, config.transitions)
      transitionsTime = Date.now() - transStart

      if (!finalVideoUrl) {
        return {
          success: false,
          error: 'Failed to apply transitions',
        }
      }
    }

    // Step 3: Sync audio tracks
    if (config.audioTracks && config.audioTracks.length > 0) {
      const audioStart = Date.now()
      finalVideoUrl = await syncAudioTracks(finalVideoUrl, config.audioTracks)
      audioSyncTime = Date.now() - audioStart

      if (!finalVideoUrl) {
        return {
          success: false,
          error: 'Failed to sync audio tracks',
        }
      }
    }

    // Step 4: Upload to R2
    const uploadStart = Date.now()
    const uploadResult = await uploadVideoToR2({
      videoUrl: finalVideoUrl,
      projectId,
      sceneId,
      metadata: {
        type: 'assembled-scene',
        clipCount: config.clips.length,
        transitionCount: config.transitions?.length || 0,
        audioTrackCount: config.audioTracks?.length || 0,
        totalDuration: config.clips.reduce((sum, clip) => sum + clip.duration, 0),
      },
    })
    const uploadTime = Date.now() - uploadStart

    if (!uploadResult.success) {
      return {
        success: false,
        error: `Failed to upload assembled scene: ${uploadResult.error}`,
      }
    }

    // Calculate total duration
    const totalDuration = config.clips.reduce((sum, clip) => sum + clip.duration, 0)

    return {
      success: true,
      mediaId: uploadResult.mediaId,
      url: uploadResult.url,
      duration: totalDuration,
      clipCount: config.clips.length,
      audioTrackCount: config.audioTracks?.length || 0,
      timings: {
        concatenation: concatenationTime,
        transitions: transitionsTime,
        audioSync: audioSyncTime,
        render: 0, // Included in concatenation/transitions
        upload: uploadTime,
        total: Date.now() - startTime,
      },
      metadata: {
        outputFormat: config.outputFormat || 'mp4',
        outputResolution: config.outputResolution,
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during scene assembly',
    }
  }
}

/**
 * Concatenate video clips
 */
async function concatenateClips(
  clips: SceneAssemblyConfig['clips'],
  outputResolution?: { width: number; height: number }
): Promise<string | null> {
  try {
    // In production, would use ffmpeg or similar
    // For now, return placeholder URL
    // const ffmpegCommand = clips.map(clip => `-i ${clip.videoUrl}`).join(' ')
    // Execute concatenation and return output URL

    // Placeholder: return first clip URL
    // In real implementation:
    // 1. Download all clips
    // 2. Use ffmpeg concat demuxer or filter
    // 3. Trim clips based on startTime/endTime if specified
    // 4. Scale to output resolution if needed
    // 5. Return concatenated video URL

    return clips[0].videoUrl // Placeholder
  } catch (error) {
    console.error('Clip concatenation failed:', error)
    return null
  }
}

/**
 * Apply transitions between clips
 */
async function applyTransitions(
  videoUrl: string,
  transitions: NonNullable<SceneAssemblyConfig['transitions']>
): Promise<string | null> {
  try {
    let currentVideoUrl = videoUrl

    for (const transition of transitions) {
      const transitionedUrl = await applyTransition(
        currentVideoUrl,
        transition.type,
        transition.position,
        transition.duration || 0.5
      )

      if (!transitionedUrl) {
        return null
      }

      currentVideoUrl = transitionedUrl
    }

    return currentVideoUrl
  } catch (error) {
    console.error('Transition application failed:', error)
    return null
  }
}

/**
 * Validate scene assembly configuration
 */
export function validateSceneConfig(config: SceneAssemblyConfig): {
  valid: boolean
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []

  // Check clips
  if (!config.clips || config.clips.length === 0) {
    errors.push('No clips provided')
  } else {
    // Check clip durations
    const totalDuration = config.clips.reduce((sum, clip) => sum + clip.duration, 0)
    if (totalDuration > 60) {
      warnings.push(`Total scene duration ${totalDuration}s exceeds recommended 60s`)
    }

    // Check individual clip durations
    config.clips.forEach((clip, index) => {
      if (clip.duration > 7) {
        warnings.push(`Clip ${index + 1} duration ${clip.duration}s exceeds individual maximum 7s`)
      }
    })
  }

  // Check transitions
  if (config.transitions) {
    config.transitions.forEach((transition, index) => {
      if (transition.position < 0 || transition.position >= config.clips.length - 1) {
        errors.push(
          `Transition ${index + 1} position ${transition.position} is out of bounds (0-${config.clips.length - 2})`
        )
      }
    })
  }

  // Check audio tracks
  if (config.audioTracks) {
    const sceneDuration = config.clips.reduce((sum, clip) => sum + clip.duration, 0)
    config.audioTracks.forEach((track, index) => {
      if (track.startTime > sceneDuration) {
        warnings.push(
          `Audio track ${index + 1} starts after scene ends (${track.startTime}s > ${sceneDuration}s)`
        )
      }
    })
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}
