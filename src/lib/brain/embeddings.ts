/**
 * Phase 3: Jina Embeddings Generation
 * Generate embeddings for semantic search using Jina AI API
 */

import axios from 'axios'
import type { EmbeddingVector } from './types'

export interface JinaEmbeddingOptions {
  apiKey: string
  model?: string
  task?: 'retrieval.query' | 'retrieval.passage' | 'text-matching' | 'classification'
  dimensions?: number
  normalized?: boolean
}

export class JinaEmbeddings {
  private apiKey: string
  private model: string
  private baseUrl = 'https://api.jina.ai/v1/embeddings'

  constructor(apiKey: string, model = 'jina-embeddings-v3') {
    if (!apiKey) {
      throw new Error('Jina API key is required')
    }
    this.apiKey = apiKey
    this.model = model
  }

  /**
   * Generate embedding for a single text
   */
  async generateEmbedding(
    text: string,
    options: Partial<JinaEmbeddingOptions> = {}
  ): Promise<EmbeddingVector> {
    const embeddings = await this.generateEmbeddings([text], options)
    return embeddings[0]
  }

  /**
   * Generate embeddings for multiple texts (batch operation)
   */
  async generateEmbeddings(
    texts: string[],
    options: Partial<JinaEmbeddingOptions> = {}
  ): Promise<EmbeddingVector[]> {
    try {
      const response = await axios.post(
        this.baseUrl,
        {
          model: options.model || this.model,
          task: options.task || 'retrieval.passage',
          dimensions: options.dimensions || 1024,
          normalized: options.normalized ?? true,
          embedding_type: 'float',
          input: texts,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
          timeout: 30000, // 30 second timeout
        }
      )

      if (!response.data?.data) {
        throw new Error('Invalid response from Jina API')
      }

      return response.data.data.map((item: any, index: number) => ({
        vector: item.embedding,
        dimensions: item.embedding.length,
        model: this.model,
        text: texts[index],
      }))
    } catch (error: any) {
      if (error.response) {
        throw new Error(
          `Jina API error: ${error.response.status} - ${JSON.stringify(error.response.data)}`
        )
      }
      throw new Error(`Failed to generate embeddings: ${error.message}`)
    }
  }

  /**
   * Generate embedding for structured content (characters, scenes, etc.)
   */
  async generateContentEmbedding(
    content: any,
    type: string
  ): Promise<EmbeddingVector> {
    const text = this.serializeContent(content, type)
    return this.generateEmbedding(text, {
      task: 'retrieval.passage',
    })
  }

  /**
   * Generate query embedding for semantic search
   */
  async generateQueryEmbedding(query: string): Promise<EmbeddingVector> {
    return this.generateEmbedding(query, {
      task: 'retrieval.query',
    })
  }

  /**
   * Calculate cosine similarity between two embeddings
   */
  calculateSimilarity(embedding1: number[], embedding2: number[]): number {
    if (embedding1.length !== embedding2.length) {
      throw new Error('Embeddings must have the same dimensions')
    }

    let dotProduct = 0
    let norm1 = 0
    let norm2 = 0

    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i]
      norm1 += embedding1[i] * embedding1[i]
      norm2 += embedding2[i] * embedding2[i]
    }

    const magnitude = Math.sqrt(norm1) * Math.sqrt(norm2)
    if (magnitude === 0) return 0

    return dotProduct / magnitude
  }

  /**
   * Serialize structured content to text for embedding
   */
  private serializeContent(content: any, type: string): string {
    switch (type) {
      case 'character':
        return this.serializeCharacter(content)
      case 'scene':
        return this.serializeScene(content)
      case 'location':
        return this.serializeLocation(content)
      case 'dialogue':
        return this.serializeDialogue(content)
      default:
        return JSON.stringify(content)
    }
  }

  private serializeCharacter(character: any): string {
    const parts: string[] = []

    if (character.name) parts.push(`Character: ${character.name}`)
    if (character.fullName) parts.push(`Full name: ${character.fullName}`)
    if (character.role) parts.push(`Role: ${character.role}`)
    if (character.age) parts.push(`Age: ${character.age}`)

    if (character.personality) {
      const p = character.personality
      if (p.traits?.length) parts.push(`Traits: ${p.traits.join(', ')}`)
      if (p.motivations?.length) parts.push(`Motivations: ${p.motivations.join(', ')}`)
      if (p.fears?.length) parts.push(`Fears: ${p.fears.join(', ')}`)
      if (p.strengths?.length) parts.push(`Strengths: ${p.strengths.join(', ')}`)
      if (p.weaknesses?.length) parts.push(`Weaknesses: ${p.weaknesses.join(', ')}`)
    }

    if (character.backstory) parts.push(`Backstory: ${character.backstory}`)

    if (character.appearance) {
      const a = character.appearance
      if (a.description) parts.push(`Appearance: ${a.description}`)
      if (a.hairStyle) parts.push(`Hair: ${a.hairStyle} ${a.hairColor || ''}`.trim())
      if (a.clothing) parts.push(`Clothing: ${a.clothing}`)
    }

    return parts.join('. ')
  }

  private serializeScene(scene: any): string {
    const parts: string[] = []

    if (scene.name) parts.push(`Scene: ${scene.name}`)
    if (scene.description) parts.push(scene.description)
    if (scene.location) parts.push(`Location: ${scene.location}`)
    if (scene.characters?.length) parts.push(`Characters: ${scene.characters.join(', ')}`)
    if (scene.mood) parts.push(`Mood: ${scene.mood}`)
    if (scene.timeOfDay) parts.push(`Time: ${scene.timeOfDay}`)

    return parts.join('. ')
  }

  private serializeLocation(location: any): string {
    const parts: string[] = []

    if (location.name) parts.push(`Location: ${location.name}`)
    if (location.description) parts.push(location.description)
    if (location.type) parts.push(`Type: ${location.type}`)
    if (location.atmosphere) parts.push(`Atmosphere: ${location.atmosphere}`)

    return parts.join('. ')
  }

  private serializeDialogue(dialogue: any): string {
    const parts: string[] = []

    if (dialogue.character) parts.push(`Character: ${dialogue.character}`)
    if (dialogue.text) parts.push(`Says: "${dialogue.text}"`)
    if (dialogue.emotion) parts.push(`Emotion: ${dialogue.emotion}`)
    if (dialogue.context) parts.push(`Context: ${dialogue.context}`)

    return parts.join('. ')
  }

  /**
   * Batch generate embeddings with rate limiting
   */
  async generateEmbeddingsBatch(
    items: Array<{ text: string; id: string }>,
    batchSize = 100,
    delayMs = 1000
  ): Promise<Map<string, EmbeddingVector>> {
    const results = new Map<string, EmbeddingVector>()

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize)
      const texts = batch.map(item => item.text)

      const embeddings = await this.generateEmbeddings(texts)

      batch.forEach((item, index) => {
        results.set(item.id, embeddings[index])
      })

      // Rate limiting delay
      if (i + batchSize < items.length) {
        await new Promise(resolve => setTimeout(resolve, delayMs))
      }
    }

    return results
  }
}

/**
 * Get or create global Jina embeddings instance
 */
let jinaInstance: JinaEmbeddings | null = null

export function getJinaEmbeddings(apiKey?: string): JinaEmbeddings {
  const key = apiKey || process.env.JINA_API_KEY

  if (!key) {
    throw new Error('Jina API key not configured. Set JINA_API_KEY environment variable.')
  }

  if (!jinaInstance) {
    jinaInstance = new JinaEmbeddings(key)
  }

  return jinaInstance
}
