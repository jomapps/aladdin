/**
 * AI Agent Executor
 * Core replacement for CodebuffClient that integrates Vercel AI SDK with PayloadCMS
 */

import { generateText, generateObject } from 'ai'
import { getModel } from './client'
import type { AIAgentResult, AladdinTool, AgentExecutionOptions } from './types'
import type { Payload } from 'payload'

export class AIAgentExecutor {
  constructor(private payload: Payload) {}

  /**
   * Execute an agent from PayloadCMS using Vercel AI SDK
   * 
   * @param options - Execution options including agent ID, prompt, context, and tools
   * @returns Execution result with text, usage, and metadata
   */
  async execute(options: AgentExecutionOptions): Promise<AIAgentResult> {
    const startTime = Date.now()

    // 1. Load agent from PayloadCMS
    const agent = await this.loadAgent(options.agentId)

    // 2. Get model instance
    const model = getModel(agent.model)

    // 3. Build system prompt from agent instructions
    const systemPrompt = agent.instructionsPrompt

    // 4. Convert tools to Vercel AI SDK format
    const tools = this.convertTools(options.tools || [], options.context)

    // 5. Create execution record
    const execution = await this.createExecutionRecord(agent, options)

    try {
      // 6. Execute with structured output or text generation
      let result: AIAgentResult

      if (options.structuredOutput) {
        result = await this.executeStructured(model, systemPrompt, options, tools)
      } else {
        result = await this.executeText(model, systemPrompt, options, tools)
      }

      // 7. Add execution metadata
      result.executionId = execution.id
      result.executionTime = Date.now() - startTime

      // 8. Update execution record with success
      await this.updateExecutionRecord(execution.id, 'completed', result)

      return result
    } catch (error) {
      // Update execution record with error
      await this.updateExecutionRecord(execution.id, 'error', null, error)
      throw error
    }
  }

  /**
   * Load agent from PayloadCMS by ID
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
   * Convert Aladdin tools to Vercel AI SDK format
   */
  private convertTools(tools: AladdinTool[], context: any) {
    return tools.reduce(
      (acc, tool) => {
        acc[tool.name] = {
          description: tool.description,
          parameters: tool.parameters,
          execute: async (args: any) => {
            // Execute tool with context
            return await tool.execute(args, context)
          },
        }
        return acc
      },
      {} as Record<string, any>,
    )
  }

  /**
   * Execute with structured output (generateObject)
   */
  private async executeStructured(
    model: any,
    systemPrompt: string,
    options: AgentExecutionOptions,
    tools: Record<string, any>,
  ): Promise<AIAgentResult> {
    const result = await generateObject({
      model,
      system: systemPrompt,
      prompt: options.prompt,
      schema: options.structuredOutput!.schema,
      maxSteps: options.maxSteps || 5,
      temperature: options.temperature,
      maxTokens: options.maxTokens,
    })

    return {
      text: JSON.stringify(result.object),
      object: result.object,
      usage: {
        promptTokens: result.usage.promptTokens,
        completionTokens: result.usage.completionTokens,
        totalTokens: result.usage.totalTokens,
      },
      finishReason: result.finishReason,
      warnings: result.warnings,
    }
  }

  /**
   * Execute with text generation (generateText)
   */
  private async executeText(
    model: any,
    systemPrompt: string,
    options: AgentExecutionOptions,
    tools: Record<string, any>,
  ): Promise<AIAgentResult> {
    const result = await generateText({
      model,
      system: systemPrompt,
      prompt: options.prompt,
      tools: Object.keys(tools).length > 0 ? tools : undefined,
      maxSteps: options.maxSteps || 5,
      temperature: options.temperature,
      maxTokens: options.maxTokens,
    })

    return {
      text: result.text,
      toolCalls: result.toolCalls?.map((tc) => ({
        toolName: tc.toolName,
        args: tc.args,
        result: tc.result,
      })),
      usage: {
        promptTokens: result.usage.promptTokens,
        completionTokens: result.usage.completionTokens,
        totalTokens: result.usage.totalTokens,
      },
      finishReason: result.finishReason,
      warnings: result.warnings,
    }
  }

  /**
   * Create execution record in PayloadCMS
   */
  private async createExecutionRecord(agent: any, options: AgentExecutionOptions) {
    return await this.payload.create({
      collection: 'agent-executions',
      data: {
        agent: agent.id,
        project: options.context.projectId,
        conversationId: options.context.conversationId,
        prompt: options.prompt,
        params: options.context.metadata,
        status: 'running',
        startedAt: new Date(),
        retryCount: 0,
      },
    })
  }

  /**
   * Update execution record with results or error
   */
  private async updateExecutionRecord(
    executionId: string,
    status: 'completed' | 'error',
    result: AIAgentResult | null,
    error?: any,
  ) {
    const updateData: any = {
      status,
      completedAt: new Date(),
    }

    if (status === 'completed' && result) {
      updateData.output = result.text
      updateData.tokenUsage = {
        inputTokens: result.usage.promptTokens,
        outputTokens: result.usage.completionTokens,
        totalTokens: result.usage.totalTokens,
      }
      updateData.executionTime = result.executionTime
    }

    if (status === 'error' && error) {
      updateData.error = {
        message: error instanceof Error ? error.message : String(error),
        code: error.code,
        stack: error instanceof Error ? error.stack : undefined,
      }
    }

    await this.payload.update({
      collection: 'agent-executions',
      id: executionId,
      data: updateData,
    })
  }
}

/**
 * Get or create global executor instance
 */
let executorInstance: AIAgentExecutor | null = null

export async function getAIAgentExecutor(payload: Payload): Promise<AIAgentExecutor> {
  if (!executorInstance) {
    executorInstance = new AIAgentExecutor(payload)
  }
  return executorInstance
}

