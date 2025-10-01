/**
 * Orchestrator API Type Definitions
 * Shared types for all orchestrator mode APIs
 */

import { z } from 'zod'

// ============================================================================
// ORCHESTRATOR MODES
// ============================================================================

export type OrchestratorMode = 'query' | 'data' | 'task' | 'chat'

// ============================================================================
// REQUEST SCHEMAS (Zod)
// ============================================================================

export const QueryRequestSchema = z.object({
  query: z.string().min(1, 'Query is required'),
  projectId: z.string().optional(),
  conversationId: z.string().optional(),
  collections: z.array(z.string()).optional(),
  limit: z.number().min(1).max(100).default(10),
  includeRelationships: z.boolean().default(true),
})

export const DataIngestionRequestSchema = z.object({
  data: z.any(),
  projectId: z.string().min(1, 'Project ID is required'),
  entityType: z.string().min(1, 'Entity type is required'),
  sourceCollection: z.string().optional(),
  sourceId: z.string().optional(),
  autoConfirm: z.boolean().default(false),
  skipValidation: z.boolean().default(false),
})

export const TaskExecutionRequestSchema = z.object({
  task: z.string().min(1, 'Task description is required'),
  projectId: z.string().min(1, 'Project ID is required'),
  conversationId: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  departments: z.array(z.string()).optional(),
  context: z.any().optional(),
})

export const ChatRequestSchema = z.object({
  message: z.string().min(1, 'Message is required'),
  conversationId: z.string().optional(),
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  stream: z.boolean().default(false),
})

// ============================================================================
// REQUEST TYPES (TypeScript)
// ============================================================================

export type QueryRequest = z.infer<typeof QueryRequestSchema>
export type DataIngestionRequest = z.infer<typeof DataIngestionRequestSchema>
export type TaskExecutionRequest = z.infer<typeof TaskExecutionRequestSchema>
export type ChatRequest = z.infer<typeof ChatRequestSchema>

// ============================================================================
// RESPONSE TYPES
// ============================================================================

export interface QueryResponse {
  answer: string
  sources: QuerySource[]
  relatedNodes: RelatedNode[]
  confidence: number
  suggestions: string[]
  conversationId?: string
  metadata: {
    tokensUsed: number
    processingTime: number
    searchTime: number
  }
}

export interface QuerySource {
  id: string
  type: string
  content: string
  score: number
  metadata: Record<string, any>
}

export interface RelatedNode {
  id: string
  type: string
  name: string
  relationship: string
  score: number
}

export interface DataIngestionResponse {
  status: 'pending_confirmation' | 'confirmed' | 'rejected'
  suggestedData: {
    entityType: string
    parsed: any
    metadata: Record<string, any>
    relationships: DataRelationship[]
  }
  validation: {
    valid: boolean
    errors: string[]
    warnings: string[]
    suggestions: string[]
  }
  duplicates: DuplicateCheck[]
  preview: {
    category: string
    confidence: number
    requiredFields: RequiredField[]
  }
  confirmationRequired: boolean
  brainDocumentId?: string
}

export interface DataRelationship {
  type: string
  target: string
  targetType: string
  confidence: number
  reasoning: string
  properties?: Record<string, any>
}

export interface DuplicateCheck {
  existingId: string
  similarity: number
  existingData: any
  suggestion: 'merge' | 'skip' | 'create_new'
}

export interface RequiredField {
  name: string
  type: string
  description: string
  value: any
  status: 'complete' | 'incomplete' | 'needs_review'
}

export interface TaskExecutionResponse {
  taskId: string
  status: 'queued' | 'in_progress' | 'completed' | 'failed'
  departments: DepartmentStatus[]
  progress: {
    current: number
    total: number
    percentage: number
  }
  results?: TaskResult[]
  quality: {
    overall: number
    consistency: number
    completeness: number
  }
  recommendation?: 'approve' | 'modify' | 'reject'
  estimatedCompletion?: Date
  websocketUrl?: string
}

export interface DepartmentStatus {
  department: string
  status: 'pending' | 'in_progress' | 'complete' | 'failed'
  relevance: number
  outputs: SpecialistOutput[]
  quality: number
  issues: string[]
  suggestions: string[]
}

export interface SpecialistOutput {
  agentId: string
  agentName: string
  output: any
  qualityScore: number
  issues: string[]
  suggestions: string[]
  decision: 'approve' | 'modify' | 'reject' | 'pending'
}

export interface TaskResult {
  type: string
  data: any
  quality: number
  brainDocumentId?: string
}

export interface ChatResponse {
  message: string
  conversationId: string
  model: string
  usage: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  suggestions?: string[]
}

// ============================================================================
// STREAMING TYPES
// ============================================================================

export type StreamEvent =
  | TokenStreamEvent
  | ProgressStreamEvent
  | ErrorStreamEvent
  | CompleteStreamEvent

export interface TokenStreamEvent {
  type: 'token'
  token: string
  index: number
}

export interface ProgressStreamEvent {
  type: 'progress'
  stage: string
  current: number
  total: number
  message: string
}

export interface ErrorStreamEvent {
  type: 'error'
  error: string
  code?: string
}

export interface CompleteStreamEvent {
  type: 'complete'
  data: any
}

// ============================================================================
// CONVERSATION TYPES
// ============================================================================

export interface ConversationMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  mode: OrchestratorMode
  metadata?: Record<string, any>
  createdAt: Date
}

export interface Conversation {
  id: string
  projectId?: string
  userId: string
  messages: ConversationMessage[]
  status: 'active' | 'archived'
  createdAt: Date
  updatedAt: Date
}

// ============================================================================
// WEBSOCKET MESSAGE TYPES
// ============================================================================

export interface WebSocketMessage {
  event: 'task_progress' | 'task_complete' | 'task_error' | 'agent_update'
  taskId: string
  data: any
  timestamp: Date
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export interface APIError {
  error: string
  code: string
  details?: any
  statusCode: number
}

// ============================================================================
// SHARED TYPES
// ============================================================================

export interface User {
  id: string
  email: string
  name: string
}
