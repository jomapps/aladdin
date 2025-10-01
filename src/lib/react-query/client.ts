/**
 * React Query Client Configuration
 *
 * Central configuration for @tanstack/react-query with optimized defaults
 * for the Aladdin orchestrator UI.
 *
 * Features:
 * - Automatic retries with exponential backoff
 * - Background refetching on window focus
 * - Optimistic updates support
 * - Error handling and logging
 * - Cache persistence
 */

import { QueryClient, DefaultOptions } from '@tanstack/react-query'

/**
 * Default query options for all queries
 */
const queryConfig: DefaultOptions = {
  queries: {
    // Stale time: 5 minutes
    staleTime: 1000 * 60 * 5,
    // Cache time: 10 minutes
    gcTime: 1000 * 60 * 10,
    // Retry failed requests 3 times with exponential backoff
    retry: (failureCount, error: any) => {
      // Don't retry on 4xx errors
      if (error?.response?.status >= 400 && error?.response?.status < 500) {
        return false
      }
      return failureCount < 3
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    // Refetch on window focus
    refetchOnWindowFocus: true,
    // Don't refetch on mount if data is fresh
    refetchOnMount: false,
    // Refetch on reconnect
    refetchOnReconnect: true,
    // Suspense mode disabled by default
    suspense: false,
  },
  mutations: {
    // Retry mutations once
    retry: 1,
    retryDelay: 1000,
    // Log mutation errors
    onError: (error: any) => {
      console.error('[Mutation Error]:', error)
    },
  },
}

/**
 * Create a new QueryClient instance with custom configuration
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: queryConfig,
  })
}

/**
 * Singleton QueryClient instance
 */
export const queryClient = createQueryClient()

/**
 * Query key factory for consistent key generation
 */
export const queryKeys = {
  // Projects
  projects: {
    all: ['projects'] as const,
    lists: () => [...queryKeys.projects.all, 'list'] as const,
    list: (filters?: Record<string, any>) =>
      [...queryKeys.projects.lists(), filters] as const,
    details: () => [...queryKeys.projects.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.projects.details(), id] as const,
    activity: (id: string) => [...queryKeys.projects.detail(id), 'activity'] as const,
    team: (id: string) => [...queryKeys.projects.detail(id), 'team'] as const,
  },

  // Episodes
  episodes: {
    all: ['episodes'] as const,
    lists: () => [...queryKeys.episodes.all, 'list'] as const,
    list: (projectId?: string) => [...queryKeys.episodes.lists(), { projectId }] as const,
    details: () => [...queryKeys.episodes.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.episodes.details(), id] as const,
  },

  // Characters
  characters: {
    all: ['characters'] as const,
    lists: () => [...queryKeys.characters.all, 'list'] as const,
    list: (projectId?: string) => [...queryKeys.characters.lists(), { projectId }] as const,
    details: () => [...queryKeys.characters.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.characters.details(), id] as const,
  },

  // Scenes
  scenes: {
    all: ['scenes'] as const,
    lists: () => [...queryKeys.scenes.all, 'list'] as const,
    list: (episodeId?: string) => [...queryKeys.scenes.lists(), { episodeId }] as const,
    details: () => [...queryKeys.scenes.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.scenes.details(), id] as const,
  },

  // Conversations
  conversations: {
    all: ['conversations'] as const,
    lists: () => [...queryKeys.conversations.all, 'list'] as const,
    list: (projectId?: string) =>
      [...queryKeys.conversations.lists(), { projectId }] as const,
    details: () => [...queryKeys.conversations.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.conversations.details(), id] as const,
    messages: (id: string) => [...queryKeys.conversations.detail(id), 'messages'] as const,
  },

  // Agent Executions
  executions: {
    all: ['executions'] as const,
    lists: () => [...queryKeys.executions.all, 'list'] as const,
    list: (conversationId?: string) =>
      [...queryKeys.executions.lists(), { conversationId }] as const,
    details: () => [...queryKeys.executions.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.executions.details(), id] as const,
    events: (id: string) => [...queryKeys.executions.detail(id), 'events'] as const,
  },

  // Orchestrator
  orchestrator: {
    all: ['orchestrator'] as const,
    status: () => [...queryKeys.orchestrator.all, 'status'] as const,
    health: () => [...queryKeys.orchestrator.all, 'health'] as const,
  },
} as const

/**
 * Helper to invalidate related queries after mutations
 */
export const invalidateQueries = {
  projects: async (projectId?: string) => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.projects.all })
    if (projectId) {
      await queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(projectId) })
    }
  },
  episodes: async (projectId?: string) => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.episodes.all })
    if (projectId) {
      await queryClient.invalidateQueries({ queryKey: queryKeys.episodes.list(projectId) })
    }
  },
  conversations: async (conversationId?: string) => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.conversations.all })
    if (conversationId) {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.conversations.detail(conversationId),
      })
    }
  },
  executions: async (executionId?: string) => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.executions.all })
    if (executionId) {
      await queryClient.invalidateQueries({ queryKey: queryKeys.executions.detail(executionId) })
    }
  },
}
