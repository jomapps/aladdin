/**
 * Test Fixtures - Configuration Data
 * Sample configuration objects for testing
 */

import type { EntityConfig, AgentConfig } from '@/lib/agents/data-preparation/types'

export const mockAgentConfig: AgentConfig = {
  llm: {
    apiKey: 'test-api-key',
    baseUrl: 'https://test-llm.com/api/v1',
    defaultModel: 'test-model',
    backupModel: 'test-backup-model'
  },
  brain: {
    apiUrl: 'https://test-brain.com',
    apiKey: 'test-brain-key'
  },
  redis: {
    url: 'redis://localhost:6379'
  },
  cache: {
    projectContextTTL: 300,
    documentTTL: 3600,
    entityTTL: 1800
  },
  queue: {
    concurrency: 5,
    maxRetries: 3
  },
  features: {
    enableCaching: true,
    enableQueue: true,
    enableValidation: true,
    enableRelationshipDiscovery: true
  }
}

export const mockCharacterConfig: EntityConfig = {
  type: 'character',
  requiredFields: ['name', 'description'],
  contextSources: ['project', 'payload', 'brain', 'opendb'],
  metadataTemplate: {
    fields: [
      'characterType',
      'role',
      'archetypePattern',
      'visualSignature',
      'personalityTraits',
      'storyFunction',
      'thematicConnection',
      'narrativeArc',
      'emotionalJourney'
    ],
    llmPrompt: `Analyze this character in the context of {{projectName}} ({{genre}}).

Character: {{name}}
Description: {{description}}

Determine:
1. Character type (protagonist, antagonist, supporting, minor)
2. Role in the story
3. Archetype pattern
4. Visual signature
5. Personality traits
6. Story function
7. Thematic connection
8. Narrative arc
9. Emotional journey

Return a JSON object with these fields.`
  },
  relationshipRules: [
    { type: 'APPEARS_IN', targetType: 'scene', auto: true },
    { type: 'LIVES_IN', targetType: 'location', auto: false },
    { type: 'RELATES_TO', targetType: 'character', auto: false, bidirectional: true }
  ],
  enrichmentStrategy: 'comprehensive',
  validationRules: [
    {
      field: 'name',
      rule: 'required',
      message: 'Character name is required'
    },
    {
      field: 'name',
      rule: 'minLength',
      value: 2,
      message: 'Character name must be at least 2 characters'
    },
    {
      field: 'description',
      rule: 'required',
      message: 'Character description is required'
    },
    {
      field: 'description',
      rule: 'minLength',
      value: 10,
      message: 'Character description must be at least 10 characters'
    }
  ]
}

export const mockSceneConfig: EntityConfig = {
  type: 'scene',
  requiredFields: ['name', 'content'],
  contextSources: ['project', 'payload', 'brain'],
  metadataTemplate: {
    fields: [
      'sceneType',
      'narrativeFunction',
      'emotionalTone',
      'plotSignificance',
      'characterDevelopment',
      'thematicElements',
      'visualStyle',
      'pacing'
    ],
    llmPrompt: 'Analyze scene {{name}} in project {{projectName}}'
  },
  relationshipRules: [
    { type: 'CONTAINS', targetType: 'character', auto: true },
    { type: 'LOCATED_IN', targetType: 'location', auto: true },
    { type: 'FOLLOWS', targetType: 'scene', auto: false }
  ],
  enrichmentStrategy: 'comprehensive',
  validationRules: [
    {
      field: 'name',
      rule: 'required',
      message: 'Scene name is required'
    },
    {
      field: 'content',
      rule: 'required',
      message: 'Scene content is required'
    },
    {
      field: 'content',
      rule: 'minLength',
      value: 20,
      message: 'Scene content must be at least 20 characters'
    }
  ]
}

export const mockLocationConfig: EntityConfig = {
  type: 'location',
  requiredFields: ['name', 'description'],
  contextSources: ['project', 'payload', 'brain'],
  metadataTemplate: {
    fields: [
      'locationType',
      'atmosphere',
      'significance',
      'visualElements'
    ],
    llmPrompt: 'Describe location {{name}} in {{projectName}}'
  },
  relationshipRules: [
    { type: 'HOSTS', targetType: 'scene', auto: true },
    { type: 'HOUSES', targetType: 'character', auto: false }
  ],
  enrichmentStrategy: 'standard',
  validationRules: [
    {
      field: 'name',
      rule: 'required',
      message: 'Location name is required'
    }
  ]
}

export const mockMinimalConfig: EntityConfig = {
  type: 'minimal',
  requiredFields: ['name'],
  contextSources: ['project'],
  relationshipRules: [],
  enrichmentStrategy: 'minimal'
}

export const mockCustomConfig: EntityConfig = {
  type: 'custom',
  requiredFields: ['name', 'customField1', 'customField2'],
  contextSources: ['project', 'payload'],
  metadataTemplate: {
    fields: ['customMetadata1', 'customMetadata2'],
    llmPrompt: 'Custom prompt for {{name}}'
  },
  relationshipRules: [
    { type: 'CUSTOM_RELATIONSHIP', targetType: 'custom', auto: true }
  ],
  enrichmentStrategy: 'standard',
  validationRules: [
    {
      field: 'customField1',
      rule: 'pattern',
      value: '^[A-Z]+$',
      message: 'Custom field 1 must be uppercase letters only'
    },
    {
      field: 'customField2',
      rule: 'maxLength',
      value: 100,
      message: 'Custom field 2 must not exceed 100 characters'
    }
  ]
}

export const mockConfigRegistry: Record<string, EntityConfig> = {
  character: mockCharacterConfig,
  scene: mockSceneConfig,
  location: mockLocationConfig
}

export const mockDisabledFeaturesConfig: AgentConfig = {
  ...mockAgentConfig,
  features: {
    enableCaching: false,
    enableQueue: false,
    enableValidation: false,
    enableRelationshipDiscovery: false
  }
}

export const mockHighPerformanceConfig: AgentConfig = {
  ...mockAgentConfig,
  cache: {
    projectContextTTL: 600,
    documentTTL: 7200,
    entityTTL: 3600
  },
  queue: {
    concurrency: 10,
    maxRetries: 5
  }
}

export const mockLowResourceConfig: AgentConfig = {
  ...mockAgentConfig,
  cache: {
    projectContextTTL: 60,
    documentTTL: 300,
    entityTTL: 180
  },
  queue: {
    concurrency: 2,
    maxRetries: 1
  }
}
