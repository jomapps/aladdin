/**
 * useGlobalKeyboardShortcuts Hook
 *
 * Centralized keyboard shortcuts for the entire application
 * Handles all global shortcuts including layout, orchestrator, and navigation
 */

'use client'

import { useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useLayoutStore } from '@/stores/layoutStore'

export function useGlobalKeyboardShortcuts() {
  const router = useRouter()
  const {
    toggleLeftSidebar,
    toggleRightOrchestrator,
    setOrchestratorMode,
    closeAllOverlays,
  } = useLayoutStore()

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Detect if Mac or Windows/Linux
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
      const modifier = isMac ? event.metaKey : event.ctrlKey

      // Ignore if user is typing in an input/textarea
      const target = event.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        // Allow Escape to work even in inputs
        if (event.key === 'Escape') {
          target.blur()
          closeAllOverlays()
        }
        return
      }

      // Handle shortcuts with modifier key
      if (modifier) {
        switch (event.key.toLowerCase()) {
          // Layout shortcuts
          case 'b':
            event.preventDefault()
            toggleLeftSidebar()
            break
          case '/':
            event.preventDefault()
            toggleRightOrchestrator()
            break

          // Orchestrator mode shortcuts
          case '1':
            event.preventDefault()
            setOrchestratorMode('query')
            break
          case '2':
            event.preventDefault()
            setOrchestratorMode('data')
            break
          case '3':
            event.preventDefault()
            setOrchestratorMode('task')
            break
          case '4':
            event.preventDefault()
            setOrchestratorMode('chat')
            break

          // Navigation shortcuts
          case 'k':
            event.preventDefault()
            // TODO: Open command palette
            console.log('Command palette (Cmd+K) - to be implemented')
            break
          case 'n':
            event.preventDefault()
            // TODO: New item (context-aware)
            console.log('New item (Cmd+N) - to be implemented')
            break
          case 's':
            event.preventDefault()
            // TODO: Save current item
            console.log('Save (Cmd+S) - to be implemented')
            break
          case 'f':
            event.preventDefault()
            // TODO: Focus search
            console.log('Focus search (Cmd+F) - to be implemented')
            break
          case 'h':
            event.preventDefault()
            // TODO: Show keyboard shortcuts help
            console.log('Keyboard shortcuts help (Cmd+H) - to be implemented')
            break
        }
      } else {
        // Handle shortcuts without modifier
        switch (event.key) {
          case 'Escape':
            event.preventDefault()
            closeAllOverlays()
            break
        }
      }
    },
    [
      router,
      toggleLeftSidebar,
      toggleRightOrchestrator,
      setOrchestratorMode,
      closeAllOverlays,
    ]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown])
}

/**
 * Keyboard shortcuts reference
 */
export const KEYBOARD_SHORTCUTS = {
  layout: [
    { key: 'Cmd+B', description: 'Toggle left sidebar' },
    { key: 'Cmd+/', description: 'Toggle orchestrator' },
    { key: 'Escape', description: 'Close overlays' },
  ],
  orchestrator: [
    { key: 'Cmd+1', description: 'Switch to Query mode' },
    { key: 'Cmd+2', description: 'Switch to Data mode' },
    { key: 'Cmd+3', description: 'Switch to Task mode' },
    { key: 'Cmd+4', description: 'Switch to Chat mode' },
  ],
  navigation: [
    { key: 'Cmd+K', description: 'Open command palette' },
    { key: 'Cmd+N', description: 'New item' },
    { key: 'Cmd+S', description: 'Save' },
    { key: 'Cmd+F', description: 'Search' },
    { key: 'Cmd+H', description: 'Show keyboard shortcuts' },
  ],
}

