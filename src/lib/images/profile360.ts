/**
 * Phase 5: 360° Profile Generation
 * Generates 12 images at 30° intervals around a character/object
 */

import { getFalClient } from '../fal/client'
import { getBrainClient } from '../brain/client'
import type {
  Profile360Config,
  Profile360Result,
  FalGenerateImageWithReferenceRequest,
} from '../fal/types'
import axios from 'axios'

const DEFAULT_ANGLES = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330]

/**
 * Generate 360° profile images (12 images at 30° intervals)
 */
export async function generate360Profile(
  config: Profile360Config
): Promise<Profile360Result> {
  const startTime = Date.now()

  try {
    // 1. Get master reference image from Brain
    const brainClient = getBrainClient()
    const masterRef = await brainClient.getNode(config.masterReferenceId)

    if (!masterRef || !masterRef.properties.imageUrl) {
      throw new Error(`Master reference ${config.masterReferenceId} not found`)
    }

    const masterImageUrl = masterRef.properties.imageUrl
    const basePrompt = masterRef.properties.prompt || 'Character reference'

    // 2. Prepare angles
    const angles = config.angles || DEFAULT_ANGLES
    if (angles.length !== 12) {
      throw new Error('360° profile requires exactly 12 angles')
    }

    // 3. Generate images in parallel batches
    const falClient = getFalClient()
    const batchSize = config.parallelBatches || 3
    const results: Array<{ angle: number; mediaId: string; url: string }> = []

    for (let i = 0; i < angles.length; i += batchSize) {
      const batch = angles.slice(i, i + batchSize)

      const batchPromises = batch.map(async (angle) => {
        // Build angle-specific prompt
        const anglePrompt = buildAnglePrompt(basePrompt, angle)

        const request: FalGenerateImageWithReferenceRequest = {
          prompt: anglePrompt,
          model: config.model || 'fal-ai/flux/dev',
          referenceImages: [
            {
              url: masterImageUrl,
              weight: 1.0,
              type: 'character',
            },
          ],
          imageSize: config.resolution || { width: 1024, height: 1024 },
          numImages: 1,
          guidance: 8.0,
          steps: 30,
          controlnetStrength: 0.85,
          ipAdapterScale: 0.7,
          format: 'png',
        }

        // Generate image
        const falResponse = await falClient.generateImageWithReference(request)

        if (!falResponse.images || falResponse.images.length === 0) {
          throw new Error(`Failed to generate image for angle ${angle}°`)
        }

        const generatedImage = falResponse.images[0]

        // Upload to Payload
        const mediaRecord = await uploadToPayload(generatedImage.url, {
          filename: `profile360-${config.subjectId}-${angle}deg-${Date.now()}.png`,
          alt: `360° profile ${angle}° view of ${config.subjectId}`,
          projectId: config.projectId,
          subjectId: config.subjectId,
          masterReferenceId: config.masterReferenceId,
          referenceType: 'profile360',
          angle,
          generationMetadata: {
            prompt: anglePrompt,
            model: request.model,
            seed: falResponse.seed,
          },
        })

        return {
          angle,
          mediaId: mediaRecord.id,
          url: mediaRecord.url,
        }
      })

      // Wait for batch to complete
      const batchResults = await Promise.all(batchPromises)
      results.push(...batchResults)

      // Brief delay between batches to respect rate limits
      if (i + batchSize < angles.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    }

    // 4. Store 360° profile set in Brain
    await brainClient.addNode({
      type: 'concept',
      properties: {
        entityType: 'profile360',
        subjectId: config.subjectId,
        projectId: config.projectId,
        masterReferenceId: config.masterReferenceId,
        images: results,
        angles,
        createdAt: new Date().toISOString(),
      },
    })

    // 5. Create relationships
    for (const result of results) {
      await brainClient.addRelationship({
        fromNodeId: config.masterReferenceId,
        toNodeId: result.mediaId,
        type: 'GENERATES',
        properties: {
          angle: result.angle,
          profileType: '360',
        },
      })
    }

    const totalTime = Date.now() - startTime

    return {
      success: true,
      images: results,
      masterReferenceId: config.masterReferenceId,
      subjectId: config.subjectId,
      totalGenerationTime: totalTime,
      metadata: {
        angles,
        model: config.model || 'fal-ai/flux/dev',
        parallelBatches: batchSize,
      },
    }
  } catch (error) {
    return {
      success: false,
      images: [],
      masterReferenceId: config.masterReferenceId,
      subjectId: config.subjectId,
      totalGenerationTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error during 360° generation',
    }
  }
}

/**
 * Build angle-specific prompt
 */
function buildAnglePrompt(basePrompt: string, angle: number): string {
  const angleDescriptions: Record<number, string> = {
    0: 'front view, facing camera directly',
    30: 'slight right turn, 30 degree angle',
    60: 'right profile, 60 degree angle',
    90: 'right side view, 90 degree profile',
    120: 'back right view, 120 degree angle',
    150: 'back view, slight right, 150 degree angle',
    180: 'back view, rear profile',
    210: 'back left view, 210 degree angle',
    240: 'left back view, 240 degree angle',
    270: 'left side view, 90 degree left profile',
    300: 'left profile, 60 degree left angle',
    330: 'slight left turn, 30 degree left angle',
  }

  const angleDesc = angleDescriptions[angle] || `${angle} degree view`
  return `${basePrompt}, ${angleDesc}, maintain exact same character features, consistent lighting`
}

/**
 * Upload image to Payload Media collection
 */
async function uploadToPayload(
  imageUrl: string,
  metadata: Record<string, any>
): Promise<{ id: string; url: string }> {
  try {
    const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' })
    const imageBuffer = Buffer.from(imageResponse.data)

    const formData = new FormData()
    const blob = new Blob([imageBuffer], { type: 'image/png' })
    formData.append('file', blob, metadata.filename)
    formData.append('alt', metadata.alt)

    Object.keys(metadata).forEach((key) => {
      if (key !== 'filename' && key !== 'alt' && typeof metadata[key] !== 'object') {
        formData.append(key, metadata[key])
      } else if (typeof metadata[key] === 'object') {
        formData.append(key, JSON.stringify(metadata[key]))
      }
    })

    const payloadUrl = process.env.PAYLOAD_PUBLIC_SERVER_URL || 'http://localhost:3000'
    const uploadResponse = await axios.post(`${payloadUrl}/api/media`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })

    return {
      id: uploadResponse.data.doc.id,
      url: uploadResponse.data.doc.url,
    }
  } catch (error) {
    throw new Error(
      `Failed to upload to Payload: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}
