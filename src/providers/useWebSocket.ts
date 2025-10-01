/**
 * useWebSocket Hook
 *
 * Simple hook to access WebSocket connection state and methods
 */

'use client'

import { useWebSocketContext } from './WebSocketProvider'

export function useWebSocket() {
  return useWebSocketContext()
}

export type { ConnectionState } from './WebSocketProvider'
