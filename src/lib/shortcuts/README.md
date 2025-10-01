# Keyboard Shortcuts System

## Overview

Comprehensive keyboard shortcuts system with platform-aware key handling, context management, and help modal.

## Features

- Platform-aware (Mac/Windows/Linux)
- Context-aware enabling/disabling
- Sequential key combinations (vim-style)
- Help modal with categorized shortcuts
- Integration with react-hotkeys-hook

## Setup

### 1. Wrap your app with the provider

```tsx
import { KeyboardShortcutProvider, ShortcutModal } from '@/lib/shortcuts';

export default function RootLayout({ children }) {
  return (
    <KeyboardShortcutProvider>
      {children}
      <ShortcutModal />
    </KeyboardShortcutProvider>
  );
}
```

### 2. Use shortcuts in your components

```tsx
import { useShortcut, useGlobalShortcut } from '@/lib/shortcuts';

export function MyComponent() {
  // Regular shortcut
  useShortcut('mod+k', () => {
    console.log('Command palette opened');
  });

  // Global shortcut (disabled in forms)
  useGlobalShortcut('j', () => {
    console.log('Next item');
  });

  return <div>...</div>;
}
```

## API

### useShortcut

Register a keyboard shortcut.

```tsx
useShortcut(
  keys: string,
  callback: (event: KeyboardEvent) => void,
  options?: UseShortcutOptions
)
```

**Options:**
- `enabled`: boolean - Enable/disable shortcut
- `shortcutId`: string - Shortcut ID for context management
- All react-hotkeys-hook options

### useGlobalShortcut

Register a shortcut that doesn't work in form fields.

```tsx
useGlobalShortcut(
  keys: string,
  callback: (event: KeyboardEvent) => void,
  options?: UseShortcutOptions
)
```

### useSequentialShortcut

Register a sequential key combination (like "g then h").

```tsx
useSequentialShortcut(
  sequence: string[],
  callback: () => void,
  options?: UseShortcutOptions
)
```

**Example:**
```tsx
useSequentialShortcut(['g', 'h'], () => {
  router.push('/');
});
```

### useKeyboardShortcuts (Context)

Access shortcut context methods.

```tsx
const {
  isHelpModalOpen,
  openHelpModal,
  closeHelpModal,
  toggleHelpModal,
  registerShortcut,
  unregisterShortcut,
  isShortcutEnabled,
  enableShortcut,
  disableShortcut
} = useKeyboardShortcuts();
```

## Key Syntax

### Modifiers
- `Mod` - Auto-detects platform (Cmd on Mac, Ctrl elsewhere)
- `Shift`
- `Alt`
- `Ctrl`
- `Meta` / `Cmd`

### Special Keys
- `Enter`
- `Escape` / `Esc`
- `Space`
- `Tab`
- `Backspace`
- `Delete`
- Arrow keys: `ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight`

### Combinations
Use `+` to combine keys:
```tsx
'Mod+K'        // Cmd+K on Mac, Ctrl+K elsewhere
'Shift+Enter'  // Shift + Enter
'Mod+Shift+P'  // Cmd+Shift+P on Mac, Ctrl+Shift+P elsewhere
```

## Default Shortcuts

### Global
- `Cmd/Ctrl + K` - Command palette
- `Cmd/Ctrl + B` - Toggle sidebar
- `Cmd/Ctrl + /` - Toggle orchestrator
- `Cmd/Ctrl + F` - Focus search
- `Cmd/Ctrl + S` - Save
- `Cmd/Ctrl + N` - New item
- `Cmd/Ctrl + ?` - Show shortcuts help
- `Esc` - Close modal

### Orchestrator
- `Cmd/Ctrl + 1-4` - Switch modes
- `Cmd/Ctrl + L` - Clear conversation
- `Enter` - Send message
- `Shift + Enter` - New line

### Navigation
- `J/K` - Next/previous item
- `G then H` - Go home
- `G then E` - Go to episodes
- `G then C` - Go to characters
- `G then S` - Go to scenes

## Adding Custom Shortcuts

### 1. Define shortcuts

```tsx
// shortcuts-config.ts
export const MY_SHORTCUTS: KeyboardShortcut[] = [
  {
    id: 'my-action',
    name: 'My Action',
    description: 'Does something cool',
    keys: 'Mod+M',
    category: 'custom',
  }
];
```

### 2. Register shortcuts

```tsx
import { useKeyboardShortcuts } from '@/lib/shortcuts';

function MyComponent() {
  const { registerShortcut } = useKeyboardShortcuts();

  useEffect(() => {
    MY_SHORTCUTS.forEach(registerShortcut);
  }, [registerShortcut]);

  return <div>...</div>;
}
```

### 3. Use shortcuts

```tsx
import { useShortcut } from '@/lib/shortcuts';

function MyComponent() {
  useShortcut('mod+m', () => {
    console.log('My custom action');
  }, {
    shortcutId: 'my-action'
  });

  return <div>...</div>;
}
```

## Context Management

Enable/disable shortcuts dynamically:

```tsx
const { enableShortcut, disableShortcut } = useKeyboardShortcuts();

// Disable during specific operations
useEffect(() => {
  if (isEditing) {
    disableShortcut('next-item');
  } else {
    enableShortcut('next-item');
  }
}, [isEditing]);
```

## TypeScript Support

Full TypeScript support with type definitions:

```tsx
import type {
  KeyboardShortcut,
  ShortcutCategory,
  ShortcutGroup,
  UseShortcutOptions
} from '@/lib/shortcuts';
```

## Testing

```tsx
import { fireEvent, render } from '@testing-library/react';
import { KeyboardShortcutProvider } from '@/lib/shortcuts';

test('shortcut works', () => {
  const handleShortcut = jest.fn();

  function TestComponent() {
    useShortcut('mod+k', handleShortcut);
    return <div>Test</div>;
  }

  render(
    <KeyboardShortcutProvider>
      <TestComponent />
    </KeyboardShortcutProvider>
  );

  fireEvent.keyDown(document, {
    key: 'k',
    metaKey: true
  });

  expect(handleShortcut).toHaveBeenCalled();
});
```
