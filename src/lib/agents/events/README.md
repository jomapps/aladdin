# Real-time Event Streaming for Aladdin Dynamic Agents

This module provides real-time event streaming infrastructure for the Aladdin Dynamic Agents system.

## Architecture

```
Agent Execution
    │
    ├─→ AgentEventEmitter (emits events)
    │       │
    │       ├─→ Local EventEmitter listeners
    │       ├─→ Redis Pub/Sub (broadcast)
    │       └─→ MongoDB persistence
    │
    └─→ Redis Pub/Sub
            │
            └─→ AgentWebSocketServer (receives events)
                    │
                    └─→ WebSocket clients (browser/API)
```

## Components

### 1. Event Types (`types.ts`)

Defines 11 event types for agent execution lifecycle:

- **orchestration-start** - Master orchestrator begins
- **orchestration-complete** - All departments finish
- **department-start** - Department head begins
- **department-complete** - Department finishes
- **agent-start** - Agent begins execution
- **agent-thinking** - Agent progress update
- **agent-complete** - Agent finishes
- **tool-call** - Agent invokes tool
- **tool-result** - Tool execution result
- **quality-check** - Quality validation
- **review-status** - Department head review

### 2. Event Emitter (`emitter.ts`)

Singleton event emitter for centralized event coordination:

```typescript
import { getEventEmitter } from '@/lib/agents/events'

const emitter = getEventEmitter()

// Initialize with Redis
await emitter.initialize('redis://localhost:6379')

// Emit event
await emitter.emitAgentEvent({
  type: 'agent-start',
  executionId: 'exec-123',
  agentId: 'story-head-001',
  agentName: 'Story Department Head',
  department: 'story',
  task: 'Analyze story structure',
  isDepartmentHead: true,
  timestamp: new Date(),
})

// Subscribe to events
emitter.subscribe('agent-start', (event) => {
  console.log(`Agent started: ${event.agentId}`)
})
```

### 3. WebSocket Server (`websocket-server.ts`)

WebSocket server with Redis Pub/Sub integration:

```typescript
import { startWebSocketServer } from '@/lib/agents/events'

// Start server
await startWebSocketServer({
  port: 3001,
  redisUrl: 'redis://localhost:6379',
  heartbeatInterval: 30000,
  clientTimeout: 60000,
})
```

### 4. Client Manager (`client-manager.ts`)

Manages WebSocket client connections and subscriptions:

- Connection lifecycle management
- Execution/conversation subscription tracking
- Heartbeat monitoring with timeout
- Efficient broadcast to subscribed clients

### 5. Event Persistence (`event-persistence.ts`)

Stores events in AgentExecutions collection:

```typescript
import { persistEvent, getExecutionEvents } from '@/lib/agents/events'

// Persist event
await persistEvent('exec-123', event)

// Retrieve events
const events = await getExecutionEvents('exec-123')
```

## Usage

### Server-side (Agent Execution)

```typescript
import { getEventEmitter } from '@/lib/agents/events'
import { AladdinAgentRunner } from '@/lib/agents/AladdinAgentRunner'

const emitter = getEventEmitter()
await emitter.initialize()

// Run agent with event emission
const runner = new AladdinAgentRunner(apiKey, payload)

const result = await runner.executeAgent(
  'story-head-001',
  'Create a dramatic opening scene',
  {
    projectId: 'proj-123',
    conversationId: 'conv-456',
  },
  async (codebuffEvent) => {
    // Emit custom events based on @codebuff/sdk events
    if (codebuffEvent.type === 'agent_step') {
      await emitter.emitAgentEvent({
        type: 'agent-thinking',
        executionId: result.executionId,
        agentId: 'story-head-001',
        agentName: 'Story Department Head',
        currentStep: codebuffEvent.step,
        progress: codebuffEvent.progress,
        timestamp: new Date(),
      })
    }
  }
)
```

### Client-side (Browser/API)

```typescript
const ws = new WebSocket('ws://localhost:3001')

ws.addEventListener('open', () => {
  console.log('Connected to WebSocket server')

  // Subscribe to execution events
  ws.send(
    JSON.stringify({
      type: 'subscribe',
      executionId: 'exec-123',
    })
  )
})

ws.addEventListener('message', (event) => {
  const data = JSON.parse(event.data)

  if (data.type === 'event') {
    const agentEvent = data.event

    switch (agentEvent.type) {
      case 'orchestration-start':
        console.log('Orchestration started:', agentEvent.context)
        break

      case 'department-start':
        console.log(`Department ${agentEvent.department} started`)
        break

      case 'agent-thinking':
        console.log(`Agent thinking: ${agentEvent.currentStep}`)
        updateProgressBar(agentEvent.progress)
        break

      case 'agent-complete':
        console.log(`Agent complete: ${agentEvent.agentName}`)
        displayResults(agentEvent.output)
        break

      case 'orchestration-complete':
        console.log('Orchestration complete:', agentEvent.result)
        showFinalResults(agentEvent)
        break
    }
  }
})

ws.addEventListener('error', (error) => {
  console.error('WebSocket error:', error)
})

ws.addEventListener('close', () => {
  console.log('Disconnected from WebSocket server')
  // Implement reconnection logic
})
```

### React Hook Example

```typescript
import { useEffect, useState } from 'react'
import type { AgentEvent } from '@/lib/agents/events'

export function useAgentExecution(executionId: string) {
  const [events, setEvents] = useState<AgentEvent[]>([])
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:3001')

    ws.addEventListener('open', () => {
      setIsConnected(true)
      ws.send(JSON.stringify({ type: 'subscribe', executionId }))
    })

    ws.addEventListener('message', (event) => {
      const data = JSON.parse(event.data)
      if (data.type === 'event') {
        setEvents((prev) => [...prev, data.event])
      }
    })

    ws.addEventListener('close', () => {
      setIsConnected(false)
    })

    return () => {
      ws.close()
    }
  }, [executionId])

  return { events, isConnected }
}
```

## Integration with AladdinAgentRunner

The event system is designed to integrate seamlessly with `AladdinAgentRunner`:

```typescript
// In AladdinAgentRunner.executeAgent()
import { getEventEmitter } from '@/lib/agents/events'

const emitter = getEventEmitter()

// Emit agent-start
await emitter.emitAgentStart(
  execution.id,
  agent.agentId,
  agent.name,
  department.slug,
  prompt,
  agent.isDepartmentHead,
  context.conversationId
)

// Run agent with event handlers
const result = await this.client.run({
  agent: agent.agentId,
  prompt,
  handleEvent: async (codebuffEvent) => {
    // Map @codebuff/sdk events to Aladdin events
    // and emit them
  },
})

// Emit agent-complete
await emitter.emitAgentComplete(
  execution.id,
  agent.agentId,
  agent.name,
  department.slug,
  result.output,
  qualityScore,
  executionTime,
  tokenUsage,
  context.conversationId
)
```

## Environment Variables

```env
# Redis connection for Pub/Sub
REDIS_URL=redis://localhost:6379

# WebSocket server port
WS_PORT=3001

# Enable verbose logging (development)
NODE_ENV=development
```

## Testing

```bash
# Start Redis
docker run -d -p 6379:6379 redis:alpine

# Start WebSocket server (in your app)
npm run dev

# Test WebSocket connection
wscat -c ws://localhost:3001

# Subscribe to execution
> {"type": "subscribe", "executionId": "exec-123"}

# You should receive events as they're emitted
```

## Performance Considerations

- **Event buffering**: Events are buffered in memory (max 100 per execution)
- **Non-blocking persistence**: Database writes are async and non-blocking
- **Connection pooling**: Redis connections are reused
- **Heartbeat monitoring**: Dead connections are cleaned up automatically
- **Rate limiting**: Consider adding rate limiting for high-frequency events

## Error Handling

- Event emission failures do NOT break agent execution
- Redis connection errors are logged but don't stop events
- Database persistence errors are logged but don't stop broadcasting
- WebSocket errors trigger automatic cleanup

## Next Steps

1. Integrate with `AladdinAgentRunner` to emit events during execution
2. Extend `DepartmentHeadAgent` to emit coordination events
3. Create UI components to visualize real-time events
4. Add event filtering and replay capabilities
5. Implement event-driven analytics and monitoring

## See Also

- [Dynamic Agents Architecture](/docs/architecture/dynamic-agents-architecture.md)
- [AladdinAgentRunner](/src/lib/agents/AladdinAgentRunner.ts)
- [AgentExecutions Collection](/src/collections/AgentExecutions.ts)
