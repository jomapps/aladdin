/**
 * Orchestrator UI - Complete Export Index
 *
 * Central export point for all Orchestrator UI state management,
 * real-time features, and utilities.
 */

// ========== REACT QUERY ==========
export {
  queryClient,
  createQueryClient,
  queryKeys,
  invalidateQueries,
  QueryProvider,

  // Queries
  useProjects,
  useProject,
  useProjectActivity,
  useProjectTeam,
  useEpisodes,
  useEpisode,
  useCharacters,
  useCharacter,
  useScenes,
  useScene,
  useConversations,
  useConversation,
  useExecutions,
  useExecution,
  useExecutionEvents,
  useOrchestratorStatus,
  useOrchestratorHealth,

  // Mutations
  useSendMessage,
  useCreateConversation,
  useDeleteConversation,
  useUpdateExecution,
} from '@/lib/react-query'

// Types
export type {
  Project,
  ProjectListResponse,
  ProjectActivity,
  Episode,
  EpisodeListResponse,
  Character,
  CharacterListResponse,
  Scene,
  SceneListResponse,
  Conversation,
  ConversationMessage,
  ConversationListResponse,
  AgentExecution,
  ExecutionListResponse,
  OrchestratorStatus,
  SendMessageInput,
  SendMessageResponse,
  CreateConversationInput,
  CreateConversationResponse,
  DeleteConversationInput,
  UpdateExecutionInput,
} from '@/lib/react-query'

// ========== WEBSOCKET ==========
export {
  WebSocketProvider,
  useWebSocketContext,
  useWebSocket,
  useRealtimeUpdates,
  useOrchestratorEvents,
  useOrchestratorEvent,
} from '@/providers'

export type { ConnectionState } from '@/providers'

// ========== PROJECT CONTEXT ==========
export {
  ProjectProvider,
  useProjectContext,
  useProject,
  useProjectData,
} from '@/contexts'

// ========== CUSTOM HOOKS ==========
export { useOptimisticUpdate } from '@/hooks/useOptimisticUpdate'
export { useInfiniteScroll } from '@/hooks/useInfiniteScroll'
export { useDebounce, useDebouncedCallback } from '@/hooks/useDebounce'
export { useKeyboardShortcut, useKeyboardShortcuts } from '@/hooks/useKeyboardShortcut'
export { useLocalStorage } from '@/hooks/useLocalStorage'

// ========== ERROR COMPONENTS ==========
export {
  ErrorBoundary,
  ErrorBoundaryWrapper,
  ErrorFallback,
  MinimalErrorFallback,
  NotFound,
  ResourceNotFound,
} from '@/components/errors'

/**
 * Re-export WebSocket event types from agents
 */
export type {
  AgentEvent,
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
  WebSocketMessage,
  ClientSubscription,
  EventEmissionOptions,
  EventHandler,
  EventFilter,
} from '@/lib/agents/events/types'
