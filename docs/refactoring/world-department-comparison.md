# World Department Refactoring - Before & After Comparison

## Architecture Change

### BEFORE: Direct LLM Client Pattern ❌
```
┌─────────────────────────────────────┐
│      World Department Class         │
│                                     │
│  ┌────────────────────────────┐   │
│  │  getLLMClient()            │   │
│  │  ↓                          │   │
│  │  llm.completeJSON()        │   │
│  │  ↓                          │   │
│  │  Raw JSON Response         │   │
│  └────────────────────────────┘   │
│                                     │
│  - No execution tracking            │
│  - No retry logic                   │
│  - No performance metrics           │
│  - No event streaming               │
└─────────────────────────────────────┘
```

### AFTER: @codebuff/sdk Agent Pattern ✅
```
┌─────────────────────────────────────────────────────┐
│            World Department Class                   │
│                                                     │
│  ┌───────────────────────────────────────────┐    │
│  │  AladdinAgentRunner                       │    │
│  │  ├─ PayloadCMS Integration                │    │
│  │  │  └─ Fetch agent by slug                │    │
│  │  ├─ Agent Execution                       │    │
│  │  │  └─ @codebuff/sdk with context         │    │
│  │  ├─ Execution Tracking                    │    │
│  │  │  └─ Create execution record            │    │
│  │  ├─ Event Streaming                       │    │
│  │  │  └─ Store events in DB                 │    │
│  │  ├─ Performance Metrics                   │    │
│  │  │  └─ Update agent stats                 │    │
│  │  └─ Retry Logic (3x exponential backoff)  │    │
│  └───────────────────────────────────────────┘    │
│                                                     │
│  + Full audit trail                                 │
│  + Token usage tracking                             │
│  + Success rate monitoring                          │
│  + Execution time metrics                           │
└─────────────────────────────────────────────────────┘
```

## Code Comparison

### 1. Imports

#### BEFORE ❌
```typescript
import { getLLMClient } from '@/lib/llm/client'
import { getPayload } from 'payload'
import config from '@payload-config'
```

#### AFTER ✅
```typescript
import { AladdinAgentRunner } from '@/lib/agents/AladdinAgentRunner'
import { getPayloadClient } from '@/lib/payload'
```

### 2. Agent Execution

#### BEFORE ❌
```typescript
export class WorldDepartment {
  private llm = getLLMClient()

  private async generateStoryBible(worldData: WorldData): Promise<StoryBible> {
    const prompt = `...long prompt...`

    return await this.llm.completeJSON<StoryBible>(prompt, {
      temperature: 0.3,
      maxTokens: 8000
    })
  }
}
```

**Problems:**
- ❌ No execution tracking
- ❌ No retry mechanism
- ❌ No performance metrics
- ❌ No agent versioning
- ❌ No event streaming
- ❌ Hardcoded LLM parameters

#### AFTER ✅
```typescript
export class WorldDepartment {
  private async generateStoryBible(
    worldData: WorldData,
    projectId: string
  ): Promise<StoryBible> {
    const prompt = this.buildWorldPrompt(worldData)

    try {
      // Initialize runner with PayloadCMS
      const payload = await getPayloadClient()
      const runner = new AladdinAgentRunner(
        process.env.OPENROUTER_API_KEY!,
        payload
      )

      // Get agent from PayloadCMS (versioned, configurable)
      const agents = await payload.find({
        collection: 'agents',
        where: { slug: { equals: 'world-department-agent' } },
        limit: 1
      })

      if (!agents.docs.length) {
        throw new Error('World Department Agent not found in PayloadCMS')
      }

      // Execute with full context and tracking
      const result = await runner.executeAgent(
        agents.docs[0].id,
        prompt,
        {
          projectId,
          conversationId: `world-${projectId}`,
          metadata: {
            department: 'world',
            dataSize: {
              worldElements: worldData.worldElements.length,
              characters: worldData.characters.length,
              locations: worldData.locations.length,
              rules: worldData.rules.length
            }
          }
        }
      )

      // Parse and validate
      const storyBible = this.parseStoryBible(result.output)
      return storyBible

    } catch (error) {
      console.error('[WorldDept] Failed to generate story bible:', error)
      throw new Error(
        `Story bible generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  // Separated concerns
  private buildWorldPrompt(worldData: WorldData): string { ... }
  private parseStoryBible(output: unknown): StoryBible { ... }
}
```

**Benefits:**
- ✅ Full execution tracking in `agent-executions` collection
- ✅ Automatic retry (3x with exponential backoff)
- ✅ Performance metrics (success rate, avg time, token usage)
- ✅ Agent versioning via PayloadCMS
- ✅ Event streaming support
- ✅ Configurable via CMS (no code changes needed)
- ✅ Better error handling and logging
- ✅ Separated concerns (build prompt, parse output)

### 3. Error Handling & Retry Logic

#### BEFORE ❌
```typescript
// No retry logic - single attempt
return await this.llm.completeJSON<StoryBible>(prompt, ...)
```

#### AFTER ✅
```typescript
// Built-in retry in AladdinAgentRunner:
// - 3 retries with exponential backoff
// - Retry tracking in database
// - Execution status updates

if (currentRetryCount < maxRetries) {
  // Increment retry count
  await this.payload.update({
    collection: 'agent-executions',
    id: execution.id,
    data: {
      retryCount: currentRetryCount + 1,
      status: 'pending',
    },
  })

  // Exponential backoff: 1s, 2s, 4s
  const delay = Math.pow(2, currentRetryCount) * 1000
  await new Promise((resolve) => setTimeout(resolve, delay))

  // Retry execution
  return this.executeAgent(agentId, prompt, context, onEvent)
}
```

### 4. Performance Metrics

#### BEFORE ❌
```typescript
// No metrics tracking
// No visibility into agent performance
```

#### AFTER ✅
```typescript
// Automatic metrics update after each execution
await this.payload.update({
  collection: 'agents',
  id: agentId,
  data: {
    performanceMetrics: {
      totalExecutions: totalExecutions,
      successfulExecutions: successfulExecutions,
      failedExecutions: failedExecutions,
      averageExecutionTime: Math.round(averageExecutionTime),
      successRate: Math.round(successRate * 100) / 100,
    },
    lastExecutedAt: new Date(),
  },
})
```

**Tracked Metrics:**
- Total executions
- Success/failure counts
- Success rate percentage
- Average execution time
- Last execution timestamp
- Token usage per execution

### 5. Execution Tracking

#### BEFORE ❌
```typescript
// No execution records
// No audit trail
// No debugging capability
```

#### AFTER ✅
```typescript
// Create execution record
const execution = await this.payload.create({
  collection: 'agent-executions',
  data: {
    agent: agent.id,
    department: department.id,
    project: context.projectId,
    episode: context.episodeId,
    conversationId: context.conversationId,
    prompt,
    params: context.metadata,
    status: 'running',
    startedAt: new Date(),
    retryCount: 0,
    maxRetries: agent.executionSettings?.maxRetries || 3,
  },
})

// Update with results
await this.payload.update({
  collection: 'agent-executions',
  id: execution.id,
  data: {
    status: 'completed',
    completedAt: new Date(),
    output: result.output,
    runState: result,
    executionTime,
    tokenUsage: this.extractTokenUsage(result),
  },
})
```

**Tracked Data:**
- Agent used
- Department context
- Project/episode/conversation IDs
- Input prompt
- Execution parameters
- Status (running/completed/failed)
- Start/end timestamps
- Output and run state
- Token usage
- Retry attempts
- Error details (if failed)

## Data Flow Comparison

### BEFORE: Simple Flow ❌
```
Gather DB → World Data → LLM Client → JSON Response → Store
```

### AFTER: Tracked Flow ✅
```
Gather DB → World Data → Agent Execution → Result → Store
                               ↓
                    ┌──────────────────────┐
                    │  Execution Tracking  │
                    ├──────────────────────┤
                    │ - Create record      │
                    │ - Store events       │
                    │ - Update metrics     │
                    │ - Track tokens       │
                    │ - Handle retries     │
                    └──────────────────────┘
```

## Migration Benefits Summary

### Operational Benefits
- **Observability**: Full execution history and audit trail
- **Reliability**: Automatic retry with exponential backoff
- **Performance**: Metrics tracking and optimization insights
- **Debugging**: Event streaming and detailed error logs
- **Scalability**: Agent configuration via CMS, no code deploys

### Technical Benefits
- **Standardization**: Consistent pattern across all departments
- **Maintainability**: Separated concerns (build, execute, parse)
- **Testability**: Better error handling and validation
- **Flexibility**: Agent versioning and A/B testing support
- **Integration**: Built-in PayloadCMS and brain service integration

### Business Benefits
- **Cost Tracking**: Token usage and execution cost monitoring
- **Quality Assurance**: Success rate and performance benchmarks
- **Compliance**: Full audit trail for regulatory requirements
- **Iteration Speed**: Update agents via CMS without code changes

## Next Steps

1. **Verify Agent Setup**: Ensure `world-department-agent` exists in PayloadCMS
2. **Run Tests**: Execute test suite to verify functionality
3. **Monitor Performance**: Check execution metrics after deployment
4. **Optimize**: Use metrics to improve agent prompts and configuration

## Related Files

- `/src/lib/qualification/worldDepartment.ts` - Refactored implementation
- `/src/lib/agents/AladdinAgentRunner.ts` - Agent execution engine
- `/tests/world-department-refactor.test.ts` - Test suite
- `/docs/refactoring/world-department-refactor.md` - Detailed documentation
