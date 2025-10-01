/**
 * Context Gatherer - Multi-Source Context Collection
 * Gathers context from PayloadCMS, Brain Service, Open MongoDB, and Project data
 */

import { getPayloadClient } from '@/lib/payload'
import { BrainClient, getBrainClient } from '@/lib/brain/client'
import { getOpenDatabase } from '@/lib/db/openDatabase'
import { CacheManager } from './cache-manager'
import type {
  AgentConfig,
  Context,
  ProjectContext,
  PayloadContext,
  BrainContext,
  OpenDBContext,
  RelatedEntities,
} from './types'

export class ContextGatherer {
  private brainClient: BrainClient
  private cache: CacheManager
  private config: AgentConfig

  constructor(config: AgentConfig) {
    this.config = config
    this.brainClient = getBrainClient({
      apiUrl: config.brain.apiUrl,
      apiKey: config.brain.apiKey,
    })
    this.cache = new CacheManager(config.redis, config.cache)
  }

  /**
   * Gather context from all sources
   */
  async gatherAll(data: any, projectId: string): Promise<Context> {
    console.log('[ContextGatherer] Gathering context for project:', projectId)

    // Gather from all sources in parallel
    const [project, payload, brain, opendb] = await Promise.all([
      this.getProjectContext(projectId),
      this.getPayloadContext(data, projectId),
      this.getBrainContext(data, projectId),
      this.getOpenDBContext(data, projectId),
    ])

    // Identify related entities based on gathered context
    const related = await this.getRelatedEntities(data, projectId, {
      project,
      payload,
      brain,
      opendb,
    })

    return { project, payload, brain, opendb, related }
  }

  /**
   * Get project context from PayloadCMS
   */
  private async getProjectContext(projectId: string): Promise<ProjectContext> {
    // Check cache first
    const cacheKey = `project:${projectId}`
    const cached = await this.cache.get<ProjectContext>(cacheKey)
    if (cached) {
      console.log('[ContextGatherer] Project context cache hit')
      return cached
    }

    try {
      const payload = await getPayloadClient()
      const project = await payload.findByID({
        collection: 'projects',
        id: projectId,
      })

      const context: ProjectContext = {
        id: project.id,
        name: project.name,
        slug: project.slug,
        type: project.type,
        genre: project.genre,
        tone: project.tone,
        themes: project.themes,
        targetAudience: project.targetAudience,
        phase: project.phase,
        status: project.status,
      }

      // Cache for 5 minutes
      await this.cache.set(cacheKey, context, this.config.cache.projectContextTTL)

      return context
    } catch (error) {
      console.error('[ContextGatherer] Failed to get project context:', error)
      // Return minimal context
      return {
        id: projectId,
        name: 'Unknown Project',
        slug: projectId,
      }
    }
  }

  /**
   * Get related entities from PayloadCMS
   */
  private async getPayloadContext(data: any, projectId: string): Promise<PayloadContext> {
    console.log('[ContextGatherer] Gathering PayloadCMS context')

    try {
      const payload = await getPayloadClient()

      // Query for related entities in parallel
      const [characters, scenes, locations, episodes, concepts] = await Promise.all([
        this.getPayloadCollection(payload, 'characters', projectId, 10),
        this.getPayloadCollection(payload, 'scenes', projectId, 10),
        this.getPayloadCollection(payload, 'locations', projectId, 10),
        this.getPayloadCollection(payload, 'episodes', projectId, 10),
        this.getPayloadCollection(payload, 'concepts', projectId, 10),
      ])

      return {
        characters,
        scenes,
        locations,
        episodes,
        concepts,
      }
    } catch (error) {
      console.error('[ContextGatherer] Failed to get PayloadCMS context:', error)
      return {
        characters: [],
        scenes: [],
        locations: [],
        episodes: [],
        concepts: [],
      }
    }
  }

  /**
   * Helper to get PayloadCMS collection
   */
  private async getPayloadCollection(
    payload: any,
    collection: string,
    projectId: string,
    limit: number = 10,
  ): Promise<any[]> {
    try {
      const result = await payload.find({
        collection,
        where: {
          project: {
            equals: projectId,
          },
        },
        limit,
        depth: 0, // Don't populate relationships
      })

      return result.docs || []
    } catch (error) {
      console.error(`[ContextGatherer] Failed to get ${collection}:`, error)
      return []
    }
  }

  /**
   * Get existing context from Brain Service
   */
  private async getBrainContext(data: any, projectId: string): Promise<BrainContext> {
    console.log('[ContextGatherer] Gathering Brain context')

    try {
      // Build a query to find related context
      const query = this.buildContextQuery(data)

      // Search for similar content in brain
      const results = await this.brainClient.searchSimilar({
        projectId,
        query,
        limit: 10,
      })

      return {
        existingEntities: results,
        totalCount: results.length,
        relatedNodes: [], // TODO: Implement graph traversal
        similarContent: results,
      }
    } catch (error) {
      console.error('[ContextGatherer] Failed to get Brain context:', error)
      return {
        existingEntities: [],
        totalCount: 0,
        relatedNodes: [],
        similarContent: [],
      }
    }
  }

  /**
   * Get context from Open MongoDB
   */
  private async getOpenDBContext(data: any, projectId: string): Promise<OpenDBContext> {
    console.log('[ContextGatherer] Gathering Open MongoDB context')

    try {
      const db = await getOpenDatabase(projectId)

      // Get list of collections
      const collections = await db.listCollections().toArray()
      const collectionNames = collections.map((c) => c.name)

      // Get stats for each collection
      const stats: Record<string, { count: number }> = {}

      await Promise.all(
        collectionNames.map(async (name) => {
          try {
            const count = await db.collection(name).countDocuments({ projectId })
            stats[name] = { count }
          } catch (error) {
            console.error(`[ContextGatherer] Failed to get stats for ${name}:`, error)
            stats[name] = { count: 0 }
          }
        }),
      )

      return {
        collections: collectionNames,
        stats,
      }
    } catch (error) {
      console.error('[ContextGatherer] Failed to get Open MongoDB context:', error)
      return {
        collections: [],
        stats: {},
      }
    }
  }

  /**
   * Identify related entities from context
   */
  private async getRelatedEntities(
    data: any,
    projectId: string,
    context: Partial<Context>,
  ): Promise<RelatedEntities> {
    console.log('[ContextGatherer] Identifying related entities')

    const related: RelatedEntities = {
      characters: [],
      scenes: [],
      locations: [],
      concepts: [],
      episodes: [],
    }

    // Extract character names from text
    if (data.description || data.content) {
      const text = data.description || data.content
      const characters = context.payload?.characters || []

      related.characters = characters
        .filter((char: any) => text.includes(char.name))
        .map((char: any) => char.name)
    }

    // Extract scene references
    if (data.sceneNumber || data.scenes) {
      const scenes = context.payload?.scenes || []
      if (data.sceneNumber) {
        related.scenes = scenes
          .filter((scene: any) => scene.sceneNumber === data.sceneNumber)
          .map((scene: any) => scene.name || `Scene ${scene.sceneNumber}`)
      }
      if (Array.isArray(data.scenes)) {
        related.scenes = data.scenes
      }
    }

    // Extract location references
    if (data.location) {
      related.locations = [data.location]
    }

    return related
  }

  /**
   * Build context query for brain search
   */
  private buildContextQuery(data: any): string {
    const parts: string[] = []

    if (data.name) parts.push(data.name)
    if (data.description) parts.push(data.description)
    if (data.content) parts.push(data.content)
    if (data.type) parts.push(data.type)

    return parts.filter(Boolean).join(' ').slice(0, 500) // Limit query length
  }
}
