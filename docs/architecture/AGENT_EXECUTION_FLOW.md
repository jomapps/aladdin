# Agent Execution Flow

## Architecture Overview

The Aladdin system uses a sophisticated agent-based architecture where all AI interactions are managed through dynamic agents stored in PayloadCMS and executed via @codebuff/sdk.

```
┌─────────────────────────────────────────────────────────┐
│                   PayloadCMS (Source of Truth)           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐ │
│  │   Agents    │  │ Departments │  │  Custom Tools   │ │
│  │ Collection  │  │ Collection  │  │   Collection    │ │
│  └─────────────┘  └─────────────┘  └─────────────────┘ │
└───────────────────────────┬─────────────────────────────┘
                            │
                            ▼
              ┌─────────────────────────┐
              │  AladdinAgentRunner     │
              │  (Execution Engine)     │
              │                         │
              │  - Load agent from CMS  │
              │  - Load custom tools    │
              │  - Execute via SDK      │
              │  - Track execution      │
              └────────────┬────────────┘
                           │
                           ▼
              ┌─────────────────────────┐
              │    @codebuff/sdk        │
              │  (LLM Abstraction)      │
              │                         │
              │  - API routing          │
              │  - Tool execution       │
              │  - Event streaming      │
              └────────────┬────────────┘
                           │
              ┌────────────┴────────────┐
              ▼                         ▼
    ┌──────────────────┐      ┌──────────────────┐
    │   OpenRouter     │      │    Anthropic     │
    │   (Multi-model)  │      │    (Direct)      │
    └──────────────────┘      └──────────────────┘
```

---

## Core Components

### 1. Agent Definitions (PayloadCMS)

Agents are stored in the `agents` collection with complete configuration:

```typescript
interface Agent {
  id: string
  agentId: string                    // Unique identifier (e.g., 'story-head-001')
  name: string                       // Display name
  department: string                 // Department reference
  model: string                      // LLM model (e.g., 'claude-sonnet-4.5')
  instructionsPrompt: string         // System prompt
  toolNames: Array<{                 // Tools this agent can use
    toolName: string
  }>
  maxAgentSteps: number              // Max execution steps
  isActive: boolean                  // Enable/disable agent
  executionSettings: {
    maxRetries: number
    timeout: number
  }
  performanceMetrics: {
    totalExecutions: number
    successfulExecutions: number
    failedExecutions: number
    averageExecutionTime: number
    successRate: number
  }
}
```

### 2. AladdinAgentRunner (Execution Engine)

The AladdinAgentRunner bridges PayloadCMS and @codebuff/sdk:

```typescript
import { CodebuffClient } from '@codebuff/sdk'
import type { Payload } from 'payload'

export class AladdinAgentRunner {
  private client: CodebuffClient
  private payload: Payload

  constructor(apiKey: string, payload: Payload, cwd?: string) {
    // Auto-detect OpenRouter vs Anthropic
    const useOpenRouter = !!process.env.OPENROUTER_BASE_URL

    this.client = new CodebuffClient({
      apiKey: useOpenRouter ? process.env.OPENROUTER_API_KEY : apiKey,
      baseURL: useOpenRouter ? process.env.OPENROUTER_BASE_URL : undefined,
      cwd: cwd || process.cwd()
    })

    this.payload = payload
  }

  async executeAgent(
    agentId: string,
    prompt: string,
    context: AgentExecutionContext
  ): Promise<AgentExecutionResult> {
    // 1. Fetch agent from PayloadCMS
    const agent = await this.payload.find({
      collection: 'agents',
      where: { agentId: { equals: agentId }, isActive: { equals: true } }
    })

    // 2. Load custom tools for this agent
    const tools = await this.loadCustomTools(agent)

    // 3. Create agent definition for @codebuff/sdk
    const agentDefinition = {
      id: agent.agentId,
      model: agent.model,
      displayName: agent.name,
      toolNames: agent.toolNames,
      instructionsPrompt: agent.instructionsPrompt
    }

    // 4. Create execution tracking record
    const execution = await this.payload.create({
      collection: 'agent-executions',
      data: {
        agent: agent.id,
        department: agent.department,
        project: context.projectId,
        prompt,
        status: 'running',
        startedAt: new Date()
      }
    })

    // 5. Execute via @codebuff/sdk
    const result = await this.client.run({
      agent: agent.agentId,
      prompt,
      agentDefinitions: [agentDefinition],
      customToolDefinitions: tools,
      maxAgentSteps: agent.maxAgentSteps,
      handleEvent: async (event) => {
        // Store real-time events
        await this.handleAgentEvent(execution.id, event)
      }
    })

    // 6. Update execution with results
    await this.payload.update({
      collection: 'agent-executions',
      id: execution.id,
      data: {
        status: 'completed',
        output: result.output,
        runState: result,
        executionTime: Date.now() - startTime,
        tokenUsage: this.extractTokenUsage(result)
      }
    })

    return {
      executionId: execution.id,
      output: result.output,
      runState: result
    }
  }
}
```

### 3. @codebuff/sdk (LLM Abstraction Layer)

The @codebuff/sdk handles all LLM API calls:

```typescript
import { CodebuffClient } from '@codebuff/sdk'

const client = new CodebuffClient({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: process.env.OPENROUTER_BASE_URL, // Optional: for OpenRouter
  cwd: process.cwd()
})

const result = await client.run({
  agent: 'story-head-001',
  prompt: 'Create a dramatic opening scene',
  agentDefinitions: [agentDefinition],
  customToolDefinitions: [tools],
  handleEvent: (event) => {
    // Real-time event streaming
    console.log('Agent event:', event)
  }
})
```

**Features**:
- Automatic API routing (OpenRouter or Anthropic)
- Tool execution and validation
- Real-time event streaming
- Response parsing and validation
- Error handling and retries

---

## Usage Patterns

### 1. Direct Agent Execution

```typescript
import { AladdinAgentRunner } from '@/lib/agents/AladdinAgentRunner'
import { getPayload } from 'payload'
import config from '@payload-config'

const payload = await getPayload({ config })
const runner = new AladdinAgentRunner(
  process.env.CODEBUFF_API_KEY!,
  payload
)

const result = await runner.executeAgent(
  'story-head-001',
  'Create a dramatic opening scene',
  {
    projectId: 'proj-123',
    conversationId: 'conv-456',
    metadata: { department: 'story' }
  }
)

console.log('Story output:', result.output)
```

### 2. Qualification System Integration

```typescript
// World Department Processor
export async function processWorldData(
  projectId: string,
  projectSlug: string,
  userId: string
) {
  const payload = await getPayload({ config })
  const runner = new AladdinAgentRunner(
    process.env.CODEBUFF_API_KEY!,
    payload
  )

  // Execute world-processor agent
  const result = await runner.executeAgent(
    'world-processor-001',
    `Generate story bible for project ${projectSlug}`,
    {
      projectId,
      conversationId: `world-${projectId}`,
      metadata: {
        department: 'world',
        userId,
        projectSlug
      }
    }
  )

  return result.output as StoryBible
}

// Story Department Processor
export async function processStory(
  projectId: string,
  projectSlug: string,
  userId: string
) {
  const payload = await getPayload({ config })
  const runner = new AladdinAgentRunner(
    process.env.CODEBUFF_API_KEY!,
    payload
  )

  // Execute story-processor agent
  const result = await runner.executeAgent(
    'story-processor-001',
    `Generate screenplay and scenes for project ${projectSlug}`,
    {
      projectId,
      conversationId: `story-${projectId}`,
      metadata: {
        department: 'story',
        userId,
        projectSlug
      }
    }
  )

  return result.output as { screenplay: string; scenes: Scene[] }
}
```

### 3. Real-Time Event Streaming

```typescript
const result = await runner.executeAgent(
  'character-head-001',
  'Design main character',
  context,
  async (event) => {
    // Handle real-time events
    if (event.type === 'tool_use') {
      console.log('Tool:', event.tool, 'Input:', event.input)
    } else if (event.type === 'content') {
      console.log('Response:', event.content)
    }

    // Send to WebSocket clients
    await broadcastToClients({
      type: 'agent_event',
      event
    })
  }
)
```

### 4. Custom Tool Usage

Agents can use tools defined in the `custom-tools` collection:

```typescript
// Custom tool in PayloadCMS
{
  toolName: 'getProjectContext',
  description: 'Retrieve project context from database',
  inputSchema: {
    type: 'object',
    properties: {
      projectId: { type: 'string' }
    },
    required: ['projectId']
  },
  executeFunction: `async ({ projectId }) => {
    const project = await payload.findByID({
      collection: 'projects',
      id: projectId
    })
    return {
      name: project.name,
      description: project.description,
      genre: project.genre
    }
  }`,
  departments: ['story', 'character', 'visual'],
  isGlobal: false,
  isActive: true
}
```

Agent automatically loads and uses this tool:

```
User: "Create a character that fits the project"

Agent: <thinking>I need project context first</thinking>
       <tool_use>getProjectContext({ projectId: "proj-123" })</tool_use>

Tool Result: { name: "Epic Quest", genre: "Fantasy", ... }

Agent: Based on the Fantasy genre, I'll create a warrior character...
```

---

## Execution Tracking

All agent executions are tracked in the `agent-executions` collection:

```typescript
interface AgentExecution {
  id: string
  agent: string              // Agent ID reference
  department: string         // Department ID reference
  project: string            // Project ID reference
  episode?: string           // Episode ID (if applicable)
  conversationId: string     // Conversation grouping

  prompt: string             // Input prompt
  params?: Record<string, unknown>  // Additional parameters

  status: 'pending' | 'running' | 'completed' | 'failed'

  output?: unknown           // Agent's final output
  runState?: RunState        // Full @codebuff/sdk run state

  events?: Array<{           // Real-time events
    event: unknown
    timestamp: Date
  }>

  executionTime?: number     // Milliseconds
  tokenUsage?: {
    inputTokens: number
    outputTokens: number
    totalTokens: number
    estimatedCost?: number
  }

  error?: {
    message: string
    code?: string
    stack?: string
    details?: unknown
  }

  retryCount: number
  maxRetries: number

  startedAt: Date
  completedAt?: Date

  createdBy?: string         // User who triggered execution
}
```

---

## Configuration

### Environment Variables

```bash
# @codebuff/sdk Configuration
CODEBUFF_API_KEY=your_api_key  # Default for Anthropic direct

# OpenRouter Configuration (Optional)
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_DEFAULT_MODEL=anthropic/claude-sonnet-4.5

# Agent Execution Settings
AGENT_MAX_RETRIES=3
AGENT_TIMEOUT=300000  # 5 minutes
AGENT_MAX_STEPS=20
```

### Model Selection

Agents can use different models per-agent in PayloadCMS:

```typescript
// Agent configuration
{
  agentId: 'story-head-001',
  model: 'anthropic/claude-sonnet-4.5',  // Via OpenRouter
  // OR
  model: 'claude-3-5-sonnet-20241022',   // Direct Anthropic
}
```

---

## Error Handling

### Automatic Retry Logic

```typescript
// Retry with exponential backoff
const currentRetryCount = execution.retryCount || 0
const maxRetries = execution.maxRetries || 3

if (currentRetryCount < maxRetries) {
  await this.payload.update({
    collection: 'agent-executions',
    id: execution.id,
    data: {
      retryCount: currentRetryCount + 1,
      status: 'pending'
    }
  })

  const delay = Math.pow(2, currentRetryCount) * 1000
  await new Promise(resolve => setTimeout(resolve, delay))

  return this.executeAgent(agentId, prompt, context)
}
```

### Error Types

```typescript
// Agent not found
throw new Error(`Agent not found or inactive: ${agentId}`)

// Tool loading failure
console.error(`Failed to load tool ${toolName}:`, error)
// Continues execution with available tools

// API failure
catch (error) {
  await this.payload.update({
    collection: 'agent-executions',
    id: execution.id,
    data: {
      status: 'failed',
      error: {
        message: error.message,
        code: error.code,
        stack: error.stack
      }
    }
  })
}
```

---

## Performance Metrics

Agent performance is automatically tracked:

```typescript
interface PerformanceMetrics {
  totalExecutions: number          // Total runs
  successfulExecutions: number     // Successful runs
  failedExecutions: number         // Failed runs
  averageExecutionTime: number     // Average time (ms)
  successRate: number              // Success percentage
  lastExecutedAt: Date             // Last execution timestamp
}
```

Updated after each execution:

```typescript
const totalExecutions = (metrics.totalExecutions || 0) + 1
const successfulExecutions = (metrics.successfulExecutions || 0) + (success ? 1 : 0)
const averageExecutionTime =
  (currentAvgTime * (totalExecutions - 1) + executionTime) / totalExecutions
const successRate = (successfulExecutions / totalExecutions) * 100

await this.payload.update({
  collection: 'agents',
  id: agentId,
  data: {
    performanceMetrics: {
      totalExecutions,
      successfulExecutions,
      failedExecutions,
      averageExecutionTime: Math.round(averageExecutionTime),
      successRate: Math.round(successRate * 100) / 100
    },
    lastExecutedAt: new Date()
  }
})
```

---

## Best Practices

### 1. Agent Design
- Keep system prompts focused and specific
- Use clear tool descriptions
- Define example inputs for tools
- Set appropriate max steps (10-20 typically)

### 2. Tool Development
- Validate inputs thoroughly
- Return structured data
- Handle errors gracefully
- Use TypeScript for type safety

### 3. Execution Context
- Always provide projectId for data isolation
- Use conversationId for related executions
- Include relevant metadata for debugging

### 4. Error Handling
- Set realistic retry limits (3-5)
- Implement exponential backoff
- Log errors for monitoring
- Provide user-friendly error messages

### 5. Performance
- Monitor execution times
- Track success rates
- Identify slow tools
- Optimize prompts and tool usage

---

## Troubleshooting

### Agent Not Executing

**Check**:
1. Agent exists in PayloadCMS: `agents` collection
2. Agent is active: `isActive = true`
3. Department reference is valid
4. API keys are configured

### Tool Loading Failures

**Check**:
1. Tool exists in `custom-tools` collection
2. Tool is active: `isActive = true`
3. Tool's `executeFunction` is valid JavaScript
4. Tool's department matches agent's department

### API Errors

**Check**:
1. OpenRouter/Anthropic API key is valid
2. Base URL is correct (for OpenRouter)
3. Model is available (check agent.model)
4. Rate limits are not exceeded

### Performance Issues

**Monitor**:
1. Agent execution time in `agent-executions`
2. Token usage per execution
3. Tool execution duration
4. API response times

---

## Examples

### Complete Workflow Example

```typescript
// 1. Create agent in PayloadCMS
await payload.create({
  collection: 'agents',
  data: {
    agentId: 'world-builder-001',
    name: 'World Builder Agent',
    department: worldDepartmentId,
    model: 'anthropic/claude-sonnet-4.5',
    instructionsPrompt: `You are a world-building expert...`,
    toolNames: [
      { toolName: 'getProjectContext' },
      { toolName: 'queryBrain' },
      { toolName: 'saveWorldRule' }
    ],
    maxAgentSteps: 15,
    isActive: true
  }
})

// 2. Create custom tool
await payload.create({
  collection: 'custom-tools',
  data: {
    toolName: 'saveWorldRule',
    description: 'Save a world rule to the database',
    inputSchema: {
      type: 'object',
      properties: {
        category: { type: 'string' },
        rule: { type: 'string' }
      },
      required: ['category', 'rule']
    },
    executeFunction: `async ({ category, rule }) => {
      await payload.create({
        collection: 'world-rules',
        data: { category, rule }
      })
      return { success: true }
    }`,
    departments: [worldDepartmentId],
    isActive: true
  }
})

// 3. Execute agent
const runner = new AladdinAgentRunner(
  process.env.CODEBUFF_API_KEY!,
  payload
)

const result = await runner.executeAgent(
  'world-builder-001',
  'Create magic system rules for this fantasy world',
  {
    projectId: 'proj-123',
    conversationId: 'world-building-session-1'
  },
  async (event) => {
    console.log('Event:', event)
  }
)

console.log('World rules created:', result.output)
```

---

## Migration Notes

### From Direct LLM Calls to Agent-Based

**Before** (Direct LLM):
```typescript
const response = await llmClient.complete(prompt, {
  model: 'claude-sonnet-4.5',
  tools: [tool1, tool2]
})
```

**After** (Agent-Based):
```typescript
// 1. Create agent in PayloadCMS (one-time)
// 2. Execute via AladdinAgentRunner
const result = await runner.executeAgent(
  'agent-id',
  prompt,
  context
)
```

**Benefits**:
- Centralized agent management
- Execution tracking and audit trail
- Performance metrics
- Dynamic tool loading
- Real-time event streaming
- Automatic retries
- Model flexibility per-agent

---

## Future Enhancements

1. **Agent Chains**: Sequential agent execution
2. **Agent Swarms**: Parallel multi-agent coordination
3. **Learning**: Agent self-improvement from executions
4. **A/B Testing**: Compare agent configurations
5. **Cost Optimization**: Model selection based on task complexity
6. **Human-in-Loop**: Approval workflows for critical decisions
