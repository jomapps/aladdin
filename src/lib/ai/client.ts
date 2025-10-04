/**
 * Vercel AI SDK Client Configuration
 * Provides OpenRouter integration for accessing all LLM models
 */

import { createOpenRouter } from '@openrouter/ai-sdk-provider'

/**
 * OpenRouter client configured for Vercel AI SDK
 * Uses the official @openrouter/ai-sdk-provider package
 * This ensures correct endpoint routing and compatibility
 */
export const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY!,
  headers: {
    'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    'X-Title': 'Aladdin Movie Production',
  },
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
