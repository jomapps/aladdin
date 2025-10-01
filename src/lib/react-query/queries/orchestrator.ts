/**
 * React Query hooks for Orchestrator
 */

'use client'

import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { queryKeys } from '../client'
import type { AgentEvent } from '@/lib/agents/events/types'

// Types
export interface Conversation {
  id: string
  project?: string
  title?: string
  status: 'active' | 'completed' | 'failed'
  messages: ConversationMessage[]
  metadata?: Record<string, any>
  createdAt: string
  updatedAt: string
}

export interface ConversationMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  metadata?: Record<string, any>
}

export interface ConversationListResponse {
  docs: Conversation[]
  totalDocs: number
  limit: number
  page: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export interface AgentExecution {
  id: string
  conversation: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  context: {
    projectId?: string
    episodeId?: string
    userPrompt: string
    complexity: 'low' | 'medium' | 'high'
  }
  result?: {
    departments: string[]
    overallQuality: number
    consistency: number
    recommendation: 'ingest' | 'review' | 'reject'
  }
  metrics?: {
    totalTime: number
    tokensUsed: number
    agentsSpawned: number
    departmentsInvolved: number
  }
  events?: AgentEvent[]
  createdAt: string
  updatedAt: string
  completedAt?: string
}

export interface ExecutionListResponse {
  docs: AgentExecution[]
  totalDocs: number
  limit: number
  page: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export interface OrchestratorStatus {
  status: 'healthy' | 'degraded' | 'down'
  activeExecutions: number
  totalExecutions: number
  averageResponseTime: number
  uptime: number
  websocketConnected: boolean
}

// API Functions
async function fetchConversations(projectId?: string): Promise<ConversationListResponse> {
  const params = new URLSearchParams()
  if (projectId) {
    params.append('where[project][equals]', projectId)
  }
  params.append('sort', '-createdAt')
  const response = await fetch(`/api/v1/chat/conversation?${params}`)
  if (!response.ok) {
    throw new Error('Failed to fetch conversations')
  }
  return response.json()
}

async function fetchConversation(id: string): Promise<Conversation> {
  const response = await fetch(`/api/v1/chat/${id}`)
  if (!response.ok) {
    throw new Error('Failed to fetch conversation')
  }
  const data = await response.json()
  return data.conversation || data
}

async function fetchExecutions(conversationId?: string): Promise<ExecutionListResponse> {
  const params = new URLSearchParams()
  if (conversationId) {
    params.append('where[conversation][equals]', conversationId)
  }
  params.append('sort', '-createdAt')
  const response = await fetch(`/api/v1/executions?${params}`)
  if (!response.ok) {
    throw new Error('Failed to fetch executions')
  }
  return response.json()
}

async function fetchExecution(id: string): Promise<AgentExecution> {
  const response = await fetch(`/api/v1/executions/${id}`)
  if (!response.ok) {
    throw new Error('Failed to fetch execution')
  }
  const data = await response.json()
  return data.execution || data
}

async function fetchExecutionEvents(executionId: string): Promise<AgentEvent[]> {
  const response = await fetch(`/api/v1/executions/${executionId}/events`)
  if (!response.ok) {
    throw new Error('Failed to fetch execution events')
  }
  const data = await response.json()
  return data.events || data
}

async function fetchOrchestratorStatus(): Promise<OrchestratorStatus> {
  const response = await fetch('/api/v1/orchestrator/status')
  if (!response.ok) {
    throw new Error('Failed to fetch orchestrator status')
  }
  return response.json()
}

async function fetchOrchestratorHealth(): Promise<{ status: string; checks: any }> {
  const response = await fetch('/(frontend)/api/health')
  if (!response.ok) {
    throw new Error('Failed to fetch health status')
  }
  return response.json()
}

// Hooks
export function useConversations(
  projectId?: string,
  options?: Omit<UseQueryOptions<ConversationListResponse>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.conversations.list(projectId),
    queryFn: () => fetchConversations(projectId),
    ...options,
  })
}

export function useConversation(
  id: string,
  options?: Omit<UseQueryOptions<Conversation>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.conversations.detail(id),
    queryFn: () => fetchConversation(id),
    enabled: !!id,
    ...options,
  })
}

export function useExecutions(
  conversationId?: string,
  options?: Omit<UseQueryOptions<ExecutionListResponse>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.executions.list(conversationId),
    queryFn: () => fetchExecutions(conversationId),
    ...options,
  })
}

export function useExecution(
  id: string,
  options?: Omit<UseQueryOptions<AgentExecution>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.executions.detail(id),
    queryFn: () => fetchExecution(id),
    enabled: !!id,
    ...options,
  })
}

export function useExecutionEvents(
  executionId: string,
  options?: Omit<UseQueryOptions<AgentEvent[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.executions.events(executionId),
    queryFn: () => fetchExecutionEvents(executionId),
    enabled: !!executionId,
    refetchInterval: 2000, // Poll every 2 seconds for new events
    ...options,
  })
}

export function useOrchestratorStatus(
  options?: Omit<UseQueryOptions<OrchestratorStatus>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.orchestrator.status(),
    queryFn: fetchOrchestratorStatus,
    refetchInterval: 5000, // Poll every 5 seconds
    ...options,
  })
}

export function useOrchestratorHealth(
  options?: Omit<UseQueryOptions<{ status: string; checks: any }>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.orchestrator.health(),
    queryFn: fetchOrchestratorHealth,
    refetchInterval: 30000, // Poll every 30 seconds
    ...options,
  })
}
