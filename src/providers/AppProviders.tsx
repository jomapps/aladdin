/**
 * AppProviders Component
 *
 * Root provider wrapper that combines all application providers:
 * - QueryProvider (React Query)
 * - WebSocketProvider (Real-time updates)
 * - ProjectProvider (Project context)
 * - ErrorBoundary (Error handling)
 * - Toaster (Notifications)
 */

'use client'

import { ReactNode } from 'react'
import { QueryProvider } from '@/lib/react-query'
import { WebSocketProvider } from './WebSocketProvider'
import { Toaster } from 'sonner'

interface AppProvidersProps {
  children: ReactNode
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <QueryProvider>
      <WebSocketProvider autoConnect={false}>
        {children}
        <Toaster position="top-right" expand={false} richColors closeButton duration={4000} />
      </WebSocketProvider>
    </QueryProvider>
  )
}
