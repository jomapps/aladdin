/**
 * World Department
 * Processes raw world data from gather DB and generates story bible using LLM
 *
 * Flow:
 * 1. Get raw world data from gather DB (gatherDatabase)
 * 2. Generate comprehensive story bible using LLM (OpenRouter/Claude)
 * 3. Extract world rules, timeline, consistency rules
 * 4. Store in qualified DB: story_bible collection
 * 5. Store in PayloadCMS: story-bible collection
 * 6. Ingest into brain service for semantic search
 */

import { getLLMClient } from '@/lib/llm/client'
import { gatherDB } from '@/lib/db/gatherDatabase'
import { qualifiedDB } from '@/lib/db/qualifiedDatabase'
import { BrainClient } from '@/lib/brain/client'
import { getPayload } from 'payload'
import config from '@payload-config'

interface WorldData {
  projectId: string
  projectSlug: string
  worldElements: any[]
  characters: any[]
  locations: any[]
  rules: any[]
}

interface StoryBible {
  title: string
  version: string
  synopsis: string
  worldRules: Array<{
    ruleName: string
    category: string
    description: string
    constraints?: string
    examples?: string
    priority: 'critical' | 'high' | 'medium' | 'low'
  }>
  characterRelationships: any
  relationshipDetails: Array<{
    character1: string
    character2: string
    relationshipType: string
    description: string
    dynamicStatus?: string
    keyMoments?: string
  }>
  timeline: Array<{
    eventName: string
    timestamp?: string
    description: string
    participants?: Array<{ character: string }>
    location?: string
    importance: 'critical' | 'major' | 'minor' | 'background'
    consequences?: string
  }>
  consistencyRules: Array<{
    ruleName: string
    category: string
    description: string
    enforcement: 'strict' | 'recommended' | 'guideline' | 'flexible'
    priority?: number
    checkpoints?: string
    exceptions?: string
  }>
  locations: Array<{
    locationName: string
    description: string
    visualReference?: string
    atmosphere?: string
    keyFeatures?: Array<{ feature: string; description?: string }>
    timeOfDayVariations?: string
    connectedLocations?: Array<{ locationName: string; connectionType?: string }>
  }>
  themes: Array<{
    theme: string
    description?: string
    visualMotifs?: string
    colorAssociations?: string
    sceneReferences?: Array<{ sceneNumber: string; howThemeAppears?: string }>
  }>
  visualStyleGuide?: {
    primaryStyle?: string
    colorPalette?: string
    artDirection?: string
    influences?: string
    prohibitedElements?: string
  }
}

export class WorldDepartment {
  private llm = getLLMClient()

  /**
   * Process world data and generate story bible
   */
  async processWorldData(projectId: string, projectSlug: string, userId: string): Promise<StoryBible> {
    console.log(`[WorldDept] Processing world data for project ${projectSlug}`)

    // Step 1: Get raw world data from gather DB
    const worldData = await this.getRawWorldData(projectId, projectSlug)
    console.log(`[WorldDept] Retrieved ${worldData.worldElements.length} world elements`)

    // Step 2: Generate story bible using LLM
    const storyBible = await this.generateStoryBible(worldData)
    console.log(`[WorldDept] Generated story bible with ${storyBible.worldRules.length} world rules`)

    // Step 3: Store in qualified DB
    await this.storeInQualifiedDB(projectSlug, storyBible, projectId, userId)
    console.log(`[WorldDept] Stored story bible in qualified DB`)

    // Step 4: Store in PayloadCMS
    await this.storeInPayloadCMS(storyBible, projectId)
    console.log(`[WorldDept] Stored story bible in PayloadCMS`)

    // Step 5: Ingest into brain service
    await this.ingestIntoBrain(projectId, storyBible)
    console.log(`[WorldDept] Ingested story bible into brain service`)

    return storyBible
  }

  /**
   * Get raw world data from gather database
   */
  private async getRawWorldData(projectId: string, projectSlug: string): Promise<WorldData> {
    const gatherCollection = await gatherDB.getGatherCollection(projectSlug)

    // Get all gather items for this project
    const allItems = await gatherCollection.find({ projectId }).toArray()

    // Categorize items
    const worldElements = allItems.filter(item => {
      const content = JSON.parse(item.content)
      return content.type === 'world' || content.category === 'world-building'
    })

    const characters = allItems.filter(item => {
      const content = JSON.parse(item.content)
      return content.type === 'character'
    })

    const locations = allItems.filter(item => {
      const content = JSON.parse(item.content)
      return content.type === 'location'
    })

    const rules = allItems.filter(item => {
      const content = JSON.parse(item.content)
      return content.type === 'rule' || content.category === 'world-rule'
    })

    return {
      projectId,
      projectSlug,
      worldElements,
      characters,
      locations,
      rules
    }
  }

  /**
   * Generate comprehensive story bible using LLM
   */
  private async generateStoryBible(worldData: WorldData): Promise<StoryBible> {
    const prompt = `You are a master story consultant creating a comprehensive story bible for a movie production.

Given the following world data:

WORLD ELEMENTS:
${JSON.stringify(worldData.worldElements, null, 2)}

CHARACTERS:
${JSON.stringify(worldData.characters, null, 2)}

LOCATIONS:
${JSON.stringify(worldData.locations, null, 2)}

RULES:
${JSON.stringify(worldData.rules, null, 2)}

Generate a comprehensive story bible that includes:

1. WORLD RULES: Define the laws that govern this world (magic, physics, society, etc.)
2. CHARACTER RELATIONSHIPS: Map out all character relationships with details
3. TIMELINE: Create a chronological timeline of key events
4. CONSISTENCY RULES: Visual and narrative consistency guidelines
5. LOCATION CATALOG: Detailed descriptions of all locations
6. THEMES & MOTIFS: Identify core themes and visual motifs
7. VISUAL STYLE GUIDE: Overall visual direction

Return a JSON object matching this TypeScript interface:

interface StoryBible {
  title: string
  version: string
  synopsis: string
  worldRules: Array<{
    ruleName: string
    category: 'magic' | 'technology' | 'geography' | 'society' | 'physics' | 'history' | 'politics' | 'economy'
    description: string
    constraints?: string
    examples?: string
    priority: 'critical' | 'high' | 'medium' | 'low'
  }>
  characterRelationships: any
  relationshipDetails: Array<{
    character1: string
    character2: string
    relationshipType: 'family' | 'friend' | 'romantic' | 'enemy' | 'rival' | 'mentor' | 'professional' | 'acquaintance'
    description: string
    dynamicStatus?: 'static' | 'improving' | 'deteriorating' | 'complex'
    keyMoments?: string
  }>
  timeline: Array<{
    eventName: string
    timestamp?: string
    description: string
    participants?: Array<{ character: string }>
    location?: string
    importance: 'critical' | 'major' | 'minor' | 'background'
    consequences?: string
  }>
  consistencyRules: Array<{
    ruleName: string
    category: 'character-appearance' | 'location' | 'props' | 'visual-style' | 'narrative' | 'technical'
    description: string
    enforcement: 'strict' | 'recommended' | 'guideline' | 'flexible'
    priority?: number
    checkpoints?: string
    exceptions?: string
  }>
  locations: Array<{
    locationName: string
    description: string
    visualReference?: string
    atmosphere?: string
    keyFeatures?: Array<{ feature: string; description?: string }>
    timeOfDayVariations?: string
    connectedLocations?: Array<{ locationName: string; connectionType?: string }>
  }>
  themes: Array<{
    theme: string
    description?: string
    visualMotifs?: string
    colorAssociations?: string
    sceneReferences?: Array<{ sceneNumber: string; howThemeAppears?: string }>
  }>
  visualStyleGuide?: {
    primaryStyle?: string
    colorPalette?: string
    artDirection?: string
    influences?: string
    prohibitedElements?: string
  }
}

IMPORTANT: Return ONLY the JSON object, no markdown, no explanations.`

    return await this.llm.completeJSON<StoryBible>(prompt, {
      temperature: 0.3,
      maxTokens: 8000
    })
  }

  /**
   * Store story bible in qualified database
   */
  private async storeInQualifiedDB(
    projectSlug: string,
    storyBible: StoryBible,
    projectId: string,
    userId: string
  ): Promise<void> {
    await qualifiedDB.createQualifiedItem(projectSlug, 'story_bible', {
      projectId,
      projectSlug,
      name: `Story Bible v${storyBible.version}`,
      createdAt: new Date(),
      createdBy: userId,
      createdByType: 'agent' as const,
      qualityRating: 1.0,
      brainValidated: false,
      userApproved: false,
      content: storyBible
    })
  }

  /**
   * Store story bible in PayloadCMS
   */
  private async storeInPayloadCMS(storyBible: StoryBible, projectId: string): Promise<void> {
    const payload = await getPayload({ config })

    await payload.create({
      collection: 'story-bible',
      data: {
        title: storyBible.title,
        version: storyBible.version,
        synopsis: storyBible.synopsis,
        worldRules: storyBible.worldRules,
        characterRelationships: storyBible.characterRelationships,
        relationshipDetails: storyBible.relationshipDetails,
        timeline: storyBible.timeline,
        consistencyRules: storyBible.consistencyRules,
        locations: storyBible.locations,
        themes: storyBible.themes,
        visualStyleGuide: storyBible.visualStyleGuide,
        lastReviewedAt: new Date(),
        lastReviewedBy: 'World Department (AI)',
      }
    })
  }

  /**
   * Ingest story bible into brain service for semantic search
   */
  private async ingestIntoBrain(projectId: string, storyBible: StoryBible): Promise<void> {
    const brainClient = new BrainClient({
      apiUrl: process.env.BRAIN_SERVICE_BASE_URL || 'http://localhost:8000',
      apiKey: process.env.BRAIN_SERVICE_API_KEY || ''
    })

    // Create comprehensive content for embedding
    const content = `
Story Bible: ${storyBible.title}
Synopsis: ${storyBible.synopsis}

World Rules:
${storyBible.worldRules.map(r => `- ${r.ruleName} (${r.category}): ${r.description}`).join('\n')}

Timeline:
${storyBible.timeline.map(e => `- ${e.eventName}: ${e.description}`).join('\n')}

Themes:
${storyBible.themes.map(t => `- ${t.theme}: ${t.description}`).join('\n')}

Locations:
${storyBible.locations.map(l => `- ${l.locationName}: ${l.description}`).join('\n')}
`.trim()

    await brainClient.addNode({
      type: 'story_bible',
      content,
      projectId,
      properties: {
        title: storyBible.title,
        version: storyBible.version,
        worldRules: storyBible.worldRules,
        timeline: storyBible.timeline,
        themes: storyBible.themes,
        locations: storyBible.locations
      },
      relationships: []
    })
  }
}

// Export singleton instance
export const worldDepartment = new WorldDepartment()
