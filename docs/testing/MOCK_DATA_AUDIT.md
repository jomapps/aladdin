# Mock Data & Missing Implementations Audit

**Date**: 2025-10-01  
**Status**: 🔍 Audit Complete  
**Priority**: 🔴 High - Remove before production

---

## 📋 Executive Summary

This document identifies all mock/hardcoded data and missing implementations in the UI components that need to be addressed before production deployment.

### Quick Stats
- **Mock Data Locations**: 5 files
- **Missing Implementations**: 8 functions
- **TODO Comments**: 6 items
- **Priority**: Remove all mock data except seed scripts

---

## 🎯 Mock Data Locations

### 1. LeftSidebar/RecentItems.tsx ⚠️ HIGH PRIORITY

**File**: `src/components/layout/LeftSidebar/RecentItems.tsx`

**Mock Data** (Lines 6-10):
```typescript
const recentItems = [
  { type: 'project', name: 'AI Movie Project', href: '/dashboard/project/1', time: '2 hours ago' },
  { type: 'document', name: 'Script Draft', href: '/dashboard/document/1', time: '5 hours ago' },
  { type: 'project', name: 'Commercial Video', href: '/dashboard/project/2', time: '1 day ago' },
]
```

**Action Required**:
- [ ] Replace with API call to fetch real recent items
- [ ] Use React Query hook: `useRecentItems()`
- [ ] Filter by user and timestamp
- [ ] Limit to last 5 items

**Suggested Implementation**:
```typescript
import { useRecentItems } from '@/hooks/queries/useRecentItems'

export default function RecentItems() {
  const { data: recentItems, isLoading } = useRecentItems({ limit: 5 })
  
  if (isLoading) return <Skeleton count={3} />
  if (!recentItems?.length) return <EmptyState />
  
  return (
    // ... render real data
  )
}
```

---

### 2. ProjectSidebar.tsx ⚠️ HIGH PRIORITY

**File**: `src/app/(frontend)/dashboard/project/[id]/components/ProjectSidebar.tsx`

**Mock Data** (Lines 51-54):
```typescript
const [recentActivity] = useState<ContentItem[]>([
  { id: '1', type: 'scene', name: 'Opening Scene', timestamp: new Date() },
  { id: '2', type: 'character', name: 'Main Character', timestamp: new Date() },
])
```

**Action Required**:
- [ ] Replace with API call to fetch project-specific recent activity
- [ ] Use React Query hook: `useProjectActivity(projectId)`
- [ ] Real-time updates via WebSocket
- [ ] Filter by project_id

**Suggested Implementation**:
```typescript
import { useProjectActivity } from '@/hooks/queries/useProjectActivity'

const { data: recentActivity, isLoading } = useProjectActivity(projectId, { limit: 10 })
```

---

### 3. QueryMode.tsx ℹ️ MEDIUM PRIORITY

**File**: `src/components/layout/RightOrchestrator/modes/QueryMode.tsx`

**Mock Data** (Lines 84-87):
```typescript
<SuggestionChip text="Show all scenes with Aladdin" />
<SuggestionChip text="What's Jasmine's character arc?" />
<SuggestionChip text="Find plot holes in Act 2" />
<SuggestionChip text="List all Agrabah locations" />
```

**Action Required**:
- [ ] Generate suggestions dynamically based on project content
- [ ] Use LLM to create context-aware suggestions
- [ ] Store popular queries in database
- [ ] Personalize based on user history

**Suggested Implementation**:
```typescript
import { useQuerySuggestions } from '@/hooks/queries/useQuerySuggestions'

const { data: suggestions } = useQuerySuggestions(projectId)

suggestions?.map((suggestion) => (
  <SuggestionChip 
    key={suggestion.id}
    text={suggestion.text}
    onClick={() => handleSuggestionClick(suggestion)}
  />
))
```

---

### 4. Test Helpers (KEEP - Test Only) ✅

**File**: `tests/ui/utils/test-helpers.ts`

**Status**: ✅ **KEEP** - These are test utilities only

Mock functions for testing:
- `createMockMessages()`
- `createMockTasks()`
- `createMockSearchResults()`
- `MockEventSource`
- `mockFetch()`

**No Action Required** - These are intentionally mock for testing purposes.

---

### 5. Seed Data (KEEP - Seed Only) ✅

**File**: `src/seed/custom-tools.seed.ts`

**Status**: ✅ **KEEP** - This is seed data for initial setup

**No Action Required** - Seed scripts are intentionally hardcoded for database initialization.

---

## 🔧 Missing Implementations

### 1. Keyboard Shortcuts ⚠️ HIGH PRIORITY

**File**: `src/hooks/useGlobalKeyboardShortcuts.ts`

**Missing Implementations** (Lines 76-99):
```typescript
case 'k':
  // TODO: Open command palette
  console.log('Command palette (Cmd+K) - to be implemented')
  break
case 'n':
  // TODO: New item (context-aware)
  console.log('New item (Cmd+N) - to be implemented')
  break
case 's':
  // TODO: Save current item
  console.log('Save (Cmd+S) - to be implemented')
  break
case 'f':
  // TODO: Focus search
  console.log('Focus search (Cmd+F) - to be implemented')
  break
case 'h':
  // TODO: Show keyboard shortcuts help
  console.log('Keyboard shortcuts help (Cmd+H) - to be implemented')
  break
```

**Action Required**:
- [ ] Implement command palette (Cmd+K)
- [ ] Implement context-aware new item (Cmd+N)
- [ ] Implement save functionality (Cmd+S)
- [ ] Implement focus search (Cmd+F)
- [ ] Implement shortcuts help modal (Cmd+H)

**Suggested Implementation**:
```typescript
case 'k':
  event.preventDefault()
  setCommandPaletteOpen(true)
  break
case 'n':
  event.preventDefault()
  handleNewItem() // Context-aware based on current route
  break
case 's':
  event.preventDefault()
  handleSave() // Save current form/document
  break
case 'f':
  event.preventDefault()
  searchInputRef.current?.focus()
  break
case 'h':
  event.preventDefault()
  setShortcutsModalOpen(true)
  break
```

---

### 2. Error Boundary Logging ℹ️ MEDIUM PRIORITY

**File**: `src/components/ErrorBoundary.tsx`

**Missing Implementation** (Line 57):
```typescript
// TODO: Log to error tracking service (e.g., Sentry)
```

**Action Required**:
- [ ] Integrate Sentry or similar error tracking
- [ ] Log errors with context (user, route, timestamp)
- [ ] Send error reports to monitoring service

**Suggested Implementation**:
```typescript
import * as Sentry from '@sentry/nextjs'

componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
  console.error('ErrorBoundary caught an error:', error, errorInfo)
  
  // Log to Sentry
  Sentry.captureException(error, {
    contexts: {
      react: {
        componentStack: errorInfo.componentStack,
      },
    },
  })
  
  this.setState({ error, errorInfo })
  
  if (this.props.onError) {
    this.props.onError(error, errorInfo)
  }
}
```

---

### 3. Brain Service Delete ℹ️ MEDIUM PRIORITY

**File**: `src/lib/agents/data-preparation/payload-hooks.ts`

**Missing Implementation** (Line 117):
```typescript
// TODO: Implement brain service delete
console.log(`[DataPrepHook] Deleted ${collectionSlug}:${doc.id} from brain`)
```

**Action Required**:
- [ ] Implement brain service delete API call
- [ ] Remove entity from Neo4j graph
- [ ] Clean up relationships
- [ ] Update cache

**Suggested Implementation**:
```typescript
try {
  // Delete from brain service
  await brainService.deleteEntity({
    id: doc.id,
    type: collectionSlug,
    projectId: doc.project_id,
  })
  
  // Clear cache
  await cacheManager.clearPattern(`brain:${collectionSlug}:${doc.id}`)
  
  console.log(`[DataPrepHook] Deleted ${collectionSlug}:${doc.id} from brain`)
} catch (error) {
  console.error(`[DataPrepHook] Error deleting ${collectionSlug}:${doc.id}:`, error)
}
```

---

### 4. SuggestionChip onClick Handlers ℹ️ LOW PRIORITY

**File**: `src/components/layout/RightOrchestrator/modes/QueryMode.tsx`

**Missing Implementation** (Lines 84-87):
```typescript
<SuggestionChip text="Show all scenes with Aladdin" />
// No onClick handler provided
```

**Action Required**:
- [ ] Add onClick handlers to suggestion chips
- [ ] Auto-fill message input with suggestion text
- [ ] Optionally auto-send the query

**Suggested Implementation**:
```typescript
const handleSuggestionClick = (text: string) => {
  setMessageInput(text)
  // Optionally auto-send
  // handleSendMessage(text)
}

<SuggestionChip 
  text="Show all scenes with Aladdin"
  onClick={() => handleSuggestionClick("Show all scenes with Aladdin")}
/>
```

---

## 📊 Summary Table

| Component | Type | Priority | Status | Action |
|-----------|------|----------|--------|--------|
| RecentItems.tsx | Mock Data | 🔴 High | ⏳ Pending | Replace with API |
| ProjectSidebar.tsx | Mock Data | 🔴 High | ⏳ Pending | Replace with API |
| QueryMode.tsx | Mock Data | 🟡 Medium | ⏳ Pending | Dynamic suggestions |
| useGlobalKeyboardShortcuts.ts | Missing Impl | 🔴 High | ⏳ Pending | Implement handlers |
| ErrorBoundary.tsx | Missing Impl | 🟡 Medium | ⏳ Pending | Add Sentry |
| payload-hooks.ts | Missing Impl | 🟡 Medium | ⏳ Pending | Brain delete API |
| QueryMode.tsx | Missing Impl | 🟢 Low | ⏳ Pending | onClick handlers |
| test-helpers.ts | Mock Data | ✅ Keep | ✅ Complete | Test utilities |
| custom-tools.seed.ts | Mock Data | ✅ Keep | ✅ Complete | Seed data |

---

## ✅ Action Plan

### Phase 1: Remove Critical Mock Data (Week 1)
1. [ ] Replace RecentItems mock data with API
2. [ ] Replace ProjectSidebar mock data with API
3. [ ] Implement keyboard shortcut handlers

### Phase 2: Implement Missing Features (Week 2)
4. [ ] Add Sentry error tracking
5. [ ] Implement brain service delete
6. [ ] Add dynamic query suggestions

### Phase 3: Polish & Testing (Week 3)
7. [ ] Add onClick handlers to suggestion chips
8. [ ] Test all implementations
9. [ ] Verify no console.log in production

---

## 🔍 How to Find More Mock Data

Run these commands to audit the codebase:

```bash
# Find TODO comments
grep -r "TODO" src/ --include="*.ts" --include="*.tsx"

# Find console.log statements
grep -r "console.log" src/ --include="*.ts" --include="*.tsx"

# Find hardcoded arrays
grep -r "const.*=.*\[{" src/ --include="*.ts" --include="*.tsx"

# Find mock/fake/stub patterns
grep -r "mock\|fake\|stub" src/ --include="*.ts" --include="*.tsx"
```

---

## 📝 Notes

- **Test files are excluded** - Mock data in `tests/` directory is intentional
- **Seed files are excluded** - Seed data in `src/seed/` is intentional
- **Development utilities** - Some console.log statements are acceptable in development
- **Production check** - Use `NODE_ENV === 'production'` to disable dev-only features

---

**Status**: Ready for implementation  
**Next Step**: Begin Phase 1 - Remove critical mock data

