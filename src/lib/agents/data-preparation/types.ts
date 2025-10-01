/**
 * Data Preparation Agent - Type Definitions
 */

export interface PrepareOptions {
  projectId: string
  entityType: string
  sourceCollection?: string
  sourceId?: string
  async?: boolean
  skipCache?: boolean
  customRules?: EntityRule
  userId?: string
  createdByType?: 'user' | 'agent'
}

export interface BrainDocument {
  id: string
  type: string
  project_id: string
  text: string
  metadata: Record<string, any>
  relationships: Relationship[]
}

export interface Relationship {
  type: string
  target: string
  targetType?: string
  properties?: Record<string, any>
  confidence?: number
  reasoning?: string
}

export interface Context {
  project: ProjectContext
  payload: PayloadContext
  brain: BrainContext
  opendb: OpenDBContext
  related: RelatedEntities
}

export interface ProjectContext {
  id: string
  name: string
  slug: string
  type?: 'movie' | 'series'
  genre?: string[]
  tone?: string
  themes?: string[]
  targetAudience?: string
  phase?: 'expansion' | 'compacting' | 'complete'
  status?: 'active' | 'paused' | 'archived' | 'complete'
}

export interface PayloadContext {
  characters: any[]
  scenes: any[]
  locations: any[]
  episodes: any[]
  concepts: any[]
}

export interface BrainContext {
  existingEntities: any[]
  totalCount: number
  relatedNodes: any[]
  similarContent: any[]
}

export interface OpenDBContext {
  collections: string[]
  stats: Record<string, { count: number }>
  recentDocuments?: any[]
}

export interface RelatedEntities {
  characters: string[]
  scenes: string[]
  locations: string[]
  concepts: string[]
  episodes: string[]
}

export interface MetadataSchema {
  fields: Record<string, {
    type: string
    description: string
    required: boolean
  }>
  purpose: string
}

export interface GeneratedMetadata {
  [key: string]: any
  summary?: string
  relationshipSuggestions?: RelationshipSuggestion[]
  generatedAt: string
  confidence?: number
}

export interface RelationshipSuggestion {
  type: string
  target: string
  targetType: string
  properties?: Record<string, any>
  confidence: number
  reasoning: string
}

export interface EntityRule {
  type: string
  requiredFields: string[]
  contextSources: ContextSource[]
  metadataTemplate?: MetadataTemplate
  relationshipRules: RelationshipRule[]
  enrichmentStrategy: 'minimal' | 'standard' | 'comprehensive'
  validationRules?: ValidationRule[]
}

export type ContextSource = 'payload' | 'brain' | 'opendb' | 'project'

export interface MetadataTemplate {
  fields: string[]
  llmPrompt: string
  examples?: any[]
}

export interface RelationshipRule {
  type: string
  targetType: string
  auto: boolean
  bidirectional?: boolean
  properties?: Record<string, any>
}

export interface ValidationRule {
  field: string
  rule: 'required' | 'minLength' | 'maxLength' | 'pattern' | 'custom'
  value?: any
  message: string
}

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

export interface AgentConfig {
  llm: {
    apiKey: string
    baseUrl: string
    defaultModel: string
    backupModel?: string
  }
  brain: {
    apiUrl: string
    apiKey: string
  }
  redis: {
    url: string
  }
  cache: {
    projectContextTTL: number
    documentTTL: number
    entityTTL: number
  }
  queue: {
    concurrency: number
    maxRetries: number
  }
  features: {
    enableCaching: boolean
    enableQueue: boolean
    enableValidation: boolean
    enableRelationshipDiscovery: boolean
  }
}

export interface EnrichedData {
  original: any
  enriched: Record<string, any>
  relatedEntities: any[]
  contextSummary: string
  qualityScore?: number
}

export interface ProcessingMetrics {
  duration: number
  projectId: string
  entityType: string
  metadataFields: number
  relationships: number
  tokensUsed?: number
  cacheHit?: boolean
  errors?: string[]
}

export interface CacheEntry<T = any> {
  data: T
  timestamp: number
  ttl: number
}

export interface QueueJob {
  id: string
  type: 'prepare-data' | 'prepare-batch'
  data: any
  options: PrepareOptions
  status: 'pending' | 'processing' | 'completed' | 'failed'
  attempts: number
  error?: string
  createdAt: Date
  updatedAt: Date
}

// Entity-specific types

export interface CharacterMetadata {
  characterType?: 'protagonist' | 'antagonist' | 'supporting' | 'minor'
  role?: string
  archetypePattern?: string
  visualSignature?: string
  personalityTraits?: string[]
  storyFunction?: string
  thematicConnection?: string
  sceneAppearances?: number[]
  relationshipDynamics?: Record<string, string>
  narrativeArc?: string
  emotionalJourney?: string
}

export interface SceneMetadata {
  sceneType?: 'action' | 'dialogue' | 'exposition' | 'transition'
  narrativeFunction?: string
  emotionalTone?: string
  plotSignificance?: 'low' | 'medium' | 'high'
  characterDevelopment?: Record<string, string>
  thematicElements?: string[]
  continuityNotes?: string
  visualStyle?: string
  pacing?: 'slow' | 'medium' | 'fast'
}

export interface LocationMetadata {
  locationType?: 'interior' | 'exterior' | 'mixed'
  atmosphere?: string
  significance?: 'low' | 'medium' | 'high'
  timeOfDay?: string
  weather?: string
  soundscape?: string
  visualElements?: string[]
  sceneCount?: number
}

export interface EpisodeMetadata {
  episodeType?: 'pilot' | 'regular' | 'finale' | 'special'
  narrativeArc?: string
  thematicFocus?: string[]
  characterFocus?: string[]
  plotThreads?: string[]
  cliffhanger?: boolean
  emotionalTone?: string
}

