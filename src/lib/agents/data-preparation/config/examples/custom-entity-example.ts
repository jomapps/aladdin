/**
 * Custom Entity Configuration Example
 *
 * This example shows how to create a custom entity configuration
 * for the Data Preparation Agent.
 */

import { getConfigManager } from '../index'
import type { EntityConfig } from '../types'

/**
 * Example 1: Custom Prop Entity
 *
 * Props are physical objects that appear in the story.
 * This configuration defines how props should be processed.
 */
const propEntityConfig: EntityConfig = {
  entityType: 'prop',

  // Required fields for this entity
  requiredFields: ['id', 'name', 'description'],

  // Optional fields that provide additional context
  optionalFields: ['type', 'significance', 'appearances', 'ownedBy'],

  // Context sources to gather information from
  contextSources: ['payload', 'brain', 'project'],

  // Metadata fields to generate
  metadataFields: [
    {
      name: 'propType',
      type: 'string',
      description: 'Type of prop (weapon, tool, technology, personal item)',
      required: true,
    },
    {
      name: 'narrativeSignificance',
      type: 'string',
      description: 'How significant is this prop to the story',
      required: true,
    },
    {
      name: 'symbolicMeaning',
      type: 'string',
      description: 'What does this prop symbolize',
      required: false,
    },
    {
      name: 'visualDescription',
      type: 'string',
      description: 'Detailed visual description for production',
      required: true,
    },
    {
      name: 'sceneAppearances',
      type: 'array',
      description: 'List of scenes where this prop appears',
      required: false,
    },
  ],

  // Relationship types this entity can have
  relationshipTypes: [
    {
      type: 'USED_BY',
      targetType: 'character',
      description: 'Character uses this prop',
      bidirectional: false,
    },
    {
      type: 'APPEARS_IN',
      targetType: 'scene',
      description: 'Prop appears in scene',
      bidirectional: false,
    },
    {
      type: 'SYMBOLIZES',
      targetType: 'concept',
      description: 'Prop symbolizes a concept or theme',
      bidirectional: false,
    },
  ],

  // Validation rules
  validationRules: [
    {
      field: 'name',
      type: 'required',
      message: 'Prop name is required',
    },
    {
      field: 'description',
      type: 'minLength',
      value: 20,
      message: 'Prop description must be at least 20 characters',
    },
    {
      field: 'type',
      type: 'enum',
      value: ['weapon', 'tool', 'technology', 'personal', 'vehicle', 'artifact', 'other'],
      message: 'Prop type must be one of: weapon, tool, technology, personal, vehicle, artifact, other',
    },
  ],

  // Enrichment strategy
  enrichmentStrategy: {
    level: 'comprehensive',

    contextGathering: {
      includeRelatedCharacters: true,
      includeRelatedScenes: true,
      includeProjectThemes: true,
      maxRelatedEntities: 10,
    },

    metadataGeneration: {
      enabled: true,
      temperature: 0.4,
      maxTokens: 1500,
      includeExamples: true,
    },

    relationshipDiscovery: {
      enabled: true,
      autoDetect: true,
      maxRelationships: 20,
      minConfidence: 0.7,
    },

    textEnrichment: {
      includeMetadataInText: true,
      includeRelationshipsInText: true,
      includeSummary: true,
    },
  },

  // Custom LLM prompts
  llmPromptConfig: {
    metadataPromptTemplate: `Analyze this prop in the context of a {{projectType}} story.

PROJECT: {{projectName}}
GENRE: {{projectGenre}}
THEMES: {{projectThemes}}

PROP DATA:
{{data}}

Generate comprehensive metadata focusing on:
1. Prop type and category
2. Narrative significance (how important is it to the story?)
3. Symbolic meaning (what does it represent?)
4. Visual description (for production design)
5. Character associations (who uses it?)
6. Thematic connections

Return JSON with these fields: propType, narrativeSignificance, symbolicMeaning, visualDescription, characterAssociations, thematicConnections`,

    relationshipPromptTemplate: `Identify relationships for this prop in the story.

PROP:
{{data}}

AVAILABLE ENTITIES:
- Characters: {{characters}}
- Scenes: {{scenes}}
- Concepts: {{concepts}}

Common relationships:
- USED_BY: Character uses this prop
- APPEARS_IN: Prop appears in scene
- SYMBOLIZES: Prop represents a theme or concept
- RELATED_TO: Prop relates to another prop

Return JSON array of relationships with confidence scores.`,

    summaryPromptTemplate: `Create a searchable summary for this prop.

PROP: {{name}}
TYPE: {{type}}
PROJECT: {{projectName}}

Prop details:
{{data}}

Context:
{{context}}

Create a 2-3 sentence summary that includes:
- What the prop is and its purpose
- Who uses it or where it appears
- Its significance to the story
- Any symbolic meaning

Make it searchable with keywords.`,
  },
}

/**
 * Example 2: Custom Timeline Event Entity
 *
 * Timeline events track important plot points.
 */
const timelineEventConfig: EntityConfig = {
  entityType: 'timeline_event',
  requiredFields: ['id', 'name', 'date', 'description'],
  optionalFields: ['participants', 'consequences', 'relatedScenes'],
  contextSources: ['payload', 'brain', 'project'],

  metadataFields: [
    {
      name: 'eventType',
      type: 'string',
      description: 'Type of event (inciting incident, turning point, climax, etc.)',
      required: true,
    },
    {
      name: 'narrativeImpact',
      type: 'string',
      description: 'How this event impacts the story',
      required: true,
    },
    {
      name: 'affectedCharacters',
      type: 'array',
      description: 'Characters affected by this event',
      required: false,
    },
    {
      name: 'thematicSignificance',
      type: 'string',
      description: 'Thematic significance of this event',
      required: false,
    },
  ],

  relationshipTypes: [
    {
      type: 'INVOLVES',
      targetType: 'character',
      description: 'Character involved in event',
      bidirectional: false,
    },
    {
      type: 'OCCURS_IN',
      targetType: 'scene',
      description: 'Event occurs in scene',
      bidirectional: false,
    },
    {
      type: 'CAUSES',
      targetType: 'timeline_event',
      description: 'This event causes another event',
      bidirectional: false,
    },
    {
      type: 'PRECEDES',
      targetType: 'timeline_event',
      description: 'This event happens before another',
      bidirectional: false,
    },
  ],

  validationRules: [
    {
      field: 'date',
      type: 'required',
      message: 'Event date is required',
    },
    {
      field: 'description',
      type: 'minLength',
      value: 30,
      message: 'Event description must be at least 30 characters',
    },
  ],

  enrichmentStrategy: {
    level: 'comprehensive',

    contextGathering: {
      includeRelatedCharacters: true,
      includeRelatedScenes: true,
      includeProjectThemes: true,
      maxRelatedEntities: 15,
    },

    metadataGeneration: {
      enabled: true,
      temperature: 0.3,
      maxTokens: 1200,
    },

    relationshipDiscovery: {
      enabled: true,
      autoDetect: true,
      maxRelationships: 25,
      minConfidence: 0.8,
    },
  },
}

/**
 * How to register custom entity configurations
 */
export function registerCustomEntities() {
  const configManager = getConfigManager()

  // Register prop entity
  configManager.registerEntityConfig(propEntityConfig)
  console.log('[Config] Registered custom entity: prop')

  // Register timeline event entity
  configManager.registerEntityConfig(timelineEventConfig)
  console.log('[Config] Registered custom entity: timeline_event')

  // Verify registration
  console.log('[Config] Total entity configs:', configManager.getStats().totalEntityConfigs)
}

/**
 * Usage example
 */
export async function usageExample() {
  const { getDataPreparationAgent } = await import('../../agent')

  // 1. Register custom entities (do this once at startup)
  registerCustomEntities()

  // 2. Prepare a prop
  const agent = getDataPreparationAgent()

  const prop = {
    id: 'prop_001',
    name: 'Neural Interface Device',
    description: 'A sleek, black device that attaches to the temple and reads brain activity',
    type: 'technology',
    significance: 'high',
    appearances: ['scene_042', 'scene_089', 'scene_112'],
    ownedBy: 'char_001',
  }

  const document = await agent.prepare(prop, {
    projectId: 'sci-fi-001',
    entityType: 'prop',
    sourceCollection: 'props',
    sourceId: prop.id,
  })

  console.log('Prop document:', {
    id: document.id,
    metadata: document.metadata,
    relationships: document.relationships,
  })

  // 3. Prepare a timeline event
  const event = {
    id: 'event_005',
    name: 'The Memory Wipe Incident',
    date: '2025-03-15',
    description: 'Mass memory manipulation event affecting 1000+ subjects in the experimental program',
    participants: ['Dr. Martinez', 'Sarah Chen', 'Project Director'],
    consequences: ['Sarah begins investigation', 'Conspiracy uncovered'],
    relatedScenes: ['scene_001', 'scene_042'],
  }

  const eventDocument = await agent.prepare(event, {
    projectId: 'sci-fi-001',
    entityType: 'timeline_event',
    sourceCollection: 'events',
    sourceId: event.id,
  })

  console.log('Event document:', {
    id: eventDocument.id,
    metadata: eventDocument.metadata,
    relationships: eventDocument.relationships,
  })
}

/**
 * Advanced: Dynamic entity configuration based on project type
 */
export function getProjectSpecificEntityConfig(projectType: 'movie' | 'series' | 'game'): EntityConfig {
  const baseConfig: EntityConfig = {
    entityType: 'dynamic_entity',
    requiredFields: ['id', 'name'],
    optionalFields: [],
    contextSources: ['payload', 'brain', 'project'],
    metadataFields: [],
    relationshipTypes: [],
    validationRules: [],
    enrichmentStrategy: {
      level: 'standard',
      contextGathering: {
        includeRelatedCharacters: true,
        includeRelatedScenes: true,
      },
      metadataGeneration: {
        enabled: true,
      },
      relationshipDiscovery: {
        enabled: true,
      },
    },
  }

  // Customize based on project type
  if (projectType === 'game') {
    baseConfig.metadataFields = [
      {
        name: 'gameplayMechanics',
        type: 'array',
        description: 'Gameplay mechanics associated with this entity',
        required: false,
      },
      {
        name: 'interactionType',
        type: 'string',
        description: 'How players interact with this',
        required: false,
      },
    ]
  } else if (projectType === 'series') {
    baseConfig.metadataFields = [
      {
        name: 'episodeAppearances',
        type: 'array',
        description: 'Episodes where this appears',
        required: false,
      },
      {
        name: 'characterArcProgress',
        type: 'object',
        description: 'Character development across episodes',
        required: false,
      },
    ]
  }

  return baseConfig
}
