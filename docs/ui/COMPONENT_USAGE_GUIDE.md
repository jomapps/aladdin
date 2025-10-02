# Component Usage Guide

## Overview
This guide provides examples and best practices for using UI components in the Aladdin project.

---

## 🎨 Animated Components

### AnimatedButton

**Import**:
```tsx
import { AnimatedButton } from '@/components/animated/AnimatedButton'
```

**Basic Usage**:
```tsx
<AnimatedButton variant="default" size="default">
  Click Me
</AnimatedButton>
```

**With Loading State**:
```tsx
<AnimatedButton 
  variant="default" 
  isLoading={isSubmitting}
  disabled={isSubmitting}
>
  Submit
</AnimatedButton>
```

**All Variants**:
```tsx
<AnimatedButton variant="default">Default</AnimatedButton>
<AnimatedButton variant="destructive">Delete</AnimatedButton>
<AnimatedButton variant="outline">Outline</AnimatedButton>
<AnimatedButton variant="secondary">Secondary</AnimatedButton>
<AnimatedButton variant="ghost">Ghost</AnimatedButton>
<AnimatedButton variant="link">Link</AnimatedButton>
```

**All Sizes**:
```tsx
<AnimatedButton size="sm">Small</AnimatedButton>
<AnimatedButton size="default">Default</AnimatedButton>
<AnimatedButton size="lg">Large</AnimatedButton>
<AnimatedButton size="icon"><Icon /></AnimatedButton>
```

---

### AnimatedCard

**Import**:
```tsx
import { 
  AnimatedCard, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardContent,
  CardFooter 
} from '@/components/animated/AnimatedCard'
```

**Basic Usage**:
```tsx
<AnimatedCard>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description goes here</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Card content</p>
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</AnimatedCard>
```

**With Custom Animations**:
```tsx
<AnimatedCard 
  hover={true}      // Enable hover lift animation
  press={true}      // Enable tap feedback
  delay={0.1}       // Delay fade-in animation
>
  Content
</AnimatedCard>
```

**Disable Animations**:
```tsx
<AnimatedCard hover={false} press={false}>
  Static Card
</AnimatedCard>
```

---

### AnimatedTabs

**Import**:
```tsx
import { AnimatedTabs } from '@/components/animated/AnimatedTab'
```

**Basic Usage**:
```tsx
const tabs = [
  { 
    id: 'overview', 
    label: 'Overview',
    content: <OverviewContent />
  },
  { 
    id: 'details', 
    label: 'Details',
    content: <DetailsContent />
  },
]

<AnimatedTabs 
  tabs={tabs}
  defaultValue="overview"
/>
```

**With Icons**:
```tsx
import { Home, Settings } from 'lucide-react'

const tabs = [
  { 
    id: 'home', 
    label: 'Home',
    icon: <Home className="w-4 h-4" />,
    content: <HomeContent />
  },
  { 
    id: 'settings', 
    label: 'Settings',
    icon: <Settings className="w-4 h-4" />,
    content: <SettingsContent />
  },
]

<AnimatedTabs tabs={tabs} defaultValue="home" />
```

**Controlled Mode**:
```tsx
const [activeTab, setActiveTab] = useState('overview')

<AnimatedTabs 
  tabs={tabs}
  value={activeTab}
  onValueChange={setActiveTab}
/>
```

**Direct Shadcn Tabs Usage** (for more control):
```tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/animated/AnimatedTab'

<Tabs defaultValue="tab1">
  <TabsList>
    <TabsTrigger value="tab1">Tab 1</TabsTrigger>
    <TabsTrigger value="tab2">Tab 2</TabsTrigger>
  </TabsList>
  <TabsContent value="tab1">Content 1</TabsContent>
  <TabsContent value="tab2">Content 2</TabsContent>
</Tabs>
```

---

## 📄 Pagination

### GatherPagination

**Import**:
```tsx
import GatherPagination from '@/components/gather/GatherPagination'
```

**Basic Usage**:
```tsx
const [currentPage, setCurrentPage] = useState(1)

<GatherPagination
  currentPage={currentPage}
  totalPages={20}
  hasMore={true}
  onPageChange={setCurrentPage}
/>
```

**Features**:
- Smart page number display (1 ... 5 6 7 ... 20)
- Previous/Next navigation
- Disabled states for first/last pages
- Ellipsis for large page counts
- Accessible keyboard navigation

---

## 💀 Loading States

### Skeleton Components

**Import**:
```tsx
import { 
  Skeleton,
  MessageSkeleton,
  CardSkeleton,
  TableSkeleton,
  AgentCardSkeleton,
  DashboardSkeleton 
} from '@/components/Skeleton'
```

**Basic Skeleton**:
```tsx
<Skeleton className="h-4 w-full" />
<Skeleton className="h-10 w-32" />
```

**Pre-built Skeletons**:
```tsx
<MessageSkeleton />
<CardSkeleton />
<TableSkeleton rows={5} />
<AgentCardSkeleton />
<DashboardSkeleton />
```

### Advanced Loading (with animations)

**Import**:
```tsx
import { Skeleton } from '@/components/loading/LoadingSkeleton'
```

**With Wave Animation**:
```tsx
<Skeleton 
  variant="rectangular" 
  width="100%" 
  height={120}
  animation="wave"
/>
```

**Circular Skeleton**:
```tsx
<Skeleton 
  variant="circular" 
  width={40} 
  height={40}
/>
```

### Message Loading

**Import**:
```tsx
import { MessageLoading, TypingIndicator } from '@/components/loading/MessageLoading'
```

**Usage**:
```tsx
<MessageLoading />
<TypingIndicator />
```

### Page Loading

**Import**:
```tsx
import { PageLoading, ContentLoading } from '@/components/loading/PageLoading'
```

**Usage**:
```tsx
<PageLoading />
<ContentLoading message="Loading data..." />
```

---

## 🎯 Best Practices

### 1. Use Animated Components for Interactive Elements
```tsx
// ✅ Good - Interactive button with feedback
<AnimatedButton onClick={handleClick}>
  Click Me
</AnimatedButton>

// ❌ Avoid - Plain button without feedback
<button onClick={handleClick}>Click Me</button>
```

### 2. Disable Animations When Appropriate
```tsx
// ✅ Good - Disable animations for static content
<AnimatedCard hover={false} press={false}>
  Static Information
</AnimatedCard>

// ❌ Avoid - Unnecessary animations on static content
<AnimatedCard>
  Static Information
</AnimatedCard>
```

### 3. Use Loading States
```tsx
// ✅ Good - Show loading state
<AnimatedButton isLoading={isSubmitting}>
  {isSubmitting ? 'Submitting...' : 'Submit'}
</AnimatedButton>

// ❌ Avoid - No loading feedback
<AnimatedButton onClick={handleSubmit}>
  Submit
</AnimatedButton>
```

### 4. Consistent Variants
```tsx
// ✅ Good - Consistent button variants
<AnimatedButton variant="default">Primary Action</AnimatedButton>
<AnimatedButton variant="outline">Secondary Action</AnimatedButton>
<AnimatedButton variant="destructive">Delete</AnimatedButton>

// ❌ Avoid - Inconsistent styling
<button className="custom-primary">Primary</button>
<button className="custom-secondary">Secondary</button>
```

### 5. Accessibility
```tsx
// ✅ Good - Accessible button
<AnimatedButton 
  aria-label="Delete item"
  disabled={isDeleting}
>
  <Trash className="w-4 h-4" />
</AnimatedButton>

// ❌ Avoid - No accessibility attributes
<AnimatedButton>
  <Trash className="w-4 h-4" />
</AnimatedButton>
```

---

## 📚 Additional Resources

- [Shadcn UI Documentation](https://ui.shadcn.com/)
- [Framer Motion Documentation](https://www.framer.com/motion/)
- [Lucide Icons](https://lucide.dev/)
- [Tailwind CSS](https://tailwindcss.com/)

---

## 🔄 Migration Notes

If you're updating existing code:

1. **Replace custom buttons** with `AnimatedButton`
2. **Replace custom cards** with `AnimatedCard`
3. **Replace custom tabs** with `AnimatedTabs`
4. **Replace custom pagination** with `GatherPagination`
5. **Use shadcn Skeleton** for loading states

All components maintain backward compatibility with existing props where possible.

