/**
 * Phase 3: Neo4j Schema Definitions
 * Node labels and relationship types for the knowledge graph
 */

import type { BrainNode, BrainRelationship } from './types'

/**
 * Node type definitions
 */
export const NODE_TYPES = {
  CHARACTER: 'character',
  SCENE: 'scene',
  LOCATION: 'location',
  DIALOGUE: 'dialogue',
  PROJECT: 'project',
  CONCEPT: 'concept',
  EPISODE: 'episode',
  WORKFLOW: 'workflow',
} as const

export type NodeType = typeof NODE_TYPES[keyof typeof NODE_TYPES]

/**
 * Relationship type definitions
 */
export const RELATIONSHIP_TYPES = {
  // Character relationships
  FEATURES_CHARACTER: 'FEATURES_CHARACTER',
  INTERACTS_WITH: 'INTERACTS_WITH',
  RELATED_TO: 'RELATED_TO',
  CONFLICTS_WITH: 'CONFLICTS_WITH',

  // Scene relationships
  TAKES_PLACE_IN: 'TAKES_PLACE_IN',
  FOLLOWS: 'FOLLOWS',
  PRECEDES: 'PRECEDES',
  PART_OF: 'PART_OF',

  // Content relationships
  CONTAINS: 'CONTAINS',
  REFERENCES: 'REFERENCES',
  SIMILAR_TO: 'SIMILAR_TO',
  CONTRADICTS: 'CONTRADICTS',

  // Project structure
  BELONGS_TO: 'BELONGS_TO',
  CREATED_BY: 'CREATED_BY',
} as const

export type RelationshipType = typeof RELATIONSHIP_TYPES[keyof typeof RELATIONSHIP_TYPES]

/**
 * Schema validation for nodes
 */
export interface NodeSchema {
  type: NodeType
  requiredProperties: string[]
  optionalProperties?: string[]
  embeddingRequired: boolean
}

export const NODE_SCHEMAS: Record<NodeType, NodeSchema> = {
  [NODE_TYPES.CHARACTER]: {
    type: NODE_TYPES.CHARACTER,
    requiredProperties: ['name', 'projectId'],
    optionalProperties: [
      'fullName',
      'role',
      'age',
      'personality',
      'backstory',
      'appearance',
      'voice',
      'relationships',
    ],
    embeddingRequired: true,
  },

  [NODE_TYPES.SCENE]: {
    type: NODE_TYPES.SCENE,
    requiredProperties: ['name', 'projectId'],
    optionalProperties: [
      'description',
      'location',
      'characters',
      'mood',
      'timeOfDay',
      'duration',
      'sceneNumber',
    ],
    embeddingRequired: true,
  },

  [NODE_TYPES.LOCATION]: {
    type: NODE_TYPES.LOCATION,
    requiredProperties: ['name', 'projectId'],
    optionalProperties: ['description', 'locationType', 'atmosphere', 'references'],
    embeddingRequired: true,
  },

  [NODE_TYPES.DIALOGUE]: {
    type: NODE_TYPES.DIALOGUE,
    requiredProperties: ['text', 'character', 'projectId'],
    optionalProperties: ['emotion', 'context', 'sceneId'],
    embeddingRequired: true,
  },

  [NODE_TYPES.PROJECT]: {
    type: NODE_TYPES.PROJECT,
    requiredProperties: ['name', 'slug'],
    optionalProperties: ['description', 'genre', 'status', 'metadata'],
    embeddingRequired: false,
  },

  [NODE_TYPES.CONCEPT]: {
    type: NODE_TYPES.CONCEPT,
    requiredProperties: ['name', 'projectId'],
    optionalProperties: ['description', 'category', 'tags'],
    embeddingRequired: true,
  },

  [NODE_TYPES.EPISODE]: {
    type: NODE_TYPES.EPISODE,
    requiredProperties: ['title', 'projectId'],
    optionalProperties: ['episodeNumber', 'season', 'synopsis', 'duration'],
    embeddingRequired: true,
  },

  [NODE_TYPES.WORKFLOW]: {
    type: NODE_TYPES.WORKFLOW,
    requiredProperties: ['name', 'projectId'],
    optionalProperties: ['description', 'status', 'steps'],
    embeddingRequired: false,
  },
}

/**
 * Validate node properties against schema
 */
export function validateNodeSchema(
  type: NodeType,
  properties: Record<string, any>
): { valid: boolean; errors: string[] } {
  const schema = NODE_SCHEMAS[type]
  const errors: string[] = []

  if (!schema) {
    return { valid: false, errors: [`Unknown node type: ${type}`] }
  }

  // Check required properties
  for (const prop of schema.requiredProperties) {
    if (!(prop in properties) || properties[prop] === undefined || properties[prop] === null) {
      errors.push(`Missing required property: ${prop}`)
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Node property transformers
 */
export function transformNodeProperties(type: NodeType, properties: any): Record<string, any> {
  const transformed: Record<string, any> = {
    ...properties,
    type,
    createdAt: properties.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  // Serialize complex objects to JSON strings for Neo4j
  if (type === NODE_TYPES.CHARACTER && properties.personality) {
    transformed.personality = JSON.stringify(properties.personality)
  }

  if (type === NODE_TYPES.CHARACTER && properties.appearance) {
    transformed.appearance = JSON.stringify(properties.appearance)
  }

  if (type === NODE_TYPES.CHARACTER && properties.voice) {
    transformed.voice = JSON.stringify(properties.voice)
  }

  return transformed
}

/**
 * Parse node properties from Neo4j (deserialize JSON strings)
 */
export function parseNodeProperties(type: NodeType, properties: any): Record<string, any> {
  const parsed = { ...properties }

  try {
    if (type === NODE_TYPES.CHARACTER) {
      if (typeof parsed.personality === 'string') {
        parsed.personality = JSON.parse(parsed.personality)
      }
      if (typeof parsed.appearance === 'string') {
        parsed.appearance = JSON.parse(parsed.appearance)
      }
      if (typeof parsed.voice === 'string') {
        parsed.voice = JSON.parse(parsed.voice)
      }
    }
  } catch (error) {
    console.warn('Failed to parse node properties:', error)
  }

  return parsed
}

/**
 * Relationship schema validation
 */
export interface RelationshipSchema {
  type: RelationshipType
  allowedFromTypes: NodeType[]
  allowedToTypes: NodeType[]
  requiredProperties?: string[]
}

export const RELATIONSHIP_SCHEMAS: Record<RelationshipType, RelationshipSchema> = {
  [RELATIONSHIP_TYPES.FEATURES_CHARACTER]: {
    type: RELATIONSHIP_TYPES.FEATURES_CHARACTER,
    allowedFromTypes: [NODE_TYPES.SCENE],
    allowedToTypes: [NODE_TYPES.CHARACTER],
  },

  [RELATIONSHIP_TYPES.INTERACTS_WITH]: {
    type: RELATIONSHIP_TYPES.INTERACTS_WITH,
    allowedFromTypes: [NODE_TYPES.CHARACTER],
    allowedToTypes: [NODE_TYPES.CHARACTER],
  },

  [RELATIONSHIP_TYPES.RELATED_TO]: {
    type: RELATIONSHIP_TYPES.RELATED_TO,
    allowedFromTypes: Object.values(NODE_TYPES),
    allowedToTypes: Object.values(NODE_TYPES),
  },

  [RELATIONSHIP_TYPES.CONFLICTS_WITH]: {
    type: RELATIONSHIP_TYPES.CONFLICTS_WITH,
    allowedFromTypes: [NODE_TYPES.CHARACTER, NODE_TYPES.CONCEPT],
    allowedToTypes: [NODE_TYPES.CHARACTER, NODE_TYPES.CONCEPT],
  },

  [RELATIONSHIP_TYPES.TAKES_PLACE_IN]: {
    type: RELATIONSHIP_TYPES.TAKES_PLACE_IN,
    allowedFromTypes: [NODE_TYPES.SCENE],
    allowedToTypes: [NODE_TYPES.LOCATION],
  },

  [RELATIONSHIP_TYPES.FOLLOWS]: {
    type: RELATIONSHIP_TYPES.FOLLOWS,
    allowedFromTypes: [NODE_TYPES.SCENE],
    allowedToTypes: [NODE_TYPES.SCENE],
  },

  [RELATIONSHIP_TYPES.PRECEDES]: {
    type: RELATIONSHIP_TYPES.PRECEDES,
    allowedFromTypes: [NODE_TYPES.SCENE],
    allowedToTypes: [NODE_TYPES.SCENE],
  },

  [RELATIONSHIP_TYPES.PART_OF]: {
    type: RELATIONSHIP_TYPES.PART_OF,
    allowedFromTypes: [NODE_TYPES.SCENE, NODE_TYPES.CHARACTER, NODE_TYPES.DIALOGUE],
    allowedToTypes: [NODE_TYPES.EPISODE, NODE_TYPES.PROJECT],
  },

  [RELATIONSHIP_TYPES.CONTAINS]: {
    type: RELATIONSHIP_TYPES.CONTAINS,
    allowedFromTypes: [NODE_TYPES.PROJECT, NODE_TYPES.EPISODE, NODE_TYPES.SCENE],
    allowedToTypes: Object.values(NODE_TYPES),
  },

  [RELATIONSHIP_TYPES.REFERENCES]: {
    type: RELATIONSHIP_TYPES.REFERENCES,
    allowedFromTypes: Object.values(NODE_TYPES),
    allowedToTypes: Object.values(NODE_TYPES),
  },

  [RELATIONSHIP_TYPES.SIMILAR_TO]: {
    type: RELATIONSHIP_TYPES.SIMILAR_TO,
    allowedFromTypes: Object.values(NODE_TYPES),
    allowedToTypes: Object.values(NODE_TYPES),
  },

  [RELATIONSHIP_TYPES.CONTRADICTS]: {
    type: RELATIONSHIP_TYPES.CONTRADICTS,
    allowedFromTypes: Object.values(NODE_TYPES),
    allowedToTypes: Object.values(NODE_TYPES),
  },

  [RELATIONSHIP_TYPES.BELONGS_TO]: {
    type: RELATIONSHIP_TYPES.BELONGS_TO,
    allowedFromTypes: Object.values(NODE_TYPES).filter(t => t !== NODE_TYPES.PROJECT),
    allowedToTypes: [NODE_TYPES.PROJECT],
  },

  [RELATIONSHIP_TYPES.CREATED_BY]: {
    type: RELATIONSHIP_TYPES.CREATED_BY,
    allowedFromTypes: Object.values(NODE_TYPES),
    allowedToTypes: [NODE_TYPES.PROJECT],
    requiredProperties: ['agentId', 'timestamp'],
  },
}

/**
 * Validate relationship schema
 */
export function validateRelationshipSchema(
  type: RelationshipType,
  fromType: NodeType,
  toType: NodeType,
  properties?: Record<string, any>
): { valid: boolean; errors: string[] } {
  const schema = RELATIONSHIP_SCHEMAS[type]
  const errors: string[] = []

  if (!schema) {
    return { valid: false, errors: [`Unknown relationship type: ${type}`] }
  }

  if (!schema.allowedFromTypes.includes(fromType)) {
    errors.push(`Invalid from node type: ${fromType} for relationship ${type}`)
  }

  if (!schema.allowedToTypes.includes(toType)) {
    errors.push(`Invalid to node type: ${toType} for relationship ${type}`)
  }

  if (schema.requiredProperties && properties) {
    for (const prop of schema.requiredProperties) {
      if (!(prop in properties)) {
        errors.push(`Missing required property: ${prop}`)
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
