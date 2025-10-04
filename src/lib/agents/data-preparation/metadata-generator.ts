/**
 * Metadata Generator - LLM-Powered Dynamic Metadata Generation
 * Uses multi-sequence prompts to analyze entities and generate rich metadata
 *
 * NOTE: This utility service uses direct LLM client for focused metadata generation.
 * See /docs/migration/LLM_CLIENT_TO_AGENT_RUNNER.md for when to use agents instead.
 */

import { LLMClient } from '@/lib/llm/client'
import type { ConfigManager } from './config'
import type {
  AgentConfig,
  Context,
  PrepareOptions,
  GeneratedMetadata,
  MetadataSchema,
  RelationshipSuggestion,
} from './types'

export class MetadataGenerator {
  private llm: LLMClient
  private config: AgentConfig
  private configManager: ConfigManager | null

  constructor(llm: LLMClient, config: AgentConfig, configManager?: ConfigManager) {
    this.llm = llm
    this.config = config
    this.configManager = configManager || null
  }

  /**
   * Generate metadata using multi-sequence LLM prompts with entity-specific configuration
   */
  async generate(
    data: any,
    context: Context,
    options: PrepareOptions
  ): Promise<GeneratedMetadata> {
    console.log('[MetadataGenerator] Generating metadata for:', options.entityType)

    // Check if we have entity-specific configuration
    const hasEntityConfig = this.configManager?.hasEntityConfig(options.entityType)
    const entityConfig = hasEntityConfig
      ? this.configManager!.getEntityConfig(options.entityType)
      : null

    if (hasEntityConfig && entityConfig) {
      console.log('[MetadataGenerator] Using entity-specific prompts and configuration')
    } else {
      console.log('[MetadataGenerator] Using default metadata generation')
    }

    try {
      // Sequence 1: Analyze entity and determine metadata schema
      const schema = await this.analyzeEntity(data, context, options, entityConfig)

      // Sequence 2: Extract metadata values
      const metadata = await this.extractMetadata(data, context, schema, entityConfig)

      // Sequence 3: Generate context summary
      const summary = await this.generateSummary(data, context, metadata, entityConfig)

      // Sequence 4: Identify key relationships
      const relationshipSuggestions = await this.identifyRelationships(data, context, entityConfig)

      return {
        ...metadata,
        summary,
        relationshipSuggestions,
        generatedAt: new Date().toISOString(),
        confidence: 0.85, // TODO: Calculate actual confidence
      }
    } catch (error) {
      console.error('[MetadataGenerator] Error generating metadata:', error)
      // Return minimal metadata on error
      return {
        summary: this.buildFallbackSummary(data),
        generatedAt: new Date().toISOString(),
        confidence: 0.5,
      }
    }
  }

  /**
   * Sequence 1: Analyze entity and determine metadata schema
   */
  private async analyzeEntity(
    data: any,
    context: Context,
    options: PrepareOptions,
    entityConfig: any = null
  ): Promise<MetadataSchema> {
    // Use entity-specific prompt if available
    if (entityConfig?.llmPromptConfig?.metadataPromptTemplate) {
      const customPrompt = this.substitutePromptVariables(
        entityConfig.llmPromptConfig.metadataPromptTemplate,
        {
          projectType: context.project.type || 'movie',
          projectName: context.project.name,
          projectGenre: context.project.genre?.join(', ') || 'unknown',
          projectThemes: context.project.themes?.join(', ') || 'unknown',
          projectTone: context.project.tone || 'unknown',
          data: JSON.stringify(data, null, 2),
        }
      )

      try {
        // Get LLM settings from entity config
        const llmSettings = entityConfig.enrichmentStrategy?.metadataGeneration || {}
        return await this.llm.completeJSON<MetadataSchema>(customPrompt, {
          temperature: llmSettings.temperature ?? 0.3,
          maxTokens: llmSettings.maxTokens ?? 1000,
        })
      } catch (error) {
        console.warn('[MetadataGenerator] Custom prompt failed, falling back to default')
      }
    }

    // Default prompt
    const prompt = `You are analyzing a ${options.entityType} entity for a movie production project.

PROJECT CONTEXT:
- Name: ${context.project.name}
- Type: ${context.project.type || 'movie'}
- Genre: ${context.project.genre?.join(', ') || 'unknown'}
- Tone: ${context.project.tone || 'unknown'}
- Themes: ${context.project.themes?.join(', ') || 'unknown'}

ENTITY DATA:
${JSON.stringify(data, null, 2)}

RELATED CONTEXT:
- Characters in project: ${context.payload.characters?.length || 0}
- Scenes in project: ${context.payload.scenes?.length || 0}
- Locations in project: ${context.payload.locations?.length || 0}
- Existing brain entities: ${context.brain.totalCount || 0}

TASK: Determine what metadata fields would be most valuable for this ${options.entityType}.

Consider:
1. What makes this entity unique in the story?
2. How does it relate to other entities?
3. What role does it play in the narrative?
4. What thematic elements does it represent?
5. What practical production information is needed?

Return a JSON object with this structure:
{
  "fields": {
    "fieldName": {
      "type": "string|number|array|object",
      "description": "What this field represents",
      "required": true|false
    }
  },
  "purpose": "Overall purpose of this metadata"
}

Return ONLY the JSON object, no explanations.`

    try {
      return await this.llm.completeJSON<MetadataSchema>(prompt, {
        temperature: 0.3,
        maxTokens: 1000,
      })
    } catch (error) {
      console.error('[MetadataGenerator] Failed to analyze entity:', error)
      // Return default schema
      return {
        fields: {
          type: { type: 'string', description: 'Entity type', required: true },
          role: { type: 'string', description: 'Role in story', required: false },
        },
        purpose: 'Basic entity metadata',
      }
    }
  }

  /**
   * Sequence 2: Extract metadata values
   */
  private async extractMetadata(
    data: any,
    context: Context,
    schema: MetadataSchema,
    entityConfig: any = null
  ): Promise<Record<string, any>> {
    const prompt = `Based on the metadata schema, extract values from the entity data and context.

METADATA SCHEMA:
${JSON.stringify(schema, null, 2)}

ENTITY DATA:
${JSON.stringify(data, null, 2)}

PROJECT CONTEXT:
- Genre: ${context.project.genre?.join(', ')}
- Themes: ${context.project.themes?.join(', ')}
- Tone: ${context.project.tone}

RELATED ENTITIES:
- Characters: ${context.related.characters.join(', ') || 'none'}
- Scenes: ${context.related.scenes.join(', ') || 'none'}
- Locations: ${context.related.locations.join(', ') || 'none'}

TASK: Extract metadata values that match the schema. Be specific and contextual.

Return a JSON object with the metadata values. Use the field names from the schema.
Return ONLY the JSON object, no explanations.`

    try {
      return await this.llm.completeJSON<Record<string, any>>(prompt, {
        temperature: 0.2,
        maxTokens: 1500,
      })
    } catch (error) {
      console.error('[MetadataGenerator] Failed to extract metadata:', error)
      return {}
    }
  }

  /**
   * Sequence 3: Generate context summary
   */
  private async generateSummary(
    data: any,
    context: Context,
    metadata: Record<string, any>,
    entityConfig: any = null
  ): Promise<string> {
    const prompt = `Generate a comprehensive context summary for this entity that will be used for semantic search.

ENTITY: ${data.name || 'Unknown'}
TYPE: ${data.type || 'Unknown'}
PROJECT: ${context.project.name}

ENTITY DATA:
${JSON.stringify(data, null, 2)}

GENERATED METADATA:
${JSON.stringify(metadata, null, 2)}

PROJECT CONTEXT:
- Genre: ${context.project.genre?.join(', ')}
- Themes: ${context.project.themes?.join(', ')}
- Tone: ${context.project.tone}

RELATED ENTITIES:
- ${context.related.characters.length} characters
- ${context.related.scenes.length} scenes
- ${context.related.locations.length} locations

TASK: Create a 2-3 sentence summary that:
1. Describes the entity's role in the story
2. Highlights key relationships
3. Mentions thematic connections
4. Includes searchable keywords

Return ONLY the summary text, no JSON, no markdown, no explanations.`

    try {
      const summary = await this.llm.complete(prompt, {
        temperature: 0.4,
        maxTokens: 300,
      })
      return summary.trim()
    } catch (error) {
      console.error('[MetadataGenerator] Failed to generate summary:', error)
      return this.buildFallbackSummary(data)
    }
  }

  /**
   * Sequence 4: Identify relationships
   */
  private async identifyRelationships(
    data: any,
    context: Context,
    entityConfig: any = null
  ): Promise<RelationshipSuggestion[]> {
    // Use entity-specific relationship prompt if available
    if (entityConfig?.llmPromptConfig?.relationshipPromptTemplate) {
      const customPrompt = this.substitutePromptVariables(
        entityConfig.llmPromptConfig.relationshipPromptTemplate,
        {
          data: JSON.stringify(data, null, 2),
          context: JSON.stringify(context, null, 2),
          availableCharacters: context.payload.characters?.map((c: any) => c.name).join(', ') || 'none',
          availableScenes: context.payload.scenes?.map((s: any) => s.name || `Scene ${s.sceneNumber}`).join(', ') || 'none',
          availableLocations: context.payload.locations?.map((l: any) => l.name).join(', ') || 'none',
          existingRelationships: JSON.stringify(context.brain.relatedNodes, null, 2),
        }
      )

      try {
        const llmSettings = entityConfig.enrichmentStrategy?.metadataGeneration || {}
        return await this.llm.completeJSON<RelationshipSuggestion[]>(customPrompt, {
          temperature: llmSettings.temperature ?? 0.3,
          maxTokens: llmSettings.maxTokens ?? 1000,
        })
      } catch (error) {
        console.warn('[MetadataGenerator] Custom relationship prompt failed, using default')
      }
    }
    const prompt = `Identify relationships between this entity and others in the project.

ENTITY:
${JSON.stringify(data, null, 2)}

AVAILABLE ENTITIES IN PROJECT:
- Characters: ${context.payload.characters?.map((c: any) => c.name).join(', ') || 'none'}
- Scenes: ${context.payload.scenes?.map((s: any) => s.name || `Scene ${s.sceneNumber}`).join(', ') || 'none'}
- Locations: ${context.payload.locations?.map((l: any) => l.name).join(', ') || 'none'}

EXISTING BRAIN RELATIONSHIPS:
${JSON.stringify(context.brain.relatedNodes, null, 2)}

TASK: Identify logical relationships. Return a JSON array of relationship suggestions:
[
  {
    "type": "RELATIONSHIP_TYPE",
    "target": "target_entity_id_or_name",
    "targetType": "character|scene|location|episode|concept",
    "properties": { "key": "value" },
    "confidence": 0.0-1.0,
    "reasoning": "why this relationship exists"
  }
]

Common relationship types:
- APPEARS_IN (character appears in scene)
- LIVES_IN (character lives in location)
- RELATES_TO (character relates to character)
- CONTAINS (scene contains character)
- LOCATED_IN (scene located in location)
- FOLLOWS (scene follows scene)
- PRECEDES (scene precedes scene)

Return ONLY the JSON array, no explanations.`

    try {
      return await this.llm.completeJSON<RelationshipSuggestion[]>(prompt, {
        temperature: 0.3,
        maxTokens: 1000,
      })
    } catch (error) {
      console.error('[MetadataGenerator] Failed to identify relationships:', error)
      return []
    }
  }

  /**
   * Build fallback summary when LLM fails
   */
  private buildFallbackSummary(data: any): string {
    const parts: string[] = []

    if (data.name) parts.push(data.name)
    if (data.type) parts.push(`is a ${data.type}`)
    if (data.description) parts.push(data.description)

    return parts.join(' ') || 'Entity in the project'
  }

  /**
   * Substitute variables in prompt template
   */
  private substitutePromptVariables(template: string, variables: Record<string, any>): string {
    let result = template

    for (const [key, value] of Object.entries(variables)) {
      const placeholder = new RegExp(`\\{${key}\\}`, 'g')
      const stringValue = typeof value === 'object'
        ? JSON.stringify(value, null, 2)
        : String(value)
      result = result.replace(placeholder, stringValue)
    }

    return result
  }
}

