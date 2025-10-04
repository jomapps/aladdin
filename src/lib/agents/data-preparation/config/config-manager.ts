/**
 * Configuration Manager - Centralized entity-specific configuration
 * Manages entity configurations, prompts, validation rules, and feature flags
 */

import type { EntityRule, ValidationRule, AgentConfig } from '../types'
import type { EntityConfig } from './types'
import {
  characterConfig,
  sceneConfig,
  locationConfig,
  episodeConfig,
  conceptConfig,
} from './entities'

export interface PromptTemplate {
  name: string
  template: string
  variables: string[]
  description: string
}

export class ConfigManager {
  private entityConfigs: Map<string, EntityConfig> = new Map()
  private promptTemplates: Map<string, PromptTemplate> = new Map()
  private globalConfig: AgentConfig
  private configCache: Map<string, { data: any; timestamp: number }> = new Map()
  private cacheTTL: number = 300000 // 5 minutes

  constructor(globalConfig: AgentConfig) {
    this.globalConfig = globalConfig
    this.loadEntityConfigs()
    this.loadPromptTemplates()
  }

  /**
   * Get entity-specific configuration
   */
  getEntityConfig(entityType: string): EntityConfig | null {
    const cached = this.configCache.get(`entity:${entityType}`)
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data
    }

    const config = this.entityConfigs.get(entityType)
    if (config) {
      this.configCache.set(`entity:${entityType}`, {
        data: config,
        timestamp: Date.now(),
      })
    }

    return config || null
  }

  /**
   * Get entity configuration with fallback to defaults
   */
  getEntityConfigOrDefault(entityType: string): EntityConfig {
    return this.getEntityConfig(entityType) || this.getDefaultConfig(entityType)
  }

  /**
   * Get prompt template with variable substitution
   */
  getPrompt(
    entityType: string,
    promptType: 'analysis' | 'metadata' | 'summary' | 'relationships',
    variables: Record<string, any> = {},
  ): string {
    const config = this.getEntityConfig(entityType)
    if (!config) {
      console.warn(`[ConfigManager] No config found for entity type: ${entityType}`)
      return this.getDefaultPrompt(promptType, variables)
    }

    let prompt = config.prompts[promptType]
    if (!prompt) {
      console.warn(`[ConfigManager] No ${promptType} prompt found for ${entityType}`)
      return this.getDefaultPrompt(promptType, variables)
    }

    // Substitute variables
    prompt = this.substituteVariables(prompt, variables)

    return prompt
  }

  /**
   * Get LLM settings for entity type
   */
  getLLMSettings(entityType: string): {
    temperature: number
    maxTokens: number
    model?: string
  } {
    const config = this.getEntityConfig(entityType)
    const defaults = {
      temperature: 0.3,
      maxTokens: 1500,
    }

    if (!config || !config.llmSettings) {
      return defaults
    }

    return {
      temperature: config.llmSettings.temperature ?? defaults.temperature,
      maxTokens: config.llmSettings.maxTokens ?? defaults.maxTokens,
      model: config.llmSettings.model,
    }
  }

  /**
   * Get validation rules for entity type
   */
  getValidationRules(entityType: string): ValidationRule[] {
    const config = this.getEntityConfig(entityType)
    return config?.validationRules || this.getDefaultValidationRules()
  }

  /**
   * Get quality thresholds for entity type
   */
  getQualityThresholds(entityType: string): EntityConfig['qualityThresholds'] {
    const config = this.getEntityConfig(entityType)
    return (
      config?.qualityThresholds || {
        minTextLength: 10,
        maxTextLength: 10000,
        minMetadataFields: 1,
        minRelationships: 0,
      }
    )
  }

  /**
   * Check feature flag for entity type
   */
  isFeatureEnabled(
    entityType: string,
    feature: keyof NonNullable<EntityConfig['featureFlags']>,
  ): boolean {
    const config = this.getEntityConfig(entityType)

    // Entity-specific feature flag
    if (config?.featureFlags?.[feature] !== undefined) {
      return config.featureFlags[feature]!
    }

    // Global feature flag
    const globalFeatureMap: Record<string, keyof AgentConfig['features']> = {
      enableCaching: 'enableCaching',
      enableValidation: 'enableValidation',
      enableRelationshipDiscovery: 'enableRelationshipDiscovery',
    }

    const globalFeature = globalFeatureMap[feature]
    if (globalFeature && this.globalConfig.features[globalFeature] !== undefined) {
      return this.globalConfig.features[globalFeature]
    }

    // Default to true for known features
    return true
  }

  /**
   * Get relationship rules for entity type
   */
  getRelationshipRules(entityType: string): EntityConfig['relationshipRules'] {
    const config = this.getEntityConfig(entityType)
    return config?.relationshipRules || []
  }

  /**
   * Get enrichment strategy for entity type
   */
  getEnrichmentStrategy(entityType: string): 'minimal' | 'standard' | 'comprehensive' {
    const config = this.getEntityConfig(entityType)
    return config?.enrichmentStrategy || 'standard'
  }

  /**
   * Register custom entity configuration
   */
  registerEntityConfig(config: EntityConfig): void {
    this.entityConfigs.set(config.type, config)
    this.configCache.delete(`entity:${config.type}`)
    console.log(`[ConfigManager] Registered config for entity type: ${config.type}`)
  }

  /**
   * Load entity configurations
   */
  private loadEntityConfigs(): void {
    // Import entity configurations
    try {
      this.entityConfigs.set('character', characterConfig)
      this.entityConfigs.set('scene', sceneConfig)
      this.entityConfigs.set('location', locationConfig)
      this.entityConfigs.set('episode', episodeConfig)
      this.entityConfigs.set('concept', conceptConfig)

      console.log(
        '[ConfigManager] Loaded entity configurations:',
        Array.from(this.entityConfigs.keys()),
      )
    } catch (error) {
      console.warn('[ConfigManager] Failed to load entity configs, using defaults:', error)
    }
  }

  /**
   * Load prompt templates
   */
  private loadPromptTemplates(): void {
    // Prompt templates can be loaded from files or defined here
    // For now, they're embedded in entity configs
    console.log('[ConfigManager] Prompt templates loaded from entity configs')
  }

  /**
   * Substitute variables in prompt template
   */
  private substituteVariables(template: string, variables: Record<string, any>): string {
    let result = template

    for (const [key, value] of Object.entries(variables)) {
      const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
      const stringValue = typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)
      result = result.replace(placeholder, stringValue)
    }

    return result
  }

  /**
   * Get default configuration for unknown entity types
   */
  private getDefaultConfig(entityType: string): EntityConfig {
    return {
      type: entityType,
      requiredFields: ['name', 'description'],
      contextSources: ['payload', 'brain', 'project'],
      prompts: {
        analysis: this.getDefaultPrompt('analysis'),
        metadata: this.getDefaultPrompt('metadata'),
        summary: this.getDefaultPrompt('summary'),
        relationships: this.getDefaultPrompt('relationships'),
      },
      validationRules: this.getDefaultValidationRules(),
      relationshipRules: [],
      enrichmentStrategy: 'standard',
      qualityThresholds: {
        minTextLength: 10,
        maxTextLength: 10000,
        minMetadataFields: 1,
      },
    }
  }

  /**
   * Get default prompt by type
   */
  private getDefaultPrompt(
    promptType: 'analysis' | 'metadata' | 'summary' | 'relationships',
    variables: Record<string, any> = {},
  ): string {
    const prompts: Record<string, string> = {
      analysis: 'Analyze this {{entityType}} entity and determine appropriate metadata fields.',
      metadata: 'Extract metadata for this {{entityType}} based on the provided data and context.',
      summary: 'Generate a comprehensive summary for this {{entityType}} entity.',
      relationships: 'Identify relationships between this {{entityType}} and other entities.',
    }

    return this.substituteVariables(prompts[promptType] || '', variables)
  }

  /**
   * Get default validation rules
   */
  private getDefaultValidationRules(): ValidationRule[] {
    return [
      {
        field: 'text',
        rule: 'required',
        message: 'Text content is required',
      },
      {
        field: 'text',
        rule: 'minLength',
        value: 10,
        message: 'Text must be at least 10 characters',
      },
    ]
  }

  /**
   * Clear configuration cache
   */
  clearCache(): void {
    this.configCache.clear()
    console.log('[ConfigManager] Configuration cache cleared')
  }

  /**
   * Get all registered entity types
   */
  getRegisteredEntityTypes(): string[] {
    return Array.from(this.entityConfigs.keys())
  }

  /**
   * Check if entity type is registered
   */
  hasEntityConfig(entityType: string): boolean {
    return this.entityConfigs.has(entityType)
  }
}

/**
 * Migration helper - converts old AgentConfig to new ConfigManager
 */
export function migrateToConfigManager(oldConfig: AgentConfig): ConfigManager {
  console.log('[ConfigManager] Migrating from legacy AgentConfig to ConfigManager')
  return new ConfigManager(oldConfig)
}

/**
 * Create default ConfigManager instance
 */
export function createDefaultConfigManager(): ConfigManager {
  const defaultConfig: AgentConfig = {
    llm: {
      apiKey: process.env.OPENROUTER_API_KEY || '',
      baseUrl: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
      defaultModel: process.env.OPENROUTER_DEFAULT_MODEL || 'anthropic/claude-sonnet-4.5',
      backupModel: process.env.OPENROUTER_BACKUP_MODEL,
    },
    brain: {
      apiUrl: process.env.BRAIN_SERVICE_BASE_URL || 'https://brain.ft.tc',
      apiKey: process.env.BRAIN_SERVICE_API_KEY || '',
    },
    redis: {
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    },
    cache: {
      projectContextTTL: 300,
      documentTTL: 3600,
      entityTTL: 1800,
    },
    queue: {
      concurrency: 5,
      maxRetries: 3,
    },
    features: {
      enableCaching: true,
      enableQueue: true,
      enableValidation: true,
      enableRelationshipDiscovery: true,
    },
  }

  return new ConfigManager(defaultConfig)
}
