/**
 * Episode Entity Configuration
 *
 * Comprehensive configuration for episode entity processing including
 * metadata schemas, LLM prompts, relationship rules, and quality thresholds.
 */

import type { EntityConfig } from '../types'

/**
 * Episode entity configuration
 *
 * Defines how episode entities are processed, validated, and enriched
 * with metadata and relationships.
 */
export const episodeConfig: EntityConfig = {
  // Entity identification
  entityType: 'episode',
  collectionSlug: 'episodes',

  // Metadata configuration
  metadata: {
    required: ['episodeType', 'narrativeArc'],
    optional: [
      'thematicFocus',
      'characterFocus',
      'plotThreads',
      'cliffhanger',
      'emotionalTone',
      'season',
      'episodeNumber',
      'runtime',
      'airDate',
      'previousEpisode',
      'nextEpisode',
      'overarchingPlot',
    ],
    schema: {
      episodeType: {
        type: 'string',
        required: true,
        validation: (v) => ['pilot', 'regular', 'finale', 'special', 'midseason'].includes(v),
      },
      narrativeArc: {
        type: 'string',
        required: true,
      },
      thematicFocus: {
        type: 'array',
        required: false,
      },
      characterFocus: {
        type: 'array',
        required: false,
      },
      plotThreads: {
        type: 'array',
        required: false,
      },
      cliffhanger: {
        type: 'boolean',
        required: false,
      },
      emotionalTone: {
        type: 'string',
        required: false,
      },
      season: {
        type: 'number',
        required: false,
        validation: (v) => !v || (v > 0),
      },
      episodeNumber: {
        type: 'number',
        required: false,
        validation: (v) => !v || (v > 0),
      },
      runtime: {
        type: 'number',
        required: false,
        validation: (v) => !v || (v > 0),
      },
      airDate: {
        type: 'string',
        required: false,
      },
      previousEpisode: {
        type: 'string',
        required: false,
      },
      nextEpisode: {
        type: 'string',
        required: false,
      },
      overarchingPlot: {
        type: 'string',
        required: false,
      },
    },
    defaults: {
      episodeType: 'regular',
      cliffhanger: false,
    },
  },

  // LLM configuration
  llm: {
    prompts: {
      analyze: `You are analyzing an episode for a {projectType} project with the following context:

Project: {projectName}
Genre: {projectGenre}
Themes: {projectThemes}
Series Type: {projectType}

Episode Data:
{data}

Analyze this episode and determine:
1. Episode Type: What type of episode is this? (pilot, regular, finale, special, midseason)
2. Narrative Arc: What is the main narrative arc or story of this episode?
3. Character Focus: Which characters are central to this episode?
4. Thematic Focus: What themes are explored in this episode?

Consider the episode's position in the series and its narrative function.
Provide your analysis in JSON format with fields: episodeType, narrativeArc, characterFocus, thematicFocus.`,

      extract: `You are extracting detailed metadata for an episode in a {projectType} project.

Project Context: {projectName} ({projectGenre})
Episode: {data}

Extract the following metadata:

REQUIRED:
- episodeType: pilot | regular | finale | special | midseason
- narrativeArc: Main story arc of the episode

OPTIONAL:
- thematicFocus: Array of themes explored
- characterFocus: Array of central characters
- plotThreads: Array of plot threads developed
- cliffhanger: Boolean indicating if episode ends on cliffhanger
- emotionalTone: Dominant emotional atmosphere
- season: Season number
- episodeNumber: Episode number within season
- runtime: Episode runtime in minutes
- airDate: Original or planned air date
- previousEpisode: ID of previous episode
- nextEpisode: ID of next episode
- overarchingPlot: Connection to season/series arc

Focus on narrative structure and episodic storytelling elements.
Return as JSON with all applicable fields.`,

      summarize: `Create a comprehensive summary for this episode optimized for search and retrieval.

Episode Data: {data}
Metadata: {metadata}

Generate a summary that includes:
1. Episode title, number, and type
2. Main narrative arc and plot developments
3. Character focus and development
4. Key scenes and moments
5. Thematic elements explored
6. Emotional tone and atmosphere
7. Connection to overarching series plot
8. Cliffhanger or resolution (if applicable)

The summary should be 200-300 words and capture all essential information for quick reference.
Focus on searchable keywords and narrative importance.`,

      relationships: `Identify and analyze relationships for this episode.

Episode: {data}
Project Context: {context}

Consider the following relationship types:
- CONTAINS: Scenes that are part of this episode
- FEATURES: Characters who appear in this episode
- PART_OF_SEASON: Season this episode belongs to
- FOLLOWS: Previous episode in sequence
- PRECEDES: Next episode in sequence
- EXPLORES_THEME: Themes explored in this episode
- SET_IN: Primary locations featured
- ADVANCES_PLOT: Plot threads advanced

For each relationship identified:
1. Determine the relationship type
2. Identify the target entity (scene, character, concept, episode)
3. Calculate confidence score (0.0-1.0)
4. Provide reasoning for the relationship

Return as JSON array with fields: type, target, targetType, confidence, reasoning.`,
    },
    temperature: 0.7,
    maxTokens: 2500,
  },

  // Relationship configuration
  relationships: {
    allowed: [
      { type: 'CONTAINS', targetType: 'scene' },
      { type: 'FEATURES', targetType: 'character' },
      { type: 'PART_OF_SEASON', targetType: 'episode' },
      { type: 'FOLLOWS', targetType: 'episode' },
      { type: 'PRECEDES', targetType: 'episode' },
      { type: 'EXPLORES_THEME', targetType: 'concept' },
      { type: 'SET_IN', targetType: 'location' },
      { type: 'ADVANCES_PLOT', targetType: 'concept' },
      { type: 'CONTAINS_DIALOGUE', targetType: 'dialogue' },
    ],
    autoDiscover: true,
    confidenceThreshold: 0.75,
  },

  // Quality configuration
  quality: {
    minimumScore: 0.7,
    requiredFields: ['name', 'description', 'episodeNumber'],
    validationRules: [
      {
        field: 'name',
        rule: (v) => v && typeof v === 'string' && v.length > 0,
        message: 'Episode name is required and must be a non-empty string',
      },
      {
        field: 'description',
        rule: (v) => v && typeof v === 'string' && v.length >= 50,
        message: 'Episode description must be at least 50 characters',
      },
      {
        field: 'episodeType',
        rule: (v, doc) => !v || ['pilot', 'regular', 'finale', 'special', 'midseason'].includes(v),
        message: 'Episode type must be one of: pilot, regular, finale, special, midseason',
      },
      {
        field: 'episodeNumber',
        rule: (v, doc) => v && typeof v === 'number' && v > 0,
        message: 'Episode number is required and must be a positive number',
      },
    ],
  },

  // Processing configuration
  processing: {
    async: false,
    priority: 'high',
    cacheTTL: 3600, // 60 minutes
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
