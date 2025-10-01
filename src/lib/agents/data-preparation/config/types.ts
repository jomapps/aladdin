/**
 * Configuration System Type Definitions
 * Comprehensive type system for Data Preparation Agent configuration
 */

/**
 * Main entity configuration interface
 * Defines how each entity type should be processed
 */
export interface EntityConfig {
  /** Entity type identifier (e.g., 'character', 'scene', 'location') */
  type: string

  /** Display name for the entity type */
  displayName: string

  /** Description of the entity type */
  description: string

  /** Fields that must be present in the input data */
  requiredFields: string[]

  /** Optional fields that can be present */
  optionalFields?: string[]

  /** Sources to gather context from */
  contextSources: ContextSource[]

  /** Metadata field configurations */
  metadataFields: MetadataFieldConfig[]

  /** Relationship type configurations */
  relationshipTypes: RelationshipTypeConfig[]

  /** Validation rules for this entity type */
  validationRules: ValidationRule[]

  /** Data enrichment strategy */
  enrichmentStrategy: EnrichmentStrategy

  /** LLM prompt configuration */
  llmPromptConfig?: LLMPromptConfig

  /** Feature flags for this entity type */
  features?: EntityFeatures

  /** Custom processing hooks */
  hooks?: EntityHooks
}

/**
 * Metadata field configuration
 * Defines how metadata fields should be generated
 */
export interface MetadataFieldConfig {
  /** Field name */
  name: string

  /** Field data type */
  type: MetadataFieldType

  /** Human-readable description */
  description: string

  /** Whether this field is required */
  required: boolean

  /** Default value if not generated */
  defaultValue?: any

  /** Validation rules specific to this field */
  validation?: FieldValidation

  /** LLM generation prompt for this field */
  llmPrompt?: string

  /** Whether to use LLM for generation */
  useLLM: boolean

  /** Whether this field can have multiple values */
  isArray?: boolean

  /** Enum values if type is 'enum' */
  enumValues?: string[]

  /** Min/max constraints for numeric fields */
  constraints?: FieldConstraints

  /** Example values for LLM guidance */
  examples?: any[]

  /** Whether this field should be indexed for search */
  searchable?: boolean

  /** Custom transformation function name */
  transform?: string
}

/**
 * Metadata field types
 */
export type MetadataFieldType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'array'
  | 'object'
  | 'enum'
  | 'date'
  | 'json'

/**
 * Field validation configuration
 */
export interface FieldValidation {
  /** Minimum length for strings */
  minLength?: number

  /** Maximum length for strings */
  maxLength?: number

  /** Regular expression pattern */
  pattern?: string

  /** Custom validation function name */
  customValidator?: string

  /** Error message for validation failure */
  errorMessage?: string
}

/**
 * Field constraints for numeric/date fields
 */
export interface FieldConstraints {
  /** Minimum value */
  min?: number

  /** Maximum value */
  max?: number

  /** Must be one of these values */
  oneOf?: any[]

  /** Must match this format */
  format?: string
}

/**
 * Relationship type configuration
 */
export interface RelationshipTypeConfig {
  /** Relationship type identifier */
  type: string

  /** Display name */
  displayName: string

  /** Description of this relationship type */
  description: string

  /** Target entity types this relationship can point to */
  targetTypes: string[]

  /** Whether this relationship should be auto-discovered */
  autoDiscover: boolean

  /** Whether this relationship is bidirectional */
  bidirectional: boolean

  /** Inverse relationship type (for bidirectional) */
  inverseType?: string

  /** Confidence threshold for auto-discovery (0-1) */
  confidenceThreshold?: number

  /** Properties that can be attached to this relationship */
  properties?: RelationshipPropertyConfig[]

  /** LLM prompt for discovering this relationship */
  discoveryPrompt?: string

  /** Maximum number of relationships of this type */
  maxCount?: number

  /** Whether this relationship is required */
  required?: boolean

  /** Validation rules for this relationship */
  validation?: RelationshipValidation
}

/**
 * Relationship property configuration
 */
export interface RelationshipPropertyConfig {
  /** Property name */
  name: string

  /** Property type */
  type: MetadataFieldType

  /** Description */
  description: string

  /** Whether this property is required */
  required: boolean

  /** Default value */
  defaultValue?: any
}

/**
 * Relationship validation rules
 */
export interface RelationshipValidation {
  /** Must have at least this many relationships */
  minCount?: number

  /** Can have at most this many relationships */
  maxCount?: number

  /** Target must exist in the system */
  validateTargetExists?: boolean

  /** Prevent circular relationships */
  preventCircular?: boolean

  /** Custom validation function name */
  customValidator?: string
}

/**
 * Validation rule definition
 */
export interface ValidationRule {
  /** Rule identifier */
  id: string

  /** Field to validate (or '*' for entity-level) */
  field: string

  /** Rule type */
  type: ValidationRuleType

  /** Rule value/configuration */
  value?: any

  /** Error message if validation fails */
  message: string

  /** Warning message if validation passes with concerns */
  warningMessage?: string

  /** Severity level */
  severity: 'error' | 'warning' | 'info'

  /** Whether to block processing on failure */
  blocking?: boolean

  /** Custom validator function name */
  customValidator?: string

  /** Condition for when this rule applies */
  condition?: ValidationCondition
}

/**
 * Validation rule types
 */
export type ValidationRuleType =
  | 'required'
  | 'minLength'
  | 'maxLength'
  | 'pattern'
  | 'min'
  | 'max'
  | 'enum'
  | 'custom'
  | 'dependency'
  | 'uniqueness'
  | 'format'

/**
 * Validation condition
 */
export interface ValidationCondition {
  /** Field to check */
  field: string

  /** Operator */
  operator: 'equals' | 'notEquals' | 'contains' | 'exists' | 'notExists'

  /** Value to compare against */
  value?: any
}

/**
 * Context sources for gathering information
 */
export type ContextSource = 'payload' | 'brain' | 'opendb' | 'project' | 'external'

/**
 * Enrichment strategy configuration
 */
export interface EnrichmentStrategy {
  /** Strategy level */
  level: 'minimal' | 'standard' | 'comprehensive' | 'custom'

  /** Whether to use LLM for enrichment */
  useLLM: boolean

  /** Context gathering configuration */
  contextGathering: ContextGatheringConfig

  /** Relationship discovery configuration */
  relationshipDiscovery: RelationshipDiscoveryConfig

  /** Metadata generation configuration */
  metadataGeneration: MetadataGenerationConfig

  /** Quality thresholds */
  qualityThresholds?: QualityThresholds
}

/**
 * Context gathering configuration
 */
export interface ContextGatheringConfig {
  /** Which sources to gather from */
  sources: ContextSource[]

  /** Maximum items to fetch per source */
  maxItemsPerSource: number

  /** Whether to include similar content */
  includeSimilar: boolean

  /** Similarity threshold (0-1) */
  similarityThreshold?: number

  /** Whether to cache context */
  useCache: boolean

  /** Cache TTL in seconds */
  cacheTTL?: number
}

/**
 * Relationship discovery configuration
 */
export interface RelationshipDiscoveryConfig {
  /** Whether to discover relationships */
  enabled: boolean

  /** Which relationship types to discover */
  discoverTypes: string[]

  /** Confidence threshold for auto-creation (0-1) */
  confidenceThreshold: number

  /** Maximum relationships to discover */
  maxRelationships: number

  /** Whether to use LLM for discovery */
  useLLM: boolean

  /** Whether to validate discovered relationships */
  validateDiscovered: boolean
}

/**
 * Metadata generation configuration
 */
export interface MetadataGenerationConfig {
  /** Which fields to generate */
  fields: string[]

  /** Whether to use LLM */
  useLLM: boolean

  /** LLM model to use */
  llmModel?: string

  /** LLM temperature */
  temperature?: number

  /** Maximum tokens for LLM response */
  maxTokens?: number

  /** Whether to include examples in prompt */
  includeExamples: boolean

  /** Number of examples to include */
  exampleCount?: number
}

/**
 * Quality thresholds
 */
export interface QualityThresholds {
  /** Minimum metadata completeness (0-1) */
  minMetadataCompleteness?: number

  /** Minimum relationship confidence (0-1) */
  minRelationshipConfidence?: number

  /** Minimum overall quality score (0-100) */
  minQualityScore?: number

  /** Whether to block low-quality data */
  blockLowQuality?: boolean
}

/**
 * LLM prompt configuration
 */
export interface LLMPromptConfig {
  /** System prompt for this entity type */
  systemPrompt: string

  /** Template for metadata generation prompt */
  metadataPromptTemplate: string

  /** Template for relationship discovery prompt */
  relationshipPromptTemplate?: string

  /** Template variables */
  templateVariables?: string[]

  /** Example inputs/outputs */
  examples?: LLMExample[]

  /** Additional instructions */
  instructions?: string[]
}

/**
 * LLM example
 */
export interface LLMExample {
  /** Example input */
  input: any

  /** Expected output */
  output: any

  /** Description of the example */
  description?: string
}

/**
 * Entity feature flags
 */
export interface EntityFeatures {
  /** Enable caching for this entity type */
  enableCaching?: boolean

  /** Enable async processing */
  enableAsync?: boolean

  /** Enable validation */
  enableValidation?: boolean

  /** Enable relationship discovery */
  enableRelationshipDiscovery?: boolean

  /** Enable quality scoring */
  enableQualityScoring?: boolean

  /** Enable audit logging */
  enableAuditLog?: boolean
}

/**
 * Entity processing hooks
 */
export interface EntityHooks {
  /** Called before processing starts */
  beforeProcess?: string

  /** Called after context gathering */
  afterContextGather?: string

  /** Called after metadata generation */
  afterMetadataGeneration?: string

  /** Called after relationship discovery */
  afterRelationshipDiscovery?: string

  /** Called after validation */
  afterValidation?: string

  /** Called after processing completes */
  afterProcess?: string

  /** Called on error */
  onError?: string
}

/**
 * Complete configuration schema
 */
export interface ConfigurationSchema {
  /** Schema version */
  version: string

  /** Configuration name */
  name: string

  /** Configuration description */
  description: string

  /** Entity configurations */
  entities: Record<string, EntityConfig>

  /** Global settings */
  global: GlobalConfig

  /** Custom validators */
  customValidators?: Record<string, CustomValidator>

  /** Custom transformers */
  customTransformers?: Record<string, CustomTransformer>

  /** Metadata */
  metadata?: ConfigurationMetadata
}

/**
 * Global configuration
 */
export interface GlobalConfig {
  /** Default enrichment strategy */
  defaultEnrichmentStrategy: EnrichmentStrategy

  /** Default context sources */
  defaultContextSources: ContextSource[]

  /** Default validation rules */
  defaultValidationRules: ValidationRule[]

  /** Default LLM configuration */
  defaultLLMConfig: LLMPromptConfig

  /** Cache settings */
  cache: CacheConfig

  /** Performance settings */
  performance: PerformanceConfig

  /** Feature flags */
  features: GlobalFeatures
}

/**
 * Cache configuration
 */
export interface CacheConfig {
  /** Enable caching globally */
  enabled: boolean

  /** Default TTL for entity cache */
  entityTTL: number

  /** Default TTL for context cache */
  contextTTL: number

  /** Default TTL for metadata cache */
  metadataTTL: number

  /** Cache strategy */
  strategy: 'memory' | 'redis' | 'hybrid'
}

/**
 * Performance configuration
 */
export interface PerformanceConfig {
  /** Maximum concurrent operations */
  maxConcurrency: number

  /** Request timeout in ms */
  requestTimeout: number

  /** Maximum retries */
  maxRetries: number

  /** Retry delay in ms */
  retryDelay: number

  /** Batch size for bulk operations */
  batchSize: number
}

/**
 * Global feature flags
 */
export interface GlobalFeatures {
  /** Enable debug logging */
  enableDebugLogging?: boolean

  /** Enable performance tracking */
  enablePerformanceTracking?: boolean

  /** Enable metrics collection */
  enableMetrics?: boolean

  /** Enable audit trail */
  enableAuditTrail?: boolean

  /** Enable error reporting */
  enableErrorReporting?: boolean
}

/**
 * Custom validator function definition
 */
export interface CustomValidator {
  /** Validator name */
  name: string

  /** Description */
  description: string

  /** Function implementation */
  fn: (value: any, context: any) => boolean | Promise<boolean>

  /** Error message template */
  errorMessage: string
}

/**
 * Custom transformer function definition
 */
export interface CustomTransformer {
  /** Transformer name */
  name: string

  /** Description */
  description: string

  /** Function implementation */
  fn: (value: any, context: any) => any | Promise<any>
}

/**
 * Configuration metadata
 */
export interface ConfigurationMetadata {
  /** Author */
  author?: string

  /** Creation date */
  createdAt?: string

  /** Last modified date */
  updatedAt?: string

  /** Tags */
  tags?: string[]

  /** Custom metadata */
  [key: string]: any
}

/**
 * Configuration validation result
 */
export interface ConfigValidationResult {
  /** Whether the configuration is valid */
  valid: boolean

  /** Validation errors */
  errors: ConfigValidationError[]

  /** Validation warnings */
  warnings: ConfigValidationWarning[]

  /** Suggestions for improvement */
  suggestions?: string[]
}

/**
 * Configuration validation error
 */
export interface ConfigValidationError {
  /** Error path in configuration */
  path: string

  /** Error message */
  message: string

  /** Error code */
  code: string

  /** Severity */
  severity: 'error' | 'critical'
}

/**
 * Configuration validation warning
 */
export interface ConfigValidationWarning {
  /** Warning path in configuration */
  path: string

  /** Warning message */
  message: string

  /** Warning code */
  code: string
}

/**
 * Configuration override options
 */
export interface ConfigOverrides {
  /** Entity-specific overrides */
  entities?: Partial<Record<string, Partial<EntityConfig>>>

  /** Global overrides */
  global?: Partial<GlobalConfig>

  /** Feature flag overrides */
  features?: Partial<GlobalFeatures>
}

/**
 * Configuration load options
 */
export interface ConfigLoadOptions {
  /** Configuration source */
  source?: 'file' | 'database' | 'memory' | 'default'

  /** Configuration path (for file source) */
  path?: string

  /** Configuration overrides */
  overrides?: ConfigOverrides

  /** Whether to validate on load */
  validate?: boolean

  /** Whether to use cache */
  useCache?: boolean
}

/**
 * Entity rule (for backwards compatibility)
 */
export interface EntityRule {
  type: string
  requiredFields: string[]
  contextSources: ContextSource[]
  metadataTemplate?: {
    fields: string[]
    llmPrompt: string
    examples?: any[]
  }
  relationshipRules: Array<{
    type: string
    targetType: string
    auto: boolean
    bidirectional?: boolean
    properties?: Record<string, any>
  }>
  enrichmentStrategy: 'minimal' | 'standard' | 'comprehensive'
  validationRules?: Array<{
    field: string
    rule: string
    value?: any
    message: string
  }>
}
