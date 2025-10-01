/**
 * ConfigManager Unit Tests
 * Tests for the configuration management system
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { EntityConfig, AgentConfig } from '@/lib/agents/data-preparation/types'

// Mock the ConfigManager (will be implemented by other agents)
class ConfigManager {
  private configs: Map<string, EntityConfig>
  private agentConfig: AgentConfig

  constructor(agentConfig: AgentConfig) {
    this.agentConfig = agentConfig
    this.configs = new Map()
  }

  register(entityType: string, config: EntityConfig): void {
    this.configs.set(entityType, config)
  }

  get(entityType: string): EntityConfig | undefined {
    return this.configs.get(entityType)
  }

  getOrDefault(entityType: string): EntityConfig {
    return this.configs.get(entityType) || this.getDefaultConfig(entityType)
  }

  has(entityType: string): boolean {
    return this.configs.has(entityType)
  }

  getPrompt(entityType: string, promptType: string, variables?: Record<string, any>): string {
    const config = this.getOrDefault(entityType)
    const template = config.metadataTemplate?.llmPrompt || ''

    if (!variables) return template

    // Simple variable substitution
    return Object.entries(variables).reduce((prompt, [key, value]) => {
      return prompt.replace(new RegExp(`{{${key}}}`, 'g'), String(value))
    }, template)
  }

  validate(entityType: string, data: any): { valid: boolean; errors: string[] } {
    const config = this.getOrDefault(entityType)
    const errors: string[] = []

    // Check required fields
    config.requiredFields.forEach(field => {
      if (!data[field]) {
        errors.push(`Missing required field: ${field}`)
      }
    })

    // Check validation rules
    config.validationRules?.forEach(rule => {
      if (rule.rule === 'required' && !data[rule.field]) {
        errors.push(rule.message)
      }
      if (rule.rule === 'minLength' && data[rule.field]?.length < rule.value) {
        errors.push(rule.message)
      }
      if (rule.rule === 'maxLength' && data[rule.field]?.length > rule.value) {
        errors.push(rule.message)
      }
      if (rule.rule === 'pattern' && !new RegExp(rule.value).test(data[rule.field])) {
        errors.push(rule.message)
      }
    })

    return { valid: errors.length === 0, errors }
  }

  isFeatureEnabled(feature: string): boolean {
    return (this.agentConfig.features as any)[feature] ?? false
  }

  private getDefaultConfig(entityType: string): EntityConfig {
    return {
      type: entityType,
      requiredFields: ['name'],
      contextSources: ['project', 'payload'],
      relationshipRules: [],
      enrichmentStrategy: 'standard'
    }
  }

  getAllConfigs(): Map<string, EntityConfig> {
    return new Map(this.configs)
  }

  loadFromRegistry(registry: Record<string, EntityConfig>): void {
    Object.entries(registry).forEach(([type, config]) => {
      this.register(type, config)
    })
  }
}

describe('ConfigManager', () => {
  let configManager: ConfigManager
  let mockAgentConfig: AgentConfig

  beforeEach(() => {
    mockAgentConfig = {
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

    configManager = new ConfigManager(mockAgentConfig)
  })

  describe('Initialization', () => {
    it('should initialize with empty configs', () => {
      expect(configManager.getAllConfigs().size).toBe(0)
    })

    it('should store agent config', () => {
      expect(configManager.isFeatureEnabled('enableCaching')).toBe(true)
    })
  })

  describe('Configuration Registration', () => {
    it('should register a new entity configuration', () => {
      const config: EntityConfig = {
        type: 'character',
        requiredFields: ['name', 'description'],
        contextSources: ['project', 'payload', 'brain'],
        relationshipRules: [],
        enrichmentStrategy: 'comprehensive'
      }

      configManager.register('character', config)

      expect(configManager.has('character')).toBe(true)
      expect(configManager.get('character')).toEqual(config)
    })

    it('should override existing configuration', () => {
      const config1: EntityConfig = {
        type: 'scene',
        requiredFields: ['name'],
        contextSources: ['project'],
        relationshipRules: [],
        enrichmentStrategy: 'minimal'
      }

      const config2: EntityConfig = {
        type: 'scene',
        requiredFields: ['name', 'description'],
        contextSources: ['project', 'payload'],
        relationshipRules: [],
        enrichmentStrategy: 'standard'
      }

      configManager.register('scene', config1)
      configManager.register('scene', config2)

      expect(configManager.get('scene')).toEqual(config2)
    })

    it('should load multiple configs from registry', () => {
      const registry = {
        character: {
          type: 'character',
          requiredFields: ['name'],
          contextSources: ['project', 'payload'],
          relationshipRules: [],
          enrichmentStrategy: 'comprehensive'
        } as EntityConfig,
        scene: {
          type: 'scene',
          requiredFields: ['name'],
          contextSources: ['project'],
          relationshipRules: [],
          enrichmentStrategy: 'standard'
        } as EntityConfig
      }

      configManager.loadFromRegistry(registry)

      expect(configManager.has('character')).toBe(true)
      expect(configManager.has('scene')).toBe(true)
      expect(configManager.getAllConfigs().size).toBe(2)
    })
  })

  describe('Configuration Retrieval', () => {
    beforeEach(() => {
      const config: EntityConfig = {
        type: 'character',
        requiredFields: ['name', 'description'],
        contextSources: ['project', 'payload', 'brain'],
        relationshipRules: [
          { type: 'APPEARS_IN', targetType: 'scene', auto: true },
          { type: 'LIVES_IN', targetType: 'location', auto: false }
        ],
        enrichmentStrategy: 'comprehensive'
      }

      configManager.register('character', config)
    })

    it('should get existing configuration', () => {
      const config = configManager.get('character')

      expect(config).toBeDefined()
      expect(config?.type).toBe('character')
      expect(config?.requiredFields).toContain('name')
      expect(config?.requiredFields).toContain('description')
    })

    it('should return undefined for non-existent configuration', () => {
      const config = configManager.get('nonexistent')

      expect(config).toBeUndefined()
    })

    it('should return default config for non-existent entity', () => {
      const config = configManager.getOrDefault('unknown')

      expect(config).toBeDefined()
      expect(config.type).toBe('unknown')
      expect(config.requiredFields).toContain('name')
      expect(config.enrichmentStrategy).toBe('standard')
    })

    it('should check if configuration exists', () => {
      expect(configManager.has('character')).toBe(true)
      expect(configManager.has('unknown')).toBe(false)
    })
  })

  describe('Prompt Template Handling', () => {
    beforeEach(() => {
      const config: EntityConfig = {
        type: 'character',
        requiredFields: ['name'],
        contextSources: ['project', 'payload'],
        relationshipRules: [],
        enrichmentStrategy: 'comprehensive',
        metadataTemplate: {
          fields: ['characterType', 'role', 'archetypePattern'],
          llmPrompt: 'Analyze character {{name}} in project {{projectName}}. Genre: {{genre}}'
        }
      }

      configManager.register('character', config)
    })

    it('should retrieve prompt template', () => {
      const prompt = configManager.getPrompt('character', 'metadata')

      expect(prompt).toContain('Analyze character')
      expect(prompt).toContain('{{name}}')
      expect(prompt).toContain('{{projectName}}')
    })

    it('should substitute variables in prompt', () => {
      const prompt = configManager.getPrompt('character', 'metadata', {
        name: 'John Doe',
        projectName: 'Test Movie',
        genre: 'Action'
      })

      expect(prompt).toContain('John Doe')
      expect(prompt).toContain('Test Movie')
      expect(prompt).toContain('Action')
      expect(prompt).not.toContain('{{name}}')
      expect(prompt).not.toContain('{{projectName}}')
    })

    it('should handle missing template gracefully', () => {
      const prompt = configManager.getPrompt('scene', 'metadata')

      expect(prompt).toBe('')
    })
  })

  describe('Validation', () => {
    beforeEach(() => {
      const config: EntityConfig = {
        type: 'character',
        requiredFields: ['name', 'description'],
        contextSources: ['project', 'payload'],
        relationshipRules: [],
        enrichmentStrategy: 'standard',
        validationRules: [
          {
            field: 'name',
            rule: 'required',
            message: 'Name is required'
          },
          {
            field: 'name',
            rule: 'minLength',
            value: 2,
            message: 'Name must be at least 2 characters'
          },
          {
            field: 'description',
            rule: 'maxLength',
            value: 500,
            message: 'Description must not exceed 500 characters'
          }
        ]
      }

      configManager.register('character', config)
    })

    it('should validate data with all required fields', () => {
      const data = {
        name: 'John Doe',
        description: 'A brave hero'
      }

      const result = configManager.validate('character', data)

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should fail validation for missing required fields', () => {
      const data = {
        description: 'A brave hero'
      }

      const result = configManager.validate('character', data)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Missing required field: name')
    })

    it('should validate minLength rule', () => {
      const data = {
        name: 'J',
        description: 'A brave hero'
      }

      const result = configManager.validate('character', data)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Name must be at least 2 characters')
    })

    it('should validate maxLength rule', () => {
      const data = {
        name: 'John Doe',
        description: 'A'.repeat(501)
      }

      const result = configManager.validate('character', data)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Description must not exceed 500 characters')
    })

    it('should return multiple errors', () => {
      const data = {
        name: 'J',
        description: 'A'.repeat(501)
      }

      const result = configManager.validate('character', data)

      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(1)
    })
  })

  describe('Feature Flags', () => {
    it('should check if caching is enabled', () => {
      expect(configManager.isFeatureEnabled('enableCaching')).toBe(true)
    })

    it('should check if queue is enabled', () => {
      expect(configManager.isFeatureEnabled('enableQueue')).toBe(true)
    })

    it('should check if validation is enabled', () => {
      expect(configManager.isFeatureEnabled('enableValidation')).toBe(true)
    })

    it('should check if relationship discovery is enabled', () => {
      expect(configManager.isFeatureEnabled('enableRelationshipDiscovery')).toBe(true)
    })

    it('should return false for disabled features', () => {
      const config = {
        ...mockAgentConfig,
        features: {
          enableCaching: false,
          enableQueue: false,
          enableValidation: false,
          enableRelationshipDiscovery: false
        }
      }

      const manager = new ConfigManager(config)

      expect(manager.isFeatureEnabled('enableCaching')).toBe(false)
      expect(manager.isFeatureEnabled('enableQueue')).toBe(false)
    })

    it('should return false for unknown features', () => {
      expect(configManager.isFeatureEnabled('unknownFeature')).toBe(false)
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty required fields', () => {
      const config: EntityConfig = {
        type: 'minimal',
        requiredFields: [],
        contextSources: ['project'],
        relationshipRules: [],
        enrichmentStrategy: 'minimal'
      }

      configManager.register('minimal', config)

      const result = configManager.validate('minimal', {})

      expect(result.valid).toBe(true)
    })

    it('should handle null values in validation', () => {
      const config: EntityConfig = {
        type: 'test',
        requiredFields: ['name'],
        contextSources: ['project'],
        relationshipRules: [],
        enrichmentStrategy: 'minimal'
      }

      configManager.register('test', config)

      const result = configManager.validate('test', { name: null })

      expect(result.valid).toBe(false)
    })

    it('should handle undefined values in validation', () => {
      const config: EntityConfig = {
        type: 'test',
        requiredFields: ['name'],
        contextSources: ['project'],
        relationshipRules: [],
        enrichmentStrategy: 'minimal'
      }

      configManager.register('test', config)

      const result = configManager.validate('test', { name: undefined })

      expect(result.valid).toBe(false)
    })
  })
})
