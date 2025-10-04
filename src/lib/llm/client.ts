/**
 * LLM Client for OpenRouter Integration
 * Supports Claude Sonnet 4.5 via OpenRouter with retry logic and token tracking
 */

import axios, { AxiosInstance } from 'axios'

export interface LLMConfig {
  apiKey: string
  baseUrl: string
  defaultModel: string
  backupModel?: string
  timeout?: number
  maxRetries?: number
  retryDelay?: number
}

export interface LLMCompletionOptions {
  temperature?: number
  maxTokens?: number
  topP?: number
  frequencyPenalty?: number
  presencePenalty?: number
  stop?: string[]
  stream?: boolean
}

export interface LLMResponse {
  content: string
  model: string
  usage: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  finishReason: string
}

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export class LLMClient {
  private axiosInstance: AxiosInstance
  private config: Required<LLMConfig>
  private totalTokensUsed: number = 0

  constructor(config: LLMConfig) {
    this.config = {
      apiKey: config.apiKey,
      baseUrl: config.baseUrl,
      defaultModel: config.defaultModel,
      backupModel: config.backupModel || config.defaultModel,
      timeout: config.timeout || 60000,
      maxRetries: config.maxRetries || 3,
      retryDelay: config.retryDelay || 1000,
    }

    this.axiosInstance = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'Aladdin Movie Production',
      },
    })
  }

  /**
   * Simple completion - single prompt, single response
   */
  async complete(
    prompt: string,
    options: LLMCompletionOptions = {}
  ): Promise<string> {
    const messages: LLMMessage[] = [
      {
        role: 'user',
        content: prompt,
      },
    ]

    const response = await this.chat(messages, options)
    return response.content
  }

  /**
   * Chat completion - multi-turn conversation
   */
  async chat(
    messages: LLMMessage[],
    options: LLMCompletionOptions = {}
  ): Promise<LLMResponse> {
    let lastError: Error | null = null

    for (let attempt = 0; attempt < this.config.maxRetries; attempt++) {
      try {
        const response = await this.axiosInstance.post('/chat/completions', {
          model: this.config.defaultModel,
          messages,
          temperature: options.temperature ?? 0.3,
          max_tokens: options.maxTokens ?? 2000,
          top_p: options.topP ?? 1,
          frequency_penalty: options.frequencyPenalty ?? 0,
          presence_penalty: options.presencePenalty ?? 0,
          stop: options.stop,
          stream: options.stream ?? false,
        })

        const choice = response.data.choices[0]
        const usage = response.data.usage

        // Track token usage
        this.totalTokensUsed += usage.total_tokens

        return {
          content: choice.message.content,
          model: response.data.model,
          usage: {
            promptTokens: usage.prompt_tokens,
            completionTokens: usage.completion_tokens,
            totalTokens: usage.total_tokens,
          },
          finishReason: choice.finish_reason,
        }
      } catch (error: any) {
        lastError = error
        console.error(`[LLMClient] Attempt ${attempt + 1} failed:`, error.message)

        // If this is the last attempt, try backup model
        if (attempt === this.config.maxRetries - 1 && this.config.backupModel !== this.config.defaultModel) {
          console.log(`[LLMClient] Trying backup model: ${this.config.backupModel}`)
          try {
            const response = await this.axiosInstance.post('/chat/completions', {
              model: this.config.backupModel,
              messages,
              temperature: options.temperature ?? 0.3,
              max_tokens: options.maxTokens ?? 2000,
              top_p: options.topP ?? 1,
              frequency_penalty: options.frequencyPenalty ?? 0,
              presence_penalty: options.presencePenalty ?? 0,
              stop: options.stop,
              stream: options.stream ?? false,
            })

            const choice = response.data.choices[0]
            const usage = response.data.usage

            this.totalTokensUsed += usage.total_tokens

            return {
              content: choice.message.content,
              model: response.data.model,
              usage: {
                promptTokens: usage.prompt_tokens,
                completionTokens: usage.completion_tokens,
                totalTokens: usage.total_tokens,
              },
              finishReason: choice.finish_reason,
            }
          } catch (backupError: any) {
            console.error('[LLMClient] Backup model also failed:', backupError.message)
            throw backupError
          }
        }

        // Wait before retrying
        if (attempt < this.config.maxRetries - 1) {
          await this.delay(this.config.retryDelay * (attempt + 1))
        }
      }
    }

    throw lastError || new Error('LLM request failed after all retries')
  }

  /**
   * Parse JSON response from LLM
   */
  async completeJSON<T = any>(
    prompt: string,
    options: LLMCompletionOptions = {}
  ): Promise<T> {
    const enhancedPrompt = `${prompt}\n\nIMPORTANT: Return ONLY valid JSON, no markdown, no explanations, no code blocks. Just the raw JSON object.`
    
    const response = await this.complete(enhancedPrompt, {
      ...options,
      temperature: options.temperature ?? 0.2, // Lower temperature for JSON
    })

    try {
      // Remove markdown code blocks if present
      let cleaned = response.trim()
      if (cleaned.startsWith('```json')) {
        cleaned = cleaned.replace(/^```json\n/, '').replace(/\n```$/, '')
      } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```\n/, '').replace(/\n```$/, '')
      }

      return JSON.parse(cleaned)
    } catch (error) {
      console.error('[LLMClient] Failed to parse JSON response:', response)
      throw new Error(`Failed to parse LLM JSON response: ${error}`)
    }
  }

  /**
   * Multi-sequence prompts - for complex analysis
   */
  async sequence(
    prompts: string[],
    options: LLMCompletionOptions = {}
  ): Promise<string[]> {
    const results: string[] = []
    const messages: LLMMessage[] = []

    for (const prompt of prompts) {
      messages.push({
        role: 'user',
        content: prompt,
      })

      const response = await this.chat(messages, options)
      results.push(response.content)

      // Add assistant response to conversation history
      messages.push({
        role: 'assistant',
        content: response.content,
      })
    }

    return results
  }

  /**
   * Get total tokens used
   */
  getTotalTokensUsed(): number {
    return this.totalTokensUsed
  }

  /**
   * Reset token counter
   */
  resetTokenCounter(): void {
    this.totalTokensUsed = 0
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

/**
 * Get singleton LLM client instance
 */
let llmClientInstance: LLMClient | null = null

export function getLLMClient(config?: LLMConfig): LLMClient {
  if (!llmClientInstance) {
    const apiKey = config?.apiKey || process.env.OPENROUTER_API_KEY
    const baseUrl = config?.baseUrl || process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1'
    const defaultModel = config?.defaultModel || process.env.OPENROUTER_DEFAULT_MODEL || 'anthropic/claude-sonnet-4.5'
    const backupModel = config?.backupModel || process.env.OPENROUTER_BACKUP_MODEL

    if (!apiKey) {
      throw new Error('OPENROUTER_API_KEY is required')
    }

    llmClientInstance = new LLMClient({
      apiKey,
      baseUrl,
      defaultModel,
      backupModel,
    })
  }

  return llmClientInstance
}

