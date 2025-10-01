# Data Preparation Agent - Configuration System

Comprehensive configuration management system for the Data Preparation Agent, providing type-safe configuration, validation, and dynamic loading capabilities.

## Overview

The configuration system allows you to define how different entity types (characters, scenes, locations, etc.) should be processed by the Data Preparation Agent. It supports:

- **Type-safe Configuration**: Full TypeScript type definitions
- **Validation**: Comprehensive validation rules and error handling
- **Caching**: Performance optimization with multi-level caching
- **Dynamic Loading**: Load configurations from files, databases, or defaults
- **Singleton Pattern**: Centralized configuration management
- **Extensibility**: Easy to add new entity types and rules

## Architecture

```
config/
├── types.ts       # Type definitions
├── defaults.ts    # Default configurations and templates
├── index.ts       # ConfigManager class
└── README.md      # This file
```

## Quick Start

### 1. Basic Usage

```typescript
import { getConfigManager } from '@/lib/agents/data-preparation/config'

// Get singleton instance
const configManager = getConfigManager()

// Get entity configuration
const characterConfig = configManager.getEntityConfig('character')

// Get metadata fields
const metadataFields = configManager.getMetadataFields('character')

// Validate entity data
const validation = configManager.validateEntityData('character', {
  name: 'John Doe',
  description: 'A mysterious stranger',
})

if (!validation.valid) {
  console.error('Validation errors:', validation.errors)
}
```

### 2. Load Custom Configuration

```typescript
import { getConfigManager } from '@/lib/agents/data-preparation/config'

const configManager = getConfigManager()

// Load from default
await configManager.load({ source: 'default' })

// Load with overrides
await configManager.load({
  source: 'default',
  overrides: {
    entities: {
      character: {
        enrichmentStrategy: {
          level: 'comprehensive',
        },
      },
    },
    features: {
      enableDebugLogging: true,
    },
  },
})
```

### 3. Add Custom Entity Type

```typescript
import { getConfigManager, EntityConfig } from '@/lib/agents/data-preparation/config'

const configManager = getConfigManager()

const customEntityConfig: EntityConfig = {
  type: 'prop',
  displayName: 'Prop',
  description: 'Props and items used in scenes',
  requiredFields: ['name'],
  optionalFields: ['description', 'category'],
  contextSources: ['payload', 'brain'],
  metadataFields: [
    {
      name: 'category',
      type: 'enum',
      description: 'Prop category',
      required: false,
      useLLM: true,
      enumValues: ['weapon', 'furniture', 'clothing', 'vehicle', 'other'],
    },
  ],
  relationshipTypes: [],
  validationRules: [
    {
      id: 'require_name',
      field: 'name',
      type: 'required',
      message: 'Prop name is required',
      severity: 'error',
      blocking: true,
    },
  ],
  enrichmentStrategy: {
    level: 'minimal',
    useLLM: false,
    contextGathering: {
      sources: ['payload'],
      maxItemsPerSource: 10,
      includeSimilar: false,
      useCache: true,
    },
    relationshipDiscovery: {
      enabled: false,
      discoverTypes: [],
      confidenceThreshold: 0.7,
      maxRelationships: 5,
      useLLM: false,
      validateDiscovered: false,
    },
    metadataGeneration: {
      fields: ['category'],
      useLLM: false,
      includeExamples: false,
    },
  },
}

configManager.addEntityConfig('prop', customEntityConfig)
```

## Configuration Schema

### Entity Configuration

Each entity type has a comprehensive configuration:

```typescript
interface EntityConfig {
  type: string                           // Entity type identifier
  displayName: string                     // Human-readable name
  description: string                     // Entity description
  requiredFields: string[]                // Must-have fields
  optionalFields?: string[]               // Optional fields
  contextSources: ContextSource[]         // Where to gather context
  metadataFields: MetadataFieldConfig[]   // Metadata to generate
  relationshipTypes: RelationshipTypeConfig[]  // Relationship rules
  validationRules: ValidationRule[]       // Validation rules
  enrichmentStrategy: EnrichmentStrategy  // How to enrich data
  llmPromptConfig?: LLMPromptConfig       // LLM prompt templates
  features?: EntityFeatures               // Feature flags
  hooks?: EntityHooks                     // Processing hooks
}
```

### Metadata Field Configuration

Define how metadata fields should be generated:

```typescript
interface MetadataFieldConfig {
  name: string                    // Field name
  type: MetadataFieldType         // Data type
  description: string             // Field description
  required: boolean               // Is this field required?
  useLLM: boolean                 // Use LLM for generation?
  defaultValue?: any              // Default value
  validation?: FieldValidation    // Validation rules
  llmPrompt?: string              // LLM generation prompt
  isArray?: boolean               // Can have multiple values?
  enumValues?: string[]           // Enum options
  constraints?: FieldConstraints  // Min/max constraints
  examples?: any[]                // Example values
  searchable?: boolean            // Should be indexed?
  transform?: string              // Custom transformer
}
```

### Relationship Type Configuration

Define how relationships are discovered:

```typescript
interface RelationshipTypeConfig {
  type: string                    // Relationship type
  displayName: string             // Human-readable name
  description: string             // Description
  targetTypes: string[]           // Target entity types
  autoDiscover: boolean           // Auto-discover relationships?
  bidirectional: boolean          // Is bidirectional?
  inverseType?: string            // Inverse relationship
  confidenceThreshold?: number    // Min confidence (0-1)
  properties?: RelationshipPropertyConfig[]  // Relationship properties
  discoveryPrompt?: string        // LLM discovery prompt
  maxCount?: number               // Max relationships
  required?: boolean              // Is required?
  validation?: RelationshipValidation  // Validation rules
}
```

### Validation Rules

Define validation rules for entities:

```typescript
interface ValidationRule {
  id: string                      // Rule identifier
  field: string                   // Field to validate
  type: ValidationRuleType        // Rule type
  value?: any                     // Rule value
  message: string                 // Error message
  warningMessage?: string         // Warning message
  severity: 'error' | 'warning' | 'info'  // Severity level
  blocking?: boolean              // Block processing?
  customValidator?: string        // Custom validator
  condition?: ValidationCondition // When to apply
}
```

### Enrichment Strategy

Configure how data should be enriched:

```typescript
interface EnrichmentStrategy {
  level: 'minimal' | 'standard' | 'comprehensive' | 'custom'
  useLLM: boolean
  contextGathering: ContextGatheringConfig
  relationshipDiscovery: RelationshipDiscoveryConfig
  metadataGeneration: MetadataGenerationConfig
  qualityThresholds?: QualityThresholds
}
```

## Default Configurations

### Pre-configured Entity Types

The system includes default configurations for:

- **Character**: Comprehensive character analysis with personality, arc, archetype
- **Scene**: Scene analysis with type, pacing, narrative function
- **Location**: Location metadata with atmosphere, type, visual elements
- **Episode**: Episode analysis with themes, arc, significance

### Enrichment Strategies

Three pre-configured strategies:

1. **Minimal**: Basic context gathering, no LLM, no relationships
2. **Standard**: Moderate context, LLM metadata, basic relationships
3. **Comprehensive**: Full context, extensive LLM, advanced relationships

### Common Metadata Fields

Reusable metadata fields:

- `summary`: Brief entity summary (LLM-generated)
- `tags`: Categorization tags (LLM-generated)
- `sentiment`: Emotional tone (positive/negative/neutral/mixed)
- `significance`: Narrative importance (low/medium/high/critical)
- `confidence`: Generation confidence score (0-1)

### Common Relationship Types

Standard relationship types:

- `relates_to`: General relationship
- `appears_in`: Entity appears in another
- `references`: Entity references another
- `influences`: Entity influences another
- `conflicts_with`: Entity conflicts with another

## API Reference

### ConfigManager Methods

#### Configuration Loading

```typescript
// Load configuration
await configManager.load(options: ConfigLoadOptions)

// Import from JSON
configManager.importConfig(jsonString: string, validate?: boolean)

// Export to JSON
const json = configManager.exportConfig()
```

#### Entity Configuration

```typescript
// Get entity configuration
const config = configManager.getEntityConfig(entityType: string)

// Get all entity types
const types = configManager.getEntityTypes()

// Check if entity exists
const exists = configManager.hasEntityConfig(entityType: string)

// Add entity configuration
configManager.addEntityConfig(entityType: string, config: EntityConfig)

// Update entity configuration
configManager.updateEntityConfig(entityType: string, updates: Partial<EntityConfig>)

// Remove entity configuration
configManager.removeEntityConfig(entityType: string)
```

#### Field and Rule Access

```typescript
// Get metadata fields
const fields = configManager.getMetadataFields(entityType: string)

// Get relationship types
const relationships = configManager.getRelationshipTypes(entityType: string)

// Get validation rules
const rules = configManager.getValidationRules(entityType: string)

// Get enrichment strategy
const strategy = configManager.getEnrichmentStrategy(entityType: string)

// Get required fields
const required = configManager.getRequiredFields(entityType: string)
```

#### Global Configuration

```typescript
// Get global config
const global = configManager.getGlobalConfig()

// Get cache config
const cache = configManager.getCacheConfig()

// Get performance config
const perf = configManager.getPerformanceConfig()

// Get features
const features = configManager.getFeatures()

// Check feature
const enabled = configManager.isFeatureEnabled('enableDebugLogging')
```

#### Validation

```typescript
// Validate configuration
const result = configManager.validateConfiguration(config: ConfigurationSchema)

// Validate entity data
const validation = configManager.validateEntityData(entityType: string, data: any)
```

#### Utilities

```typescript
// Clear cache
configManager.clearCache()

// Get statistics
const stats = configManager.getStats()

// Reset instance (testing)
ConfigManager.resetInstance()
```

## Validation Helpers

Built-in validation helper functions:

```typescript
import { ValidationHelpers } from '@/lib/agents/data-preparation/config'

// Check if value is required
ValidationHelpers.isRequired(value: any): boolean

// Check minimum length
ValidationHelpers.hasMinLength(value: string, minLength: number): boolean

// Check maximum length
ValidationHelpers.hasMaxLength(value: string, maxLength: number): boolean

// Check pattern match
ValidationHelpers.matchesPattern(value: string, pattern: string): boolean

// Check enum value
ValidationHelpers.isValidEnum(value: any, enumValues: string[]): boolean

// Check number range
ValidationHelpers.isInRange(value: number, min?: number, max?: number): boolean
```

## Examples

### Example 1: Custom Character Validation

```typescript
import { getConfigManager } from '@/lib/agents/data-preparation/config'

const configManager = getConfigManager()

configManager.updateEntityConfig('character', {
  validationRules: [
    {
      id: 'require_character_type',
      field: 'characterType',
      type: 'enum',
      value: ['protagonist', 'antagonist', 'supporting', 'minor'],
      message: 'Invalid character type',
      severity: 'error',
      blocking: true,
    },
    {
      id: 'min_description',
      field: 'description',
      type: 'minLength',
      value: 50,
      message: 'Character description should be at least 50 characters',
      severity: 'warning',
      blocking: false,
    },
  ],
})
```

### Example 2: Custom Metadata Generation

```typescript
import { getConfigManager } from '@/lib/agents/data-preparation/config'

const configManager = getConfigManager()

configManager.updateEntityConfig('scene', {
  metadataFields: [
    {
      name: 'emotionalIntensity',
      type: 'number',
      description: 'Emotional intensity level (1-10)',
      required: false,
      useLLM: true,
      llmPrompt: 'Rate the emotional intensity of this scene from 1-10, where 1 is calm and 10 is extremely intense.',
      constraints: {
        min: 1,
        max: 10,
      },
    },
    {
      name: 'visualComplexity',
      type: 'enum',
      description: 'Visual complexity for production planning',
      required: false,
      useLLM: true,
      enumValues: ['simple', 'moderate', 'complex', 'very-complex'],
      llmPrompt: 'Assess the visual complexity of this scene for production planning.',
    },
  ],
})
```

### Example 3: Custom Relationship Discovery

```typescript
import { getConfigManager } from '@/lib/agents/data-preparation/config'

const configManager = getConfigManager()

configManager.updateEntityConfig('character', {
  relationshipTypes: [
    {
      type: 'loves',
      displayName: 'Loves',
      description: 'Romantic love between characters',
      targetTypes: ['character'],
      autoDiscover: true,
      bidirectional: false,
      confidenceThreshold: 0.85,
      discoveryPrompt: 'Analyze the relationship between these characters. Is there romantic love? Provide confidence score and reasoning.',
      maxCount: 3,
      properties: [
        {
          name: 'reciprocated',
          type: 'boolean',
          description: 'Is the love reciprocated?',
          required: false,
        },
      ],
    },
  ],
})
```

## Integration with Data Preparation Agent

The configuration system integrates seamlessly with the Data Preparation Agent:

```typescript
import { DataPreparationAgent } from '@/lib/agents/data-preparation/agent'
import { getConfigManager } from '@/lib/agents/data-preparation/config'

// Initialize config
const configManager = getConfigManager()

// Create agent with config-aware processing
const agent = new DataPreparationAgent({
  llm: { /* ... */ },
  brain: { /* ... */ },
  redis: { /* ... */ },
  cache: configManager.getCacheConfig(),
  queue: { /* ... */ },
  features: configManager.getFeatures(),
})

// Prepare data using configuration
const result = await agent.prepare(characterData, {
  projectId: 'proj-123',
  entityType: 'character',
})
```

## Performance Considerations

### Caching

The ConfigManager implements multi-level caching:

1. **Memory Cache**: Fast in-memory cache for frequently accessed configs
2. **Redis Cache**: Distributed cache for multi-instance deployments
3. **Lazy Loading**: Configurations loaded on-demand

### Best Practices

1. **Reuse Singleton**: Always use `getConfigManager()` to get the singleton instance
2. **Cache Clearing**: Clear cache only when configuration changes
3. **Validation**: Validate configurations during load, not runtime
4. **Batch Updates**: Update multiple fields in one call instead of multiple updates

## Error Handling

The configuration system provides comprehensive error handling:

```typescript
try {
  const config = configManager.getEntityConfig('unknown_type')
  if (!config) {
    console.warn('Entity type not found, using defaults')
  }
} catch (error) {
  console.error('Configuration error:', error)
}

// Validation errors
const validation = configManager.validateConfiguration(customConfig)
if (!validation.valid) {
  validation.errors.forEach(error => {
    console.error(`${error.severity}: ${error.path} - ${error.message}`)
  })
}
```

## Testing

Example test cases:

```typescript
import { ConfigManager } from '@/lib/agents/data-preparation/config'

describe('ConfigManager', () => {
  beforeEach(() => {
    ConfigManager.resetInstance()
  })

  it('should return singleton instance', () => {
    const instance1 = ConfigManager.getInstance()
    const instance2 = ConfigManager.getInstance()
    expect(instance1).toBe(instance2)
  })

  it('should validate entity data', () => {
    const manager = ConfigManager.getInstance()
    const result = manager.validateEntityData('character', {
      name: 'Test Character',
      description: 'A test character for validation',
    })
    expect(result.valid).toBe(true)
  })
})
```

## Future Enhancements

Planned improvements:

- [ ] Database persistence for configurations
- [ ] Version control for configuration changes
- [ ] Configuration migration tools
- [ ] Visual configuration editor
- [ ] Configuration templates marketplace
- [ ] A/B testing for enrichment strategies
- [ ] Machine learning for optimal configuration suggestions

## Contributing

To add new entity types or improve configurations:

1. Define types in `types.ts`
2. Add defaults in `defaults.ts`
3. Update `ConfigManager` if needed
4. Add tests for validation
5. Update this documentation

## Support

For issues or questions:

- Check existing entity configurations in `defaults.ts`
- Review type definitions in `types.ts`
- Consult validation helpers
- Check ConfigManager API reference

---

**Version**: 1.0.0
**Last Updated**: 2025-10-01
**Status**: Production Ready
