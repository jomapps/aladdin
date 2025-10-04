/**
 * Type definitions for Vercel AI SDK integration
 */

import { z } from 'zod'
import type { CoreTool } from 'ai'

/**
 * Agent execution result from Vercel AI SDK
 */
export interface AIAgentResult {
  /** Generated text output */
  text: string
  
  /** Structured object output (when using generateObject) */
  object?: any
  
  /** Tool calls made during execution */
  toolCalls?: Array<{
    toolName: string
    args: any
    result?: any
  }>
  
  /** Token usage statistics */
  usage: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  
  /** Why the generation finished */
  finishReason: 'stop' | 'length' | 'tool-calls' | 'error' | 'content-filter' | 'unknown'
  
  /** Any warnings from the model */
  warnings?: string[]
  
  /** Execution metadata */
  executionId?: string
  executionTime?: number
}

/**
 * Custom tool definition for Vercel AI SDK
 * Extends CoreTool with execution context
 */
export interface AladdinTool extends CoreTool {
  /** Unique tool identifier */
  name: string
  
  /** Human-readable description for the LLM */
  description: string
  
  /** Zod schema for tool parameters */
  parameters: z.ZodSchema
  
  /** Tool execution function with context */
  execute: (args: any, context: ToolExecutionContext) => Promise<any>
}

/**
 * Context passed to tool execution
 * Provides access to project, user, and conversation data
 */
export interface ToolExecutionContext {
  /** Project ID for scoping operations */
  projectId: string
  
  /** Optional conversation ID for chat context */
  conversationId?: string
  
  /** Optional user ID for permissions */
  userId?: string
  
  /** Additional metadata */
  metadata?: Record<string, any>
}

/**
 * Options for agent execution
 */
export interface AgentExecutionOptions {
  /** Agent ID from PayloadCMS */
  agentId: string
  
  /** User prompt or instruction */
  prompt: string
  
  /** Execution context */
  context: ToolExecutionContext
  
  /** Custom tools to make available */
  tools?: AladdinTool[]
  
  /** Structured output configuration */
  structuredOutput?: {
    schema: z.ZodSchema
    description?: string
  }
  
  /** Maximum reasoning steps */
  maxSteps?: number
  
  /** Temperature for generation (0-2) */
  temperature?: number
  
  /** Maximum tokens to generate */
  maxTokens?: number
}

