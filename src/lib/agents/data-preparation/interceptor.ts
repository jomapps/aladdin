/**
 * Brain Service Interceptor - Intercepts all brain service storage calls
 * Routes through Data Preparation Agent for enrichment
 */

import { BrainClient, getBrainClient } from '@/lib/brain/client'
import { getDataPreparationAgent } from './agent'
import type { PrepareOptions, BrainDocument } from './types'

export class BrainServiceInterceptor {
  private brainClient: BrainClient
  private agent: ReturnType<typeof getDataPreparationAgent>
  private bypassCollections: Set<string> = new Set(['users'])

  constructor() {
    this.brainClient = getBrainClient()
    this.agent = getDataPreparationAgent()
  }

  /**
   * Store single entity (intercepted)
   */
  async store(data: any, options: PrepareOptions): Promise<any> {
    // Check if this collection should bypass the agent
    if (options.sourceCollection && this.bypassCollections.has(options.sourceCollection)) {
      console.log(`[BrainInterceptor] Bypassing agent for ${options.sourceCollection}`)
      return await this.rawStore(data)
    }

    console.log(`[BrainInterceptor] Intercepting store for ${options.entityType}`)

    // Prepare data through agent
    const brainDocument = await this.agent.prepare(data, options)

    // Store in brain service
    return await this.rawStore(brainDocument)
  }

  /**
   * Store batch (intercepted)
   */
  async storeBatch(
    items: Array<{ data: any; options: PrepareOptions }>
  ): Promise<any[]> {
    console.log(`[BrainInterceptor] Intercepting batch store for ${items.length} items`)

    // Filter out bypassed collections
    const toProcess = items.filter(
      item => !item.options.sourceCollection || !this.bypassCollections.has(item.options.sourceCollection)
    )
    const toBypas = items.filter(
      item => item.options.sourceCollection && this.bypassCollections.has(item.options.sourceCollection)
    )

    // Prepare all items through agent
    const prepared = await this.agent.prepareBatch(toProcess)

    // Store all in brain service
    const results = await Promise.all([
      ...prepared.map(doc => this.rawStore(doc)),
      ...toBypass.map(item => this.rawStore(item.data)),
    ])

    return results
  }

  /**
   * Store async (queued)
   */
  async storeAsync(data: any, options: PrepareOptions): Promise<string> {
    console.log(`[BrainInterceptor] Queueing store for ${options.entityType}`)
    return await this.agent.prepareAsync(data, options)
  }

  /**
   * Raw store - bypasses agent (internal use only)
   */
  private async rawStore(document: BrainDocument | any): Promise<any> {
    // TODO: Implement actual brain service storage
    // For now, just log
    console.log('[BrainInterceptor] Storing in brain service:', {
      id: document.id,
      type: document.type,
      project_id: document.project_id,
    })

    // This would call the actual brain service API
    // return await this.brainClient.createNode(...)
    
    return { success: true, id: document.id }
  }

  /**
   * Query methods (pass-through, no interception)
   */
  async query(params: any): Promise<any> {
    return await this.brainClient.semanticSearch(params)
  }

  async search(params: any): Promise<any> {
    return await this.brainClient.searchSimilar(params)
  }

  async getNode(id: string): Promise<any> {
    return await this.brainClient.getNode(id)
  }
}

/**
 * Get singleton interceptor instance
 */
let interceptorInstance: BrainServiceInterceptor | null = null

export function getBrainServiceInterceptor(): BrainServiceInterceptor {
  if (!interceptorInstance) {
    interceptorInstance = new BrainServiceInterceptor()
  }
  return interceptorInstance
}

