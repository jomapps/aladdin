/**
 * React Query mutations for Orchestrator
 */

'use client'

import { useMutation, UseMutationOptions } from '@tanstack/react-query'
import { queryClient, invalidateQueries } from '../client'

// Types
export interface SendMessageInput {
  conversationId?: string
  projectId: string
  episodeId?: string
  message: string
  stream?: boolean
}

export interface SendMessageResponse {
  conversationId: string
  executionId: string
  message: {
    id: string
    role: 'assistant'
    content: string
    timestamp: string
  }
}

export interface CreateConversationInput {
  projectId: string
  title?: string
  metadata?: Record<string, any>
}

export interface CreateConversationResponse {
  conversation: {
    id: string
    project: string
    title?: string
    status: 'active'
    messages: []
    createdAt: string
  }
}

export interface DeleteConversationInput {
  conversationId: string
}

export interface UpdateExecutionInput {
  executionId: string
  updates: {
    status?: 'pending' | 'running' | 'completed' | 'failed'
    result?: any
    metrics?: any
  }
}

// API Functions
async function sendMessage(input: SendMessageInput): Promise<SendMessageResponse> {
  const url = input.conversationId
    ? `/api/v1/chat/${input.conversationId}`
    : '/api/v1/chat/conversation'

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: input.message,
      projectId: input.projectId,
      episodeId: input.episodeId,
      stream: input.stream || false,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to send message')
  }

  return response.json()
}

async function createConversation(
  input: CreateConversationInput
): Promise<CreateConversationResponse> {
  const response = await fetch('/api/v1/chat/conversation', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      projectId: input.projectId,
      title: input.title,
      metadata: input.metadata,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to create conversation')
  }

  return response.json()
}

async function deleteConversation(input: DeleteConversationInput): Promise<void> {
  const response = await fetch(`/api/v1/chat/${input.conversationId}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to delete conversation')
  }
}

async function updateExecution(input: UpdateExecutionInput): Promise<any> {
  const response = await fetch(`/api/v1/executions/${input.executionId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input.updates),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to update execution')
  }

  return response.json()
}

// Hooks
export function useSendMessage(
  options?: Omit<
    UseMutationOptions<SendMessageResponse, Error, SendMessageInput>,
    'mutationFn'
  >
) {
  return useMutation({
    mutationFn: sendMessage,
    onSuccess: (data, variables) => {
      // Invalidate conversation queries
      invalidateQueries.conversations(variables.conversationId || data.conversationId)
      // Invalidate execution queries
      invalidateQueries.executions(data.executionId)
    },
    ...options,
  })
}

export function useCreateConversation(
  options?: Omit<
    UseMutationOptions<CreateConversationResponse, Error, CreateConversationInput>,
    'mutationFn'
  >
) {
  return useMutation({
    mutationFn: createConversation,
    onSuccess: (data, variables) => {
      // Invalidate all conversations
      invalidateQueries.conversations()
      // Invalidate project-specific conversations
      invalidateQueries.conversations()
    },
    ...options,
  })
}

export function useDeleteConversation(
  options?: Omit<
    UseMutationOptions<void, Error, DeleteConversationInput>,
    'mutationFn'
  >
) {
  return useMutation({
    mutationFn: deleteConversation,
    onSuccess: (data, variables) => {
      // Invalidate all conversations
      invalidateQueries.conversations()
      // Remove the specific conversation from cache
      queryClient.removeQueries({
        queryKey: ['conversations', 'detail', variables.conversationId],
      })
    },
    ...options,
  })
}

export function useUpdateExecution(
  options?: Omit<UseMutationOptions<any, Error, UpdateExecutionInput>, 'mutationFn'>
) {
  return useMutation({
    mutationFn: updateExecution,
    onSuccess: (data, variables) => {
      // Invalidate execution queries
      invalidateQueries.executions(variables.executionId)
    },
    ...options,
  })
}
