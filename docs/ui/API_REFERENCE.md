# API Reference

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Agent Endpoints](#agent-endpoints)
- [Department Endpoints](#department-endpoints)
- [Audit Trail Endpoints](#audit-trail-endpoints)
- [WebSocket API](#websocket-api)
- [Error Codes](#error-codes)
- [Rate Limiting](#rate-limiting)
- [Examples](#examples)

## Overview

The Aladdin API provides RESTful endpoints for managing agents, departments, and audit trails, plus a WebSocket API for real-time updates.

### Base URL

```
http://localhost:3000/api
```

### Content Type

All requests and responses use JSON:

```
Content-Type: application/json
```

### Response Format

All API responses follow this format:

```typescript
interface APIResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}
```

## Authentication

### Login

Create a new user session.

**Endpoint**: `POST /api/auth/login`

**Request**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-123",
      "email": "user@example.com",
      "name": "John Doe"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Logout

End current user session.

**Endpoint**: `POST /api/auth/logout`

**Headers**:
```
Authorization: Bearer <token>
```

**Response**:
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### Get Current User

Retrieve current authenticated user.

**Endpoint**: `GET /api/auth/me`

**Headers**:
```
Authorization: Bearer <token>
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "user-123",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "admin"
  }
}
```

## Agent Endpoints

### List Agents

Get all agents with optional filtering.

**Endpoint**: `GET /api/agents`

**Query Parameters**:
- `departmentId` (optional): Filter by department
- `status` (optional): Filter by status
- `limit` (optional): Results per page (default: 10)
- `page` (optional): Page number (default: 1)

**Example**:
```
GET /api/agents?departmentId=dept-research&limit=20
```

**Response**:
```json
{
  "success": true,
  "data": {
    "docs": [
      {
        "id": "agent-1",
        "agentId": "agent-research-001",
        "name": "Research Lead",
        "isDepartmentHead": true,
        "department": {
          "id": "dept-research",
          "name": "Research",
          "color": "#3B82F6",
          "icon": "🔬"
        },
        "isActive": true,
        "performanceMetrics": {
          "successRate": 95,
          "averageExecutionTime": 2500,
          "totalExecutions": 150
        }
      }
    ],
    "totalDocs": 15,
    "limit": 20,
    "page": 1,
    "totalPages": 1
  }
}
```

### Get Agent

Get specific agent by ID.

**Endpoint**: `GET /api/agents/:id`

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "agent-1",
    "agentId": "agent-research-001",
    "name": "Research Lead",
    "isDepartmentHead": true,
    "department": {...},
    "performanceMetrics": {...}
  }
}
```

### Create Agent

Create a new agent.

**Endpoint**: `POST /api/agents`

**Headers**:
```
Authorization: Bearer <token>
```

**Request**:
```json
{
  "agentId": "agent-coding-005",
  "name": "Code Reviewer",
  "department": "dept-coding",
  "isDepartmentHead": false
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "agent-5",
    "agentId": "agent-coding-005",
    "name": "Code Reviewer",
    "department": {...}
  }
}
```

### Update Agent

Update agent information.

**Endpoint**: `PATCH /api/agents/:id`

**Headers**:
```
Authorization: Bearer <token>
```

**Request**:
```json
{
  "name": "Senior Code Reviewer",
  "isActive": true
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "agent-5",
    "name": "Senior Code Reviewer",
    "isActive": true
  }
}
```

### Delete Agent

Delete an agent.

**Endpoint**: `DELETE /api/agents/:id`

**Headers**:
```
Authorization: Bearer <token>
```

**Response**:
```json
{
  "success": true,
  "message": "Agent deleted successfully"
}
```

## Department Endpoints

### List Departments

Get all departments.

**Endpoint**: `GET /api/departments`

**Response**:
```json
{
  "success": true,
  "data": {
    "docs": [
      {
        "id": "dept-research",
        "slug": "research",
        "name": "Research",
        "description": "Research and analysis department",
        "icon": "🔬",
        "color": "#3B82F6",
        "priority": 1
      }
    ]
  }
}
```

### Get Department

Get specific department.

**Endpoint**: `GET /api/departments/:id`

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "dept-research",
    "name": "Research",
    "description": "Research and analysis department",
    "icon": "🔬",
    "color": "#3B82F6",
    "agentCount": 12
  }
}
```

### Create Department

Create a new department.

**Endpoint**: `POST /api/departments`

**Headers**:
```
Authorization: Bearer <token>
```

**Request**:
```json
{
  "slug": "documentation",
  "name": "Documentation",
  "description": "Technical documentation team",
  "icon": "📚",
  "color": "#10B981",
  "priority": 5
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "dept-documentation",
    "slug": "documentation",
    "name": "Documentation",
    ...
  }
}
```

## Audit Trail Endpoints

### List Executions

Get audit trail with filtering.

**Endpoint**: `GET /api/audit`

**Query Parameters**:
- `executionId` (optional): Specific execution
- `agentId` (optional): Filter by agent
- `departmentId` (optional): Filter by department
- `status` (optional): Filter by status
- `startDate` (optional): Start date filter
- `endDate` (optional): End date filter
- `limit` (optional): Results per page (default: 10)
- `page` (optional): Page number (default: 1)

**Example**:
```
GET /api/audit?departmentId=dept-research&status=completed&limit=50
```

**Response**:
```json
{
  "success": true,
  "data": {
    "executions": [
      {
        "id": "exec-1",
        "executionId": "exec-20250101-001",
        "agent": {
          "id": "agent-1",
          "name": "Research Lead",
          ...
        },
        "department": {
          "id": "dept-research",
          "name": "Research",
          ...
        },
        "status": "completed",
        "prompt": "Analyze market trends",
        "output": {...},
        "qualityScore": 92,
        "startedAt": "2025-01-01T10:00:00Z",
        "completedAt": "2025-01-01T10:02:30Z",
        "executionTime": 2500,
        "tokenUsage": {
          "inputTokens": 150,
          "outputTokens": 450,
          "totalTokens": 600
        },
        "events": [...]
      }
    ],
    "totalDocs": 500,
    "limit": 50,
    "page": 1,
    "totalPages": 10
  }
}
```

### Get Execution

Get specific execution with all events.

**Endpoint**: `GET /api/audit/:executionId`

**Response**:
```json
{
  "success": true,
  "data": {
    "execution": {
      "id": "exec-1",
      "executionId": "exec-20250101-001",
      "agent": {...},
      "department": {...},
      "status": "completed",
      "prompt": "Analyze market trends",
      "output": {...},
      "qualityScore": 92,
      "events": [
        {
          "id": "event-1",
          "type": "agent-start",
          "timestamp": "2025-01-01T10:00:00Z",
          "message": "Starting execution"
        },
        {
          "id": "event-2",
          "type": "tool-call",
          "timestamp": "2025-01-01T10:00:15Z",
          "data": {
            "tool": "web_search",
            "input": {...},
            "output": {...}
          }
        },
        {
          "id": "event-3",
          "type": "agent-complete",
          "timestamp": "2025-01-01T10:02:30Z",
          "message": "Execution completed",
          "qualityScore": 92
        }
      ]
    }
  }
}
```

### Create Execution

Start a new agent execution.

**Endpoint**: `POST /api/audit`

**Headers**:
```
Authorization: Bearer <token>
```

**Request**:
```json
{
  "agentId": "agent-1",
  "prompt": "Analyze market trends for Q1 2025",
  "context": {
    "timeframe": "Q1 2025",
    "focus": "technology sector"
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "executionId": "exec-20250101-002",
    "status": "pending",
    "agent": {...},
    "createdAt": "2025-01-01T11:00:00Z"
  }
}
```

## WebSocket API

### Connection

Connect to WebSocket for real-time updates.

**URL**: `ws://localhost:3000/api/ws` (or `wss://` for HTTPS)

**Connection**:
```javascript
const ws = new WebSocket('ws://localhost:3000/api/ws')

ws.onopen = () => {
  console.log('Connected to WebSocket')
}
```

### Subscribe to Execution

Subscribe to updates for specific execution.

**Message**:
```json
{
  "type": "subscribe",
  "executionId": "exec-20250101-001"
}
```

### Event Messages

WebSocket sends event messages:

```json
{
  "type": "event",
  "executionId": "exec-20250101-001",
  "event": {
    "id": "event-123",
    "type": "tool-call",
    "timestamp": "2025-01-01T10:00:15Z",
    "data": {
      "tool": "web_search",
      "input": "market trends Q1 2025",
      "output": {...}
    }
  }
}
```

### Event Types

- **agent-start**: Execution began
- **tool-call**: Agent used a tool
- **output**: Agent generated output
- **error**: Error occurred
- **agent-complete**: Execution finished
- **status-change**: Status updated

### Unsubscribe

Unsubscribe from execution updates.

**Message**:
```json
{
  "type": "unsubscribe",
  "executionId": "exec-20250101-001"
}
```

### Ping/Pong

Keep connection alive with ping/pong.

**Client sends**:
```json
{ "type": "ping" }
```

**Server responds**:
```json
{ "type": "pong" }
```

### Error Handling

WebSocket errors:

```json
{
  "type": "error",
  "message": "Execution not found",
  "code": "EXECUTION_NOT_FOUND"
}
```

## Error Codes

### HTTP Status Codes

- `200 OK`: Successful request
- `201 Created`: Resource created
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource conflict
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

### Error Response Format

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {...}
}
```

### Common Error Codes

- `AUTH_REQUIRED`: Authentication required
- `INVALID_TOKEN`: Invalid authentication token
- `PERMISSION_DENIED`: Insufficient permissions
- `RESOURCE_NOT_FOUND`: Requested resource not found
- `VALIDATION_ERROR`: Request validation failed
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `INTERNAL_ERROR`: Internal server error

## Rate Limiting

### Limits

- **Authenticated**: 1000 requests per hour
- **Unauthenticated**: 100 requests per hour
- **WebSocket**: 10 connections per IP

### Headers

Response includes rate limit headers:

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 950
X-RateLimit-Reset: 1640995200
```

### Rate Limit Exceeded

```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "code": "RATE_LIMIT_EXCEEDED",
  "details": {
    "limit": 1000,
    "remaining": 0,
    "resetAt": "2025-01-01T12:00:00Z"
  }
}
```

## Examples

### Fetch and Display Execution

```typescript
async function fetchExecution(executionId: string) {
  try {
    const response = await fetch(`/api/audit/${executionId}`)
    const data = await response.json()

    if (data.success) {
      console.log('Execution:', data.data.execution)
      return data.data.execution
    } else {
      throw new Error(data.error)
    }
  } catch (error) {
    console.error('Failed to fetch execution:', error)
    throw error
  }
}
```

### Real-Time Monitoring with WebSocket

```typescript
function useAgentExecution(executionId: string) {
  const [execution, setExecution] = useState(null)
  const [events, setEvents] = useState([])
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    // Fetch initial data
    fetchExecution(executionId).then(setExecution)

    // Connect to WebSocket
    const ws = new WebSocket('ws://localhost:3000/api/ws')

    ws.onopen = () => {
      setIsConnected(true)
      ws.send(JSON.stringify({
        type: 'subscribe',
        executionId
      }))
    }

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data)

      if (message.type === 'event') {
        setEvents(prev => [...prev, message.event])
      }
    }

    ws.onclose = () => {
      setIsConnected(false)
    }

    return () => ws.close()
  }, [executionId])

  return { execution, events, isConnected }
}
```

### Create and Monitor Execution

```typescript
async function runAgentTask(agentId: string, prompt: string) {
  try {
    // Create execution
    const response = await fetch('/api/audit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ agentId, prompt })
    })

    const data = await response.json()

    if (!data.success) {
      throw new Error(data.error)
    }

    const executionId = data.data.executionId

    // Monitor via WebSocket
    const ws = new WebSocket('ws://localhost:3000/api/ws')

    ws.onopen = () => {
      ws.send(JSON.stringify({
        type: 'subscribe',
        executionId
      }))
    }

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data)

      if (message.type === 'event') {
        console.log('Event:', message.event)

        if (message.event.type === 'agent-complete') {
          console.log('Execution completed!')
          ws.close()
        }
      }
    }

    return executionId
  } catch (error) {
    console.error('Failed to run agent task:', error)
    throw error
  }
}
```

### Filtering and Pagination

```typescript
async function fetchDepartmentExecutions(
  departmentId: string,
  status?: string,
  page: number = 1,
  limit: number = 20
) {
  const params = new URLSearchParams({
    departmentId,
    page: page.toString(),
    limit: limit.toString()
  })

  if (status) {
    params.append('status', status)
  }

  const response = await fetch(`/api/audit?${params}`)
  const data = await response.json()

  return data.data
}

// Usage
const executions = await fetchDepartmentExecutions(
  'dept-research',
  'completed',
  1,
  50
)
```

## Next Steps

- Review [State Management Guide](/mnt/d/Projects/aladdin/docs/ui/STATE_MANAGEMENT.md) for integration patterns
- Check [Developer Guide](/mnt/d/Projects/aladdin/docs/ui/DEVELOPER_GUIDE.md) for implementation details
- See [Examples](/mnt/d/Projects/aladdin/docs/ui/examples/) for more code samples
