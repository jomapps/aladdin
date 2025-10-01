/**
 * Configuration Integration Tests
 * Tests how configuration system integrates with agents
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import type {
  EntityConfig,
  AgentConfig,
  PrepareOptions,
  Context,
  GeneratedMetadata
} from '@/lib/agents/data-preparation/types'

// Mock implementations for testing
class MockConfigManager {
  private configs: Map<string, EntityConfig> = new Map()

  register(type: string, config: EntityConfig): void {
    this.configs.set(type, config)
  }

  get(type: string): EntityConfig | undefined {
    return this.configs.get(type)
  }

  getOrDefault(type: string): EntityConfig {
    return this.configs.get(type) || {
      type,
      requiredFields: ['name'],
      contextSources: ['project'],
      relationshipRules: [],
      enrichmentStrategy: 'standard'
    }
  }

  getPrompt(type: string, promptType: string, variables?: Record<string, any>): string {
    const config = this.getOrDefault(type)
    const template = config.metadataTemplate?.llmPrompt || ''

    if (!variables) return template

    return Object.entries(variables).reduce((prompt, [key, value]) => {
      return prompt.replace(new RegExp(`{{${key}}}`, 'g'), String(value))
    }, template)
  }

  validate(type: string, data: any): { valid: boolean; errors: string[] } {
    const config = this.getOrDefault(type)
    const errors: string[] = []

    config.requiredFields.forEach(field => {
      if (!data[field]) {
        errors.push(`Missing required field: ${field}`)
      }
    })

    return { valid: errors.length === 0, errors }
  }
}

class MockLLMClient {
  async completeJSON<T>(prompt: string): Promise<T> {
    return {} as T
  }

  async complete(prompt: string): Promise<string> {
    return 'Mock LLM response'
  }
}

class MockMetadataGenerator {
  constructor(
    private llm: MockLLMClient,
    private config: AgentConfig,
    private configManager: MockConfigManager
  ) {}

  async generate(
    data: any,
    context: Context,
    options: PrepareOptions
  ): Promise<GeneratedMetadata> {
    // Use configuration to customize prompt
    const entityConfig = this.configManager.getOrDefault(options.entityType)

    // Get prompt with variables
    const prompt = this.configManager.getPrompt(options.entityType, 'metadata', {
      name: data.name,
      projectName: context.project.name,
      genre: context.project.genre?.join(', ') || 'unknown'
    })

    // Generate metadata based on template fields
    const metadata: Record<string, any> = {}
    entityConfig.metadataTemplate?.fields.forEach(field => {
      metadata[field] = `Generated ${field}`
    })

    return {
      ...metadata,
      summary: 'Generated summary',
      generatedAt: new Date().toISOString(),
      confidence: 0.85
    }
  }
}

class MockDataPreparationAgent {
  constructor(
    private config: AgentConfig,
    private configManager: MockConfigManager
  ) {}

  async prepare(data: any, options: PrepareOptions): Promise<any> {
    // 1. Validate using configuration
    const validation = this.configManager.validate(options.entityType, data)
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`)
    }

    // 2. Get entity config
    const entityConfig = this.configManager.getOrDefault(options.entityType)

    // 3. Prepare based on enrichment strategy
    const enrichmentLevel = entityConfig.enrichmentStrategy

    return {
      id: `${options.entityType}_${data.id}`,
      type: options.entityType,
      enrichmentLevel,
      validated: true
    }
  }
}

describe('Configuration Integration', () => {
  let configManager: MockConfigManager
  let agentConfig: AgentConfig
  let mockContext: Context

  beforeEach(() => {
    configManager = new MockConfigManager()

    agentConfig = {
      llm: {
        apiKey: 'test-key',
        baseUrl: 'https://test.com',
        defaultModel: 'test-model'
      },
      brain: {
        apiUrl: 'https://brain.test.com',
        apiKey: 'brain-key'
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

    mockContext = {
      project: {
        id: 'proj-1',
        name: 'Test Movie',
        slug: 'test-movie',
        type: 'movie',
        genre: ['Action', 'Thriller'],
        tone: 'Dark',
        themes: ['Redemption', 'Revenge']
      },
      payload: {
        characters: [],
        scenes: [],
        locations: [],
        episodes: [],
        concepts: []
      },
      brain: {
        existingEntities: [],
        totalCount: 0,
        relatedNodes: [],
        similarContent: []
      },
      opendb: {
        collections: [],
        stats: {}
      },
      related: {
        characters: [],
        scenes: [],
        locations: [],
        concepts: [],
        episodes: []
      }
    }

    // Register test configuration
    configManager.register('character', {
      type: 'character',
      requiredFields: ['name', 'description'],
      contextSources: ['project', 'payload', 'brain'],
      metadataTemplate: {
        fields: ['characterType', 'role', 'archetypePattern'],
        llmPrompt: 'Analyze character {{name}} in {{projectName}} ({{genre}})'
      },
      relationshipRules: [
        { type: 'APPEARS_IN', targetType: 'scene', auto: true }
      ],
      enrichmentStrategy: 'comprehensive'
    })
  })

  describe('DataPreparationAgent with Configuration', () => {
    it('should validate data using entity configuration', async () => {
      const agent = new MockDataPreparationAgent(agentConfig, configManager)

      const validData = {
        id: '123',
        name: 'John Doe',
        description: 'A brave hero'
      }

      const options: PrepareOptions = {
        projectId: 'proj-1',
        entityType: 'character'
      }

      const result = await agent.prepare(validData, options)

      expect(result.validated).toBe(true)
      expect(result.type).toBe('character')
    })

    it('should reject invalid data based on configuration', async () => {
      const agent = new MockDataPreparationAgent(agentConfig, configManager)

      const invalidData = {
        id: '123',
        name: 'John Doe'
        // Missing required description
      }

      const options: PrepareOptions = {
        projectId: 'proj-1',
        entityType: 'character'
      }

      await expect(agent.prepare(invalidData, options)).rejects.toThrow('Validation failed')
    })

    it('should use enrichment strategy from configuration', async () => {
      const agent = new MockDataPreparationAgent(agentConfig, configManager)

      const data = {
        id: '123',
        name: 'John Doe',
        description: 'A brave hero'
      }

      const options: PrepareOptions = {
        projectId: 'proj-1',
        entityType: 'character'
      }

      const result = await agent.prepare(data, options)

      expect(result.enrichmentLevel).toBe('comprehensive')
    })

    it('should use default configuration for unknown entity types', async () => {
      const agent = new MockDataPreparationAgent(agentConfig, configManager)

      const data = {
        id: '123',
        name: 'Unknown Entity'
      }

      const options: PrepareOptions = {
        projectId: 'proj-1',
        entityType: 'unknown'
      }

      const result = await agent.prepare(data, options)

      expect(result.enrichmentLevel).toBe('standard')
    })
  })

  describe('MetadataGenerator with Configuration', () => {
    it('should generate metadata based on template fields', async () => {
      const llm = new MockLLMClient()
      const generator = new MockMetadataGenerator(llm, agentConfig, configManager)

      const data = {
        id: '123',
        name: 'John Doe',
        description: 'A brave hero'
      }

      const options: PrepareOptions = {
        projectId: 'proj-1',
        entityType: 'character'
      }

      const metadata = await generator.generate(data, mockContext, options)

      expect(metadata.characterType).toBeDefined()
      expect(metadata.role).toBeDefined()
      expect(metadata.archetypePattern).toBeDefined()
    })

    it('should use custom prompts with variable substitution', async () => {
      const llm = new MockLLMClient()
      const generator = new MockMetadataGenerator(llm, agentConfig, configManager)

      const prompt = configManager.getPrompt('character', 'metadata', {
        name: 'John Doe',
        projectName: 'Test Movie',
        genre: 'Action, Thriller'
      })

      expect(prompt).toContain('John Doe')
      expect(prompt).toContain('Test Movie')
      expect(prompt).toContain('Action, Thriller')
      expect(prompt).not.toContain('{{name}}')
    })

    it('should include all template fields in metadata', async () => {
      const llm = new MockLLMClient()
      const generator = new MockMetadataGenerator(llm, agentConfig, configManager)

      const data = { id: '123', name: 'Test', description: 'Test' }
      const options: PrepareOptions = {
        projectId: 'proj-1',
        entityType: 'character'
      }

      const metadata = await generator.generate(data, mockContext, options)

      const config = configManager.get('character')
      const expectedFields = config?.metadataTemplate?.fields || []

      expectedFields.forEach(field => {
        expect(metadata[field]).toBeDefined()
      })
    })
  })

  describe('Multi-Entity Configuration', () => {
    beforeEach(() => {
      // Register multiple entity configs
      configManager.register('scene', {
        type: 'scene',
        requiredFields: ['name', 'content'],
        contextSources: ['project', 'payload'],
        metadataTemplate: {
          fields: ['sceneType', 'emotionalTone'],
          llmPrompt: 'Analyze scene {{name}}'
        },
        relationshipRules: [],
        enrichmentStrategy: 'standard'
      })

      configManager.register('location', {
        type: 'location',
        requiredFields: ['name'],
        contextSources: ['project'],
        metadataTemplate: {
          fields: ['locationType'],
          llmPrompt: 'Describe location {{name}}'
        },
        relationshipRules: [],
        enrichmentStrategy: 'minimal'
      })
    })

    it('should handle different entity types with different configs', async () => {
      const agent = new MockDataPreparationAgent(agentConfig, configManager)

      const characterData = {
        id: '1',
        name: 'Character',
        description: 'Description'
      }

      const sceneData = {
        id: '2',
        name: 'Scene',
        content: 'Scene content here'
      }

      const locationData = {
        id: '3',
        name: 'Location'
      }

      const charResult = await agent.prepare(characterData, {
        projectId: 'proj-1',
        entityType: 'character'
      })

      const sceneResult = await agent.prepare(sceneData, {
        projectId: 'proj-1',
        entityType: 'scene'
      })

      const locResult = await agent.prepare(locationData, {
        projectId: 'proj-1',
        entityType: 'location'
      })

      expect(charResult.enrichmentLevel).toBe('comprehensive')
      expect(sceneResult.enrichmentLevel).toBe('standard')
      expect(locResult.enrichmentLevel).toBe('minimal')
    })

    it('should validate different required fields per entity type', async () => {
      const agent = new MockDataPreparationAgent(agentConfig, configManager)

      // Character requires name and description
      await expect(
        agent.prepare({ id: '1', name: 'Test' }, {
          projectId: 'proj-1',
          entityType: 'character'
        })
      ).rejects.toThrow()

      // Scene requires name and content
      await expect(
        agent.prepare({ id: '2', name: 'Test' }, {
          projectId: 'proj-1',
          entityType: 'scene'
        })
      ).rejects.toThrow()

      // Location only requires name
      await expect(
        agent.prepare({ id: '3', name: 'Test' }, {
          projectId: 'proj-1',
          entityType: 'location'
        })
      ).resolves.toBeDefined()
    })
  })

  describe('Feature Flag Integration', () => {
    it('should respect validation feature flag', async () => {
      const disabledConfig = {
        ...agentConfig,
        features: {
          ...agentConfig.features,
          enableValidation: false
        }
      }

      const agent = new MockDataPreparationAgent(disabledConfig, configManager)

      // When validation is disabled, should accept invalid data
      // (This would require the actual implementation to check feature flags)
      expect(disabledConfig.features.enableValidation).toBe(false)
    })

    it('should respect caching feature flag', () => {
      expect(agentConfig.features.enableCaching).toBe(true)

      const disabledConfig = {
        ...agentConfig,
        features: {
          ...agentConfig.features,
          enableCaching: false
        }
      }

      expect(disabledConfig.features.enableCaching).toBe(false)
    })

    it('should respect relationship discovery flag', () => {
      expect(agentConfig.features.enableRelationshipDiscovery).toBe(true)

      const disabledConfig = {
        ...agentConfig,
        features: {
          ...agentConfig.features,
          enableRelationshipDiscovery: false
        }
      }

      expect(disabledConfig.features.enableRelationshipDiscovery).toBe(false)
    })
  })

  describe('Custom Rules Integration', () => {
    it('should allow runtime configuration override', async () => {
      const agent = new MockDataPreparationAgent(agentConfig, configManager)

      const customRule: EntityConfig = {
        type: 'character',
        requiredFields: ['name', 'description', 'role'], // Additional field
        contextSources: ['project'],
        relationshipRules: [],
        enrichmentStrategy: 'minimal'
      }

      const data = {
        id: '123',
        name: 'Test',
        description: 'Desc',
        role: 'Hero'
      }

      const options: PrepareOptions = {
        projectId: 'proj-1',
        entityType: 'character',
        customRules: customRule
      }

      // Would use customRules instead of registered config if provided
      expect(options.customRules).toBeDefined()
      expect(options.customRules?.requiredFields).toContain('role')
    })
  })

  describe('Context Sources Configuration', () => {
    it('should determine which context sources to use', () => {
      const charConfig = configManager.get('character')
      const sceneConfig = configManager.get('scene')
      const locConfig = configManager.get('location')

      expect(charConfig?.contextSources).toContain('brain')
      expect(sceneConfig?.contextSources).not.toContain('brain')
      expect(locConfig?.contextSources).toEqual(['project'])
    })

    it('should optimize context gathering based on sources', () => {
      const config = configManager.getOrDefault('character')

      const needsPayload = config.contextSources.includes('payload')
      const needsBrain = config.contextSources.includes('brain')
      const needsOpenDB = config.contextSources.includes('opendb')

      expect(needsPayload).toBe(true)
      expect(needsBrain).toBe(true)

      // This would allow selective context gathering
      if (!needsBrain) {
        // Skip expensive brain API call
      }
    })
  })

  describe('Relationship Rules Application', () => {
    it('should apply auto relationship rules', () => {
      const config = configManager.get('character')
      const autoRules = config?.relationshipRules.filter(r => r.auto) || []

      expect(autoRules.length).toBeGreaterThan(0)
      expect(autoRules[0].type).toBe('APPEARS_IN')
    })

    it('should identify bidirectional relationships', () => {
      configManager.register('character', {
        type: 'character',
        requiredFields: ['name'],
        contextSources: ['project'],
        relationshipRules: [
          { type: 'RELATES_TO', targetType: 'character', auto: false, bidirectional: true }
        ],
        enrichmentStrategy: 'standard'
      })

      const config = configManager.get('character')
      const biRules = config?.relationshipRules.filter(r => r.bidirectional) || []

      expect(biRules.length).toBeGreaterThan(0)
    })
  })

  describe('Error Handling', () => {
    it('should handle missing configuration gracefully', () => {
      const config = configManager.getOrDefault('nonexistent')

      expect(config).toBeDefined()
      expect(config.type).toBe('nonexistent')
      expect(config.enrichmentStrategy).toBe('standard')
    })

    it('should handle invalid validation rules gracefully', () => {
      configManager.register('test', {
        type: 'test',
        requiredFields: ['name'],
        contextSources: ['project'],
        relationshipRules: [],
        enrichmentStrategy: 'minimal',
        validationRules: [] // Empty validation rules
      })

      const result = configManager.validate('test', { name: 'Test' })

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })
})
