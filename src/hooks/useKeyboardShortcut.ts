/**
 * useKeyboardShortcut Hook
 *
 * Hook for handling keyboard shortcuts
 */

'use client'

import { useEffect, useCallback } from 'react'

interface UseKeyboardShortcutOptions {
  key: string
  modifiers?: {
    ctrl?: boolean
    shift?: boolean
    alt?: boolean
    meta?: boolean
  }
  enabled?: boolean
  preventDefault?: boolean
}

export function useKeyboardShortcut(
  handler: (event: KeyboardEvent) => void,
  options: UseKeyboardShortcutOptions
) {
  const { key, modifiers = {}, enabled = true, preventDefault = true } = options

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return

      // Check if key matches
      if (event.key.toLowerCase() !== key.toLowerCase()) return

      // Check modifiers
      if (modifiers.ctrl && !event.ctrlKey) return
      if (modifiers.shift && !event.shiftKey) return
      if (modifiers.alt && !event.altKey) return
      if (modifiers.meta && !event.metaKey) return

      // Check if modifier should NOT be pressed
      if (!modifiers.ctrl && event.ctrlKey) return
      if (!modifiers.shift && event.shiftKey) return
      if (!modifiers.alt && event.altKey) return
      if (!modifiers.meta && event.metaKey) return

      if (preventDefault) {
        event.preventDefault()
      }

      handler(event)
    },
    [key, modifiers, enabled, preventDefault, handler]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown])
}

/**
 * Hook for multiple keyboard shortcuts
 */
interface ShortcutConfig extends UseKeyboardShortcutOptions {
  handler: (event: KeyboardEvent) => void
}

export function useKeyboardShortcuts(shortcuts: ShortcutConfig[]) {
  shortcuts.forEach(({ handler, ...options }) => {
    useKeyboardShortcut(handler, options)
  })
}
