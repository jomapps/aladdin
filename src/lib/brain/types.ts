/**
 * Phase 3: Brain Service Type Definitions
 * TypeScript types for Brain API operations and data structures
 */

export interface BrainConfig {
  apiUrl: string
  apiKey: string
  jinaApiKey?: string
  neo4jUri?: string
  neo4jUser?: string
  neo4jPassword?: string
  redisUrl?: string
}

export interface EmbeddingVector {
  vector: number[]
  dimensions: number
  model: string
}

export interface BrainNode {
  id: string
  type: 'character' | 'scene' | 'location' | 'dialogue' | 'project' | 'concept'
  properties: Record<string, any>
  embedding?: EmbeddingVector
  createdAt: Date
  updatedAt: Date
}

export interface BrainRelationship {
  id: string
  type: string
  fromNodeId: string
  toNodeId: string
  properties?: Record<string, any>
  weight?: number
  createdAt: Date
}

export interface ValidationResult {
  valid: boolean
  qualityScore: number
  coherenceScore: number
  creativityScore: number
  completenessScore: number
  contradictions: Contradiction[]
  suggestions: string[]
  metadata?: Record<string, any>
}

export interface Contradiction {
  type: 'direct' | 'semantic' | 'temporal' | 'logical'
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  conflictingNodes: string[]
  suggestedResolution?: string
}

export interface SemanticSearchQuery {
  query: string
  embedding?: number[]
  types?: string[]
  limit?: number
  threshold?: number
  filters?: Record<string, any>
}

export interface SemanticSearchResult {
  node: BrainNode
  score: number
  distance: number
  explanation?: string
}

export interface BrainValidationRequest {
  content: any
  type: string
  projectId: string
  context?: {
    existingNodes?: string[]
    relatedContent?: any[]
  }
}

export interface QualityScoring {
  coherence: number       // 0-1: Internal consistency
  creativity: number      // 0-1: Originality and uniqueness
  completeness: number    // 0-1: All required fields present
  consistency: number     // 0-1: Matches existing content
  overall: number         // Weighted average
}

export interface BrainSyncTask {
  id: string
  type: 'validate' | 'embed' | 'index' | 'sync'
  entityType: string
  entityId: string
  projectId: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  priority: number
  retryCount?: number
  error?: string
  createdAt: Date
  processedAt?: Date
}

export interface ChangeStreamEvent {
  operationType: 'insert' | 'update' | 'delete' | 'replace'
  documentKey: { _id: any }
  fullDocument?: any
  updateDescription?: {
    updatedFields: Record<string, any>
    removedFields: string[]
  }
  ns: {
    db: string
    coll: string
  }
}

export interface Neo4jQueryResult<T = any> {
  records: T[]
  summary: {
    queryType: string
    counters: Record<string, number>
  }
}

export interface BrainClientOptions {
  timeout?: number
  retries?: number
  retryDelay?: number
  validateResponses?: boolean
}

export interface AddNodeRequest {
  type: string
  properties: Record<string, any>
  embedding?: number[]
  generateEmbedding?: boolean
}

export interface AddRelationshipRequest {
  fromNodeId: string
  toNodeId: string
  type: string
  properties?: Record<string, any>
  weight?: number
}

export interface UpdateNodeRequest {
  nodeId: string
  properties: Record<string, any>
  updateEmbedding?: boolean
}

export interface DeleteNodeRequest {
  nodeId: string
  cascade?: boolean
}

export interface GraphTraversalQuery {
  startNodeId: string
  relationshipTypes?: string[]
  maxDepth?: number
  direction?: 'incoming' | 'outgoing' | 'both'
  nodeFilters?: Record<string, any>
}

export interface GraphTraversalResult {
  paths: Array<{
    nodes: BrainNode[]
    relationships: BrainRelationship[]
    length: number
  }>
  totalPaths: number
}
