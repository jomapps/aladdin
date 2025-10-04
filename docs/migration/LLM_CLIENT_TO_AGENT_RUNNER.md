# Migration Guide: getLLMClient → AladdinAgentRunner

## Overview

This guide documents the migration from the direct LLM client (`@/lib/llm/client`) to the agent-based architecture using `AladdinAgentRunner`. This migration provides:

- **Consistent Architecture**: All LLM calls go through the agent system
- **CMS-Managed Agents**: Agent definitions live in PayloadCMS
- **Tool Integration**: Agents can use custom tools defined in CMS
- **Execution Tracking**: All agent runs are tracked and auditable
- **Real-Time Events**: Stream execution events for better UX
- **Better Error Handling**: Retry logic and failure recovery built-in

## Migration Status

### ✅ Completed
- AladdinAgentRunner implementation
- Agent collections in PayloadCMS
- Custom tools infrastructure
- Agent execution tracking

### 🔄 In Progress
- Migrating existing LLM client usages
- Creating agent definitions for existing use cases
- Deprecation warnings on old client

## Old Pattern (Deprecated)

```typescript
import { getLLMClient } from '@/lib/llm/client'

const llm = getLLMClient()

// Simple completion
const response = await llm.complete(prompt)

// Chat completion
const response = await llm.chat(messages, {
  temperature: 0.7,
  maxTokens: 2000
})

// JSON completion
const result = await llm.completeJSON<MyType>(prompt, {
  temperature: 0.3
})
```

## New Pattern (Recommended)

### 1. Basic Agent Execution

```typescript
import { AladdinAgentRunner } from '@/lib/agents/AladdinAgentRunner'
import { getPayload } from 'payload'
import config from '@/payload.config'

const payload = await getPayload({ config })
const runner = new AladdinAgentRunner(
  process.env.OPENROUTER_API_KEY || '',
  payload
)

const result = await runner.executeAgent(
  'agent-id-from-cms', // Agent ID from PayloadCMS
  'Your prompt here',
  {
    projectId: 'project-123',
    conversationId: 'conv-456',
    metadata: { /* optional */ }
  }
)

console.log(result.output)
```

### 2. With Real-Time Events

```typescript
const result = await runner.executeAgent(
  'agent-id-from-cms',
  prompt,
  context,
  async (event) => {
    // Handle real-time events
    console.log('Agent event:', event)
    // Could emit SSE, update UI, etc.
  }
)
```

### 3. Department-Specific Agents

For department workflows like Story, World, Character, etc:

```typescript
// Define agent in PayloadCMS with:
// - agentId: 'story-head-001'
// - department: 'Story Department'
// - model: 'anthropic/claude-sonnet-4.5'
// - instructionsPrompt: 'You are a story consultant...'
// - toolNames: ['story-bible-tool', 'scene-breakdown-tool']

const runner = new AladdinAgentRunner(apiKey, payload)

const result = await runner.executeAgent(
  'story-head-001',
  `Generate screenplay from: ${JSON.stringify(storyBible)}`,
  {
    projectId,
    conversationId,
    metadata: { storyBible, characters }
  }
)

const screenplay = result.output
```

## Migration Steps

### Step 1: Create Agent Definition in CMS

1. Navigate to **Admin → Agents** in PayloadCMS
2. Click **Create New Agent**
3. Fill in required fields:
   - **Agent ID**: Unique identifier (e.g., `story-head-001`)
   - **Name**: Display name
   - **Department**: Link to department
   - **Model**: `anthropic/claude-sonnet-4.5`
   - **Instructions Prompt**: System prompt for the agent
   - **Tool Names**: Select custom tools (optional)

### Step 2: Replace LLM Client Usage

```typescript
// OLD ❌
import { getLLMClient } from '@/lib/llm/client'
const llm = getLLMClient()
const response = await llm.complete(prompt)

// NEW ✅
import { AladdinAgentRunner } from '@/lib/agents/AladdinAgentRunner'
import { getPayload } from 'payload'
import config from '@/payload.config'

const payload = await getPayload({ config })
const runner = new AladdinAgentRunner(
  process.env.OPENROUTER_API_KEY || '',
  payload
)
const result = await runner.executeAgent(
  'your-agent-id',
  prompt,
  { projectId, conversationId }
)
const response = result.output
```

### Step 3: Update Type Handling

```typescript
// OLD: JSON parsing
const result = await llm.completeJSON<MyType>(prompt)

// NEW: Parse from agent output
const result = await runner.executeAgent('agent-id', prompt, context)
const parsed = JSON.parse(result.output as string) as MyType
```

### Step 4: Handle Errors

```typescript
const result = await runner.executeAgent('agent-id', prompt, context)

if (result.error) {
  console.error('Agent execution failed:', result.error)
  // Handle error
} else {
  console.log('Agent output:', result.output)
  console.log('Execution time:', result.executionTime)
  console.log('Token usage:', result.tokenUsage)
}
```

## Benefits of New Architecture

### 1. Agent Definitions in CMS
- **No Code Changes**: Update prompts, models, and tools without deploying
- **Version Control**: Track agent changes over time
- **A/B Testing**: Compare different agent configurations
- **Reusability**: Share agents across departments

### 2. Execution Tracking
- **Audit Trail**: Every agent run is logged with full context
- **Performance Metrics**: Track success rates, execution times
- **Debugging**: Review execution events and errors
- **Cost Tracking**: Monitor token usage per agent

### 3. Tool Integration
- **Custom Tools**: Agents can use CMS-defined tools
- **Department-Specific**: Tools scoped to departments
- **Dynamic Loading**: Tools loaded based on agent configuration
- **Sandboxed Execution**: Safe tool execution environment

### 4. Better UX
- **Real-Time Events**: Stream agent progress to UI
- **Retry Logic**: Automatic retries on transient failures
- **Progress Indicators**: Show users what's happening
- **Error Recovery**: Graceful degradation

## Common Migration Patterns

### Pattern 1: Content Enhancement (Evaluation Enhancer)

```typescript
// OLD
const llm = getLLMClient()
const response = await llm.chat([...messages], options)
const improvements = JSON.parse(response.content)

// NEW
const runner = new AladdinAgentRunner(apiKey, payload)
const result = await runner.executeAgent(
  'evaluation-enhancer-001',
  `Create enhancements for: ${evaluationSummary}`,
  {
    projectId,
    conversationId: `eval-${evaluationId}`,
    metadata: { issues, suggestions, rating }
  }
)
const improvements = JSON.parse(result.output as string)
```

### Pattern 2: Department Processing (Story/World)

```typescript
// OLD
private llm = getLLMClient()
const storyBible = await this.llm.completeJSON<StoryBible>(prompt, options)

// NEW
private runner: AladdinAgentRunner

async processWorldData(...) {
  const result = await this.runner.executeAgent(
    'world-department-001',
    prompt,
    { projectId, conversationId, metadata: { worldData } }
  )
  return JSON.parse(result.output as string) as StoryBible
}
```

### Pattern 3: Chat/Conversation

```typescript
// OLD
const llmClient = getLLMClient()
const llmResponse = await llmClient.chat(messages, options)

// NEW
const runner = new AladdinAgentRunner(apiKey, payload)
const result = await runner.executeAgent(
  'chat-assistant-001',
  content,
  {
    projectId,
    conversationId,
    previousRun: lastRunState, // For conversation continuity
    metadata: { brainContext }
  }
)
```

## Agent Configuration Examples

### Story Department Agent

```json
{
  "agentId": "story-head-001",
  "name": "Story Department Lead",
  "department": "Story Department",
  "model": "anthropic/claude-sonnet-4.5",
  "instructionsPrompt": "You are a master screenwriter creating professional screenplays...",
  "toolNames": ["story-bible-tool", "scene-breakdown-tool"],
  "maxAgentSteps": 20,
  "executionSettings": {
    "maxRetries": 3,
    "timeout": 120000
  }
}
```

### Evaluation Enhancer Agent

```json
{
  "agentId": "evaluation-enhancer-001",
  "name": "Evaluation Enhancement Specialist",
  "department": "Quality Department",
  "model": "anthropic/claude-sonnet-4.5",
  "instructionsPrompt": "You are an expert movie production assistant creating CONCRETE DELIVERABLES...",
  "toolNames": ["gather-tool", "brain-search-tool"],
  "maxAgentSteps": 15
}
```

### Chat Assistant Agent

```json
{
  "agentId": "chat-assistant-001",
  "name": "Creative Chat Assistant",
  "department": "General",
  "model": "anthropic/claude-sonnet-4.5",
  "instructionsPrompt": "You are a helpful AI assistant for creative professionals...",
  "toolNames": ["brain-search-tool", "project-context-tool"],
  "maxAgentSteps": 10
}
```

## Deprecation Timeline

### Phase 1: Migration (Current)
- ✅ AladdinAgentRunner implementation complete
- 🔄 Migrating existing usages
- ⚠️ Deprecation warnings added to LLM client
- 📚 Migration guide created

### Phase 2: Transition (Next 2 Sprints)
- All new code must use AladdinAgentRunner
- No new LLM client usages permitted
- Active migration of remaining files
- Create agent definitions for all use cases

### Phase 3: Removal (Future)
- Remove `@/lib/llm/client.ts`
- Clean up deprecated imports
- Update all documentation
- Final verification

## Troubleshooting

### Issue: Agent not found
**Solution**: Ensure agent exists in PayloadCMS and `isActive: true`

### Issue: Custom tools not loading
**Solution**: Check tool is marked `isActive: true` and either `isGlobal: true` or linked to agent's department

### Issue: JSON parsing fails
**Solution**: Update agent instructions to explicitly request JSON format, or add JSON parsing to tool

### Issue: Token limits exceeded
**Solution**: Adjust `maxTokens` in agent execution settings, or break into smaller prompts

## Support & Questions

- **Documentation**: `/docs/architecture/AGENT_ARCHITECTURE.md`
- **Examples**: `/src/lib/agents/examples/`
- **Issues**: Create GitHub issue with `migration` label
- **Slack**: #aladdin-architecture channel

---

**Last Updated**: 2025-10-04
**Migration Lead**: Code Cleanup Specialist
**Status**: In Progress
