/**
 * Story Department
 * Generates full screenplay from story bible and breaks it into scenes
 *
 * Flow:
 * 1. Get story bible + characters from qualified DB
 * 2. Generate full screenplay using LLM
 * 3. Break screenplay into 3-7s scenes using breakScreenplayIntoScenes()
 * 4. Analyze dramatic effect for each scene
 * 5. Create scene documents in PayloadCMS scenes collection
 * 6. Store screenplay in qualified DB
 */

import { getLLMClient } from '@/lib/llm/client'
import { qualifiedDB } from '@/lib/db/qualifiedDatabase'
import { getPayload } from 'payload'
import config from '@payload-config'

interface StoryBible {
  title: string
  version: string
  synopsis: string
  worldRules: any[]
  characterRelationships: any
  relationshipDetails: any[]
  timeline: any[]
  consistencyRules: any[]
  locations: any[]
  themes: any[]
  visualStyleGuide?: any
}

interface Character {
  name: string
  description: string
  role: string
  traits: any
}

interface Screenplay {
  title: string
  logline: string
  synopsis: string
  screenplay: string
  sceneCount: number
  estimatedDuration: number
}

interface Scene {
  sceneNumber: string
  sequenceOrder: number
  screenplayText: string
  expectedDuration: number // in seconds (3-7)
  dramaticEffect: {
    intensity: number // 0-10
    emotionalTone: string
    pacing: string
    visualImpact: string
    narrativeFunction: string
  }
  cameraDirection?: {
    shotType: string
    movement: string
    angle: string
    focus: string
  }
  lightingDirection?: {
    style: string
    mood: string
    keyLighting: string
    colorTemperature: string
  }
  location?: string
  timeOfDay?: string
  characters?: string[]
}

export class StoryDepartment {
  private llm = getLLMClient()

  /**
   * Process story bible and generate screenplay with scenes
   */
  async processStory(projectId: string, projectSlug: string, userId: string): Promise<{
    screenplay: Screenplay
    scenes: Scene[]
  }> {
    console.log(`[StoryDept] Processing story for project ${projectSlug}`)

    // Step 1: Get story bible and characters from qualified DB
    const { storyBible, characters } = await this.getStoryData(projectSlug)
    console.log(`[StoryDept] Retrieved story bible and ${characters.length} characters`)

    // Step 2: Generate full screenplay
    const screenplay = await this.generateScreenplay(storyBible, characters)
    console.log(`[StoryDept] Generated screenplay: ${screenplay.sceneCount} scenes, ${screenplay.estimatedDuration}s`)

    // Step 3: Break screenplay into 3-7s scenes
    const scenes = await this.breakScreenplayIntoScenes(screenplay, storyBible)
    console.log(`[StoryDept] Broke screenplay into ${scenes.length} scenes`)

    // Step 4: Create scene documents in PayloadCMS
    await this.createScenesInPayloadCMS(scenes, projectId)
    console.log(`[StoryDept] Created ${scenes.length} scenes in PayloadCMS`)

    // Step 5: Store screenplay in qualified DB
    await this.storeScreenplayInQualifiedDB(projectSlug, screenplay, projectId, userId)
    console.log(`[StoryDept] Stored screenplay in qualified DB`)

    return { screenplay, scenes }
  }

  /**
   * Get story bible and characters from qualified DB
   */
  private async getStoryData(projectSlug: string): Promise<{
    storyBible: StoryBible
    characters: Character[]
  }> {
    // Get story bible
    const storyBibleItems = await qualifiedDB.getQualifiedItems(
      projectSlug,
      'story_bible',
      { limit: 1, sort: 'latest' }
    )

    if (storyBibleItems.items.length === 0) {
      throw new Error('Story bible not found. Run world department first.')
    }

    const storyBible = storyBibleItems.items[0].content as StoryBible

    // Get characters
    const characterItems = await qualifiedDB.getQualifiedItems(
      projectSlug,
      'characters',
      { limit: 100 }
    )

    const characters = characterItems.items.map(item => item.content as Character)

    return { storyBible, characters }
  }

  /**
   * Generate full screenplay using LLM
   */
  private async generateScreenplay(storyBible: StoryBible, characters: Character[]): Promise<Screenplay> {
    const prompt = `You are a master screenwriter creating a full screenplay for a movie.

Given the following story bible and characters:

STORY BIBLE:
Title: ${storyBible.title}
Synopsis: ${storyBible.synopsis}

World Rules:
${JSON.stringify(storyBible.worldRules, null, 2)}

Timeline:
${JSON.stringify(storyBible.timeline, null, 2)}

Themes:
${JSON.stringify(storyBible.themes, null, 2)}

Locations:
${JSON.stringify(storyBible.locations, null, 2)}

CHARACTERS:
${JSON.stringify(characters, null, 2)}

Generate a COMPLETE screenplay in professional screenplay format. The screenplay should:

1. Follow standard screenplay formatting (INT./EXT., scene headings, action, dialogue)
2. Be comprehensive and cover the entire story arc
3. Include all major plot points from the timeline
4. Showcase character relationships and development
5. Respect all world rules and consistency guidelines
6. Incorporate the themes and visual style guide
7. Be designed to be broken into 3-7 second scenes for AI video generation

Estimate the total number of scenes and runtime.

Return a JSON object:

{
  "title": "Screenplay title",
  "logline": "One-sentence pitch",
  "synopsis": "Brief synopsis",
  "screenplay": "Full screenplay text in standard format",
  "sceneCount": estimated number of scenes,
  "estimatedDuration": estimated total duration in seconds
}

IMPORTANT: Return ONLY the JSON object, no markdown, no explanations.`

    return await this.llm.completeJSON<Screenplay>(prompt, {
      temperature: 0.4,
      maxTokens: 16000
    })
  }

  /**
   * Break screenplay into 3-7s scenes with dramatic analysis
   */
  async breakScreenplayIntoScenes(screenplay: Screenplay, storyBible: StoryBible): Promise<Scene[]> {
    const prompt = `You are a film editor breaking down a screenplay into individual scenes for AI video generation.

SCREENPLAY:
${screenplay.screenplay}

STORY BIBLE CONTEXT:
${JSON.stringify(storyBible, null, 2)}

Break this screenplay into individual scenes that are each 3-7 SECONDS long when filmed. Each scene should:

1. Be a complete visual moment or beat
2. Last 3-7 seconds when generated as video
3. Have clear dramatic purpose
4. Include camera and lighting suggestions
5. Be numbered sequentially

For each scene, provide:

- sceneNumber: Sequential number (001, 002, etc.)
- sequenceOrder: Order in the sequence
- screenplayText: The exact screenplay text for this scene
- expectedDuration: Duration in seconds (3-7)
- dramaticEffect:
  * intensity: 0-10 scale of dramatic intensity
  * emotionalTone: The emotional quality (joyful, tense, melancholic, etc.)
  * pacing: slow, moderate, fast, frenetic
  * visualImpact: Description of visual impact
  * narrativeFunction: What this scene accomplishes narratively
- cameraDirection:
  * shotType: wide, medium, close-up, extreme close-up, etc.
  * movement: static, pan, tilt, dolly, tracking, crane, etc.
  * angle: eye-level, high-angle, low-angle, dutch, overhead, etc.
  * focus: What the camera focuses on
- lightingDirection:
  * style: naturalistic, dramatic, noir, high-key, low-key, etc.
  * mood: bright, dark, moody, ethereal, harsh, soft, etc.
  * keyLighting: description of key light placement
  * colorTemperature: warm, cool, neutral, mixed, etc.
- location: Where the scene takes place
- timeOfDay: dawn, morning, midday, afternoon, dusk, evening, night, midnight
- characters: Array of character names in the scene

Return a JSON array of Scene objects.

IMPORTANT: Return ONLY the JSON array, no markdown, no explanations.`

    return await this.llm.completeJSON<Scene[]>(prompt, {
      temperature: 0.3,
      maxTokens: 16000
    })
  }

  /**
   * Create scenes in PayloadCMS
   */
  private async createScenesInPayloadCMS(scenes: Scene[], projectId: string): Promise<void> {
    const payload = await getPayload({ config })

    for (const scene of scenes) {
      await payload.create({
        collection: 'scenes',
        data: {
          sceneNumber: scene.sceneNumber,
          title: `Scene ${scene.sceneNumber}`,
          status: 'draft',
          sequence: scene.sequenceOrder.toString(),
          storyBeat: scene.dramaticEffect.narrativeFunction,
          emotionalTone: scene.dramaticEffect.emotionalTone,
          pacing: scene.dramaticEffect.pacing,
          narrativePurpose: scene.dramaticEffect.narrativeFunction,
          location: scene.location,
          timeOfDay: scene.timeOfDay,
          visualDescription: scene.screenplayText,
          targetDuration: scene.expectedDuration,
          dramaticIntensity: scene.dramaticEffect.intensity,
          cameraDirection: scene.cameraDirection ? {
            shotType: scene.cameraDirection.shotType,
            movement: scene.cameraDirection.movement,
            angle: scene.cameraDirection.angle,
            notes: `Focus: ${scene.cameraDirection.focus}`
          } : undefined,
          lightingDirection: scene.lightingDirection ? {
            style: scene.lightingDirection.style,
            mood: scene.lightingDirection.mood,
            notes: `Key: ${scene.lightingDirection.keyLighting}, Temp: ${scene.lightingDirection.colorTemperature}`
          } : undefined,
          charactersPresent: scene.characters?.map(name => ({ name })),
          visualImpact: scene.dramaticEffect.visualImpact,
        }
      })
    }
  }

  /**
   * Store screenplay in qualified database
   */
  private async storeScreenplayInQualifiedDB(
    projectSlug: string,
    screenplay: Screenplay,
    projectId: string,
    userId: string
  ): Promise<void> {
    await qualifiedDB.createQualifiedItem(projectSlug, 'screenplays', {
      projectId,
      projectSlug,
      name: screenplay.title,
      createdAt: new Date(),
      createdBy: userId,
      createdByType: 'agent' as const,
      qualityRating: 1.0,
      brainValidated: false,
      userApproved: false,
      content: screenplay
    })
  }
}

// Export singleton instance
export const storyDepartment = new StoryDepartment()

/**
 * Standalone function to break screenplay into scenes
 */
export async function breakScreenplayIntoScenes(
  screenplay: Screenplay,
  storyBible: StoryBible
): Promise<Scene[]> {
  const dept = new StoryDepartment()
  return await dept.breakScreenplayIntoScenes(screenplay, storyBible)
}
