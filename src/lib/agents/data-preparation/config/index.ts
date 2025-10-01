/**
 * Configuration Manager
 * Singleton class for managing Data Preparation Agent configuration
 * Provides caching, validation, and dynamic configuration loading
 */

import {
  DEFAULT_CONFIGURATION,
  DEFAULT_ENRICHMENT_STRATEGIES,
  COMMON_METADATA_FIELDS,
  COMMON_RELATIONSHIP_TYPES,
  COMMON_VALIDATION_RULES,
  ValidationHelpers,
} from './defaults'
import type {
  ConfigurationSchema,
  EntityConfig,
  ConfigValidationResult,
  ConfigValidationError,
  ConfigValidationWarning,
  ConfigLoadOptions,
  ConfigOverrides,
  MetadataFieldConfig,
  RelationshipTypeConfig,
  ValidationRule,
  EnrichmentStrategy,
} from './types'

/**
 * Configuration Manager Class
 * Singleton pattern for centralized configuration management
 */
export class ConfigManager {
  private static instance: ConfigManager | null = null
  private config: ConfigurationSchema
  private configCache: Map<string, any> = new Map()
  private isInitialized: boolean = false

  /**
   * Private constructor for singleton pattern
   */
  private constructor(config?: ConfigurationSchema) {
    this.config = config || DEFAULT_CONFIGURATION
    this.initializeCache()
  }

  /**
   * Get singleton instance
   */
  public static getInstance(config?: ConfigurationSchema): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager(config)
    }
    return ConfigManager.instance
  }

  /**
   * Reset singleton instance (useful for testing)
   */
  public static resetInstance(): void {
    ConfigManager.instance = null
  }

  /**
   * Initialize cache
   */
  private initializeCache(): void {
    // Cache entity configs
    for (const [entityType, entityConfig] of Object.entries(this.config.entities)) {
      this.configCache.set(`entity:${entityType}`, entityConfig)
    }

    // Cache global config
    this.configCache.set('global', this.config.global)

    this.isInitialized = true
    console.log('[ConfigManager] Initialized with', Object.keys(this.config.entities).length, 'entity types')
  }

  /**
   * Load configuration from various sources
   */
  public async load(options: ConfigLoadOptions = {}): Promise<void> {
    const {
      source = 'default',
      path,
      overrides,
      validate = true,
      useCache = true,
    } = options

    try {
      let loadedConfig: ConfigurationSchema

      switch (source) {
        case 'file':
          if (!path) {
            throw new Error('Path is required for file source')
          }
          loadedConfig = await this.loadFromFile(path)
          break

        case 'database':
          loadedConfig = await this.loadFromDatabase()
          break

        case 'memory':
          loadedConfig = this.config
          break

        case 'default':
        default:
          loadedConfig = DEFAULT_CONFIGURATION
          break
      }

      // Apply overrides
      if (overrides) {
        loadedConfig = this.applyOverrides(loadedConfig, overrides)
      }

      // Validate if enabled
      if (validate) {
        const validationResult = this.validateConfiguration(loadedConfig)
        if (!validationResult.valid) {
          throw new Error(
            `Configuration validation failed: ${validationResult.errors
              .map(e => e.message)
              .join(', ')}`
          )
        }
        if (validationResult.warnings.length > 0) {
          console.warn('[ConfigManager] Configuration warnings:', validationResult.warnings)
        }
      }

      this.config = loadedConfig

      // Rebuild cache
      if (useCache) {
        this.configCache.clear()
        this.initializeCache()
      }

      console.log('[ConfigManager] Configuration loaded successfully from', source)
    } catch (error: any) {
      console.error('[ConfigManager] Failed to load configuration:', error.message)
      throw error
    }
  }

  /**
   * Load configuration from file
   */
  private async loadFromFile(filePath: string): Promise<ConfigurationSchema> {
    // In a real implementation, this would read from filesystem
    // For now, return default configuration
    console.log('[ConfigManager] Loading from file:', filePath)
    return DEFAULT_CONFIGURATION
  }

  /**
   * Load configuration from database
   */
  private async loadFromDatabase(): Promise<ConfigurationSchema> {
    // In a real implementation, this would query database
    // For now, return default configuration
    console.log('[ConfigManager] Loading from database')
    return DEFAULT_CONFIGURATION
  }

  /**
   * Apply configuration overrides
   */
  private applyOverrides(
    config: ConfigurationSchema,
    overrides: ConfigOverrides
  ): ConfigurationSchema {
    const updatedConfig = { ...config }

    // Apply entity overrides
    if (overrides.entities) {
      for (const [entityType, entityOverrides] of Object.entries(overrides.entities)) {
        if (updatedConfig.entities[entityType]) {
          updatedConfig.entities[entityType] = {
            ...updatedConfig.entities[entityType],
            ...entityOverrides,
          }
        }
      }
    }

    // Apply global overrides
    if (overrides.global) {
      updatedConfig.global = {
        ...updatedConfig.global,
        ...overrides.global,
      }
    }

    // Apply feature flag overrides
    if (overrides.features) {
      updatedConfig.global.features = {
        ...updatedConfig.global.features,
        ...overrides.features,
      }
    }

    return updatedConfig
  }

  /**
   * Validate configuration schema
   */
  public validateConfiguration(config: ConfigurationSchema): ConfigValidationResult {
    const errors: ConfigValidationError[] = []
    const warnings: ConfigValidationWarning[] = []

    // Validate version
    if (!config.version) {
      errors.push({
        path: 'version',
        message: 'Configuration version is required',
        code: 'MISSING_VERSION',
        severity: 'error',
      })
    }

    // Validate entities
    if (!config.entities || Object.keys(config.entities).length === 0) {
      errors.push({
        path: 'entities',
        message: 'At least one entity configuration is required',
        code: 'MISSING_ENTITIES',
        severity: 'critical',
      })
    } else {
      // Validate each entity
      for (const [entityType, entityConfig] of Object.entries(config.entities)) {
        const entityErrors = this.validateEntityConfig(entityType, entityConfig)
        errors.push(...entityErrors)
      }
    }

    // Validate global config
    if (!config.global) {
      errors.push({
        path: 'global',
        message: 'Global configuration is required',
        code: 'MISSING_GLOBAL',
        severity: 'critical',
      })
    } else {
      const globalErrors = this.validateGlobalConfig(config.global)
      errors.push(...globalErrors)
    }

    // Add warnings for missing optional fields
    if (!config.metadata) {
      warnings.push({
        path: 'metadata',
        message: 'Configuration metadata is recommended',
        code: 'MISSING_METADATA',
      })
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    }
  }

  /**
   * Validate entity configuration
   */
  private validateEntityConfig(
    entityType: string,
    config: EntityConfig
  ): ConfigValidationError[] {
    const errors: ConfigValidationError[] = []

    if (!config.type) {
      errors.push({
        path: `entities.${entityType}.type`,
        message: 'Entity type is required',
        code: 'MISSING_ENTITY_TYPE',
        severity: 'error',
      })
    }

    if (!config.displayName) {
      errors.push({
        path: `entities.${entityType}.displayName`,
        message: 'Entity display name is required',
        code: 'MISSING_DISPLAY_NAME',
        severity: 'error',
      })
    }

    if (!config.requiredFields || config.requiredFields.length === 0) {
      errors.push({
        path: `entities.${entityType}.requiredFields`,
        message: 'At least one required field must be specified',
        code: 'MISSING_REQUIRED_FIELDS',
        severity: 'error',
      })
    }

    if (!config.metadataFields || config.metadataFields.length === 0) {
      errors.push({
        path: `entities.${entityType}.metadataFields`,
        message: 'At least one metadata field should be configured',
        code: 'MISSING_METADATA_FIELDS',
        severity: 'error',
      })
    }

    return errors
  }

  /**
   * Validate global configuration
   */
  private validateGlobalConfig(config: any): ConfigValidationError[] {
    const errors: ConfigValidationError[] = []

    if (!config.cache) {
      errors.push({
        path: 'global.cache',
        message: 'Cache configuration is required',
        code: 'MISSING_CACHE_CONFIG',
        severity: 'error',
      })
    }

    if (!config.performance) {
      errors.push({
        path: 'global.performance',
        message: 'Performance configuration is required',
        code: 'MISSING_PERFORMANCE_CONFIG',
        severity: 'error',
      })
    }

    return errors
  }

  /**
   * Get entity configuration
   */
  public getEntityConfig(entityType: string): EntityConfig | null {
    // Check cache first
    const cached = this.configCache.get(`entity:${entityType}`)
    if (cached) {
      return cached
    }

    // Get from config
    const config = this.config.entities[entityType]
    if (config) {
      // Cache for next time
      this.configCache.set(`entity:${entityType}`, config)
      return config
    }

    console.warn(`[ConfigManager] No configuration found for entity type: ${entityType}`)
    return null
  }

  /**
   * Get all entity types
   */
  public getEntityTypes(): string[] {
    return Object.keys(this.config.entities)
  }

  /**
   * Check if entity type exists
   */
  public hasEntityConfig(entityType: string): boolean {
    return entityType in this.config.entities
  }

  /**
   * Get metadata fields for entity type
   */
  public getMetadataFields(entityType: string): MetadataFieldConfig[] {
    const config = this.getEntityConfig(entityType)
    return config?.metadataFields || []
  }

  /**
   * Get relationship types for entity type
   */
  public getRelationshipTypes(entityType: string): RelationshipTypeConfig[] {
    const config = this.getEntityConfig(entityType)
    return config?.relationshipTypes || []
  }

  /**
   * Get validation rules for entity type
   */
  public getValidationRules(entityType: string): ValidationRule[] {
    const config = this.getEntityConfig(entityType)
    return config?.validationRules || []
  }

  /**
   * Get enrichment strategy for entity type
   */
  public getEnrichmentStrategy(entityType: string): EnrichmentStrategy | null {
    const config = this.getEntityConfig(entityType)
    return config?.enrichmentStrategy || null
  }

  /**
   * Get required fields for entity type
   */
  public getRequiredFields(entityType: string): string[] {
    const config = this.getEntityConfig(entityType)
    return config?.requiredFields || []
  }

  /**
   * Get global configuration
   */
  public getGlobalConfig() {
    const cached = this.configCache.get('global')
    if (cached) return cached
    return this.config.global
  }

  /**
   * Get cache configuration
   */
  public getCacheConfig() {
    return this.getGlobalConfig().cache
  }

  /**
   * Get performance configuration
   */
  public getPerformanceConfig() {
    return this.getGlobalConfig().performance
  }

  /**
   * Get feature flags
   */
  public getFeatures() {
    return this.getGlobalConfig().features
  }

  /**
   * Check if feature is enabled
   */
  public isFeatureEnabled(featureName: string): boolean {
    const features = this.getFeatures()
    return features[featureName as keyof typeof features] ?? false
  }

  /**
   * Get full configuration
   */
  public getConfiguration(): ConfigurationSchema {
    return this.config
  }

  /**
   * Update entity configuration
   */
  public updateEntityConfig(entityType: string, updates: Partial<EntityConfig>): void {
    if (!this.config.entities[entityType]) {
      throw new Error(`Entity type ${entityType} does not exist`)
    }

    this.config.entities[entityType] = {
      ...this.config.entities[entityType],
      ...updates,
    }

    // Update cache
    this.configCache.set(`entity:${entityType}`, this.config.entities[entityType])

    console.log(`[ConfigManager] Updated configuration for entity type: ${entityType}`)
  }

  /**
   * Add new entity configuration
   */
  public addEntityConfig(entityType: string, config: EntityConfig): void {
    if (this.config.entities[entityType]) {
      console.warn(`[ConfigManager] Entity type ${entityType} already exists, overwriting`)
    }

    this.config.entities[entityType] = config
    this.configCache.set(`entity:${entityType}`, config)

    console.log(`[ConfigManager] Added configuration for entity type: ${entityType}`)
  }

  /**
   * Remove entity configuration
   */
  public removeEntityConfig(entityType: string): void {
    if (!this.config.entities[entityType]) {
      console.warn(`[ConfigManager] Entity type ${entityType} does not exist`)
      return
    }

    delete this.config.entities[entityType]
    this.configCache.delete(`entity:${entityType}`)

    console.log(`[ConfigManager] Removed configuration for entity type: ${entityType}`)
  }

  /**
   * Clear configuration cache
   */
  public clearCache(): void {
    this.configCache.clear()
    this.initializeCache()
    console.log('[ConfigManager] Cache cleared and reinitialized')
  }

  /**
   * Export configuration to JSON
   */
  public exportConfig(): string {
    return JSON.stringify(this.config, null, 2)
  }

  /**
   * Import configuration from JSON
   */
  public importConfig(jsonString: string, validate: boolean = true): void {
    try {
      const imported = JSON.parse(jsonString) as ConfigurationSchema

      if (validate) {
        const validationResult = this.validateConfiguration(imported)
        if (!validationResult.valid) {
          throw new Error(
            `Invalid configuration: ${validationResult.errors.map(e => e.message).join(', ')}`
          )
        }
      }

      this.config = imported
      this.clearCache()

      console.log('[ConfigManager] Configuration imported successfully')
    } catch (error: any) {
      console.error('[ConfigManager] Failed to import configuration:', error.message)
      throw error
    }
  }

  /**
   * Get configuration statistics
   */
  public getStats() {
    return {
      version: this.config.version,
      entityTypes: Object.keys(this.config.entities).length,
      totalMetadataFields: Object.values(this.config.entities).reduce(
        (sum, e) => sum + e.metadataFields.length,
        0
      ),
      totalRelationshipTypes: Object.values(this.config.entities).reduce(
        (sum, e) => sum + e.relationshipTypes.length,
        0
      ),
      totalValidationRules: Object.values(this.config.entities).reduce(
        (sum, e) => sum + e.validationRules.length,
        0
      ),
      cacheSize: this.configCache.size,
      isInitialized: this.isInitialized,
    }
  }

  /**
   * Validate entity data against configuration
   */
  public validateEntityData(entityType: string, data: any): {
    valid: boolean
    errors: string[]
    warnings: string[]
  } {
    const errors: string[] = []
    const warnings: string[] = []

    const config = this.getEntityConfig(entityType)
    if (!config) {
      errors.push(`No configuration found for entity type: ${entityType}`)
      return { valid: false, errors, warnings }
    }

    // Check required fields
    for (const field of config.requiredFields) {
      if (!ValidationHelpers.isRequired(data[field])) {
        errors.push(`Required field missing: ${field}`)
      }
    }

    // Apply validation rules
    for (const rule of config.validationRules) {
      const fieldValue = data[rule.field]

      let isValid = true
      switch (rule.type) {
        case 'required':
          isValid = ValidationHelpers.isRequired(fieldValue)
          break
        case 'minLength':
          isValid = ValidationHelpers.hasMinLength(fieldValue, rule.value)
          break
        case 'maxLength':
          isValid = ValidationHelpers.hasMaxLength(fieldValue, rule.value)
          break
        case 'pattern':
          isValid = ValidationHelpers.matchesPattern(fieldValue, rule.value)
          break
        case 'enum':
          isValid = ValidationHelpers.isValidEnum(fieldValue, rule.value)
          break
        default:
          break
      }

      if (!isValid) {
        if (rule.severity === 'error') {
          errors.push(rule.message)
        } else {
          warnings.push(rule.warningMessage || rule.message)
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    }
  }
}

/**
 * Get singleton instance helper
 */
export function getConfigManager(config?: ConfigurationSchema): ConfigManager {
  return ConfigManager.getInstance(config)
}

/**
 * Export types and defaults
 */
export * from './types'
export * from './defaults'
export { ValidationHelpers }
