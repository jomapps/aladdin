/**
 * Default Configuration Templates
 * Pre-configured entity types and common validation functions
 */

import type {
  ConfigurationSchema,
  EntityConfig,
  MetadataFieldConfig,
  RelationshipTypeConfig,
  ValidationRule,
  EnrichmentStrategy,
  LLMPromptConfig,
  GlobalConfig,
} from './types'

/**
 * Default enrichment strategies
 */
export const DEFAULT_ENRICHMENT_STRATEGIES: Record<string, EnrichmentStrategy> = {
  minimal: {
    level: 'minimal',
    useLLM: false,
    contextGathering: {
      sources: ['payload', 'project'],
      maxItemsPerSource: 10,
      includeSimilar: false,
      useCache: true,
      cacheTTL: 300,
    },
    relationshipDiscovery: {
      enabled: false,
      discoverTypes: [],
      confidenceThreshold: 0.8,
      maxRelationships: 5,
      useLLM: false,
      validateDiscovered: false,
    },
    metadataGeneration: {
      fields: [],
      useLLM: false,
      includeExamples: false,
    },
  },
  standard: {
    level: 'standard',
    useLLM: true,
    contextGathering: {
      sources: ['payload', 'brain', 'project'],
      maxItemsPerSource: 25,
      includeSimilar: true,
      similarityThreshold: 0.7,
      useCache: true,
      cacheTTL: 300,
    },
    relationshipDiscovery: {
      enabled: true,
      discoverTypes: ['relates_to', 'references', 'appears_in'],
      confidenceThreshold: 0.7,
      maxRelationships: 15,
      useLLM: true,
      validateDiscovered: true,
    },
    metadataGeneration: {
      fields: ['summary', 'tags', 'sentiment'],
      useLLM: true,
      temperature: 0.3,
      maxTokens: 1000,
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
  comprehensive: {
    level: 'comprehensive',
    useLLM: true,
    contextGathering: {
      sources: ['payload', 'brain', 'opendb', 'project'],
      maxItemsPerSource: 50,
      includeSimilar: true,
      similarityThreshold: 0.6,
      useCache: true,
      cacheTTL: 300,
    },
    relationshipDiscovery: {
      enabled: true,
      discoverTypes: ['relates_to', 'references', 'appears_in', 'influences', 'conflicts_with'],
      confidenceThreshold: 0.6,
      maxRelationships: 30,
      useLLM: true,
      validateDiscovered: true,
    },
    metadataGeneration: {
      fields: ['summary', 'tags', 'sentiment', 'themes', 'significance', 'narrative_function'],
      useLLM: true,
      temperature: 0.3,
      maxTokens: 2000,
      includeExamples: true,
      exampleCount: 3,
    },
    qualityThresholds: {
      minMetadataCompleteness: 0.8,
      minRelationshipConfidence: 0.6,
      minQualityScore: 70,
      blockLowQuality: false,
    },
  },
}

/**
 * Common metadata fields used across entity types
 */
export const COMMON_METADATA_FIELDS: Record<string, MetadataFieldConfig> = {
  summary: {
    name: 'summary',
    type: 'string',
    description: 'Brief summary of the entity',
    required: false,
    useLLM: true,
    llmPrompt: 'Generate a concise summary (2-3 sentences) of this entity.',
    searchable: true,
    validation: {
      minLength: 10,
      maxLength: 500,
      errorMessage: 'Summary must be between 10 and 500 characters',
    },
  },
  tags: {
    name: 'tags',
    type: 'array',
    description: 'Relevant tags for categorization',
    required: false,
    useLLM: true,
    isArray: true,
    llmPrompt: 'Generate 3-5 relevant tags for categorization.',
    searchable: true,
  },
  sentiment: {
    name: 'sentiment',
    type: 'enum',
    description: 'Overall emotional tone',
    required: false,
    useLLM: true,
    enumValues: ['positive', 'negative', 'neutral', 'mixed'],
    defaultValue: 'neutral',
  },
  significance: {
    name: 'significance',
    type: 'enum',
    description: 'Narrative significance level',
    required: false,
    useLLM: true,
    enumValues: ['low', 'medium', 'high', 'critical'],
    defaultValue: 'medium',
  },
  confidence: {
    name: 'confidence',
    type: 'number',
    description: 'Confidence score for generated metadata',
    required: false,
    useLLM: false,
    defaultValue: 0.8,
    constraints: {
      min: 0,
      max: 1,
    },
  },
}

/**
 * Common relationship types
 */
export const COMMON_RELATIONSHIP_TYPES: Record<string, RelationshipTypeConfig> = {
  relates_to: {
    type: 'relates_to',
    displayName: 'Relates To',
    description: 'General relationship between entities',
    targetTypes: ['*'], // All types
    autoDiscover: true,
    bidirectional: false,
    confidenceThreshold: 0.7,
    properties: [
      {
        name: 'strength',
        type: 'enum',
        description: 'Relationship strength',
        required: false,
        defaultValue: 'medium',
      },
    ],
  },
  appears_in: {
    type: 'appears_in',
    displayName: 'Appears In',
    description: 'Entity appears in another entity',
    targetTypes: ['scene', 'episode', 'act'],
    autoDiscover: true,
    bidirectional: true,
    inverseType: 'contains',
    confidenceThreshold: 0.8,
  },
  references: {
    type: 'references',
    displayName: 'References',
    description: 'Entity references another entity',
    targetTypes: ['*'],
    autoDiscover: true,
    bidirectional: false,
    confidenceThreshold: 0.6,
  },
  influences: {
    type: 'influences',
    displayName: 'Influences',
    description: 'Entity influences another entity',
    targetTypes: ['character', 'scene', 'plot'],
    autoDiscover: true,
    bidirectional: false,
    confidenceThreshold: 0.7,
    properties: [
      {
        name: 'impact',
        type: 'enum',
        description: 'Impact level',
        required: false,
        defaultValue: 'moderate',
      },
    ],
  },
  conflicts_with: {
    type: 'conflicts_with',
    displayName: 'Conflicts With',
    description: 'Entity conflicts with another entity',
    targetTypes: ['character', 'faction', 'goal'],
    autoDiscover: true,
    bidirectional: true,
    confidenceThreshold: 0.75,
  },
}

/**
 * Common validation rules
 */
export const COMMON_VALIDATION_RULES: Record<string, ValidationRule> = {
  requireName: {
    id: 'require_name',
    field: 'name',
    type: 'required',
    message: 'Name is required',
    severity: 'error',
    blocking: true,
  },
  requireDescription: {
    id: 'require_description',
    field: 'description',
    type: 'required',
    message: 'Description is required',
    severity: 'warning',
    blocking: false,
  },
  minDescriptionLength: {
    id: 'min_description_length',
    field: 'description',
    type: 'minLength',
    value: 10,
    message: 'Description must be at least 10 characters',
    severity: 'warning',
    blocking: false,
  },
}

/**
 * Default LLM prompt configurations
 */
export const DEFAULT_LLM_PROMPTS: Record<string, LLMPromptConfig> = {
  character: {
    systemPrompt: 'You are an expert in character analysis for film and television productions.',
    metadataPromptTemplate: `Analyze the following character and generate comprehensive metadata.

Character: {name}
Description: {description}
Context: {context}

Generate the following fields:
- characterType: protagonist, antagonist, supporting, or minor
- role: Brief description of their role in the story
- archetypePattern: Character archetype (e.g., "Hero", "Mentor", "Trickster")
- personalityTraits: List of 3-5 key personality traits
- narrativeArc: Summary of their character arc
- thematicConnection: How they connect to the story's themes

Return ONLY valid JSON with these fields.`,
    templateVariables: ['name', 'description', 'context'],
    instructions: [
      'Focus on narrative significance',
      'Be concise but insightful',
      'Consider story context',
    ],
  },
  scene: {
    systemPrompt: 'You are an expert in screenplay structure and scene analysis.',
    metadataPromptTemplate: `Analyze the following scene and generate comprehensive metadata.

Scene: {name}
Description: {description}
Context: {context}

Generate the following fields:
- sceneType: action, dialogue, exposition, or transition
- narrativeFunction: Purpose in the story
- emotionalTone: Overall emotional atmosphere
- plotSignificance: low, medium, or high
- pacing: slow, medium, or fast
- thematicElements: List of themes present in this scene

Return ONLY valid JSON with these fields.`,
    templateVariables: ['name', 'description', 'context'],
  },
  location: {
    systemPrompt: 'You are an expert in production design and location scouting.',
    metadataPromptTemplate: `Analyze the following location and generate comprehensive metadata.

Location: {name}
Description: {description}
Context: {context}

Generate the following fields:
- locationType: interior, exterior, or mixed
- atmosphere: Description of the mood and feel
- significance: low, medium, or high
- visualElements: List of key visual elements
- soundscape: Description of the audio environment

Return ONLY valid JSON with these fields.`,
    templateVariables: ['name', 'description', 'context'],
  },
}

/**
 * Character entity configuration
 */
export const CHARACTER_CONFIG: EntityConfig = {
  type: 'character',
  displayName: 'Character',
  description: 'Character entities in the production',
  requiredFields: ['name'],
  optionalFields: ['description', 'role', 'age', 'appearance'],
  contextSources: ['payload', 'brain', 'project'],
  metadataFields: [
    COMMON_METADATA_FIELDS.summary,
    COMMON_METADATA_FIELDS.tags,
    COMMON_METADATA_FIELDS.significance,
    {
      name: 'characterType',
      type: 'enum',
      description: 'Character type in the narrative',
      required: false,
      useLLM: true,
      enumValues: ['protagonist', 'antagonist', 'supporting', 'minor'],
      llmPrompt: 'Determine the character type based on their role in the story.',
    },
    {
      name: 'archetypePattern',
      type: 'string',
      description: 'Character archetype pattern',
      required: false,
      useLLM: true,
      llmPrompt: 'Identify the primary character archetype (e.g., Hero, Mentor, Trickster).',
    },
    {
      name: 'personalityTraits',
      type: 'array',
      description: 'Key personality traits',
      required: false,
      useLLM: true,
      isArray: true,
      llmPrompt: 'List 3-5 defining personality traits.',
    },
    {
      name: 'narrativeArc',
      type: 'string',
      description: 'Character arc summary',
      required: false,
      useLLM: true,
      llmPrompt: 'Summarize the character\'s journey and development.',
    },
  ],
  relationshipTypes: [
    COMMON_RELATIONSHIP_TYPES.appears_in,
    COMMON_RELATIONSHIP_TYPES.relates_to,
    {
      type: 'knows',
      displayName: 'Knows',
      description: 'Character knows another character',
      targetTypes: ['character'],
      autoDiscover: true,
      bidirectional: true,
      confidenceThreshold: 0.7,
    },
    {
      type: 'opposes',
      displayName: 'Opposes',
      description: 'Character opposes another character',
      targetTypes: ['character'],
      autoDiscover: true,
      bidirectional: false,
      confidenceThreshold: 0.8,
    },
  ],
  validationRules: [
    COMMON_VALIDATION_RULES.requireName,
    COMMON_VALIDATION_RULES.requireDescription,
  ],
  enrichmentStrategy: DEFAULT_ENRICHMENT_STRATEGIES.standard,
  llmPromptConfig: DEFAULT_LLM_PROMPTS.character,
  features: {
    enableCaching: true,
    enableValidation: true,
    enableRelationshipDiscovery: true,
    enableQualityScoring: true,
  },
}

/**
 * Scene entity configuration
 */
export const SCENE_CONFIG: EntityConfig = {
  type: 'scene',
  displayName: 'Scene',
  description: 'Scene entities in the production',
  requiredFields: ['name'],
  optionalFields: ['description', 'location', 'timeOfDay'],
  contextSources: ['payload', 'brain', 'project'],
  metadataFields: [
    COMMON_METADATA_FIELDS.summary,
    COMMON_METADATA_FIELDS.tags,
    COMMON_METADATA_FIELDS.sentiment,
    COMMON_METADATA_FIELDS.significance,
    {
      name: 'sceneType',
      type: 'enum',
      description: 'Scene type',
      required: false,
      useLLM: true,
      enumValues: ['action', 'dialogue', 'exposition', 'transition'],
    },
    {
      name: 'narrativeFunction',
      type: 'string',
      description: 'Purpose in the narrative',
      required: false,
      useLLM: true,
    },
    {
      name: 'pacing',
      type: 'enum',
      description: 'Scene pacing',
      required: false,
      useLLM: true,
      enumValues: ['slow', 'medium', 'fast'],
    },
  ],
  relationshipTypes: [
    COMMON_RELATIONSHIP_TYPES.relates_to,
    COMMON_RELATIONSHIP_TYPES.references,
    {
      type: 'contains',
      displayName: 'Contains',
      description: 'Scene contains characters',
      targetTypes: ['character'],
      autoDiscover: true,
      bidirectional: true,
      inverseType: 'appears_in',
      confidenceThreshold: 0.8,
    },
    {
      type: 'set_in',
      displayName: 'Set In',
      description: 'Scene is set in a location',
      targetTypes: ['location'],
      autoDiscover: true,
      bidirectional: false,
      confidenceThreshold: 0.9,
    },
  ],
  validationRules: [COMMON_VALIDATION_RULES.requireName],
  enrichmentStrategy: DEFAULT_ENRICHMENT_STRATEGIES.standard,
  llmPromptConfig: DEFAULT_LLM_PROMPTS.scene,
}

/**
 * Location entity configuration
 */
export const LOCATION_CONFIG: EntityConfig = {
  type: 'location',
  displayName: 'Location',
  description: 'Location entities in the production',
  requiredFields: ['name'],
  optionalFields: ['description', 'type', 'address'],
  contextSources: ['payload', 'brain', 'project'],
  metadataFields: [
    COMMON_METADATA_FIELDS.summary,
    COMMON_METADATA_FIELDS.tags,
    {
      name: 'locationType',
      type: 'enum',
      description: 'Location type',
      required: false,
      useLLM: true,
      enumValues: ['interior', 'exterior', 'mixed'],
    },
    {
      name: 'atmosphere',
      type: 'string',
      description: 'Location atmosphere and mood',
      required: false,
      useLLM: true,
    },
  ],
  relationshipTypes: [COMMON_RELATIONSHIP_TYPES.relates_to],
  validationRules: [COMMON_VALIDATION_RULES.requireName],
  enrichmentStrategy: DEFAULT_ENRICHMENT_STRATEGIES.minimal,
  llmPromptConfig: DEFAULT_LLM_PROMPTS.location,
}

/**
 * Episode entity configuration
 */
export const EPISODE_CONFIG: EntityConfig = {
  type: 'episode',
  displayName: 'Episode',
  description: 'Episode entities for series productions',
  requiredFields: ['name', 'number'],
  optionalFields: ['description', 'season', 'airDate'],
  contextSources: ['payload', 'brain', 'project'],
  metadataFields: [
    COMMON_METADATA_FIELDS.summary,
    COMMON_METADATA_FIELDS.tags,
    {
      name: 'episodeType',
      type: 'enum',
      description: 'Episode type',
      required: false,
      useLLM: true,
      enumValues: ['pilot', 'regular', 'finale', 'special'],
    },
    {
      name: 'thematicFocus',
      type: 'array',
      description: 'Primary themes',
      required: false,
      useLLM: true,
      isArray: true,
    },
  ],
  relationshipTypes: [
    COMMON_RELATIONSHIP_TYPES.relates_to,
    {
      type: 'contains',
      displayName: 'Contains',
      description: 'Episode contains scenes',
      targetTypes: ['scene'],
      autoDiscover: true,
      bidirectional: true,
      inverseType: 'appears_in',
      confidenceThreshold: 0.9,
    },
  ],
  validationRules: [
    COMMON_VALIDATION_RULES.requireName,
    {
      id: 'require_episode_number',
      field: 'number',
      type: 'required',
      message: 'Episode number is required',
      severity: 'error',
      blocking: true,
    },
  ],
  enrichmentStrategy: DEFAULT_ENRICHMENT_STRATEGIES.comprehensive,
}

/**
 * Default global configuration
 */
export const DEFAULT_GLOBAL_CONFIG: GlobalConfig = {
  defaultEnrichmentStrategy: DEFAULT_ENRICHMENT_STRATEGIES.standard,
  defaultContextSources: ['payload', 'brain', 'project'],
  defaultValidationRules: Object.values(COMMON_VALIDATION_RULES),
  defaultLLMConfig: DEFAULT_LLM_PROMPTS.character,
  cache: {
    enabled: true,
    entityTTL: 3600,
    contextTTL: 300,
    metadataTTL: 1800,
    strategy: 'hybrid',
  },
  performance: {
    maxConcurrency: 5,
    requestTimeout: 60000,
    maxRetries: 3,
    retryDelay: 1000,
    batchSize: 10,
  },
  features: {
    enableDebugLogging: false,
    enablePerformanceTracking: true,
    enableMetrics: true,
    enableAuditTrail: true,
    enableErrorReporting: true,
  },
}

/**
 * Default complete configuration schema
 */
export const DEFAULT_CONFIGURATION: ConfigurationSchema = {
  version: '1.0.0',
  name: 'Default Data Preparation Configuration',
  description: 'Standard configuration for Aladdin Data Preparation Agent',
  entities: {
    character: CHARACTER_CONFIG,
    scene: SCENE_CONFIG,
    location: LOCATION_CONFIG,
    episode: EPISODE_CONFIG,
  },
  global: DEFAULT_GLOBAL_CONFIG,
  metadata: {
    author: 'Aladdin System',
    createdAt: new Date().toISOString(),
    tags: ['default', 'production'],
  },
}

/**
 * Validation helper functions
 */
export const ValidationHelpers = {
  /**
   * Validate required field
   */
  isRequired(value: any): boolean {
    if (value === null || value === undefined) return false
    if (typeof value === 'string' && value.trim() === '') return false
    return true
  },

  /**
   * Validate minimum length
   */
  hasMinLength(value: string, minLength: number): boolean {
    return value && value.length >= minLength
  },

  /**
   * Validate maximum length
   */
  hasMaxLength(value: string, maxLength: number): boolean {
    return !value || value.length <= maxLength
  },

  /**
   * Validate pattern
   */
  matchesPattern(value: string, pattern: string): boolean {
    const regex = new RegExp(pattern)
    return regex.test(value)
  },

  /**
   * Validate enum value
   */
  isValidEnum(value: any, enumValues: string[]): boolean {
    return enumValues.includes(value)
  },

  /**
   * Validate number range
   */
  isInRange(value: number, min?: number, max?: number): boolean {
    if (min !== undefined && value < min) return false
    if (max !== undefined && value > max) return false
    return true
  },
}
