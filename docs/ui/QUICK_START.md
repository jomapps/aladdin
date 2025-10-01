# Orchestrator UI - Quick Start Guide

**For Developers** | **Last Updated**: 2025-10-01

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- pnpm package manager
- Git

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd aladdin

# Install dependencies
pnpm install

# Setup environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Run development server
pnpm dev
```

The application will be available at `http://localhost:3000`

---

## 📁 Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── (dashboard)/             # Dashboard routes
│   │   ├── layout.tsx           # Dashboard layout with AppLayout
│   │   └── page.tsx             # Dashboard home
│   └── api/                     # API routes
│       └── orchestrator/        # Orchestrator API endpoints
│
├── components/
│   ├── layout/                  # Layout components
│   │   ├── AppLayout.tsx        # Main layout orchestrator
│   │   ├── TopMenuBar/          # Top menu components
│   │   ├── LeftSidebar/         # Left sidebar components
│   │   ├── MainContent/         # Content wrapper
│   │   └── RightOrchestrator/   # Orchestrator components
│   ├── ui/                      # shadcn/ui components
│   ├── ErrorBoundary.tsx        # Error boundary
│   ├── Skeleton.tsx             # Loading skeletons
│   └── KeyboardShortcutsModal.tsx
│
├── stores/
│   ├── layoutStore.ts           # Layout state (Zustand)
│   └── orchestratorStore.ts     # Orchestrator state (Zustand)
│
├── hooks/
│   ├── orchestrator/            # Orchestrator hooks
│   ├── useKeyboardShortcut.ts   # Keyboard shortcuts
│   └── useGlobalKeyboardShortcuts.ts
│
├── providers/
│   ├── AppProviders.tsx         # Root providers
│   ├── ProjectProvider.tsx      # Project context
│   └── WebSocketProvider.tsx    # WebSocket provider
│
└── lib/
    ├── react-query/             # React Query setup
    └── orchestrator-ui/         # Orchestrator utilities
```

---

## 🎨 Key Components

### AppLayout

The main layout component that orchestrates all sections:

```tsx
import AppLayout from '@/components/layout/AppLayout'

<AppLayout user={user}>
  {children}
</AppLayout>
```

### Orchestrator Modes

Four distinct modes for different interactions:

1. **Query Mode** 🔍 - Ask questions about the project
2. **Data Mode** 📥 - Add or update project data
3. **Task Mode** ⚡ - Execute project tasks
4. **Chat Mode** 💬 - General conversation

### State Management

```tsx
// Layout state
import { useLayoutStore } from '@/stores/layoutStore'

const {
  isLeftSidebarOpen,
  isRightOrchestratorOpen,
  orchestratorMode,
  toggleLeftSidebar,
  toggleRightOrchestrator,
  setOrchestratorMode,
} = useLayoutStore()

// Orchestrator state
import { useOrchestratorStore } from '@/stores/orchestratorStore'

const {
  messages,
  conversationId,
  isStreaming,
  addMessage,
  clearMessages,
} = useOrchestratorStore()
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd+B` | Toggle left sidebar |
| `Cmd+/` | Toggle orchestrator |
| `Cmd+1` | Switch to Query mode |
| `Cmd+2` | Switch to Data mode |
| `Cmd+3` | Switch to Task mode |
| `Cmd+4` | Switch to Chat mode |
| `Cmd+K` | Open command palette (coming soon) |
| `Cmd+H` | Show keyboard shortcuts |
| `Escape` | Close overlays |

---

## 🔌 API Integration

### Orchestrator API

```typescript
// Send a message
const response = await fetch('/api/orchestrator/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    content: 'Your message',
    mode: 'query',
    projectId: 'project-id',
    conversationId: 'conversation-id',
  }),
})

// Stream responses (SSE)
const eventSource = new EventSource(
  `/api/orchestrator/stream?conversationId=${conversationId}`
)

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data)
  // Handle streaming data
}
```

### React Query Hooks

```typescript
import { useProject, useEpisodes, useSendMessage } from '@/lib/react-query'

// Fetch project data
const { data: project, isLoading } = useProject(projectId)

// Fetch episodes
const { data: episodes } = useEpisodes(projectId)

// Send message mutation
const { mutate: sendMessage } = useSendMessage()
sendMessage({ content: 'Hello', mode: 'query' })
```

---

## 🧪 Testing

### Run Tests

```bash
# Unit tests
pnpm test

# E2E tests
pnpm test:e2e

# Coverage
pnpm test:coverage
```

### Writing Tests

```typescript
// Component test
import { render, screen } from '@testing-library/react'
import { TopMenuBar } from '@/components/layout/TopMenuBar'

test('renders project name', () => {
  render(<TopMenuBar user={mockUser} />)
  expect(screen.getByText('Project Name')).toBeInTheDocument()
})
```

---

## 🎯 Common Tasks

### Adding a New Component

1. Create component in appropriate directory
2. Export from index file if needed
3. Add to Storybook (optional)
4. Write tests

### Adding a New API Endpoint

1. Create route file in `src/app/api/`
2. Implement handler function
3. Add types in `types.ts`
4. Create React Query hook
5. Document in API reference

### Adding a New Orchestrator Mode

1. Create mode component in `src/components/layout/RightOrchestrator/modes/`
2. Add mode to `OrchestratorMode` type
3. Update `ModeSelector` component
4. Create mode-specific hook
5. Add API endpoint if needed

---

## 🐛 Debugging

### Enable Debug Logs

```typescript
// In your component
if (process.env.NODE_ENV === 'development') {
  console.log('Debug info:', data)
}
```

### React Query Devtools

The React Query devtools are automatically enabled in development mode. Open them with the floating button in the bottom-right corner.

### WebSocket Debugging

```typescript
// In browser console
localStorage.setItem('debug', 'socket.io-client:*')
```

---

## 📚 Additional Resources

- [Full Documentation](./README.md)
- [Technical Architecture](./TECHNICAL_ARCHITECTURE.md)
- [Implementation Status](./IMPLEMENTATION_STATUS.md)
- [API Reference](./API_REFERENCE.md)
- [Component Library](./COMPONENTS.md)

---

## 🆘 Getting Help

- Check the [Developer Guide](./DEVELOPER_GUIDE.md)
- Review [Implementation Summary](./IMPLEMENTATION_SUMMARY.md)
- Look at existing components for patterns
- Ask in team chat

---

## 🚀 Next Steps

1. Explore the codebase
2. Run the development server
3. Try the keyboard shortcuts
4. Test the orchestrator modes
5. Read the technical architecture
6. Start building!

---

**Happy coding!** 🎉

