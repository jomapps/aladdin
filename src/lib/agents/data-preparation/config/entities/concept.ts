/**
 * Concept Entity Configuration
 *
 * Comprehensive configuration for concept entity processing including
 * metadata schemas, LLM prompts, relationship rules, and quality thresholds.
 */

import type { EntityConfig } from '../types'

/**
 * Concept entity configuration
 *
 * Defines how concept entities are processed, validated, and enriched
 * with metadata and relationships.
 */
export const conceptConfig: EntityConfig = {
  // Entity identification
  entityType: 'concept',
  collectionSlug: 'concepts',

  // Metadata configuration
  metadata: {
    required: ['conceptType', 'category'],
    optional: [
      'thematicWeight',
      'symbolicMeaning',
      'narrativeFunction',
      'characterAssociations',
      'visualRepresentation',
      'culturalContext',
      'recurrence',
      'evolution',
      'relatedConcepts',
      'literaryDevices',
    ],
    schema: {
      conceptType: {
        type: 'string',
        required: true,
        validation: (v) => ['theme', 'motif', 'symbol', 'philosophy', 'worldbuilding', 'plot-device'].includes(v),
      },
      category: {
        type: 'string',
        required: true,
      },
      thematicWeight: {
        type: 'string',
        required: false,
        validation: (v) => !v || ['minor', 'moderate', 'major', 'central'].includes(v),
      },
      symbolicMeaning: {
        type: 'string',
        required: false,
      },
      narrativeFunction: {
        type: 'string',
        required: false,
      },
      characterAssociations: {
        type: 'array',
        required: false,
      },
      visualRepresentation: {
        type: 'string',
        required: false,
      },
      culturalContext: {
        type: 'string',
        required: false,
      },
      recurrence: {
        type: 'number',
        required: false,
        validation: (v) => !v || (v >= 0),
      },
      evolution: {
        type: 'string',
        required: false,
      },
      relatedConcepts: {
        type: 'array',
        required: false,
      },
      literaryDevices: {
        type: 'array',
        required: false,
      },
    },
    defaults: {
      conceptType: 'theme',
      thematicWeight: 'moderate',
    },
  },

  // LLM configuration
  llm: {
    prompts: {
      analyze: `You are analyzing a concept for a {projectType} project with the following context:

Project: {projectName}
Genre: {projectGenre}
Themes: {projectThemes}
Tone: {projectTone}

Concept Data:
{data}

Analyze this concept and determine:
1. Concept Type: What type of concept is this? (theme, motif, symbol, philosophy, worldbuilding, plot-device)
2. Category: What category does this concept fall under? (e.g., moral, existential, political, mystical)
3. Thematic Weight: How important is this concept to the narrative? (minor, moderate, major, central)
4. Symbolic Meaning: What does this concept symbolize or represent?
5. Narrative Function: How does this concept function in the story?

Consider the project's themes, genre, and narrative structure.
Provide your analysis in JSON format with fields: conceptType, category, thematicWeight, symbolicMeaning, narrativeFunction.`,

      extract: `You are extracting detailed metadata for a concept in a {projectType} project.

Project Context: {projectName} ({projectGenre})
Concept: {data}

Extract the following metadata:

REQUIRED:
- conceptType: theme | motif | symbol | philosophy | worldbuilding | plot-device
- category: Conceptual category (moral, existential, political, etc.)

OPTIONAL:
- thematicWeight: minor | moderate | major | central
- symbolicMeaning: What this concept symbolizes
- narrativeFunction: How it functions in the narrative
- characterAssociations: Array of associated characters
- visualRepresentation: How it's visually represented
- culturalContext: Cultural or historical context
- recurrence: Number of times concept appears
- evolution: How the concept evolves through story
- relatedConcepts: Array of related concept IDs
- literaryDevices: Array of literary devices used

Focus on thematic depth and narrative significance.
Return as JSON with all applicable fields.`,

      summarize: `Create a comprehensive summary for this concept optimized for search and retrieval.

Concept Data: {data}
Metadata: {metadata}

Generate a summary that includes:
1. Concept name and type
2. Category and thematic weight
3. Symbolic meaning and significance
4. Narrative function and role
5. Character associations
6. Visual or sensory representations
7. Evolution and recurrence throughout story
8. Connection to project themes

The summary should be 150-200 words and capture all essential information for quick reference.
Focus on searchable keywords and thematic importance.`,

      relationships: `Identify and analyze relationships for this concept.

Concept: {data}
Project Context: {context}

Consider the following relationship types:
- EMBODIED_BY: Characters who embody this concept
- EXPLORED_IN: Scenes that explore this concept
- RELATED_TO: Other related concepts
- SYMBOLIZED_BY: Objects or visual elements that symbolize this concept
- OPPOSES: Concepts that oppose or contrast with this one
- SUPPORTS: Concepts that support or complement this one
- APPEARS_IN: Episodes where this concept appears

For each relationship identified:
1. Determine the relationship type
2. Identify the target entity (character, scene, concept, episode)
3. Calculate confidence score (0.0-1.0)
4. Provide reasoning for the relationship

Return as JSON array with fields: type, target, targetType, confidence, reasoning.`,
    },
    temperature: 0.75,
    maxTokens: 2000,
  },

  // Relationship configuration
  relationships: {
    allowed: [
      { type: 'EMBODIED_BY', targetType: 'character' },
      { type: 'EXPLORED_IN', targetType: 'scene' },
      { type: 'RELATED_TO', targetType: 'concept', bidirectional: true },
      { type: 'SYMBOLIZED_BY', targetType: 'location' },
      { type: 'SYMBOLIZED_BY', targetType: 'character' },
      { type: 'OPPOSES', targetType: 'concept', bidirectional: true },
      { type: 'SUPPORTS', targetType: 'concept', bidirectional: true },
      { type: 'APPEARS_IN', targetType: 'episode' },
      { type: 'APPEARS_IN', targetType: 'scene' },
    ],
    autoDiscover: true,
    confidenceThreshold: 0.75,
  },

  // Quality configuration
  quality: {
    minimumScore: 0.65,
    requiredFields: ['name', 'description'],
    validationRules: [
      {
        field: 'name',
        rule: (v) => v && typeof v === 'string' && v.length > 0,
        message: 'Concept name is required and must be a non-empty string',
      },
      {
        field: 'description',
        rule: (v) => v && typeof v === 'string' && v.length >= 30,
        message: 'Concept description must be at least 30 characters',
      },
      {
        field: 'conceptType',
        rule: (v, doc) => !v || ['theme', 'motif', 'symbol', 'philosophy', 'worldbuilding', 'plot-device'].includes(v),
        message: 'Concept type must be one of: theme, motif, symbol, philosophy, worldbuilding, plot-device',
      },
      {
        field: 'thematicWeight',
        rule: (v, doc) => !v || ['minor', 'moderate', 'major', 'central'].includes(v),
        message: 'Thematic weight must be one of: minor, moderate, major, central',
      },
    ],
  },

  // Processing configuration
  processing: {
    async: false,
    priority: 'normal',
    cacheTTL: 2400, // 40 minutes
    retryAttempts: 3,
  },

  // Feature flags
  features: {
    enableLLM: true,
    enableCache: true,
    enableQueue: true,
    enableValidation: true,
    enableRelationships: true,
  },
}
