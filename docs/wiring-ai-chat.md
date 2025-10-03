# AI Chat Implementation Guide - Wiring the Orchestrator

**Version**: 1.0
**Date**: January 2025
**Status**: Implementation Ready
**Author**: AI Development Team

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current State Analysis](#current-state-analysis)
3. [Architecture Overview](#architecture-overview)
4. [Phase 1: Chat Mode](#phase-1-chat-mode)
5. [Phase 2: Query Mode](#phase-2-query-mode)
6. [Phase 3: Task Mode](#phase-3-task-mode)
7. [Phase 4: Data Mode](#phase-4-data-mode)
8. [Phase 5: Streaming Implementation](#phase-5-streaming-implementation)
9. [Error Handling & Resilience](#error-handling--resilience)
10. [Testing Strategy](#testing-strategy)
11. [Deployment Checklist](#deployment-checklist)

---

## Executive Summary

### The Problem
The AI Chat orchestrator UI is complete with 4 modes (Chat, Query, Task, Data), but **all API endpoints return mock responses**. The system needs to be wired to:
- **OpenRouter LLM** for AI responses
- **Brain service** for semantic search
- **@codebuff/sdk** for agent orchestration
- **Gather MongoDB** for data ingestion

### The Solution
Implement real LLM integration with streaming responses, Brain service queries, agent execution via @codebuff/sdk, and Gather data ingestion with AI enrichment.

### Success Metrics
- ✅ All 4 modes return real AI responses (no mocks)
- ✅ Conversations persist to PayloadCMS
- ✅ Streaming responses work smoothly (SSE)
- ✅ Brain queries return project entities
- ✅ Tasks execute via @codebuff/sdk agents
- ✅ Data saves to Gather with AI enrichment
- ✅ <500ms latency for API responses
- ✅ Zero console errors

---

## Current State Analysis

### ✅ What's Working

#### 1. UI Components (100% Complete)
```typescript
// File: src/components/layout/RightOrchestrator/index.tsx
- ✅ Sheet modal with slide-in animation
- ✅ 4-tab mode selector (Chat, Query, Task, Data)
- ✅ Message display area with scrolling
- ✅ Input field with Shift+Enter support
- ✅ Floating toggle button
- ✅ Dark/light theme support
```

#### 2. State Management (100% Complete)
```typescript
// File: src/stores/orchestratorStore.ts
export interface OrchestratorState {
  currentMode: OrchestratorMode           // ✅ Mode tracking
  conversationId: string | null           // ✅ Conversation ID
  messages: Message[]                     // ✅ Message history
  isStreaming: boolean                    // ✅ Streaming state
  currentStreamingMessage: string         // ✅ Partial response
  currentTask: TaskProgress | null        // ✅ Task state
  isPanelOpen: boolean                    // ✅ Panel state
}
```

#### 3. LLM Client (100% Complete)
```typescript
// File: src/lib/llm/client.ts
class LLMClient {
  - ✅ OpenRouter integration
  - ✅ Claude Sonnet 4.5 primary model
  - ✅ Qwen/Gemini fallback chain
  - ✅ Retry logic (3 attempts)
  - ✅ Token usage tracking
  - ✅ JSON parsing utilities
}

// Configuration
OPENROUTER_API_KEY=sk-or-v1-xxx
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_DEFAULT_MODEL=anthropic/claude-sonnet-4.5
OPENROUTER_BACKUP_MODEL=qwen/qwen3-vl-235b-a22b-thinking
OPENROUTER_VISION_MODE=google/gemini-2.5-flash
```

#### 4. Database Schema (100% Complete)
```typescript
// File: src/collections/Conversations.ts
export const Conversations: CollectionConfig = {
  slug: 'conversations',
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'project', type: 'relationship', relationTo: 'projects' },
    { name: 'user', type: 'relationship', relationTo: 'users' },
    {
      name: 'messages',
      type: 'array',
      fields: [
        { name: 'id', type: 'text' },
        { name: 'role', type: 'select', options: ['user', 'assistant', 'system'] },
        { name: 'content', type: 'textarea' },
        { name: 'timestamp', type: 'date' },
        { name: 'agentId', type: 'text' }
      ]
    },
    { name: 'status', type: 'select', options: ['active', 'archived'] },
    { name: 'lastMessageAt', type: 'date' }
  ]
}
```

### ❌ What's Missing

#### 1. API Implementation (0% Complete)
```typescript
// File: src/app/api/v1/orchestrator/chat/route.ts
export async function POST(request: NextRequest) {
  // ❌ TODO: Implement general chat
  // Mock response returned
}

// File: src/app/api/v1/orchestrator/query/route.ts
export async function POST(request: NextRequest) {
  // ❌ TODO: Implement brain service query
  // Mock response returned
}

// File: src/app/api/v1/orchestrator/task/route.ts
export async function POST(request: NextRequest) {
  // ❌ TODO: Implement task orchestration
  // Mock response returned
}

// File: src/app/api/v1/orchestrator/data/route.ts
export async function POST(request: NextRequest) {
  // ❌ TODO: Implement data ingestion logic
  // Mock response returned
}
```

#### 2. Streaming Implementation (0% Complete)
```typescript
// File: src/app/api/orchestrator/stream/route.ts
// ❌ No SSE implementation
// ❌ No WebSocket fallback
// ❌ No connection management
```

#### 3. Conversation Persistence (0% Complete)
```typescript
// ❌ Messages not saved to PayloadCMS
// ❌ No conversation history loading
// ❌ No conversation threading
```

---

## Architecture Overview

### System Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     USER INTERACTION                        │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  RightOrchestrator (Sheet Modal)                    │  │
│  │  ┌──────────────────────────────────────────────┐   │  │
│  │  │  ModeSelector: [Chat│Query│Task│Data]        │   │  │
│  │  └──────────────────────────────────────────────┘   │  │
│  │  ┌──────────────────────────────────────────────┐   │  │
│  │  │  ChatArea: Message Display + Streaming       │   │  │
│  │  └──────────────────────────────────────────────┘   │  │
│  │  ┌──────────────────────────────────────────────┐   │  │
│  │  │  MessageInput: User Input Field              │   │  │
│  │  └──────────────────────────────────────────────┘   │  │
│  └─────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   ZUSTAND STATE MANAGEMENT                  │
│                                                             │
│  orchestratorStore:                                         │
│  - currentMode: OrchestratorMode                            │
│  - messages: Message[]                                      │
│  - isStreaming: boolean                                     │
│  - conversationId: string                                   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      API ROUTING LAYER                      │
│                                                             │
│  POST /api/v1/orchestrator/{mode}                          │
│  - mode = chat | query | task | data                        │
│  - Body: { content, projectId?, conversationId? }           │
└─────────────────────────────────────────────────────────────┘
                            │
                ┌───────────┴───────────┐
                ▼                       ▼
┌──────────────────────┐    ┌──────────────────────┐
│    CHAT HANDLER      │    │   QUERY HANDLER      │
│                      │    │                      │
│  - LLM Client        │    │  - Brain MCP         │
│  - OpenRouter API    │    │  - Semantic Search   │
│  - Conversation DB   │    │  - Entity Cards      │
└──────────────────────┘    └──────────────────────┘
                ▼                       ▼
┌──────────────────────┐    ┌──────────────────────┐
│    TASK HANDLER      │    │    DATA HANDLER      │
│                      │    │                      │
│  - @codebuff/sdk     │    │  - Gather MongoDB    │
│  - Agent Runner      │    │  - Duplicate Check   │
│  - Department Agents │    │  - AI Enrichment     │
└──────────────────────┘    └──────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    STREAMING LAYER (SSE)                    │
│                                                             │
│  GET /api/orchestrator/stream?conversationId={id}          │
│  - Server-Sent Events (SSE)                                 │
│  - Real-time token streaming                                │
│  - Auto-reconnection on disconnect                          │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     DATA PERSISTENCE                        │
│                                                             │
│  PayloadCMS:                   MongoDB:                     │
│  - conversations              - aladdin-gather-{projectId}  │
│  - agents                                                   │
│  - projects                   Neo4j (Brain MCP):            │
│  - departments                - Entity nodes                │
│  - users                      - Relationships               │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **LLM Provider** | OpenRouter | Latest | AI response generation |
| **Primary Model** | Claude Sonnet 4.5 | Latest | Main conversation model |
| **Backup Model** | Qwen 3 VL | Latest | Fallback for failures |
| **Vision Model** | Gemini 2.5 Flash | Latest | Image/PDF processing |
| **Agent Framework** | @codebuff/sdk | 0.3.12 | Agent orchestration |
| **State Management** | Zustand | 4.5.2 | Client state |
| **Database (CMS)** | MongoDB (PayloadCMS) | 3.57.0 | Structured data |
| **Database (Gather)** | MongoDB | 6.20.0 | Unqualified data |
| **Graph Database** | Neo4j (Brain MCP) | Latest | Entity relationships |
| **Streaming** | Server-Sent Events | Native | Real-time updates |
| **Job Queue** | BullMQ | 5.59.0 | Background tasks |

---

## Phase 1: Chat Mode

### Purpose
General AI conversation without project context. Pure LLM interaction for brainstorming, questions, and creative assistance.

### Implementation Steps

#### Step 1.1: Create Chat Handler

**File**: `src/lib/orchestrator/chatHandler.ts`

```typescript
/**
 * Chat Mode Handler
 * Handles general AI conversation without project context
 */

import { getLLMClient, type LLMMessage } from '@/lib/llm/client'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

export interface ChatHandlerOptions {
  content: string
  conversationId?: string
  userId: string
  model?: string
  temperature?: number
  maxTokens?: number
}

export interface ChatHandlerResult {
  conversationId: string
  message: string
  model: string
  usage: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  suggestions: string[]
}

/**
 * Handle general chat requests
 */
export async function handleChat(
  options: ChatHandlerOptions
): Promise<ChatHandlerResult> {
  const {
    content,
    conversationId,
    userId,
    model,
    temperature = 0.7,
    maxTokens = 2000,
  } = options

  // 1. Initialize clients
  const llmClient = getLLMClient()
  const payload = await getPayload({ config: await configPromise })

  // 2. Load or create conversation
  let actualConversationId = conversationId
  let conversationHistory: LLMMessage[] = []

  if (conversationId) {
    try {
      const conversation = await payload.findByID({
        collection: 'conversations',
        id: conversationId,
      })

      if (conversation && conversation.messages) {
        conversationHistory = conversation.messages.map((msg: any) => ({
          role: msg.role as 'user' | 'assistant' | 'system',
          content: msg.content,
        }))
      }
    } catch (error) {
      console.error('[ChatHandler] Failed to load conversation:', error)
      // Continue with empty history
    }
  }

  // 3. Create conversation if new
  if (!actualConversationId) {
    const newConversation = await payload.create({
      collection: 'conversations',
      data: {
        name: `Chat - ${new Date().toISOString()}`,
        user: userId,
        status: 'active',
        messages: [],
        createdAt: new Date(),
      },
    })
    actualConversationId = newConversation.id
  }

  // 4. Build messages array with system prompt
  const messages: LLMMessage[] = [
    {
      role: 'system',
      content: `You are a helpful AI assistant for creative professionals. You can help with:
- Creative writing and storytelling
- Brainstorming ideas and overcoming writer's block
- General questions about narrative structure and techniques
- Providing constructive feedback and suggestions

Provide clear, concise, and helpful responses. Use markdown formatting when appropriate.
Be encouraging and supportive while maintaining professionalism.`,
    },
    ...conversationHistory,
    {
      role: 'user',
      content,
    },
  ]

  // 5. Get LLM response
  const llmResponse = await llmClient.chat(messages, {
    temperature,
    maxTokens,
  })

  console.log('[ChatHandler] LLM response generated:', {
    tokens: llmResponse.usage.totalTokens,
    model: llmResponse.model,
  })

  // 6. Generate contextual suggestions
  const suggestions = generateChatSuggestions(content, llmResponse.content)

  // 7. Save messages to conversation
  try {
    await payload.update({
      collection: 'conversations',
      id: actualConversationId,
      data: {
        messages: {
          // @ts-ignore - PayloadCMS array append
          append: [
            {
              id: `msg-${Date.now()}-user`,
              role: 'user',
              content,
              timestamp: new Date(),
            },
            {
              id: `msg-${Date.now()}-assistant`,
              role: 'assistant',
              content: llmResponse.content,
              timestamp: new Date(),
            },
          ],
        },
        lastMessageAt: new Date(),
        updatedAt: new Date(),
      },
    })
  } catch (saveError) {
    console.error('[ChatHandler] Failed to save conversation:', saveError)
    // Continue anyway - don't fail the request
  }

  // 8. Return result
  return {
    conversationId: actualConversationId,
    message: llmResponse.content,
    model: llmResponse.model,
    usage: {
      promptTokens: llmResponse.usage.promptTokens,
      completionTokens: llmResponse.usage.completionTokens,
      totalTokens: llmResponse.usage.totalTokens,
    },
    suggestions,
  }
}

/**
 * Generate contextual follow-up suggestions
 */
function generateChatSuggestions(
  userMessage: string,
  assistantResponse: string
): string[] {
  const suggestions: string[] = []

  // Check for code in response
  if (assistantResponse.includes('```')) {
    suggestions.push('Can you explain this in more detail?')
    suggestions.push('Are there any alternative approaches?')
  }

  // Check for lists or options
  if (assistantResponse.includes('\n-') || assistantResponse.includes('\n1.')) {
    suggestions.push('Can you elaborate on the first point?')
    suggestions.push('Which option would you recommend?')
  }

  // Generic helpful suggestions
  suggestions.push('Can you provide an example?')
  suggestions.push('What are the pros and cons?')

  return suggestions.slice(0, 3)
}
```

#### Step 1.2: Update Chat API Route

**File**: `src/app/api/v1/orchestrator/chat/route.ts`

```typescript
/**
 * Chat Mode API Route
 * Handles general chat requests (no project context)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { handleChat } from '@/lib/orchestrator/chatHandler'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const payload = await getPayload({ config: await configPromise })
    const { user } = await payload.auth({ req: request as any })

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'AUTH_REQUIRED' },
        { status: 401 }
      )
    }

    // 2. Parse request
    const body = await request.json()
    const { content, conversationId, model, temperature, maxTokens } = body

    if (!content) {
      return NextResponse.json(
        { error: 'Missing content', code: 'VALIDATION_ERROR' },
        { status: 400 }
      )
    }

    console.log('[Chat API] Processing message:', { conversationId })

    // 3. Handle chat
    const result = await handleChat({
      content,
      conversationId,
      userId: user.id,
      model,
      temperature,
      maxTokens,
    })

    // 4. Return response
    return NextResponse.json({
      success: true,
      conversationId: result.conversationId,
      message: result.message,
      model: result.model,
      usage: result.usage,
      suggestions: result.suggestions,
    })
  } catch (error: any) {
    console.error('[Chat API] Error:', error)

    return NextResponse.json(
      {
        error: error.message || 'Internal server error',
        code: 'CHAT_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}
```

#### Step 1.3: Update Frontend Hook

**File**: `src/hooks/orchestrator/useOrchestratorChat.ts` (Update existing)

```typescript
// Update the sendMessage function to handle real responses

const response = await fetch(endpoint, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    content,
    projectId: options.projectId,
    conversationId,
    mode,
  }),
})

if (!response.ok) {
  throw new Error(`Failed to send message: ${response.statusText}`)
}

const data = await response.json()

// Update conversation ID if new
if (data.conversationId && !conversationId) {
  setConversationId(data.conversationId)
}

// Add assistant message to store
if (data.message) {
  const assistantMessage: Message = {
    id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    role: 'assistant',
    content: data.message,
    timestamp: new Date(),
    mode,
    metadata: {
      suggestions: data.suggestions,
    },
  }

  addMessage(assistantMessage)
}

setIsStreaming(false)
```

#### Step 1.4: Update ChatMode Component

**File**: `src/components/layout/RightOrchestrator/modes/ChatMode.tsx` (Update existing)

```typescript
// Add suggestion click handler
function Welcome({ onSuggestionClick }: { onSuggestionClick?: (text: string) => void }) {
  return (
    <div className="max-w-md mx-auto space-y-6 py-8 px-4">
      {/* ... existing code ... */}

      {/* Starter prompts with click handlers */}
      <div className="space-y-2">
        {[
          "Explain the hero's journey structure",
          'How do I create compelling dialogue?',
          'What makes a good plot twist?',
          'Give me tips for character development',
        ].map((prompt, index) => (
          <button
            key={index}
            onClick={() => onSuggestionClick?.(prompt)}
            className="w-full text-left px-4 py-3 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-900 dark:hover:border-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors text-sm text-zinc-900 dark:text-zinc-100"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  )
}
```

### Testing Chat Mode

```bash
# Test chat endpoint
curl -X POST http://localhost:3000/api/v1/orchestrator/chat \
  -H "Content-Type: application/json" \
  -d '{
    "content": "What makes a good plot twist?",
    "conversationId": null
  }'

# Expected response:
{
  "success": true,
  "conversationId": "conv-1234567890",
  "message": "A good plot twist should...",
  "model": "anthropic/claude-sonnet-4.5",
  "usage": {
    "promptTokens": 150,
    "completionTokens": 200,
    "totalTokens": 350
  },
  "suggestions": [
    "Can you provide an example?",
    "What are the pros and cons?",
    "Can you elaborate on the first point?"
  ]
}
```

---

## Phase 2: Query Mode

### Purpose
Search project Brain for entities (characters, scenes, locations) using semantic search. Returns structured results with entity cards.

### Implementation Steps

#### Step 2.1: Create Query Handler

**File**: `src/lib/orchestrator/queryHandler.ts`

```typescript
/**
 * Query Mode Handler
 * Handles Brain service queries with semantic search
 */

import { getLLMClient, type LLMMessage } from '@/lib/llm/client'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

// Brain MCP client (to be implemented)
interface BrainClient {
  searchSimilar(params: {
    query: string
    projectId: string
    types?: string[]
    limit?: number
    threshold?: number
  }): Promise<BrainSearchResult[]>
}

interface BrainSearchResult {
  id: string
  type: string
  properties: Record<string, any>
  similarity: number
}

export interface QueryResult {
  id: string
  type: 'character' | 'scene' | 'location' | 'prop' | 'other'
  title: string
  content: string
  relevance: number
  metadata?: Record<string, any>
}

export interface QueryHandlerOptions {
  content: string
  projectId: string
  conversationId?: string
  userId: string
  limit?: number
  types?: string[]
}

export interface QueryHandlerResult {
  conversationId: string
  message: string
  results: QueryResult[]
  model: string
  usage: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

/**
 * Get Brain MCP client (placeholder - implement based on your Brain service)
 */
function getBrainClient(): BrainClient {
  // TODO: Implement Brain MCP client
  // This should connect to brain.ft.tc via MCP
  return {
    async searchSimilar(params) {
      // Placeholder implementation
      console.log('[Brain] Search similar:', params)
      return []
    },
  }
}

/**
 * Handle query requests with Brain search
 */
export async function handleQuery(
  options: QueryHandlerOptions
): Promise<QueryHandlerResult> {
  const {
    content,
    projectId,
    conversationId,
    userId,
    limit = 10,
    types,
  } = options

  // 1. Initialize clients
  const llmClient = getLLMClient()
  const brainClient = getBrainClient()
  const payload = await getPayload({ config: await configPromise })

  // 2. Load or create conversation
  let actualConversationId = conversationId
  let conversationHistory: LLMMessage[] = []

  if (conversationId) {
    try {
      const conversation = await payload.findByID({
        collection: 'conversations',
        id: conversationId,
      })

      if (conversation && conversation.messages) {
        conversationHistory = conversation.messages
          .filter((msg: any) => msg.role !== 'system')
          .map((msg: any) => ({
            role: msg.role as 'user' | 'assistant',
            content: msg.content,
          }))
      }
    } catch (error) {
      console.error('[QueryHandler] Failed to load conversation:', error)
    }
  }

  // 3. Create conversation if new
  if (!actualConversationId) {
    const newConversation = await payload.create({
      collection: 'conversations',
      data: {
        name: `Query - ${new Date().toISOString()}`,
        project: projectId,
        user: userId,
        status: 'active',
        messages: [],
        createdAt: new Date(),
      },
    })
    actualConversationId = newConversation.id
  }

  // 4. Search Brain for relevant entities
  console.log('[QueryHandler] Searching Brain for:', content)

  const brainResults = await brainClient.searchSimilar({
    query: content,
    projectId,
    types,
    limit,
    threshold: 0.6, // 60% similarity threshold
  })

  console.log('[QueryHandler] Brain results:', brainResults.length)

  // 5. Transform Brain results to QueryResults
  const queryResults: QueryResult[] = brainResults.map((result) => ({
    id: result.id,
    type: mapBrainTypeToQueryType(result.type),
    title: result.properties.name || result.properties.title || result.id,
    content: JSON.stringify(result.properties, null, 2),
    relevance: result.similarity,
    metadata: result.properties,
  }))

  // 6. Build context for LLM
  const brainContext = queryResults.length > 0
    ? `Found ${queryResults.length} relevant entities:\n\n${queryResults
        .map(
          (r, i) =>
            `${i + 1}. ${r.type.toUpperCase()}: ${r.title} (${Math.round(r.relevance * 100)}% relevant)\n${r.content.substring(0, 200)}...`
        )
        .join('\n\n')}`
    : 'No relevant entities found in the project Brain.'

  // 7. Build messages for LLM
  const messages: LLMMessage[] = [
    {
      role: 'system',
      content: `You are a helpful AI assistant that searches and retrieves information from a movie production project's knowledge base (Brain).

Your role:
- Help users find characters, scenes, locations, and other project entities
- Provide clear, concise summaries of search results
- Highlight the most relevant information
- Suggest follow-up queries

Project Context:
${brainContext}

Always cite which entity you're referring to when answering questions.`,
    },
    ...conversationHistory,
    {
      role: 'user',
      content,
    },
  ]

  // 8. Get LLM response
  const llmResponse = await llmClient.chat(messages, {
    temperature: 0.3, // Lower temperature for factual retrieval
    maxTokens: 1500,
  })

  console.log('[QueryHandler] LLM response generated:', {
    tokens: llmResponse.usage.totalTokens,
    model: llmResponse.model,
  })

  // 9. Save to conversation
  try {
    await payload.update({
      collection: 'conversations',
      id: actualConversationId,
      data: {
        messages: {
          // @ts-ignore
          append: [
            {
              id: `msg-${Date.now()}-user`,
              role: 'user',
              content,
              timestamp: new Date(),
            },
            {
              id: `msg-${Date.now()}-assistant`,
              role: 'assistant',
              content: llmResponse.content,
              timestamp: new Date(),
            },
          ],
        },
        lastMessageAt: new Date(),
        updatedAt: new Date(),
      },
    })
  } catch (saveError) {
    console.error('[QueryHandler] Failed to save conversation:', saveError)
  }

  // 10. Return result
  return {
    conversationId: actualConversationId,
    message: llmResponse.content,
    results: queryResults,
    model: llmResponse.model,
    usage: {
      promptTokens: llmResponse.usage.promptTokens,
      completionTokens: llmResponse.usage.completionTokens,
      totalTokens: llmResponse.usage.totalTokens,
    },
  }
}

/**
 * Map Brain entity type to QueryResult type
 */
function mapBrainTypeToQueryType(
  brainType: string
): 'character' | 'scene' | 'location' | 'prop' | 'other' {
  const typeMap: Record<string, 'character' | 'scene' | 'location' | 'prop' | 'other'> = {
    character: 'character',
    scene: 'scene',
    location: 'location',
    prop: 'prop',
  }

  return typeMap[brainType.toLowerCase()] || 'other'
}
```

#### Step 2.2: Update Query API Route

**File**: `src/app/api/v1/orchestrator/query/route.ts`

```typescript
/**
 * Query Mode API Route
 * Handles query requests with brain service integration
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { handleQuery } from '@/lib/orchestrator/queryHandler'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const payload = await getPayload({ config: await configPromise })
    const { user } = await payload.auth({ req: request as any })

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'AUTH_REQUIRED' },
        { status: 401 }
      )
    }

    // 2. Parse request
    const body = await request.json()
    const { content, projectId, conversationId, limit, types } = body

    if (!content || !projectId) {
      return NextResponse.json(
        { error: 'Missing required fields', code: 'VALIDATION_ERROR' },
        { status: 400 }
      )
    }

    console.log('[Query API] Processing query:', { projectId, conversationId })

    // 3. Validate project access
    const project = await payload.findByID({
      collection: 'projects',
      id: projectId,
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found', code: 'PROJECT_NOT_FOUND' },
        { status: 404 }
      )
    }

    // 4. Handle query
    const result = await handleQuery({
      content,
      projectId,
      conversationId,
      userId: user.id,
      limit,
      types,
    })

    // 5. Return response
    return NextResponse.json({
      success: true,
      conversationId: result.conversationId,
      message: result.message,
      results: result.results,
      model: result.model,
      usage: result.usage,
    })
  } catch (error: any) {
    console.error('[Query API] Error:', error)

    return NextResponse.json(
      {
        error: error.message || 'Internal server error',
        code: 'QUERY_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}
```

#### Step 2.3: Update Orchestrator Store

**File**: `src/stores/orchestratorStore.ts` (Add query results handling)

```typescript
// Add to Message metadata
metadata?: {
  queryResults?: QueryResult[]  // ✅ Already defined
  dataPreview?: DataPreview
  taskProgress?: TaskProgress
  codeBlocks?: CodeBlock[]
  suggestions?: string[]
}
```

### Testing Query Mode

```bash
# Test query endpoint
curl -X POST http://localhost:3000/api/v1/orchestrator/query \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Tell me about Maya",
    "projectId": "proj-123",
    "conversationId": null
  }'

# Expected response:
{
  "success": true,
  "conversationId": "conv-1234567890",
  "message": "Based on the project Brain, I found 2 relevant entities about Maya:\n\n1. Maya (Character) - 95% relevant\nMaya is a 28-year-old scientist...",
  "results": [
    {
      "id": "char-maya-001",
      "type": "character",
      "title": "Maya",
      "content": "{\"name\":\"Maya\",\"age\":28,\"occupation\":\"Scientist\"...}",
      "relevance": 0.95,
      "metadata": { "name": "Maya", "age": 28 }
    }
  ],
  "model": "anthropic/claude-sonnet-4.5",
  "usage": { "totalTokens": 450 }
}
```

---

## Phase 3: Task Mode

### Purpose
Execute complex tasks using @codebuff/sdk agents. Route tasks to appropriate department agents (Story, Character, Visual, etc.) and track execution progress.

### Implementation Steps

#### Step 3.1: Create Task Handler

**File**: `src/lib/orchestrator/taskHandler.ts`

```typescript
/**
 * Task Mode Handler
 * Handles task execution using @codebuff/sdk agents
 */

import { AladdinAgentRunner, type AgentExecutionContext } from '@/lib/agents/AladdinAgentRunner'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import type { TaskProgress, TaskStep } from '@/stores/orchestratorStore'

export interface TaskHandlerOptions {
  content: string
  projectId: string
  conversationId?: string
  userId: string
  agentId?: string // Optional: specific agent to use
  departmentSlug?: string // Optional: route to specific department
}

export interface TaskHandlerResult {
  conversationId: string
  taskId: string
  message: string
  progress: TaskProgress
  executionId: string
}

/**
 * Route task to appropriate agent based on content
 */
async function routeTaskToAgent(
  content: string,
  projectId: string,
  agentId?: string,
  departmentSlug?: string
): Promise<{ agentId: string; departmentId: string }> {
  const payload = await getPayload({ config: await configPromise })

  // If agent specified, use it directly
  if (agentId) {
    const agent = await payload.find({
      collection: 'agents',
      where: {
        agentId: { equals: agentId },
        isActive: { equals: true },
      },
      limit: 1,
    })

    if (!agent.docs.length) {
      throw new Error(`Agent not found or inactive: ${agentId}`)
    }

    return {
      agentId: agent.docs[0].agentId,
      departmentId: agent.docs[0].department as string,
    }
  }

  // If department specified, use department head
  if (departmentSlug) {
    const department = await payload.find({
      collection: 'departments',
      where: {
        slug: { equals: departmentSlug },
        isActive: { equals: true },
      },
      limit: 1,
    })

    if (!department.docs.length) {
      throw new Error(`Department not found or inactive: ${departmentSlug}`)
    }

    // Find department head agent
    const headAgent = await payload.find({
      collection: 'agents',
      where: {
        department: { equals: department.docs[0].id },
        role: { equals: 'head' },
        isActive: { equals: true },
      },
      limit: 1,
    })

    if (!headAgent.docs.length) {
      throw new Error(`No head agent found for department: ${departmentSlug}`)
    }

    return {
      agentId: headAgent.docs[0].agentId,
      departmentId: department.docs[0].id,
    }
  }

  // Auto-route based on content analysis
  const route = await analyzeTaskContent(content)

  const department = await payload.find({
    collection: 'departments',
    where: {
      slug: { equals: route.departmentSlug },
      isActive: { equals: true },
    },
    limit: 1,
  })

  if (!department.docs.length) {
    throw new Error(`Auto-routed department not found: ${route.departmentSlug}`)
  }

  const headAgent = await payload.find({
    collection: 'agents',
    where: {
      department: { equals: department.docs[0].id },
      role: { equals: 'head' },
      isActive: { equals: true },
    },
    limit: 1,
  })

  if (!headAgent.docs.length) {
    throw new Error(`No head agent for auto-routed department: ${route.departmentSlug}`)
  }

  return {
    agentId: headAgent.docs[0].agentId,
    departmentId: department.docs[0].id,
  }
}

/**
 * Analyze task content to determine appropriate department
 */
async function analyzeTaskContent(
  content: string
): Promise<{ departmentSlug: string; confidence: number }> {
  const keywords = {
    story: ['plot', 'story', 'narrative', 'arc', 'chapter', 'scene structure'],
    character: ['character', 'protagonist', 'dialogue', 'personality', 'backstory'],
    visual: ['visual', 'concept art', 'design', 'color', 'style'],
    'image-quality': ['image', 'quality', 'reference', 'consistency'],
    video: ['video', 'animation', 'scene', 'shot', 'sequence'],
    audio: ['audio', 'voice', 'sound', 'music', 'sfx'],
    production: ['production', 'schedule', 'resources', 'budget', 'timeline'],
  }

  const contentLower = content.toLowerCase()
  const scores: Record<string, number> = {}

  for (const [dept, terms] of Object.entries(keywords)) {
    scores[dept] = terms.filter((term) => contentLower.includes(term)).length
  }

  // Find department with highest score
  let maxScore = 0
  let selectedDept = 'story' // Default to story

  for (const [dept, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score
      selectedDept = dept
    }
  }

  return {
    departmentSlug: selectedDept,
    confidence: maxScore > 0 ? maxScore / 10 : 0.3,
  }
}

/**
 * Handle task execution
 */
export async function handleTask(
  options: TaskHandlerOptions
): Promise<TaskHandlerResult> {
  const {
    content,
    projectId,
    conversationId,
    userId,
    agentId,
    departmentSlug,
  } = options

  const payload = await getPayload({ config: await configPromise })

  // 1. Create or load conversation
  let actualConversationId = conversationId

  if (!actualConversationId) {
    const newConversation = await payload.create({
      collection: 'conversations',
      data: {
        name: `Task - ${new Date().toISOString()}`,
        project: projectId,
        user: userId,
        status: 'active',
        messages: [],
        createdAt: new Date(),
      },
    })
    actualConversationId = newConversation.id
  }

  // 2. Route to appropriate agent
  const route = await routeTaskToAgent(content, projectId, agentId, departmentSlug)

  console.log('[TaskHandler] Routed to agent:', route.agentId)

  // 3. Initialize agent runner
  const apiKey = process.env.CODEBUFF_API_KEY || process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    throw new Error('CODEBUFF_API_KEY or OPENROUTER_API_KEY required')
  }

  const runner = new AladdinAgentRunner(apiKey, payload)

  // 4. Execute agent
  const context: AgentExecutionContext = {
    projectId,
    conversationId: actualConversationId,
    metadata: {
      initiatedBy: userId,
      mode: 'task',
    },
  }

  // Track progress
  const taskProgress: TaskProgress = {
    taskId: `task-${Date.now()}`,
    status: 'running',
    steps: [
      {
        id: 'step-1',
        name: 'Initializing agent',
        status: 'complete',
      },
      {
        id: 'step-2',
        name: 'Executing task',
        status: 'running',
      },
    ],
    currentStep: 1,
    progress: 50,
  }

  // Execute with event handler for real-time updates
  const result = await runner.executeAgent(
    route.agentId,
    content,
    context,
    async (event: any) => {
      // Handle real-time events (will implement in Phase 5)
      console.log('[TaskHandler] Agent event:', event)
    }
  )

  // 5. Update progress
  taskProgress.status = result.error ? 'failed' : 'complete'
  taskProgress.steps.push({
    id: 'step-3',
    name: 'Task completed',
    status: result.error ? 'failed' : 'complete',
    qualityScore: result.qualityScore,
  })
  taskProgress.currentStep = 2
  taskProgress.progress = 100
  taskProgress.overallQuality = result.qualityScore

  // 6. Format output message
  const outputMessage = typeof result.output === 'string'
    ? result.output
    : JSON.stringify(result.output, null, 2)

  const message = result.error
    ? `Task failed: ${result.error.message}`
    : `Task completed successfully!\n\n${outputMessage}`

  // 7. Save to conversation
  try {
    await payload.update({
      collection: 'conversations',
      id: actualConversationId,
      data: {
        messages: {
          // @ts-ignore
          append: [
            {
              id: `msg-${Date.now()}-user`,
              role: 'user',
              content,
              timestamp: new Date(),
            },
            {
              id: `msg-${Date.now()}-assistant`,
              role: 'assistant',
              content: message,
              timestamp: new Date(),
              agentId: route.agentId,
            },
          ],
        },
        lastMessageAt: new Date(),
        updatedAt: new Date(),
      },
    })
  } catch (saveError) {
    console.error('[TaskHandler] Failed to save conversation:', saveError)
  }

  // 8. Return result
  return {
    conversationId: actualConversationId,
    taskId: taskProgress.taskId,
    message,
    progress: taskProgress,
    executionId: result.executionId,
  }
}
```

#### Step 3.2: Update Task API Route

**File**: `src/app/api/v1/orchestrator/task/route.ts`

```typescript
/**
 * Task Mode API Route
 * Handles task execution requests with @codebuff/sdk
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { handleTask } from '@/lib/orchestrator/taskHandler'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Increase timeout for task execution
export const maxDuration = 300 // 5 minutes

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const payload = await getPayload({ config: await configPromise })
    const { user } = await payload.auth({ req: request as any })

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'AUTH_REQUIRED' },
        { status: 401 }
      )
    }

    // 2. Parse request
    const body = await request.json()
    const {
      content,
      projectId,
      conversationId,
      agentId,
      departmentSlug,
    } = body

    if (!content || !projectId) {
      return NextResponse.json(
        { error: 'Missing required fields', code: 'VALIDATION_ERROR' },
        { status: 400 }
      )
    }

    console.log('[Task API] Processing task:', {
      projectId,
      conversationId,
      agentId,
      departmentSlug,
    })

    // 3. Validate project access
    const project = await payload.findByID({
      collection: 'projects',
      id: projectId,
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found', code: 'PROJECT_NOT_FOUND' },
        { status: 404 }
      )
    }

    // 4. Handle task
    const result = await handleTask({
      content,
      projectId,
      conversationId,
      userId: user.id,
      agentId,
      departmentSlug,
    })

    // 5. Return response
    return NextResponse.json({
      success: true,
      conversationId: result.conversationId,
      taskId: result.taskId,
      message: result.message,
      progress: result.progress,
      executionId: result.executionId,
    })
  } catch (error: any) {
    console.error('[Task API] Error:', error)

    return NextResponse.json(
      {
        error: error.message || 'Internal server error',
        code: 'TASK_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}
```

### Testing Task Mode

```bash
# Test task endpoint
curl -X POST http://localhost:3000/api/v1/orchestrator/task \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Create a dramatic opening scene for Maya",
    "projectId": "proj-123",
    "conversationId": null
  }'

# Expected response:
{
  "success": true,
  "conversationId": "conv-1234567890",
  "taskId": "task-1234567890",
  "message": "Task completed successfully!\n\n[Agent output here...]",
  "progress": {
    "taskId": "task-1234567890",
    "status": "complete",
    "steps": [...],
    "currentStep": 2,
    "progress": 100,
    "overallQuality": 0.92
  },
  "executionId": "exec-abc123"
}
```

---

## Phase 4: Data Mode

### Purpose
Ingest data into Gather MongoDB with AI enrichment, duplicate detection, and conflict resolution.

### Implementation Steps

#### Step 4.1: Create Data Handler

**File**: `src/lib/orchestrator/dataHandler.ts`

```typescript
/**
 * Data Mode Handler
 * Handles data ingestion into Gather with AI enrichment
 */

import { getLLMClient } from '@/lib/llm/client'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { MongoClient, ObjectId } from 'mongodb'

export interface DataHandlerOptions {
  content: string | object
  projectId: string
  conversationId?: string
  userId: string
  imageUrl?: string
  documentUrl?: string
}

export interface DataHandlerResult {
  conversationId: string
  gatherItemId: string
  message: string
  summary: string
  context: string
  duplicates: Array<{
    id: string
    similarity: number
    suggestion: 'skip' | 'merge' | 'review'
  }>
}

/**
 * Get Gather MongoDB connection
 */
async function getGatherDatabase(projectId: string) {
  const mongoUrl = process.env.DATABASE_URI
  if (!mongoUrl) {
    throw new Error('DATABASE_URI not configured')
  }

  const client = await MongoClient.connect(mongoUrl)
  const dbName = `aladdin-gather-${projectId}`
  return client.db(dbName)
}

/**
 * Check for duplicates using Brain semantic search
 */
async function checkDuplicates(
  content: any,
  summary: string,
  projectId: string
): Promise<Array<{ id: string; similarity: number; suggestion: string }>> {
  // TODO: Implement Brain semantic search
  // For now, return empty array
  console.log('[DataHandler] Checking duplicates for:', summary)
  return []
}

/**
 * Enrich content with AI (max 3 iterations)
 */
async function enrichContent(
  content: any,
  projectId: string,
  maxIterations: number = 3
): Promise<{ enrichedContent: any; iterationCount: number }> {
  const llmClient = getLLMClient()
  let currentContent = content
  let iterationCount = 0

  for (let i = 0; i < maxIterations; i++) {
    iterationCount++

    const contentStr = typeof currentContent === 'string'
      ? currentContent
      : JSON.stringify(currentContent)

    const prompt = `Analyze this content and determine if it needs enrichment:

Content:
${contentStr}

If this content is complete and well-structured, respond with:
{ "isComplete": true, "content": <original content> }

If it needs enrichment, respond with:
{ "isComplete": false, "content": <enriched content with additional details> }

Your response must be valid JSON.`

    const response = await llmClient.completeJSON<{
      isComplete: boolean
      content: any
    }>(prompt, {
      temperature: 0.4,
      maxTokens: 1500,
    })

    currentContent = response.content

    if (response.isComplete) {
      break
    }
  }

  return {
    enrichedContent: currentContent,
    iterationCount,
  }
}

/**
 * Generate summary (100 chars, not editable)
 */
async function generateSummary(content: any): Promise<string> {
  const llmClient = getLLMClient()

  const contentStr = typeof content === 'string'
    ? content
    : JSON.stringify(content)

  const prompt = `Generate a concise summary (~100 characters) of this content:

${contentStr}

Return ONLY the summary text, no explanations.`

  const summary = await llmClient.complete(prompt, {
    temperature: 0.3,
    maxTokens: 50,
  })

  return summary.trim().substring(0, 150) // Cap at 150 chars
}

/**
 * Generate context paragraph
 */
async function generateContext(
  content: any,
  projectId: string
): Promise<string> {
  const llmClient = getLLMClient()

  const contentStr = typeof content === 'string'
    ? content
    : JSON.stringify(content)

  // TODO: Get project context from Brain
  const projectContext = 'Movie production project'

  const prompt = `Generate a detailed context paragraph explaining this content in relation to the project:

Project: ${projectContext}
Content: ${contentStr}

Provide a comprehensive paragraph (2-3 sentences) explaining the relevance and relationships.`

  const context = await llmClient.complete(prompt, {
    temperature: 0.4,
    maxTokens: 300,
  })

  return context.trim()
}

/**
 * Handle data ingestion
 */
export async function handleData(
  options: DataHandlerOptions
): Promise<DataHandlerResult> {
  const {
    content,
    projectId,
    conversationId,
    userId,
    imageUrl,
    documentUrl,
  } = options

  const payload = await getPayload({ config: await configPromise })

  // 1. Create or load conversation
  let actualConversationId = conversationId

  if (!actualConversationId) {
    const newConversation = await payload.create({
      collection: 'conversations',
      data: {
        name: `Data - ${new Date().toISOString()}`,
        project: projectId,
        user: userId,
        status: 'active',
        messages: [],
        createdAt: new Date(),
      },
    })
    actualConversationId = newConversation.id
  }

  // 2. Enrich content
  console.log('[DataHandler] Enriching content...')
  const { enrichedContent, iterationCount } = await enrichContent(
    content,
    projectId
  )

  // 3. Generate summary
  console.log('[DataHandler] Generating summary...')
  const summary = await generateSummary(enrichedContent)

  // 4. Generate context
  console.log('[DataHandler] Generating context...')
  const context = await generateContext(enrichedContent, projectId)

  // 5. Check duplicates
  console.log('[DataHandler] Checking duplicates...')
  const duplicates = await checkDuplicates(enrichedContent, summary, projectId)

  // 6. Save to Gather MongoDB
  const gatherDb = await getGatherDatabase(projectId)
  const gatherCollection = gatherDb.collection('gather')

  const gatherItem = {
    projectId,
    lastUpdated: new Date(),
    content: JSON.stringify(enrichedContent),
    imageUrl,
    documentUrl,
    summary,
    context,
    extractedText: null, // TODO: Extract from images/PDFs
    duplicateCheckScore: duplicates.length > 0 ? duplicates[0].similarity : null,
    iterationCount,
    createdAt: new Date(),
    createdBy: userId,
  }

  const insertResult = await gatherCollection.insertOne(gatherItem)
  const gatherItemId = insertResult.insertedId.toString()

  console.log('[DataHandler] Saved to Gather:', gatherItemId)

  // 7. Format response message
  const message = duplicates.length > 0
    ? `Data ingested with ${duplicates.length} potential duplicates found. Review recommended.`
    : `Data successfully ingested and enriched (${iterationCount} iterations).`

  // 8. Save to conversation
  try {
    await payload.update({
      collection: 'conversations',
      id: actualConversationId,
      data: {
        messages: {
          // @ts-ignore
          append: [
            {
              id: `msg-${Date.now()}-user`,
              role: 'user',
              content: typeof content === 'string' ? content : JSON.stringify(content),
              timestamp: new Date(),
            },
            {
              id: `msg-${Date.now()}-assistant`,
              role: 'assistant',
              content: message,
              timestamp: new Date(),
            },
          ],
        },
        lastMessageAt: new Date(),
        updatedAt: new Date(),
      },
    })
  } catch (saveError) {
    console.error('[DataHandler] Failed to save conversation:', saveError)
  }

  // 9. Return result
  return {
    conversationId: actualConversationId,
    gatherItemId,
    message,
    summary,
    context,
    duplicates,
  }
}
```

#### Step 4.2: Update Data API Route

**File**: `src/app/api/v1/orchestrator/data/route.ts`

```typescript
/**
 * Data Mode API Route
 * Handles data ingestion requests with Gather integration
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { handleData } from '@/lib/orchestrator/dataHandler'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const payload = await getPayload({ config: await configPromise })
    const { user } = await payload.auth({ req: request as any })

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'AUTH_REQUIRED' },
        { status: 401 }
      )
    }

    // 2. Parse request
    const body = await request.json()
    const {
      content,
      projectId,
      conversationId,
      imageUrl,
      documentUrl,
    } = body

    if (!content || !projectId) {
      return NextResponse.json(
        { error: 'Missing required fields', code: 'VALIDATION_ERROR' },
        { status: 400 }
      )
    }

    console.log('[Data API] Processing data ingestion:', {
      projectId,
      conversationId,
      hasImage: !!imageUrl,
      hasDocument: !!documentUrl,
    })

    // 3. Validate project access
    const project = await payload.findByID({
      collection: 'projects',
      id: projectId,
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found', code: 'PROJECT_NOT_FOUND' },
        { status: 404 }
      )
    }

    // 4. Handle data ingestion
    const result = await handleData({
      content,
      projectId,
      conversationId,
      userId: user.id,
      imageUrl,
      documentUrl,
    })

    // 5. Return response
    return NextResponse.json({
      success: true,
      conversationId: result.conversationId,
      gatherItemId: result.gatherItemId,
      message: result.message,
      summary: result.summary,
      context: result.context,
      duplicates: result.duplicates,
    })
  } catch (error: any) {
    console.error('[Data API] Error:', error)

    return NextResponse.json(
      {
        error: error.message || 'Internal server error',
        code: 'DATA_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}
```

### Testing Data Mode

```bash
# Test data endpoint
curl -X POST http://localhost:3000/api/v1/orchestrator/data \
  -H "Content-Type: application/json" \
  -d '{
    "content": {
      "name": "Maya",
      "age": 28,
      "occupation": "Scientist"
    },
    "projectId": "proj-123",
    "conversationId": null
  }'

# Expected response:
{
  "success": true,
  "conversationId": "conv-1234567890",
  "gatherItemId": "6789abcdef123456",
  "message": "Data successfully ingested and enriched (2 iterations).",
  "summary": "Character profile for Maya, 28-year-old scientist with expertise in quantum physics",
  "context": "Maya is a key character in the movie production project, serving as the protagonist...",
  "duplicates": []
}
```

---

## Phase 5: Streaming Implementation

### Purpose
Implement Server-Sent Events (SSE) for real-time token streaming across all modes.

### Implementation Steps

#### Step 5.1: Create Streaming Utility

**File**: `src/lib/orchestrator/streaming.ts`

```typescript
/**
 * Streaming Utilities
 * Server-Sent Events (SSE) implementation for real-time updates
 */

export interface StreamMessage {
  type: 'token' | 'complete' | 'error' | 'progress'
  data: any
  timestamp: number
}

/**
 * Create SSE response stream
 */
export function createSSEStream(): {
  stream: ReadableStream
  send: (message: StreamMessage) => void
  close: () => void
} {
  let controller: ReadableStreamDefaultController | null = null

  const stream = new ReadableStream({
    start(ctrl) {
      controller = ctrl
    },
    cancel() {
      controller = null
    },
  })

  const send = (message: StreamMessage) => {
    if (!controller) return

    const data = JSON.stringify(message)
    const chunk = `data: ${data}\n\n`

    controller.enqueue(new TextEncoder().encode(chunk))
  }

  const close = () => {
    if (controller) {
      controller.close()
      controller = null
    }
  }

  return { stream, send, close }
}

/**
 * Stream LLM tokens in real-time
 */
export async function streamLLMTokens(
  messages: any[],
  options: {
    onToken: (token: string) => void
    onComplete: (fullText: string) => void
    onError: (error: Error) => void
    model?: string
    temperature?: number
    maxTokens?: number
  }
): Promise<void> {
  const {
    onToken,
    onComplete,
    onError,
    model = process.env.OPENROUTER_DEFAULT_MODEL,
    temperature = 0.7,
    maxTokens = 2000,
  } = options

  try {
    const response = await fetch(
      `${process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1'}/chat/completions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        },
        body: JSON.stringify({
          model,
          messages,
          temperature,
          max_tokens: maxTokens,
          stream: true, // Enable streaming
        }),
      }
    )

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.statusText}`)
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('No response body reader')
    }

    const decoder = new TextDecoder()
    let fullText = ''

    while (true) {
      const { done, value } = await reader.read()

      if (done) {
        onComplete(fullText)
        break
      }

      const chunk = decoder.decode(value, { stream: true })
      const lines = chunk.split('\n').filter((line) => line.trim() !== '')

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)

          if (data === '[DONE]') {
            onComplete(fullText)
            return
          }

          try {
            const parsed = JSON.parse(data)
            const token = parsed.choices?.[0]?.delta?.content

            if (token) {
              fullText += token
              onToken(token)
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    }
  } catch (error) {
    onError(error as Error)
  }
}
```

#### Step 5.2: Update Stream API Route

**File**: `src/app/api/orchestrator/stream/route.ts`

```typescript
/**
 * Streaming API Route
 * Server-Sent Events (SSE) for real-time updates
 */

import { NextRequest } from 'next/server'
import { createSSEStream, streamLLMTokens } from '@/lib/orchestrator/streaming'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const conversationId = searchParams.get('conversationId')
  const mode = searchParams.get('mode') as 'chat' | 'query' | 'task' | 'data'

  if (!conversationId || !mode) {
    return new Response('Missing conversationId or mode', { status: 400 })
  }

  // Create SSE stream
  const { stream, send, close } = createSSEStream()

  // Set SSE headers
  const headers = new Headers({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no', // Disable nginx buffering
  })

  // Start streaming in background
  ;(async () => {
    try {
      const payload = await getPayload({ config: await configPromise })

      // Load conversation
      const conversation = await payload.findByID({
        collection: 'conversations',
        id: conversationId,
      })

      if (!conversation) {
        send({
          type: 'error',
          data: { message: 'Conversation not found' },
          timestamp: Date.now(),
        })
        close()
        return
      }

      // Get messages
      const messages = conversation.messages || []
      const lastUserMessage = messages
        .filter((msg: any) => msg.role === 'user')
        .pop()

      if (!lastUserMessage) {
        send({
          type: 'error',
          data: { message: 'No user message found' },
          timestamp: Date.now(),
        })
        close()
        return
      }

      // Build LLM messages
      const llmMessages = messages.map((msg: any) => ({
        role: msg.role,
        content: msg.content,
      }))

      // Stream tokens
      await streamLLMTokens(llmMessages, {
        onToken: (token) => {
          send({
            type: 'token',
            data: { token },
            timestamp: Date.now(),
          })
        },
        onComplete: (fullText) => {
          send({
            type: 'complete',
            data: { message: fullText },
            timestamp: Date.now(),
          })
          close()
        },
        onError: (error) => {
          send({
            type: 'error',
            data: { message: error.message },
            timestamp: Date.now(),
          })
          close()
        },
      })
    } catch (error: any) {
      send({
        type: 'error',
        data: { message: error.message },
        timestamp: Date.now(),
      })
      close()
    }
  })()

  return new Response(stream, { headers })
}
```

#### Step 5.3: Update Streaming Hook

**File**: `src/hooks/orchestrator/useStreamingResponse.ts` (Update existing)

```typescript
/**
 * useStreamingResponse Hook
 * Connects to SSE stream for real-time updates
 */

import { useEffect, useRef } from 'use'
import { useOrchestratorStore } from '@/stores/orchestratorStore'
import { useLayoutStore } from '@/stores/layoutStore'

export function useStreamingResponse(conversationId: string | null) {
  const eventSourceRef = useRef<EventSource | null>(null)
  const {
    updateStreamingMessage,
    addMessage,
    setIsStreaming,
    currentMode,
  } = useOrchestratorStore()
  const { orchestratorMode } = useLayoutStore()

  useEffect(() => {
    if (!conversationId) return

    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    // Create new SSE connection
    const url = `/api/orchestrator/stream?conversationId=${conversationId}&mode=${orchestratorMode}`
    const eventSource = new EventSource(url)

    eventSource.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)

        switch (message.type) {
          case 'token':
            // Append token to streaming message
            updateStreamingMessage(message.data.token)
            break

          case 'complete':
            // Add complete message to store
            addMessage({
              id: `msg-${Date.now()}-assistant`,
              role: 'assistant',
              content: message.data.message,
              timestamp: new Date(),
              mode: orchestratorMode,
            })
            setIsStreaming(false)
            eventSource.close()
            break

          case 'error':
            // Handle error
            console.error('[SSE] Error:', message.data.message)
            addMessage({
              id: `msg-${Date.now()}-error`,
              role: 'assistant',
              content: `Error: ${message.data.message}`,
              timestamp: new Date(),
              mode: orchestratorMode,
            })
            setIsStreaming(false)
            eventSource.close()
            break

          case 'progress':
            // Update task progress (for Task mode)
            // TODO: Update task progress in store
            break
        }
      } catch (error) {
        console.error('[SSE] Parse error:', error)
      }
    }

    eventSource.onerror = (error) => {
      console.error('[SSE] Connection error:', error)
      setIsStreaming(false)
      eventSource.close()
    }

    eventSourceRef.current = eventSource

    // Cleanup on unmount
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
    }
  }, [conversationId, orchestratorMode])
}
```

### Testing Streaming

```bash
# Test SSE stream
curl -N http://localhost:3000/api/orchestrator/stream?conversationId=conv-123&mode=chat

# Expected output (Server-Sent Events):
data: {"type":"token","data":{"token":"A"},"timestamp":1234567890}

data: {"type":"token","data":{"token":" good"},"timestamp":1234567891}

data: {"type":"token","data":{"token":" plot"},"timestamp":1234567892}

data: {"type":"complete","data":{"message":"A good plot twist should..."},"timestamp":1234567893}
```

---

## Error Handling & Resilience

### Error Types

```typescript
export enum ErrorCode {
  // Authentication
  AUTH_REQUIRED = 'AUTH_REQUIRED',
  AUTH_INVALID = 'AUTH_INVALID',

  // Validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  MISSING_FIELDS = 'MISSING_FIELDS',

  // Resources
  PROJECT_NOT_FOUND = 'PROJECT_NOT_FOUND',
  AGENT_NOT_FOUND = 'AGENT_NOT_FOUND',
  CONVERSATION_NOT_FOUND = 'CONVERSATION_NOT_FOUND',

  // External Services
  LLM_ERROR = 'LLM_ERROR',
  BRAIN_ERROR = 'BRAIN_ERROR',
  CODEBUFF_ERROR = 'CODEBUFF_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',

  // Rate Limits
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  TOKEN_LIMIT_EXCEEDED = 'TOKEN_LIMIT_EXCEEDED',

  // Internal
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}
```

### Error Handler

**File**: `src/lib/orchestrator/errorHandler.ts`

```typescript
/**
 * Centralized Error Handling
 */

export interface OrchestratorError {
  code: string
  message: string
  details?: any
  stack?: string
  retryable: boolean
}

export function handleOrchestratorError(error: any): OrchestratorError {
  // LLM errors
  if (error.message?.includes('OpenRouter') || error.message?.includes('API')) {
    return {
      code: 'LLM_ERROR',
      message: 'AI service temporarily unavailable. Please try again.',
      details: error.message,
      retryable: true,
    }
  }

  // Brain errors
  if (error.message?.includes('Brain') || error.message?.includes('Neo4j')) {
    return {
      code: 'BRAIN_ERROR',
      message: 'Knowledge base unavailable. Some features may be limited.',
      details: error.message,
      retryable: true,
    }
  }

  // Agent errors
  if (error.message?.includes('Agent') || error.message?.includes('Codebuff')) {
    return {
      code: 'CODEBUFF_ERROR',
      message: 'Agent execution failed. Please try again.',
      details: error.message,
      retryable: true,
    }
  }

  // Database errors
  if (error.message?.includes('MongoDB') || error.message?.includes('database')) {
    return {
      code: 'DATABASE_ERROR',
      message: 'Database temporarily unavailable. Please try again.',
      details: error.message,
      retryable: true,
    }
  }

  // Default
  return {
    code: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred. Please try again.',
    details: error.message,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    retryable: false,
  }
}
```

### Retry Logic

```typescript
/**
 * Retry failed operations with exponential backoff
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number
    initialDelay?: number
    maxDelay?: number
    shouldRetry?: (error: any) => boolean
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    shouldRetry = (error) => handleOrchestratorError(error).retryable,
  } = options

  let lastError: any

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error

      if (attempt === maxRetries - 1 || !shouldRetry(error)) {
        throw error
      }

      const delay = Math.min(initialDelay * Math.pow(2, attempt), maxDelay)
      console.log(`[Retry] Attempt ${attempt + 1} failed, retrying in ${delay}ms...`)

      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  throw lastError
}
```

---

## Testing Strategy

### Unit Tests

```typescript
// File: tests/orchestrator/chatHandler.test.ts

import { describe, it, expect, vi } from 'vitest'
import { handleChat } from '@/lib/orchestrator/chatHandler'

describe('ChatHandler', () => {
  it('should handle general chat request', async () => {
    const result = await handleChat({
      content: 'What is a plot twist?',
      userId: 'user-123',
    })

    expect(result).toHaveProperty('conversationId')
    expect(result).toHaveProperty('message')
    expect(result.message).toContain('plot twist')
  })

  it('should generate contextual suggestions', async () => {
    const result = await handleChat({
      content: 'Explain the hero journey',
      userId: 'user-123',
    })

    expect(result.suggestions).toBeInstanceOf(Array)
    expect(result.suggestions.length).toBeLessThanOrEqual(3)
  })

  it('should persist conversation to database', async () => {
    const result = await handleChat({
      content: 'Test message',
      userId: 'user-123',
    })

    // Verify conversation exists
    const conversation = await payload.findByID({
      collection: 'conversations',
      id: result.conversationId,
    })

    expect(conversation).toBeDefined()
    expect(conversation.messages.length).toBeGreaterThan(0)
  })
})
```

### Integration Tests

```typescript
// File: tests/orchestrator/integration.test.ts

import { describe, it, expect } from 'vitest'

describe('Orchestrator Integration', () => {
  it('should complete full chat workflow', async () => {
    // 1. Send message
    const response = await fetch('/api/v1/orchestrator/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: 'What is a plot twist?',
      }),
    })

    expect(response.ok).toBe(true)

    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.conversationId).toBeDefined()

    // 2. Connect to stream
    const eventSource = new EventSource(
      `/api/orchestrator/stream?conversationId=${data.conversationId}&mode=chat`
    )

    // 3. Verify streaming
    const tokens: string[] = []

    await new Promise((resolve, reject) => {
      eventSource.onmessage = (event) => {
        const message = JSON.parse(event.data)

        if (message.type === 'token') {
          tokens.push(message.data.token)
        } else if (message.type === 'complete') {
          eventSource.close()
          resolve(true)
        }
      }

      eventSource.onerror = reject
    })

    expect(tokens.length).toBeGreaterThan(0)
  })
})
```

### E2E Tests (Playwright)

```typescript
// File: tests/e2e/orchestrator.spec.ts

import { test, expect } from '@playwright/test'

test.describe('AI Chat Orchestrator', () => {
  test('should complete chat conversation', async ({ page }) => {
    // 1. Open chat
    await page.goto('/dashboard/project/test-project/gather')
    await page.click('[data-testid="ai-chat-toggle"]')

    // 2. Switch to Chat mode
    await page.click('text=Chat')

    // 3. Type message
    await page.fill('textarea[placeholder*="Ask"]', 'What is a plot twist?')
    await page.keyboard.press('Enter')

    // 4. Wait for response
    await page.waitForSelector('[data-testid="assistant-message"]', {
      timeout: 30000,
    })

    // 5. Verify response
    const response = await page.textContent('[data-testid="assistant-message"]')
    expect(response).toContain('plot twist')
  })

  test('should query project Brain', async ({ page }) => {
    await page.goto('/dashboard/project/test-project/gather')
    await page.click('[data-testid="ai-chat-toggle"]')

    await page.click('text=Query')
    await page.fill('textarea', 'Find characters')
    await page.keyboard.press('Enter')

    // Wait for entity cards
    await page.waitForSelector('[data-testid="entity-card"]')

    const cards = await page.$$('[data-testid="entity-card"]')
    expect(cards.length).toBeGreaterThan(0)
  })
})
```

---

## Deployment Checklist

### Environment Variables

```bash
# .env.production

# LLM Configuration
OPENROUTER_API_KEY=sk-or-v1-xxx
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_DEFAULT_MODEL=anthropic/claude-sonnet-4.5
OPENROUTER_BACKUP_MODEL=qwen/qwen3-vl-235b-a22b-thinking
OPENROUTER_VISION_MODE=google/gemini-2.5-flash

# Agent Configuration
CODEBUFF_API_KEY=your-codebuff-key

# Database
DATABASE_URI=mongodb://user:pass@host:27017/aladdin

# Brain MCP
BRAIN_SERVICE_URL=https://brain.ft.tc
BRAIN_API_KEY=your-brain-key

# Application
NEXT_PUBLIC_APP_URL=https://your-app.com
NODE_ENV=production
```

### Pre-Deployment Tests

```bash
# 1. Run unit tests
npm run test:unit

# 2. Run integration tests
npm run test:int

# 3. Run E2E tests
npm run test:e2e

# 4. Type checking
npm run typecheck

# 5. Linting
npm run lint

# 6. Build
npm run build
```

### Deployment Steps

1. **Build & Test**
   ```bash
   npm run build
   npm run test
   ```

2. **Database Migration**
   ```bash
   # Ensure Conversations collection exists
   npm run db:migrate
   ```

3. **Deploy**
   ```bash
   # Deploy to your hosting platform
   vercel deploy --prod
   # or
   npm run deploy
   ```

4. **Verify**
   ```bash
   # Test endpoints
   curl https://your-app.com/api/v1/orchestrator/chat -X POST \
     -H "Content-Type: application/json" \
     -d '{"content":"test"}'
   ```

5. **Monitor**
   - Check logs for errors
   - Monitor API response times
   - Track LLM token usage
   - Monitor SSE connection stability

### Performance Metrics

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| API Response Time (p95) | <500ms | >1000ms |
| SSE Connection Success Rate | >99% | <95% |
| LLM Token Usage (daily) | <1M tokens | >2M tokens |
| Error Rate | <1% | >5% |
| Conversation Save Success | >99% | <95% |

---

## Appendix

### File Structure Summary

```
src/
├── lib/
│   └── orchestrator/
│       ├── chatHandler.ts          # ✅ CREATE
│       ├── queryHandler.ts         # ✅ CREATE
│       ├── taskHandler.ts          # ✅ CREATE
│       ├── dataHandler.ts          # ✅ CREATE
│       ├── streaming.ts            # ✅ CREATE
│       └── errorHandler.ts         # ✅ CREATE
│
├── app/api/v1/orchestrator/
│   ├── chat/route.ts              # ✅ UPDATE
│   ├── query/route.ts             # ✅ UPDATE
│   ├── task/route.ts              # ✅ UPDATE
│   └── data/route.ts              # ✅ UPDATE
│
├── app/api/orchestrator/
│   └── stream/route.ts            # ✅ UPDATE
│
├── hooks/orchestrator/
│   ├── useOrchestratorChat.ts     # ✅ UPDATE
│   └── useStreamingResponse.ts    # ✅ UPDATE
│
└── components/layout/RightOrchestrator/
    └── modes/
        └── ChatMode.tsx           # ✅ UPDATE
```

### API Endpoint Reference

| Endpoint | Method | Purpose | Request | Response |
|----------|--------|---------|---------|----------|
| `/api/v1/orchestrator/chat` | POST | General chat | `{content, conversationId?}` | `{conversationId, message, suggestions}` |
| `/api/v1/orchestrator/query` | POST | Brain search | `{content, projectId, conversationId?}` | `{conversationId, message, results[]}` |
| `/api/v1/orchestrator/task` | POST | Agent execution | `{content, projectId, agentId?, conversationId?}` | `{conversationId, taskId, progress}` |
| `/api/v1/orchestrator/data` | POST | Data ingestion | `{content, projectId, conversationId?}` | `{conversationId, gatherItemId, duplicates[]}` |
| `/api/orchestrator/stream` | GET | SSE streaming | Query: `conversationId, mode` | Server-Sent Events |

### Environment Variables Reference

```bash
# Required
OPENROUTER_API_KEY=              # OpenRouter API key
DATABASE_URI=                     # MongoDB connection string

# Optional (with defaults)
OPENROUTER_BASE_URL=             # Default: https://openrouter.ai/api/v1
OPENROUTER_DEFAULT_MODEL=        # Default: anthropic/claude-sonnet-4.5
OPENROUTER_BACKUP_MODEL=         # Default: qwen/qwen3-vl-235b-a22b-thinking
OPENROUTER_VISION_MODE=          # Default: google/gemini-2.5-flash
CODEBUFF_API_KEY=                # Required for Task mode
BRAIN_SERVICE_URL=               # Required for Query mode
NEXT_PUBLIC_APP_URL=             # Required for production
```

---

**Document Version**: 1.0
**Last Updated**: January 2025
**Status**: ✅ Implementation Ready
**Estimated Implementation Time**: 28-38 hours (~1 week)

---

## Quick Start Commands

```bash
# 1. Install dependencies (if needed)
npm install

# 2. Set environment variables
cp .env.example .env
# Edit .env with your keys

# 3. Run development server
npm run dev

# 4. Test endpoints
curl http://localhost:3000/api/v1/orchestrator/chat -X POST \
  -H "Content-Type: application/json" \
  -d '{"content":"Hello"}'

# 5. Monitor logs
tail -f .next/server/logs/orchestrator.log
```

---

**Ready to implement!** 🚀
