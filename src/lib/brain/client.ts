/**
 * Phase 3: Brain API Client
 * Unified client for interacting with Brain service at brain.ft.tc
 */

import axios, { AxiosInstance, AxiosError } from 'axios'
import type {
  BrainConfig,
  BrainValidationRequest,
  ValidationResult,
  SemanticSearchQuery,
  SemanticSearchResult,
  AddNodeRequest,
  AddRelationshipRequest,
  UpdateNodeRequest,
  DeleteNodeRequest,
  BrainNode,
  BrainRelationship,
  BrainClientOptions,
  GraphTraversalQuery,
  GraphTraversalResult,
} from './types'

export class BrainClient {
  private axiosInstance: AxiosInstance
  private config: BrainConfig
  private options: Required<BrainClientOptions>

  constructor(config: BrainConfig, options: BrainClientOptions = {}) {
    this.config = config
    this.options = {
      timeout: options.timeout || 30000,
      retries: options.retries || 3,
      retryDelay: options.retryDelay || 1000,
      validateResponses: options.validateResponses ?? true,
    }

    this.axiosInstance = axios.create({
      baseURL: config.apiUrl,
      timeout: this.options.timeout,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
    })

    this.setupInterceptors()
  }

  /**
   * Setup axios interceptors for retry logic and error handling
   */
  private setupInterceptors() {
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const config = error.config as any

        if (!config || !config.retry) {
          config.retry = 0
        }

        if (config.retry >= this.options.retries) {
          return Promise.reject(error)
        }

        config.retry += 1

        // Retry on network errors or 5xx errors
        if (!error.response || (error.response.status >= 500 && error.response.status < 600)) {
          await new Promise((resolve) =>
            setTimeout(resolve, this.options.retryDelay * config.retry),
          )
          return this.axiosInstance(config)
        }

        return Promise.reject(error)
      },
    )
  }

  /**
   * VALIDATION METHODS
   */

  /**
   * Validate content for quality, consistency, and contradictions
   */
  async validateContent(request: BrainValidationRequest): Promise<ValidationResult> {
    try {
      const response = await this.axiosInstance.post('/api/v1/validate', request)
      return response.data
    } catch (error) {
      throw this.handleError(error, 'validateContent')
    }
  }

  /**
   * Batch validate multiple content items
   */
  async validateContentBatch(requests: BrainValidationRequest[]): Promise<ValidationResult[]> {
    try {
      const response = await this.axiosInstance.post('/api/v1/validate/batch', { items: requests })
      return response.data.results
    } catch (error) {
      throw this.handleError(error, 'validateContentBatch')
    }
  }

  /**
   * SEMANTIC SEARCH METHODS
   */

  /**
   * Perform semantic search across knowledge graph
   */
  async semanticSearch(query: SemanticSearchQuery): Promise<SemanticSearchResult[]> {
    try {
      const response = await this.axiosInstance.post('/api/v1/search/semantic', query)
      return response.data.results
    } catch (error) {
      throw this.handleError(error, 'semanticSearch')
    }
  }

  /**
   * Find similar content based on embedding similarity
   */
  async findSimilar(
    nodeId: string,
    options: {
      types?: string[]
      limit?: number
      threshold?: number
    } = {},
  ): Promise<SemanticSearchResult[]> {
    try {
      const response = await this.axiosInstance.get(`/api/v1/search/similar/${nodeId}`, {
        params: options,
      })
      return response.data.results
    } catch (error) {
      throw this.handleError(error, 'findSimilar')
    }
  }

  /**
   * GRAPH OPERATIONS
   */

  /**
   * Add a new node to the knowledge graph
   */
  async addNode(request: AddNodeRequest): Promise<BrainNode> {
    try {
      const response = await this.axiosInstance.post('/api/v1/nodes', request)
      return response.data.node
    } catch (error) {
      throw this.handleError(error, 'addNode')
    }
  }

  /**
   * Update an existing node
   */
  async updateNode(request: UpdateNodeRequest): Promise<BrainNode> {
    try {
      const response = await this.axiosInstance.put(`/api/v1/nodes/${request.nodeId}`, {
        properties: request.properties,
        updateEmbedding: request.updateEmbedding,
      })
      return response.data.node
    } catch (error) {
      throw this.handleError(error, 'updateNode')
    }
  }

  /**
   * Get a node by ID
   */
  async getNode(nodeId: string): Promise<BrainNode | null> {
    try {
      const response = await this.axiosInstance.get(`/api/v1/nodes/${nodeId}`)
      return response.data.node
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null
      }
      throw this.handleError(error, 'getNode')
    }
  }

  /**
   * Delete a node
   */
  async deleteNode(
    request: DeleteNodeRequest,
  ): Promise<{ success: boolean; deletedCount: number }> {
    try {
      const response = await this.axiosInstance.delete(`/api/v1/nodes/${request.nodeId}`, {
        params: { cascade: request.cascade },
      })
      return response.data
    } catch (error) {
      throw this.handleError(error, 'deleteNode')
    }
  }

  /**
   * Add a relationship between nodes
   */
  async addRelationship(request: AddRelationshipRequest): Promise<BrainRelationship> {
    try {
      const response = await this.axiosInstance.post('/api/v1/relationships', request)
      return response.data.relationship
    } catch (error) {
      throw this.handleError(error, 'addRelationship')
    }
  }

  /**
   * Get relationships for a node
   */
  async getRelationships(
    nodeId: string,
    options: {
      types?: string[]
      direction?: 'incoming' | 'outgoing' | 'both'
    } = {},
  ): Promise<BrainRelationship[]> {
    try {
      const response = await this.axiosInstance.get(`/api/v1/nodes/${nodeId}/relationships`, {
        params: options,
      })
      return response.data.relationships
    } catch (error) {
      throw this.handleError(error, 'getRelationships')
    }
  }

  /**
   * Traverse the knowledge graph from a starting node
   */
  async traverseGraph(query: GraphTraversalQuery): Promise<GraphTraversalResult> {
    try {
      const response = await this.axiosInstance.post('/api/v1/graph/traverse', query)
      return response.data
    } catch (error) {
      throw this.handleError(error, 'traverseGraph')
    }
  }

  /**
   * QUERY METHODS
   */

  /**
   * Execute a custom Cypher query (advanced usage)
   */
  async executeCypher(query: string, parameters: Record<string, any> = {}): Promise<any[]> {
    try {
      const response = await this.axiosInstance.post('/api/v1/query/cypher', {
        query,
        parameters,
      })
      return response.data.results
    } catch (error) {
      throw this.handleError(error, 'executeCypher')
    }
  }

  /**
   * Get nodes by type with optional filters
   */
  async getNodesByType(
    type: string,
    filters: Record<string, any> = {},
    limit = 100,
  ): Promise<BrainNode[]> {
    try {
      const response = await this.axiosInstance.get('/api/v1/nodes', {
        params: { type, ...filters, limit },
      })
      return response.data.nodes
    } catch (error) {
      throw this.handleError(error, 'getNodesByType')
    }
  }

  /**
   * UTILITY METHODS
   */

  /**
   * Health check for Brain service
   */
  async healthCheck(): Promise<{ status: string; timestamp: Date }> {
    try {
      const response = await this.axiosInstance.get('/api/v1/health')
      return response.data
    } catch (error) {
      throw this.handleError(error, 'healthCheck')
    }
  }

  /**
   * Get service statistics
   */
  async getStats(): Promise<{
    totalNodes: number
    totalRelationships: number
    nodesByType: Record<string, number>
  }> {
    try {
      const response = await this.axiosInstance.get('/api/v1/stats')
      return response.data
    } catch (error) {
      throw this.handleError(error, 'getStats')
    }
  }

  /**
   * Error handling helper
   */
  private handleError(error: any, method: string): Error {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status
      const message = error.response?.data?.error || error.message

      return new Error(`Brain API error in ${method}: [${status || 'NETWORK'}] ${message}`)
    }

    return new Error(`Brain client error in ${method}: ${error.message}`)
  }
}

/**
 * Get or create global Brain client instance
 */
let brainClientInstance: BrainClient | null = null

export function getBrainClient(config?: BrainConfig): BrainClient {
  // Support both naming conventions for environment variables
  const apiUrl =
    config?.apiUrl ||
    process.env.BRAIN_API_URL ||
    process.env.BRAIN_SERVICE_URL ||
    process.env.BRAIN_SERVICE_BASE_URL

  const apiKey = config?.apiKey || process.env.BRAIN_API_KEY || process.env.BRAIN_SERVICE_API_KEY

  if (!apiUrl || !apiKey) {
    const errorMessage =
      'Brain API configuration missing. Set BRAIN_SERVICE_BASE_URL and BRAIN_SERVICE_API_KEY environment variables. ' +
      'Brain service is required for all operations.'
    console.error('[BrainClient] ' + errorMessage)
    throw new Error(errorMessage)
  }

  const fullConfig: BrainConfig = {
    apiUrl,
    apiKey,
    jinaApiKey: config?.jinaApiKey || process.env.JINA_API_KEY,
    neo4jUri: config?.neo4jUri || process.env.NEO4J_URI,
    neo4jUser: config?.neo4jUser || process.env.NEO4J_USER,
    neo4jPassword: config?.neo4jPassword || process.env.NEO4J_PASSWORD,
    redisUrl: config?.redisUrl || process.env.REDIS_URL,
  }

  if (!brainClientInstance) {
    brainClientInstance = new BrainClient(fullConfig)
  }

  return brainClientInstance
}

export { BrainClient as default }
