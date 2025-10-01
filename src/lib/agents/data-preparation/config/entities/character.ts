/**
 * Character Entity Configuration
 *
 * Comprehensive configuration for character entity processing including
 * metadata schemas, LLM prompts, relationship rules, and quality thresholds.
 */

import type { EntityConfig } from '../types'

/**
 * Character entity configuration
 *
 * Defines how character entities are processed, validated, and enriched
 * with metadata and relationships.
 */
export const characterConfig: EntityConfig = {
  type: 'character',
  displayName: 'Character',
  description: 'Fictional characters in stories, scripts, and narratives',

  requiredFields: ['name', 'description'],
  optionalFields: [
    'role',
    'backstory',
    'personality',
    'appearance',
    'voice',
    'age',
    'relationships',
  ],

  contextSources: ['payload', 'brain', 'project'],

  metadataFields: [
    {
      name: 'characterType',
      type: 'enum',
      description: 'Type of character in the narrative',
      required: true,
      enumValues: ['protagonist', 'antagonist', 'supporting', 'minor'],
      defaultValue: 'supporting',
      useLLM: true,
      llmPrompt: 'Determine if this character is a protagonist, antagonist, supporting character, or minor character based on their role and importance in the narrative.',
      searchable: true,
    },
    {
      name: 'role',
      type: 'string',
      description: 'Primary role of the character in the story',
      required: true,
      useLLM: true,
      llmPrompt: 'What is the primary role of this character? (e.g., hero, mentor, love interest, comic relief)',
      searchable: true,
    },
    {
      name: 'archetypePattern',
      type: 'string',
      description: 'Archetypal pattern the character follows',
      required: true,
      useLLM: true,
      llmPrompt: 'What archetypal pattern does this character follow? (e.g., The Hero, The Shadow, The Mentor, The Trickster)',
      searchable: true,
    },
    {
      name: 'visualSignature',
      type: 'string',
      description: 'Distinctive visual characteristics or style',
      required: false,
      useLLM: true,
      llmPrompt: 'Describe the distinctive visual characteristics, appearance, or style of this character.',
    },
    {
      name: 'personalityTraits',
      type: 'array',
      description: 'Key personality traits',
      required: false,
      isArray: true,
      useLLM: true,
      llmPrompt: 'List 3-5 key personality traits for this character.',
      searchable: true,
    },
    {
      name: 'storyFunction',
      type: 'string',
      description: 'Function in advancing plot or theme',
      required: false,
      useLLM: true,
      llmPrompt: 'What is this character\'s function in advancing the plot or exploring themes?',
    },
    {
      name: 'thematicConnection',
      type: 'string',
      description: 'Connection to project themes',
      required: false,
      useLLM: true,
      llmPrompt: 'How does this character connect to or embody the project\'s themes?',
      searchable: true,
    },
    {
      name: 'sceneAppearances',
      type: 'array',
      description: 'Scene IDs where character appears',
      required: false,
      isArray: true,
      useLLM: false,
    },
    {
      name: 'relationshipDynamics',
      type: 'object',
      description: 'Character relationship mappings',
      required: false,
      useLLM: true,
      llmPrompt: 'Describe the key relationships this character has with other characters.',
    },
    {
      name: 'narrativeArc',
      type: 'string',
      description: 'Character arc across the story',
      required: false,
      useLLM: true,
      llmPrompt: 'Describe the character\'s narrative arc and development throughout the story.',
    },
    {
      name: 'emotionalJourney',
      type: 'string',
      description: 'Key emotional transformations',
      required: false,
      useLLM: true,
      llmPrompt: 'Describe the character\'s emotional journey and key transformations.',
    },
  ],

  relationshipTypes: [
    {
      type: 'APPEARS_IN',
      displayName: 'Appears In',
      description: 'Scenes where this character appears',
      targetTypes: ['scene'],
      autoDiscover: true,
      bidirectional: false,
      confidenceThreshold: 0.8,
    },
    {
      type: 'LOVES',
      displayName: 'Loves',
      description: 'Romantic relationship',
      targetTypes: ['character'],
      autoDiscover: true,
      bidirectional: true,
      inverseType: 'LOVED_BY',
      confidenceThreshold: 0.7,
    },
    {
      type: 'HATES',
      displayName: 'Hates',
      description: 'Antagonistic relationship',
      targetTypes: ['character'],
      autoDiscover: true,
      bidirectional: true,
      inverseType: 'HATED_BY',
      confidenceThreshold: 0.7,
    },
    {
      type: 'BEFRIENDS',
      displayName: 'Befriends',
      description: 'Friendship relationship',
      targetTypes: ['character'],
      autoDiscover: true,
      bidirectional: true,
      confidenceThreshold: 0.7,
    },
    {
      type: 'OPPOSES',
      displayName: 'Opposes',
      description: 'Character in conflict with',
      targetTypes: ['character'],
      autoDiscover: true,
      bidirectional: true,
      confidenceThreshold: 0.7,
    },
    {
      type: 'MENTORS',
      displayName: 'Mentors',
      description: 'Mentors this character',
      targetTypes: ['character'],
      autoDiscover: true,
      bidirectional: false,
      inverseType: 'MENTORED_BY',
      confidenceThreshold: 0.8,
    },
    {
      type: 'FREQUENTS',
      displayName: 'Frequents',
      description: 'Locations frequently visited',
      targetTypes: ['location'],
      autoDiscover: true,
      bidirectional: false,
      confidenceThreshold: 0.6,
    },
    {
      type: 'PART_OF_EPISODE',
      displayName: 'Part of Episode',
      description: 'Episodes this character appears in',
      targetTypes: ['episode'],
      autoDiscover: true,
      bidirectional: false,
      confidenceThreshold: 0.8,
    },
  ],

  validationRules: [
    {
      id: 'char-name-required',
      field: 'name',
      type: 'required',
      message: 'Character name is required',
      severity: 'error',
      blocking: true,
    },
    {
      id: 'char-name-length',
      field: 'name',
      type: 'minLength',
      value: 1,
      message: 'Character name must not be empty',
      severity: 'error',
      blocking: true,
    },
    {
      id: 'char-description-required',
      field: 'description',
      type: 'required',
      message: 'Character description is required',
      severity: 'error',
      blocking: true,
    },
    {
      id: 'char-description-length',
      field: 'description',
      type: 'minLength',
      value: 20,
      message: 'Character description must be at least 20 characters',
      severity: 'error',
      blocking: true,
    },
    {
      id: 'char-type-valid',
      field: 'characterType',
      type: 'enum',
      value: ['protagonist', 'antagonist', 'supporting', 'minor'],
      message: 'Character type must be one of: protagonist, antagonist, supporting, minor',
      severity: 'error',
      blocking: false,
    },
  ],

  enrichmentStrategy: {
    level: 'comprehensive',
    useLLM: true,
    contextGathering: {
      sources: ['payload', 'brain', 'project'],
      maxItemsPerSource: 30,
      includeSimilar: true,
      similarityThreshold: 0.7,
      useCache: true,
      cacheTTL: 1800,
    },
    relationshipDiscovery: {
      enabled: true,
      discoverTypes: ['APPEARS_IN', 'LOVES', 'HATES', 'BEFRIENDS', 'OPPOSES', 'MENTORS', 'FREQUENTS'],
      confidenceThreshold: 0.7,
      maxRelationships: 25,
      useLLM: true,
      validateDiscovered: true,
    },
    metadataGeneration: {
      fields: [
        'characterType',
        'role',
        'archetypePattern',
        'visualSignature',
        'personalityTraits',
        'storyFunction',
        'thematicConnection',
        'narrativeArc',
        'emotionalJourney',
      ],
      useLLM: true,
      llmModel: 'claude-3-5-sonnet-20241022',
      temperature: 0.7,
      maxTokens: 2000,
      includeExamples: true,
      exampleCount: 2,
    },
    qualityThresholds: {
      minMetadataCompleteness: 0.6,
      minRelationshipConfidence: 0.7,
      minQualityScore: 60,
      blockLowQuality: false,
    },
  },

  llmPromptConfig: {
    systemPrompt: `You are an expert in character analysis for storytelling. Analyze characters comprehensively considering their role, personality, relationships, and narrative function.`,

    metadataPromptTemplate: `Analyze this character for a {projectType} project.

Project: {projectName}
Genre: {projectGenre}
Themes: {projectThemes}

Character Data:
{data}

Generate comprehensive metadata including:
- Character type (protagonist/antagonist/supporting/minor)
- Role and function in the narrative
- Archetypal pattern
- Visual signature and appearance
- Personality traits
- Story function
- Thematic connections
- Narrative arc
- Emotional journey

Return as JSON with all applicable fields.`,

    relationshipPromptTemplate: `Identify relationships for this character.

Character: {data}
Context: {context}

Identify relationships of types: APPEARS_IN (scenes), LOVES/HATES (other characters), BEFRIENDS, OPPOSES, MENTORS, FREQUENTS (locations).

For each relationship, provide: type, target entity ID, confidence (0-1), and reasoning.
Return as JSON array.`,

    templateVariables: ['projectType', 'projectName', 'projectGenre', 'projectThemes', 'data', 'context'],
  },

  features: {
    enableCaching: true,
    enableAsync: false,
    enableValidation: true,
    enableRelationshipDiscovery: true,
    enableQualityScoring: true,
    enableAuditLog: true,
  },
}
