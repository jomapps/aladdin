'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { KeyboardShortcut } from './shortcuts';

/**
 * Keyboard Shortcut Context
 */
interface KeyboardShortcutContextValue {
  isHelpModalOpen: boolean;
  openHelpModal: () => void;
  closeHelpModal: () => void;
  toggleHelpModal: () => void;
  registerShortcut: (shortcut: KeyboardShortcut) => void;
  unregisterShortcut: (id: string) => void;
  isShortcutEnabled: (id: string) => boolean;
  enableShortcut: (id: string) => void;
  disableShortcut: (id: string) => void;
}

const KeyboardShortcutContext = createContext<KeyboardShortcutContextValue | null>(null);

export const useKeyboardShortcuts = () => {
  const context = useContext(KeyboardShortcutContext);
  if (!context) {
    throw new Error('useKeyboardShortcuts must be used within KeyboardShortcutProvider');
  }
  return context;
};

interface KeyboardShortcutProviderProps {
  children: ReactNode;
}

export const KeyboardShortcutProvider: React.FC<KeyboardShortcutProviderProps> = ({
  children
}) => {
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [registeredShortcuts, setRegisteredShortcuts] = useState<Map<string, KeyboardShortcut>>(
    new Map()
  );
  const [disabledShortcuts, setDisabledShortcuts] = useState<Set<string>>(new Set());

  const openHelpModal = useCallback(() => {
    setIsHelpModalOpen(true);
  }, []);

  const closeHelpModal = useCallback(() => {
    setIsHelpModalOpen(false);
  }, []);

  const toggleHelpModal = useCallback(() => {
    setIsHelpModalOpen(prev => !prev);
  }, []);

  const registerShortcut = useCallback((shortcut: KeyboardShortcut) => {
    setRegisteredShortcuts(prev => {
      const next = new Map(prev);
      next.set(shortcut.id, shortcut);
      return next;
    });
  }, []);

  const unregisterShortcut = useCallback((id: string) => {
    setRegisteredShortcuts(prev => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const isShortcutEnabled = useCallback((id: string) => {
    return !disabledShortcuts.has(id);
  }, [disabledShortcuts]);

  const enableShortcut = useCallback((id: string) => {
    setDisabledShortcuts(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const disableShortcut = useCallback((id: string) => {
    setDisabledShortcuts(prev => new Set(prev).add(id));
  }, []);

  const value: KeyboardShortcutContextValue = {
    isHelpModalOpen,
    openHelpModal,
    closeHelpModal,
    toggleHelpModal,
    registerShortcut,
    unregisterShortcut,
    isShortcutEnabled,
    enableShortcut,
    disableShortcut,
  };

  return (
    <KeyboardShortcutContext.Provider value={value}>
      {children}
    </KeyboardShortcutContext.Provider>
  );
};
