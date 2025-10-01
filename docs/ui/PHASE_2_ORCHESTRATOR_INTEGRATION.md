# Phase 2: Orchestrator Integration - Detailed Plan

**Duration**: 1 week  
**Priority**: High  
**Status**: 📋 Ready to Start  
**Depends On**: Phase 1 Complete

---

## Overview

Implement the orchestrator chat interface with 4 distinct modes: Query, Data Ingestion, Task Execution, and General Chat. Each mode has unique UI elements and behavior tailored to its purpose.

---

## Goals

1. ✅ Build chat interface with streaming support
2. ✅ Implement 4 mode tabs with mode-specific UI
3. ✅ Integrate with orchestrator API
4. ✅ Add message history and persistence
5. ✅ Implement real-time streaming responses
6. ✅ Add code highlighting and markdown rendering
7. ✅ Create mode-specific components

---

## File Structure

```
src/components/layout/RightOrchestrator/
├── index.tsx                        # Main orchestrator component
├── ModeSelector.tsx                 # 4-tab mode selector
├── ChatArea.tsx                     # Scrollable message area
├── MessageList.tsx                  # Message list component
├── MessageInput.tsx                 # Input with send button
├── StreamingIndicator.tsx           # Typing/streaming indicator
│
├── modes/
│   ├── QueryMode.tsx                # Query mode UI
│   ├── DataMode.tsx                 # Data ingestion UI
│   ├── TaskMode.tsx                 # Task execution UI
│   └── ChatMode.tsx                 # General chat UI
│
├── components/
│   ├── Message.tsx                  # Single message component
│   ├── StreamingMessage.tsx         # Streaming message
│   ├── CodeBlock.tsx                # Code with syntax highlighting
│   ├── DataPreview.tsx              # Data preview card
│   ├── TaskProgress.tsx             # Task progress indicator
│   ├── QueryResults.tsx             # Query results display
│   └── SuggestionChips.tsx          # Quick action chips
│
└── hooks/
    ├── useOrchestrator.ts           # Orchestrator state hook
    ├── useStreaming.ts              # Streaming messages hook
    └── useModeContext.ts            # Mode-specific context

src/stores/
└── orchestratorStore.ts             # Orchestrator Zustand store

src/app/api/v1/orchestrator/
├── chat/route.ts                    # Chat endpoint
├── query/route.ts                   # Query endpoint
├── ingest/route.ts                  # Data ingestion endpoint
├── task/route.ts                    # Task execution endpoint
└── stream/route.ts                  # SSE streaming endpoint
```

---

## Implementation Details

### 1. Orchestrator Store

```typescript
// src/stores/orchestratorStore.ts

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type OrchestratorMode = 'query' | 'data' | 'task' | 'chat'

export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  mode: OrchestratorMode
  metadata?: {
    queryResults?: any[]
    dataPreview?: any
    taskProgress?: TaskProgress
    codeBlocks?: CodeBlock[]
  }
}

export interface TaskProgress {
  taskId: string
  status: 'pending' | 'running' | 'complete' | 'failed'
  steps: TaskStep[]
  currentStep: number
  progress: number
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
  
  // Actions
  setMode: (mode: OrchestratorMode) => void
  addMessage: (message: Message) => void
  updateStreamingMessage: (content: string) => void
  setIsStreaming: (streaming: boolean) => void
  setCurrentTask: (task: TaskProgress | null) => void
  clearMessages: () => void
  setConversationId: (id: string) => void
}

export const useOrchestratorStore = create<OrchestratorState>()(
  persist(
    (set) => ({
      currentMode: 'query',
      conversationId: null,
      messages: [],
      isStreaming: false,
      currentStreamingMessage: '',
      currentTask: null,
      
      setMode: (mode) => set({ currentMode: mode }),
      
      addMessage: (message) =>
        set((state) => ({
          messages: [...state.messages, message],
          currentStreamingMessage: '',
        })),
      
      updateStreamingMessage: (content) =>
        set({ currentStreamingMessage: content }),
      
      setIsStreaming: (streaming) =>
        set({ isStreaming: streaming }),
      
      setCurrentTask: (task) =>
        set({ currentTask: task }),
      
      clearMessages: () =>
        set({ messages: [], currentStreamingMessage: '' }),
      
      setConversationId: (id) =>
        set({ conversationId: id }),
    }),
    {
      name: 'orchestrator-storage',
      partialize: (state) => ({
        currentMode: state.currentMode,
        conversationId: state.conversationId,
        messages: state.messages.slice(-50), // Keep last 50 messages
      }),
    }
  )
)
```

### 2. Main Orchestrator Component

```typescript
// src/components/layout/RightOrchestrator/index.tsx

'use client'

import { useOrchestratorStore } from '@/stores/orchestratorStore'
import ModeSelector from './ModeSelector'
import ChatArea from './ChatArea'
import MessageInput from './MessageInput'
import { useOrchestrator } from './hooks/useOrchestrator'

interface RightOrchestratorProps {
  isOpen: boolean
  projectId: string
}

export default function RightOrchestrator({ isOpen, projectId }: RightOrchestratorProps) {
  const { currentMode } = useOrchestratorStore()
  const { sendMessage, isLoading } = useOrchestrator(projectId)
  
  if (!isOpen) return null
  
  return (
    <div className="flex flex-col h-full bg-white">
      {/* Mode Selector */}
      <ModeSelector />
      
      {/* Chat Area */}
      <ChatArea mode={currentMode} projectId={projectId} />
      
      {/* Input Area */}
      <MessageInput
        onSend={sendMessage}
        isLoading={isLoading}
        mode={currentMode}
      />
    </div>
  )
}
```

### 3. Mode Selector

```typescript
// src/components/layout/RightOrchestrator/ModeSelector.tsx

'use client'

import { useOrchestratorStore, OrchestratorMode } from '@/stores/orchestratorStore'
import { Search, Database, Zap, MessageCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const modes: Array<{
  id: OrchestratorMode
  label: string
  icon: React.ComponentType<{ className?: string }>
  description: string
}> = [
  {
    id: 'query',
    label: 'Query',
    icon: Search,
    description: 'Ask questions about your project',
  },
  {
    id: 'data',
    label: 'Data',
    icon: Database,
    description: 'Add or update project data',
  },
  {
    id: 'task',
    label: 'Task',
    icon: Zap,
    description: 'Execute project tasks',
  },
  {
    id: 'chat',
    label: 'Chat',
    icon: MessageCircle,
    description: 'General conversation',
  },
]

export default function ModeSelector() {
  const { currentMode, setMode } = useOrchestratorStore()
  
  return (
    <div className="border-b border-gray-200 bg-gray-50">
      <div className="flex">
        {modes.map((mode) => {
          const Icon = mode.icon
          const isActive = currentMode === mode.id
          
          return (
            <button
              key={mode.id}
              onClick={() => setMode(mode.id)}
              className={cn(
                'flex-1 flex flex-col items-center gap-1 py-3 px-2',
                'border-b-2 transition-colors',
                isActive
                  ? 'border-purple-600 bg-white text-purple-600'
                  : 'border-transparent hover:bg-gray-100 text-gray-600'
              )}
              title={mode.description}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{mode.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
```

### 4. Chat Area with Mode-Specific Rendering

```typescript
// src/components/layout/RightOrchestrator/ChatArea.tsx

'use client'

import { useOrchestratorStore, OrchestratorMode } from '@/stores/orchestratorStore'
import { useEffect, useRef } from 'react'
import MessageList from './MessageList'
import StreamingIndicator from './StreamingIndicator'
import QueryMode from './modes/QueryMode'
import DataMode from './modes/DataMode'
import TaskMode from './modes/TaskMode'
import ChatMode from './modes/ChatMode'

interface ChatAreaProps {
  mode: OrchestratorMode
  projectId: string
}

export default function ChatArea({ mode, projectId }: ChatAreaProps) {
  const { messages, isStreaming, currentStreamingMessage } = useOrchestratorStore()
  const scrollRef = useRef<HTMLDivElement>(null)
  
  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, currentStreamingMessage])
  
  // Filter messages by current mode
  const modeMessages = messages.filter((msg) => msg.mode === mode)
  
  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto p-4 space-y-4"
    >
      {/* Mode-specific welcome message */}
      {modeMessages.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          {mode === 'query' && <QueryMode.Welcome />}
          {mode === 'data' && <DataMode.Welcome />}
          {mode === 'task' && <TaskMode.Welcome />}
          {mode === 'chat' && <ChatMode.Welcome />}
        </div>
      )}
      
      {/* Message list */}
      <MessageList messages={modeMessages} mode={mode} />
      
      {/* Streaming indicator */}
      {isStreaming && (
        <StreamingIndicator content={currentStreamingMessage} />
      )}
    </div>
  )
}
```

### 5. Message Input

```typescript
// src/components/layout/RightOrchestrator/MessageInput.tsx

'use client'

import { useState, useRef, KeyboardEvent } from 'react'
import { Send, Paperclip, Mic } from 'lucide-react'
import { OrchestratorMode } from '@/stores/orchestratorStore'
import { cn } from '@/lib/utils'

interface MessageInputProps {
  onSend: (content: string) => Promise<void>
  isLoading: boolean
  mode: OrchestratorMode
}

export default function MessageInput({ onSend, isLoading, mode }: MessageInputProps) {
  const [input, setInput] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  const placeholder = {
    query: 'Ask about your project...',
    data: 'Describe the data to add...',
    task: 'What task should I execute?',
    chat: 'Ask me anything...',
  }[mode]
  
  async function handleSend() {
    if (!input.trim() || isLoading) return
    
    await onSend(input)
    setInput('')
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }
  
  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }
  
  // Auto-resize textarea
  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = `${e.target.scrollHeight}px`
  }
  
  return (
    <div className="border-t border-gray-200 p-4 bg-white">
      <div className="flex gap-2">
        {/* Attachment button */}
        <button
          className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
          title="Attach file"
        >
          <Paperclip className="w-5 h-5" />
        </button>
        
        {/* Text input */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={cn(
            'flex-1 resize-none rounded-lg border border-gray-300',
            'px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500',
            'max-h-32 min-h-[44px]'
          )}
          rows={1}
          disabled={isLoading}
        />
        
        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          className={cn(
            'p-2 rounded-lg transition-colors',
            input.trim() && !isLoading
              ? 'bg-purple-600 text-white hover:bg-purple-700'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          )}
          title="Send message (Enter)"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
      
      {/* Hint text */}
      <p className="text-xs text-gray-500 mt-2">
        Press Enter to send, Shift+Enter for new line
      </p>
    </div>
  )
}
```

### 6. Streaming Hook

```typescript
// src/components/layout/RightOrchestrator/hooks/useStreaming.ts

'use client'

import { useEffect, useRef } from 'react'
import { useOrchestratorStore } from '@/stores/orchestratorStore'

export function useStreaming(conversationId: string | null) {
  const eventSourceRef = useRef<EventSource | null>(null)
  const {
    updateStreamingMessage,
    setIsStreaming,
    addMessage,
  } = useOrchestratorStore()
  
  useEffect(() => {
    if (!conversationId) return
    
    // Setup SSE connection
    const eventSource = new EventSource(
      `/api/v1/orchestrator/stream?conversationId=${conversationId}`
    )
    
    eventSource.onopen = () => {
      console.log('✅ Streaming connection opened')
    }
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        
        if (data.type === 'start') {
          setIsStreaming(true)
          updateStreamingMessage('')
        } else if (data.type === 'chunk') {
          updateStreamingMessage(data.content)
        } else if (data.type === 'complete') {
          setIsStreaming(false)
          addMessage({
            id: data.messageId,
            role: 'assistant',
            content: data.content,
            timestamp: new Date(),
            mode: data.mode,
            metadata: data.metadata,
          })
        }
      } catch (error) {
        console.error('Failed to parse SSE message:', error)
      }
    }
    
    eventSource.onerror = () => {
      console.error('❌ Streaming connection error')
      setIsStreaming(false)
      eventSource.close()
    }
    
    eventSourceRef.current = eventSource
    
    return () => {
      eventSource.close()
    }
  }, [conversationId])
}
```

---

## Mode-Specific Components

### Query Mode

```typescript
// src/components/layout/RightOrchestrator/modes/QueryMode.tsx

export default {
  Welcome: () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Query Mode</h3>
      <p className="text-sm text-gray-600">
        Ask questions about your project. I can search through characters,
        scenes, locations, and more.
      </p>
      <div className="space-y-2">
        <p className="text-xs font-medium text-gray-500">Try asking:</p>
        <div className="flex flex-wrap gap-2">
          <SuggestionChip text="Show all scenes with Aladdin" />
          <SuggestionChip text="What's Jasmine's character arc?" />
          <SuggestionChip text="Find plot holes in Act 2" />
        </div>
      </div>
    </div>
  ),
}
```

---

## API Endpoints

### Chat Endpoint

```typescript
// src/app/api/v1/orchestrator/chat/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { runOrchestrator } from '@/lib/agents/orchestrator'

export async function POST(request: NextRequest) {
  try {
    const { content, mode, projectId, conversationId } = await request.json()
    
    // Route to appropriate handler based on mode
    const result = await runOrchestrator({
      mode,
      content,
      projectId,
      conversationId,
    })
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Orchestrator error:', error)
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    )
  }
}
```

---

## Tasks Breakdown

### Day 1: Store & Core Components
- [ ] Create orchestrator store
- [ ] Build main orchestrator component
- [ ] Implement mode selector
- [ ] Create message types

### Day 2: Chat Interface
- [ ] Build chat area
- [ ] Create message list
- [ ] Implement message input
- [ ] Add streaming indicator

### Day 3: Streaming & API
- [ ] Implement streaming hook
- [ ] Create API endpoints
- [ ] Setup SSE connection
- [ ] Test real-time updates

### Day 4: Mode-Specific UI
- [ ] Build Query mode components
- [ ] Create Data mode UI
- [ ] Implement Task mode
- [ ] Add Chat mode

### Day 5: Polish & Integration
- [ ] Add code highlighting
- [ ] Implement markdown rendering
- [ ] Add suggestion chips
- [ ] Test all modes
- [ ] Fix bugs

---

## Success Criteria

- ✅ All 4 modes functional
- ✅ Streaming responses work
- ✅ Message history persists
- ✅ Mode-specific UI renders
- ✅ Code blocks highlighted
- ✅ Markdown renders correctly
- ✅ No memory leaks
- ✅ Smooth UX

---

**Next**: Phase 3 - State Management & Real-time

