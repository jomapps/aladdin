# Orchestrator UI Layout - Master Plan

**Version**: 1.0.0  
**Date**: 2025-10-01  
**Status**: 📋 Planning Phase  
**Estimated Duration**: 3-4 weeks

---

## Overview

A comprehensive UI layout for the Aladdin movie production platform featuring:
- **Top Menu Bar** - Project name and global navigation
- **Left Sidebar** - Action options and navigation
- **Main Content Area** - Dynamic content display
- **Right Orchestrator Sidebar** - AI agent chat interface with 4 modes

---

## Layout Structure

```
┌─────────────────────────────────────────────────────────────────┐
│  TOP MENU BAR (Project Name, User, Settings)                   │
├──────────┬──────────────────────────────────┬──────────────────┤
│          │                                  │                  │
│  LEFT    │                                  │   RIGHT          │
│  SIDEBAR │      MAIN CONTENT AREA           │   ORCHESTRATOR   │
│          │                                  │   SIDEBAR        │
│  Actions │      Dynamic Content             │   Chat Interface │
│  Nav     │      (Episodes, Scenes, etc)     │   4 Modes:       │
│  Quick   │                                  │   - Query        │
│  Access  │                                  │   - Data Ingest  │
│          │                                  │   - Task Exec    │
│          │                                  │   - General Chat │
│          │                                  │                  │
│  (240px) │         (flexible)               │   (400px)        │
└──────────┴──────────────────────────────────┴──────────────────┘
```

---

## Component Breakdown

### 1. Top Menu Bar (Fixed)

**Height**: 64px  
**Position**: Fixed top  
**Z-index**: 50

**Components**:
- **Left Section**:
  - App logo/icon
  - Project name (dynamic)
  - Project selector dropdown
  
- **Center Section**:
  - Breadcrumb navigation
  - Current view indicator
  
- **Right Section**:
  - Search (global)
  - Notifications bell
  - User avatar + dropdown
  - Settings icon

**Features**:
- Sticky on scroll
- Project context always visible
- Quick project switching
- Global search

---

### 2. Left Sidebar (Collapsible)

**Width**: 240px (expanded), 64px (collapsed)  
**Position**: Fixed left  
**Z-index**: 40

**Sections**:

#### A. Primary Navigation
- 📊 Dashboard
- 📝 Episodes
- 🎭 Characters
- 🎬 Scenes
- 📍 Locations
- 💬 Dialogue
- 🎨 Concepts

#### B. Quick Actions
- ➕ New Episode
- ➕ New Character
- ➕ New Scene
- 📤 Export Project
- 🔄 Sync Brain

#### C. Recent Items
- Last 5 edited items
- Quick access links

#### D. Project Tools
- 📊 Analytics
- 🔍 Search
- 📋 Tasks
- 🎯 Goals

**Features**:
- Collapsible (hamburger icon)
- Active state highlighting
- Keyboard shortcuts (Cmd+K)
- Drag-to-reorder favorites

---

### 3. Main Content Area (Flexible)

**Width**: Flexible (fills remaining space)  
**Position**: Relative  
**Padding**: 24px

**Content Types**:
- **Dashboard View**: Project overview, stats, recent activity
- **List Views**: Episodes, characters, scenes (table/grid)
- **Detail Views**: Individual item editing
- **Form Views**: Create/edit forms
- **Visualization Views**: Timeline, relationship graphs

**Features**:
- Responsive layout
- Infinite scroll for lists
- Optimistic updates
- Loading states
- Error boundaries

---

### 4. Right Orchestrator Sidebar (Collapsible)

**Width**: 400px (expanded), 0px (collapsed)  
**Position**: Fixed right  
**Z-index**: 40

**Structure**:

#### A. Header (60px)
- **Mode Selector** (4 tabs):
  - 🔍 Query Mode
  - 📥 Data Mode
  - ⚡ Task Mode
  - 💬 Chat Mode
- Collapse button
- Clear conversation

#### B. Chat Area (flexible height)
- Message list (scrollable)
- Agent typing indicator
- Streaming responses
- Code blocks with syntax highlighting
- File attachments preview

#### C. Input Area (120px)
- Multi-line text input
- Send button
- Attachment button
- Voice input (optional)
- Keyboard shortcuts (Enter to send, Shift+Enter for newline)

**Features**:
- Real-time streaming
- Message history
- Context awareness
- Mode-specific UI
- Collapsible to maximize content area

---

## Orchestrator Modes

### Mode 1: Query Mode 🔍

**Purpose**: Ask questions about the project

**Features**:
- Natural language queries
- Brain service integration
- Search across all entities
- Relationship exploration
- Context-aware responses

**Example Queries**:
```
"Show me all scenes where Aladdin appears"
"What's the character arc for Jasmine?"
"Find plot holes in Act 2"
"Which locations are used most frequently?"
```

**UI Elements**:
- Query suggestions
- Filter chips
- Result previews
- Quick actions (open, edit, view)

---

### Mode 2: Data Ingestion Mode 📥

**Purpose**: Accept and correctly place data/information

**Features**:
- Intelligent data parsing
- Auto-categorization
- Duplicate detection
- Validation
- Confirmation before save

**Example Inputs**:
```
"Add a new character: Jafar, the evil vizier..."
"Update scene 5: change location to palace throne room"
"Import these dialogue lines: [paste]"
```

**UI Elements**:
- Data preview
- Field mapping
- Validation errors
- Confirm/Cancel buttons
- Undo option

---

### Mode 3: Task Execution Mode ⚡

**Purpose**: Execute project-related tasks

**Features**:
- Task decomposition
- Progress tracking
- Multi-step workflows
- Department coordination
- Quality validation

**Example Tasks**:
```
"Generate 5 scene variations for the opening"
"Create character profiles for all supporting cast"
"Analyze dialogue consistency across episodes"
"Export project to screenplay format"
```

**UI Elements**:
- Task progress bar
- Step-by-step breakdown
- Department status indicators
- Quality scores
- Result preview

---

### Mode 4: General Chat Mode 💬

**Purpose**: General LLM chat (not project-specific)

**Features**:
- Standard LLM conversation
- No project context
- General knowledge
- Code assistance
- Creative brainstorming

**Example Queries**:
```
"Explain the hero's journey structure"
"What are best practices for screenplay formatting?"
"Help me brainstorm plot twists"
"Write a Python script to parse dialogue"
```

**UI Elements**:
- Standard chat interface
- No project context indicator
- Code blocks
- Markdown rendering
- Copy buttons

---

## Technical Architecture

### State Management

```typescript
// Global state structure
interface AppState {
  // Layout state
  layout: {
    leftSidebarOpen: boolean
    rightSidebarOpen: boolean
    currentView: string
  }
  
  // Project state
  project: {
    id: string
    name: string
    slug: string
    context: ProjectContext
  }
  
  // Orchestrator state
  orchestrator: {
    mode: 'query' | 'data' | 'task' | 'chat'
    conversationId: string
    messages: Message[]
    isStreaming: boolean
    currentTask?: Task
  }
  
  // User state
  user: {
    id: string
    name: string
    preferences: UserPreferences
  }
}
```

### Component Structure

```
src/components/layout/
├── TopMenuBar/
│   ├── index.tsx
│   ├── ProjectSelector.tsx
│   ├── Breadcrumbs.tsx
│   ├── GlobalSearch.tsx
│   ├── Notifications.tsx
│   └── UserMenu.tsx
│
├── LeftSidebar/
│   ├── index.tsx
│   ├── Navigation.tsx
│   ├── QuickActions.tsx
│   ├── RecentItems.tsx
│   └── ProjectTools.tsx
│
├── MainContent/
│   ├── index.tsx
│   ├── DashboardView.tsx
│   ├── ListView.tsx
│   ├── DetailView.tsx
│   └── FormView.tsx
│
└── RightOrchestrator/
    ├── index.tsx
    ├── ModeSelector.tsx
    ├── ChatArea.tsx
    ├── MessageList.tsx
    ├── MessageInput.tsx
    ├── modes/
    │   ├── QueryMode.tsx
    │   ├── DataMode.tsx
    │   ├── TaskMode.tsx
    │   └── ChatMode.tsx
    └── components/
        ├── StreamingMessage.tsx
        ├── CodeBlock.tsx
        ├── TaskProgress.tsx
        └── DataPreview.tsx
```

---

## Responsive Design

### Desktop (>1280px)
- All sidebars visible
- Full layout as designed
- Optimal experience

### Tablet (768px - 1280px)
- Left sidebar collapsible
- Right sidebar overlay
- Content area flexible

### Mobile (<768px)
- Both sidebars as overlays
- Bottom navigation bar
- Orchestrator as modal
- Simplified top bar

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + K` | Open command palette |
| `Cmd/Ctrl + B` | Toggle left sidebar |
| `Cmd/Ctrl + /` | Toggle orchestrator |
| `Cmd/Ctrl + 1-4` | Switch orchestrator mode |
| `Cmd/Ctrl + N` | New item (context-aware) |
| `Cmd/Ctrl + S` | Save current item |
| `Cmd/Ctrl + F` | Focus search |
| `Esc` | Close modals/overlays |

---

## Implementation Phases

### Phase 1: Layout Foundation (Week 1)
- [ ] Create layout components
- [ ] Implement responsive grid
- [ ] Add sidebar collapse/expand
- [ ] Setup routing structure
- [ ] Basic styling with Tailwind

### Phase 2: Orchestrator Integration (Week 2)
- [ ] Build chat interface
- [ ] Implement 4 modes
- [ ] Add streaming support
- [ ] Integrate with orchestrator API
- [ ] Message history

### Phase 3: State Management (Week 3)
- [ ] Setup Zustand/Redux
- [ ] Implement WebSocket connections
- [ ] Add real-time updates
- [ ] Context management
- [ ] Optimistic updates

### Phase 4: Polish & Testing (Week 4)
- [ ] Add animations
- [ ] Implement keyboard shortcuts
- [ ] Responsive design refinement
- [ ] Accessibility (ARIA labels)
- [ ] Unit & integration tests
- [ ] Performance optimization

---

## Dependencies

**UI Components**:
- `shadcn/ui` - Base components
- `@kokonutui` - Animated components
- `lucide-react` - Icons
- `tailwindcss` - Styling

**State Management**:
- `zustand` - Global state
- `react-query` - Server state

**Real-time**:
- `socket.io-client` - WebSocket
- `eventsource` - SSE

**Utilities**:
- `date-fns` - Date formatting
- `react-markdown` - Markdown rendering
- `prism-react-renderer` - Code highlighting

---

## Success Criteria

- ✅ All 4 layout sections functional
- ✅ Orchestrator modes working
- ✅ Real-time streaming operational
- ✅ Responsive on all devices
- ✅ Keyboard shortcuts implemented
- ✅ Performance <100ms interaction
- ✅ Accessibility score >90
- ✅ User testing positive feedback

---

**Next Steps**: Review plan → Create detailed phase documents → Begin implementation

