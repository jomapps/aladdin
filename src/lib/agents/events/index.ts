/**
 * Real-time Event Streaming Module
 *
 * Barrel export for all event streaming components.
 * Provides centralized access to event types, emitters, and utilities.
 *
 * @module @/lib/agents/events
 * @see {@link /docs/architecture/dynamic-agents-architecture.md} Section 5: Real-time Event Streaming
 */

// Type exports
export type {
  BaseAgentEvent,
  OrchestrationStartEvent,
  OrchestrationCompleteEvent,
  DepartmentStartEvent,
  DepartmentCompleteEvent,
  AgentStartEvent,
  AgentThinkingEvent,
  AgentCompleteEvent,
  ToolCallEvent,
  ToolResultEvent,
  QualityCheckEvent,
  ReviewStatusEvent,
  ErrorEvent,
  AgentEvent,
  WebSocketMessage,
  ClientSubscription,
  EventEmissionOptions,
  EventHandler,
  EventFilter,
} from './types'

// Event emitter exports
export { AgentEventEmitter, getEventEmitter } from './emitter'

// WebSocket server exports
export {
  AgentWebSocketServer,
  getWebSocketServer,
  startWebSocketServer,
  stopWebSocketServer,
} from './websocket-server'
export type { WebSocketServerConfig } from './websocket-server'

// Client manager exports
export { ClientManager } from './client-manager'
export type { ClientManagerConfig } from './client-manager'

// Event persistence exports
export {
  initializeEventPersistence,
  persistEvent,
  persistEventBatch,
  getExecutionEvents,
  getExecutionEventsByType,
  countExecutionEvents,
  getLatestEvents,
  clearExecutionEvents,
  getEventStatistics,
} from './event-persistence'
