/**
 * Orchestrator Store
 * Manages state for the orchestrator chat interface with 4 modes
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type OrchestratorMode = 'query' | 'data' | 'task' | 'chat'

export interface TaskStep {
  id: string
  name: string
  status: 'pending' | 'running' | 'complete' | 'failed'
  agent?: string
  qualityScore?: number
}

export interface TaskProgress {
  taskId: string
  status: 'pending' | 'running' | 'complete' | 'failed'
  steps: TaskStep[]
  currentStep: number
  progress: number
  overallQuality?: number
}

export interface CodeBlock {
  language: string
  code: string
  filename?: string
}

export interface QueryResult {
  id: string
  type: 'character' | 'scene' | 'location' | 'prop' | 'other'
  title: string
  content: string
  relevance: number
  metadata?: Record<string, any>
}

export interface DataPreview {
  fields: Array<{
    name: string
    type: string
    value: any
    valid: boolean
    issues?: string[]
  }>
  status: 'validating' | 'valid' | 'invalid'
  errors: string[]
  warnings: string[]
}

export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  mode: OrchestratorMode
  metadata?: {
    queryResults?: QueryResult[]
    dataPreview?: DataPreview
    taskProgress?: TaskProgress
    codeBlocks?: CodeBlock[]
    suggestions?: string[]
  }
}

interface OrchestratorState {
  // Mode state
  currentMode: OrchestratorMode

  // Conversation state
  conversationId: string | null
  messages: Message[]
  isStreaming: boolean
  currentStreamingMessage: string

  // Task state
  currentTask: TaskProgress | null

  // UI state
  isPanelOpen: boolean

  // Actions
  setMode: (mode: OrchestratorMode) => void
  addMessage: (message: Message) => void
  updateStreamingMessage: (content: string) => void
  setIsStreaming: (streaming: boolean) => void
  setCurrentTask: (task: TaskProgress | null) => void
  clearMessages: () => void
  setConversationId: (id: string) => void
  setPanelOpen: (open: boolean) => void

  // Helper actions
  getMessagesByMode: (mode: OrchestratorMode) => Message[]
  getLastAssistantMessage: (mode: OrchestratorMode) => Message | null
}

export const useOrchestratorStore = create<OrchestratorState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentMode: 'query',
      conversationId: null,
      messages: [],
      isStreaming: false,
      currentStreamingMessage: '',
      currentTask: null,
      isPanelOpen: false,

      // Actions
      setMode: (mode) => set({ currentMode: mode }),

      addMessage: (message) =>
        set((state) => ({
          messages: [...state.messages, message],
          currentStreamingMessage: '',
          isStreaming: false,
        })),

      updateStreamingMessage: (content) =>
        set({ currentStreamingMessage: content }),

      setIsStreaming: (streaming) =>
        set({ isStreaming: streaming }),

      setCurrentTask: (task) =>
        set({ currentTask: task }),

      clearMessages: () =>
        set({
          messages: [],
          currentStreamingMessage: '',
          currentTask: null,
          conversationId: null,
        }),

      setConversationId: (id) =>
        set({ conversationId: id }),

      setPanelOpen: (open) =>
        set({ isPanelOpen: open }),

      // Helper actions
      getMessagesByMode: (mode) => {
        return get().messages.filter((msg) => msg.mode === mode)
      },

      getLastAssistantMessage: (mode) => {
        const modeMessages = get().messages.filter(
          (msg) => msg.mode === mode && msg.role === 'assistant'
        )
        return modeMessages.length > 0 ? modeMessages[modeMessages.length - 1] : null
      },
    }),
    {
      name: 'orchestrator-storage',
      partialize: (state) => ({
        currentMode: state.currentMode,
        conversationId: state.conversationId,
        // Keep last 100 messages for performance
        messages: state.messages.slice(-100),
        isPanelOpen: state.isPanelOpen,
      }),
    }
  )
)
