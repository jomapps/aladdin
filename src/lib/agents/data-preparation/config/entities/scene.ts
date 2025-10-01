/**
 * Scene Entity Configuration
 *
 * Comprehensive configuration for scene entity processing including
 * metadata schemas, LLM prompts, relationship rules, and quality thresholds.
 */

import type { EntityConfig } from '../types'

/**
 * Scene entity configuration
 *
 * Defines how scene entities are processed, validated, and enriched
 * with metadata and relationships.
 */
export const sceneConfig: EntityConfig = {
  // Entity identification
  entityType: 'scene',
  collectionSlug: 'scenes',

  // Metadata configuration
  metadata: {
    required: ['sceneType', 'narrativeFunction', 'plotSignificance'],
    optional: [
      'emotionalTone',
      'characterDevelopment',
      'thematicElements',
      'continuityNotes',
      'visualStyle',
      'pacing',
      'duration',
      'timeOfDay',
      'atmosphere',
    ],
    schema: {
      sceneType: {
        type: 'string',
        required: true,
        validation: (v) => ['action', 'dialogue', 'exposition', 'transition', 'montage'].includes(v),
      },
      narrativeFunction: {
        type: 'string',
        required: true,
      },
      plotSignificance: {
        type: 'string',
        required: true,
        validation: (v) => ['low', 'medium', 'high', 'critical'].includes(v),
      },
      emotionalTone: {
        type: 'string',
        required: false,
      },
      characterDevelopment: {
        type: 'object',
        required: false,
      },
      thematicElements: {
        type: 'array',
        required: false,
      },
      continuityNotes: {
        type: 'string',
        required: false,
      },
      visualStyle: {
        type: 'string',
        required: false,
      },
      pacing: {
        type: 'string',
        required: false,
        validation: (v) => !v || ['slow', 'medium', 'fast', 'variable'].includes(v),
      },
      duration: {
        type: 'number',
        required: false,
      },
      timeOfDay: {
        type: 'string',
        required: false,
      },
      atmosphere: {
        type: 'string',
        required: false,
      },
    },
    defaults: {
      sceneType: 'dialogue',
      plotSignificance: 'medium',
      pacing: 'medium',
    },
  },

  // LLM configuration
  llm: {
    prompts: {
      analyze: `You are analyzing a scene for a {projectType} project with the following context:

Project: {projectName}
Genre: {projectGenre}
Themes: {projectThemes}
Tone: {projectTone}

Scene Data:
{data}

Analyze this scene and determine:
1. Scene Type: What type of scene is this? (action, dialogue, exposition, transition, montage)
2. Narrative Function: What is this scene's purpose in the narrative? (introduce character, advance plot, reveal information, create tension, etc.)
3. Plot Significance: How important is this scene to the overall plot? (low, medium, high, critical)

Consider the project's genre, pacing, and narrative structure.
Provide your analysis in JSON format with fields: sceneType, narrativeFunction, plotSignificance.`,

      extract: `You are extracting detailed metadata for a scene in a {projectType} project.

Project Context: {projectName} ({projectGenre})
Scene: {data}

Extract the following metadata:

REQUIRED:
- sceneType: action | dialogue | exposition | transition | montage
- narrativeFunction: Purpose in the narrative
- plotSignificance: low | medium | high | critical

OPTIONAL:
- emotionalTone: Dominant emotional atmosphere
- characterDevelopment: Object mapping character growth in this scene
- thematicElements: Array of themes explored
- continuityNotes: Important continuity information
- visualStyle: Visual approach or cinematography notes
- pacing: slow | medium | fast | variable
- duration: Approximate scene duration in minutes
- timeOfDay: Time setting (morning, afternoon, night, etc.)
- atmosphere: Overall mood and atmosphere

Focus on elements that make this scene unique and narratively important.
Return as JSON with all applicable fields.`,

      summarize: `Create a comprehensive summary for this scene optimized for search and retrieval.

Scene Data: {data}
Metadata: {metadata}

Generate a summary that includes:
1. Scene type and narrative function
2. Key characters present and their actions
3. Location and time setting
4. Plot developments and revelations
5. Emotional tone and atmosphere
6. Thematic elements explored
7. Visual and pacing characteristics

The summary should be 150-250 words and capture all essential information for quick reference.
Focus on searchable keywords and narrative importance.`,

      relationships: `Identify and analyze relationships for this scene.

Scene: {data}
Project Context: {context}

Consider the following relationship types:
- FEATURES: Characters that appear in this scene
- SET_IN: Location where this scene takes place
- PART_OF: Episode or sequence this scene belongs to
- FOLLOWS: Scenes that come before this one
- PRECEDES: Scenes that come after this one
- REFERENCES: Other scenes, characters, or concepts referenced
- PARALLEL_TO: Scenes with thematic or narrative parallels

For each relationship identified:
1. Determine the relationship type
2. Identify the target entity (character, location, episode, scene)
3. Calculate confidence score (0.0-1.0)
4. Provide reasoning for the relationship

Return as JSON array with fields: type, target, targetType, confidence, reasoning.`,
    },
    temperature: 0.7,
    maxTokens: 2000,
  },

  // Relationship configuration
  relationships: {
    allowed: [
      { type: 'FEATURES', targetType: 'character' },
      { type: 'SET_IN', targetType: 'location' },
      { type: 'PART_OF', targetType: 'episode' },
      { type: 'FOLLOWS', targetType: 'scene' },
      { type: 'PRECEDES', targetType: 'scene' },
      { type: 'REFERENCES', targetType: 'character' },
      { type: 'REFERENCES', targetType: 'concept' },
      { type: 'PARALLEL_TO', targetType: 'scene' },
      { type: 'CONTAINS_DIALOGUE', targetType: 'dialogue' },
    ],
    autoDiscover: true,
    confidenceThreshold: 0.7,
  },

  // Quality configuration
  quality: {
    minimumScore: 0.65,
    requiredFields: ['name', 'description', 'sceneNumber'],
    validationRules: [
      {
        field: 'name',
        rule: (v) => v && typeof v === 'string' && v.length > 0,
        message: 'Scene name is required and must be a non-empty string',
      },
      {
        field: 'description',
        rule: (v) => v && typeof v === 'string' && v.length >= 30,
        message: 'Scene description must be at least 30 characters',
      },
      {
        field: 'sceneType',
        rule: (v, doc) => !v || ['action', 'dialogue', 'exposition', 'transition', 'montage'].includes(v),
        message: 'Scene type must be one of: action, dialogue, exposition, transition, montage',
      },
      {
        field: 'plotSignificance',
        rule: (v, doc) => !v || ['low', 'medium', 'high', 'critical'].includes(v),
        message: 'Plot significance must be one of: low, medium, high, critical',
      },
    ],
  },

  // Processing configuration
  processing: {
    async: false,
    priority: 'high',
    cacheTTL: 1800, // 30 minutes
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
