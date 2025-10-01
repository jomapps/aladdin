/**
 * Real-time Event Streaming Types
 *
 * Defines all event types for the Aladdin Dynamic Agents system.
 * These events are emitted during agent execution and streamed to clients via WebSocket.
 *
 * @see {@link /docs/architecture/dynamic-agents-architecture.md} Section 5: Real-time Event Streaming
 */

/**
 * Base event interface - all events extend from this
 */
export interface BaseAgentEvent {
  type: string
  executionId: string
  timestamp: Date
  conversationId?: string
}

/**
 * Orchestration start event - fired when master orchestrator begins processing
 */
export interface OrchestrationStartEvent extends BaseAgentEvent {
  type: 'orchestration-start'
  context: {
    projectId: string
    episodeId?: string
    userPrompt: string
    complexity: 'low' | 'medium' | 'high'
  }
}

/**
 * Orchestration complete event - fired when all departments finish
 */
export interface OrchestrationCompleteEvent extends BaseAgentEvent {
  type: 'orchestration-complete'
  result: {
    departments: string[]
    overallQuality: number
    consistency: number
    recommendation: 'ingest' | 'review' | 'reject'
  }
  metrics: {
    totalTime: number
    tokensUsed: number
    agentsSpawned: number
    departmentsInvolved: number
  }
}

/**
 * Department start event - fired when department head begins assessment
 */
export interface DepartmentStartEvent extends BaseAgentEvent {
  type: 'department-start'
  department: string
  departmentName: string
  agentId: string
  relevance: number
  estimatedTime?: number
}

/**
 * Department complete event - fired when department finishes all work
 */
export interface DepartmentCompleteEvent extends BaseAgentEvent {
  type: 'department-complete'
  department: string
  departmentName: string
  outputs: unknown[]
  qualityScore: number
  executionTime: number
  specialistsUsed: number
}

/**
 * Agent start event - fired when any agent begins execution
 */
export interface AgentStartEvent extends BaseAgentEvent {
  type: 'agent-start'
  agentId: string
  agentName: string
  department: string
  task: string
  isDepartmentHead: boolean
}

/**
 * Agent thinking event - fired periodically during agent execution
 */
export interface AgentThinkingEvent extends BaseAgentEvent {
  type: 'agent-thinking'
  agentId: string
  agentName: string
  currentStep: string
  progress?: number // 0-1
  thoughtProcess?: string
}

/**
 * Agent complete event - fired when agent finishes execution
 */
export interface AgentCompleteEvent extends BaseAgentEvent {
  type: 'agent-complete'
  agentId: string
  agentName: string
  department: string
  output: unknown
  qualityScore: number
  executionTime: number
  tokenUsage?: {
    inputTokens: number
    outputTokens: number
    totalTokens: number
  }
}

/**
 * Tool call event - fired when agent invokes a tool
 */
export interface ToolCallEvent extends BaseAgentEvent {
  type: 'tool-call'
  agentId: string
  toolName: string
  input: unknown
  startTime: Date
}

/**
 * Tool result event - fired when tool execution completes
 */
export interface ToolResultEvent extends BaseAgentEvent {
  type: 'tool-result'
  agentId: string
  toolName: string
  output: unknown
  success: boolean
  executionTime: number
  error?: string
}

/**
 * Quality check event - fired during quality validation
 */
export interface QualityCheckEvent extends BaseAgentEvent {
  type: 'quality-check'
  stage: 'specialist' | 'department' | 'orchestrator'
  department?: string
  scores: {
    quality?: number
    relevance?: number
    consistency?: number
    completeness?: number
    creativity?: number
    technical?: number
    overall: number
  }
  threshold: number
  passed: boolean
  issues?: string[]
  suggestions?: string[]
}

/**
 * Review status event - fired when department head reviews specialist work
 */
export interface ReviewStatusEvent extends BaseAgentEvent {
  type: 'review-status'
  department: string
  reviewedBy: string
  specialistId: string
  decision: 'approved' | 'rejected' | 'revision-needed'
  scores: {
    quality: number
    relevance: number
    consistency: number
    overall: number
  }
  feedback?: string
  suggestedImprovements?: string[]
}

/**
 * Error event - fired when an error occurs during execution
 */
export interface ErrorEvent extends BaseAgentEvent {
  type: 'error'
  agentId?: string
  department?: string
  error: {
    message: string
    code?: string
    stack?: string
    recoverable: boolean
  }
  context?: unknown
}

/**
 * Union type of all possible agent events
 */
export type AgentEvent =
  | OrchestrationStartEvent
  | OrchestrationCompleteEvent
  | DepartmentStartEvent
  | DepartmentCompleteEvent
  | AgentStartEvent
  | AgentThinkingEvent
  | AgentCompleteEvent
  | ToolCallEvent
  | ToolResultEvent
  | QualityCheckEvent
  | ReviewStatusEvent
  | ErrorEvent

/**
 * WebSocket message types for client-server communication
 */
export interface WebSocketMessage {
  type: 'subscribe' | 'unsubscribe' | 'ping' | 'pong' | 'event'
  executionId?: string
  conversationId?: string
  event?: AgentEvent
  timestamp?: Date
}

/**
 * Client subscription information
 */
export interface ClientSubscription {
  clientId: string
  executionId?: string
  conversationId?: string
  connectedAt: Date
  lastPing?: Date
}

/**
 * Event emission options
 */
export interface EventEmissionOptions {
  /** Persist event to database */
  persist?: boolean
  /** Broadcast to all connected clients */
  broadcast?: boolean
  /** Target specific execution ID */
  executionId?: string
  /** Target specific conversation ID */
  conversationId?: string
}

/**
 * Event handler callback type
 */
export type EventHandler = (event: AgentEvent) => void | Promise<void>

/**
 * Event filter function type
 */
export type EventFilter = (event: AgentEvent) => boolean
