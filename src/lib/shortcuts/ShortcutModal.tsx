'use client';

import React, { useEffect } from 'react';
import { X, Keyboard } from 'lucide-react';
import { useKeyboardShortcuts } from './KeyboardShortcutProvider';
import { SHORTCUT_GROUPS, formatShortcutKey } from './shortcuts';
import { FocusTrap } from '@/components/a11y/FocusTrap';
import { VisuallyHidden } from '@/components/a11y/VisuallyHidden';

/**
 * Keyboard Shortcuts Help Modal
 * Displays all available shortcuts grouped by category
 */
export const ShortcutModal: React.FC = () => {
  const { isHelpModalOpen, closeHelpModal } = useKeyboardShortcuts();

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isHelpModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isHelpModalOpen]);

  if (!isHelpModalOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
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
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden pointer-events-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <Keyboard className="w-6 h-6 text-purple-600 dark:text-purple-400" aria-hidden="true" />
                <h2
                  id="shortcut-modal-title"
                  className="text-2xl font-bold text-gray-900 dark:text-white"
                >
                  Keyboard Shortcuts
                </h2>
              </div>
              <button
                onClick={closeHelpModal}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                aria-label="Close shortcuts help"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(85vh-88px)]">
              <div className="grid gap-8">
                {SHORTCUT_GROUPS.map((group) => (
                  <div key={group.category}>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      {group.label}
                    </h3>
                    <div className="grid gap-2">
                      {group.shortcuts.map((shortcut) => (
                        <div
                          key={shortcut.id}
                          className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                        >
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 dark:text-white">
                              {shortcut.name}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {shortcut.description}
                            </div>
                          </div>
                          <kbd className="ml-4 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-md font-mono text-sm border border-gray-300 dark:border-gray-700 shadow-sm whitespace-nowrap">
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
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                Press{' '}
                <kbd className="px-2 py-1 bg-white dark:bg-gray-900 rounded border border-gray-300 dark:border-gray-700 font-mono text-xs">
                  Esc
                </kbd>{' '}
                or{' '}
                <kbd className="px-2 py-1 bg-white dark:bg-gray-900 rounded border border-gray-300 dark:border-gray-700 font-mono text-xs">
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
  );
};
