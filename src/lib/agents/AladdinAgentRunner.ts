import { CodebuffClient } from '@codebuff/sdk'
import type { AgentDefinition, RunState } from '@codebuff/sdk'
import type { Payload } from 'payload'

/**
 * Context for agent execution
 */
export interface AgentExecutionContext {
  projectId: string
  episodeId?: string
  conversationId: string
  previousRun?: RunState
  metadata?: Record<string, unknown>
}

/**
 * Result of agent execution
 */
export interface AgentExecutionResult {
  executionId: string
  output: unknown
  runState: RunState
  qualityScore?: number
  executionTime: number
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
}

/**
 * Agent event handler callback
 */
export type AgentEventHandler = (event: unknown) => void | Promise<void>

/**
 * AladdinAgentRunner
 *
 * Core agent execution engine integrating PayloadCMS with @codebuff/sdk.
 * Handles:
 * - Dynamic agent execution from CMS definitions
 * - Custom tool loading and registration
 * - Real-time event streaming
 * - Execution tracking and audit trail
 * - Error handling and retries
 * - Performance metrics
 *
 * @example
 * ```typescript
 * const runner = new AladdinAgentRunner(apiKey, payload);
 *
 * const result = await runner.executeAgent('story-head-001', 'Create a dramatic opening scene', {
 *   projectId: 'proj-123',
 *   conversationId: 'conv-456',
 * });
 * ```
 */
export class AladdinAgentRunner {
  private client: CodebuffClient
  private payload: Payload

  /**
   * Create a new AladdinAgentRunner
   *
   * @param apiKey - Codebuff API key
   * @param payload - PayloadCMS instance
   * @param cwd - Current working directory for file operations
   */
  constructor(apiKey: string, payload: Payload, cwd?: string) {
    this.client = new CodebuffClient({
      apiKey,
      cwd: cwd || process.cwd(),
    })
    this.payload = payload
  }

  /**
   * Execute an agent by ID
   *
   * @param agentId - Agent ID from PayloadCMS
   * @param prompt - User or system prompt
   * @param context - Execution context (project, episode, conversation)
   * @param onEvent - Optional event handler for real-time updates
   * @returns Promise resolving to execution result
   */
  async executeAgent(
    agentId: string,
    prompt: string,
    context: AgentExecutionContext,
    onEvent?: AgentEventHandler
  ): Promise<AgentExecutionResult> {
    const startTime = Date.now()

    // 1. Fetch agent from PayloadCMS
    const agentDoc = await this.payload.find({
      collection: 'agents',
      where: {
        agentId: { equals: agentId },
        isActive: { equals: true },
      },
      limit: 1,
    })

    if (!agentDoc.docs.length) {
      throw new Error(`Agent not found or inactive: ${agentId}`)
    }

    const agent = agentDoc.docs[0]

    // 2. Fetch department
    const department = await this.payload.findByID({
      collection: 'departments',
      id: agent.department as string,
    })

    // 3. Load custom tools for this agent
    const tools = await this.loadCustomTools(agent)

    // 4. Create agent definition
    const agentDefinition = this.createAgentDefinition(agent)

    // 5. Create execution record
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

    try {
      // 6. Execute with @codebuff/sdk
      const result = await this.client.run({
        agent: agent.agentId,
        prompt,
        agentDefinitions: [agentDefinition],
        customToolDefinitions: tools,
        previousRun: context.previousRun,
        maxAgentSteps: agent.maxAgentSteps || 20,
        handleEvent: async (event) => {
          // Store event in database
          await this.handleAgentEvent(execution.id, event)

          // Call external event handler if provided
          if (onEvent) {
            await onEvent(event)
          }
        },
      })

      const executionTime = Date.now() - startTime

      // 7. Update execution with results
      await this.payload.update({
        collection: 'agent-executions',
        id: execution.id,
        data: {
          status: 'completed',
          completedAt: new Date(),
          output: result.output,
          runState: result as unknown as Record<string, unknown>,
          executionTime,
          tokenUsage: this.extractTokenUsage(result),
        },
      })

      // 8. Update agent performance metrics
      await this.updateAgentMetrics(agent.id, true, executionTime)

      return {
        executionId: execution.id,
        output: result.output,
        runState: result,
        executionTime,
        tokenUsage: this.extractTokenUsage(result),
      }
    } catch (error) {
      const executionTime = Date.now() - startTime
      const errorDetails = {
        message: error instanceof Error ? error.message : 'Unknown error',
        code: (error as { code?: string })?.code,
        stack: error instanceof Error ? error.stack : undefined,
        details: error,
      }

      // Update execution with error
      await this.payload.update({
        collection: 'agent-executions',
        id: execution.id,
        data: {
          status: 'failed',
          error: errorDetails,
          completedAt: new Date(),
          executionTime,
        },
      })

      // Update agent performance metrics
      await this.updateAgentMetrics(agent.id, false, executionTime)

      // Check if we should retry
      const currentRetryCount = (execution.retryCount as number) || 0
      const maxRetries = (execution.maxRetries as number) || 3

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

        // Exponential backoff
        const delay = Math.pow(2, currentRetryCount) * 1000
        await new Promise((resolve) => setTimeout(resolve, delay))

        // Retry execution
        return this.executeAgent(agentId, prompt, context, onEvent)
      }

      return {
        executionId: execution.id,
        output: null,
        runState: {} as RunState,
        executionTime,
        error: errorDetails,
      }
    }
  }

  /**
   * Load custom tools for an agent
   *
   * @param agent - Agent document from PayloadCMS
   * @returns Array of custom tool definitions
   */
  private async loadCustomTools(agent: any): Promise<any[]> {
    // Query for tools this agent can use
    const toolsQuery = await this.payload.find({
      collection: 'custom-tools',
      where: {
        and: [
          {
            or: [
              { isGlobal: { equals: true } },
              { departments: { contains: agent.department } },
            ],
          },
          { isActive: { equals: true } },
        ],
      },
      limit: 100,
    })

    // Filter by agent's toolNames if specified
    const agentToolNames = agent.toolNames?.map((t: any) => t.toolName) || []
    const tools = agentToolNames.length
      ? toolsQuery.docs.filter((tool) => agentToolNames.includes(tool.toolName))
      : toolsQuery.docs

    // Convert to @codebuff/sdk tool definitions
    return tools.map((tool) => {
      try {
        // Parse and create executable function
        const executeFunction = new Function(`return ${tool.executeFunction}`)()

        return {
          toolName: tool.toolName,
          description: tool.description,
          inputSchema: tool.inputSchema,
          exampleInputs: tool.exampleInputs?.map((e: any) => e.example) || [],
          execute: executeFunction,
        }
      } catch (error) {
        console.error(`Failed to load tool ${tool.toolName}:`, error)
        return null
      }
    }).filter(Boolean)
  }

  /**
   * Create agent definition from PayloadCMS agent
   *
   * @param agent - Agent document from PayloadCMS
   * @returns Agent definition for @codebuff/sdk
   */
  private createAgentDefinition(agent: any): AgentDefinition {
    return {
      id: agent.agentId,
      model: agent.model,
      displayName: agent.name,
      toolNames: agent.toolNames?.map((t: any) => t.toolName) || [],
      instructionsPrompt: agent.instructionsPrompt,
    }
  }

  /**
   * Handle agent event (store in database)
   *
   * @param executionId - Execution ID
   * @param event - Event data
   */
  private async handleAgentEvent(executionId: string, event: unknown): Promise<void> {
    try {
      const execution = await this.payload.findByID({
        collection: 'agent-executions',
        id: executionId,
      })

      const events = (execution.events as any[]) || []
      events.push({ event })

      await this.payload.update({
        collection: 'agent-executions',
        id: executionId,
        data: {
          events,
        },
      })
    } catch (error) {
      console.error('Failed to store event:', error)
    }
  }

  /**
   * Update agent performance metrics
   *
   * @param agentId - Agent ID
   * @param success - Whether execution was successful
   * @param executionTime - Execution time in milliseconds
   */
  private async updateAgentMetrics(
    agentId: string,
    success: boolean,
    executionTime: number
  ): Promise<void> {
    try {
      const agent = await this.payload.findByID({
        collection: 'agents',
        id: agentId,
      })

      const metrics = agent.performanceMetrics || {}
      const totalExecutions = (metrics.totalExecutions || 0) + 1
      const successfulExecutions = (metrics.successfulExecutions || 0) + (success ? 1 : 0)
      const failedExecutions = (metrics.failedExecutions || 0) + (success ? 0 : 1)
      const currentAvgTime = metrics.averageExecutionTime || 0
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
            successRate: Math.round(successRate * 100) / 100,
          },
          lastExecutedAt: new Date(),
        },
      })
    } catch (error) {
      console.error('Failed to update agent metrics:', error)
    }
  }

  /**
   * Extract token usage from RunState
   *
   * @param result - RunState from @codebuff/sdk
   * @returns Token usage object
   */
  private extractTokenUsage(result: RunState): {
    inputTokens: number
    outputTokens: number
    totalTokens: number
    estimatedCost?: number
  } | undefined {
    // Extract token usage from result if available
    // This is a placeholder - actual implementation depends on @codebuff/sdk structure
    const usage = (result as any)?.usage
    if (!usage) return undefined

    return {
      inputTokens: usage.inputTokens || 0,
      outputTokens: usage.outputTokens || 0,
      totalTokens: usage.totalTokens || 0,
      estimatedCost: usage.estimatedCost,
    }
  }
}
