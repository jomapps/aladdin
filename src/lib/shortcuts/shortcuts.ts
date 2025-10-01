/**
 * Keyboard Shortcuts Configuration
 * Defines all available keyboard shortcuts in the application
 */

export interface KeyboardShortcut {
  id: string;
  name: string;
  description: string;
  keys: string;
  category: ShortcutCategory;
  action?: () => void;
}

export type ShortcutCategory =
  | 'global'
  | 'orchestrator'
  | 'navigation'
  | 'editing'
  | 'modals';

export interface ShortcutGroup {
  category: ShortcutCategory;
  label: string;
  shortcuts: KeyboardShortcut[];
}

/**
 * Platform-aware key formatting
 */
export const getModifierKey = (): 'Cmd' | 'Ctrl' => {
  return typeof window !== 'undefined' &&
    navigator.platform.toLowerCase().includes('mac')
    ? 'Cmd'
    : 'Ctrl';
};

export const formatShortcutKey = (keys: string): string => {
  const modifier = getModifierKey();
  return keys.replace(/Mod/g, modifier);
};

/**
 * Global shortcuts configuration
 */
export const GLOBAL_SHORTCUTS: KeyboardShortcut[] = [
  {
    id: 'command-palette',
    name: 'Command Palette',
    description: 'Open command palette',
    keys: 'Mod+K',
    category: 'global',
  },
  {
    id: 'toggle-sidebar',
    name: 'Toggle Sidebar',
    description: 'Show/hide left sidebar',
    keys: 'Mod+B',
    category: 'global',
  },
  {
    id: 'toggle-orchestrator',
    name: 'Toggle Orchestrator',
    description: 'Show/hide orchestrator panel',
    keys: 'Mod+/',
    category: 'global',
  },
  {
    id: 'focus-search',
    name: 'Focus Search',
    description: 'Focus the search input',
    keys: 'Mod+F',
    category: 'global',
  },
  {
    id: 'save',
    name: 'Save',
    description: 'Save current changes',
    keys: 'Mod+S',
    category: 'global',
  },
  {
    id: 'new-item',
    name: 'New Item',
    description: 'Create new item (context-aware)',
    keys: 'Mod+N',
    category: 'global',
  },
  {
    id: 'show-shortcuts',
    name: 'Show Shortcuts',
    description: 'Display keyboard shortcuts help',
    keys: 'Mod+?',
    category: 'global',
  },
  {
    id: 'close-modal',
    name: 'Close Modal',
    description: 'Close modal or overlay',
    keys: 'Escape',
    category: 'global',
  },
];

/**
 * Orchestrator shortcuts
 */
export const ORCHESTRATOR_SHORTCUTS: KeyboardShortcut[] = [
  {
    id: 'query-mode',
    name: 'Query Mode',
    description: 'Switch to query mode',
    keys: 'Mod+1',
    category: 'orchestrator',
  },
  {
    id: 'data-mode',
    name: 'Data Mode',
    description: 'Switch to data mode',
    keys: 'Mod+2',
    category: 'orchestrator',
  },
  {
    id: 'task-mode',
    name: 'Task Mode',
    description: 'Switch to task mode',
    keys: 'Mod+3',
    category: 'orchestrator',
  },
  {
    id: 'chat-mode',
    name: 'Chat Mode',
    description: 'Switch to chat mode',
    keys: 'Mod+4',
    category: 'orchestrator',
  },
  {
    id: 'clear-conversation',
    name: 'Clear Conversation',
    description: 'Clear current conversation',
    keys: 'Mod+L',
    category: 'orchestrator',
  },
  {
    id: 'send-message',
    name: 'Send Message',
    description: 'Send current message',
    keys: 'Enter',
    category: 'orchestrator',
  },
  {
    id: 'new-line',
    name: 'New Line',
    description: 'Insert new line in message',
    keys: 'Shift+Enter',
    category: 'orchestrator',
  },
];

/**
 * Navigation shortcuts
 */
export const NAVIGATION_SHORTCUTS: KeyboardShortcut[] = [
  {
    id: 'next-item',
    name: 'Next Item',
    description: 'Move to next item in list',
    keys: 'J',
    category: 'navigation',
  },
  {
    id: 'previous-item',
    name: 'Previous Item',
    description: 'Move to previous item in list',
    keys: 'K',
    category: 'navigation',
  },
  {
    id: 'go-home',
    name: 'Go Home',
    description: 'Navigate to home page',
    keys: 'G then H',
    category: 'navigation',
  },
  {
    id: 'go-episodes',
    name: 'Go to Episodes',
    description: 'Navigate to episodes page',
    keys: 'G then E',
    category: 'navigation',
  },
  {
    id: 'go-characters',
    name: 'Go to Characters',
    description: 'Navigate to characters page',
    keys: 'G then C',
    category: 'navigation',
  },
  {
    id: 'go-scenes',
    name: 'Go to Scenes',
    description: 'Navigate to scenes page',
    keys: 'G then S',
    category: 'navigation',
  },
];

/**
 * All shortcuts grouped by category
 */
export const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    category: 'global',
    label: 'Global',
    shortcuts: GLOBAL_SHORTCUTS,
  },
  {
    category: 'orchestrator',
    label: 'Orchestrator',
    shortcuts: ORCHESTRATOR_SHORTCUTS,
  },
  {
    category: 'navigation',
    label: 'Navigation',
    shortcuts: NAVIGATION_SHORTCUTS,
  },
];

/**
 * Get shortcut by ID
 */
export const getShortcut = (id: string): KeyboardShortcut | undefined => {
  for (const group of SHORTCUT_GROUPS) {
    const shortcut = group.shortcuts.find(s => s.id === id);
    if (shortcut) return shortcut;
  }
  return undefined;
};

/**
 * Parse shortcut key string for react-hotkeys-hook
 */
export const parseShortcutKeys = (keys: string): string => {
  return keys
    .toLowerCase()
    .replace(/mod/g, typeof window !== 'undefined' &&
      navigator.platform.toLowerCase().includes('mac') ? 'meta' : 'ctrl')
    .replace(/\+/g, '+')
    .replace(/shift/g, 'shift')
    .replace(/alt/g, 'alt')
    .replace(/escape/g, 'esc')
    .replace(/enter/g, 'enter');
};
