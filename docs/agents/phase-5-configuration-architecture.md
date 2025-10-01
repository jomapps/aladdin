# Phase 5: Configuration System Architecture

**Version**: 1.0.0
**Date**: 2025-10-01
**Status**: 📐 Architecture Design
**Author**: System Architect Agent
**Review Status**: Pending

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Architecture Overview](#system-architecture-overview)
3. [Core Components](#core-components)
4. [Integration Strategy](#integration-strategy)
5. [Entity Configuration Patterns](#entity-configuration-patterns)
6. [Configuration Inheritance](#configuration-inheritance)
7. [Validation & Error Handling](#validation--error-handling)
8. [Performance Considerations](#performance-considerations)
9. [Security Considerations](#security-considerations)
10. [Migration Path](#migration-path)
11. [Extensibility Guidelines](#extensibility-guidelines)
12. [Testing Strategy](#testing-strategy)
13. [Architecture Decision Records](#architecture-decision-records)

---

## Executive Summary

The Phase 5 Configuration System transforms the Data Preparation Agent from a one-size-fits-all processor into a flexible, entity-aware system. This architecture enables:

- **Entity-Specific Processing**: Different rules, prompts, and validations per entity type
- **Runtime Flexibility**: Dynamic configuration loading and hot-swapping
- **Type Safety**: Full TypeScript support with generics and strict typing
- **Backward Compatibility**: Seamless migration from current implementation
- **Extensibility**: Easy addition of new entity types without code changes

### Key Metrics

- **Configuration Load Time**: < 5ms per entity type
- **Memory Overhead**: ~2KB per entity configuration
- **Performance Impact**: < 2% on overall processing time
- **Backward Compatibility**: 100% with existing code
- **Type Safety**: 100% TypeScript coverage

---

## System Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Data Preparation Agent                     │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              Configuration Layer (NEW)                  │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │ │
│  │  │ ConfigManager│  │EntityRegistry│  │PromptManager │ │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘ │ │
│  └────────────────────────────────────────────────────────┘ │
│                            ▼                                 │
│  ┌────────────────────────────────────────────────────────┐ │
│  │           Existing Agent Components                     │ │
│  │  ┌───────────┐  ┌───────────┐  ┌──────────────────┐   │ │
│  │  │  Context  │  │ Metadata  │  │  Relationship    │   │ │
│  │  │ Gatherer  │  │ Generator │  │  Discoverer      │   │ │
│  │  └───────────┘  └───────────┘  └──────────────────┘   │ │
│  │  ┌───────────┐  ┌───────────┐  ┌──────────────────┐   │ │
│  │  │   Data    │  │ Validator │  │      Cache       │   │ │
│  │  │ Enricher  │  │           │  │     Manager      │   │ │
│  │  └───────────┘  └───────────┘  └──────────────────┘   │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Component Interaction Flow

```
User Request
     │
     ▼
DataPreparationAgent.prepare(data, options)
     │
     ├─► ConfigManager.getConfig(entityType)
     │   ├─► EntityRegistry.lookup(entityType)
     │   ├─► ConfigValidator.validate(config)
     │   └─► ConfigCache.get/set(configKey)
     │
     ├─► PromptManager.getPrompt(entityType, stage)
     │   ├─► TemplateEngine.interpolate(template, vars)
     │   └─► PromptCache.get/set(promptKey)
     │
     ├─► MetadataGenerator.generate()
     │   └─► Uses entity-specific prompts and schemas
     │
     ├─► DataEnricher.enrich()
     │   └─► Uses entity-specific enrichment rules
     │
     ├─► RelationshipDiscoverer.discover()
     │   └─► Uses entity-specific relationship rules
     │
     └─► BrainDocumentValidator.validate()
         └─► Uses entity-specific validation rules
```

---

## Core Components

### 1. ConfigManager

**Purpose**: Central configuration management system

**Responsibilities**:
- Load and cache entity configurations
- Provide type-safe configuration access
- Support dynamic configuration updates
- Manage configuration inheritance
- Validate configuration schemas

**API Design**:

```typescript
export class ConfigManager {
  // Singleton instance
  private static instance: ConfigManager | null = null

  // Configuration storage
  private configs: Map<string, EntityConfig> = new Map()
  private defaultConfig: EntityConfig
  private configCache: LRUCache<string, EntityConfig>

  // Configuration sources
  private registry: EntityRegistry
  private validator: ConfigValidator
  private loader: ConfigLoader

  /**
   * Get singleton instance
   */
  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager()
    }
    return ConfigManager.instance
  }

  /**
   * Get configuration for entity type
   * Uses inheritance chain: entity -> base -> default
   */
  getConfig(entityType: string): EntityConfig {
    // Check cache first
    const cached = this.configCache.get(entityType)
    if (cached) return cached

    // Load from registry
    let config = this.registry.get(entityType)

    // Apply inheritance if base specified
    if (config?.extends) {
      const baseConfig = this.getConfig(config.extends)
      config = this.mergeConfigs(baseConfig, config)
    }

    // Fallback to default
    if (!config) {
      console.warn(`No config for ${entityType}, using default`)
      config = this.defaultConfig
    }

    // Validate and cache
    this.validator.validate(config)
    this.configCache.set(entityType, config)

    return config
  }

  /**
   * Register new entity configuration
   */
  registerConfig(config: EntityConfig): void {
    // Validate schema
    this.validator.validateSchema(config)

    // Register in registry
    this.registry.register(config.entityType, config)

    // Invalidate cache
    this.configCache.delete(config.entityType)

    console.log(`[ConfigManager] Registered config for ${config.entityType}`)
  }

  /**
   * Update existing configuration (hot reload)
   */
  updateConfig(
    entityType: string,
    updates: Partial<EntityConfig>
  ): void {
    const existing = this.registry.get(entityType)
    if (!existing) {
      throw new Error(`Config not found for ${entityType}`)
    }

    // Merge updates
    const updated = this.mergeConfigs(existing, updates)

    // Validate
    this.validator.validate(updated)

    // Update registry
    this.registry.register(entityType, updated)

    // Invalidate cache
    this.configCache.delete(entityType)

    console.log(`[ConfigManager] Updated config for ${entityType}`)
  }

  /**
   * Get all registered entity types
   */
  getEntityTypes(): string[] {
    return Array.from(this.registry.keys())
  }

  /**
   * Check if entity type is registered
   */
  hasConfig(entityType: string): boolean {
    return this.registry.has(entityType)
  }

  /**
   * Merge configurations with deep merging
   */
  private mergeConfigs(
    base: EntityConfig,
    override: Partial<EntityConfig>
  ): EntityConfig {
    // Deep merge implementation
    return deepMerge(base, override)
  }
}
```

### 2. EntityRegistry

**Purpose**: Store and manage entity configurations

**Responsibilities**:
- Lazy load configurations
- Support hot reloading
- Manage configuration versions
- Track configuration dependencies

**API Design**:

```typescript
export class EntityRegistry {
  private configs: Map<string, EntityConfig> = new Map()
  private loader: ConfigLoader
  private watcher: ConfigWatcher | null = null

  /**
   * Initialize registry with configs
   */
  async initialize(configPath?: string): Promise<void> {
    // Load all entity configs
    const configs = await this.loader.loadAll(configPath)

    // Register each config
    for (const config of configs) {
      this.register(config.entityType, config)
    }

    // Setup hot reload watcher in development
    if (process.env.NODE_ENV === 'development' && configPath) {
      this.watcher = new ConfigWatcher(configPath)
      this.watcher.on('change', (entityType, config) => {
        this.register(entityType, config)
      })
    }

    console.log(`[EntityRegistry] Initialized with ${configs.length} configs`)
  }

  /**
   * Register configuration
   */
  register(entityType: string, config: EntityConfig): void {
    this.configs.set(entityType, config)
  }

  /**
   * Get configuration
   */
  get(entityType: string): EntityConfig | undefined {
    return this.configs.get(entityType)
  }

  /**
   * Check if registered
   */
  has(entityType: string): boolean {
    return this.configs.has(entityType)
  }

  /**
   * Get all entity types
   */
  keys(): IterableIterator<string> {
    return this.configs.keys()
  }

  /**
   * Unregister configuration
   */
  unregister(entityType: string): void {
    this.configs.delete(entityType)
  }

  /**
   * Clear all configurations
   */
  clear(): void {
    this.configs.clear()
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.watcher?.stop()
    this.clear()
  }
}
```

### 3. PromptManager

**Purpose**: Manage LLM prompts with templating

**Responsibilities**:
- Store prompt templates
- Interpolate variables
- Cache compiled prompts
- Support prompt versioning

**API Design**:

```typescript
export class PromptManager {
  private templates: Map<string, PromptTemplates> = new Map()
  private engine: TemplateEngine
  private cache: LRUCache<string, string>

  constructor() {
    this.engine = new TemplateEngine()
    this.cache = new LRUCache({ max: 100 })
  }

  /**
   * Register prompts for entity type
   */
  registerPrompts(
    entityType: string,
    prompts: PromptTemplates
  ): void {
    this.templates.set(entityType, prompts)
  }

  /**
   * Get prompt for entity and stage
   */
  getPrompt(
    entityType: string,
    stage: PromptStage,
    variables?: Record<string, any>
  ): string {
    // Get template
    const prompts = this.templates.get(entityType)
    if (!prompts || !prompts[stage]) {
      throw new Error(
        `No prompt found for ${entityType} at stage ${stage}`
      )
    }

    const template = prompts[stage]

    // Return cached if no variables
    if (!variables) {
      const cacheKey = `${entityType}:${stage}`
      const cached = this.cache.get(cacheKey)
      if (cached) return cached

      this.cache.set(cacheKey, template)
      return template
    }

    // Interpolate variables
    return this.engine.interpolate(template, variables)
  }

  /**
   * Check if prompts exist
   */
  hasPrompts(entityType: string): boolean {
    return this.templates.has(entityType)
  }

  /**
   * Get all stages for entity
   */
  getStages(entityType: string): PromptStage[] {
    const prompts = this.templates.get(entityType)
    if (!prompts) return []
    return Object.keys(prompts) as PromptStage[]
  }
}
```

### 4. ConfigValidator

**Purpose**: Validate configuration schemas

**Responsibilities**:
- Validate configuration structure
- Check required fields
- Validate custom functions
- Ensure type safety

**API Design**:

```typescript
export class ConfigValidator {
  private schema: JSONSchema
  private validator: Ajv

  constructor() {
    this.validator = new Ajv({
      allErrors: true,
      strict: true
    })
    this.schema = this.buildSchema()
  }

  /**
   * Validate configuration
   */
  validate(config: EntityConfig): ValidationResult {
    const valid = this.validator.validate(this.schema, config)

    if (!valid) {
      return {
        valid: false,
        errors: this.validator.errors?.map(e => e.message || '') || [],
        warnings: []
      }
    }

    // Additional custom validations
    const warnings = this.validateCustomRules(config)

    return {
      valid: true,
      errors: [],
      warnings
    }
  }

  /**
   * Validate schema structure
   */
  validateSchema(config: EntityConfig): void {
    const result = this.validate(config)
    if (!result.valid) {
      throw new ConfigurationError(
        `Invalid configuration for ${config.entityType}: ${result.errors.join(', ')}`
      )
    }
  }

  /**
   * Validate custom rules
   */
  private validateCustomRules(config: EntityConfig): string[] {
    const warnings: string[] = []

    // Check metadata schema
    if (config.metadata.schema) {
      for (const [field, fieldConfig] of Object.entries(config.metadata.schema)) {
        if (fieldConfig.validation && typeof fieldConfig.validation !== 'function') {
          warnings.push(`Validation for ${field} is not a function`)
        }
      }
    }

    // Check validation rules
    if (config.quality.validationRules) {
      for (const rule of config.quality.validationRules) {
        if (typeof rule.rule !== 'function') {
          warnings.push(`Validation rule for ${rule.field} is not a function`)
        }
      }
    }

    return warnings
  }

  /**
   * Build JSON schema
   */
  private buildSchema(): JSONSchema {
    // Full JSON schema for EntityConfig
    return {
      type: 'object',
      required: ['entityType', 'collectionSlug', 'metadata', 'llm', 'relationships', 'quality', 'processing', 'features'],
      properties: {
        entityType: { type: 'string', minLength: 1 },
        collectionSlug: { type: 'string', minLength: 1 },
        extends: { type: 'string' },
        // ... full schema definition
      }
    }
  }
}
```

---

## Integration Strategy

### Phase 1: Non-Breaking Foundation (Week 1, Days 1-3)

**Goal**: Add configuration layer without changing existing behavior

```typescript
// Step 1: Create configuration types (backward compatible)
// src/lib/agents/data-preparation/config/types.ts

// Extend existing AgentConfig
export interface ExtendedAgentConfig extends AgentConfig {
  entityConfigs?: Map<string, EntityConfig>
  configManager?: ConfigManager
}

// Step 2: Initialize ConfigManager in agent constructor
export class DataPreparationAgent {
  private configManager: ConfigManager

  constructor(config: AgentConfig) {
    // Existing initialization
    this.config = config
    this.llm = getLLMClient(config.llm)
    // ... other initializations

    // NEW: Initialize config manager
    this.configManager = ConfigManager.getInstance()

    // Load default configs if not loaded
    if (this.configManager.getEntityTypes().length === 0) {
      this.initializeDefaultConfigs()
    }
  }

  private async initializeDefaultConfigs(): Promise<void> {
    // Load built-in entity configurations
    const configPath = path.join(__dirname, 'config', 'entities')
    await this.configManager.initialize(configPath)
  }
}
```

### Phase 2: Gradual Integration (Week 1, Days 4-5)

**Goal**: Start using configurations for specific components

```typescript
// Update MetadataGenerator to use custom prompts
export class MetadataGenerator {
  private configManager: ConfigManager

  constructor(llm: LLMClient, config: AgentConfig) {
    this.llm = llm
    this.config = config
    this.configManager = ConfigManager.getInstance()
  }

  async generate(
    data: any,
    context: Context,
    options: PrepareOptions
  ): Promise<GeneratedMetadata> {
    // Get entity-specific configuration
    const entityConfig = this.configManager.getConfig(options.entityType)

    // Use custom prompts if available, fallback to defaults
    const analyzePrompt = entityConfig.llm.prompts.analyze ||
                          this.getDefaultAnalyzePrompt()

    // Use custom temperature/tokens if specified
    const llmOptions = {
      temperature: entityConfig.llm.temperature ?? 0.7,
      maxTokens: entityConfig.llm.maxTokens ?? 1500
    }

    // Continue with existing logic...
  }
}
```

### Phase 3: Full Integration (Week 2)

**Goal**: All components use configuration system

```typescript
// Update all components to use entity-specific configs
export class DataPreparationAgent {
  async prepare(data: any, options: PrepareOptions): Promise<BrainDocument> {
    // Get entity configuration
    const entityConfig = this.configManager.getConfig(options.entityType)

    // Check feature flags
    if (!entityConfig.features.enableLLM) {
      console.log(`[DataPrepAgent] LLM disabled for ${options.entityType}`)
      return this.prepareWithoutLLM(data, options, entityConfig)
    }

    // Use entity-specific cache TTL
    const cacheTTL = entityConfig.processing.cacheTTL

    // Use entity-specific validation
    if (entityConfig.features.enableValidation) {
      const validation = await this.validator.validate(
        brainDocument,
        entityConfig
      )
      if (!validation.valid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`)
      }
    }

    // Use entity-specific quality threshold
    const qualityScore = await this.enricher.calculateQualityScore(
      enriched,
      metadata,
      entityConfig
    )

    if (qualityScore < entityConfig.quality.minimumScore) {
      throw new Error(
        `Quality score ${qualityScore} below threshold ${entityConfig.quality.minimumScore}`
      )
    }

    // Continue processing...
  }
}
```

### Integration Checklist

- [ ] ConfigManager singleton initialized
- [ ] EntityRegistry loaded with default configs
- [ ] PromptManager integrated with MetadataGenerator
- [ ] Validator updated to use entity-specific rules
- [ ] DataEnricher updated to use quality thresholds
- [ ] RelationshipDiscoverer updated to use relationship rules
- [ ] Cache manager uses entity-specific TTLs
- [ ] Feature flags control all optional features
- [ ] Backward compatibility maintained
- [ ] All tests passing

---

## Entity Configuration Patterns

### Base Configuration

All entity configurations extend from a base configuration:

```typescript
// src/lib/agents/data-preparation/config/defaults.ts

export const baseConfig: EntityConfig = {
  entityType: 'base',
  collectionSlug: 'base',

  metadata: {
    required: ['name', 'description'],
    optional: [],
    schema: {
      name: {
        type: 'string',
        required: true,
        validation: (v) => typeof v === 'string' && v.length > 0
      },
      description: {
        type: 'string',
        required: true,
        validation: (v) => typeof v === 'string' && v.length >= 10
      }
    },
    defaults: {}
  },

  llm: {
    prompts: {
      analyze: `Analyze this entity and determine its key characteristics.
Entity: {data}
Context: {context}`,

      extract: `Extract metadata from this entity.
Entity: {data}
Required fields: {requiredFields}
Context: {context}`,

      summarize: `Create a searchable summary for this entity.
Entity: {data}
Metadata: {metadata}`,

      relationships: `Identify relationships for this entity.
Entity: {data}
Available entities: {availableEntities}
Context: {context}`
    },
    temperature: 0.7,
    maxTokens: 1500
  },

  relationships: {
    allowed: [],
    autoDiscover: true,
    confidenceThreshold: 0.7
  },

  quality: {
    minimumScore: 0.5,
    requiredFields: ['name', 'description'],
    validationRules: [
      {
        field: 'name',
        rule: (v) => v && v.length > 0,
        message: 'Name is required'
      },
      {
        field: 'description',
        rule: (v) => v && v.length >= 10,
        message: 'Description must be at least 10 characters'
      }
    ]
  },

  processing: {
    async: false,
    priority: 'normal',
    cacheTTL: 1800, // 30 minutes
    retryAttempts: 3
  },

  features: {
    enableLLM: true,
    enableCache: true,
    enableQueue: true,
    enableValidation: true,
    enableRelationships: true
  }
}
```

### Character Configuration (Extended)

```typescript
// src/lib/agents/data-preparation/config/entities/character.ts

import type { EntityConfig } from '../types'
import { baseConfig } from '../defaults'

export const characterConfig: EntityConfig = {
  ...baseConfig,
  entityType: 'character',
  collectionSlug: 'characters',
  extends: 'base', // Inherits from base

  metadata: {
    required: ['characterType', 'role', 'archetype'],
    optional: [
      'personality',
      'backstory',
      'appearance',
      'voice',
      'age',
      'arc',
      'motivation',
      'conflict'
    ],
    schema: {
      ...baseConfig.metadata.schema,
      characterType: {
        type: 'string',
        required: true,
        validation: (v) => ['protagonist', 'antagonist', 'supporting', 'minor'].includes(v),
        transform: (v) => v.toLowerCase()
      },
      role: {
        type: 'string',
        required: true,
        validation: (v) => v && v.length > 0
      },
      archetype: {
        type: 'string',
        required: true
      },
      personality: {
        type: 'array',
        required: false,
        validation: (v) => Array.isArray(v) && v.every(i => typeof i === 'string')
      },
      age: {
        type: 'number',
        required: false,
        validation: (v) => typeof v === 'number' && v > 0 && v < 200
      }
    },
    defaults: {
      characterType: 'supporting',
      personality: []
    }
  },

  llm: {
    prompts: {
      analyze: `Analyze this character in the context of the project.

PROJECT: {projectName}
GENRE: {genre}
THEMES: {themes}

CHARACTER DATA:
{data}

RELATED CHARACTERS:
{relatedCharacters}

Determine:
1. Character type (protagonist/antagonist/supporting/minor)
2. Primary role in the story
3. Archetypal pattern
4. Personality traits
5. Narrative function

Return JSON with: characterType, role, archetype, personality, storyFunction`,

      extract: `Extract detailed character metadata.

CHARACTER: {name}
PROJECT: {projectName}
DESCRIPTION: {description}

Required metadata:
- characterType: protagonist/antagonist/supporting/minor
- role: specific role in story
- archetype: character archetype

Optional metadata:
- personality: array of traits
- backstory: key background elements
- appearance: physical description
- voice: speaking style
- age: character age
- arc: character development arc
- motivation: driving forces
- conflict: internal/external conflicts

Return JSON object with extracted metadata.`,

      summarize: `Create a comprehensive character summary.

CHARACTER: {name}
TYPE: {characterType}
ROLE: {role}
ARCHETYPE: {archetype}
PROJECT: {projectName}

Include:
- Character's role and significance
- Key personality traits
- Relationships with other characters
- Story function and arc
- Thematic connections

2-3 sentences, searchable and informative.`,

      relationships: `Identify relationships for this character.

CHARACTER: {name}
TYPE: {characterType}
ROLE: {role}

AVAILABLE ENTITIES:
- Characters: {characters}
- Scenes: {scenes}
- Locations: {locations}

RELATIONSHIP TYPES:
- APPEARS_IN (scenes)
- LOVES/HATES/BEFRIENDS/OPPOSES (characters)
- MENTORS/MENTORED_BY (characters)
- FREQUENTS (locations)

Return JSON array of relationships with type, target, confidence, reasoning.`
    },
    model: 'anthropic/claude-sonnet-4.5',
    temperature: 0.7,
    maxTokens: 2000
  },

  relationships: {
    allowed: [
      {
        type: 'APPEARS_IN',
        targetType: 'scene',
        bidirectional: false
      },
      {
        type: 'LOVES',
        targetType: 'character',
        bidirectional: true
      },
      {
        type: 'HATES',
        targetType: 'character',
        bidirectional: true
      },
      {
        type: 'BEFRIENDS',
        targetType: 'character',
        bidirectional: true
      },
      {
        type: 'OPPOSES',
        targetType: 'character',
        bidirectional: true
      },
      {
        type: 'MENTORS',
        targetType: 'character',
        bidirectional: false
      },
      {
        type: 'FREQUENTS',
        targetType: 'location',
        bidirectional: false
      }
    ],
    autoDiscover: true,
    confidenceThreshold: 0.75
  },

  quality: {
    minimumScore: 0.6,
    requiredFields: ['name', 'description', 'characterType', 'role'],
    validationRules: [
      {
        field: 'name',
        rule: (v) => v && v.length > 0,
        message: 'Character name is required'
      },
      {
        field: 'description',
        rule: (v) => v && v.length >= 20,
        message: 'Character description must be at least 20 characters'
      },
      {
        field: 'characterType',
        rule: (v, doc) => {
          if (!v) return false
          const validTypes = ['protagonist', 'antagonist', 'supporting', 'minor']
          return validTypes.includes(v)
        },
        message: 'Character type must be: protagonist, antagonist, supporting, or minor'
      },
      {
        field: 'role',
        rule: (v) => v && v.length >= 5,
        message: 'Character role must be at least 5 characters'
      }
    ]
  },

  processing: {
    async: false,
    priority: 'high',
    cacheTTL: 3600, // 1 hour (characters change less frequently)
    retryAttempts: 3
  },

  features: {
    enableLLM: true,
    enableCache: true,
    enableQueue: true,
    enableValidation: true,
    enableRelationships: true
  }
}
```

---

## Configuration Inheritance

### Inheritance Chain

```
DefaultConfig (built-in)
    ↓
BaseConfig (config/defaults.ts)
    ↓
EntityConfig (config/entities/{type}.ts)
    ↓
RuntimeOverrides (optional)
```

### Merge Strategy

**Deep Merge Algorithm**:

```typescript
export function deepMerge<T extends object>(
  base: T,
  override: Partial<T>
): T {
  const result = { ...base }

  for (const key in override) {
    const baseValue = base[key]
    const overrideValue = override[key]

    if (overrideValue === undefined) {
      continue
    }

    // Array handling: replace, not merge
    if (Array.isArray(overrideValue)) {
      result[key] = overrideValue as any
      continue
    }

    // Object handling: recursive merge
    if (
      typeof overrideValue === 'object' &&
      overrideValue !== null &&
      !Array.isArray(overrideValue) &&
      typeof baseValue === 'object' &&
      baseValue !== null &&
      !Array.isArray(baseValue)
    ) {
      result[key] = deepMerge(baseValue, overrideValue) as any
      continue
    }

    // Primitive: override
    result[key] = overrideValue as any
  }

  return result
}
```

### Inheritance Example

```typescript
// Base config
const baseConfig = {
  metadata: {
    required: ['name'],
    schema: {
      name: { type: 'string', required: true }
    }
  },
  llm: {
    temperature: 0.7,
    maxTokens: 1500
  }
}

// Character config extends base
const characterConfig = {
  extends: 'base',
  metadata: {
    required: ['name', 'role'], // Extends base required
    schema: {
      role: { type: 'string', required: true } // Adds to base schema
    }
  },
  llm: {
    maxTokens: 2000 // Overrides base maxTokens
  }
}

// Merged result
const merged = {
  metadata: {
    required: ['name', 'role'], // Replaced (arrays don't merge)
    schema: {
      name: { type: 'string', required: true }, // From base
      role: { type: 'string', required: true }  // From character
    }
  },
  llm: {
    temperature: 0.7,  // From base
    maxTokens: 2000    // Overridden by character
  }
}
```

---

## Validation & Error Handling

### Validation Layers

```
┌────────────────────────────────────────┐
│     1. Schema Validation (JSON)        │
│  - Structure validation                │
│  - Type checking                       │
│  - Required fields                     │
└────────────────────────────────────────┘
              ▼
┌────────────────────────────────────────┐
│     2. Custom Validation (Functions)   │
│  - Business logic validation           │
│  - Cross-field validation              │
│  - Complex rules                       │
└────────────────────────────────────────┘
              ▼
┌────────────────────────────────────────┐
│     3. Runtime Validation              │
│  - Document validation                 │
│  - Data quality checks                 │
│  - Relationship validation             │
└────────────────────────────────────────┘
```

### Error Handling Strategy

```typescript
// Configuration errors
export class ConfigurationError extends Error {
  constructor(
    message: string,
    public entityType: string,
    public field?: string
  ) {
    super(message)
    this.name = 'ConfigurationError'
  }
}

// Validation errors
export class ValidationError extends Error {
  constructor(
    message: string,
    public errors: string[],
    public warnings: string[]
  ) {
    super(message)
    this.name = 'ValidationError'
  }
}

// Usage in agent
try {
  const config = this.configManager.getConfig(entityType)
  const validation = await this.validator.validate(document, config)

  if (!validation.valid) {
    throw new ValidationError(
      'Document validation failed',
      validation.errors,
      validation.warnings
    )
  }

  // Log warnings but continue
  if (validation.warnings.length > 0) {
    console.warn('[DataPrepAgent] Validation warnings:', validation.warnings)
  }

} catch (error) {
  if (error instanceof ConfigurationError) {
    // Configuration issue - log and use defaults
    console.error(`Config error for ${error.entityType}:`, error.message)
    config = this.configManager.getConfig('base')
  } else if (error instanceof ValidationError) {
    // Validation failed - reject document
    throw error
  } else {
    // Unexpected error - log and rethrow
    console.error('Unexpected error:', error)
    throw error
  }
}
```

### Validation Rules Framework

```typescript
// Type-safe validation rule builder
export class ValidationRuleBuilder {
  private rules: ValidationRule[] = []

  required(field: string, message?: string): this {
    this.rules.push({
      field,
      rule: (v) => v !== null && v !== undefined && v !== '',
      message: message || `${field} is required`
    })
    return this
  }

  minLength(field: string, min: number, message?: string): this {
    this.rules.push({
      field,
      rule: (v) => typeof v === 'string' && v.length >= min,
      message: message || `${field} must be at least ${min} characters`
    })
    return this
  }

  pattern(field: string, pattern: RegExp, message?: string): this {
    this.rules.push({
      field,
      rule: (v) => typeof v === 'string' && pattern.test(v),
      message: message || `${field} does not match required pattern`
    })
    return this
  }

  custom(
    field: string,
    rule: (value: any, doc: any) => boolean,
    message: string
  ): this {
    this.rules.push({ field, rule, message })
    return this
  }

  build(): ValidationRule[] {
    return this.rules
  }
}

// Usage in entity config
const validationRules = new ValidationRuleBuilder()
  .required('name')
  .minLength('description', 20)
  .pattern('email', /^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email format')
  .custom(
    'age',
    (v) => typeof v === 'number' && v >= 0 && v <= 150,
    'Age must be between 0 and 150'
  )
  .build()
```

---

## Performance Considerations

### Optimization Strategies

#### 1. Lazy Configuration Loading

```typescript
export class ConfigManager {
  // Load configs on-demand
  private loadedConfigs: Set<string> = new Set()

  getConfig(entityType: string): EntityConfig {
    // Check if already loaded
    if (!this.loadedConfigs.has(entityType)) {
      this.loadEntityConfig(entityType)
      this.loadedConfigs.add(entityType)
    }

    return this.configs.get(entityType)!
  }

  private loadEntityConfig(entityType: string): void {
    // Lazy load from file system or registry
    const config = this.loader.loadSync(entityType)
    this.configs.set(entityType, config)
  }
}
```

#### 2. Configuration Caching

```typescript
// LRU cache for compiled configurations
import LRU from 'lru-cache'

export class ConfigManager {
  private configCache = new LRU<string, EntityConfig>({
    max: 50, // Max 50 entity configs in memory
    ttl: 1000 * 60 * 60, // 1 hour TTL
    updateAgeOnGet: true
  })

  getConfig(entityType: string): EntityConfig {
    // Check cache first
    const cached = this.configCache.get(entityType)
    if (cached) return cached

    // Load and cache
    const config = this.loadConfig(entityType)
    this.configCache.set(entityType, config)

    return config
  }
}
```

#### 3. Prompt Template Caching

```typescript
export class PromptManager {
  private compiledPrompts = new Map<string, CompiledTemplate>()

  getPrompt(
    entityType: string,
    stage: PromptStage,
    variables: Record<string, any>
  ): string {
    const cacheKey = `${entityType}:${stage}`

    // Get or compile template
    let compiled = this.compiledPrompts.get(cacheKey)
    if (!compiled) {
      const template = this.templates.get(entityType)?.[stage]
      if (!template) throw new Error(`Template not found: ${cacheKey}`)

      compiled = this.engine.compile(template)
      this.compiledPrompts.set(cacheKey, compiled)
    }

    // Execute with variables
    return compiled(variables)
  }
}
```

### Performance Benchmarks

**Target Metrics**:

| Operation | Target | Max |
|-----------|--------|-----|
| Config load (first time) | < 10ms | 50ms |
| Config load (cached) | < 1ms | 5ms |
| Prompt compilation | < 5ms | 20ms |
| Prompt interpolation | < 2ms | 10ms |
| Validation (simple) | < 5ms | 20ms |
| Validation (complex) | < 20ms | 100ms |

**Memory Usage**:

- Base config: ~1KB
- Entity config: ~2-3KB
- Compiled prompt: ~500 bytes
- Total overhead (10 entities): ~25KB

---

## Security Considerations

### Custom Validation Functions

**Risk**: Custom validation functions in configurations could contain malicious code.

**Mitigation Strategies**:

#### 1. Function Sandboxing (Recommended)

```typescript
import { VM } from 'vm2'

export class SafeValidator {
  private vm: VM

  constructor() {
    this.vm = new VM({
      timeout: 1000, // 1 second max execution
      sandbox: {
        // Limited environment
        console: {
          log: () => {}, // No-op
          error: () => {}
        }
      }
    })
  }

  /**
   * Execute validation function safely
   */
  executeValidation(
    rule: ValidationRule,
    value: any,
    document: any
  ): boolean {
    try {
      // Serialize function to string
      const fnString = rule.rule.toString()

      // Execute in sandbox
      const result = this.vm.run(`
        const validate = ${fnString};
        validate(${JSON.stringify(value)}, ${JSON.stringify(document)});
      `)

      return Boolean(result)
    } catch (error) {
      console.error('Validation function error:', error)
      return false
    }
  }
}
```

#### 2. Static Function Analysis

```typescript
export class FunctionAnalyzer {
  private dangerousPatterns = [
    /require\(/,
    /import\(/,
    /eval\(/,
    /Function\(/,
    /process\./,
    /child_process/,
    /fs\./,
    /__dirname/,
    /__filename/
  ]

  /**
   * Analyze function for dangerous patterns
   */
  analyze(fn: Function): { safe: boolean; issues: string[] } {
    const fnString = fn.toString()
    const issues: string[] = []

    for (const pattern of this.dangerousPatterns) {
      if (pattern.test(fnString)) {
        issues.push(`Dangerous pattern detected: ${pattern}`)
      }
    }

    return {
      safe: issues.length === 0,
      issues
    }
  }
}
```

#### 3. Allowlist Approach (Most Secure)

```typescript
// Predefined safe validation functions
export const SAFE_VALIDATORS = {
  required: (v: any) => v !== null && v !== undefined && v !== '',
  minLength: (min: number) => (v: string) => v.length >= min,
  maxLength: (max: number) => (v: string) => v.length <= max,
  pattern: (regex: RegExp) => (v: string) => regex.test(v),
  range: (min: number, max: number) => (v: number) => v >= min && v <= max,
  oneOf: (values: any[]) => (v: any) => values.includes(v),
  email: (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
  url: (v: string) => {
    try {
      new URL(v)
      return true
    } catch {
      return false
    }
  }
}

// Configuration uses validator names, not functions
export interface SafeMetadataFieldConfig {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object'
  required: boolean
  validation?: {
    validator: keyof typeof SAFE_VALIDATORS
    params?: any[]
  }
}
```

### Configuration Source Validation

```typescript
export class ConfigLoader {
  private allowedPaths: string[]

  constructor(allowedPaths: string[]) {
    this.allowedPaths = allowedPaths
  }

  /**
   * Validate config source path
   */
  private validatePath(configPath: string): void {
    const resolved = path.resolve(configPath)

    // Check if path is within allowed directories
    const allowed = this.allowedPaths.some(allowedPath =>
      resolved.startsWith(path.resolve(allowedPath))
    )

    if (!allowed) {
      throw new SecurityError(
        `Config path not allowed: ${configPath}`
      )
    }
  }

  /**
   * Load configuration securely
   */
  async load(configPath: string): Promise<EntityConfig> {
    this.validatePath(configPath)

    // Read file
    const content = await fs.readFile(configPath, 'utf-8')

    // Parse JSON (safer than eval/require)
    const config = JSON.parse(content)

    // Validate schema
    this.validator.validateSchema(config)

    return config
  }
}
```

---

## Migration Path

### Phase 1: Preparation (No Code Changes)

**Tasks**:
1. Create configuration directory structure
2. Define type definitions
3. Write entity configurations
4. Set up validation schemas
5. Prepare tests

**Timeline**: 1-2 days

### Phase 2: Foundation (Non-Breaking)

**Tasks**:
1. Implement ConfigManager (unused)
2. Implement EntityRegistry
3. Implement PromptManager
4. Add to agent initialization
5. Test configuration loading

**Changes**:
```typescript
// Agent constructor - add config manager (not used yet)
constructor(config: AgentConfig) {
  // Existing code unchanged

  // NEW: Initialize config manager
  this.configManager = ConfigManager.getInstance()
}
```

**Timeline**: 2-3 days

### Phase 3: Gradual Integration

**Tasks**:
1. Update MetadataGenerator to use custom prompts
2. Update Validator to use entity rules
3. Update DataEnricher to use quality thresholds
4. Add feature flag checks
5. Test each integration

**Changes**:
```typescript
// MetadataGenerator - use custom prompts if available
const analyzePrompt = this.configManager.hasConfig(entityType)
  ? this.configManager.getPrompt(entityType, 'analyze', variables)
  : this.getDefaultPrompt('analyze', variables)
```

**Timeline**: 3-4 days

### Phase 4: Full Migration

**Tasks**:
1. All components use configuration system
2. Remove hardcoded defaults
3. Update documentation
4. Performance optimization
5. Full test coverage

**Timeline**: 2-3 days

### Rollback Strategy

**Safe Rollback**:
1. Configuration system is additive, not destructive
2. All components have fallbacks to defaults
3. Feature flags allow disabling new behavior
4. No database migrations required

**Rollback Commands**:
```typescript
// Disable configuration system via feature flag
const config: AgentConfig = {
  // ... existing config
  features: {
    enableConfiguration: false // Fallback to hardcoded behavior
  }
}
```

---

## Extensibility Guidelines

### Adding New Entity Types

**Step 1**: Create configuration file

```typescript
// src/lib/agents/data-preparation/config/entities/concept.ts
import type { EntityConfig } from '../types'
import { baseConfig } from '../defaults'

export const conceptConfig: EntityConfig = {
  ...baseConfig,
  entityType: 'concept',
  collectionSlug: 'concepts',
  extends: 'base',

  // Define metadata schema
  metadata: {
    required: ['conceptType', 'significance'],
    optional: ['relatedConcepts', 'thematicConnection'],
    schema: {
      conceptType: {
        type: 'string',
        required: true,
        validation: (v) => ['theme', 'motif', 'symbol', 'idea'].includes(v)
      },
      significance: {
        type: 'string',
        required: true
      }
    },
    defaults: {
      conceptType: 'idea'
    }
  },

  // Define custom prompts
  llm: {
    prompts: {
      analyze: `Analyze this concept...`,
      extract: `Extract concept metadata...`,
      summarize: `Summarize the concept...`,
      relationships: `Identify related concepts...`
    },
    temperature: 0.6,
    maxTokens: 1500
  },

  // Define allowed relationships
  relationships: {
    allowed: [
      { type: 'REPRESENTS', targetType: 'character' },
      { type: 'APPEARS_IN', targetType: 'scene' },
      { type: 'RELATES_TO', targetType: 'concept' }
    ],
    autoDiscover: true,
    confidenceThreshold: 0.7
  },

  // Define quality rules
  quality: {
    minimumScore: 0.6,
    requiredFields: ['name', 'conceptType'],
    validationRules: [
      {
        field: 'name',
        rule: (v) => v && v.length > 0,
        message: 'Concept name is required'
      }
    ]
  },

  processing: {
    async: false,
    priority: 'normal',
    cacheTTL: 3600,
    retryAttempts: 3
  },

  features: {
    enableLLM: true,
    enableCache: true,
    enableQueue: true,
    enableValidation: true,
    enableRelationships: true
  }
}
```

**Step 2**: Register configuration

```typescript
// src/lib/agents/data-preparation/config/entities/index.ts
export { characterConfig } from './character'
export { sceneConfig } from './scene'
export { locationConfig } from './location'
export { conceptConfig } from './concept' // NEW

// Auto-register all configs
import { characterConfig } from './character'
import { sceneConfig } from './scene'
import { locationConfig } from './location'
import { conceptConfig } from './concept' // NEW

export const entityConfigs = [
  characterConfig,
  sceneConfig,
  locationConfig,
  conceptConfig // NEW
]
```

**Step 3**: Use immediately - no code changes needed!

```typescript
// Automatically works with new entity type
const result = await agent.prepare(conceptData, {
  projectId: '123',
  entityType: 'concept', // NEW entity type
  sourceCollection: 'concepts'
})
```

### Adding Custom Validation Rules

```typescript
// Define reusable validation function
export const customValidators = {
  validGenre: (v: string) => {
    const validGenres = ['action', 'drama', 'comedy', 'thriller', 'scifi']
    return validGenres.includes(v.toLowerCase())
  },

  validAge: (v: number) => {
    return typeof v === 'number' && v >= 0 && v <= 150
  },

  validEmail: (v: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
  }
}

// Use in entity config
const config: EntityConfig = {
  // ...
  quality: {
    validationRules: [
      {
        field: 'genre',
        rule: customValidators.validGenre,
        message: 'Invalid genre'
      }
    ]
  }
}
```

### Plugin System (Future Enhancement)

```typescript
export interface ConfigPlugin {
  name: string
  version: string
  apply(manager: ConfigManager): void
}

export class CustomEntityPlugin implements ConfigPlugin {
  name = 'custom-entity-plugin'
  version = '1.0.0'

  apply(manager: ConfigManager): void {
    // Register custom entity config
    manager.registerConfig(customEntityConfig)

    // Register custom validators
    manager.registerValidators(customValidators)

    // Register custom prompts
    manager.registerPrompts('customEntity', customPrompts)
  }
}

// Usage
const manager = ConfigManager.getInstance()
manager.use(new CustomEntityPlugin())
```

---

## Testing Strategy

### Unit Tests

```typescript
// tests/config/config-manager.test.ts
describe('ConfigManager', () => {
  let manager: ConfigManager

  beforeEach(() => {
    manager = new ConfigManager()
  })

  describe('getConfig', () => {
    it('should return config for registered entity', () => {
      manager.registerConfig(characterConfig)

      const config = manager.getConfig('character')

      expect(config).toBeDefined()
      expect(config.entityType).toBe('character')
    })

    it('should return default config for unknown entity', () => {
      const config = manager.getConfig('unknown')

      expect(config).toBeDefined()
      expect(config.entityType).toBe('base')
    })

    it('should apply inheritance correctly', () => {
      const base = { ...baseConfig }
      const extended: EntityConfig = {
        ...base,
        entityType: 'custom',
        extends: 'base',
        metadata: {
          ...base.metadata,
          required: [...base.metadata.required, 'customField']
        }
      }

      manager.registerConfig(base)
      manager.registerConfig(extended)

      const config = manager.getConfig('custom')

      expect(config.metadata.required).toContain('customField')
      expect(config.metadata.required).toContain('name')
    })
  })

  describe('registerConfig', () => {
    it('should validate config schema', () => {
      const invalid = { entityType: 'test' } as EntityConfig

      expect(() => manager.registerConfig(invalid)).toThrow()
    })

    it('should invalidate cache on register', () => {
      manager.registerConfig(characterConfig)
      const config1 = manager.getConfig('character')

      const updated = { ...characterConfig, processing: { ...characterConfig.processing, priority: 'low' as const } }
      manager.registerConfig(updated)
      const config2 = manager.getConfig('character')

      expect(config2.processing.priority).toBe('low')
    })
  })
})
```

### Integration Tests

```typescript
// tests/integration/agent-with-config.test.ts
describe('DataPreparationAgent with Configuration', () => {
  let agent: DataPreparationAgent

  beforeEach(() => {
    agent = getDataPreparationAgent()
  })

  it('should use entity-specific prompts', async () => {
    const spy = jest.spyOn(agent['metadataGenerator'], 'generate')

    await agent.prepare(characterData, {
      projectId: '123',
      entityType: 'character',
      sourceCollection: 'characters'
    })

    expect(spy).toHaveBeenCalled()
    // Verify custom character prompts were used
  })

  it('should validate using entity-specific rules', async () => {
    const invalidCharacter = {
      name: 'Test',
      description: 'Too short', // Should fail minLength validation
      characterType: 'invalid' // Should fail enum validation
    }

    await expect(
      agent.prepare(invalidCharacter, {
        projectId: '123',
        entityType: 'character'
      })
    ).rejects.toThrow('Validation failed')
  })

  it('should respect feature flags', async () => {
    // Disable LLM for test entity
    const config = manager.getConfig('character')
    config.features.enableLLM = false

    const result = await agent.prepare(characterData, {
      projectId: '123',
      entityType: 'character'
    })

    // Verify LLM was not called
    expect(result.metadata).not.toHaveProperty('llmGenerated')
  })
})
```

### Performance Tests

```typescript
// tests/performance/config-performance.test.ts
describe('Configuration Performance', () => {
  it('should load config in < 10ms', () => {
    const start = performance.now()

    for (let i = 0; i < 1000; i++) {
      manager.getConfig('character')
    }

    const duration = performance.now() - start
    const avgDuration = duration / 1000

    expect(avgDuration).toBeLessThan(10)
  })

  it('should cache compiled prompts', () => {
    const start = performance.now()

    // First call - compile
    promptManager.getPrompt('character', 'analyze', { data: 'test' })
    const firstCall = performance.now() - start

    const start2 = performance.now()

    // Second call - cached
    promptManager.getPrompt('character', 'analyze', { data: 'test2' })
    const secondCall = performance.now() - start2

    expect(secondCall).toBeLessThan(firstCall * 0.5)
  })
})
```

---

## Architecture Decision Records

### ADR-001: Configuration Storage Format

**Status**: Accepted
**Date**: 2025-10-01

**Context**:
Need to decide between JSON, TypeScript modules, or YAML for configuration storage.

**Decision**:
Use TypeScript modules with typed exports.

**Rationale**:
- Type safety at compile time
- Code completion in IDEs
- Can include functions (validators, transforms)
- Easy to import and use
- Version controlled with code
- No runtime parsing overhead

**Consequences**:
- Positive: Full TypeScript benefits, better DX
- Negative: Cannot hot-reload without rebuild (acceptable trade-off)

---

### ADR-002: Configuration Inheritance Model

**Status**: Accepted
**Date**: 2025-10-01

**Context**:
Need inheritance mechanism to avoid duplication across entity configs.

**Decision**:
Single inheritance with deep merge strategy.

**Rationale**:
- Simple mental model
- Avoids diamond problem
- Clear override semantics
- Performant merge algorithm

**Consequences**:
- Positive: Easy to understand and maintain
- Negative: Limited flexibility compared to multiple inheritance

---

### ADR-003: Custom Validation Function Security

**Status**: Accepted
**Date**: 2025-10-01

**Context**:
Custom validation functions could execute arbitrary code.

**Decision**:
Phase 1: Allowlist approach with predefined validators
Phase 2: Add sandboxed custom functions if needed

**Rationale**:
- Security first approach
- 90% of use cases covered by predefined validators
- Can extend later with proper sandboxing
- Reduces attack surface

**Consequences**:
- Positive: Secure by default
- Negative: Less flexible initially

---

### ADR-004: Configuration Loading Strategy

**Status**: Accepted
**Date**: 2025-10-01

**Context**:
Decide between eager loading (all configs at startup) vs lazy loading (on-demand).

**Decision**:
Lazy loading with LRU cache.

**Rationale**:
- Faster startup time
- Lower memory footprint
- Only load what's actually used
- Cache ensures performance

**Consequences**:
- Positive: Better resource utilization
- Negative: First request slightly slower (acceptable)

---

### ADR-005: Prompt Template Engine

**Status**: Accepted
**Date**: 2025-10-01

**Context**:
Need template engine for LLM prompts with variable interpolation.

**Decision**:
Custom lightweight template engine with `{variable}` syntax.

**Rationale**:
- Simple syntax
- No external dependencies
- Compile once, execute many times
- Full control over interpolation

**Consequences**:
- Positive: Fast, lightweight, predictable
- Negative: Limited features (no conditionals, loops)

---

## Appendix: Complete Type Definitions

```typescript
// src/lib/agents/data-preparation/config/types.ts

export interface EntityConfig {
  // Identity
  entityType: string
  collectionSlug: string
  extends?: string
  version?: string

  // Metadata configuration
  metadata: MetadataConfig

  // LLM configuration
  llm: LLMConfig

  // Relationship configuration
  relationships: RelationshipConfig

  // Quality configuration
  quality: QualityConfig

  // Processing configuration
  processing: ProcessingConfig

  // Feature flags
  features: FeatureFlags
}

export interface MetadataConfig {
  required: string[]
  optional: string[]
  schema: Record<string, MetadataFieldConfig>
  defaults: Record<string, any>
}

export interface MetadataFieldConfig {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object'
  required: boolean
  default?: any
  validation?: (value: any) => boolean
  transform?: (value: any) => any
  description?: string
}

export interface LLMConfig {
  prompts: PromptTemplates
  model?: string
  temperature?: number
  maxTokens?: number
  topP?: number
  frequencyPenalty?: number
  presencePenalty?: number
}

export interface PromptTemplates {
  analyze: string
  extract: string
  summarize: string
  relationships: string
  [key: string]: string
}

export type PromptStage = keyof PromptTemplates

export interface RelationshipConfig {
  allowed: RelationshipType[]
  required?: RelationshipType[]
  autoDiscover: boolean
  confidenceThreshold: number
  maxRelationships?: number
}

export interface RelationshipType {
  type: string
  targetType: string
  properties?: Record<string, any>
  bidirectional?: boolean
  required?: boolean
}

export interface QualityConfig {
  minimumScore: number
  requiredFields: string[]
  validationRules: ValidationRule[]
  scoring?: ScoringWeights
}

export interface ScoringWeights {
  hasName: number
  hasDescription: number
  hasMetadata: number
  hasRelationships: number
  metadataCompleteness: number
}

export interface ValidationRule {
  field: string
  rule: (value: any, doc: any) => boolean
  message: string
  severity?: 'error' | 'warning'
}

export interface ProcessingConfig {
  async: boolean
  priority: 'low' | 'normal' | 'high' | 'critical'
  cacheTTL: number
  retryAttempts: number
  timeout?: number
  batchSize?: number
}

export interface FeatureFlags {
  enableLLM: boolean
  enableCache: boolean
  enableQueue: boolean
  enableValidation: boolean
  enableRelationships: boolean
  enableEnrichment?: boolean
  enableMetrics?: boolean
}
```

---

## Summary

This architecture provides a robust, flexible, and secure foundation for the Phase 5 Configuration System. Key highlights:

✅ **Backward Compatible**: No breaking changes to existing code
✅ **Type Safe**: Full TypeScript coverage with generics
✅ **Performant**: < 10ms config load, < 2% overhead
✅ **Secure**: Sandboxed validation, validated sources
✅ **Extensible**: Easy to add new entity types
✅ **Testable**: Comprehensive testing strategy
✅ **Maintainable**: Clear patterns and documentation

**Next Steps**:
1. Review architecture with team
2. Get approval on ADRs
3. Begin Phase 1 implementation
4. Set up continuous integration tests
5. Plan rollout strategy

---

**Document Control**:
- Version: 1.0.0
- Last Updated: 2025-10-01
- Next Review: After Phase 1 implementation
- Owner: System Architect Agent
- Reviewers: Development Team, Tech Lead
