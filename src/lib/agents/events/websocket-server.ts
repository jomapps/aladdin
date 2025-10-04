/**
 * WebSocket Server for Real-time Event Streaming
 *
 * Provides WebSocket server with Redis Pub/Sub integration for real-time
 * event streaming to connected clients.
 *
 * @see {@link /docs/architecture/dynamic-agents-architecture.md} Section 5: Real-time Event Streaming
 */

import { WebSocketServer, WebSocket } from 'ws'
import { IncomingMessage } from 'http'
import Redis from 'ioredis'
import type { AgentEvent, WebSocketMessage } from './types'
import { ClientManager } from './client-manager'

/**
 * WebSocket server configuration
 */
export interface WebSocketServerConfig {
  /** Port for WebSocket server (default: 3001) */
  port?: number
  /** Redis URL for Pub/Sub (default: process.env.REDIS_URL) */
  redisUrl?: string
  /** Heartbeat interval in milliseconds (default: 30000) */
  heartbeatInterval?: number
  /** Client timeout in milliseconds (default: 60000) */
  clientTimeout?: number
  /** Enable verbose logging (default: false) */
  verbose?: boolean
}

/**
 * AgentWebSocketServer
 *
 * WebSocket server for streaming agent execution events to clients.
 *
 * Features:
 * - WebSocket connection management with heartbeat/ping-pong
 * - Redis Pub/Sub for distributed event broadcasting
 * - Client subscription management by executionId or conversationId
 * - Automatic connection cleanup and error handling
 * - Graceful shutdown support
 *
 * @example
 * ```typescript
 * const server = new AgentWebSocketServer({
 *   port: 3001,
 *   redisUrl: 'redis://localhost:6379'
 * });
 *
 * await server.start();
 * ```
 */
export class AgentWebSocketServer {
  private wss: WebSocketServer | null = null
  private redisSubscriber: Redis | null = null
  private clientManager: ClientManager
  private config: Required<WebSocketServerConfig>
  private heartbeatTimer: NodeJS.Timeout | null = null
  private isRunning = false

  constructor(config: WebSocketServerConfig = {}) {
    this.config = {
      port: config.port || 3001,
      redisUrl: config.redisUrl || process.env.REDIS_URL || 'redis://localhost:6379',
      heartbeatInterval: config.heartbeatInterval || 30000,
      clientTimeout: config.clientTimeout || 60000,
      verbose: config.verbose || false,
    }

    this.clientManager = new ClientManager({
      timeout: this.config.clientTimeout,
      verbose: this.config.verbose,
    })
  }

  /**
   * Start the WebSocket server
   */
  public async start(): Promise<void> {
    if (this.isRunning) {
      console.warn('[WebSocketServer] Server already running')
      return
    }

    try {
      // Initialize WebSocket server
      this.wss = new WebSocketServer({ port: this.config.port })

      // Setup connection handler
      this.wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
        this.handleConnection(ws, req)
      })

      this.wss.on('error', (error) => {
        console.error('[WebSocketServer] Server error:', error)
      })

      // Initialize Redis subscriber
      await this.initializeRedisSubscriber()

      // Start heartbeat timer
      this.startHeartbeat()

      this.isRunning = true
      console.log(`[WebSocketServer] Started on port ${this.config.port}`)
    } catch (error) {
      console.error('[WebSocketServer] Failed to start:', error)
      throw error
    }
  }

  /**
   * Stop the WebSocket server gracefully
   */
  public async stop(): Promise<void> {
    if (!this.isRunning) {
      return
    }

    console.log('[WebSocketServer] Shutting down...')

    // Stop heartbeat
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }

    // Close all client connections
    this.clientManager.disconnectAll()

    // Close WebSocket server
    if (this.wss) {
      await new Promise<void>((resolve) => {
        this.wss!.close(() => {
          console.log('[WebSocketServer] WebSocket server closed')
          resolve()
        })
      })
      this.wss = null
    }

    // Close Redis subscriber
    if (this.redisSubscriber) {
      await this.redisSubscriber.quit()
      this.redisSubscriber = null
    }

    this.isRunning = false
    console.log('[WebSocketServer] Shutdown complete')
  }

  /**
   * Broadcast event to all subscribed clients
   */
  public broadcast(executionId: string, event: AgentEvent): void {
    const message: WebSocketMessage = {
      type: 'event',
      executionId,
      event,
      timestamp: new Date(),
    }

    this.clientManager.broadcast(executionId, message)

    if (this.config.verbose) {
      console.log(`[WebSocketServer] Broadcasted ${event.type} to execution ${executionId}`)
    }
  }

  /**
   * Get server statistics
   */
  public getStats(): {
    isRunning: boolean
    clientCount: number
    subscriptionCount: number
  } {
    return {
      isRunning: this.isRunning,
      clientCount: this.clientManager.getClientCount(),
      subscriptionCount: this.clientManager.getSubscriptionCount(),
    }
  }

  /**
   * Initialize Redis subscriber for Pub/Sub
   */
  private async initializeRedisSubscriber(): Promise<void> {
    try {
      this.redisSubscriber = new Redis(this.config.redisUrl, {
        maxRetriesPerRequest: 3,
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000)
          return delay
        },
        enableOfflineQueue: true,
      })

      this.redisSubscriber.on('error', (error) => {
        console.error('[WebSocketServer] Redis subscriber error:', error)
      })

      this.redisSubscriber.on('connect', () => {
        console.log('[WebSocketServer] Redis subscriber connected')
      })

      this.redisSubscriber.on('reconnecting', () => {
        console.log('[WebSocketServer] Redis subscriber reconnecting...')
      })

      // Subscribe to all execution channels including automated gather
      await this.redisSubscriber.psubscribe(
        'execution:*',
        'conversation:*',
        'automated-gather:*',
      )

      // Handle incoming messages
      this.redisSubscriber.on('pmessage', (pattern, channel, message) => {
        this.handleRedisMessage(pattern, channel, message)
      })

      console.log('[WebSocketServer] Redis subscriber initialized')
    } catch (error) {
      console.error('[WebSocketServer] Failed to initialize Redis subscriber:', error)
      throw error
    }
  }

  /**
   * Handle Redis Pub/Sub message
   */
  private handleRedisMessage(pattern: string, channel: string, message: string): void {
    try {
      const event: AgentEvent = JSON.parse(message)

      // Extract ID from channel name
      const [channelType, channelId] = channel.split(':')

      if (channelType === 'execution') {
        this.broadcast(channelId, event)
      } else if (channelType === 'conversation') {
        // Broadcast to all clients subscribed to this conversation
        const clients = this.clientManager.getClientsByConversation(channelId)
        const wsMessage: WebSocketMessage = {
          type: 'event',
          conversationId: channelId,
          event,
          timestamp: new Date(),
        }
        clients.forEach((ws) => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(wsMessage))
          }
        })
      } else if (channelType === 'automated-gather') {
        // Broadcast automated gather progress events
        const clients = this.clientManager.getAllClients()
        const wsMessage: WebSocketMessage = {
          type: 'event',
          executionId: channelId,
          event,
          timestamp: new Date(),
        }
        clients.forEach((ws) => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(wsMessage))
          }
        })
      }

      if (this.config.verbose) {
        console.log(`[WebSocketServer] Received ${event.type} from Redis channel ${channel}`)
      }
    } catch (error) {
      console.error('[WebSocketServer] Failed to parse Redis message:', error)
    }
  }

  /**
   * Handle new WebSocket connection
   */
  private handleConnection(ws: WebSocket, req: IncomingMessage): void {
    const clientId = this.clientManager.addClient(ws)

    if (this.config.verbose) {
      console.log(`[WebSocketServer] Client connected: ${clientId}`)
    }

    // Send welcome message
    const welcomeMessage: WebSocketMessage = {
      type: 'ping',
      timestamp: new Date(),
    }
    ws.send(JSON.stringify(welcomeMessage))

    // Handle incoming messages
    ws.on('message', (data: Buffer) => {
      this.handleClientMessage(clientId, ws, data)
    })

    // Handle pong (heartbeat response)
    ws.on('pong', () => {
      this.clientManager.updateLastPing(clientId)
    })

    // Handle close
    ws.on('close', () => {
      this.clientManager.removeClient(clientId)
      if (this.config.verbose) {
        console.log(`[WebSocketServer] Client disconnected: ${clientId}`)
      }
    })

    // Handle error
    ws.on('error', (error) => {
      console.error(`[WebSocketServer] Client error (${clientId}):`, error)
      this.clientManager.removeClient(clientId)
    })
  }

  /**
   * Handle message from client
   */
  private handleClientMessage(clientId: string, ws: WebSocket, data: Buffer): void {
    try {
      const message: WebSocketMessage = JSON.parse(data.toString())

      switch (message.type) {
        case 'subscribe':
          if (message.executionId) {
            this.clientManager.subscribe(clientId, message.executionId)
            if (this.config.verbose) {
              console.log(
                `[WebSocketServer] Client ${clientId} subscribed to execution ${message.executionId}`
              )
            }
          }
          if (message.conversationId) {
            this.clientManager.subscribeToConversation(clientId, message.conversationId)
            if (this.config.verbose) {
              console.log(
                `[WebSocketServer] Client ${clientId} subscribed to conversation ${message.conversationId}`
              )
            }
          }
          // Send confirmation
          ws.send(
            JSON.stringify({
              type: 'pong',
              timestamp: new Date(),
            })
          )
          break

        case 'unsubscribe':
          if (message.executionId) {
            this.clientManager.unsubscribe(clientId, message.executionId)
            if (this.config.verbose) {
              console.log(
                `[WebSocketServer] Client ${clientId} unsubscribed from execution ${message.executionId}`
              )
            }
          }
          if (message.conversationId) {
            this.clientManager.unsubscribeFromConversation(clientId, message.conversationId)
            if (this.config.verbose) {
              console.log(
                `[WebSocketServer] Client ${clientId} unsubscribed from conversation ${message.conversationId}`
              )
            }
          }
          break

        case 'ping':
          // Respond with pong
          ws.send(
            JSON.stringify({
              type: 'pong',
              timestamp: new Date(),
            })
          )
          this.clientManager.updateLastPing(clientId)
          break

        default:
          console.warn(`[WebSocketServer] Unknown message type: ${message.type}`)
      }
    } catch (error) {
      console.error(`[WebSocketServer] Failed to handle client message:`, error)
    }
  }

  /**
   * Start heartbeat timer to check client connections
   */
  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      const clients = this.clientManager.getAllClients()

      clients.forEach((ws, clientId) => {
        if (ws.readyState === WebSocket.OPEN) {
          // Send ping
          ws.ping()
        } else {
          // Remove dead connection
          this.clientManager.removeClient(clientId)
        }
      })

      // Clean up timed-out clients
      this.clientManager.cleanupTimedOutClients()
    }, this.config.heartbeatInterval)
  }
}

/**
 * Singleton instance for global access
 */
let serverInstance: AgentWebSocketServer | null = null

/**
 * Get or create WebSocket server instance
 */
export function getWebSocketServer(config?: WebSocketServerConfig): AgentWebSocketServer {
  if (!serverInstance) {
    serverInstance = new AgentWebSocketServer(config)
  }
  return serverInstance
}

/**
 * Start the WebSocket server (convenience function)
 */
export async function startWebSocketServer(config?: WebSocketServerConfig): Promise<void> {
  const server = getWebSocketServer(config)
  await server.start()
}

/**
 * Stop the WebSocket server (convenience function)
 */
export async function stopWebSocketServer(): Promise<void> {
  if (serverInstance) {
    await serverInstance.stop()
    serverInstance = null
  }
}
