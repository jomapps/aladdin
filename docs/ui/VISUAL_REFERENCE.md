# Orchestrator UI - Visual Reference Guide

**Version**: 1.0.0  
**Date**: 2025-10-01

---

## Layout Dimensions

```
Desktop (1920px width):
┌─────────────────────────────────────────────────────────────────┐
│  TOP MENU BAR - 64px height                                     │
├──────────┬──────────────────────────────────┬──────────────────┤
│          │                                  │                  │
│  LEFT    │      MAIN CONTENT                │   RIGHT          │
│  240px   │      1280px                      │   400px          │
│          │                                  │                  │
│  Fixed   │      Flexible                    │   Fixed          │
│  Width   │      (fills space)               │   Width          │
│          │                                  │                  │
└──────────┴──────────────────────────────────┴──────────────────┘

Tablet (1024px width):
┌─────────────────────────────────────────────────────────────────┐
│  TOP MENU BAR - 64px                                            │
├──────────┬──────────────────────────────────┬──────────────────┤
│  LEFT    │      MAIN CONTENT                │   RIGHT          │
│  64px    │      560px                       │   400px          │
│  (icons) │      (flexible)                  │   (overlay)      │
└──────────┴──────────────────────────────────┴──────────────────┘

Mobile (375px width):
┌─────────────────────────────────────────────┐
│  TOP MENU BAR - 56px                        │
├─────────────────────────────────────────────┤
│                                             │
│      MAIN CONTENT                           │
│      375px (full width)                     │
│                                             │
│  Sidebars as overlays                       │
│                                             │
└─────────────────────────────────────────────┘
```

---

## Color Palette

```css
/* Primary Colors */
--purple-600: #9333ea;  /* Primary brand color */
--purple-700: #7e22ce;  /* Hover states */
--purple-50: #faf5ff;   /* Light backgrounds */

/* Neutral Colors */
--gray-50: #f9fafb;     /* Page background */
--gray-100: #f3f4f6;    /* Card backgrounds */
--gray-200: #e5e7eb;    /* Borders */
--gray-600: #4b5563;    /* Secondary text */
--gray-900: #111827;    /* Primary text */

/* Semantic Colors */
--green-600: #16a34a;   /* Success */
--red-600: #dc2626;     /* Error */
--yellow-600: #ca8a04;  /* Warning */
--blue-600: #2563eb;    /* Info */
```

---

## Typography

```css
/* Font Family */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

/* Font Sizes */
--text-xs: 0.75rem;     /* 12px - Labels, captions */
--text-sm: 0.875rem;    /* 14px - Body text */
--text-base: 1rem;      /* 16px - Default */
--text-lg: 1.125rem;    /* 18px - Subheadings */
--text-xl: 1.25rem;     /* 20px - Headings */
--text-2xl: 1.5rem;     /* 24px - Page titles */

/* Font Weights */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

---

## Component Spacing

```css
/* Padding */
--p-1: 0.25rem;   /* 4px */
--p-2: 0.5rem;    /* 8px */
--p-3: 0.75rem;   /* 12px */
--p-4: 1rem;      /* 16px */
--p-6: 1.5rem;    /* 24px */
--p-8: 2rem;      /* 32px */

/* Gaps */
--gap-2: 0.5rem;  /* 8px */
--gap-4: 1rem;    /* 16px */
--gap-6: 1.5rem;  /* 24px */
```

---

## Top Menu Bar Details

```
┌─────────────────────────────────────────────────────────────────┐
│  [☰] [Logo] [Project ▼]  |  [Breadcrumbs]  |  [🔍] [🔔] [👤]  │
│   48   80     200              flexible         120              │
└─────────────────────────────────────────────────────────────────┘

Components:
- Hamburger Menu (mobile only): 48px
- Logo + App Name: 80px
- Project Selector: 200px
- Breadcrumbs: flexible
- Search Icon: 40px
- Notifications: 40px
- User Avatar: 40px

Height: 64px
Background: white
Border: 1px solid gray-200
```

---

## Left Sidebar Details

```
Expanded (240px):
┌──────────────────────┐
│  [Project Name]      │  60px header
├──────────────────────┤
│  📊 Dashboard        │
│  📝 Episodes         │  Navigation
│  🎭 Characters       │  (40px each)
│  🎬 Scenes           │
│  📍 Locations        │
├──────────────────────┤
│  ➕ Quick Actions    │  Quick Actions
│  ➕ New Episode      │  (36px each)
│  ➕ New Character    │
├──────────────────────┤
│  📋 Recent Items     │  Recent
│  - Scene 5           │  (32px each)
│  - Character: Jafar  │
├──────────────────────┤
│  🔍 Search           │  Tools
│  📊 Analytics        │  (36px each)
└──────────────────────┘

Collapsed (64px):
┌────┐
│ 📊 │  Icons only
│ 📝 │  (40px each)
│ 🎭 │
│ 🎬 │
│ 📍 │
├────┤
│ ➕ │
│ ➕ │
├────┤
│ 📋 │
├────┤
│ 🔍 │
└────┘
```

---

## Right Orchestrator Sidebar Details

```
┌──────────────────────────────────────┐
│  [🔍 Query] [📥 Data] [⚡ Task] [💬]  │  60px mode selector
├──────────────────────────────────────┤
│                                      │
│  Message List                        │
│  (scrollable)                        │
│                                      │
│  [User Message]                      │  User: bg-purple-50
│                                      │
│  [Assistant Response]                │  Assistant: bg-gray-50
│                                      │
│  [Streaming...]                      │  Streaming: animated
│                                      │
│                                      │
│  (flexible height)                   │
│                                      │
├──────────────────────────────────────┤
│  [📎] [Text Input Area...] [Send ➤]  │  120px input area
└──────────────────────────────────────┘

Width: 400px
Background: white
Border: 1px solid gray-200 (left side)
```

---

## Mode Selector Tabs

```
┌─────────┬─────────┬─────────┬─────────┐
│  🔍     │  📥     │  ⚡     │  💬     │
│  Query  │  Data   │  Task   │  Chat   │
└─────────┴─────────┴─────────┴─────────┘

Each tab: 100px width (25% of 400px)
Height: 60px
Active: border-bottom: 2px solid purple-600
Inactive: border-bottom: 2px solid transparent
Hover: background: gray-50
```

---

## Message Bubble Styles

```css
/* User Message */
.message-user {
  background: #faf5ff;        /* purple-50 */
  border-left: 3px solid #9333ea;  /* purple-600 */
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 12px;
}

/* Assistant Message */
.message-assistant {
  background: #f9fafb;        /* gray-50 */
  border-left: 3px solid #6b7280;  /* gray-500 */
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 12px;
}

/* System Message */
.message-system {
  background: #eff6ff;        /* blue-50 */
  border-left: 3px solid #2563eb;  /* blue-600 */
  padding: 8px 12px;
  border-radius: 6px;
  margin-bottom: 8px;
  font-size: 0.875rem;
  color: #1e40af;             /* blue-800 */
}
```

---

## Animation Timings

```css
/* Sidebar Toggle */
transition: transform 300ms cubic-bezier(0.4, 0, 0.2, 1);

/* Mode Switch */
transition: all 200ms ease-in-out;

/* Message Appear */
animation: slideUp 300ms cubic-bezier(0.4, 0, 0.2, 1);

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Streaming Dots */
animation: pulse 1.5s ease-in-out infinite;

@keyframes pulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
}
```

---

## Breakpoints

```css
/* Mobile */
@media (max-width: 767px) {
  /* Both sidebars as overlays */
  /* Bottom navigation */
  /* Simplified top bar */
}

/* Tablet */
@media (min-width: 768px) and (max-width: 1279px) {
  /* Left sidebar collapsible */
  /* Right sidebar overlay */
}

/* Desktop */
@media (min-width: 1280px) {
  /* All sidebars visible */
  /* Full layout */
}

/* Large Desktop */
@media (min-width: 1920px) {
  /* Max content width: 1920px */
  /* Centered layout */
}
```

---

## Z-Index Layers

```css
/* Layer Stack */
--z-base: 0;              /* Base content */
--z-dropdown: 10;         /* Dropdowns */
--z-sticky: 20;           /* Sticky headers */
--z-sidebar: 40;          /* Sidebars */
--z-overlay: 45;          /* Sidebar overlays */
--z-menu-bar: 50;         /* Top menu bar (TopMenuBar) */
--z-modal: 50;            /* Modals */
--z-ai-assistant: 60;     /* AI Assistant (RightOrchestrator) - Above menu bar */
--z-popover: 60;          /* Popovers */
--z-toast: 70;            /* Toast notifications */
--z-tooltip: 80;          /* Tooltips */
```

**Note**: The AI Assistant (RightOrchestrator) uses `z-[60]` to appear above the top menu bar (`z-50`), ensuring it overlays the entire interface when open.

---

## Icon Sizes

```css
/* Icon Sizes */
--icon-xs: 16px;   /* Small icons */
--icon-sm: 20px;   /* Default icons */
--icon-md: 24px;   /* Medium icons */
--icon-lg: 32px;   /* Large icons */
--icon-xl: 48px;   /* Extra large icons */

/* Usage */
.nav-icon { width: 20px; height: 20px; }
.mode-icon { width: 24px; height: 24px; }
.avatar { width: 32px; height: 32px; }
```

---

## Shadow Styles

```css
/* Shadows */
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1);

/* Usage */
.card { box-shadow: var(--shadow-md); }
.modal { box-shadow: var(--shadow-xl); }
.dropdown { box-shadow: var(--shadow-lg); }
```

---

## Border Radius

```css
/* Border Radius */
--rounded-sm: 0.25rem;   /* 4px */
--rounded-md: 0.375rem;  /* 6px */
--rounded-lg: 0.5rem;    /* 8px */
--rounded-xl: 0.75rem;   /* 12px */
--rounded-full: 9999px;  /* Fully rounded */

/* Usage */
.button { border-radius: var(--rounded-lg); }
.card { border-radius: var(--rounded-xl); }
.avatar { border-radius: var(--rounded-full); }
```

---

## Loading States

```css
/* Skeleton Loader */
.skeleton {
  background: linear-gradient(
    90deg,
    #f3f4f6 0%,
    #e5e7eb 50%,
    #f3f4f6 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

/* Spinner */
.spinner {
  border: 2px solid #f3f4f6;
  border-top-color: #9333ea;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

---

## Accessibility

```css
/* Focus Styles */
*:focus-visible {
  outline: 2px solid #9333ea;
  outline-offset: 2px;
}

/* Screen Reader Only */
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

/* Skip to Content */
.skip-to-content {
  position: absolute;
  top: -40px;
  left: 0;
  background: #9333ea;
  color: white;
  padding: 8px;
  z-index: 100;
}

.skip-to-content:focus {
  top: 0;
}
```

---

## Quick Reference

### Component Heights
- Top Menu Bar: 64px
- Mode Selector: 60px
- Nav Item: 40px
- Quick Action: 36px
- Recent Item: 32px
- Message Input: 120px

### Component Widths
- Left Sidebar (expanded): 240px
- Left Sidebar (collapsed): 64px
- Right Orchestrator: 400px
- Main Content: flexible

### Common Paddings
- Page padding: 24px (p-6)
- Card padding: 16px (p-4)
- Button padding: 8px 16px (py-2 px-4)
- Input padding: 12px 16px (py-3 px-4)

---

**Use this guide as a reference during implementation to ensure visual consistency!**

