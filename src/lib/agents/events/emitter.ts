/**
 * Agent Event Emitter
 *
 * Centralized event emission system for the Dynamic Agents architecture.
 * Handles event dispatch, persistence, and broadcasting via Redis Pub/Sub.
 *
 * @see {@link /docs/architecture/dynamic-agents-architecture.md} Section 5: Real-time Event Streaming
 */

import { EventEmitter } from 'events'
import Redis from 'ioredis'
import type { AgentEvent, EventEmissionOptions, EventHandler, EventFilter } from './types'
import { persistEvent } from './event-persistence'

/**
 * AgentEventEmitter - Singleton event emitter for agent execution events
 *
 * Features:
 * - Singleton pattern for global event coordination
 * - Redis Pub/Sub for distributed event broadcasting
 * - Automatic event persistence to MongoDB
 * - Memory-efficient event buffering with size limits
 * - Type-safe event emission and handling
 * - Graceful error handling and recovery
 *
 * @example
 * ```typescript
 * const emitter = AgentEventEmitter.getInstance();
 *
 * // Subscribe to events
 * emitter.on('agent-start', (event) => {
 *   console.log(`Agent ${event.agentId} started`);
 * });
 *
 * // Emit events
 * await emitter.emit('agent-start', {
 *   executionId: 'exec-123',
 *   agentId: 'story-head-001',
 *   timestamp: new Date(),
 *   // ...
 * });
 * ```
 */
export class AgentEventEmitter extends EventEmitter {
  private static instance: AgentEventEmitter | null = null
  private redisPublisher: Redis | null = null
  private eventBuffer: Map<string, AgentEvent[]> = new Map()
  private readonly MAX_BUFFER_SIZE = 100 // Max events per execution ID
  private isShuttingDown = false

  /**
   * Private constructor - use getInstance() instead
   */
  private constructor() {
    super()
    this.setMaxListeners(100) // Support many concurrent listeners
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): AgentEventEmitter {
    if (!AgentEventEmitter.instance) {
      AgentEventEmitter.instance = new AgentEventEmitter()
    }
    return AgentEventEmitter.instance
  }

  /**
   * Initialize Redis connection for Pub/Sub
   *
   * @param redisUrl - Redis connection URL (defaults to process.env.REDIS_URL)
   */
  public async initialize(redisUrl?: string): Promise<void> {
    if (this.redisPublisher) {
      return // Already initialized
    }

    try {
      const url = redisUrl || process.env.REDIS_URL || 'redis://localhost:6379'
      this.redisPublisher = new Redis(url, {
        maxRetriesPerRequest: 3,
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000)
          return delay
        },
        enableOfflineQueue: true,
      })

      this.redisPublisher.on('error', (error) => {
        console.error('[AgentEventEmitter] Redis connection error:', error)
      })

      this.redisPublisher.on('connect', () => {
        console.log('[AgentEventEmitter] Connected to Redis')
      })

      this.redisPublisher.on('reconnecting', () => {
        console.log('[AgentEventEmitter] Reconnecting to Redis...')
      })

      // Test connection
      await this.redisPublisher.ping()
      console.log('[AgentEventEmitter] Redis initialized successfully')
    } catch (error) {
      console.error('[AgentEventEmitter] Failed to initialize Redis:', error)
      // Continue without Redis - events will still work via EventEmitter
    }
  }

  /**
   * Emit an agent event
   *
   * @param type - Event type (must match AgentEvent union)
   * @param event - Event data
   * @param options - Emission options (persist, broadcast, etc.)
   */
  public async emitAgentEvent(
    event: AgentEvent,
    options: EventEmissionOptions = {}
  ): Promise<void> {
    if (this.isShuttingDown) {
      console.warn('[AgentEventEmitter] Ignoring event during shutdown')
      return
    }

    const {
      persist = true,
      broadcast = true,
      executionId = event.executionId,
      conversationId = event.conversationId,
    } = options

    try {
      // 1. Emit to local EventEmitter listeners
      super.emit(event.type, event)
      super.emit('*', event) // Wildcard listener

      // 2. Buffer event for quick access
      this.bufferEvent(executionId, event)

      // 3. Persist to database (async, non-blocking)
      if (persist) {
        this.persistEventAsync(executionId, event).catch((error) => {
          console.error('[AgentEventEmitter] Failed to persist event:', error)
        })
      }

      // 4. Broadcast via Redis Pub/Sub
      if (broadcast && this.redisPublisher) {
        await this.broadcastEvent(executionId, conversationId, event)
      }
    } catch (error) {
      console.error('[AgentEventEmitter] Failed to emit event:', error)
      // Don't throw - event emission should never break execution
    }
  }

  /**
   * Subscribe to specific event type
   *
   * @param eventType - Event type to listen for (or '*' for all events)
   * @param handler - Event handler function
   * @param filter - Optional filter function
   */
  public subscribe(
    eventType: AgentEvent['type'] | '*',
    handler: EventHandler,
    filter?: EventFilter
  ): void {
    const wrappedHandler = filter
      ? (event: AgentEvent) => {
          if (filter(event)) {
            handler(event)
          }
        }
      : handler

    this.on(eventType, wrappedHandler)
  }

  /**
   * Unsubscribe from event type
   *
   * @param eventType - Event type
   * @param handler - Original handler function
   */
  public unsubscribe(eventType: AgentEvent['type'] | '*', handler: EventHandler): void {
    this.off(eventType, handler)
  }

  /**
   * Get buffered events for an execution
   *
   * @param executionId - Execution ID
   * @param eventType - Optional event type filter
   * @returns Array of buffered events
   */
  public getBufferedEvents(executionId: string, eventType?: AgentEvent['type']): AgentEvent[] {
    const events = this.eventBuffer.get(executionId) || []
    if (!eventType) {
      return events
    }
    return events.filter((event) => event.type === eventType)
  }

  /**
   * Clear buffered events for an execution
   *
   * @param executionId - Execution ID
   */
  public clearBuffer(executionId: string): void {
    this.eventBuffer.delete(executionId)
  }

  /**
   * Gracefully shutdown the event emitter
   */
  public async shutdown(): Promise<void> {
    this.isShuttingDown = true

    // Wait for pending events to process
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Close Redis connection
    if (this.redisPublisher) {
      await this.redisPublisher.quit()
      this.redisPublisher = null
    }

    // Clear buffers
    this.eventBuffer.clear()

    // Remove all listeners
    this.removeAllListeners()

    console.log('[AgentEventEmitter] Shutdown complete')
  }

  /**
   * Buffer event for quick retrieval (memory-efficient with size limit)
   */
  private bufferEvent(executionId: string, event: AgentEvent): void {
    if (!this.eventBuffer.has(executionId)) {
      this.eventBuffer.set(executionId, [])
    }

    const buffer = this.eventBuffer.get(executionId)!
    buffer.push(event)

    // Enforce buffer size limit
    if (buffer.length > this.MAX_BUFFER_SIZE) {
      buffer.shift() // Remove oldest event
    }
  }

  /**
   * Persist event to database (async, non-blocking)
   */
  private async persistEventAsync(executionId: string, event: AgentEvent): Promise<void> {
    try {
      await persistEvent(executionId, event)
    } catch (error) {
      console.error('[AgentEventEmitter] Event persistence failed:', error)
    }
  }

  /**
   * Broadcast event via Redis Pub/Sub
   */
  private async broadcastEvent(
    executionId: string,
    conversationId: string | undefined,
    event: AgentEvent
  ): Promise<void> {
    if (!this.redisPublisher) {
      return
    }

    try {
      const message = JSON.stringify(event)

      // Publish to execution-specific channel
      await this.redisPublisher.publish(`execution:${executionId}`, message)

      // Publish to conversation channel if available
      if (conversationId) {
        await this.redisPublisher.publish(`conversation:${conversationId}`, message)
      }

      // Publish to global events channel for monitoring
      await this.redisPublisher.publish('execution:all', message)
    } catch (error) {
      console.error('[AgentEventEmitter] Failed to broadcast event via Redis:', error)
      // Continue - Redis failure shouldn't break execution
    }
  }

  /**
   * Helper method to emit orchestration-start event
   */
  public async emitOrchestrationStart(
    executionId: string,
    context: {
      projectId: string
      episodeId?: string
      userPrompt: string
      complexity: 'low' | 'medium' | 'high'
    },
    conversationId?: string
  ): Promise<void> {
    await this.emitAgentEvent({
      type: 'orchestration-start',
      executionId,
      conversationId,
      timestamp: new Date(),
      context,
    })
  }

  /**
   * Helper method to emit orchestration-complete event
   */
  public async emitOrchestrationComplete(
    executionId: string,
    result: {
      departments: string[]
      overallQuality: number
      consistency: number
      recommendation: 'ingest' | 'review' | 'reject'
    },
    metrics: {
      totalTime: number
      tokensUsed: number
      agentsSpawned: number
      departmentsInvolved: number
    },
    conversationId?: string
  ): Promise<void> {
    await this.emitAgentEvent({
      type: 'orchestration-complete',
      executionId,
      conversationId,
      timestamp: new Date(),
      result,
      metrics,
    })
  }

  /**
   * Helper method to emit agent-start event
   */
  public async emitAgentStart(
    executionId: string,
    agentId: string,
    agentName: string,
    department: string,
    task: string,
    isDepartmentHead: boolean,
    conversationId?: string
  ): Promise<void> {
    await this.emitAgentEvent({
      type: 'agent-start',
      executionId,
      conversationId,
      timestamp: new Date(),
      agentId,
      agentName,
      department,
      task,
      isDepartmentHead,
    })
  }

  /**
   * Helper method to emit agent-complete event
   */
  public async emitAgentComplete(
    executionId: string,
    agentId: string,
    agentName: string,
    department: string,
    output: unknown,
    qualityScore: number,
    executionTime: number,
    tokenUsage?: { inputTokens: number; outputTokens: number; totalTokens: number },
    conversationId?: string
  ): Promise<void> {
    await this.emitAgentEvent({
      type: 'agent-complete',
      executionId,
      conversationId,
      timestamp: new Date(),
      agentId,
      agentName,
      department,
      output,
      qualityScore,
      executionTime,
      tokenUsage,
    })
  }
}

/**
 * Get the global event emitter instance
 */
export const getEventEmitter = (): AgentEventEmitter => AgentEventEmitter.getInstance()
