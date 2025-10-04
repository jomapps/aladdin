'use client'

import React, { useEffect } from 'react'
import { X, Keyboard } from 'lucide-react'
import { useKeyboardShortcuts } from './KeyboardShortcutProvider'
import { SHORTCUT_GROUPS, formatShortcutKey } from './shortcuts'
import { FocusTrap } from '@/components/a11y/FocusTrap'
import { VisuallyHidden } from '@/components/a11y/VisuallyHidden'

/**
 * Keyboard Shortcuts Help Modal
 * Displays all available shortcuts grouped by category
 */
export const ShortcutModal: React.FC = () => {
  const { isHelpModalOpen, closeHelpModal } = useKeyboardShortcuts()

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isHelpModalOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isHelpModalOpen])

  if (!isHelpModalOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm"
        onClick={closeHelpModal}
        aria-hidden="true"
      />

      {/* Modal */}
      <FocusTrap>
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="shortcut-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
        >
          <div className="pointer-events-auto w-full max-h-[85vh] max-w-4xl overflow-hidden rounded-2xl border border-white/12 bg-slate-950/95 shadow-[0_60px_160px_-80px_rgba(56,189,248,0.8)] backdrop-blur-xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-6 py-5">
              <div className="flex items-center gap-3">
                <Keyboard className="h-6 w-6 text-violet-200" aria-hidden="true" />
                <h2
                  id="shortcut-modal-title"
                  className="text-2xl font-semibold tracking-tight text-slate-100"
                >
                  Keyboard Shortcuts
                </h2>
              </div>
              <button
                onClick={closeHelpModal}
                className="rounded-lg border border-transparent bg-white/10 p-2 text-slate-200 transition hover:border-violet-300/40 hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
                aria-label="Close shortcuts help"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            {/* Content */}
            <div className="max-h-[calc(85vh-88px)] overflow-y-auto p-6">
              <div className="grid gap-8">
                {SHORTCUT_GROUPS.map((group) => (
                  <div key={group.category}>
                    <h3 className="mb-4 text-lg font-semibold text-slate-100">{group.label}</h3>
                    <div className="grid gap-2">
                      {group.shortcuts.map((shortcut) => (
                        <div
                          key={shortcut.id}
                          className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/6 p-3 transition duration-200 hover:border-white/20 hover:bg-white/12"
                        >
                          <div className="flex-1">
                            <div className="font-medium text-slate-100">{shortcut.name}</div>
                            <div className="text-sm text-slate-300">{shortcut.description}</div>
                          </div>
                          <kbd className="ml-4 whitespace-nowrap rounded-lg border border-white/15 bg-white/8 px-3 py-1.5 font-mono text-sm text-slate-100 shadow-[0_18px_45px_-40px_rgba(56,189,248,0.65)]">
                            {formatShortcutKey(shortcut.keys)}
                          </kbd>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-white/10 bg-white/6 px-6 py-4">
              <p className="text-center text-sm text-slate-300">
                Press{' '}
                <kbd className="rounded border border-white/20 bg-white/10 px-2 py-1 font-mono text-xs text-slate-100">
                  Esc
                </kbd>{' '}
                or{' '}
                <kbd className="rounded border border-white/20 bg-white/10 px-2 py-1 font-mono text-xs text-slate-100">
                  {formatShortcutKey('Mod+?')}
                </kbd>{' '}
                to close this dialog
              </p>
            </div>
          </div>
        </div>
      </FocusTrap>

      <VisuallyHidden>
        <div role="status" aria-live="polite" aria-atomic="true">
          Keyboard shortcuts help dialog opened. Press Escape to close.
        </div>
      </VisuallyHidden>
    </>
  )
}
