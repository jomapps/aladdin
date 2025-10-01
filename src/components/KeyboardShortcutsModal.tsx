/**
 * KeyboardShortcutsModal Component
 *
 * Displays all available keyboard shortcuts in a modal dialog
 */

'use client'

import { Keyboard } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { KEYBOARD_SHORTCUTS } from '@/hooks/useGlobalKeyboardShortcuts'

interface KeyboardShortcutsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function KeyboardShortcutsModal({ open, onOpenChange }: KeyboardShortcutsModalProps) {
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0

  const formatKey = (key: string) => {
    if (isMac) {
      return key.replace('Cmd', '⌘').replace('Ctrl', '⌃').replace('Shift', '⇧').replace('Alt', '⌥')
    }
    return key
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            <DialogTitle>Keyboard Shortcuts</DialogTitle>
          </div>
          <DialogDescription>
            Use these keyboard shortcuts to navigate faster
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Layout Shortcuts */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Layout</h3>
            <div className="space-y-2">
              {KEYBOARD_SHORTCUTS.layout.map((shortcut) => (
                <div key={shortcut.key} className="flex items-center justify-between py-2">
                  <span className="text-sm text-muted-foreground">{shortcut.description}</span>
                  <kbd className="px-2 py-1 text-xs font-semibold text-foreground bg-muted border border-border rounded">
                    {formatKey(shortcut.key)}
                  </kbd>
                </div>
              ))}
            </div>
          </div>

          {/* Orchestrator Shortcuts */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Orchestrator</h3>
            <div className="space-y-2">
              {KEYBOARD_SHORTCUTS.orchestrator.map((shortcut) => (
                <div key={shortcut.key} className="flex items-center justify-between py-2">
                  <span className="text-sm text-muted-foreground">{shortcut.description}</span>
                  <kbd className="px-2 py-1 text-xs font-semibold text-foreground bg-muted border border-border rounded">
                    {formatKey(shortcut.key)}
                  </kbd>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Shortcuts */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Navigation</h3>
            <div className="space-y-2">
              {KEYBOARD_SHORTCUTS.navigation.map((shortcut) => (
                <div key={shortcut.key} className="flex items-center justify-between py-2">
                  <span className="text-sm text-muted-foreground">{shortcut.description}</span>
                  <kbd className="px-2 py-1 text-xs font-semibold text-foreground bg-muted border border-border rounded">
                    {formatKey(shortcut.key)}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t">
          <p className="text-xs text-muted-foreground text-center">
            Press <kbd className="px-1 py-0.5 text-xs font-semibold bg-muted border border-border rounded">Cmd+H</kbd> to show this dialog
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}

