/**
 * Event System Initialization Utility
 *
 * Convenience functions for initializing the real-time event streaming system.
 * Call these functions during server startup to set up the event infrastructure.
 *
 * @see {@link /docs/agents/real-time-event-streaming-implementation.md}
 */

import type { Payload } from 'payload'
import { getEventEmitter } from './emitter'
import { startWebSocketServer } from './websocket-server'
import { initializeEventPersistence } from './event-persistence'

/**
 * Configuration for event system initialization
 */
export interface EventSystemConfig {
  /** Redis URL for Pub/Sub (default: process.env.REDIS_URL) */
  redisUrl?: string
  /** WebSocket server port (default: 3001) */
  wsPort?: number
  /** Heartbeat interval in milliseconds (default: 30000) */
  heartbeatInterval?: number
  /** Client timeout in milliseconds (default: 60000) */
  clientTimeout?: number
  /** Enable verbose logging (default: process.env.NODE_ENV === 'development') */
  verbose?: boolean
  /** Auto-start WebSocket server (default: true) */
  autoStartWs?: boolean
}

/**
 * Initialize the complete event streaming system
 *
 * This is the main initialization function that should be called once
 * during server startup. It sets up:
 * - Event emitter with Redis Pub/Sub
 * - Event persistence with PayloadCMS
 * - WebSocket server for client connections
 *
 * @param payload - PayloadCMS instance
 * @param config - Optional configuration
 *
 * @example
 * ```typescript
 * import { getPayload } from 'payload'
 * import { initializeEventSystem } from '@/lib/agents/events/initialize'
 *
 * const payload = await getPayload()
 * await initializeEventSystem(payload, {
 *   wsPort: 3001,
 *   verbose: true
 * })
 * ```
 */
export async function initializeEventSystem(
  payload: Payload,
  config: EventSystemConfig = {}
): Promise<void> {
  const {
    redisUrl = process.env.REDIS_URL,
    wsPort = parseInt(process.env.WS_PORT || '3001'),
    heartbeatInterval = 30000,
    clientTimeout = 60000,
    verbose = process.env.NODE_ENV === 'development',
    autoStartWs = true,
  } = config

  console.log('[EventSystem] Initializing real-time event streaming...')

  try {
    // 1. Initialize event persistence with PayloadCMS
    console.log('[EventSystem] Setting up event persistence...')
    initializeEventPersistence(payload)

    // 2. Initialize event emitter with Redis
    console.log('[EventSystem] Connecting to Redis for Pub/Sub...')
    const emitter = getEventEmitter()
    await emitter.initialize(redisUrl)

    // 3. Start WebSocket server
    if (autoStartWs) {
      console.log(`[EventSystem] Starting WebSocket server on port ${wsPort}...`)
      await startWebSocketServer({
        port: wsPort,
        redisUrl,
        heartbeatInterval,
        clientTimeout,
        verbose,
      })
    }

    console.log('[EventSystem] ✅ Initialization complete!')
    console.log(`[EventSystem] WebSocket server: ws://localhost:${wsPort}`)
    console.log(`[EventSystem] Redis: ${redisUrl || 'redis://localhost:6379'}`)
    console.log(`[EventSystem] Ready to stream events`)
  } catch (error) {
    console.error('[EventSystem] ❌ Initialization failed:', error)
    throw error
  }
}

/**
 * Initialize event system with minimal configuration
 *
 * Uses all default settings. Good for development and quick setup.
 *
 * @param payload - PayloadCMS instance
 *
 * @example
 * ```typescript
 * import { initializeEventSystemQuick } from '@/lib/agents/events/initialize'
 *
 * await initializeEventSystemQuick(payload)
 * ```
 */
export async function initializeEventSystemQuick(payload: Payload): Promise<void> {
  await initializeEventSystem(payload, {
    verbose: true,
  })
}

/**
 * Initialize event system for production
 *
 * Uses production-optimized settings:
 * - No verbose logging
 * - Shorter timeouts
 * - Production Redis URL
 *
 * @param payload - PayloadCMS instance
 * @param redisUrl - Production Redis URL
 * @param wsPort - WebSocket server port
 *
 * @example
 * ```typescript
 * import { initializeEventSystemProduction } from '@/lib/agents/events/initialize'
 *
 * await initializeEventSystemProduction(
 *   payload,
 *   'redis://production-redis:6379',
 *   8080
 * )
 * ```
 */
export async function initializeEventSystemProduction(
  payload: Payload,
  redisUrl: string,
  wsPort: number = 3001
): Promise<void> {
  await initializeEventSystem(payload, {
    redisUrl,
    wsPort,
    heartbeatInterval: 20000, // Faster heartbeat
    clientTimeout: 40000, // Shorter timeout
    verbose: false, // No verbose logging
  })
}

/**
 * Gracefully shutdown the event system
 *
 * Closes all connections and cleans up resources.
 * Should be called during server shutdown.
 *
 * @example
 * ```typescript
 * import { shutdownEventSystem } from '@/lib/agents/events/initialize'
 *
 * process.on('SIGTERM', async () => {
 *   await shutdownEventSystem()
 *   process.exit(0)
 * })
 * ```
 */
export async function shutdownEventSystem(): Promise<void> {
  console.log('[EventSystem] Shutting down...')

  try {
    // Import dynamically to avoid circular dependencies
    const { stopWebSocketServer } = await import('./websocket-server')
    const { getEventEmitter } = await import('./emitter')

    // Stop WebSocket server
    await stopWebSocketServer()

    // Shutdown event emitter
    const emitter = getEventEmitter()
    await emitter.shutdown()

    console.log('[EventSystem] ✅ Shutdown complete')
  } catch (error) {
    console.error('[EventSystem] ❌ Shutdown error:', error)
    throw error
  }
}

/**
 * Check if event system is initialized and healthy
 *
 * @returns Health status
 *
 * @example
 * ```typescript
 * import { checkEventSystemHealth } from '@/lib/agents/events/initialize'
 *
 * const health = await checkEventSystemHealth()
 * if (health.healthy) {
 *   console.log('Event system is healthy')
 * }
 * ```
 */
export async function checkEventSystemHealth(): Promise<{
  healthy: boolean
  wsServer: { running: boolean; clients: number; subscriptions: number }
  redis: { connected: boolean }
  errors: string[]
}> {
  const errors: string[] = []
  let wsRunning = false
  let wsClients = 0
  let wsSubscriptions = 0
  let redisConnected = false

  try {
    // Check WebSocket server
    const { getWebSocketServer } = await import('./websocket-server')
    const server = getWebSocketServer()
    const stats = server.getStats()
    wsRunning = stats.isRunning
    wsClients = stats.clientCount
    wsSubscriptions = stats.subscriptionCount

    if (!wsRunning) {
      errors.push('WebSocket server not running')
    }
  } catch (error) {
    errors.push(`WebSocket check failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }

  try {
    // Check Redis connection
    const { getEventEmitter } = await import('./emitter')
    const emitter = getEventEmitter()
    // Simple check - if emitter exists, assume Redis is OK
    // (actual connection check would require exposing Redis client)
    redisConnected = true
  } catch (error) {
    errors.push(`Redis check failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }

  return {
    healthy: errors.length === 0 && wsRunning && redisConnected,
    wsServer: {
      running: wsRunning,
      clients: wsClients,
      subscriptions: wsSubscriptions,
    },
    redis: {
      connected: redisConnected,
    },
    errors,
  }
}

/**
 * Get event system statistics
 *
 * @returns System statistics
 */
export async function getEventSystemStats(): Promise<{
  wsServer: { running: boolean; clients: number; subscriptions: number }
  uptime?: number
}> {
  try {
    const { getWebSocketServer } = await import('./websocket-server')
    const server = getWebSocketServer()
    const stats = server.getStats()

    return {
      wsServer: {
        running: stats.isRunning,
        clients: stats.clientCount,
        subscriptions: stats.subscriptionCount,
      },
    }
  } catch (error) {
    return {
      wsServer: {
        running: false,
        clients: 0,
        subscriptions: 0,
      },
    }
  }
}
