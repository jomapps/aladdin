# Phase 5: Configuration System - Detailed Plan

**Version**: 1.0.0  
**Date**: 2025-10-01  
**Status**: 📋 Planning Phase  
**Estimated Duration**: 1-2 weeks  
**Priority**: Optional Enhancement

---

## Overview

Phase 5 adds a comprehensive configuration system that allows fine-tuned control over how the Data Preparation Agent processes different entity types, with customizable metadata schemas, LLM prompts, relationship rules, and quality thresholds.

---

## Goals

1. **Entity-Specific Rules** - Different processing rules per entity type
2. **Custom Metadata Schemas** - Define required/optional metadata per entity
3. **Configurable LLM Prompts** - Customize prompts for different contexts
4. **Feature Flags** - Enable/disable features per collection
5. **Quality Thresholds** - Set minimum quality scores per entity type
6. **Relationship Rules** - Define allowed relationships per entity
7. **Extensibility** - Easy to add new entity types

---

## Architecture

### 1. Configuration Structure

```typescript
// src/lib/agents/data-preparation/config/types.ts

export interface EntityConfig {
  // Entity identification
  entityType: string
  collectionSlug: string
  
  // Metadata configuration
  metadata: {
    required: string[]
    optional: string[]
    schema: Record<string, MetadataFieldConfig>
    defaults: Record<string, any>
  }
  
  // LLM configuration
  llm: {
    prompts: {
      analyze: string
      extract: string
      summarize: string
      relationships: string
    }
    model?: string
    temperature?: number
    maxTokens?: number
  }
  
  // Relationship configuration
  relationships: {
    allowed: RelationshipType[]
    required?: RelationshipType[]
    autoDiscover: boolean
    confidenceThreshold: number
  }
  
  // Quality configuration
  quality: {
    minimumScore: number
    requiredFields: string[]
    validationRules: ValidationRule[]
  }
  
  // Processing configuration
  processing: {
    async: boolean
    priority: 'low' | 'normal' | 'high'
    cacheTTL: number
    retryAttempts: number
  }
  
  // Feature flags
  features: {
    enableLLM: boolean
    enableCache: boolean
    enableQueue: boolean
    enableValidation: boolean
    enableRelationships: boolean
  }
}

export interface MetadataFieldConfig {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object'
  required: boolean
  default?: any
  validation?: (value: any) => boolean
  transform?: (value: any) => any
}

export interface RelationshipType {
  type: string
  targetType: string
  properties?: Record<string, any>
  bidirectional?: boolean
}

export interface ValidationRule {
  field: string
  rule: (value: any, doc: any) => boolean
  message: string
}
```

### 2. Configuration Files

```
src/lib/agents/data-preparation/config/
├── types.ts                    # Type definitions
├── defaults.ts                 # Default configuration
├── entities/
│   ├── character.ts           # Character-specific config
│   ├── scene.ts               # Scene-specific config
│   ├── location.ts            # Location-specific config
│   ├── episode.ts             # Episode-specific config
│   ├── dialogue.ts            # Dialogue-specific config
│   ├── concept.ts             # Concept-specific config
│   └── index.ts               # Export all configs
├── prompts/
│   ├── character-prompts.ts   # Character LLM prompts
│   ├── scene-prompts.ts       # Scene LLM prompts
│   └── index.ts               # Export all prompts
└── index.ts                    # Main config manager
```

---

## Implementation Details

### 1. Character Configuration Example

```typescript
// src/lib/agents/data-preparation/config/entities/character.ts

import type { EntityConfig } from '../types'

export const characterConfig: EntityConfig = {
  entityType: 'character',
  collectionSlug: 'characters',
  
  metadata: {
    required: ['characterType', 'role', 'archetype'],
    optional: [
      'personality',
      'backstory',
      'appearance',
      'voice',
      'age',
      'relationships',
      'arc',
      'motivation',
      'conflict',
    ],
    schema: {
      characterType: {
        type: 'string',
        required: true,
        validation: (v) => ['protagonist', 'antagonist', 'supporting', 'minor'].includes(v),
      },
      role: {
        type: 'string',
        required: true,
      },
      archetype: {
        type: 'string',
        required: true,
      },
      personality: {
        type: 'array',
        required: false,
      },
      age: {
        type: 'number',
        required: false,
        validation: (v) => v > 0 && v < 200,
      },
    },
    defaults: {
      characterType: 'supporting',
    },
  },
  
  llm: {
    prompts: {
      analyze: `Analyze this character and determine their type, role, and archetype.
Consider the project genre, themes, and existing characters.
Character data: {data}
Project context: {context}`,
      
      extract: `Extract detailed metadata for this character.
Required: characterType, role, archetype
Optional: personality traits, backstory elements, appearance details
Character: {data}
Context: {context}`,
      
      summarize: `Create a comprehensive character summary for search and retrieval.
Include: name, type, role, key traits, relationships, story function
Character: {data}
Metadata: {metadata}`,
      
      relationships: `Identify relationships for this character.
Consider: scenes they appear in, other characters they interact with, locations they frequent
Character: {data}
Context: {context}`,
    },
    temperature: 0.7,
    maxTokens: 2000,
  },
  
  relationships: {
    allowed: [
      { type: 'APPEARS_IN', targetType: 'scene' },
      { type: 'LOVES', targetType: 'character', bidirectional: true },
      { type: 'HATES', targetType: 'character', bidirectional: true },
      { type: 'BEFRIENDS', targetType: 'character', bidirectional: true },
      { type: 'OPPOSES', targetType: 'character', bidirectional: true },
      { type: 'MENTORS', targetType: 'character' },
      { type: 'FREQUENTS', targetType: 'location' },
    ],
    autoDiscover: true,
    confidenceThreshold: 0.7,
  },
  
  quality: {
    minimumScore: 0.6,
    requiredFields: ['name', 'description'],
    validationRules: [
      {
        field: 'name',
        rule: (v) => v && v.length > 0,
        message: 'Character name is required',
      },
      {
        field: 'description',
        rule: (v) => v && v.length >= 20,
        message: 'Character description must be at least 20 characters',
      },
    ],
  },
  
  processing: {
    async: false,
    priority: 'high',
    cacheTTL: 1800, // 30 minutes
    retryAttempts: 3,
  },
  
  features: {
    enableLLM: true,
    enableCache: true,
    enableQueue: true,
    enableValidation: true,
    enableRelationships: true,
  },
}
```

### 2. Configuration Manager

```typescript
// src/lib/agents/data-preparation/config/index.ts

import type { EntityConfig } from './types'
import { characterConfig } from './entities/character'
import { sceneConfig } from './entities/scene'
import { locationConfig } from './entities/location'
// ... import other configs

export class ConfigManager {
  private configs: Map<string, EntityConfig> = new Map()
  private defaultConfig: Partial<EntityConfig>
  
  constructor() {
    this.loadConfigs()
    this.defaultConfig = this.createDefaultConfig()
  }
  
  /**
   * Load all entity configurations
   */
  private loadConfigs(): void {
    this.configs.set('character', characterConfig)
    this.configs.set('scene', sceneConfig)
    this.configs.set('location', locationConfig)
    // ... register other configs
  }
  
  /**
   * Get configuration for entity type
   */
  getConfig(entityType: string): EntityConfig {
    const config = this.configs.get(entityType)
    if (!config) {
      console.warn(`No config found for ${entityType}, using defaults`)
      return this.createDefaultConfig() as EntityConfig
    }
    return config
  }
  
  /**
   * Register new entity configuration
   */
  registerConfig(config: EntityConfig): void {
    this.configs.set(config.entityType, config)
  }
  
  /**
   * Update existing configuration
   */
  updateConfig(entityType: string, updates: Partial<EntityConfig>): void {
    const existing = this.configs.get(entityType)
    if (existing) {
      this.configs.set(entityType, { ...existing, ...updates })
    }
  }
  
  /**
   * Get LLM prompt for entity and stage
   */
  getPrompt(entityType: string, stage: 'analyze' | 'extract' | 'summarize' | 'relationships'): string {
    const config = this.getConfig(entityType)
    return config.llm.prompts[stage]
  }
  
  /**
   * Check if feature is enabled
   */
  isFeatureEnabled(entityType: string, feature: keyof EntityConfig['features']): boolean {
    const config = this.getConfig(entityType)
    return config.features[feature]
  }
  
  /**
   * Get quality threshold
   */
  getQualityThreshold(entityType: string): number {
    const config = this.getConfig(entityType)
    return config.quality.minimumScore
  }
  
  /**
   * Validate entity data
   */
  validate(entityType: string, data: any): { valid: boolean; errors: string[] } {
    const config = this.getConfig(entityType)
    const errors: string[] = []
    
    // Check required fields
    for (const field of config.quality.requiredFields) {
      if (!data[field]) {
        errors.push(`Required field missing: ${field}`)
      }
    }
    
    // Run validation rules
    for (const rule of config.quality.validationRules) {
      if (!rule.rule(data[rule.field], data)) {
        errors.push(rule.message)
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
    }
  }
  
  /**
   * Create default configuration
   */
  private createDefaultConfig(): Partial<EntityConfig> {
    return {
      metadata: {
        required: [],
        optional: [],
        schema: {},
        defaults: {},
      },
      llm: {
        prompts: {
          analyze: 'Analyze this entity: {data}',
          extract: 'Extract metadata: {data}',
          summarize: 'Summarize: {data}',
          relationships: 'Find relationships: {data}',
        },
        temperature: 0.7,
        maxTokens: 1500,
      },
      relationships: {
        allowed: [],
        autoDiscover: true,
        confidenceThreshold: 0.7,
      },
      quality: {
        minimumScore: 0.5,
        requiredFields: ['name'],
        validationRules: [],
      },
      processing: {
        async: false,
        priority: 'normal',
        cacheTTL: 1800,
        retryAttempts: 3,
      },
      features: {
        enableLLM: true,
        enableCache: true,
        enableQueue: true,
        enableValidation: true,
        enableRelationships: true,
      },
    }
  }
}

// Singleton instance
let configManager: ConfigManager | null = null

export function getConfigManager(): ConfigManager {
  if (!configManager) {
    configManager = new ConfigManager()
  }
  return configManager
}
```

---

## Integration with Existing Agent

### Update Agent to Use Configuration

```typescript
// src/lib/agents/data-preparation/agent.ts

import { getConfigManager } from './config'

export class DataPreparationAgent {
  private configManager: ConfigManager
  
  constructor(config: AgentConfig) {
    // ... existing initialization
    this.configManager = getConfigManager()
  }
  
  async prepare(data: any, options: PrepareOptions): Promise<BrainDocument> {
    // Get entity-specific configuration
    const entityConfig = this.configManager.getConfig(options.entityType)
    
    // Check if LLM is enabled for this entity
    if (!entityConfig.features.enableLLM) {
      console.log(`LLM disabled for ${options.entityType}, skipping metadata generation`)
      // Skip LLM, use defaults
    }
    
    // Use custom prompts
    const analyzePrompt = this.configManager.getPrompt(options.entityType, 'analyze')
    
    // Validate with entity-specific rules
    const validation = this.configManager.validate(options.entityType, data)
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`)
    }
    
    // Use entity-specific cache TTL
    await this.cache.set(cacheKey, result, entityConfig.processing.cacheTTL)
    
    // ... rest of processing
  }
}
```

---

## Benefits

1. **Flexibility** - Different rules for different entity types
2. **Maintainability** - Centralized configuration
3. **Extensibility** - Easy to add new entity types
4. **Customization** - Fine-tune per project needs
5. **Performance** - Optimize per entity type
6. **Quality Control** - Enforce standards per entity

---

## Implementation Tasks

- [ ] Create configuration type definitions
- [ ] Implement ConfigManager class
- [ ] Create character configuration
- [ ] Create scene configuration
- [ ] Create location configuration
- [ ] Create episode configuration
- [ ] Create dialogue configuration
- [ ] Create concept configuration
- [ ] Integrate with DataPreparationAgent
- [ ] Update MetadataGenerator to use custom prompts
- [ ] Update validator to use entity rules
- [ ] Add configuration UI (optional)
- [ ] Write configuration documentation
- [ ] Create configuration examples
- [ ] Add configuration tests

---

## Timeline

**Week 1**:
- Days 1-2: Type definitions and ConfigManager
- Days 3-4: Character and Scene configurations
- Day 5: Integration with agent

**Week 2**:
- Days 1-2: Remaining entity configurations
- Days 3-4: Testing and refinement
- Day 5: Documentation and examples

---

## Success Criteria

- ✅ All entity types have configurations
- ✅ Custom prompts work correctly
- ✅ Validation rules enforce quality
- ✅ Feature flags control behavior
- ✅ Easy to add new entity types
- ✅ Performance optimized per entity
- ✅ Documentation complete

---

**Status**: Ready for implementation when needed

