/**
 * Phase 6: ElevenLabs API Client
 * Unified client for ElevenLabs voice generation
 */

import axios, { AxiosInstance } from 'axios'

export interface ElevenLabsConfig {
  apiKey: string
  baseUrl?: string
  timeout?: number
}

export class ElevenLabsClient {
  private axiosInstance: AxiosInstance
  private config: Required<ElevenLabsConfig>

  constructor(config: ElevenLabsConfig) {
    this.config = {
      apiKey: config.apiKey,
      baseUrl: config.baseUrl || 'https://api.elevenlabs.io',
      timeout: config.timeout || 60000,
    }

    this.axiosInstance = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': this.config.apiKey,
      },
    })
  }

  /**
   * Get available voices
   */
  async getVoices(): Promise<any> {
    const response = await this.axiosInstance.get('/v1/voices')
    return response.data
  }

  /**
   * Create custom voice
   */
  async createVoice(config: {
    name: string
    description?: string
    files: string[] // Audio file URLs
    labels?: Record<string, string>
  }): Promise<any> {
    const response = await this.axiosInstance.post('/v1/voices/add', config)
    return response.data
  }

  /**
   * Text-to-speech generation
   */
  async textToSpeech(config: {
    text: string
    voiceId: string
    modelId?: string
    stability?: number
    similarityBoost?: number
    style?: number
    useSpeakerBoost?: boolean
  }): Promise<Buffer> {
    const response = await this.axiosInstance.post(
      `/v1/text-to-speech/${config.voiceId}`,
      {
        text: config.text,
        model_id: config.modelId || 'eleven_multilingual_v2',
        voice_settings: {
          stability: config.stability || 0.5,
          similarity_boost: config.similarityBoost || 0.75,
          style: config.style || 0.0,
          use_speaker_boost: config.useSpeakerBoost ?? true,
        },
      },
      {
        responseType: 'arraybuffer',
      }
    )

    return Buffer.from(response.data)
  }

  /**
   * Get voice details
   */
  async getVoice(voiceId: string): Promise<any> {
    const response = await this.axiosInstance.get(`/v1/voices/${voiceId}`)
    return response.data
  }

  /**
   * Delete custom voice
   */
  async deleteVoice(voiceId: string): Promise<void> {
    await this.axiosInstance.delete(`/v1/voices/${voiceId}`)
  }
}

/**
 * Get or create global ElevenLabs client
 */
let elevenLabsInstance: ElevenLabsClient | null = null

export function getElevenLabsClient(apiKey?: string): ElevenLabsClient {
  const key = apiKey || process.env.ELEVENLABS_API_KEY

  if (!key) {
    throw new Error('ElevenLabs API key missing. Set ELEVENLABS_API_KEY environment variable')
  }

  if (!elevenLabsInstance) {
    elevenLabsInstance = new ElevenLabsClient({ apiKey: key })
  }

  return elevenLabsInstance
}
