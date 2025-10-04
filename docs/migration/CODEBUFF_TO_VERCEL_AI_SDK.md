# Migration Plan: Codebuff SDK → Vercel AI SDK

## 🎯 Executive Summary

**Goal:** Replace Codebuff SDK with Vercel AI SDK while maintaining all existing architecture, PayloadCMS agent definitions, and custom tools.

**Why:** Codebuff SDK has Next.js compatibility issues (`web-tree-sitter` doesn't work in webpack). Vercel AI SDK is built for Next.js and provides better structured outputs.

**Strategy:** Incremental migration, starting with broken enhancement route, then expanding to full agent system.

---

## 📊 What Stays vs What Changes

### ✅ STAYS (No Changes)
- **PayloadCMS Agent Definitions** - Source of truth for agents
- **Agent Collections** - `agents`, `departments`, `agent-executions`
- **Custom Tools** - `query_brain`, `save_to_gather`, `get_project_context`
- **Orchestration Hierarchy** - Master → Department Heads → Specialists
- **Agent Execution Tracking** - Still stored in PayloadCMS
- **FAL.ai Client** - Unchanged (image/video generation)
- **Brain Service** - Unchanged (Neo4j semantic search)
- **Gather Database** - Unchanged (MongoDB unqualified content)
- **OpenRouter Configuration** - Same API keys and models

### 🔄 CHANGES (Execution Layer Only)
- **LLM Execution Engine** - Codebuff SDK → Vercel AI SDK
- **Agent Runner Implementation** - New execution logic
- **Tool Format** - Convert to Vercel AI SDK tool schema
- **Response Parsing** - Use structured outputs (no more JSON parsing)

---

## 🏗️ Architecture Overview

### Current Architecture (Broken)
```
PayloadCMS Agents → AladdinAgentRunner → CodebuffClient → ❌ web-tree-sitter error
                                              ↓
                                         Custom Tools
```

### New Architecture (Working)
```
PayloadCMS Agents → AladdinAgentRunner → Vercel AI SDK → ✅ Works in Next.js
                                              ↓
                                         Custom Tools (converted format)
```

**Key Insight:** Only the execution engine changes. Everything else stays the same!

---

## 📋 Detailed Implementation Plan

## Phase 1: Setup Vercel AI SDK Infrastructure

**Duration:** 30 minutes

### 1.1 Install Dependencies
```bash
pnpm add ai @ai-sdk/openai zod
```

### 1.2 Create Base AI Client
**File:** `src/lib/ai/client.ts` (NEW)

```typescript
import { createOpenAI } from '@ai-sdk/openai'

/**
 * OpenRouter client configured for Vercel AI SDK
 * Uses OpenRouter to access all LLM models
 */
export const openrouter = createOpenAI({
  apiKey: process.env.OPENROUTER_API_KEY!,
  baseURL: process.env.OPENROUTER_BASE_URL!, // https://openrouter.ai/api/v1
})

/**
 * Get model instance by name
 * Supports all OpenRouter models
 */
export function getModel(modelName?: string) {
  const model = modelName || process.env.OPENROUTER_DEFAULT_MODEL || 'anthropic/claude-sonnet-4.5'
  return openrouter(model)
}

/**
 * Default model for general use
 */
export const defaultModel = getModel()
```

### 1.3 Create Types
**File:** `src/lib/ai/types.ts` (NEW)

```typescript
import { z } from 'zod'
import type { CoreTool } from 'ai'

/**
 * Agent execution result from Vercel AI SDK
 */
export interface AIAgentResult {
  text: string
  object?: any // For structured outputs
  toolCalls?: Array<{
    toolName: string
    args: any
    result?: any
  }>
  usage: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  finishReason: 'stop' | 'length' | 'tool-calls' | 'error'
  warnings?: string[]
}

/**
 * Custom tool definition for Vercel AI SDK
 */
export interface AladdinTool extends CoreTool {
  name: string
  description: string
  parameters: z.ZodSchema
  execute: (args: any, context: ToolExecutionContext) => Promise<any>
}

/**
 * Context passed to tool execution
 */
export interface ToolExecutionContext {
  projectId: string
  conversationId?: string
  userId?: string
  metadata?: Record<string, any>
}
```

### 1.4 Update Environment Variables
**File:** `.env` (NO CHANGES NEEDED)

Already configured:
```bash
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_DEFAULT_MODEL=anthropic/claude-sonnet-4.5
```

---

## Phase 2: Create AI Client Wrapper

**Duration:** 2 hours

### 2.1 Create Agent Executor
**File:** `src/lib/ai/agent-executor.ts` (NEW)

This is the core replacement for CodebuffClient. It:
- Loads agent definitions from PayloadCMS
- Executes agents using Vercel AI SDK
- Handles tool calling
- Returns standardized results

```typescript
import { generateText, generateObject } from 'ai'
import { getModel } from './client'
import type { AIAgentResult, AladdinTool, ToolExecutionContext } from './types'
import type { Payload } from 'payload'

export interface AgentExecutionOptions {
  agentId: string
  prompt: string
  context: ToolExecutionContext
  tools?: AladdinTool[]
  structuredOutput?: {
    schema: z.ZodSchema
    description?: string
  }
  maxSteps?: number
}

export class AIAgentExecutor {
  constructor(private payload: Payload) {}

  /**
   * Execute an agent from PayloadCMS using Vercel AI SDK
   */
  async execute(options: AgentExecutionOptions): Promise<AIAgentResult> {
    // 1. Load agent from PayloadCMS
    const agent = await this.loadAgent(options.agentId)
    
    // 2. Get model instance
    const model = getModel(agent.model)
    
    // 3. Build system prompt from agent instructions
    const systemPrompt = agent.instructionsPrompt
    
    // 4. Convert tools to Vercel AI SDK format
    const tools = this.convertTools(options.tools || [])
    
    // 5. Execute with structured output or text generation
    if (options.structuredOutput) {
      return await this.executeStructured(model, systemPrompt, options)
    } else {
      return await this.executeText(model, systemPrompt, options)
    }
  }

  private async loadAgent(agentId: string) {
    const result = await this.payload.find({
      collection: 'agents',
      where: { agentId: { equals: agentId }, isActive: { equals: true } },
      limit: 1,
    })
    
    if (!result.docs.length) {
      throw new Error(`Agent not found: ${agentId}`)
    }
    
    return result.docs[0]
  }

  private convertTools(tools: AladdinTool[]) {
    // Convert to Vercel AI SDK tool format
    return tools.reduce((acc, tool) => {
      acc[tool.name] = {
        description: tool.description,
        parameters: tool.parameters,
        execute: tool.execute,
      }
      return acc
    }, {} as Record<string, any>)
  }

  private async executeStructured(model, systemPrompt, options) {
    const result = await generateObject({
      model,
      system: systemPrompt,
      prompt: options.prompt,
      schema: options.structuredOutput!.schema,
      maxSteps: options.maxSteps || 5,
    })
    
    return {
      text: JSON.stringify(result.object),
      object: result.object,
      usage: result.usage,
      finishReason: result.finishReason,
      warnings: result.warnings,
    }
  }

  private async executeText(model, systemPrompt, options) {
    const result = await generateText({
      model,
      system: systemPrompt,
      prompt: options.prompt,
      tools: this.convertTools(options.tools || []),
      maxSteps: options.maxSteps || 5,
    })
    
    return {
      text: result.text,
      toolCalls: result.toolCalls,
      usage: result.usage,
      finishReason: result.finishReason,
      warnings: result.warnings,
    }
  }
}
```

---

## Phase 3: Migrate Custom Tools

**Duration:** 1.5 hours

### 3.1 Create Tool Registry
**File:** `src/lib/ai/tools/index.ts` (NEW)

```typescript
import { z } from 'zod'
import type { AladdinTool } from '../types'
import { queryBrainTool } from './query-brain'
import { saveToGatherTool } from './save-to-gather'
import { getProjectContextTool } from './get-project-context'

/**
 * Registry of all custom tools
 */
export const toolRegistry: Record<string, AladdinTool> = {
  query_brain: queryBrainTool,
  save_to_gather: saveToGatherTool,
  get_project_context: getProjectContextTool,
}

/**
 * Get tools by names
 */
export function getTools(toolNames: string[]): AladdinTool[] {
  return toolNames
    .map(name => toolRegistry[name])
    .filter(Boolean)
}
```

### 3.2 Convert Query Brain Tool
**File:** `src/lib/ai/tools/query-brain.ts` (NEW)

```typescript
import { z } from 'zod'
import type { AladdinTool } from '../types'
import { getBrainClient } from '@/lib/brain/client'

export const queryBrainTool: AladdinTool = {
  name: 'query_brain',
  description: 'Query the Neo4j brain service for semantic search across project knowledge',
  parameters: z.object({
    query: z.string().describe('Natural language query'),
    projectId: z.string().describe('Project ID to search within'),
    limit: z.number().optional().describe('Max results to return'),
  }),
  execute: async (args, context) => {
    const brainClient = getBrainClient()
    const results = await brainClient.query({
      query: args.query,
      projectId: args.projectId || context.projectId,
      limit: args.limit || 10,
    })
    return results
  },
}
```

### 3.3 Convert Save to Gather Tool
**File:** `src/lib/ai/tools/save-to-gather.ts` (NEW)

```typescript
import { z } from 'zod'
import type { AladdinTool } from '../types'
import { gatherDB } from '@/lib/db/gatherDatabase'

export const saveToGatherTool: AladdinTool = {
  name: 'save_to_gather',
  description: 'Save content to the gather database (unqualified content)',
  parameters: z.object({
    content: z.string().describe('Content to save'),
    summary: z.string().optional().describe('Brief summary'),
    context: z.string().optional().describe('Context about the content'),
    type: z.string().optional().describe('Content type'),
  }),
  execute: async (args, context) => {
    const result = await gatherDB.save({
      projectId: context.projectId,
      content: args.content,
      summary: args.summary,
      context: args.context,
      type: args.type,
      createdBy: context.userId,
    })
    return { id: result.id, success: true }
  },
}
```

### 3.4 Convert Get Project Context Tool
**File:** `src/lib/ai/tools/get-project-context.ts` (NEW)

```typescript
import { z } from 'zod'
import type { AladdinTool } from '../types'
import { getPayload } from 'payload'
import config from '@/payload.config'

export const getProjectContextTool: AladdinTool = {
  name: 'get_project_context',
  description: 'Get project information including story bible, characters, and settings',
  parameters: z.object({
    projectId: z.string().describe('Project ID'),
    include: z.array(z.enum(['story', 'characters', 'settings', 'episodes']))
      .optional()
      .describe('What to include'),
  }),
  execute: async (args, context) => {
    const payload = await getPayload({ config })
    
    const project = await payload.findByID({
      collection: 'projects',
      id: args.projectId || context.projectId,
    })
    
    const result: any = {
      name: project.name,
      logline: project.logline,
      synopsis: project.synopsis,
      genre: project.genre,
      themes: project.themes,
    }
    
    // Load additional data based on include parameter
    if (args.include?.includes('characters')) {
      const characters = await payload.find({
        collection: 'characters',
        where: { project: { equals: project.id } },
      })
      result.characters = characters.docs
    }
    
    return result
  },
}
```

---

## Phase 4: Migrate Enhancement Route (Pilot)

**Duration:** 1 hour

This is our proof of concept. We'll migrate the broken enhancement route first.

### 4.1 Update Enhancement Service
**File:** `src/lib/evaluation/evaluation-enhancer.ts` (MODIFY)

Replace the LLM execution with Vercel AI SDK structured output:

```typescript
// OLD imports
import { getLLMClient } from '@/lib/llm/client'

// NEW imports
import { AIAgentExecutor } from '@/lib/ai/agent-executor'
import { z } from 'zod'

// ... existing code ...

private async generateImprovements(...) {
  // Create executor
  const executor = new AIAgentExecutor(this.payload)
  
  // Define output schema
  const improvementSchema = z.object({
    improvements: z.array(z.object({
      type: z.enum(['issue-resolution', 'suggestion-implementation']),
      originalIssue: z.string(),
      content: z.string().min(300).max(3000),
    })),
  })
  
  // Execute with structured output
  const result = await executor.execute({
    agentId: 'content-enhancer', // From PayloadCMS
    prompt: this.buildPrompt(project, department, issues, suggestions),
    context: {
      projectId: project.id,
    },
    structuredOutput: {
      schema: improvementSchema,
      description: 'Generate production-ready deliverables',
    },
  })
  
  // No JSON parsing needed! Already structured
  return result.object.improvements
}
```

**Benefits:**
- ✅ No markdown parsing
- ✅ No JSON parsing errors
- ✅ Type-safe outputs
- ✅ Works in Next.js

---

## Phase 5: Update Agent Execution Tracking

**Duration:** 1 hour

### 5.1 Update Execution Record Creation
**File:** `src/lib/ai/agent-executor.ts` (MODIFY)

Add execution tracking to the executor:

```typescript
async execute(options: AgentExecutionOptions): Promise<AIAgentResult> {
  const startTime = Date.now()
  
  // Create execution record
  const execution = await this.payload.create({
    collection: 'agent-executions',
    data: {
      agent: agent.id,
      project: options.context.projectId,
      conversationId: options.context.conversationId,
      prompt: options.prompt,
      status: 'running',
      startedAt: new Date(),
    },
  })
  
  try {
    // Execute agent
    const result = await this.executeInternal(options)
    
    // Update execution record with success
    await this.payload.update({
      collection: 'agent-executions',
      id: execution.id,
      data: {
        status: 'completed',
        completedAt: new Date(),
        output: result.text,
        tokenUsage: {
          inputTokens: result.usage.promptTokens,
          outputTokens: result.usage.completionTokens,
          totalTokens: result.usage.totalTokens,
        },
        executionTime: Date.now() - startTime,
      },
    })
    
    return result
  } catch (error) {
    // Update execution record with error
    await this.payload.update({
      collection: 'agent-executions',
      id: execution.id,
      data: {
        status: 'error',
        completedAt: new Date(),
        error: {
          message: error.message,
          stack: error.stack,
        },
      },
    })
    throw error
  }
}
```

---

## Phase 6: Migrate Orchestrator & Agent Runner

**Duration:** 3 hours

### 6.1 Update AladdinAgentRunner
**File:** `src/lib/agents/AladdinAgentRunner.ts` (MAJOR REFACTOR)

Replace CodebuffClient with AIAgentExecutor:

```typescript
// OLD
import { CodebuffClient } from '@codebuff/sdk'

// NEW
import { AIAgentExecutor } from '@/lib/ai/agent-executor'
import { getTools } from '@/lib/ai/tools'

export class AladdinAgentRunner {
  private executor: AIAgentExecutor
  private payload: Payload

  constructor(payload: Payload) {
    this.executor = new AIAgentExecutor(payload)
    this.payload = payload
  }

  async executeAgent(
    agentId: string,
    prompt: string,
    context: AgentExecutionContext,
  ): Promise<AgentExecutionResult> {
    // Load agent to get tool names
    const agent = await this.loadAgent(agentId)
    
    // Load tools
    const tools = getTools(agent.toolNames || [])
    
    // Execute
    const result = await this.executor.execute({
      agentId,
      prompt,
      context: {
        projectId: context.projectId,
        conversationId: context.conversationId,
        userId: context.metadata?.userId,
      },
      tools,
      maxSteps: agent.maxAgentSteps || 20,
    })
    
    return {
      executionId: result.executionId,
      output: result.text,
      tokenUsage: result.usage,
      executionTime: result.executionTime,
    }
  }
}
```

### 6.2 Update Orchestrator
**File:** `src/lib/agents/orchestrator.ts` (MODIFY)

Replace CodebuffClient initialization:

```typescript
// OLD
import { CodebuffClient } from '@codebuff/sdk'
const codebuff = new CodebuffClient({ apiKey, baseURL })

// NEW
import { AladdinAgentRunner } from './AladdinAgentRunner'
const runner = new AladdinAgentRunner(payload)

// Rest of orchestration logic stays the same!
const result = await runner.executeAgent(
  masterOrchestratorAgent.id,
  userPrompt,
  { projectId, conversationId }
)
```

---

## Phase 7: Testing & Validation

**Duration:** 2 hours

### 7.1 Test Enhancement Route
1. Start dev server
2. Navigate to Project Readiness
3. Click "Evaluate" on a department
4. Click "AI Enhance"
5. Verify:
   - ✅ No errors
   - ✅ Items created in gather
   - ✅ Content is detailed (2000+ chars)
   - ✅ Execution tracked in PayloadCMS

### 7.2 Test Agent Execution
1. Test `/api/v1/agents/run` endpoint
2. Verify agent executes successfully
3. Check execution record in PayloadCMS
4. Verify token usage is tracked

### 7.3 Test Tool Calling
1. Create test agent that uses tools
2. Verify `query_brain` works
3. Verify `save_to_gather` works
4. Verify `get_project_context` works

### 7.4 Test Orchestration
1. Test full orchestration flow
2. Verify Master → Department → Specialist hierarchy
3. Check all execution records created
4. Verify quality scores calculated

---

## Phase 8: Documentation & Cleanup

**Duration:** 1 hour

### 8.1 Update Documentation
- Update `docs/AI_AGENT_INTEGRATION.md`
- Update `docs/AGENT_ARCHITECTURE_CLARIFIED.md`
- Create `docs/migration/VERCEL_AI_SDK_GUIDE.md`

### 8.2 Remove Codebuff SDK
```bash
pnpm remove @codebuff/sdk
```

### 8.3 Update Environment Variables Documentation
Document that only OpenRouter keys are needed now.

---

## 📊 Migration Checklist

- [ ] Phase 1: Install Vercel AI SDK
- [ ] Phase 2: Create AI client wrapper
- [ ] Phase 3: Migrate custom tools
- [ ] Phase 4: Migrate enhancement route
- [ ] Phase 5: Update execution tracking
- [ ] Phase 6: Migrate orchestrator
- [ ] Phase 7: Test everything
- [ ] Phase 8: Documentation & cleanup

---

## 🎯 Success Criteria

1. ✅ Enhancement route works without errors
2. ✅ All agents execute successfully
3. ✅ Custom tools work correctly
4. ✅ Execution tracking captures all data
5. ✅ Token usage is accurate
6. ✅ No Next.js compatibility issues
7. ✅ PayloadCMS agent definitions unchanged
8. ✅ FAL.ai client still works
9. ✅ Performance is same or better
10. ✅ All tests pass

---

## 🚨 Rollback Plan

If migration fails:
1. Revert code changes via git
2. Reinstall Codebuff SDK
3. Use direct LLM approach for enhancement route
4. Document issues for future attempt

---

## 📈 Expected Benefits

1. **Reliability** - No more Next.js compatibility issues
2. **Type Safety** - Structured outputs with Zod schemas
3. **Developer Experience** - Better error messages, clearer API
4. **Performance** - Smaller bundle size
5. **Maintainability** - Official SDK with active support
6. **Flexibility** - Easy to add new models via OpenRouter

---

## ⏱️ Total Estimated Time

- Phase 1: 0.5 hours
- Phase 2: 2 hours
- Phase 3: 1.5 hours
- Phase 4: 1 hour
- Phase 5: 1 hour
- Phase 6: 3 hours
- Phase 7: 2 hours
- Phase 8: 1 hour

**Total: ~12 hours** (1.5 days of focused work)

---

## 🤝 Questions Before Starting?

1. Does this plan preserve everything you need?
2. Any concerns about the incremental approach?
3. Should we start with Phase 1 now?

