/**
 * Location Entity Configuration
 *
 * Comprehensive configuration for location entity processing including
 * metadata schemas, LLM prompts, relationship rules, and quality thresholds.
 */

import type { EntityConfig } from '../types'

/**
 * Location entity configuration
 *
 * Defines how location entities are processed, validated, and enriched
 * with metadata and relationships.
 */
export const locationConfig: EntityConfig = {
  // Entity identification
  entityType: 'location',
  collectionSlug: 'locations',

  // Metadata configuration
  metadata: {
    required: ['locationType', 'significance'],
    optional: [
      'atmosphere',
      'timeOfDay',
      'weather',
      'soundscape',
      'visualElements',
      'sceneCount',
      'lighting',
      'geography',
      'culturalContext',
      'historicalSignificance',
      'narrativeRole',
    ],
    schema: {
      locationType: {
        type: 'string',
        required: true,
        validation: (v) => ['interior', 'exterior', 'mixed', 'virtual'].includes(v),
      },
      significance: {
        type: 'string',
        required: true,
        validation: (v) => ['low', 'medium', 'high', 'central'].includes(v),
      },
      atmosphere: {
        type: 'string',
        required: false,
      },
      timeOfDay: {
        type: 'string',
        required: false,
      },
      weather: {
        type: 'string',
        required: false,
      },
      soundscape: {
        type: 'string',
        required: false,
      },
      visualElements: {
        type: 'array',
        required: false,
      },
      sceneCount: {
        type: 'number',
        required: false,
        validation: (v) => !v || (v >= 0),
      },
      lighting: {
        type: 'string',
        required: false,
      },
      geography: {
        type: 'string',
        required: false,
      },
      culturalContext: {
        type: 'string',
        required: false,
      },
      historicalSignificance: {
        type: 'string',
        required: false,
      },
      narrativeRole: {
        type: 'string',
        required: false,
      },
    },
    defaults: {
      locationType: 'interior',
      significance: 'medium',
    },
  },

  // LLM configuration
  llm: {
    prompts: {
      analyze: `You are analyzing a location for a {projectType} project with the following context:

Project: {projectName}
Genre: {projectGenre}
Themes: {projectThemes}
Tone: {projectTone}

Location Data:
{data}

Analyze this location and determine:
1. Location Type: Is this an interior, exterior, mixed (both), or virtual location?
2. Significance: How important is this location to the narrative? (low, medium, high, central)
3. Narrative Role: What role does this location play in the story?

Consider the project's setting, genre, and narrative structure.
Provide your analysis in JSON format with fields: locationType, significance, narrativeRole.`,

      extract: `You are extracting detailed metadata for a location in a {projectType} project.

Project Context: {projectName} ({projectGenre})
Location: {data}

Extract the following metadata:

REQUIRED:
- locationType: interior | exterior | mixed | virtual
- significance: low | medium | high | central

OPTIONAL:
- atmosphere: Overall mood and feeling of the location
- timeOfDay: Typical time setting (if consistent)
- weather: Weather conditions (for exterior locations)
- soundscape: Characteristic sounds of the location
- visualElements: Array of distinctive visual features
- sceneCount: Number of scenes set in this location
- lighting: Lighting characteristics
- geography: Geographic or spatial description
- culturalContext: Cultural or social context
- historicalSignificance: Historical importance (if any)
- narrativeRole: Role in advancing the narrative

Focus on sensory details and narrative importance.
Return as JSON with all applicable fields.`,

      summarize: `Create a comprehensive summary for this location optimized for search and retrieval.

Location Data: {data}
Metadata: {metadata}

Generate a summary that includes:
1. Location name and type (interior/exterior)
2. Physical description and visual elements
3. Atmosphere, mood, and sensory details
4. Narrative significance and role in story
5. Key scenes or events that occur here
6. Cultural or historical context (if relevant)
7. Connections to characters and other locations

The summary should be 150-250 words and capture all essential information for quick reference.
Focus on searchable keywords and narrative importance.`,

      relationships: `Identify and analyze relationships for this location.

Location: {data}
Project Context: {context}

Consider the following relationship types:
- HOSTS: Scenes that take place in this location
- FREQUENTED_BY: Characters who often visit this location
- NEAR: Nearby or adjacent locations
- PART_OF: Larger location this is contained within
- CONTAINS: Smaller locations within this location
- ASSOCIATED_WITH: Concepts or themes associated with this location

For each relationship identified:
1. Determine the relationship type
2. Identify the target entity (scene, character, location, concept)
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
      { type: 'HOSTS', targetType: 'scene' },
      { type: 'FREQUENTED_BY', targetType: 'character' },
      { type: 'NEAR', targetType: 'location', bidirectional: true },
      { type: 'PART_OF', targetType: 'location' },
      { type: 'CONTAINS', targetType: 'location' },
      { type: 'ASSOCIATED_WITH', targetType: 'concept' },
      { type: 'FEATURED_IN', targetType: 'episode' },
    ],
    autoDiscover: true,
    confidenceThreshold: 0.7,
  },

  // Quality configuration
  quality: {
    minimumScore: 0.6,
    requiredFields: ['name', 'description'],
    validationRules: [
      {
        field: 'name',
        rule: (v) => v && typeof v === 'string' && v.length > 0,
        message: 'Location name is required and must be a non-empty string',
      },
      {
        field: 'description',
        rule: (v) => v && typeof v === 'string' && v.length >= 20,
        message: 'Location description must be at least 20 characters',
      },
      {
        field: 'locationType',
        rule: (v, doc) => !v || ['interior', 'exterior', 'mixed', 'virtual'].includes(v),
        message: 'Location type must be one of: interior, exterior, mixed, virtual',
      },
      {
        field: 'significance',
        rule: (v, doc) => !v || ['low', 'medium', 'high', 'central'].includes(v),
        message: 'Significance must be one of: low, medium, high, central',
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
