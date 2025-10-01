# Accessibility Implementation Guide

## Overview

This project implements WCAG 2.1 AA accessibility standards with comprehensive keyboard shortcuts and screen reader support.

## Keyboard Shortcuts

### Global Shortcuts
- `Cmd/Ctrl + K` - Open command palette
- `Cmd/Ctrl + B` - Toggle left sidebar
- `Cmd/Ctrl + /` - Toggle orchestrator panel
- `Cmd/Ctrl + F` - Focus search input
- `Cmd/Ctrl + S` - Save current changes
- `Cmd/Ctrl + N` - Create new item (context-aware)
- `Cmd/Ctrl + ?` - Show keyboard shortcuts help
- `Esc` - Close modal or overlay

### Orchestrator Shortcuts
- `Cmd/Ctrl + 1` - Switch to query mode
- `Cmd/Ctrl + 2` - Switch to data mode
- `Cmd/Ctrl + 3` - Switch to task mode
- `Cmd/Ctrl + 4` - Switch to chat mode
- `Cmd/Ctrl + L` - Clear conversation
- `Enter` - Send message
- `Shift + Enter` - Insert new line in message

### Navigation Shortcuts
- `J` - Move to next item in list
- `K` - Move to previous item in list
- `G then H` - Navigate to home page
- `G then E` - Navigate to episodes page
- `G then C` - Navigate to characters page
- `G then S` - Navigate to scenes page

## Implementation

### Setting Up Shortcuts

```tsx
import { KeyboardShortcutProvider, ShortcutModal } from '@/lib/shortcuts';

function App() {
  return (
    <KeyboardShortcutProvider>
      <YourApp />
      <ShortcutModal />
    </KeyboardShortcutProvider>
  );
}
```

### Using Shortcuts in Components

```tsx
import { useShortcut, useGlobalShortcut } from '@/lib/shortcuts';

function MyComponent() {
  // Regular shortcut (works everywhere)
  useShortcut('mod+k', () => {
    openCommandPalette();
  });

  // Global shortcut (disabled in input fields)
  useGlobalShortcut('j', () => {
    navigateNext();
  });
}
```

### Sequential Key Combinations

```tsx
import { useSequentialShortcut } from '@/lib/shortcuts';

function MyComponent() {
  useSequentialShortcut(['g', 'h'], () => {
    router.push('/');
  });
}
```

## Accessibility Components

### Skip to Content

```tsx
import { SkipToContent } from '@/components/a11y';

function Layout() {
  return (
    <>
      <SkipToContent />
      <nav>...</nav>
      <main id="main-content" tabIndex={-1}>
        {children}
      </main>
    </>
  );
}
```

### Visually Hidden Text

```tsx
import { VisuallyHidden } from '@/components/a11y';

function IconButton() {
  return (
    <button>
      <Icon />
      <VisuallyHidden>Close dialog</VisuallyHidden>
    </button>
  );
}
```

### Focus Trap for Modals

```tsx
import { FocusTrap } from '@/components/a11y';

function Modal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <FocusTrap>
      <div role="dialog" aria-modal="true">
        <button onClick={onClose}>Close</button>
        {/* Modal content */}
      </div>
    </FocusTrap>
  );
}
```

### Live Region for Dynamic Updates

```tsx
import { LiveRegion, useLiveRegion } from '@/components/a11y';

function DataList() {
  const { message, announce } = useLiveRegion();

  useEffect(() => {
    announce(`Loaded ${items.length} items`);
  }, [items, announce]);

  return (
    <>
      <LiveRegion message={message} priority="polite" />
      {/* Your content */}
    </>
  );
}
```

## Screen Reader Announcements

```tsx
import { announce, announcePolite, announceAssertive } from '@/lib/a11y';

// Polite announcement (waits for current speech to finish)
announcePolite('Items loaded successfully');

// Assertive announcement (interrupts current speech)
announceAssertive('Error: Failed to save');

// Navigation announcements
import { announceNavigation } from '@/lib/a11y';
announceNavigation('Episodes');

// Loading states
import { announceLoading, announceLoaded } from '@/lib/a11y';
announceLoading('episodes');
// ... after loading
announceLoaded('Episodes');
```

## ARIA Utilities

```tsx
import {
  ariaLabel,
  ariaDialog,
  ariaButton,
  ariaTabList,
  ariaTab,
  ariaTabPanel
} from '@/lib/a11y';

// Dialog
<div {...ariaDialog('dialog-title', 'dialog-description')}>
  <h2 id="dialog-title">Title</h2>
  <p id="dialog-description">Description</p>
</div>

// Button
<div {...ariaButton(false, true)}>Toggle Menu</div>

// Tabs
<div {...ariaTabList('tabs-label')}>
  <button {...ariaTab(isSelected, 'panel-1')}>Tab 1</button>
</div>
<div {...ariaTabPanel('tab-1')}>Panel content</div>
```

## Focus Management

```tsx
import {
  getFocusableElements,
  focusFirst,
  focusLast,
  storeFocus,
  restoreFocus,
  FocusLock
} from '@/lib/a11y';

// Store and restore focus
function Modal({ onOpen, onClose }) {
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const handleOpen = () => {
    previousFocusRef.current = storeFocus();
    onOpen();
  };

  const handleClose = () => {
    onClose();
    restoreFocus(previousFocusRef.current);
  };

  return <div>...</div>;
}

// Focus lock
const lock = new FocusLock(modalElement);
lock.activate();
// ... later
lock.deactivate();
```

## Best Practices

### 1. Semantic HTML
Always use semantic HTML elements:
- `<button>` for buttons
- `<a>` for links
- `<nav>` for navigation
- `<main>` for main content
- `<header>` and `<footer>` appropriately

### 2. ARIA Labels
All interactive elements must have accessible labels:

```tsx
// Good
<button aria-label="Close dialog">
  <XIcon />
</button>

// Bad
<button>
  <XIcon />
</button>
```

### 3. Keyboard Navigation
All features must be accessible via keyboard:
- Tab order is logical
- Focus indicators are visible
- Escape closes modals/menus
- Enter/Space activates buttons

### 4. Color Contrast
Ensure sufficient color contrast:
- Normal text: 4.5:1
- Large text: 3:1
- UI components: 3:1

### 5. Form Labels
All form inputs must have associated labels:

```tsx
// Good
<label htmlFor="email">Email</label>
<input id="email" type="email" />

// Also good
<label>
  Email
  <input type="email" />
</label>
```

### 6. Error Messages
Associate error messages with inputs:

```tsx
<label htmlFor="email">Email</label>
<input
  id="email"
  type="email"
  aria-invalid={hasError}
  aria-describedby={hasError ? 'email-error' : undefined}
/>
{hasError && <div id="email-error" role="alert">Invalid email</div>}
```

## Testing

### Manual Testing
1. Test with keyboard only (no mouse)
2. Test with screen reader (NVDA, JAWS, VoiceOver)
3. Test with browser zoom (200%, 400%)
4. Test with high contrast mode
5. Test with reduced motion enabled

### Automated Testing
Run Lighthouse accessibility audit:
```bash
npm run lighthouse
```

Target score: > 90

### Screen Reader Testing
- **Windows**: NVDA (free)
- **macOS**: VoiceOver (built-in)
- **Linux**: Orca (built-in)

### Keyboard Testing Checklist
- [ ] All features accessible via keyboard
- [ ] Tab order is logical
- [ ] Focus indicators visible
- [ ] Escape closes modals
- [ ] Arrow keys work in lists
- [ ] Shortcuts work as expected
- [ ] No keyboard traps

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Resources](https://webaim.org/resources/)
- [A11y Project Checklist](https://www.a11yproject.com/checklist/)
