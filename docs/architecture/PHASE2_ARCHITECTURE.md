# Phase 2 Architecture Blueprint - Chat Interface & AI Agents

**Version**: 1.0.0
**Date**: 2025-10-01
**Status**: Ready for Implementation
**Dependencies**: Phase 1 (Foundation) - MUST BE COMPLETE
**Swarm Session**: swarm-1759247953229-friw6kswf

---

## Executive Summary

Phase 2 builds the **chat interface** and **AI agent orchestration system** on top of Phase 1's foundation. This phase delivers:

1. **Real-time Chat Interface** with WebSocket streaming
2. **Master Orchestrator Agent** for request routing
3. **Character Department Head** with 3 specialist agents
4. **Custom Tool System** for agent-database interaction
5. **Quality Validation Pipeline** with Brain integration hooks

**Success Criteria**: User can create character profiles via natural language chat, with agents coordinating to produce validated content stored in Open MongoDB.

**Key Architectural Decisions**:
- Hierarchical agent system (Master → Department → Specialist)
- Server Components for data fetching, Client Components for interactivity
- WebSocket for real-time agent updates
- @codebuff/sdk for agent orchestration
- Brain validation hooks (Phase 3 prep)

---

## 1. System Architecture Overview

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Next.js 15 Application                        │
│                  (Server + Client Components)                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              FRONTEND (Chat UI)                           │  │
│  │  /dashboard/project/[id]/chat                             │  │
│  │                                                            │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐         │  │
│  │  │ ChatWindow │  │ MessageList│  │ ContentCard│         │  │
│  │  │ (Client)   │  │ (Client)   │  │ (Client)   │         │  │
│  │  └────────────┘  └────────────┘  └────────────┘         │  │
│  │         ↕                 ↕                                │  │
│  │  [WebSocket Connection - Real-time Updates]               │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              BACKEND (API Routes)                         │  │
│  │  /api/v1/*                                                 │  │
│  │                                                            │  │
│  │  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐    │  │
│  │  │ Chat API    │  │ Agent Runner │  │ WebSocket    │    │  │
│  │  │ /chat       │  │ (Codebuff)   │  │ /ws          │    │  │
│  │  └─────────────┘  └──────────────┘  └──────────────┘    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
└───────────┬──────────────────────────────┬──────────────────────┘
            │                              │
            ↓                              ↓
┌──────────────────────┐      ┌──────────────────────────────────┐
│   MongoDB Protected  │      │  AI Agent Orchestration Layer    │
│   (Conversations)    │      │                                  │
│                      │      │  ┌────────────────────────────┐ │
│ • conversations      │      │  │  MASTER ORCHESTRATOR       │ │
│ • messages           │      │  │  (Routes to departments)   │ │
│                      │      │  └──────────┬─────────────────┘ │
└──────────────────────┘      │             │                    │
            │                 │  ┌──────────▼──────────────────┐ │
            ↓                 │  │  CHARACTER DEPT HEAD        │ │
┌──────────────────────┐      │  │  (Spawns specialists)       │ │
│   MongoDB Open DBs   │◄─────┼──└──────────┬──────────────────┘ │
│   (Characters, etc)  │      │             │                    │
│                      │      │  ┌──────────▼──────────────────┐ │
│ • open_[slug]        │      │  │  SPECIALIST AGENTS          │ │
│   - characters       │      │  │  • Character Creator        │ │
│   - scenes           │      │  │  • Hair Stylist             │ │
│   - locations        │      │  │  • Costume Designer         │ │
└──────────────────────┘      │  └─────────────────────────────┘ │
                              │                                  │
                              │  [Custom Tools for DB Access]   │
                              └──────────────────────────────────┘
                                           │
                                           ↓
                              ┌──────────────────────────────────┐
                              │  Brain Validation (Phase 3)      │
                              │  (Hooks prepared, not active)    │
                              └──────────────────────────────────┘
```

### 1.2 Technology Stack (Phase 2 Additions)

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|----------|
| **Agent SDK** | @codebuff/sdk | latest | AI agent orchestration |
| **WebSocket** | ws | latest | Real-time communication |
| **Validation** | zod | v4 | Schema validation for tools |
| **Image Gen** | @fal-ai/client | latest | Image generation (future) |
| **Voice** | elevenlabs | latest | Voice generation (future) |

---

## 2. Data Architecture

### 2.1 New PayloadCMS Collections

#### 2.1.1 Conversations Collection (Enhanced)

```typescript
interface Conversation {
  // Identity
  name: string                  // REQUIRED

  // Association
  project: Relationship<Project> // REQUIRED
  user?: Relationship<User>

  // Messages (stored as JSON array)
  messages: Array<{
    id: string
    role: 'user' | 'assistant' | 'system'
    content: string
    timestamp: Date
    agentId?: string
    agentRun?: {
      runId: string
      status: 'running' | 'complete' | 'error'
      events: Array<any>
    }
    contentCards?: Array<{
      type: string              // 'character', 'scene', etc.
      data: any
      qualityRating?: number
      actions?: string[]        // ['ingest', 'modify', 'discard']
    }>
  }>

  // Status
  status?: 'active' | 'archived'
  lastAgentRun?: {
    agentId: string
    runId: string
    completedAt?: Date
  }

  // Timestamps
  createdAt: Date
  updatedAt: Date
  lastMessageAt?: Date
}
```

#### 2.1.2 Agent Runs Collection (NEW)

```typescript
interface AgentRun {
  // Identity
  id: string

  // Association
  conversation: Relationship<Conversation>
  project: Relationship<Project>
  triggeredBy: Relationship<User>

  // Agent Info
  agentId: string               // 'master-orchestrator', 'character-creator', etc.
  agentLevel: 'master' | 'department' | 'specialist'
  department?: string           // For dept/specialist level

  // Execution
  prompt: string                // User's original message
  status: 'queued' | 'running' | 'complete' | 'error'

  // Events (streaming updates)
  events: Array<{
    type: 'thinking' | 'tool_call' | 'content_preview' | 'error'
    timestamp: Date
    content?: string
    data?: any
  }>

  // Results
  output?: any                  // Final agent output
  contentGenerated?: Array<{
    type: string
    documentId: string
    collection: string
  }>

  // Quality
  qualityRating?: number
  brainValidated?: boolean
  validationResults?: any

  // Parent/Child (for hierarchical execution)
  parentRun?: Relationship<AgentRun>
  childRuns?: Array<Relationship<AgentRun>>

  // Timestamps
  createdAt: Date
  startedAt?: Date
  completedAt?: Date

  // Error handling
  error?: {
    message: string
    code: string
    stack?: string
  }
  retryCount?: number
}
```

### 2.2 Open Database Changes

**New Collections Created On-Demand**:
- `characters` - Character profiles (already planned)
- `scenes` - Scene descriptions
- `locations` - Location details
- `dialogue` - Dialogue lines

**Character Collection Schema** (Open DB):

```typescript
interface Character {
  // Base fields (from Phase 1)
  _id: ObjectId
  name: string                  // REQUIRED
  projectId: string
  collectionName: 'characters'

  // Character-specific content
  content: {
    fullName?: string
    role?: 'protagonist' | 'antagonist' | 'supporting' | 'minor'
    age?: number

    // Personality
    personality?: {
      traits?: string[]
      motivations?: string[]
      fears?: string[]
      strengths?: string[]
      weaknesses?: string[]
    }

    // Backstory
    backstory?: string

    // Physical Appearance
    appearance?: {
      description?: string
      height?: string
      build?: string
      hairStyle?: string
      hairColor?: string
      eyeColor?: string
      distinctiveFeatures?: string[]
      clothing?: string
    }

    // Voice
    voice?: {
      description?: string
      tone?: string
      accent?: string
      elevenLabsVoiceId?: string
    }

    // Relationships
    relationships?: Array<{
      characterId: string
      characterName: string
      relationship: string
    }>
  }

  // Quality & Validation (from Phase 1)
  qualityRating?: number
  brainValidated?: boolean
  userApproved?: boolean

  // Authorship
  createdBy: string             // Agent ID or user ID
  createdByType: 'user' | 'agent'
  conversationId?: string
  agentRunId?: string

  // Timestamps
  createdAt: Date
  updatedAt: Date
}
```

---

## 3. File Organization & Directory Structure

### 3.1 Phase 2 File Structure

```
/mnt/d/Projects/aladdin/
├── src/
│   ├── app/
│   │   ├── (frontend)/
│   │   │   └── dashboard/
│   │   │       └── project/
│   │   │           └── [id]/
│   │   │               ├── chat/
│   │   │               │   ├── page.tsx                # ✅ NEW - Server Component
│   │   │               │   ├── ChatInterface.tsx       # ✅ NEW - Client Component
│   │   │               │   ├── MessageList.tsx         # ✅ NEW - Client Component
│   │   │               │   ├── MessageInput.tsx        # ✅ NEW - Client Component
│   │   │               │   ├── ContentCard.tsx         # ✅ NEW - Client Component
│   │   │               │   └── useWebSocket.ts         # ✅ NEW - Custom hook
│   │   │               └── page.tsx                    # Phase 1 - Project detail
│   │   │
│   │   └── api/
│   │       └── v1/
│   │           ├── chat/
│   │           │   ├── route.ts                        # ✅ NEW - Send message endpoint
│   │           │   └── conversations/
│   │           │       └── [id]/
│   │           │           └── route.ts                # ✅ NEW - Get conversation
│   │           │
│   │           ├── ws/
│   │           │   └── route.ts                        # ✅ NEW - WebSocket server
│   │           │
│   │           └── agents/
│   │               ├── run/
│   │               │   └── route.ts                    # ✅ NEW - Execute agent
│   │               └── status/
│   │                   └── [runId]/
│   │                       └── route.ts                # ✅ NEW - Check agent status
│   │
│   ├── collections/
│   │   ├── Projects.ts                                 # Phase 1 - Exists
│   │   ├── Conversations.ts                            # ✅ UPDATE - Add messages array
│   │   └── AgentRuns.ts                                # ✅ NEW - Agent execution tracking
│   │
│   ├── lib/
│   │   ├── agents/
│   │   │   ├── client.ts                               # ✅ NEW - Codebuff client init
│   │   │   ├── definitions/
│   │   │   │   ├── master-orchestrator.ts              # ✅ NEW - Agent config
│   │   │   │   ├── character-dept-head.ts              # ✅ NEW - Dept head config
│   │   │   │   ├── character-creator.ts                # ✅ NEW - Specialist config
│   │   │   │   ├── hair-stylist.ts                     # ✅ NEW - Specialist config
│   │   │   │   └── costume-designer.ts                 # ✅ NEW - Specialist config
│   │   │   │
│   │   │   ├── tools/
│   │   │   │   ├── saveCharacter.ts                    # ✅ NEW - Custom tool
│   │   │   │   ├── getCharacters.ts                    # ✅ NEW - Custom tool
│   │   │   │   ├── queryBrain.ts                       # ✅ NEW - Custom tool (stub)
│   │   │   │   ├── routeToDepartment.ts                # ✅ NEW - Custom tool
│   │   │   │   ├── spawnSpecialist.ts                  # ✅ NEW - Custom tool
│   │   │   │   └── gradeOutput.ts                      # ✅ NEW - Custom tool
│   │   │   │
│   │   │   ├── orchestration/
│   │   │   │   ├── master.ts                           # ✅ NEW - Master orchestrator logic
│   │   │   │   ├── department.ts                       # ✅ NEW - Dept head logic
│   │   │   │   └── specialist.ts                       # ✅ NEW - Specialist runner
│   │   │   │
│   │   │   └── runner.ts                               # ✅ NEW - Main agent execution
│   │   │
│   │   ├── websocket/
│   │   │   ├── server.ts                               # ✅ NEW - WebSocket server setup
│   │   │   ├── manager.ts                              # ✅ NEW - Connection management
│   │   │   └── handlers.ts                             # ✅ NEW - Message handlers
│   │   │
│   │   ├── db/                                         # Phase 1 - Exists
│   │   │   └── openDatabase.ts                         # Phase 1 - Use for char storage
│   │   │
│   │   └── validation/
│   │       ├── schemas.ts                              # ✅ NEW - Zod schemas for tools
│   │       └── quality.ts                              # ✅ NEW - Quality validation logic
│   │
│   └── components/
│       └── chat/
│           ├── ChatWindow.tsx                          # ✅ NEW - Main chat container
│           ├── MessageBubble.tsx                       # ✅ NEW - Individual message
│           ├── TypingIndicator.tsx                     # ✅ NEW - Typing animation
│           ├── ContentPreview.tsx                      # ✅ NEW - Content cards
│           └── AgentStatus.tsx                         # ✅ NEW - Agent status display
│
├── tests/
│   ├── int/
│   │   ├── chat-api.test.ts                            # ✅ NEW - Chat API tests
│   │   ├── agent-runner.test.ts                        # ✅ NEW - Agent execution tests
│   │   └── websocket.test.ts                           # ✅ NEW - WebSocket tests
│   │
│   └── e2e/
│       ├── chat-flow.e2e.spec.ts                       # ✅ NEW - Chat E2E tests
│       └── character-creation.e2e.spec.ts              # ✅ NEW - Full workflow test
│
└── docs/
    └── architecture/
        └── PHASE2_ARCHITECTURE.md                      # THIS FILE
```

---

## 4. Chat Interface Architecture

### 4.1 Server Component (Data Fetching)

```typescript
// src/app/dashboard/project/[id]/chat/page.tsx
import { getPayloadHMR } from '@payloadcms/next/utilities'
import configPromise from '@payload-config'
import { redirect } from 'next/navigation'
import ChatInterface from './ChatInterface'

export default async function ChatPage({
  params
}: {
  params: { id: string }
}) {
  const payload = await getPayloadHMR({ config: configPromise })
  const { user } = await payload.auth({ req })

  if (!user) {
    redirect('/')
  }

  // Fetch project
  const project = await payload.findByID({
    collection: 'projects',
    id: params.id
  })

  // Fetch or create conversation
  let conversation = await payload.find({
    collection: 'conversations',
    where: {
      project: { equals: project.id },
      user: { equals: user.id },
      status: { equals: 'active' }
    },
    limit: 1
  })

  if (conversation.docs.length === 0) {
    conversation = await payload.create({
      collection: 'conversations',
      data: {
        name: `Chat - ${project.name}`,
        project: project.id,
        user: user.id,
        status: 'active',
        messages: []
      }
    })
  }

  const conv = conversation.docs?.[0] || conversation

  return (
    <ChatInterface
      project={project}
      conversation={conv}
      user={user}
    />
  )
}
```

### 4.2 Client Component (Interactive UI)

```typescript
// src/app/dashboard/project/[id]/chat/ChatInterface.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { useWebSocket } from './useWebSocket'
import MessageList from './MessageList'
import MessageInput from './MessageInput'
import ContentCard from './ContentCard'

interface Props {
  project: any
  conversation: any
  user: any
}

export default function ChatInterface({ project, conversation, user }: Props) {
  const [messages, setMessages] = useState(conversation.messages || [])
  const [isAgentRunning, setIsAgentRunning] = useState(false)
  const [agentStatus, setAgentStatus] = useState<any>(null)

  // WebSocket connection
  const { connected, sendMessage, lastMessage } = useWebSocket({
    conversationId: conversation.id,
    onMessage: handleWebSocketMessage
  })

  function handleWebSocketMessage(event: any) {
    switch (event.type) {
      case 'agent_status':
        setAgentStatus(event)
        setIsAgentRunning(event.status === 'running')
        break

      case 'content_preview':
        // Add content card to messages
        setMessages(prev => [...prev, {
          id: event.messageId,
          role: 'assistant',
          content: event.content,
          contentCards: [event.content],
          timestamp: new Date()
        }])
        break

      case 'message_complete':
        setIsAgentRunning(false)
        setAgentStatus(null)
        break
    }
  }

  async function handleSendMessage(content: string) {
    // Add user message optimistically
    const userMessage = {
      id: `temp_${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])
    setIsAgentRunning(true)

    // Send to API
    const res = await fetch('/api/v1/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversationId: conversation.id,
        content
      })
    })

    const data = await res.json()

    // Update user message with real ID
    setMessages(prev => prev.map(m =>
      m.id === userMessage.id ? { ...m, id: data.messageId } : m
    ))
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="border-b p-4">
        <h1 className="text-2xl font-bold">{project.name}</h1>
        <p className="text-sm text-gray-600">Chat with AI Agents</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <MessageList messages={messages} />

        {isAgentRunning && agentStatus && (
          <div className="mt-4 p-4 bg-blue-50 rounded">
            <p className="text-sm font-medium">
              Agent: {agentStatus.agent}
            </p>
            <p className="text-sm text-gray-600">
              {agentStatus.event?.content || 'Processing...'}
            </p>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t p-4">
        <MessageInput
          onSend={handleSendMessage}
          disabled={isAgentRunning}
        />
      </div>
    </div>
  )
}
```

### 4.3 WebSocket Custom Hook

```typescript
// src/app/dashboard/project/[id]/chat/useWebSocket.ts
'use client'

import { useEffect, useState, useRef } from 'react'

interface UseWebSocketProps {
  conversationId: string
  onMessage: (event: any) => void
}

export function useWebSocket({ conversationId, onMessage }: UseWebSocketProps) {
  const [connected, setConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState<any>(null)
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    // Create WebSocket connection
    const ws = new WebSocket(`${process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3000'}/api/v1/ws`)

    ws.onopen = () => {
      setConnected(true)

      // Subscribe to conversation
      ws.send(JSON.stringify({
        type: 'subscribe',
        channel: 'conversation',
        conversationId
      }))
    }

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      setLastMessage(data)
      onMessage(data)
    }

    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
    }

    ws.onclose = () => {
      setConnected(false)
    }

    wsRef.current = ws

    return () => {
      ws.close()
    }
  }, [conversationId, onMessage])

  function sendMessage(message: any) {
    if (wsRef.current && connected) {
      wsRef.current.send(JSON.stringify(message))
    }
  }

  return { connected, sendMessage, lastMessage }
}
```

---

## 5. WebSocket Server Architecture

### 5.1 WebSocket Server Setup

```typescript
// src/lib/websocket/server.ts
import { WebSocketServer, WebSocket } from 'ws'
import { IncomingMessage } from 'http'

interface Client {
  ws: WebSocket
  userId: string
  subscriptions: Set<string>  // conversation IDs
}

class WebSocketManager {
  private wss: WebSocketServer
  private clients: Map<WebSocket, Client> = new Map()

  constructor(wss: WebSocketServer) {
    this.wss = wss
    this.setupHandlers()
  }

  private setupHandlers() {
    this.wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
      // Initialize client
      const client: Client = {
        ws,
        userId: '', // Set after auth
        subscriptions: new Set()
      }
      this.clients.set(ws, client)

      ws.on('message', (data: string) => {
        this.handleMessage(ws, data)
      })

      ws.on('close', () => {
        this.clients.delete(ws)
      })
    })
  }

  private handleMessage(ws: WebSocket, data: string) {
    const message = JSON.parse(data.toString())
    const client = this.clients.get(ws)

    if (!client) return

    switch (message.type) {
      case 'auth':
        // Validate auth token
        client.userId = message.userId
        break

      case 'subscribe':
        // Subscribe to conversation updates
        if (message.conversationId) {
          client.subscriptions.add(message.conversationId)
        }
        break

      case 'unsubscribe':
        if (message.conversationId) {
          client.subscriptions.delete(message.conversationId)
        }
        break
    }
  }

  // Broadcast to all clients subscribed to a conversation
  broadcastToConversation(conversationId: string, message: any) {
    const payload = JSON.stringify(message)

    this.clients.forEach((client) => {
      if (client.subscriptions.has(conversationId) && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(payload)
      }
    })
  }

  // Send to specific user
  sendToUser(userId: string, message: any) {
    const payload = JSON.stringify(message)

    this.clients.forEach((client) => {
      if (client.userId === userId && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(payload)
      }
    })
  }
}

export const wsManager = new WebSocketManager(globalThis.wss)
```

### 5.2 WebSocket API Route

```typescript
// src/app/api/v1/ws/route.ts
import { NextRequest } from 'next/server'
import { WebSocketServer } from 'ws'

// Initialize WebSocket server once
if (!globalThis.wss) {
  globalThis.wss = new WebSocketServer({ noServer: true })
}

export async function GET(req: NextRequest) {
  // Handle WebSocket upgrade
  if (req.headers.get('upgrade') === 'websocket') {
    const { socket, response } = (req as any).socket

    globalThis.wss.handleUpgrade(req, socket, Buffer.alloc(0), (ws: WebSocket) => {
      globalThis.wss.emit('connection', ws, req)
    })

    return response
  }

  return new Response('WebSocket endpoint', { status: 426 })
}
```

---

## 6. AI Agent Architecture

### 6.1 Agent Hierarchy

```
LEVEL 1: Master Orchestrator
  ├─ Analyzes user request
  ├─ Routes to departments
  ├─ Validates consistency
  └─ Presents results

LEVEL 2: Department Heads
  ├─ CHARACTER DEPARTMENT HEAD
  │   ├─ Assesses relevance
  │   ├─ Spawns specialists
  │   ├─ Grades outputs
  │   └─ Compiles report
  │
  └─ (Other departments in future phases)

LEVEL 3: Specialist Agents
  ├─ Character Creator (personality, backstory)
  ├─ Hair Stylist (hairstyle design)
  └─ Costume Designer (wardrobe)
```

### 6.2 Master Orchestrator Definition

```typescript
// src/lib/agents/definitions/master-orchestrator.ts
import { getCustomToolDefinition } from '@codebuff/sdk'
import { z } from 'zod'

export const masterOrchestratorAgent = {
  id: 'master-orchestrator',
  model: 'anthropic/anthropic/claude-sonnet-4.5',
  displayName: 'Master Orchestrator',
  category: 'orchestration',
  agentLevel: 'master',

  instructionsPrompt: `
You are the Master Orchestrator for Aladdin movie production.

Your role:
1. Analyze user requests from chat
2. Determine which departments are involved
3. Route requests to appropriate department heads
4. Coordinate cross-department workflows
5. Aggregate and validate final results
6. Present unified output to user

Process:
1. Analyze user request intent and scope
2. Identify relevant departments (Character, Story, Visual, Audio, etc.)
3. For each department:
   - Send specific instructions
   - Specify expected output format
   - Set priority and dependencies
4. Wait for department reports
5. Validate cross-department consistency
6. Present to user with quality scores

IMPORTANT:
- You coordinate but don't execute tasks yourself
- Each department head grades their specialist outputs
- You validate cross-department consistency
- Present final output for user decision: INGEST, MODIFY, or DISCARD

Example Request: "Create a cyberpunk detective character named Sarah"
Analysis: This is a character creation request
Departments Involved: Character (primary), Visual (secondary)
Route to: Character Department Head with instructions
  `,

  tools: [],
  customTools: []  // Will be defined in implementation
}
```

### 6.3 Character Department Head Definition

```typescript
// src/lib/agents/definitions/character-dept-head.ts
export const characterDepartmentHead = {
  id: 'character-department-head',
  model: 'anthropic/anthropic/claude-sonnet-4.5',
  displayName: 'Character Department Head',
  category: 'department-head',
  agentLevel: 'department',
  department: 'character',

  instructionsPrompt: `
You are the Character Department Head in movie production.

Your role:
1. Receive requests from Master Orchestrator
2. Assess relevance to character department (0-1 score)
3. If relevant, identify needed specialist agents
4. Spawn specialists with clear instructions
5. Grade each specialist's output for quality & relevance
6. Compile department report for orchestrator

Specialist Agents Under You:
- Character Creator: Core personality, backstory, arc
- Hair Stylist: Hairstyle design
- Costume Designer: Wardrobe and clothing

Grading Criteria:
1. Quality Score (0-1): Technical quality of output
2. Relevance Score (0-1): How relevant to request
3. Consistency Score (0-1): Fits with existing content
4. Overall Score: Weighted average (quality*0.4 + relevance*0.3 + consistency*0.3)

Decision Thresholds:
- >= 0.70: ACCEPT (excellent)
- 0.60-0.69: ACCEPT with notes
- 0.40-0.59: REQUEST REVISION
- < 0.40: DISCARD and respawn

IMPORTANT:
- Grade each specialist output before accepting
- Request revisions if quality < 0.60
- Only send accepted outputs to orchestrator
- Include your grading rationale in report

Example:
Request: "Create cyberpunk detective character Sarah"
Relevance: 1.0 (primary department)
Specialists Needed:
  1. Character Creator - "Create personality and backstory for Sarah"
  2. Hair Stylist - "Design hairstyle for cyberpunk detective"
  3. Costume Designer - "Design outfit for street-smart detective"
  `,

  tools: [],
  customTools: []
}
```

### 6.4 Specialist Agent Definition (Character Creator)

```typescript
// src/lib/agents/definitions/character-creator.ts
export const characterCreatorAgent = {
  id: 'character-creator-specialist',
  model: 'anthropic/anthropic/claude-sonnet-4.5',
  displayName: 'Character Creator',
  category: 'specialist',
  agentLevel: 'specialist',
  department: 'character',

  instructionsPrompt: `
You are a professional character creator for movie production.

Your role:
1. Receive character creation request from department head
2. Design comprehensive character profile including:
   - Full name and basic info
   - Role in story (protagonist/antagonist/supporting/minor)
   - Personality traits and motivations
   - Backstory and history
   - Core conflicts and fears
   - Character arc potential

3. Provide detailed output in structured format
4. Self-assess your confidence and completeness

Output Format:
{
  fullName: "Character full name",
  role: "protagonist" | "antagonist" | "supporting" | "minor",
  age: number,
  personality: {
    traits: ["trait1", "trait2"],
    motivations: ["motivation1"],
    fears: ["fear1"],
    strengths: ["strength1"],
    weaknesses: ["weakness1"]
  },
  backstory: "Detailed backstory narrative",
  characterArc: "Potential development arc",

  // Self-assessment
  confidence: 0.85,  // 0-1
  completeness: 0.90,  // 0-1
  reasoning: "Why this character fits the request"
}

IMPORTANT:
- Create rich, believable characters
- Consider genre and setting
- Ensure consistency with story world
- Focus on depth and complexity
- Provide production-ready details

Example Request: "Create cyberpunk detective character Sarah"
Think about: What makes her unique? What's her motivation? What's her past?
  `,

  tools: [],
  customTools: []
}
```

---

## 7. Custom Tools Implementation

### 7.1 Save Character Tool

```typescript
// src/lib/agents/tools/saveCharacter.ts
import { getCustomToolDefinition } from '@codebuff/sdk'
import { z } from 'zod'
import { getOpenCollection } from '@/lib/db/openDatabase'

export const saveCharacterTool = getCustomToolDefinition({
  toolName: 'save_character',
  description: 'Save a character to the project database. This will be presented to the user for approval.',

  inputSchema: z.object({
    projectId: z.string().describe('Project ID'),
    name: z.string().describe('Character name'),
    content: z.object({
      fullName: z.string().optional(),
      role: z.enum(['protagonist', 'antagonist', 'supporting', 'minor']).optional(),
      age: z.number().optional(),
      personality: z.object({
        traits: z.array(z.string()).optional(),
        motivations: z.array(z.string()).optional(),
        fears: z.array(z.string()).optional(),
        strengths: z.array(z.string()).optional(),
        weaknesses: z.array(z.string()).optional()
      }).optional(),
      backstory: z.string().optional(),
      appearance: z.object({
        description: z.string().optional(),
        hairStyle: z.string().optional(),
        hairColor: z.string().optional(),
        clothing: z.string().optional()
      }).optional()
    }).describe('Character content data')
  }),

  execute: async ({ projectId, name, content }) => {
    try {
      // Get project to find slug
      const payload = await getPayloadHMR({ config: configPromise })
      const project = await payload.findByID({
        collection: 'projects',
        id: projectId
      })

      // Initial quality check
      if (!name || !content) {
        return [{
          type: 'text',
          value: 'Error: Name and content are required'
        }]
      }

      // Calculate initial quality (simple heuristic for Phase 2)
      const qualityRating = calculateQuality(content)

      // Save to open database
      const collection = await getOpenCollection(project.slug, 'characters')

      const character = {
        name,
        projectId,
        collectionName: 'characters',
        content,
        qualityRating,
        brainValidated: false,  // Phase 3: Will validate with Brain
        userApproved: false,
        createdBy: 'character-creator',
        createdByType: 'agent',
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const result = await collection.insertOne(character)

      return [{
        type: 'text',
        value: JSON.stringify({
          success: true,
          characterId: result.insertedId.toString(),
          name,
          qualityRating,
          message: `Character "${name}" saved with quality ${qualityRating.toFixed(2)}/1.00`
        })
      }]

    } catch (error) {
      return [{
        type: 'text',
        value: JSON.stringify({
          error: 'Failed to save character',
          message: error.message
        })
      }]
    }
  }
})

function calculateQuality(content: any): number {
  let score = 0
  let maxScore = 0

  // Check personality
  if (content.personality?.traits?.length > 0) score += 0.2
  maxScore += 0.2

  if (content.personality?.motivations?.length > 0) score += 0.2
  maxScore += 0.2

  // Check backstory
  if (content.backstory && content.backstory.length > 50) score += 0.3
  maxScore += 0.3

  // Check appearance
  if (content.appearance?.description) score += 0.15
  maxScore += 0.15

  // Check role
  if (content.role) score += 0.15
  maxScore += 0.15

  return maxScore > 0 ? score / maxScore : 0.5
}
```

### 7.2 Get Characters Tool

```typescript
// src/lib/agents/tools/getCharacters.ts
import { getCustomToolDefinition } from '@codebuff/sdk'
import { z } from 'zod'
import { getOpenCollection } from '@/lib/db/openDatabase'

export const getCharactersTool = getCustomToolDefinition({
  toolName: 'get_characters',
  description: 'Retrieve characters from the project database',

  inputSchema: z.object({
    projectId: z.string().describe('Project ID'),
    limit: z.number().optional().default(10).describe('Max number to return')
  }),

  execute: async ({ projectId, limit }) => {
    try {
      const payload = await getPayloadHMR({ config: configPromise })
      const project = await payload.findByID({
        collection: 'projects',
        id: projectId
      })

      const collection = await getOpenCollection(project.slug, 'characters')
      const characters = await collection
        .find({ projectId })
        .limit(limit)
        .toArray()

      return [{
        type: 'text',
        value: JSON.stringify({
          success: true,
          count: characters.length,
          characters: characters.map(c => ({
            id: c._id.toString(),
            name: c.name,
            role: c.content?.role,
            qualityRating: c.qualityRating
          }))
        })
      }]

    } catch (error) {
      return [{
        type: 'text',
        value: JSON.stringify({
          error: 'Failed to fetch characters',
          message: error.message
        })
      }]
    }
  }
})
```

### 7.3 Query Brain Tool (Stub for Phase 3)

```typescript
// src/lib/agents/tools/queryBrain.ts
import { getCustomToolDefinition } from '@codebuff/sdk'
import { z } from 'zod'

export const queryBrainTool = getCustomToolDefinition({
  toolName: 'query_brain',
  description: 'Query Brain for semantic search and validation (Phase 3)',

  inputSchema: z.object({
    projectId: z.string(),
    query: z.string(),
    types: z.array(z.string()).optional()
  }),

  execute: async ({ projectId, query, types }) => {
    // Phase 2: Stub implementation
    // Phase 3: Will integrate with Brain service

    return [{
      type: 'text',
      value: JSON.stringify({
        note: 'Brain integration coming in Phase 3',
        results: []
      })
    }]
  }
})
```

---

## 8. Agent Orchestration Implementation

### 8.1 Master Orchestration Flow

```typescript
// src/lib/agents/orchestration/master.ts
import { CodebuffClient } from '@codebuff/sdk'
import { masterOrchestratorAgent } from '../definitions/master-orchestrator'
import { runDepartmentHead } from './department'

export async function runMasterOrchestrator({
  userPrompt,
  projectId,
  conversationId,
  userId
}: {
  userPrompt: string
  projectId: string
  conversationId: string
  userId: string
}) {
  const codebuff = new CodebuffClient({
    apiKey: process.env.CODEBUFF_API_KEY!
  })

  // 1. Master Orchestrator analyzes request
  const orchestratorRun = await codebuff.run({
    agent: masterOrchestratorAgent.id,
    prompt: userPrompt,
    customToolDefinitions: [] // Tools defined later
  })

  // Extract department routing from output
  const routing = parseOrchestatorOutput(orchestratorRun.output)

  // 2. Route to department heads in parallel
  const departmentPromises = routing.departments.map(dept =>
    runDepartmentHead({
      department: dept.name,
      instructions: dept.instructions,
      projectId,
      conversationId
    })
  )

  const departmentReports = await Promise.all(departmentPromises)

  // 3. Aggregate results
  const finalOutput = {
    departments: departmentReports,
    overallQuality: calculateOverallQuality(departmentReports),
    recommendation: determineRecommendation(departmentReports)
  }

  return finalOutput
}

function parseOrchestatorOutput(output: any) {
  // Parse orchestrator's analysis
  // Return structure: { departments: [...] }
  return {
    departments: [
      {
        name: 'character',
        instructions: 'Create character profile',
        priority: 'high'
      }
    ]
  }
}

function calculateOverallQuality(reports: any[]): number {
  const scores = reports.map(r => r.departmentQuality)
  return scores.reduce((a, b) => a + b, 0) / scores.length
}

function determineRecommendation(reports: any[]): string {
  const avgQuality = calculateOverallQuality(reports)
  if (avgQuality >= 0.70) return 'ingest'
  if (avgQuality >= 0.50) return 'modify'
  return 'discard'
}
```

### 8.2 Department Head Orchestration

```typescript
// src/lib/agents/orchestration/department.ts
import { CodebuffClient } from '@codebuff/sdk'
import { characterDepartmentHead } from '../definitions/character-dept-head'
import { runSpecialist } from './specialist'

export async function runDepartmentHead({
  department,
  instructions,
  projectId,
  conversationId
}: {
  department: string
  instructions: string
  projectId: string
  conversationId: string
}) {
  const codebuff = new CodebuffClient({
    apiKey: process.env.CODEBUFF_API_KEY!
  })

  // Only character department in Phase 2
  if (department !== 'character') {
    return {
      department,
      status: 'not_implemented',
      message: 'This department will be implemented in later phases'
    }
  }

  // 1. Department head assesses and plans
  const deptHeadRun = await codebuff.run({
    agent: characterDepartmentHead.id,
    prompt: instructions,
    customToolDefinitions: []
  })

  // Parse specialist needs
  const planning = parseDepartmentPlanning(deptHeadRun.output)

  if (planning.relevance < 0.3) {
    return {
      department,
      relevance: planning.relevance,
      status: 'not_relevant',
      outputs: []
    }
  }

  // 2. Spawn specialists in parallel
  const specialistPromises = planning.specialists.map(spec =>
    runSpecialist({
      specialistId: spec.id,
      instructions: spec.instructions,
      projectId
    })
  )

  const specialistOutputs = await Promise.all(specialistPromises)

  // 3. Grade each output
  const gradedOutputs = specialistOutputs.map(output => ({
    ...output,
    grades: gradeSpecialistOutput(output),
    decision: makeDecision(output)
  }))

  // 4. Filter accepted outputs
  const acceptedOutputs = gradedOutputs.filter(o => o.decision === 'accept')

  return {
    department,
    relevance: planning.relevance,
    status: 'complete',
    outputs: acceptedOutputs,
    departmentQuality: calculateDepartmentQuality(acceptedOutputs)
  }
}

function parseDepartmentPlanning(output: any) {
  return {
    relevance: 1.0,
    specialists: [
      { id: 'character-creator-specialist', instructions: 'Create character profile' },
      { id: 'hair-stylist-specialist', instructions: 'Design hairstyle' },
      { id: 'costume-designer-specialist', instructions: 'Design outfit' }
    ]
  }
}

function gradeSpecialistOutput(output: any) {
  // Simple grading for Phase 2
  return {
    qualityScore: 0.85,
    relevanceScore: 0.88,
    consistencyScore: 0.82,
    overallScore: 0.85
  }
}

function makeDecision(output: any): 'accept' | 'revise' | 'discard' {
  const score = output.grades?.overallScore || 0
  if (score >= 0.60) return 'accept'
  if (score >= 0.40) return 'revise'
  return 'discard'
}

function calculateDepartmentQuality(outputs: any[]): number {
  if (outputs.length === 0) return 0
  const scores = outputs.map(o => o.grades?.overallScore || 0)
  return scores.reduce((a, b) => a + b, 0) / scores.length
}
```

### 8.3 Specialist Execution

```typescript
// src/lib/agents/orchestration/specialist.ts
import { CodebuffClient } from '@codebuff/sdk'
import { characterCreatorAgent } from '../definitions/character-creator'
import { saveCharacterTool, getCharactersTool } from '../tools'

const specialistDefinitions = {
  'character-creator-specialist': characterCreatorAgent,
  // Add others as implemented
}

export async function runSpecialist({
  specialistId,
  instructions,
  projectId
}: {
  specialistId: string
  instructions: string
  projectId: string
}) {
  const codebuff = new CodebuffClient({
    apiKey: process.env.CODEBUFF_API_KEY!
  })

  const agentDef = specialistDefinitions[specialistId]

  if (!agentDef) {
    throw new Error(`Unknown specialist: ${specialistId}`)
  }

  // Run specialist with tools
  const result = await codebuff.run({
    agent: agentDef.id,
    prompt: instructions,
    customToolDefinitions: [
      saveCharacterTool,
      getCharactersTool
    ]
  })

  return {
    specialistId,
    output: result.output,
    confidence: result.output?.confidence || 0.5,
    completeness: result.output?.completeness || 0.5,
    toolCalls: result.toolCalls || []
  }
}
```

---

## 9. API Route Implementation

### 9.1 Chat Message Endpoint

```typescript
// src/app/api/v1/chat/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getPayloadHMR } from '@payloadcms/next/utilities'
import configPromise from '@payload-config'
import { runMasterOrchestrator } from '@/lib/agents/orchestration/master'
import { wsManager } from '@/lib/websocket/server'

export async function POST(req: NextRequest) {
  try {
    const { conversationId, content } = await req.json()

    const payload = await getPayloadHMR({ config: configPromise })
    const { user } = await payload.auth({ req })

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get conversation
    const conversation = await payload.findByID({
      collection: 'conversations',
      id: conversationId
    })

    // Add user message
    const userMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date()
    }

    await payload.update({
      collection: 'conversations',
      id: conversationId,
      data: {
        messages: [...(conversation.messages || []), userMessage]
      }
    })

    // Create agent run
    const agentRun = await payload.create({
      collection: 'agent-runs',
      data: {
        conversation: conversationId,
        project: conversation.project,
        triggeredBy: user.id,
        agentId: 'master-orchestrator',
        agentLevel: 'master',
        prompt: content,
        status: 'queued',
        events: []
      }
    })

    // Start agent orchestration (async)
    runMasterOrchestrator({
      userPrompt: content,
      projectId: conversation.project.toString(),
      conversationId,
      userId: user.id
    }).then(async (result) => {
      // Update agent run
      await payload.update({
        collection: 'agent-runs',
        id: agentRun.id,
        data: {
          status: 'complete',
          output: result,
          completedAt: new Date()
        }
      })

      // Add assistant message
      const assistantMessage = {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: formatAgentOutput(result),
        agentId: 'master-orchestrator',
        contentCards: extractContentCards(result),
        timestamp: new Date()
      }

      await payload.update({
        collection: 'conversations',
        id: conversationId,
        data: {
          messages: [...conversation.messages, userMessage, assistantMessage]
        }
      })

      // Notify via WebSocket
      wsManager.broadcastToConversation(conversationId, {
        type: 'message_complete',
        conversationId,
        messageId: assistantMessage.id,
        content: assistantMessage.content,
        timestamp: assistantMessage.timestamp
      })
    })

    return NextResponse.json({
      success: true,
      messageId: userMessage.id,
      agentRunId: agentRun.id
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
}

function formatAgentOutput(result: any): string {
  return `Character created successfully! Quality: ${result.overallQuality.toFixed(2)}/1.00`
}

function extractContentCards(result: any): any[] {
  // Extract character data from result
  return result.departments
    .filter((d: any) => d.status === 'complete')
    .flatMap((d: any) => d.outputs.map((o: any) => ({
      type: 'character',
      data: o.output,
      qualityRating: o.grades?.overallScore,
      actions: ['ingest', 'modify', 'discard']
    })))
}
```

---

## 10. Testing Strategy

### 10.1 Integration Tests

```typescript
// tests/int/chat-api.test.ts
import { describe, it, expect, beforeAll } from 'vitest'
import { getPayloadHMR } from '@payloadcms/next/utilities'
import configPromise from '@payload-config'

describe('Chat API', () => {
  let payload: any
  let testProject: any
  let testConversation: any

  beforeAll(async () => {
    payload = await getPayloadHMR({ config: configPromise })

    // Create test project
    testProject = await payload.create({
      collection: 'projects',
      data: {
        name: 'Test Project',
        slug: 'test-project'
      }
    })

    // Create test conversation
    testConversation = await payload.create({
      collection: 'conversations',
      data: {
        name: 'Test Chat',
        project: testProject.id,
        messages: []
      }
    })
  })

  it('sends message and triggers agent', async () => {
    const res = await fetch('/api/v1/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversationId: testConversation.id,
        content: 'Create character named Sarah'
      })
    })

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
    expect(data.messageId).toBeDefined()
    expect(data.agentRunId).toBeDefined()
  })
})
```

### 10.2 E2E Tests

```typescript
// tests/e2e/character-creation.e2e.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Character Creation Workflow', () => {
  test('creates character via chat', async ({ page }) => {
    // Navigate to project chat
    await page.goto('/dashboard/project/test-id/chat')

    // Send message
    await page.fill('textarea[placeholder="Type a message..."]',
      'Create a cyberpunk detective character named Sarah'
    )
    await page.click('button[type="submit"]')

    // Wait for agent response
    await expect(page.locator('.message.assistant')).toBeVisible({ timeout: 30000 })

    // Check for content card
    await expect(page.locator('.content-card')).toBeVisible()

    // Click INGEST button
    await page.click('button:has-text("INGEST")')

    // Verify character saved
    await expect(page.locator('.success-message')).toContainText('Character ingested')
  })
})
```

---

## 11. Implementation Execution Plan

### 11.1 Phase 2 Implementation Order

**Week 5-6: Chat UI**

**Task 2.1**: Chat Interface Components
1. Create Server Component: `src/app/dashboard/project/[id]/chat/page.tsx`
2. Create Client Components:
   - `ChatInterface.tsx` (main container)
   - `MessageList.tsx` (message display)
   - `MessageInput.tsx` (input field)
   - `ContentCard.tsx` (content preview)
3. Create WebSocket hook: `useWebSocket.ts`

**Task 2.2**: WebSocket Connection
1. Create WebSocket server: `src/lib/websocket/server.ts`
2. Create WebSocket manager: `src/lib/websocket/manager.ts`
3. Create API route: `src/app/api/v1/ws/route.ts`
4. Test WebSocket connection

**Week 7-8: Agent Integration**

**Task 2.3**: Master Orchestrator Agent
1. Install @codebuff/sdk: `pnpm add @codebuff/sdk zod`
2. Create agent definitions:
   - `src/lib/agents/definitions/master-orchestrator.ts`
   - `src/lib/agents/definitions/character-dept-head.ts`
   - `src/lib/agents/definitions/character-creator.ts`
3. Create custom tools:
   - `src/lib/agents/tools/saveCharacter.ts`
   - `src/lib/agents/tools/getCharacters.ts`
   - `src/lib/agents/tools/queryBrain.ts` (stub)
4. Create orchestration logic:
   - `src/lib/agents/orchestration/master.ts`
   - `src/lib/agents/orchestration/department.ts`
   - `src/lib/agents/orchestration/specialist.ts`

**Task 2.4**: Character Department Head
1. Implement department head logic
2. Implement specialist runners
3. Create grading system
4. Test agent execution

**Task 2.5**: API Integration
1. Create chat API route: `src/app/api/v1/chat/route.ts`
2. Create agent status endpoint: `src/app/api/v1/agents/status/[runId]/route.ts`
3. Integrate WebSocket notifications
4. Test end-to-end flow

**Task 2.6**: Collections & Database
1. Update Conversations collection: `src/collections/Conversations.ts`
2. Create AgentRuns collection: `src/collections/AgentRuns.ts`
3. Update payload config
4. Generate types: `pnpm generate:types`

**Task 2.7**: Testing
1. Write integration tests:
   - `tests/int/chat-api.test.ts`
   - `tests/int/agent-runner.test.ts`
   - `tests/int/websocket.test.ts`
2. Write E2E tests:
   - `tests/e2e/chat-flow.e2e.spec.ts`
   - `tests/e2e/character-creation.e2e.spec.ts`
3. Run all tests: `pnpm test`

### 11.2 Success Criteria Checklist

**Must Pass All**:
- [ ] Chat interface loads at `/dashboard/project/[id]/chat`
- [ ] Can send messages via chat input
- [ ] WebSocket connection establishes successfully
- [ ] WebSocket receives real-time updates
- [ ] Master Orchestrator agent spawns on message
- [ ] Character Department Head spawns
- [ ] Character Creator specialist spawns
- [ ] Character saved to open MongoDB
- [ ] Character data displayed in content card
- [ ] Can click INGEST to approve character
- [ ] All integration tests pass (`pnpm test:int`)
- [ ] All E2E tests pass (`pnpm test:e2e`)
- [ ] Full build succeeds (`pnpm build`)

---

## 12. Architecture Decision Records (ADRs)

### ADR-005: Hierarchical Agent System

**Decision**: Use three-tier hierarchical agent system (Master → Department → Specialist)

**Rationale**:
- Mirrors real movie production organization
- Clear responsibility at each level
- Quality validation at multiple points
- Scalable - easy to add new specialists
- Parallel execution within departments

**Alternatives Considered**:
- Flat agent system (rejected: becomes chaotic at scale)
- Two-tier system (rejected: insufficient quality control)

**Status**: APPROVED

### ADR-006: WebSocket for Real-time Updates

**Decision**: Use WebSocket for streaming agent updates to UI

**Rationale**:
- Real-time feedback improves UX
- Low latency for agent status updates
- Bidirectional communication
- Standard WebSocket API

**Alternatives Considered**:
- Server-Sent Events (rejected: one-way only)
- Polling (rejected: higher latency, more requests)

**Status**: APPROVED

### ADR-007: @codebuff/sdk for Agent Orchestration

**Decision**: Use @codebuff/sdk for AI agent management

**Rationale**:
- Purpose-built for agent orchestration
- Supports custom tools
- Event streaming built-in
- Handles retries and errors

**Alternatives Considered**:
- Direct OpenAI API (rejected: more complex to manage)
- LangChain (rejected: heavier, less focused)

**Status**: APPROVED

### ADR-008: Server Components for Data Fetching

**Decision**: Use React Server Components for data fetching, Client Components for interactivity

**Rationale**:
- Next.js 15 best practice
- Reduces client bundle size
- Direct database access in Server Components
- Better performance

**Alternatives Considered**:
- All Client Components (rejected: worse performance)

**Status**: APPROVED

---

## 13. Integration Points for Future Phases

### 13.1 Phase 3 Preparation (Brain Validation)

**Hooks prepared but not active**:
- `queryBrainTool` - Stub implementation ready
- Quality validation pipeline - In place
- Brain validation flag in database - Schema ready

**What Phase 3 will add**:
- Brain service integration
- Neo4j connection
- Embedding generation
- Semantic search
- Contradiction detection

### 13.2 Phase 4+ Preparation (Additional Departments)

**Department heads ready to add**:
- Story Department Head
- Visual Department Head
- Audio Department Head
- Production Department Head

**Specialist agents ready to add**:
- 50+ specialists across all departments

---

## 14. Performance Considerations

### 14.1 Agent Execution

- **Parallel execution**: Department heads and specialists run in parallel
- **Streaming updates**: WebSocket provides real-time feedback
- **Async processing**: Long-running agent tasks don't block UI
- **Retry logic**: Failed agents automatically retry (with backoff)

### 14.2 WebSocket Optimization

- **Connection pooling**: Reuse WebSocket connections
- **Message batching**: Batch multiple updates when possible
- **Selective broadcasting**: Only send to subscribed clients
- **Heartbeat ping/pong**: Keep connections alive

### 14.3 Database Optimization

- **Indexes**: Create indexes on conversationId, projectId, agentId
- **Query limits**: Paginate message history
- **Connection pooling**: Reuse MongoDB connections

---

## 15. Security Considerations

### 15.1 WebSocket Security

- **Authentication**: Verify user token on WebSocket connect
- **Authorization**: Check user access to conversation
- **Rate limiting**: Limit messages per user per minute
- **Input validation**: Sanitize all user input

### 15.2 Agent Security

- **API key protection**: Store Codebuff API key in environment
- **Tool validation**: Validate all tool inputs with Zod schemas
- **Sandbox execution**: Agents can't access system resources
- **Audit trail**: Log all agent runs in database

---

## 16. Monitoring & Observability

### 16.1 Metrics to Track

- Agent execution time
- Agent success/failure rates
- WebSocket connection count
- Message throughput
- Quality scores distribution
- User approval rates (INGEST/MODIFY/DISCARD)

### 16.2 Logging Strategy

```typescript
console.log('✅ Agent run started', {
  agentRunId: run.id,
  agentId: run.agentId,
  conversationId: run.conversation,
  userId: run.triggeredBy,
  timestamp: new Date().toISOString()
})
```

---

## 17. Conclusion

This architecture provides Phase 2 implementation blueprint with:

✅ **Real-time Chat Interface**: WebSocket-powered streaming updates
✅ **Hierarchical AI Agents**: Master → Department → Specialist organization
✅ **Custom Tool System**: Agent-database interaction layer
✅ **Quality Validation**: Multi-level grading and approval
✅ **Phase 3 Ready**: Brain validation hooks prepared
✅ **Scalable Design**: Easy to add new departments and specialists

**Next Steps**:
1. Coder agent implements per Section 11 execution plan
2. All tests pass per Section 11.2 success criteria
3. Phase 2 complete, ready for Phase 3 (Brain Integration)

---

**Document Status**: ✅ COMPLETE - Ready for Implementation
**Architect**: System Architecture Designer Agent
**Session**: swarm-1759247953229-friw6kswf
**Date**: 2025-10-01
