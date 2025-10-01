# Orchestrator API Quick Start Guide

## 🚀 For Frontend Developers

This guide helps you quickly integrate the Orchestrator API into the UI.

## 📡 Available Endpoints

### 1. Query Mode - Ask Questions
```typescript
POST /api/orchestrator/query
```

**Use Case:** "What are Aladdin's personality traits?"

**Quick Example:**
```typescript
const response = await fetch('/api/orchestrator/query', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: 'What are Aladdin\'s personality traits?',
    projectId: 'proj_123',
    limit: 5
  })
})
const { answer, sources, suggestions } = await response.json()
```

### 2. Data Ingestion - Add Content
```typescript
POST /api/orchestrator/data
POST /api/orchestrator/data/confirm
```

**Use Case:** "Add this character description to the project"

**Quick Example:**
```typescript
// Step 1: Parse
const parseRes = await fetch('/api/orchestrator/data', {
  method: 'POST',
  body: JSON.stringify({
    data: 'Princess Jasmine is strong-willed...',
    projectId: 'proj_123',
    entityType: 'character'
  })
})
const parsed = await parseRes.json()

// Step 2: User reviews parsed.suggestedData

// Step 3: Confirm
if (userConfirms) {
  await fetch('/api/orchestrator/data/confirm', {
    method: 'POST',
    body: JSON.stringify({
      brainDocument: parsed.suggestedData,
      action: 'confirm'
    })
  })
}
```

### 3. Task Execution - Complex Work
```typescript
POST /api/orchestrator/task
GET /api/orchestrator/task?taskId=<id>
```

**Use Case:** "Create a complete character profile for Jafar"

**Quick Example:**
```typescript
// Start task
const taskRes = await fetch('/api/orchestrator/task', {
  method: 'POST',
  body: JSON.stringify({
    task: 'Create character profile for Jafar',
    projectId: 'proj_123',
    priority: 'high'
  })
})
const { taskId } = await taskRes.json()

// Poll for status
const checkStatus = async () => {
  const statusRes = await fetch(`/api/orchestrator/task?taskId=${taskId}`)
  const status = await statusRes.json()
  return status
}
```

### 4. General Chat - AI Assistant
```typescript
POST /api/orchestrator/chat
```

**Use Case:** "Explain the hero's journey"

**Quick Example:**
```typescript
const chatRes = await fetch('/api/orchestrator/chat', {
  method: 'POST',
  body: JSON.stringify({
    message: 'Explain the hero\'s journey',
    conversationId: 'conv_123' // optional
  })
})
const { message, suggestions } = await chatRes.json()
```

### 5. Real-Time Streaming
```typescript
GET /api/orchestrator/stream?mode=<mode>&taskId=<id>
```

**Use Case:** Monitor task progress in real-time

**Quick Example:**
```typescript
const eventSource = new EventSource(
  `/api/orchestrator/stream?mode=task&taskId=${taskId}`
)

eventSource.addEventListener('message', (event) => {
  const data = JSON.parse(event.data)

  switch (data.type) {
    case 'progress':
      setProgress(data.current / data.total)
      break
    case 'complete':
      setResults(data.data)
      eventSource.close()
      break
  }
})
```

## 🎨 React Hook Examples

### useOrchestratorQuery Hook
```typescript
import { useState } from 'react'

export function useOrchestratorQuery() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  const query = async (text: string, projectId?: string) => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/orchestrator/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: text, projectId })
      })

      if (!res.ok) throw new Error('Query failed')

      const result = await res.json()
      setData(result)
      return result
    } catch (err) {
      setError(err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { query, loading, data, error }
}

// Usage
function QueryComponent() {
  const { query, loading, data } = useOrchestratorQuery()

  const handleQuery = async () => {
    await query('What are Aladdin\'s traits?', 'proj_123')
  }

  return (
    <div>
      <button onClick={handleQuery} disabled={loading}>
        Search
      </button>
      {data && <div>{data.answer}</div>}
    </div>
  )
}
```

### useDataIngestion Hook
```typescript
import { useState } from 'react'

export function useDataIngestion() {
  const [loading, setLoading] = useState(false)
  const [parsed, setParsed] = useState(null)
  const [error, setError] = useState(null)

  const ingest = async (data: any, projectId: string, entityType: string) => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/orchestrator/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data, projectId, entityType })
      })

      if (!res.ok) throw new Error('Ingestion failed')

      const result = await res.json()
      setParsed(result)
      return result
    } catch (err) {
      setError(err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const confirm = async (brainDocument: any, action: string) => {
    const res = await fetch('/api/orchestrator/data/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brainDocument, action })
    })

    if (!res.ok) throw new Error('Confirmation failed')
    return res.json()
  }

  return { ingest, confirm, loading, parsed, error }
}
```

### useTaskExecution Hook
```typescript
import { useState, useEffect } from 'react'

export function useTaskExecution() {
  const [loading, setLoading] = useState(false)
  const [taskId, setTaskId] = useState<string | null>(null)
  const [status, setStatus] = useState<any>(null)
  const [error, setError] = useState(null)

  const execute = async (task: string, projectId: string) => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/orchestrator/task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task, projectId })
      })

      if (!res.ok) throw new Error('Task failed')

      const result = await res.json()
      setTaskId(result.taskId)
      return result
    } catch (err) {
      setError(err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Poll for status
  useEffect(() => {
    if (!taskId) return

    const interval = setInterval(async () => {
      const res = await fetch(`/api/orchestrator/task?taskId=${taskId}`)
      const data = await res.json()
      setStatus(data)

      if (data.status === 'completed' || data.status === 'failed') {
        clearInterval(interval)
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [taskId])

  return { execute, taskId, status, loading, error }
}
```

## 🎯 Component Examples

### Query Interface
```typescript
function QueryMode({ projectId }: { projectId: string }) {
  const { query, loading, data } = useOrchestratorQuery()
  const [input, setInput] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await query(input, projectId)
  }

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question..."
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {data && (
        <div>
          <h3>Answer:</h3>
          <p>{data.answer}</p>

          <h4>Sources:</h4>
          {data.sources.map((source) => (
            <div key={source.id}>
              <strong>{source.type}</strong>: {source.content}
              <span>Score: {source.score}</span>
            </div>
          ))}

          <h4>Suggestions:</h4>
          <ul>
            {data.suggestions.map((s, i) => (
              <li key={i} onClick={() => setInput(s)}>{s}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
```

### Data Ingestion Interface
```typescript
function DataIngestionMode({ projectId }: { projectId: string }) {
  const { ingest, confirm, loading, parsed } = useDataIngestion()
  const [input, setInput] = useState('')
  const [entityType, setEntityType] = useState('character')

  const handleIngest = async () => {
    await ingest(input, projectId, entityType)
  }

  const handleConfirm = async () => {
    await confirm(parsed.suggestedData, 'confirm')
    // Show success message
  }

  return (
    <div>
      <select value={entityType} onChange={(e) => setEntityType(e.target.value)}>
        <option value="character">Character</option>
        <option value="scene">Scene</option>
        <option value="location">Location</option>
      </select>

      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Enter data..."
      />

      <button onClick={handleIngest} disabled={loading}>
        Parse Data
      </button>

      {parsed && (
        <div>
          <h3>Parsed Data Preview:</h3>
          <pre>{JSON.stringify(parsed.suggestedData.parsed, null, 2)}</pre>

          <h4>Validation:</h4>
          {parsed.validation.errors.length > 0 && (
            <div style={{ color: 'red' }}>
              {parsed.validation.errors.map((e) => <div key={e}>{e}</div>)}
            </div>
          )}
          {parsed.validation.warnings.map((w) => (
            <div key={w} style={{ color: 'orange' }}>{w}</div>
          ))}

          {parsed.duplicates.length > 0 && (
            <div>
              <h4>Potential Duplicates:</h4>
              {parsed.duplicates.map((dup) => (
                <div key={dup.existingId}>
                  Similarity: {dup.similarity} - {dup.suggestion}
                </div>
              ))}
            </div>
          )}

          <button onClick={handleConfirm}>Confirm & Ingest</button>
        </div>
      )}
    </div>
  )
}
```

### Task Monitor with Streaming
```typescript
function TaskMonitor({ taskId }: { taskId: string }) {
  const [events, setEvents] = useState<any[]>([])
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const eventSource = new EventSource(
      `/api/orchestrator/stream?mode=task&taskId=${taskId}`
    )

    eventSource.addEventListener('message', (event) => {
      const data = JSON.parse(event.data)
      setEvents((prev) => [...prev, data])

      if (data.type === 'progress') {
        setProgress((data.current / data.total) * 100)
      }

      if (data.type === 'complete' || data.type === 'error') {
        eventSource.close()
      }
    })

    return () => eventSource.close()
  }, [taskId])

  return (
    <div>
      <div>Progress: {progress}%</div>
      <div>
        {events.map((event, i) => (
          <div key={i}>
            {event.type}: {event.message || JSON.stringify(event)}
          </div>
        ))}
      </div>
    </div>
  )
}
```

## 🔧 TypeScript Types

Import types from the API:
```typescript
import type {
  QueryRequest,
  QueryResponse,
  DataIngestionRequest,
  DataIngestionResponse,
  TaskExecutionRequest,
  TaskExecutionResponse,
  ChatRequest,
  ChatResponse,
} from '@/app/api/orchestrator/types'
```

## ⚠️ Error Handling

All APIs return standardized errors:
```typescript
interface APIError {
  error: string
  code: string
  details?: any
  statusCode: number
}

// Handle errors consistently
try {
  const res = await fetch('/api/orchestrator/query', { ... })

  if (!res.ok) {
    const error: APIError = await res.json()

    switch (error.code) {
      case 'AUTH_REQUIRED':
        // Redirect to login
        break
      case 'VALIDATION_ERROR':
        // Show validation errors
        console.error(error.details)
        break
      case 'RATE_LIMITED':
        // Show rate limit message
        break
      default:
        // Show generic error
        alert(error.error)
    }
  }
} catch (err) {
  console.error('Network error:', err)
}
```

## 📝 Testing

### Test with curl
```bash
# Query
curl -X POST http://localhost:3000/api/orchestrator/query \
  -H "Content-Type: application/json" \
  -d '{"query":"test","projectId":"proj_123"}'

# Data
curl -X POST http://localhost:3000/api/orchestrator/data \
  -H "Content-Type: application/json" \
  -d '{"data":"test","projectId":"proj_123","entityType":"character"}'

# Task
curl -X POST http://localhost:3000/api/orchestrator/task \
  -H "Content-Type: application/json" \
  -d '{"task":"test","projectId":"proj_123"}'

# Chat
curl -X POST http://localhost:3000/api/orchestrator/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"hello"}'
```

## 🎉 You're Ready!

Start building the UI with these endpoints. All backend logic is complete and tested.

**Next Steps:**
1. Create your React components
2. Add the hooks from examples above
3. Style with Tailwind/your preferred solution
4. Test each mode thoroughly
5. Add error boundaries and loading states

**Questions?** Check the full docs at `/docs/api/orchestrator-api.md`
