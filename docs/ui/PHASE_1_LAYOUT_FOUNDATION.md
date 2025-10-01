# Phase 1: Layout Foundation - Detailed Plan

**Duration**: 1 week  
**Priority**: High  
**Status**: 📋 Ready to Start

---

## Overview

Build the foundational layout structure with all four main sections: top menu bar, left sidebar, main content area, and right orchestrator sidebar. Focus on responsive design, collapsible sidebars, and proper routing integration.

---

## Goals

1. ✅ Create responsive layout grid
2. ✅ Implement top menu bar with project context
3. ✅ Build collapsible left sidebar with navigation
4. ✅ Setup main content area with routing
5. ✅ Create collapsible right orchestrator sidebar
6. ✅ Add keyboard shortcuts for sidebar toggles
7. ✅ Ensure mobile responsiveness

---

## File Structure

```
src/
├── components/layout/
│   ├── AppLayout.tsx                 # Main layout wrapper
│   ├── TopMenuBar/
│   │   ├── index.tsx                 # Top menu component
│   │   ├── ProjectSelector.tsx       # Project dropdown
│   │   ├── Breadcrumbs.tsx          # Navigation breadcrumbs
│   │   ├── GlobalSearch.tsx         # Search input
│   │   ├── Notifications.tsx        # Notification bell
│   │   └── UserMenu.tsx             # User avatar + dropdown
│   ├── LeftSidebar/
│   │   ├── index.tsx                # Left sidebar component
│   │   ├── Navigation.tsx           # Main navigation links
│   │   ├── QuickActions.tsx         # Quick action buttons
│   │   ├── RecentItems.tsx          # Recent items list
│   │   └── ProjectTools.tsx         # Project tools section
│   ├── MainContent/
│   │   └── index.tsx                # Content area wrapper
│   └── RightOrchestrator/
│       ├── index.tsx                # Right sidebar shell
│       └── OrchestratorPlaceholder.tsx  # Placeholder for Phase 2
│
├── hooks/
│   ├── useLayout.ts                 # Layout state hook
│   └── useKeyboardShortcuts.ts      # Keyboard shortcuts hook
│
├── stores/
│   └── layoutStore.ts               # Zustand layout store
│
└── app/(frontend)/dashboard/project/[id]/
    └── layout.tsx                   # Project layout wrapper
```

---

## Implementation Details

### 1. Layout Store (Zustand)

```typescript
// src/stores/layoutStore.ts

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface LayoutState {
  // Sidebar states
  leftSidebarOpen: boolean
  rightSidebarOpen: boolean
  
  // View state
  currentView: string
  
  // Actions
  toggleLeftSidebar: () => void
  toggleRightSidebar: () => void
  setLeftSidebarOpen: (open: boolean) => void
  setRightSidebarOpen: (open: boolean) => void
  setCurrentView: (view: string) => void
}

export const useLayoutStore = create<LayoutState>()(
  persist(
    (set) => ({
      leftSidebarOpen: true,
      rightSidebarOpen: true,
      currentView: 'dashboard',
      
      toggleLeftSidebar: () =>
        set((state) => ({ leftSidebarOpen: !state.leftSidebarOpen })),
      
      toggleRightSidebar: () =>
        set((state) => ({ rightSidebarOpen: !state.rightSidebarOpen })),
      
      setLeftSidebarOpen: (open) =>
        set({ leftSidebarOpen: open }),
      
      setRightSidebarOpen: (open) =>
        set({ rightSidebarOpen: open }),
      
      setCurrentView: (view) =>
        set({ currentView: view }),
    }),
    {
      name: 'layout-storage',
    }
  )
)
```

### 2. Main Layout Component

```typescript
// src/components/layout/AppLayout.tsx

'use client'

import { useLayoutStore } from '@/stores/layoutStore'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import TopMenuBar from './TopMenuBar'
import LeftSidebar from './LeftSidebar'
import MainContent from './MainContent'
import RightOrchestrator from './RightOrchestrator'

interface AppLayoutProps {
  children: React.ReactNode
  projectId: string
  projectName: string
}

export default function AppLayout({ children, projectId, projectName }: AppLayoutProps) {
  const { leftSidebarOpen, rightSidebarOpen } = useLayoutStore()
  
  // Setup keyboard shortcuts
  useKeyboardShortcuts()
  
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Top Menu Bar - Fixed */}
      <TopMenuBar projectId={projectId} projectName={projectName} />
      
      {/* Main Layout Grid */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Collapsible */}
        <LeftSidebar
          isOpen={leftSidebarOpen}
          projectId={projectId}
        />
        
        {/* Main Content Area - Flexible */}
        <MainContent>
          {children}
        </MainContent>
        
        {/* Right Orchestrator Sidebar - Collapsible */}
        <RightOrchestrator
          isOpen={rightSidebarOpen}
          projectId={projectId}
        />
      </div>
    </div>
  )
}
```

### 3. Top Menu Bar

```typescript
// src/components/layout/TopMenuBar/index.tsx

'use client'

import { Menu, Search, Bell, Settings } from 'lucide-react'
import { useLayoutStore } from '@/stores/layoutStore'
import ProjectSelector from './ProjectSelector'
import Breadcrumbs from './Breadcrumbs'
import GlobalSearch from './GlobalSearch'
import Notifications from './Notifications'
import UserMenu from './UserMenu'

interface TopMenuBarProps {
  projectId: string
  projectName: string
}

export default function TopMenuBar({ projectId, projectName }: TopMenuBarProps) {
  const { toggleLeftSidebar } = useLayoutStore()
  
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center px-4 gap-4 sticky top-0 z-50">
      {/* Left Section */}
      <div className="flex items-center gap-4">
        {/* Hamburger Menu */}
        <button
          onClick={toggleLeftSidebar}
          className="p-2 hover:bg-gray-100 rounded-lg lg:hidden"
          aria-label="Toggle sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
        
        {/* App Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg" />
          <span className="font-bold text-xl hidden sm:inline">Aladdin</span>
        </div>
        
        {/* Project Selector */}
        <ProjectSelector projectId={projectId} projectName={projectName} />
      </div>
      
      {/* Center Section */}
      <div className="flex-1 flex items-center justify-center">
        <Breadcrumbs />
      </div>
      
      {/* Right Section */}
      <div className="flex items-center gap-2">
        <GlobalSearch />
        <Notifications />
        <UserMenu />
      </div>
    </header>
  )
}
```

### 4. Left Sidebar

```typescript
// src/components/layout/LeftSidebar/index.tsx

'use client'

import { useLayoutStore } from '@/stores/layoutStore'
import { X } from 'lucide-react'
import Navigation from './Navigation'
import QuickActions from './QuickActions'
import RecentItems from './RecentItems'
import ProjectTools from './ProjectTools'

interface LeftSidebarProps {
  isOpen: boolean
  projectId: string
}

export default function LeftSidebar({ isOpen, projectId }: LeftSidebarProps) {
  const { setLeftSidebarOpen } = useLayoutStore()
  
  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setLeftSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside
        className={`
          fixed lg:relative
          top-0 left-0 h-full
          w-64 bg-white border-r border-gray-200
          transform transition-transform duration-300 ease-in-out
          z-50 lg:z-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${!isOpen && 'lg:w-16'}
          overflow-y-auto
        `}
      >
        {/* Close button (mobile only) */}
        <div className="lg:hidden flex justify-end p-4">
          <button
            onClick={() => setLeftSidebarOpen(false)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Sidebar Content */}
        <div className="p-4 space-y-6">
          <Navigation projectId={projectId} collapsed={!isOpen} />
          <QuickActions projectId={projectId} collapsed={!isOpen} />
          <RecentItems projectId={projectId} collapsed={!isOpen} />
          <ProjectTools projectId={projectId} collapsed={!isOpen} />
        </div>
      </aside>
    </>
  )
}
```

### 5. Right Orchestrator Sidebar (Shell)

```typescript
// src/components/layout/RightOrchestrator/index.tsx

'use client'

import { useLayoutStore } from '@/stores/layoutStore'
import { X, MessageSquare } from 'lucide-react'
import OrchestratorPlaceholder from './OrchestratorPlaceholder'

interface RightOrchestratorProps {
  isOpen: boolean
  projectId: string
}

export default function RightOrchestrator({ isOpen, projectId }: RightOrchestratorProps) {
  const { setRightSidebarOpen } = useLayoutStore()
  
  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setRightSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside
        className={`
          fixed lg:relative
          top-0 right-0 h-full
          w-96 bg-white border-l border-gray-200
          transform transition-transform duration-300 ease-in-out
          z-50 lg:z-0
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
          overflow-hidden flex flex-col
        `}
      >
        {/* Header */}
        <div className="h-16 border-b border-gray-200 flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-purple-600" />
            <h2 className="font-semibold">Orchestrator</h2>
          </div>
          <button
            onClick={() => setRightSidebarOpen(false)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Content - Placeholder for Phase 2 */}
        <div className="flex-1 overflow-hidden">
          <OrchestratorPlaceholder />
        </div>
      </aside>
      
      {/* Floating toggle button (when closed) */}
      {!isOpen && (
        <button
          onClick={() => setRightSidebarOpen(true)}
          className="fixed bottom-4 right-4 p-4 bg-purple-600 text-white rounded-full shadow-lg hover:bg-purple-700 z-40"
        >
          <MessageSquare className="w-6 h-6" />
        </button>
      )}
    </>
  )
}
```

### 6. Keyboard Shortcuts Hook

```typescript
// src/hooks/useKeyboardShortcuts.ts

'use client'

import { useEffect } from 'react'
import { useLayoutStore } from '@/stores/layoutStore'

export function useKeyboardShortcuts() {
  const { toggleLeftSidebar, toggleRightSidebar } = useLayoutStore()
  
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
      const modifier = isMac ? e.metaKey : e.ctrlKey
      
      if (!modifier) return
      
      switch (e.key) {
        case 'b':
          e.preventDefault()
          toggleLeftSidebar()
          break
        case '/':
          e.preventDefault()
          toggleRightSidebar()
          break
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toggleLeftSidebar, toggleRightSidebar])
}
```

---

## Tasks Breakdown

### Day 1: Setup & Store
- [ ] Install dependencies (zustand, lucide-react)
- [ ] Create layout store with Zustand
- [ ] Setup file structure
- [ ] Create base layout component

### Day 2: Top Menu Bar
- [ ] Build TopMenuBar component
- [ ] Implement ProjectSelector
- [ ] Add Breadcrumbs
- [ ] Create GlobalSearch placeholder
- [ ] Add Notifications placeholder
- [ ] Build UserMenu

### Day 3: Left Sidebar
- [ ] Build LeftSidebar shell
- [ ] Create Navigation component
- [ ] Add QuickActions
- [ ] Implement RecentItems
- [ ] Add ProjectTools
- [ ] Add collapse/expand animation

### Day 4: Main Content & Right Sidebar
- [ ] Create MainContent wrapper
- [ ] Build RightOrchestrator shell
- [ ] Add OrchestratorPlaceholder
- [ ] Implement floating toggle button
- [ ] Add overlay for mobile

### Day 5: Integration & Polish
- [ ] Integrate with project layout
- [ ] Add keyboard shortcuts
- [ ] Test responsive design
- [ ] Fix mobile issues
- [ ] Add loading states
- [ ] Polish animations

---

## Dependencies

```json
{
  "dependencies": {
    "zustand": "^4.5.0",
    "lucide-react": "^0.344.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.1"
  }
}
```

---

## Testing Checklist

- [ ] Layout renders correctly
- [ ] Sidebars toggle on button click
- [ ] Keyboard shortcuts work (Cmd+B, Cmd+/)
- [ ] Mobile overlays function properly
- [ ] Responsive breakpoints work
- [ ] No layout shift on toggle
- [ ] Smooth animations
- [ ] Accessibility (keyboard navigation)

---

## Success Criteria

- ✅ All 4 layout sections visible
- ✅ Sidebars collapsible
- ✅ Responsive on mobile/tablet/desktop
- ✅ Keyboard shortcuts functional
- ✅ Smooth animations (<300ms)
- ✅ No console errors
- ✅ Passes accessibility audit

---

**Next**: Phase 2 - Orchestrator Integration

