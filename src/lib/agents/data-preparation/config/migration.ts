/**
 * Migration Helper - Backward Compatibility Utilities
 * Helps migrate from old AgentConfig to new ConfigManager-based system
 */

import type { AgentConfig } from '../types'
import { getConfigManager, ConfigManager } from './config-manager'
import { DEFAULT_CONFIGURATION } from './defaults'

/**
 * Check if code is using old configuration pattern
 */
export function isLegacyConfig(config: any): boolean {
  return (
    config &&
    typeof config === 'object' &&
    'features' in config &&
    'llm' in config &&
    !('entities' in config)
  )
}

/**
 * Migrate from legacy AgentConfig to ConfigManager
 */
export function migrateToConfigManager(legacyConfig: AgentConfig): ConfigManager {
  console.log('[Migration] Converting legacy AgentConfig to ConfigManager')

  // Get or create ConfigManager instance
  const configManager = getConfigManager()

  // Log migration info
  console.log('[Migration] ConfigManager initialized with:')
  console.log(`  - Entity types: ${configManager.getEntityTypes().join(', ')}`)
  console.log(`  - Global features: ${Object.keys(configManager.getFeatures()).length} flags`)

  return configManager
}

/**
 * Get feature flag value with backward compatibility
 */
export function getFeatureFlag(
  config: AgentConfig | ConfigManager,
  featureName: string
): boolean {
  if (config instanceof ConfigManager) {
    return config.isFeatureEnabled(featureName)
  }

  // Legacy AgentConfig
  const legacyFeatureMap: Record<string, keyof AgentConfig['features']> = {
    enableCaching: 'enableCaching',
    enableValidation: 'enableValidation',
    enableRelationshipDiscovery: 'enableRelationshipDiscovery',
    enableQueue: 'enableQueue',
  }

  const legacyKey = legacyFeatureMap[featureName]
  if (legacyKey && config.features && legacyKey in config.features) {
    return config.features[legacyKey]
  }

  // Default to true for known features
  return true
}

/**
 * Create compatibility wrapper for old code
 */
export class ConfigCompatibilityWrapper {
  private configManager: ConfigManager
  private legacyConfig: AgentConfig

  constructor(config: AgentConfig) {
    this.legacyConfig = config
    this.configManager = migrateToConfigManager(config)
  }

  /**
   * Get legacy config (for backward compatibility)
   */
  getLegacyConfig(): AgentConfig {
    return this.legacyConfig
  }

  /**
   * Get new ConfigManager
   */
  getConfigManager(): ConfigManager {
    return this.configManager
  }

  /**
   * Check if entity type has specific configuration
   */
  hasEntityConfig(entityType: string): boolean {
    return this.configManager.hasEntityConfig(entityType)
  }

  /**
   * Get feature flag with fallback
   */
  getFeature(featureName: string): boolean {
    return getFeatureFlag(this.configManager, featureName)
  }

  /**
   * Get validation rules for entity type
   */
  getValidationRules(entityType: string): any[] {
    if (this.hasEntityConfig(entityType)) {
      return this.configManager.getValidationRules(entityType)
    }
    // Return legacy validation rules if available
    return []
  }

  /**
   * Get metadata fields for entity type
   */
  getMetadataFields(entityType: string): any[] {
    if (this.hasEntityConfig(entityType)) {
      return this.configManager.getMetadataFields(entityType)
    }
    return []
  }

  /**
   * Get relationship types for entity type
   */
  getRelationshipTypes(entityType: string): any[] {
    if (this.hasEntityConfig(entityType)) {
      return this.configManager.getRelationshipTypes(entityType)
    }
    return []
  }
}

/**
 * Create configuration from environment or defaults
 */
export function createConfig(overrides?: Partial<AgentConfig>): AgentConfig {
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
      projectContextTTL: 300, // 5 minutes
      documentTTL: 3600, // 1 hour
      entityTTL: 1800, // 30 minutes
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

  return {
    ...defaultConfig,
    ...overrides,
  }
}

/**
 * Deprecation warning helper
 */
export function warnDeprecated(oldMethod: string, newMethod: string): void {
  console.warn(
    `[DEPRECATED] ${oldMethod} is deprecated and will be removed in a future version. Use ${newMethod} instead.`
  )
}

/**
 * Migration utilities export
 */
export const MigrationHelpers = {
  isLegacyConfig,
  migrateToConfigManager,
  getFeatureFlag,
  createConfig,
  warnDeprecated,
}
