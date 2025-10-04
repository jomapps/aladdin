/**
 * Aladdin Agent Runner
 * Core agent execution engine using Vercel AI SDK with PayloadCMS integration
 */

import { AIAgentExecutor } from '@/lib/ai/agent-executor'
import { getTools } from '@/lib/ai/tools'
import type { AIAgentResult, AgentExecutionOptions } from '@/lib/ai/types'
import type { Payload } from 'payload'

/**
 * Context for agent execution
 */
export interface AgentExecutionContext {
  projectId: string
  episodeId?: string
  conversationId: string
  metadata?: Record<string, unknown>
}

/**
 * Result of agent execution
 */
export interface AgentExecutionResult {
  executionId: string
  output: string
  object?: any
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
 * Core agent execution engine integrating PayloadCMS with Vercel AI SDK.
 * Handles:
 * - Dynamic agent execution from CMS definitions
 * - Custom tool loading and registration
 * - Real-time event streaming
 * - Execution tracking and metrics
 * - Quality scoring and validation
 */
export class AladdinAgentRunner {
  private executor: AIAgentExecutor
  private payload: Payload

  constructor(payload: Payload) {
    this.executor = new AIAgentExecutor(payload)
    this.payload = payload
  }

  /**
   * Execute an agent by ID
   *
   * @param agentId - Agent identifier from PayloadCMS
   * @param prompt - User prompt or instruction
   * @param context - Execution context with project/conversation IDs
   * @param eventHandler - Optional callback for real-time events
   * @returns Execution result with output and metrics
   */
  async executeAgent(
    agentId: string,
    prompt: string,
    context: AgentExecutionContext,
    eventHandler?: AgentEventHandler,
  ): Promise<AgentExecutionResult> {
    console.log(`[AladdinAgentRunner] Executing agent: ${agentId}`)

    try {
      // 1. Load agent from PayloadCMS
      const agent = await this.loadAgent(agentId)

      // 2. Load custom tools for this agent
      const tools = getTools(agent.toolNames || [])

      // 3. Build execution options
      const options: AgentExecutionOptions = {
        agentId,
        prompt,
        context: {
          projectId: context.projectId,
          conversationId: context.conversationId,
          userId: context.metadata?.userId as string | undefined,
          metadata: context.metadata,
        },
        tools,
        maxSteps: agent.maxAgentSteps || 20,
        temperature: agent.executionSettings?.temperature || 0.7,
        maxTokens: agent.executionSettings?.maxTokens || 16000,
      }

      // 4. Execute agent
      const result = await this.executor.execute(options)

      // 5. Calculate quality score if needed
      let qualityScore: number | undefined
      if (agent.requiresReview) {
        qualityScore = await this.calculateQualityScore(result, agent)
      }

      // 6. Emit event if handler provided
      if (eventHandler) {
        await eventHandler({
          type: 'execution_complete',
          agentId,
          executionId: result.executionId,
          output: result.text,
          qualityScore,
        })
      }

      // 7. Return formatted result
      return {
        executionId: result.executionId!,
        output: result.text,
        object: result.object,
        qualityScore,
        executionTime: result.executionTime!,
        tokenUsage: {
          inputTokens: result.usage.promptTokens,
          outputTokens: result.usage.completionTokens,
          totalTokens: result.usage.totalTokens,
          estimatedCost: this.calculateCost(result.usage.totalTokens, agent.model),
        },
      }
    } catch (error) {
      console.error(`[AladdinAgentRunner] Execution failed:`, error)

      // Emit error event if handler provided
      if (eventHandler) {
        await eventHandler({
          type: 'execution_error',
          agentId,
          error: error instanceof Error ? error.message : String(error),
        })
      }

      return {
        executionId: `error-${Date.now()}`,
        output: '',
        executionTime: 0,
        error: {
          message: error instanceof Error ? error.message : String(error),
          code: 'EXECUTION_ERROR',
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  /**
   * Execute multiple agents in parallel
   */
  async executeAgentsParallel(
    executions: Array<{
      agentId: string
      prompt: string
      context: AgentExecutionContext
    }>,
    eventHandler?: AgentEventHandler,
  ): Promise<AgentExecutionResult[]> {
    console.log(`[AladdinAgentRunner] Executing ${executions.length} agents in parallel`)

    return await Promise.all(
      executions.map((exec) => this.executeAgent(exec.agentId, exec.prompt, exec.context, eventHandler)),
    )
  }

  /**
   * Execute multiple agents in sequence
   */
  async executeAgentsSequential(
    executions: Array<{
      agentId: string
      prompt: string
      context: AgentExecutionContext
    }>,
    eventHandler?: AgentEventHandler,
  ): Promise<AgentExecutionResult[]> {
    console.log(`[AladdinAgentRunner] Executing ${executions.length} agents sequentially`)

    const results: AgentExecutionResult[] = []

    for (const exec of executions) {
      const result = await this.executeAgent(exec.agentId, exec.prompt, exec.context, eventHandler)
      results.push(result)

      // Stop if error occurred
      if (result.error) {
        console.error(`[AladdinAgentRunner] Stopping sequential execution due to error`)
        break
      }
    }

    return results
  }

  /**
   * Load agent from PayloadCMS
   */
  private async loadAgent(agentId: string) {
    const result = await this.payload.find({
      collection: 'agents',
      where: {
        agentId: { equals: agentId },
        isActive: { equals: true },
      },
      limit: 1,
    })

    if (!result.docs.length) {
      throw new Error(`Agent not found or inactive: ${agentId}`)
    }

    return result.docs[0]
  }

  /**
   * Calculate quality score for agent output
   */
  private async calculateQualityScore(result: AIAgentResult, agent: any): Promise<number> {
    // Simple quality scoring based on output characteristics
    // Can be enhanced with more sophisticated scoring logic

    let score = 0.7 // Base score

    // Check output length
    if (result.text.length > 500) score += 0.1
    if (result.text.length > 1000) score += 0.1

    // Check if structured output was used
    if (result.object) score += 0.1

    // Ensure score is within bounds
    return Math.min(Math.max(score, 0), 1)
  }

  /**
   * Calculate estimated cost based on token usage
   */
  private calculateCost(totalTokens: number, model: string): number {
    // Rough cost estimates (per 1M tokens)
    const costPer1M: Record<string, number> = {
      'anthropic/claude-sonnet-4.5': 3.0,
      'anthropic/claude-3.5-sonnet': 3.0,
      'openai/gpt-4': 30.0,
      'openai/gpt-3.5-turbo': 0.5,
    }

    const cost = costPer1M[model] || 3.0
    return (totalTokens / 1_000_000) * cost
  }
}

/**
 * Get or create global runner instance
 */
let runnerInstance: AladdinAgentRunner | null = null

export async function getAladdinAgentRunner(payload: Payload): Promise<AladdinAgentRunner> {
  if (!runnerInstance) {
    runnerInstance = new AladdinAgentRunner(payload)
  }
  return runnerInstance
}

