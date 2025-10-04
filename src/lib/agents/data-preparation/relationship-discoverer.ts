/**
 * Relationship Discoverer - Auto-discovers relationships between entities
 *
 * NOTE: This utility service uses direct LLM client for relationship analysis.
 * See /docs/migration/LLM_CLIENT_TO_AGENT_RUNNER.md for when to use agents instead.
 */

import { LLMClient } from '@/lib/llm/client'
import type { AgentConfig, Context, Relationship, EnrichedData } from './types'

export class RelationshipDiscoverer {
  private llm: LLMClient
  private config: AgentConfig

  constructor(llm: LLMClient, config: AgentConfig) {
    this.llm = llm
    this.config = config
  }

  /**
   * Discover relationships for an entity
   */
  async discover(
    enriched: EnrichedData,
    context: Context,
    metadata: Record<string, any>
  ): Promise<Relationship[]> {
    console.log('[RelationshipDiscoverer] Discovering relationships')

    const relationships: Relationship[] = []

    // Use LLM suggestions if available
    if (metadata.relationshipSuggestions && Array.isArray(metadata.relationshipSuggestions)) {
      for (const suggestion of metadata.relationshipSuggestions) {
        if (suggestion.confidence > 0.7) {
          relationships.push({
            type: suggestion.type,
            target: suggestion.target,
            targetType: suggestion.targetType,
            properties: suggestion.properties || {},
            confidence: suggestion.confidence,
            reasoning: suggestion.reasoning,
          })
        }
      }
    }

    // Add automatic relationships based on data
    const autoRelationships = this.discoverAutomaticRelationships(enriched, context)
    relationships.push(...autoRelationships)

    console.log('[RelationshipDiscoverer] Discovered', relationships.length, 'relationships')
    return relationships
  }

  /**
   * Discover automatic relationships based on data patterns
   */
  private discoverAutomaticRelationships(
    enriched: EnrichedData,
    context: Context
  ): Relationship[] {
    const relationships: Relationship[] = []
    const data = enriched.original

    // Character appears in scenes
    if (data.scenes && Array.isArray(data.scenes)) {
      for (const sceneId of data.scenes) {
        relationships.push({
          type: 'APPEARS_IN',
          target: sceneId,
          targetType: 'scene',
          properties: { role: 'participant' },
          confidence: 1.0,
        })
      }
    }

    // Scene contains characters
    if (data.characters && Array.isArray(data.characters)) {
      for (const charId of data.characters) {
        relationships.push({
          type: 'CONTAINS',
          target: charId,
          targetType: 'character',
          properties: { role: 'participant' },
          confidence: 1.0,
        })
      }
    }

    // Scene located in location
    if (data.location) {
      relationships.push({
        type: 'LOCATED_IN',
        target: data.location,
        targetType: 'location',
        properties: {},
        confidence: 1.0,
      })
    }

    // Episode contains scenes
    if (data.sceneIds && Array.isArray(data.sceneIds)) {
      for (const sceneId of data.sceneIds) {
        relationships.push({
          type: 'CONTAINS',
          target: sceneId,
          targetType: 'scene',
          properties: {},
          confidence: 1.0,
        })
      }
    }

    return relationships
  }
}

