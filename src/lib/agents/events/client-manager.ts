/**
 * Client Subscription Manager
 *
 * Manages WebSocket client connections, subscriptions, and broadcasting.
 * Handles connection lifecycle, subscription tracking, and cleanup.
 *
 * @see {@link /docs/architecture/dynamic-agents-architecture.md} Section 5: Real-time Event Streaming
 */

import { WebSocket } from 'ws'
import type { WebSocketMessage, ClientSubscription } from './types'

/**
 * Client manager configuration
 */
export interface ClientManagerConfig {
  /** Client timeout in milliseconds (default: 60000) */
  timeout?: number
  /** Enable verbose logging (default: false) */
  verbose?: boolean
}

/**
 * ClientManager
 *
 * Manages WebSocket client connections and subscriptions.
 *
 * Features:
 * - Client connection tracking with unique IDs
 * - Execution and conversation subscription management
 * - Automatic cleanup of stale connections
 * - Efficient broadcast to subscribed clients
 * - Heartbeat monitoring with timeout handling
 *
 * @example
 * ```typescript
 * const manager = new ClientManager({ timeout: 60000 });
 *
 * // Add client
 * const clientId = manager.addClient(ws);
 *
 * // Subscribe to execution
 * manager.subscribe(clientId, 'exec-123');
 *
 * // Broadcast event
 * manager.broadcast('exec-123', event);
 * ```
 */
export class ClientManager {
  /** Map of client ID to WebSocket connection */
  private clients: Map<string, WebSocket> = new Map()

  /** Map of client ID to subscription info */
  private subscriptions: Map<string, ClientSubscription> = new Map()

  /** Map of execution ID to set of subscribed client IDs */
  private executionSubscriptions: Map<string, Set<string>> = new Map()

  /** Map of conversation ID to set of subscribed client IDs */
  private conversationSubscriptions: Map<string, Set<string>> = new Map()

  private config: Required<ClientManagerConfig>
  private clientIdCounter = 0

  constructor(config: ClientManagerConfig = {}) {
    this.config = {
      timeout: config.timeout || 60000,
      verbose: config.verbose || false,
    }
  }

  /**
   * Add a new client connection
   *
   * @param ws - WebSocket connection
   * @returns Client ID
   */
  public addClient(ws: WebSocket): string {
    const clientId = this.generateClientId()

    this.clients.set(clientId, ws)
    this.subscriptions.set(clientId, {
      clientId,
      connectedAt: new Date(),
      lastPing: new Date(),
    })

    if (this.config.verbose) {
      console.log(`[ClientManager] Added client: ${clientId}`)
    }

    return clientId
  }

  /**
   * Remove a client connection
   *
   * @param clientId - Client ID
   */
  public removeClient(clientId: string): void {
    // Remove from all subscriptions
    const subscription = this.subscriptions.get(clientId)
    if (subscription?.executionId) {
      this.unsubscribe(clientId, subscription.executionId)
    }
    if (subscription?.conversationId) {
      this.unsubscribeFromConversation(clientId, subscription.conversationId)
    }

    // Remove client
    this.clients.delete(clientId)
    this.subscriptions.delete(clientId)

    if (this.config.verbose) {
      console.log(`[ClientManager] Removed client: ${clientId}`)
    }
  }

  /**
   * Subscribe client to execution events
   *
   * @param clientId - Client ID
   * @param executionId - Execution ID
   */
  public subscribe(clientId: string, executionId: string): void {
    // Update subscription info
    const subscription = this.subscriptions.get(clientId)
    if (subscription) {
      subscription.executionId = executionId
    }

    // Add to execution subscriptions
    if (!this.executionSubscriptions.has(executionId)) {
      this.executionSubscriptions.set(executionId, new Set())
    }
    this.executionSubscriptions.get(executionId)!.add(clientId)

    if (this.config.verbose) {
      console.log(`[ClientManager] Client ${clientId} subscribed to execution ${executionId}`)
    }
  }

  /**
   * Unsubscribe client from execution events
   *
   * @param clientId - Client ID
   * @param executionId - Execution ID
   */
  public unsubscribe(clientId: string, executionId: string): void {
    const subscription = this.subscriptions.get(clientId)
    if (subscription && subscription.executionId === executionId) {
      delete subscription.executionId
    }

    const subscribers = this.executionSubscriptions.get(executionId)
    if (subscribers) {
      subscribers.delete(clientId)
      if (subscribers.size === 0) {
        this.executionSubscriptions.delete(executionId)
      }
    }

    if (this.config.verbose) {
      console.log(`[ClientManager] Client ${clientId} unsubscribed from execution ${executionId}`)
    }
  }

  /**
   * Subscribe client to conversation events
   *
   * @param clientId - Client ID
   * @param conversationId - Conversation ID
   */
  public subscribeToConversation(clientId: string, conversationId: string): void {
    const subscription = this.subscriptions.get(clientId)
    if (subscription) {
      subscription.conversationId = conversationId
    }

    if (!this.conversationSubscriptions.has(conversationId)) {
      this.conversationSubscriptions.set(conversationId, new Set())
    }
    this.conversationSubscriptions.get(conversationId)!.add(clientId)

    if (this.config.verbose) {
      console.log(
        `[ClientManager] Client ${clientId} subscribed to conversation ${conversationId}`
      )
    }
  }

  /**
   * Unsubscribe client from conversation events
   *
   * @param clientId - Client ID
   * @param conversationId - Conversation ID
   */
  public unsubscribeFromConversation(clientId: string, conversationId: string): void {
    const subscription = this.subscriptions.get(clientId)
    if (subscription && subscription.conversationId === conversationId) {
      delete subscription.conversationId
    }

    const subscribers = this.conversationSubscriptions.get(conversationId)
    if (subscribers) {
      subscribers.delete(clientId)
      if (subscribers.size === 0) {
        this.conversationSubscriptions.delete(conversationId)
      }
    }

    if (this.config.verbose) {
      console.log(
        `[ClientManager] Client ${clientId} unsubscribed from conversation ${conversationId}`
      )
    }
  }

  /**
   * Broadcast message to all clients subscribed to execution
   *
   * @param executionId - Execution ID
   * @param message - Message to broadcast
   */
  public broadcast(executionId: string, message: WebSocketMessage): void {
    const subscribers = this.executionSubscriptions.get(executionId)
    if (!subscribers || subscribers.size === 0) {
      return
    }

    const messageStr = JSON.stringify(message)
    let sentCount = 0

    subscribers.forEach((clientId) => {
      const ws = this.clients.get(clientId)
      if (ws && ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(messageStr)
          sentCount++
        } catch (error) {
          console.error(`[ClientManager] Failed to send to client ${clientId}:`, error)
          // Remove problematic client
          this.removeClient(clientId)
        }
      }
    })

    if (this.config.verbose && sentCount > 0) {
      console.log(
        `[ClientManager] Broadcasted to ${sentCount} clients for execution ${executionId}`
      )
    }
  }

  /**
   * Get all clients subscribed to a conversation
   *
   * @param conversationId - Conversation ID
   * @returns Array of WebSocket connections
   */
  public getClientsByConversation(conversationId: string): WebSocket[] {
    const subscribers = this.conversationSubscriptions.get(conversationId)
    if (!subscribers) {
      return []
    }

    const clients: WebSocket[] = []
    subscribers.forEach((clientId) => {
      const ws = this.clients.get(clientId)
      if (ws) {
        clients.push(ws)
      }
    })

    return clients
  }

  /**
   * Update last ping time for client
   *
   * @param clientId - Client ID
   */
  public updateLastPing(clientId: string): void {
    const subscription = this.subscriptions.get(clientId)
    if (subscription) {
      subscription.lastPing = new Date()
    }
  }

  /**
   * Clean up timed-out clients
   */
  public cleanupTimedOutClients(): void {
    const now = Date.now()
    const timedOutClients: string[] = []

    this.subscriptions.forEach((subscription, clientId) => {
      const lastPingTime = subscription.lastPing?.getTime() || subscription.connectedAt.getTime()
      if (now - lastPingTime > this.config.timeout) {
        timedOutClients.push(clientId)
      }
    })

    timedOutClients.forEach((clientId) => {
      console.log(`[ClientManager] Client ${clientId} timed out, removing...`)
      const ws = this.clients.get(clientId)
      if (ws) {
        ws.close()
      }
      this.removeClient(clientId)
    })

    if (timedOutClients.length > 0 && this.config.verbose) {
      console.log(`[ClientManager] Cleaned up ${timedOutClients.length} timed-out clients`)
    }
  }

  /**
   * Disconnect all clients gracefully
   */
  public disconnectAll(): void {
    console.log(`[ClientManager] Disconnecting ${this.clients.size} clients...`)

    this.clients.forEach((ws, clientId) => {
      try {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close(1000, 'Server shutting down')
        }
      } catch (error) {
        console.error(`[ClientManager] Failed to close client ${clientId}:`, error)
      }
    })

    this.clients.clear()
    this.subscriptions.clear()
    this.executionSubscriptions.clear()
    this.conversationSubscriptions.clear()
  }

  /**
   * Get all clients (for heartbeat)
   *
   * @returns Map of client ID to WebSocket
   */
  public getAllClients(): Map<string, WebSocket> {
    return this.clients
  }

  /**
   * Get number of connected clients
   */
  public getClientCount(): number {
    return this.clients.size
  }

  /**
   * Get number of active subscriptions
   */
  public getSubscriptionCount(): number {
    return this.executionSubscriptions.size + this.conversationSubscriptions.size
  }

  /**
   * Get subscription info for a client
   *
   * @param clientId - Client ID
   * @returns Subscription info or undefined
   */
  public getSubscription(clientId: string): ClientSubscription | undefined {
    return this.subscriptions.get(clientId)
  }

  /**
   * Generate unique client ID
   */
  private generateClientId(): string {
    this.clientIdCounter++
    return `client-${Date.now()}-${this.clientIdCounter}`
  }
}
