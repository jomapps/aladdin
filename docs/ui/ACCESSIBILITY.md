# Accessibility Guide

## Table of Contents

- [Overview](#overview)
- [WCAG Compliance](#wcag-compliance)
- [Semantic HTML](#semantic-html)
- [Keyboard Navigation](#keyboard-navigation)
- [Screen Reader Support](#screen-reader-support)
- [Color and Contrast](#color-and-contrast)
- [Focus Management](#focus-management)
- [ARIA Attributes](#aria-attributes)
- [Testing Accessibility](#testing-accessibility)
- [Common Issues](#common-issues)

## Overview

Aladdin is committed to WCAG 2.1 Level AA compliance, ensuring the application is usable by everyone, including people with disabilities.

### Accessibility Standards

- **WCAG 2.1 Level AA**: Target compliance level
- **Keyboard Navigation**: Full keyboard support
- **Screen Reader**: Compatible with NVDA, JAWS, VoiceOver
- **Color Contrast**: Minimum 4.5:1 for text
- **Focus Indicators**: Clear visual focus states

## WCAG Compliance

### Four Principles (POUR)

#### 1. Perceivable

Information must be presentable to users in ways they can perceive.

```typescript
// ✅ Good - Alternative text for images
<img src="/agent-icon.png" alt="Research Agent icon" />

// ✅ Good - Text alternatives for icons
<button aria-label="Close dialog">
  <X className="h-4 w-4" aria-hidden="true" />
</button>

// ❌ Bad - No alternative text
<img src="/agent-icon.png" />
<button><X className="h-4 w-4" /></button>
```

#### 2. Operable

Interface components must be operable.

```typescript
// ✅ Good - Keyboard accessible
<button
  onClick={handleClick}
  onKeyDown={(e) => e.key === 'Enter' && handleClick()}
>
  Submit
</button>

// ❌ Bad - Mouse only
<div onClick={handleClick}>Submit</div>
```

#### 3. Understandable

Information and operation must be understandable.

```typescript
// ✅ Good - Clear error messages
{error && (
  <p role="alert" className="text-red-600">
    Email is required. Please enter a valid email address.
  </p>
)}

// ❌ Bad - Vague error
{error && <p>Error</p>}
```

#### 4. Robust

Content must be robust enough to work with assistive technologies.

```typescript
// ✅ Good - Semantic HTML
<nav aria-label="Main navigation">
  <ul>
    <li><a href="/dashboard">Dashboard</a></li>
    <li><a href="/agents">Agents</a></li>
  </ul>
</nav>

// ❌ Bad - Generic elements
<div className="nav">
  <div className="link" onClick={goToDashboard}>Dashboard</div>
</div>
```

## Semantic HTML

### Use Proper HTML Elements

```typescript
// ✅ Good - Semantic HTML
<header>
  <nav aria-label="Main navigation">
    <ul>
      <li><a href="/dashboard">Dashboard</a></li>
    </ul>
  </nav>
</header>

<main>
  <article>
    <h1>Agent Execution</h1>
    <section>
      <h2>Timeline</h2>
      <ul>...</ul>
    </section>
  </article>
</main>

<footer>
  <p>&copy; 2025 Aladdin</p>
</footer>

// ❌ Bad - All divs
<div className="header">
  <div className="nav">
    <div className="link">Dashboard</div>
  </div>
</div>
```

### Heading Hierarchy

```typescript
// ✅ Good - Logical hierarchy
<h1>Department Dashboard</h1>
  <section>
    <h2>Department Head</h2>
    <h3>Research Lead</h3>
  </section>
  <section>
    <h2>Specialist Agents</h2>
    <h3>Junior Researcher</h3>
  </section>

// ❌ Bad - Skipping levels
<h1>Department Dashboard</h1>
<h4>Research Lead</h4>
```

## Keyboard Navigation

### Tab Order

Ensure logical tab order through the page:

```typescript
function AgentForm() {
  return (
    <form>
      {/* Tab order: name → email → department → submit */}
      <input name="name" tabIndex={0} />
      <input name="email" tabIndex={0} />
      <select name="department" tabIndex={0} />
      <button type="submit" tabIndex={0}>Submit</button>

      {/* Hidden until needed */}
      <div hidden>
        <input tabIndex={-1} />
      </div>
    </form>
  )
}
```

### Keyboard Shortcuts

```typescript
function AgentStatusDashboard() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Space: Toggle auto-scroll
      if (e.key === ' ' && !e.shiftKey) {
        e.preventDefault()
        toggleAutoScroll()
      }

      // R: Refresh
      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault()
        refresh()
      }

      // Esc: Close modal
      if (e.key === 'Escape') {
        closeModal()
      }

      // Arrow keys: Navigate timeline
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        nextEvent()
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        previousEvent()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div>
      <div role="region" aria-label="Keyboard shortcuts">
        <kbd>Space</kbd> Toggle auto-scroll
        <kbd>R</kbd> Refresh
        <kbd>Esc</kbd> Close
        <kbd>↑/↓</kbd> Navigate
      </div>
    </div>
  )
}
```

### Focus Trap

Trap focus in modals:

```typescript
function Modal({ isOpen, onClose, children }) {
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return

    const focusableElements = modalRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )

    if (!focusableElements || focusableElements.length === 0) return

    const firstElement = focusableElements[0] as HTMLElement
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement.focus()
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement.focus()
        }
      }
    }

    firstElement.focus()
    document.addEventListener('keydown', handleTab)

    return () => document.removeEventListener('keydown', handleTab)
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <h2 id="modal-title">Modal Title</h2>
      {children}
      <button onClick={onClose}>Close</button>
    </div>
  )
}
```

## Screen Reader Support

### ARIA Live Regions

Announce dynamic content:

```typescript
function AgentStatus({ status }) {
  return (
    <div>
      {/* Announce status changes */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        Agent status: {status}
      </div>

      {/* Visual status */}
      <span className={statusClass}>{status}</span>
    </div>
  )
}

function ErrorAlert({ message }) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      className="bg-red-50 border border-red-200 p-4"
    >
      <AlertCircle aria-hidden="true" />
      <p>{message}</p>
    </div>
  )
}
```

### Screen Reader Only Text

```typescript
// Utility class in Tailwind
<span className="sr-only">
  Loading agent execution data
</span>

// CSS
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

### Descriptive Labels

```typescript
function AgentCard({ agent }) {
  return (
    <article
      aria-labelledby={`agent-${agent.id}-name`}
      aria-describedby={`agent-${agent.id}-status`}
    >
      <h3 id={`agent-${agent.id}-name`}>{agent.name}</h3>

      <p id={`agent-${agent.id}-status`}>
        Status: {agent.status}
      </p>

      <button aria-label={`View details for ${agent.name}`}>
        Details
      </button>
    </article>
  )
}
```

## Color and Contrast

### Contrast Ratios

- **Normal text**: 4.5:1 minimum
- **Large text** (18pt+): 3:1 minimum
- **UI components**: 3:1 minimum

```typescript
// ✅ Good - Sufficient contrast
<button className="bg-blue-600 text-white">
  Submit
</button>

<p className="text-gray-900">
  Main content text
</p>

// ❌ Bad - Insufficient contrast
<button className="bg-gray-200 text-gray-300">
  Submit
</button>
```

### Don't Rely on Color Alone

```typescript
// ✅ Good - Color + icon + text
<div>
  {status === 'success' && (
    <span className="text-green-600">
      <CheckCircle aria-hidden="true" />
      <span>Success</span>
    </span>
  )}
  {status === 'error' && (
    <span className="text-red-600">
      <XCircle aria-hidden="true" />
      <span>Error</span>
    </span>
  )}
</div>

// ❌ Bad - Color only
<div className={status === 'success' ? 'text-green-600' : 'text-red-600'}>
  Status
</div>
```

## Focus Management

### Visible Focus Indicators

```css
/* Always show focus for keyboard users */
*:focus-visible {
  outline: 2px solid #3B82F6;
  outline-offset: 2px;
}

/* Custom focus styles */
.button:focus-visible {
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.5);
}
```

```typescript
// Component with custom focus
<button
  className="
    focus:outline-none
    focus-visible:ring-2
    focus-visible:ring-blue-500
    focus-visible:ring-offset-2
  "
>
  Submit
</button>
```

### Focus Management Patterns

```typescript
// Restore focus after modal closes
function useRestoreFocus() {
  const previousActiveElement = useRef<HTMLElement | null>(null)

  const saveFocus = () => {
    previousActiveElement.current = document.activeElement as HTMLElement
  }

  const restoreFocus = () => {
    previousActiveElement.current?.focus()
  }

  return { saveFocus, restoreFocus }
}

function Modal({ isOpen, onClose }) {
  const { saveFocus, restoreFocus } = useRestoreFocus()

  useEffect(() => {
    if (isOpen) {
      saveFocus()
    } else {
      restoreFocus()
    }
  }, [isOpen])

  // ...
}
```

## ARIA Attributes

### Common ARIA Patterns

#### Accordion

```typescript
function Accordion({ items }) {
  const [expanded, setExpanded] = useState<string | null>(null)

  return (
    <div>
      {items.map((item) => (
        <div key={item.id}>
          <button
            aria-expanded={expanded === item.id}
            aria-controls={`panel-${item.id}`}
            id={`header-${item.id}`}
            onClick={() => setExpanded(expanded === item.id ? null : item.id)}
          >
            {item.title}
          </button>

          <div
            id={`panel-${item.id}`}
            role="region"
            aria-labelledby={`header-${item.id}`}
            hidden={expanded !== item.id}
          >
            {item.content}
          </div>
        </div>
      ))}
    </div>
  )
}
```

#### Tabs

```typescript
function Tabs({ tabs }) {
  const [activeTab, setActiveTab] = useState(0)

  return (
    <div>
      <div role="tablist" aria-label="Agent information">
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === index}
            aria-controls={`panel-${tab.id}`}
            id={`tab-${tab.id}`}
            tabIndex={activeTab === index ? 0 : -1}
            onClick={() => setActiveTab(index)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {tabs.map((tab, index) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`panel-${tab.id}`}
          aria-labelledby={`tab-${tab.id}`}
          hidden={activeTab !== index}
          tabIndex={0}
        >
          {tab.content}
        </div>
      ))}
    </div>
  )
}
```

#### Combobox

```typescript
function Combobox({ options, onSelect }) {
  const [isOpen, setIsOpen] = useState(false)
  const [selected, setSelected] = useState<number>(-1)

  return (
    <div>
      <input
        type="text"
        role="combobox"
        aria-expanded={isOpen}
        aria-autocomplete="list"
        aria-controls="listbox"
        aria-activedescendant={selected >= 0 ? `option-${selected}` : undefined}
      />

      <ul
        id="listbox"
        role="listbox"
        aria-label="Suggestions"
        hidden={!isOpen}
      >
        {options.map((option, index) => (
          <li
            key={option.id}
            id={`option-${index}`}
            role="option"
            aria-selected={selected === index}
            onClick={() => onSelect(option)}
          >
            {option.label}
          </li>
        ))}
      </ul>
    </div>
  )
}
```

## Testing Accessibility

### Automated Testing

```typescript
// tests/a11y/agent-card.test.tsx
import { render } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'

expect.extend(toHaveNoViolations)

describe('AgentCard Accessibility', () => {
  it('has no accessibility violations', async () => {
    const { container } = render(<AgentCard agent={mockAgent} />)

    const results = await axe(container)

    expect(results).toHaveNoViolations()
  })

  it('is keyboard navigable', () => {
    render(<AgentCard agent={mockAgent} />)

    const button = screen.getByRole('button', { name: /view details/i })

    button.focus()
    expect(button).toHaveFocus()

    fireEvent.keyDown(button, { key: 'Enter' })
    expect(onViewDetails).toHaveBeenCalled()
  })

  it('has proper ARIA labels', () => {
    render(<AgentCard agent={mockAgent} />)

    expect(screen.getByRole('article')).toHaveAttribute('aria-labelledby')
    expect(screen.getByRole('button')).toHaveAttribute('aria-label')
  })
})
```

### Manual Testing Checklist

- [ ] Navigate entire app with keyboard only
- [ ] Test with screen reader (NVDA, JAWS, VoiceOver)
- [ ] Check color contrast with browser tools
- [ ] Verify focus indicators are visible
- [ ] Test with browser zoom at 200%
- [ ] Verify all images have alt text
- [ ] Check ARIA attributes are correct
- [ ] Test forms with validation
- [ ] Verify error messages are announced
- [ ] Check modal focus trapping

## Common Issues

### Issue: Missing Alt Text

```typescript
// ❌ Problem
<img src="/agent-icon.png" />

// ✅ Solution
<img src="/agent-icon.png" alt="Research agent icon" />

// Decorative images
<img src="/decoration.png" alt="" aria-hidden="true" />
```

### Issue: Non-Semantic Buttons

```typescript
// ❌ Problem
<div onClick={handleClick}>Click me</div>

// ✅ Solution
<button onClick={handleClick}>Click me</button>
```

### Issue: Missing Form Labels

```typescript
// ❌ Problem
<input placeholder="Email" />

// ✅ Solution
<label htmlFor="email">Email</label>
<input id="email" name="email" />
```

### Issue: Insufficient Contrast

```typescript
// ❌ Problem
<p className="text-gray-400">Important text</p>

// ✅ Solution
<p className="text-gray-900">Important text</p>
```

### Issue: No Keyboard Access

```typescript
// ❌ Problem
<div onClick={handleClick}>Action</div>

// ✅ Solution
<button onClick={handleClick}>Action</button>
// or
<div
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => e.key === 'Enter' && handleClick()}
>
  Action
</div>
```

## Resources

### Tools

- **axe DevTools**: Browser extension for accessibility testing
- **WAVE**: Web accessibility evaluation tool
- **Lighthouse**: Built into Chrome DevTools
- **Screen Readers**: NVDA (Windows), JAWS (Windows), VoiceOver (Mac)

### Documentation

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)

## Next Steps

- Review [Developer Guide](/mnt/d/Projects/aladdin/docs/ui/DEVELOPER_GUIDE.md) for implementation
- Check [Testing Guide](/mnt/d/Projects/aladdin/docs/ui/TESTING_GUIDE.md) for testing patterns
- See [Examples](/mnt/d/Projects/aladdin/docs/ui/examples/) for accessible patterns
