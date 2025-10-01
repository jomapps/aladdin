/**
 * Data Enricher - Enriches data with related information
 */

import type { AgentConfig, Context, EnrichedData } from './types'

export class DataEnricher {
  private config: AgentConfig

  constructor(config: AgentConfig) {
    this.config = config
  }

  /**
   * Enrich data with related information
   */
  async enrich(
    data: any,
    context: Context,
    metadata: Record<string, any>
  ): Promise<EnrichedData> {
    console.log('[DataEnricher] Enriching data')

    // Build enriched data object
    const enriched: EnrichedData = {
      original: data,
      enriched: {
        ...data,
        projectContext: {
          name: context.project.name,
          genre: context.project.genre,
          themes: context.project.themes,
        },
      },
      relatedEntities: this.gatherRelatedEntities(context),
      contextSummary: this.buildContextSummary(data, context, metadata),
      qualityScore: this.calculateQualityScore(data, metadata),
    }

    return enriched
  }

  /**
   * Gather related entities from context
   */
  private gatherRelatedEntities(context: Context): any[] {
    const entities: any[] = []

    // Add related characters
    if (context.related.characters.length > 0) {
      const characters = context.payload.characters.filter((c: any) =>
        context.related.characters.includes(c.name)
      )
      entities.push(...characters)
    }

    // Add related scenes
    if (context.related.scenes.length > 0) {
      const scenes = context.payload.scenes.filter((s: any) =>
        context.related.scenes.includes(s.name || `Scene ${s.sceneNumber}`)
      )
      entities.push(...scenes)
    }

    // Add related locations
    if (context.related.locations.length > 0) {
      const locations = context.payload.locations.filter((l: any) =>
        context.related.locations.includes(l.name)
      )
      entities.push(...locations)
    }

    return entities
  }

  /**
   * Build context summary
   */
  private buildContextSummary(
    data: any,
    context: Context,
    metadata: Record<string, any>
  ): string {
    const parts: string[] = []

    parts.push(`Entity: ${data.name || 'Unknown'}`)
    parts.push(`Project: ${context.project.name}`)
    parts.push(`Genre: ${context.project.genre?.join(', ') || 'Unknown'}`)

    if (context.related.characters.length > 0) {
      parts.push(`Related characters: ${context.related.characters.join(', ')}`)
    }

    if (metadata.summary) {
      parts.push(metadata.summary)
    }

    return parts.join('. ')
  }

  /**
   * Calculate quality score
   */
  private calculateQualityScore(data: any, metadata: Record<string, any>): number {
    let score = 0.5 // Base score

    // Has name
    if (data.name) score += 0.1

    // Has description
    if (data.description || data.content) score += 0.1

    // Has metadata
    if (Object.keys(metadata).length > 3) score += 0.1

    // Has summary
    if (metadata.summary) score += 0.1

    // Has relationships
    if (metadata.relationshipSuggestions?.length > 0) score += 0.1

    return Math.min(score, 1.0)
  }
}

