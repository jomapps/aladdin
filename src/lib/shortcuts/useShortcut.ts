'use client';

import { useEffect } from 'react';
import { useHotkeys, Options } from 'react-hotkeys-hook';
import { useKeyboardShortcuts } from './KeyboardShortcutProvider';
import { parseShortcutKeys } from './shortcuts';

export interface UseShortcutOptions extends Omit<Options, 'enabled'> {
  enabled?: boolean;
  shortcutId?: string;
}

/**
 * Hook for registering keyboard shortcuts
 * Wraps react-hotkeys-hook with context-aware enabled state
 */
export const useShortcut = (
  keys: string,
  callback: (event: KeyboardEvent) => void,
  options: UseShortcutOptions = {}
): void => {
  const { isShortcutEnabled } = useKeyboardShortcuts();
  const { enabled = true, shortcutId, ...hotkeysOptions } = options;

  // Check if shortcut is enabled in context
  const isContextEnabled = shortcutId ? isShortcutEnabled(shortcutId) : true;
  const finalEnabled = enabled && isContextEnabled;

  // Parse and normalize keys
  const parsedKeys = parseShortcutKeys(keys);

  useHotkeys(
    parsedKeys,
    callback,
    {
      ...hotkeysOptions,
      enabled: finalEnabled,
    },
    [callback, finalEnabled]
  );
};

/**
 * Hook for registering shortcuts that should only work when not in input fields
 */
export const useGlobalShortcut = (
  keys: string,
  callback: (event: KeyboardEvent) => void,
  options: UseShortcutOptions = {}
): void => {
  useShortcut(keys, callback, {
    ...options,
    enableOnFormTags: false, // Disable in form elements
    preventDefault: true,
  });
};

/**
 * Hook for sequential key combinations (like "g then h")
 */
export const useSequentialShortcut = (
  sequence: string[],
  callback: () => void,
  options: UseShortcutOptions = {}
): void => {
  const { enabled = true, shortcutId } = options;
  const { isShortcutEnabled } = useKeyboardShortcuts();

  const isContextEnabled = shortcutId ? isShortcutEnabled(shortcutId) : true;
  const finalEnabled = enabled && isContextEnabled;

  useEffect(() => {
    if (!finalEnabled) return;

    let currentIndex = 0;
    let timeoutId: NodeJS.Timeout | null = null;

    const handleKeyPress = (event: KeyboardEvent) => {
      // Skip if in input field
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.contentEditable === 'true'
      ) {
        return;
      }

      const expectedKey = sequence[currentIndex].toLowerCase();
      const pressedKey = event.key.toLowerCase();

      if (pressedKey === expectedKey) {
        currentIndex++;

        if (currentIndex === sequence.length) {
          // Complete sequence matched
          event.preventDefault();
          callback();
          currentIndex = 0;
          if (timeoutId) clearTimeout(timeoutId);
        } else {
          // Reset after 1 second of inactivity
          if (timeoutId) clearTimeout(timeoutId);
          timeoutId = setTimeout(() => {
            currentIndex = 0;
          }, 1000);
        }
      } else {
        // Wrong key pressed, reset
        currentIndex = 0;
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [sequence, callback, finalEnabled]);
};
