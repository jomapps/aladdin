/**
 * Vercel AI SDK Client Configuration
 * Provides OpenRouter integration for accessing all LLM models
 */

import { createOpenAI } from '@ai-sdk/openai'

/**
 * OpenRouter client configured for Vercel AI SDK
 * Uses OpenRouter to access all LLM models (Anthropic, OpenAI, etc.)
 */
export const openrouter = createOpenAI({
  apiKey: process.env.OPENROUTER_API_KEY!,
  baseURL: process.env.OPENROUTER_BASE_URL!, // https://openrouter.ai/api/v1
})

/**
 * Get model instance by name
 * Supports all OpenRouter models
 * 
 * @param modelName - Model identifier (e.g., 'anthropic/claude-sonnet-4.5')
 * @returns Model instance for use with generateText/generateObject
 */
export function getModel(modelName?: string) {
  const model = modelName || process.env.OPENROUTER_DEFAULT_MODEL || 'anthropic/claude-sonnet-4.5'
  return openrouter(model)
}

/**
 * Default model for general use
 * Uses OPENROUTER_DEFAULT_MODEL from environment
 */
export const defaultModel = getModel()

