# Architecture Improvements for Aladdin

**Version**: 2.0.0  
**Last Updated**: January 30, 2025

---

## Overview

This document outlines modern architectural patterns and improvements to enhance scalability, performance, and developer experience.

---

## 1. Enhanced Agent System Architecture

### Agent Pool Management

**Problem**: Creating new agent instances for every request is expensive and slow.

**Solution**: Implement agent pooling with lifecycle management.

```typescript
// src/lib/agents/AgentPool.ts
import { CodebuffClient } from '@codebuff/sdk'

interface AgentInstance {
  id: string
  agentType: string
  client: CodebuffClient
  lastUsed: Date
  inUse: boolean
  requestCount: number
}

export class AgentPool {
  private pool: Map<string, AgentInstance[]> = new Map()
  private maxPoolSize = 10
  private idleTimeout = 5 * 60 * 1000 // 5 minutes
  
  constructor() {
    // Cleanup idle agents every minute
    setInterval(() => this.cleanup(), 60 * 1000)
  }
  
  async acquire(agentType: string): Promise<AgentInstance> {
    const agents = this.pool.get(agentType) || []
    
    // Find available agent
    const available = agents.find(a => !a.inUse)
    if (available) {
      available.inUse = true
      available.lastUsed = new Date()
      return available
    }
    
    // Create new agent if under limit
    if (agents.length < this.maxPoolSize) {
      const instance: AgentInstance = {
        id: `${agentType}-${Date.now()}`,
        agentType,
        client: new CodebuffClient({
          apiKey: process.env.CODEBUFF_API_KEY!
        }),
        lastUsed: new Date(),
        inUse: true,
        requestCount: 0
      }
      
      agents.push(instance)
      this.pool.set(agentType, agents)
      return instance
    }
    
    // Wait for available agent
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        const available = agents.find(a => !a.inUse)
        if (available) {
          clearInterval(checkInterval)
          available.inUse = true
          available.lastUsed = new Date()
          resolve(available)
        }
      }, 100)
    })
  }
  
  release(instance: AgentInstance) {
    instance.inUse = false
    instance.lastUsed = new Date()
    instance.requestCount++
  }
  
  private cleanup() {
    const now = Date.now()
    
    for (const [agentType, agents] of this.pool.entries()) {
      const active = agents.filter(agent => {
        if (agent.inUse) return true
        
        const idle = now - agent.lastUsed.getTime()
        return idle < this.idleTimeout
      })
      
      this.pool.set(agentType, active)
    }
  }
  
  getStats() {
    const stats: Record<string, any> = {}
    
    for (const [agentType, agents] of this.pool.entries()) {
      stats[agentType] = {
        total: agents.length,
        inUse: agents.filter(a => a.inUse).length,
        idle: agents.filter(a => !a.inUse).length,
        totalRequests: agents.reduce((sum, a) => sum + a.requestCount, 0)
      }
    }
    
    return stats
  }
}

// Singleton instance
export const agentPool = new AgentPool()
```

### Streaming Agent Responses

```typescript
// src/lib/agents/StreamingAgent.ts
import { agentPool } from './AgentPool'

export async function* streamAgentResponse(
  agentType: string,
  prompt: string,
  projectContext: any
) {
  const agent = await agentPool.acquire(agentType)
  
  try {
    const stream = await agent.client.run({
      agent: agentType,
      prompt,
      projectFiles: projectContext,
      stream: true,
      handleEvent: (event) => {
        // Events are yielded through generator
      }
    })
    
    for await (const chunk of stream) {
      yield {
        type: 'token',
        content: chunk.content,
        metadata: chunk.metadata
      }
    }
    
    yield { type: 'done' }
  } finally {
    agentPool.release(agent)
  }
}

// API Route using streaming
// app/api/v1/agents/stream/route.ts
import { streamAgentResponse } from '@/lib/agents/StreamingAgent'

export async function POST(req: Request) {
  const { agentType, prompt, projectId } = await req.json()
  
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of streamAgentResponse(agentType, prompt, { projectId })) {
          const data = `data: ${JSON.stringify(chunk)}\n\n`
          controller.enqueue(encoder.encode(data))
        }
      } catch (error) {
        controller.error(error)
      } finally {
        controller.close()
      }
    }
  })
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    }
  })
}
```

---

## 2. Advanced Caching Strategy

### Multi-Layer Cache

```typescript
// src/lib/cache/CacheManager.ts
import { redis } from '@/lib/redis'
import { LRUCache } from 'lru-cache'

// Layer 1: In-memory LRU cache (fastest)
const memoryCache = new LRUCache<string, any>({
  max: 500,
  ttl: 1000 * 60 * 5, // 5 minutes
  updateAgeOnGet: true,
})

// Layer 2: Redis cache (shared across instances)
// Layer 3: Database (slowest, always fresh)

export class CacheManager {
  async get<T>(key: string, fetcher: () => Promise<T>, ttl = 3600): Promise<T> {
    // Layer 1: Memory
    const memCached = memoryCache.get(key)
    if (memCached !== undefined) {
      return memCached as T
    }
    
    // Layer 2: Redis
    const redisCached = await redis.get(key)
    if (redisCached) {
      const data = JSON.parse(redisCached)
      memoryCache.set(key, data)
      return data as T
    }
    
    // Layer 3: Fetch from source
    const data = await fetcher()
    
    // Store in both caches
    memoryCache.set(key, data)
    await redis.setex(key, ttl, JSON.stringify(data))
    
    return data
  }
  
  async invalidate(pattern: string) {
    // Clear memory cache
    for (const key of memoryCache.keys()) {
      if (key.includes(pattern)) {
        memoryCache.delete(key)
      }
    }
    
    // Clear Redis cache
    const keys = await redis.keys(`*${pattern}*`)
    if (keys.length > 0) {
      await redis.del(...keys)
    }
  }
  
  async invalidateProject(projectId: string) {
    await this.invalidate(`project:${projectId}`)
  }
}

export const cacheManager = new CacheManager()
```

### Smart Cache Invalidation

```typescript
// src/lib/cache/SmartInvalidation.ts
import { cacheManager } from './CacheManager'

interface InvalidationRule {
  pattern: string
  dependencies: string[]
}

const invalidationRules: Record<string, InvalidationRule> = {
  'character': {
    pattern: 'character:*',
    dependencies: ['project:*:stats', 'project:*:characters']
  },
  'scene': {
    pattern: 'scene:*',
    dependencies: ['project:*:stats', 'project:*:scenes', 'character:*:scenes']
  },
  'image': {
    pattern: 'image:*',
    dependencies: ['project:*:stats', 'character:*:images']
  }
}

export async function invalidateOnChange(
  collectionType: string,
  documentId: string,
  projectId: string
) {
  const rule = invalidationRules[collectionType]
  if (!rule) return
  
  // Invalidate main pattern
  await cacheManager.invalidate(rule.pattern.replace('*', documentId))
  
  // Invalidate dependencies
  for (const dep of rule.dependencies) {
    await cacheManager.invalidate(dep.replace('*', projectId))
  }
}
```

---

## 3. Real-Time Collaboration Infrastructure

### WebSocket Server with Presence

```typescript
// src/lib/websocket/PresenceManager.ts
import { WebSocket } from 'ws'

interface User {
  id: string
  name: string
  avatar: string
  color: string
  cursor?: { x: number; y: number }
  lastSeen: Date
}

interface Room {
  projectId: string
  users: Map<string, User>
  connections: Map<string, WebSocket>
}

export class PresenceManager {
  private rooms: Map<string, Room> = new Map()
  
  joinRoom(projectId: string, userId: string, user: User, ws: WebSocket) {
    let room = this.rooms.get(projectId)
    
    if (!room) {
      room = {
        projectId,
        users: new Map(),
        connections: new Map()
      }
      this.rooms.set(projectId, room)
    }
    
    room.users.set(userId, user)
    room.connections.set(userId, ws)
    
    // Broadcast user joined
    this.broadcast(projectId, {
      type: 'user-joined',
      user
    }, userId)
    
    // Send current users to new user
    ws.send(JSON.stringify({
      type: 'presence-state',
      users: Array.from(room.users.values())
    }))
  }
  
  leaveRoom(projectId: string, userId: string) {
    const room = this.rooms.get(projectId)
    if (!room) return
    
    room.users.delete(userId)
    room.connections.delete(userId)
    
    // Broadcast user left
    this.broadcast(projectId, {
      type: 'user-left',
      userId
    })
    
    // Clean up empty rooms
    if (room.users.size === 0) {
      this.rooms.delete(projectId)
    }
  }
  
  updateCursor(projectId: string, userId: string, cursor: { x: number; y: number }) {
    const room = this.rooms.get(projectId)
    if (!room) return
    
    const user = room.users.get(userId)
    if (!user) return
    
    user.cursor = cursor
    user.lastSeen = new Date()
    
    // Broadcast cursor update
    this.broadcast(projectId, {
      type: 'cursor-update',
      userId,
      cursor
    }, userId)
  }
  
  private broadcast(projectId: string, message: any, excludeUserId?: string) {
    const room = this.rooms.get(projectId)
    if (!room) return
    
    const data = JSON.stringify(message)
    
    for (const [userId, ws] of room.connections.entries()) {
      if (userId !== excludeUserId && ws.readyState === WebSocket.OPEN) {
        ws.send(data)
      }
    }
  }
  
  getRoomUsers(projectId: string): User[] {
    const room = this.rooms.get(projectId)
    return room ? Array.from(room.users.values()) : []
  }
}

export const presenceManager = new PresenceManager()
```

### Optimistic Updates with Rollback

```typescript
// src/hooks/useOptimisticUpdate.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

export function useOptimisticUpdate<T>(
  queryKey: string[],
  mutationFn: (data: T) => Promise<T>
) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn,
    
    // Optimistic update
    onMutate: async (newData) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey })
      
      // Snapshot previous value
      const previousData = queryClient.getQueryData(queryKey)
      
      // Optimistically update
      queryClient.setQueryData(queryKey, newData)
      
      // Return context with snapshot
      return { previousData }
    },
    
    // Rollback on error
    onError: (err, newData, context) => {
      queryClient.setQueryData(queryKey, context?.previousData)
      toast.error('Update failed. Changes reverted.')
    },
    
    // Refetch on success
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
      toast.success('Updated successfully')
    }
  })
}

// Usage example
function CharacterEditor({ character }) {
  const updateCharacter = useOptimisticUpdate(
    ['character', character.id],
    async (data) => {
      const res = await fetch(`/api/v1/characters/${character.id}`, {
        method: 'PATCH',
        body: JSON.stringify(data)
      })
      return res.json()
    }
  )
  
  return (
    <input
      value={character.name}
      onChange={(e) => {
        updateCharacter.mutate({ ...character, name: e.target.value })
      }}
    />
  )
}
```

---

## 4. Performance Optimizations

### Edge Functions for Critical APIs

```typescript
// app/api/v1/projects/[id]/route.ts
export const runtime = 'edge' // Deploy to edge

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  // This runs on edge, close to users
  const project = await getProject(params.id)
  return Response.json(project)
}
```

### Incremental Static Regeneration

```typescript
// app/dashboard/projects/page.tsx
export const revalidate = 60 // Revalidate every 60 seconds

export default async function ProjectsPage() {
  const projects = await getProjects()
  
  return <ProjectsList projects={projects} />
}
```

### Image Optimization

```typescript
// components/CharacterAvatar.tsx
import Image from 'next/image'

export function CharacterAvatar({ src, alt }: { src: string; alt: string }) {
  return (
    <Image
      src={src}
      alt={alt}
      width={100}
      height={100}
      className="rounded-full"
      loading="lazy"
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRg..."
    />
  )
}
```

---

## Continue with more improvements...

