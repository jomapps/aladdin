/**
 * Character Department - Qualification System
 * Implements 360° character generation with master reference and vision-based descriptions
 *
 * Pipeline:
 * 1. Fetch raw characters from gather DB
 * 2. Generate master reference using fal-ai/nano-banana
 * 3. Generate 6x 360° views in PARALLEL using fal-ai/nano-banana/edit
 * 4. Generate descriptions using fal-ai/moondream2/visual-query
 * 5. Store in qualified DB (character_profiles collection)
 * 6. Ingest each character into brain service
 */

import axios from 'axios'
import { getGatherCollection, type GatherItem } from '@/lib/db/gatherDatabase'
import { getOpenCollection } from '@/lib/db/openDatabase'
import type { Collection } from 'mongodb'

// Environment variables
const FAL_KEY = process.env.FAL_KEY
const BRAIN_SERVICE_API_KEY = process.env.BRAIN_SERVICE_API_KEY
const BRAIN_SERVICE_BASE_URL = process.env.BRAIN_SERVICE_BASE_URL || 'https://brain.ft.tc'

// FAL.ai endpoints
const FAL_NANO_BANANA = 'https://fal.run/fal-ai/nano-banana'
const FAL_NANO_BANANA_EDIT = 'https://fal.run/fal-ai/nano-banana/edit'
const FAL_MOONDREAM_VISUAL_QUERY = 'https://fal.run/fal-ai/moondream2/visual-query'

// 360° view angles
const ANGLES_360 = [
  'front',
  'back',
  'left_side',
  'right_side',
  'three_quarter_left',
  'three_quarter_right',
] as const

export type CharacterAngle = typeof ANGLES_360[number]

// Character Profile Schema
export interface CharacterProfile {
  characterId: string
  projectId: string
  name: string
  description: string
  masterReference: {
    url: string
    prompt: string
    seed?: number
  }
  views360: Array<{
    angle: CharacterAngle
    url: string
    description: string
    prompt: string
  }>
  brainIngested: boolean
  brainNodeId?: string
  qualityScore?: number
  createdAt: Date
  updatedAt: Date
}

// Generation result types
interface MasterReferenceResult {
  url: string
  seed?: number
}

interface View360Result {
  angle: CharacterAngle
  url: string
  description: string
  prompt: string
}

/**
 * Character Department - Main Class
 */
export class CharacterDepartment {
  private projectId: string

  constructor(projectId: string) {
    this.projectId = projectId

    if (!FAL_KEY) {
      throw new Error('FAL_KEY environment variable is required')
    }
    if (!BRAIN_SERVICE_API_KEY) {
      throw new Error('BRAIN_SERVICE_API_KEY environment variable is required')
    }
  }

  /**
   * Process all characters from gather DB
   */
  async processGatherCharacters(): Promise<CharacterProfile[]> {
    console.log('[CharacterDept] Starting character qualification pipeline...')

    // 1. Get raw characters from gather
    const gatherItems = await this.getGatherCharacters()
    console.log(`[CharacterDept] Found ${gatherItems.length} raw characters`)

    if (gatherItems.length === 0) {
      console.log('[CharacterDept] No characters to process')
      return []
    }

    // 2. Process each character
    const profiles: CharacterProfile[] = []

    for (const item of gatherItems) {
      try {
        console.log(`[CharacterDept] Processing character: ${item.summary}`)

        const profile = await this.qualifyCharacter(item)
        profiles.push(profile)

        console.log(`[CharacterDept] ✅ Character qualified: ${profile.name}`)
      } catch (error) {
        console.error(`[CharacterDept] ❌ Failed to qualify character ${item.summary}:`, error)
        // Continue with next character
      }
    }

    console.log(`[CharacterDept] Completed: ${profiles.length}/${gatherItems.length} characters qualified`)
    return profiles
  }

  /**
   * Qualify a single character through the full pipeline
   */
  private async qualifyCharacter(gatherItem: GatherItem): Promise<CharacterProfile> {
    const characterId = gatherItem._id!.toString()

    // Step 1: Generate master reference
    console.log(`[CharacterDept] 1. Generating master reference...`)
    const masterRef = await this.generateMasterReference(gatherItem)

    // Step 2: Generate 360° views in PARALLEL
    console.log(`[CharacterDept] 2. Generating 6x 360° views in parallel...`)
    const views360 = await this.generate360Views(masterRef.url, gatherItem)

    // Step 3: Build character profile
    const profile: CharacterProfile = {
      characterId,
      projectId: this.projectId,
      name: gatherItem.summary,
      description: gatherItem.context,
      masterReference: {
        url: masterRef.url,
        prompt: this.buildMasterPrompt(gatherItem),
        seed: masterRef.seed,
      },
      views360,
      brainIngested: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // Step 4: Store in qualified DB
    await this.storeCharacterProfile(profile)

    // Step 5: Ingest into brain service
    console.log(`[CharacterDept] 5. Ingesting character into brain...`)
    const brainNodeId = await this.ingestCharacterToBrain(profile)
    profile.brainIngested = true
    profile.brainNodeId = brainNodeId

    // Update profile with brain info
    await this.updateCharacterProfile(characterId, {
      brainIngested: true,
      brainNodeId,
    })

    return profile
  }

  /**
   * Get raw characters from gather database
   */
  private async getGatherCharacters(): Promise<GatherItem[]> {
    const collection = await getGatherCollection(this.projectId)

    // Get all character-related gather items
    // Assumes characters are marked in some way - adjust query as needed
    const items = await collection
      .find({
        projectId: this.projectId,
        $or: [
          { summary: /character/i },
          { context: /character/i },
          { 'automationMetadata.department': 'character' },
        ],
      })
      .toArray()

    return items
  }

  /**
   * Generate master reference image using fal-ai/nano-banana
   */
  private async generateMasterReference(gatherItem: GatherItem): Promise<MasterReferenceResult> {
    const prompt = this.buildMasterPrompt(gatherItem)

    try {
      const response = await axios.post(
        FAL_NANO_BANANA,
        {
          prompt,
          num_images: 1,
          output_format: 'png',
          aspect_ratio: '1:1',
        },
        {
          headers: {
            'Authorization': `Key ${FAL_KEY}`,
            'Content-Type': 'application/json',
          },
          timeout: 60000,
        }
      )

      const imageUrl = response.data.images[0]?.url
      if (!imageUrl) {
        throw new Error('No image URL in FAL.ai response')
      }

      console.log(`[CharacterDept] Master reference generated: ${imageUrl}`)
      return {
        url: imageUrl,
        seed: response.data.seed,
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`FAL.ai master generation failed: ${error.response?.data?.error || error.message}`)
      }
      throw error
    }
  }

  /**
   * Generate 6x 360° views in PARALLEL using fal-ai/nano-banana/edit
   */
  private async generate360Views(
    masterUrl: string,
    gatherItem: GatherItem
  ): Promise<View360Result[]> {
    // Generate all 6 views in parallel
    const viewPromises = ANGLES_360.map(angle =>
      this.generateSingleView(masterUrl, angle, gatherItem)
    )

    const views = await Promise.all(viewPromises)
    console.log(`[CharacterDept] Generated ${views.length} 360° views`)

    return views
  }

  /**
   * Generate single 360° view with description
   */
  private async generateSingleView(
    masterUrl: string,
    angle: CharacterAngle,
    gatherItem: GatherItem
  ): Promise<View360Result> {
    const prompt = this.build360Prompt(angle, gatherItem)

    try {
      // Generate rotated view using nano-banana/edit
      const imageResponse = await axios.post(
        FAL_NANO_BANANA_EDIT,
        {
          prompt,
          image_urls: [masterUrl],
          num_images: 1,
          output_format: 'png',
        },
        {
          headers: {
            'Authorization': `Key ${FAL_KEY}`,
            'Content-Type': 'application/json',
          },
          timeout: 60000,
        }
      )

      const imageUrl = imageResponse.data.images[0]?.url
      if (!imageUrl) {
        throw new Error(`No image URL for angle: ${angle}`)
      }

      // Generate description using moondream2
      const description = await this.generateImageDescription(imageUrl, angle, gatherItem)

      console.log(`[CharacterDept] Generated ${angle} view`)

      return {
        angle,
        url: imageUrl,
        description,
        prompt,
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Failed to generate ${angle} view: ${error.response?.data?.error || error.message}`)
      }
      throw error
    }
  }

  /**
   * Generate image description using fal-ai/moondream2/visual-query
   */
  async generateImageDescription(
    imageUrl: string,
    angle: CharacterAngle,
    gatherItem: GatherItem
  ): Promise<string> {
    const descriptionPrompt = `Describe this ${angle} view of ${gatherItem.summary} in detail. Include visible features, clothing, expression, pose, and lighting. Be specific and descriptive.`

    try {
      const response = await axios.post(
        FAL_MOONDREAM_VISUAL_QUERY,
        {
          image_url: imageUrl,
          prompt: descriptionPrompt,
        },
        {
          headers: {
            'Authorization': `Key ${FAL_KEY}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      )

      const description = response.data.output
      if (!description) {
        throw new Error('No description in moondream2 response')
      }

      return description
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(`[CharacterDept] Description generation failed for ${angle}:`, error.response?.data)
        // Fallback to basic description
        return `${angle} view of ${gatherItem.summary} - ${gatherItem.context}`
      }
      throw error
    }
  }

  /**
   * Ingest character into brain service
   * Max 3 references per brain request as per spec
   */
  async ingestCharacterToBrain(profile: CharacterProfile): Promise<string> {
    const retryLimit = 3
    let attempt = 0

    while (attempt < retryLimit) {
      try {
        // Prepare references (max 3)
        const references = [
          profile.masterReference.url,
          ...profile.views360.slice(0, 2).map(v => v.url),
        ].slice(0, 3)

        // Prepare knowledge text with all 360° descriptions
        const knowledgeText = [
          `Character: ${profile.name}`,
          `Description: ${profile.description}`,
          '',
          'Master Reference:',
          `- ${profile.masterReference.prompt}`,
          '',
          '360° Views:',
          ...profile.views360.map(v => `- ${v.angle}: ${v.description}`),
        ].join('\n')

        // Store in brain service
        const response = await axios.post(
          `${BRAIN_SERVICE_BASE_URL}/api/v1/knowledge/store`,
          {
            project_id: this.projectId,
            text: knowledgeText,
            metadata: {
              type: 'character',
              characterId: profile.characterId,
              name: profile.name,
              references: references,
              views360: profile.views360.map(v => ({
                angle: v.angle,
                url: v.url,
              })),
              masterReference: profile.masterReference.url,
            },
          },
          {
            headers: {
              'Authorization': `Bearer ${BRAIN_SERVICE_API_KEY}`,
              'Content-Type': 'application/json',
            },
            timeout: 30000,
          }
        )

        const nodeId = response.data.node_id || response.data.id
        if (!nodeId) {
          throw new Error('No node ID in brain service response')
        }

        console.log(`[CharacterDept] Brain ingestion successful: ${nodeId}`)
        return nodeId
      } catch (error) {
        attempt++
        console.error(`[CharacterDept] Brain ingestion attempt ${attempt}/${retryLimit} failed:`, error)

        if (attempt >= retryLimit) {
          if (axios.isAxiosError(error)) {
            throw new Error(`Brain ingestion failed after ${retryLimit} attempts: ${error.response?.data?.error || error.message}`)
          }
          throw error
        }

        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)))
      }
    }

    throw new Error('Brain ingestion failed: max retries exceeded')
  }

  /**
   * Store character profile in qualified database
   */
  private async storeCharacterProfile(profile: CharacterProfile): Promise<void> {
    const collection = await getOpenCollection(this.projectId, 'character_profiles')

    await collection.insertOne({
      ...profile,
      name: profile.name,
      projectId: this.projectId,
      collectionName: 'character_profiles',
      version: 1,
      createdBy: 'character-department',
      createdByType: 'agent',
      qualityRating: profile.qualityScore || 0.8,
      brainValidated: profile.brainIngested,
      userApproved: false,
      content: profile,
    })

    console.log(`[CharacterDept] Stored character profile: ${profile.name}`)
  }

  /**
   * Update character profile
   */
  private async updateCharacterProfile(
    characterId: string,
    updates: Partial<CharacterProfile>
  ): Promise<void> {
    const collection = await getOpenCollection(this.projectId, 'character_profiles')

    await collection.updateOne(
      { characterId, projectId: this.projectId },
      {
        $set: {
          ...updates,
          updatedAt: new Date(),
        },
      }
    )
  }

  /**
   * Build master reference prompt
   */
  private buildMasterPrompt(gatherItem: GatherItem): string {
    return `Full body portrait of ${gatherItem.summary}. ${gatherItem.context}. Professional character design, detailed, high quality, front facing, neutral pose, clean background.`
  }

  /**
   * Build 360° view prompt
   */
  private build360Prompt(angle: CharacterAngle, gatherItem: GatherItem): string {
    const angleDescriptions: Record<CharacterAngle, string> = {
      front: 'front view, facing forward',
      back: 'back view, facing away',
      left_side: 'left side profile view',
      right_side: 'right side profile view',
      three_quarter_left: 'three-quarter left view, slightly turned left',
      three_quarter_right: 'three-quarter right view, slightly turned right',
    }

    return `${gatherItem.summary}, ${angleDescriptions[angle]}, same character, same outfit, professional character turnaround, detailed, high quality.`
  }
}

/**
 * Run character qualification pipeline
 */
export async function runCharacterQualification(projectId: string): Promise<CharacterProfile[]> {
  const department = new CharacterDepartment(projectId)
  return await department.processGatherCharacters()
}

/**
 * Process single character
 */
export async function qualifySingleCharacter(
  projectId: string,
  gatherItemId: string
): Promise<CharacterProfile> {
  const department = new CharacterDepartment(projectId)
  const collection = await getGatherCollection(projectId)

  const gatherItem = await collection.findOne({
    _id: new (require('mongodb').ObjectId)(gatherItemId),
    projectId,
  })

  if (!gatherItem) {
    throw new Error(`Gather item not found: ${gatherItemId}`)
  }

  return await (department as any).qualifyCharacter(gatherItem)
}
