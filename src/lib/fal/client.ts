/**
 * Phase 5: FAL.ai Client
 * Unified client for FAL.ai image generation API with retry and rate limiting
 */

import axios, { AxiosInstance, AxiosError } from 'axios'
import type {
  FalClientConfig,
  FalGenerateImageRequest,
  FalGenerateImageWithReferenceRequest,
  FalGenerateImageResponse,
  FalErrorResponse,
  FalRateLimitState,
  FalRequestOptions,
} from './types'

export class FalClient {
  private axiosInstance: AxiosInstance
  private config: Required<FalClientConfig>
  private rateLimitState: FalRateLimitState | null = null

  constructor(config: FalClientConfig) {
    this.config = {
      apiKey: config.apiKey,
      baseUrl: config.baseUrl || 'https://fal.run',
      timeout: config.timeout || 60000,
      retries: config.retries || 3,
      retryDelay: config.retryDelay || 2000,
    }

    this.axiosInstance = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Key ${this.config.apiKey}`,
      },
    })

    this.setupInterceptors()
  }

  /**
   * Setup axios interceptors for retry logic and rate limiting
   */
  private setupInterceptors() {
    this.axiosInstance.interceptors.response.use(
      (response) => {
        // Update rate limit state from headers
        const remaining = response.headers['x-ratelimit-remaining']
        const reset = response.headers['x-ratelimit-reset']
        const limit = response.headers['x-ratelimit-limit']

        if (remaining && reset && limit) {
          this.rateLimitState = {
            remaining: parseInt(remaining, 10),
            reset: new Date(parseInt(reset, 10) * 1000),
            limit: parseInt(limit, 10),
          }
        }

        return response
      },
      async (error: AxiosError) => {
        const config = error.config as any

        if (!config || !config.retry) {
          config.retry = 0
        }

        if (config.retry >= this.config.retries) {
          return Promise.reject(error)
        }

        config.retry += 1

        // Retry on rate limit (429), network errors, or 5xx errors
        if (
          error.response?.status === 429 ||
          !error.response ||
          (error.response.status >= 500 && error.response.status < 600)
        ) {
          const delay = error.response?.status === 429
            ? this.calculateRateLimitDelay()
            : this.config.retryDelay * config.retry

          await new Promise((resolve) => setTimeout(resolve, delay))
          return this.axiosInstance(config)
        }

        return Promise.reject(error)
      }
    )
  }

  /**
   * Calculate delay for rate limit retry
   */
  private calculateRateLimitDelay(): number {
    if (this.rateLimitState?.reset) {
      const now = Date.now()
      const resetTime = this.rateLimitState.reset.getTime()
      const delay = Math.max(resetTime - now, 1000)
      return Math.min(delay, 60000) // Max 60s delay
    }
    return 5000 // Default 5s delay
  }

  /**
   * Generate image from text prompt (no references)
   */
  async generateImage(
    request: FalGenerateImageRequest,
    options: FalRequestOptions = {}
  ): Promise<FalGenerateImageResponse> {
    try {
      const model = request.model || 'fal-ai/flux/schnell'
      const endpoint = `/fal-ai/${model.replace('fal-ai/', '')}`

      const payload = {
        prompt: request.prompt,
        negative_prompt: request.negativePrompt,
        image_size: request.imageSize || { width: 1024, height: 1024 },
        num_images: request.numImages || 1,
        seed: request.seed,
        guidance_scale: request.guidance || 7.5,
        num_inference_steps: request.steps || 28,
        output_format: request.format || 'png',
        enable_safety_checker: request.enableSafetyChecker ?? true,
      }

      const response = await this.axiosInstance.post(endpoint, payload, {
        headers: options.webhookUrl
          ? { 'X-Webhook-URL': options.webhookUrl }
          : {},
      })

      return response.data
    } catch (error) {
      throw this.handleError(error, 'generateImage')
    }
  }

  /**
   * Generate image with reference images (360° profiles, composites)
   */
  async generateImageWithReference(
    request: FalGenerateImageWithReferenceRequest,
    options: FalRequestOptions = {}
  ): Promise<FalGenerateImageResponse> {
    try {
      const model = request.model || 'fal-ai/flux/dev' // Dev model supports references
      const endpoint = `/fal-ai/${model.replace('fal-ai/', '')}/image-to-image`

      const payload = {
        prompt: request.prompt,
        negative_prompt: request.negativePrompt,
        image_size: request.imageSize || { width: 1024, height: 1024 },
        num_images: request.numImages || 1,
        seed: request.seed,
        guidance_scale: request.guidance || 7.5,
        num_inference_steps: request.steps || 28,
        output_format: request.format || 'png',
        enable_safety_checker: request.enableSafetyChecker ?? true,
        reference_images: request.referenceImages.map((ref) => ({
          image_url: ref.url,
          weight: ref.weight || 1.0,
        })),
        controlnet_conditioning_scale: request.controlnetStrength || 0.8,
        ip_adapter_scale: request.ipAdapterScale || 0.6,
      }

      const response = await this.axiosInstance.post(endpoint, payload, {
        headers: options.webhookUrl
          ? { 'X-Webhook-URL': options.webhookUrl }
          : {},
      })

      return response.data
    } catch (error) {
      throw this.handleError(error, 'generateImageWithReference')
    }
  }

  /**
   * Get current rate limit state
   */
  getRateLimitState(): FalRateLimitState | null {
    return this.rateLimitState
  }

  /**
   * Wait until rate limit resets
   */
  async waitForRateLimit(): Promise<void> {
    if (!this.rateLimitState?.reset) {
      return
    }

    const now = Date.now()
    const resetTime = this.rateLimitState.reset.getTime()
    const delay = Math.max(resetTime - now, 0)

    if (delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  /**
   * Error handling helper
   */
  private handleError(error: any, method: string): Error {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status
      const falError = error.response?.data as FalErrorResponse | undefined

      if (falError?.error) {
        return new Error(
          `FAL.ai API error in ${method}: [${status}] ${falError.error.message}`
        )
      }

      const message = error.message
      return new Error(`FAL.ai error in ${method}: [${status || 'NETWORK'}] ${message}`)
    }

    return new Error(`FAL.ai client error in ${method}: ${error.message}`)
  }
}

/**
 * Get or create global FAL.ai client instance
 */
let falClientInstance: FalClient | null = null

export function getFalClient(apiKey?: string): FalClient {
  const key = apiKey || process.env.FAL_API_KEY

  if (!key) {
    throw new Error(
      'FAL.ai API key missing. Set FAL_API_KEY environment variable or pass apiKey to getFalClient()'
    )
  }

  if (!falClientInstance) {
    falClientInstance = new FalClient({ apiKey: key })
  }

  return falClientInstance
}

export { FalClient as default }
