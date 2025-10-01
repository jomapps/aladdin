/**
 * AppLayout Component
 *
 * Main layout orchestrator that combines all layout sections:
 * - TopMenuBar
 * - LeftSidebar
 * - MainContent
 * - RightOrchestrator
 *
 * Handles keyboard shortcuts and responsive behavior
 */

'use client'

import { useEffect } from 'react'
import { useLayoutStore } from '@/stores/layoutStore'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcut'
import TopMenuBar from './TopMenuBar'
import LeftSidebar from './LeftSidebar'
import MainContent from './MainContent'
import RightOrchestrator from './RightOrchestrator'

interface AppLayoutProps {
  children: React.ReactNode
  user?: {
    id: string
    email: string
    name?: string
  }
}

export default function AppLayout({ children, user }: AppLayoutProps) {
  const {
    toggleLeftSidebar,
    toggleRightOrchestrator,
    setOrchestratorMode,
    closeAllOverlays,
  } = useLayoutStore()

  // Setup keyboard shortcuts
  useKeyboardShortcuts([
    // Toggle left sidebar (Cmd/Ctrl + B)
    {
      key: 'b',
      modifiers: { meta: true },
      handler: () => toggleLeftSidebar(),
    },
    // Toggle right orchestrator (Cmd/Ctrl + /)
    {
      key: '/',
      modifiers: { meta: true },
      handler: () => toggleRightOrchestrator(),
    },
    // Switch to Query mode (Cmd/Ctrl + 1)
    {
      key: '1',
      modifiers: { meta: true },
      handler: () => {
        setOrchestratorMode('query')
        toggleRightOrchestrator()
      },
    },
    // Switch to Data mode (Cmd/Ctrl + 2)
    {
      key: '2',
      modifiers: { meta: true },
      handler: () => {
        setOrchestratorMode('data')
        toggleRightOrchestrator()
      },
    },
    // Switch to Task mode (Cmd/Ctrl + 3)
    {
      key: '3',
      modifiers: { meta: true },
      handler: () => {
        setOrchestratorMode('task')
        toggleRightOrchestrator()
      },
    },
    // Switch to Chat mode (Cmd/Ctrl + 4)
    {
      key: '4',
      modifiers: { meta: true },
      handler: () => {
        setOrchestratorMode('chat')
        toggleRightOrchestrator()
      },
    },
    // Close overlays (Escape)
    {
      key: 'Escape',
      modifiers: {},
      handler: () => closeAllOverlays(),
    },
  ])

  // Close mobile overlays on route change
  useEffect(() => {
    closeAllOverlays()
  }, [closeAllOverlays])

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      {/* Top Menu Bar - Fixed */}
      <TopMenuBar user={user} />

      {/* Main Layout Grid */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Collapsible */}
        <LeftSidebar />

        {/* Main Content Area - Flexible */}
        <MainContent>{children}</MainContent>

        {/* Right Orchestrator Sidebar - Collapsible */}
        <RightOrchestrator />
      </div>
    </div>
  )
}

