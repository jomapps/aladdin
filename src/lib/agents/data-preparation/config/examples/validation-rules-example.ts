/**
 * Validation Rules Examples
 *
 * This file demonstrates how to create custom validation rules
 * for entities in the Data Preparation Agent.
 */

import { getConfigManager } from '../index'
import type { EntityConfig, ValidationRule } from '../types'

/**
 * Example 1: Character Validation with Multiple Rules
 */
const characterValidationConfig: EntityConfig = {
  entityType: 'character',
  requiredFields: ['id', 'name', 'description'],
  optionalFields: ['age', 'occupation', 'personality'],
  contextSources: ['payload', 'brain', 'project'],

  metadataFields: [
    {
      name: 'characterType',
      type: 'string',
      description: 'Character type',
      required: true,
    },
  ],

  relationshipTypes: [],

  validationRules: [
    // Required field
    {
      field: 'name',
      type: 'required',
      message: 'Character name is required',
    },

    // Minimum length
    {
      field: 'name',
      type: 'minLength',
      value: 2,
      message: 'Character name must be at least 2 characters',
    },

    // Maximum length
    {
      field: 'name',
      type: 'maxLength',
      value: 100,
      message: 'Character name must not exceed 100 characters',
    },

    // Description requirements
    {
      field: 'description',
      type: 'required',
      message: 'Character description is required',
    },
    {
      field: 'description',
      type: 'minLength',
      value: 50,
      message: 'Character description must be at least 50 characters (provide meaningful context)',
    },

    // Age validation
    {
      field: 'age',
      type: 'custom',
      value: (data: any) => {
        if (data.age === undefined) return true // Optional field
        const age = Number(data.age)
        return !isNaN(age) && age >= 0 && age <= 150
      },
      message: 'Age must be a number between 0 and 150',
    },

    // Personality validation
    {
      field: 'personality',
      type: 'custom',
      value: (data: any) => {
        if (!data.personality) return true // Optional
        return Array.isArray(data.personality) && data.personality.length > 0
      },
      message: 'Personality must be a non-empty array of traits',
    },
  ],

  enrichmentStrategy: {
    level: 'standard',
    contextGathering: {},
    metadataGeneration: { enabled: true },
    relationshipDiscovery: { enabled: true },

    // Quality thresholds
    qualityThresholds: {
      minMetadataCompleteness: 0.8, // 80% of required metadata fields must be present
      minRelationshipConfidence: 0.7, // Relationships need 70% confidence
      blockLowQuality: false, // Warn but don't block
    },
  },
}

/**
 * Example 2: Scene Validation with Pattern Matching
 */
const sceneValidationConfig: EntityConfig = {
  entityType: 'scene',
  requiredFields: ['id', 'sceneNumber', 'description'],
  optionalFields: ['location', 'timeOfDay', 'characters'],
  contextSources: ['payload', 'brain', 'project'],

  metadataFields: [],
  relationshipTypes: [],

  validationRules: [
    // Scene number must be positive integer
    {
      field: 'sceneNumber',
      type: 'custom',
      value: (data: any) => {
        const num = Number(data.sceneNumber)
        return Number.isInteger(num) && num > 0
      },
      message: 'Scene number must be a positive integer',
    },

    // Description length
    {
      field: 'description',
      type: 'minLength',
      value: 30,
      message: 'Scene description must be at least 30 characters',
    },

    // Location format
    {
      field: 'location',
      type: 'pattern',
      value: /^(INT|EXT|INT\/EXT)\.\s+.+$/i,
      message: 'Location must follow screenplay format: "INT. LOCATION" or "EXT. LOCATION"',
    },

    // Time of day validation
    {
      field: 'timeOfDay',
      type: 'enum',
      value: ['DAY', 'NIGHT', 'DAWN', 'DUSK', 'CONTINUOUS'],
      message: 'Time of day must be: DAY, NIGHT, DAWN, DUSK, or CONTINUOUS',
    },

    // Characters array validation
    {
      field: 'characters',
      type: 'custom',
      value: (data: any) => {
        if (!data.characters) return true
        return (
          Array.isArray(data.characters) &&
          data.characters.every((c: any) => typeof c === 'string' || typeof c?.id === 'string')
        )
      },
      message: 'Characters must be an array of character IDs or names',
    },
  ],

  enrichmentStrategy: {
    level: 'standard',
    contextGathering: {},
    metadataGeneration: { enabled: true },
    relationshipDiscovery: { enabled: true },

    qualityThresholds: {
      minMetadataCompleteness: 0.7,
      minRelationshipConfidence: 0.6,
      blockLowQuality: false,
    },
  },
}

/**
 * Example 3: Strict Email Validation
 */
const contactValidationConfig: EntityConfig = {
  entityType: 'contact',
  requiredFields: ['id', 'name', 'email'],
  optionalFields: ['phone', 'role'],
  contextSources: ['project'],

  metadataFields: [],
  relationshipTypes: [],

  validationRules: [
    // Email pattern
    {
      field: 'email',
      type: 'pattern',
      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: 'Email must be a valid email address',
    },

    // Phone pattern (optional)
    {
      field: 'phone',
      type: 'pattern',
      value: /^\+?[\d\s\-()]+$/,
      message: 'Phone must be a valid phone number format',
    },

    // Custom email domain check
    {
      field: 'email',
      type: 'custom',
      value: (data: any) => {
        if (!data.email) return false
        const allowedDomains = ['gmail.com', 'company.com', 'work.com']
        const domain = data.email.split('@')[1]
        return allowedDomains.includes(domain)
      },
      message: 'Email must be from an allowed domain (gmail.com, company.com, work.com)',
    },

    // Role validation
    {
      field: 'role',
      type: 'enum',
      value: ['writer', 'director', 'producer', 'actor', 'crew'],
      message: 'Role must be one of: writer, director, producer, actor, crew',
    },
  ],

  enrichmentStrategy: {
    level: 'minimal',
    contextGathering: {},
    metadataGeneration: { enabled: false },
    relationshipDiscovery: { enabled: false },

    qualityThresholds: {
      blockLowQuality: true, // Block invalid contacts
    },
  },
}

/**
 * Example 4: Complex Custom Validation Logic
 */
const episodeValidationConfig: EntityConfig = {
  entityType: 'episode',
  requiredFields: ['id', 'episodeNumber', 'seasonNumber', 'title'],
  optionalFields: ['synopsis', 'airDate'],
  contextSources: ['payload', 'brain', 'project'],

  metadataFields: [],
  relationshipTypes: [],

  validationRules: [
    // Episode number validation
    {
      field: 'episodeNumber',
      type: 'custom',
      value: (data: any) => {
        const num = Number(data.episodeNumber)
        return Number.isInteger(num) && num >= 1 && num <= 50 // Max 50 episodes per season
      },
      message: 'Episode number must be between 1 and 50',
    },

    // Season number validation
    {
      field: 'seasonNumber',
      type: 'custom',
      value: (data: any) => {
        const num = Number(data.seasonNumber)
        return Number.isInteger(num) && num >= 1 && num <= 20 // Max 20 seasons
      },
      message: 'Season number must be between 1 and 20',
    },

    // Title validation
    {
      field: 'title',
      type: 'minLength',
      value: 3,
      message: 'Episode title must be at least 3 characters',
    },
    {
      field: 'title',
      type: 'maxLength',
      value: 100,
      message: 'Episode title must not exceed 100 characters',
    },

    // Synopsis validation
    {
      field: 'synopsis',
      type: 'custom',
      value: (data: any) => {
        if (!data.synopsis) return true // Optional
        return data.synopsis.length >= 50 && data.synopsis.length <= 500
      },
      message: 'Synopsis must be between 50 and 500 characters',
    },

    // Air date validation
    {
      field: 'airDate',
      type: 'custom',
      value: (data: any) => {
        if (!data.airDate) return true // Optional
        const date = new Date(data.airDate)
        return date instanceof Date && !isNaN(date.getTime())
      },
      message: 'Air date must be a valid date',
    },

    // Complex validation: Pilot episode rules
    {
      field: 'custom_pilot_check',
      type: 'custom',
      value: (data: any) => {
        if (data.episodeNumber === 1 && data.seasonNumber === 1) {
          // Pilot episode requires longer synopsis
          return data.synopsis && data.synopsis.length >= 100
        }
        return true
      },
      message: 'Pilot episode (S01E01) requires synopsis of at least 100 characters',
    },
  ],

  enrichmentStrategy: {
    level: 'standard',
    contextGathering: {},
    metadataGeneration: { enabled: true },
    relationshipDiscovery: { enabled: true },

    qualityThresholds: {
      minMetadataCompleteness: 0.75,
      minRelationshipConfidence: 0.65,
      blockLowQuality: false,
    },
  },
}

/**
 * Example 5: Conditional Validation Based on Entity Type
 */
export function createConditionalValidation(entityType: string, projectType: 'movie' | 'series'): EntityConfig {
  const baseConfig: EntityConfig = {
    entityType,
    requiredFields: ['id', 'name'],
    optionalFields: [],
    contextSources: ['project'],
    metadataFields: [],
    relationshipTypes: [],
    validationRules: [],
    enrichmentStrategy: {
      level: 'standard',
      contextGathering: {},
      metadataGeneration: { enabled: true },
      relationshipDiscovery: { enabled: true },
    },
  }

  // Movie-specific validation
  if (projectType === 'movie') {
    baseConfig.validationRules.push({
      field: 'runtime',
      type: 'custom',
      value: (data: any) => {
        if (!data.runtime) return true
        const runtime = Number(data.runtime)
        return runtime >= 60 && runtime <= 240 // Movies: 60-240 minutes
      },
      message: 'Movie runtime must be between 60 and 240 minutes',
    })
  }

  // Series-specific validation
  if (projectType === 'series') {
    baseConfig.validationRules.push({
      field: 'seasonNumber',
      type: 'required',
      message: 'Season number is required for series',
    })

    baseConfig.validationRules.push({
      field: 'episodeNumber',
      type: 'required',
      message: 'Episode number is required for series',
    })
  }

  return baseConfig
}

/**
 * Validation Rule Types Reference
 */
export const validationRuleTypes = {
  required: {
    description: 'Field must be present and not empty',
    example: {
      field: 'name',
      type: 'required',
      message: 'Name is required',
    },
  },

  minLength: {
    description: 'String field must meet minimum length',
    example: {
      field: 'description',
      type: 'minLength',
      value: 50,
      message: 'Description must be at least 50 characters',
    },
  },

  maxLength: {
    description: 'String field must not exceed maximum length',
    example: {
      field: 'title',
      type: 'maxLength',
      value: 100,
      message: 'Title must not exceed 100 characters',
    },
  },

  pattern: {
    description: 'Field must match regular expression pattern',
    example: {
      field: 'email',
      type: 'pattern',
      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: 'Invalid email format',
    },
  },

  enum: {
    description: 'Field must be one of allowed values',
    example: {
      field: 'status',
      type: 'enum',
      value: ['draft', 'review', 'published'],
      message: 'Status must be draft, review, or published',
    },
  },

  custom: {
    description: 'Custom validation function',
    example: {
      field: 'age',
      type: 'custom',
      value: (data: any) => {
        const age = Number(data.age)
        return !isNaN(age) && age >= 0 && age <= 150
      },
      message: 'Age must be between 0 and 150',
    },
  },
}

/**
 * Quality Thresholds Reference
 */
export const qualityThresholdsReference = {
  minMetadataCompleteness: {
    description: 'Minimum percentage of required metadata fields that must be present',
    range: '0.0 - 1.0',
    recommended: {
      strict: 0.9, // 90% - very strict
      standard: 0.8, // 80% - balanced
      lenient: 0.6, // 60% - permissive
    },
  },

  minRelationshipConfidence: {
    description: 'Minimum confidence score for relationships',
    range: '0.0 - 1.0',
    recommended: {
      strict: 0.8, // High confidence only
      standard: 0.7, // Balanced
      lenient: 0.5, // Allow uncertain relationships
    },
  },

  blockLowQuality: {
    description: 'Whether to block documents that fail quality checks',
    values: {
      true: 'Throw error if quality thresholds not met',
      false: 'Log warnings but allow processing',
    },
    recommended: {
      production: false, // Don't block in production
      validation: true, // Block during development/testing
    },
  },
}

/**
 * How to register validation configs
 */
export function registerValidationConfigs() {
  const configManager = getConfigManager()

  configManager.registerEntityConfig(characterValidationConfig)
  configManager.registerEntityConfig(sceneValidationConfig)
  configManager.registerEntityConfig(contactValidationConfig)
  configManager.registerEntityConfig(episodeValidationConfig)

  console.log('[Validation] Registered validation configurations')
}

/**
 * Usage Example with Error Handling
 */
export async function validateEntityExample() {
  const { getDataPreparationAgent } = await import('../../agent')

  // Register validations
  registerValidationConfigs()

  const agent = getDataPreparationAgent()

  // Example 1: Valid character
  const validCharacter = {
    id: 'char_001',
    name: 'Sarah Chen',
    description: 'A brilliant neuroscientist with a mysterious past and a determination to uncover the truth about the memory experiments',
    age: 32,
    occupation: 'Neuroscientist',
    personality: ['intelligent', 'determined', 'cautious'],
  }

  try {
    const document = await agent.prepare(validCharacter, {
      projectId: 'proj_001',
      entityType: 'character',
    })
    console.log('✅ Valid character passed validation')
  } catch (error) {
    console.error('❌ Validation failed:', error.message)
  }

  // Example 2: Invalid character (too short description)
  const invalidCharacter = {
    id: 'char_002',
    name: 'Bob',
    description: 'A guy', // Too short (< 50 chars)
    age: 30,
  }

  try {
    await agent.prepare(invalidCharacter, {
      projectId: 'proj_001',
      entityType: 'character',
    })
  } catch (error) {
    console.error('❌ Expected validation error:', error.message)
    // "Character description must be at least 50 characters"
  }

  // Example 3: Test validation directly
  const configManager = getConfigManager()

  const testData = {
    id: 'test_001',
    name: 'T', // Too short
    description: 'This is a test character', // Too short
    age: 999, // Invalid age
  }

  const validation = configManager.validateEntityData('character', testData)

  console.log('Validation result:', {
    valid: validation.valid,
    errors: validation.errors,
    warnings: validation.warnings,
  })
}

/**
 * Best Practices for Validation Rules
 */
export const validationBestPractices = {
  1: 'Be specific in error messages - tell users exactly what is wrong',
  2: 'Use minLength for descriptive fields (50+ chars for meaningful descriptions)',
  3: 'Use enum for fields with fixed options',
  4: 'Use pattern for formatted fields (email, phone, dates)',
  5: 'Use custom for complex logic',
  6: 'Make most fields optional - only require essentials',
  7: 'Set quality thresholds based on use case (strict for production data, lenient for drafts)',
  8: 'Use warnings instead of errors when possible (blockLowQuality: false)',
  9: 'Test validation rules with edge cases',
  10: 'Document validation rules in entity config',
}
