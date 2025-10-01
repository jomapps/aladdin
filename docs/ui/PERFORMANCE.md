# Performance Guide

## Table of Contents

- [Overview](#overview)
- [Optimization Strategies](#optimization-strategies)
- [Bundle Size Management](#bundle-size-management)
- [Lazy Loading](#lazy-loading)
- [Memoization](#memoization)
- [Animation Performance](#animation-performance)
- [WebSocket Optimization](#websocket-optimization)
- [Monitoring](#monitoring)
- [Best Practices](#best-practices)

## Overview

Performance is critical for a real-time monitoring application. This guide covers strategies to keep Aladdin fast and responsive.

### Performance Metrics

Target metrics:
- **First Contentful Paint (FCP)**: < 1.5s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **Time to Interactive (TTI)**: < 3.5s
- **Cumulative Layout Shift (CLS)**: < 0.1
- **First Input Delay (FID)**: < 100ms

## Optimization Strategies

### Code Splitting

Split code into smaller chunks for faster initial load:

```typescript
// Dynamic import for routes
import dynamic from 'next/dynamic'

const AgentStatusDashboard = dynamic(
  () => import('@/components/agents/AgentStatusDashboard'),
  {
    loading: () => <DashboardSkeleton />,
    ssr: false // Client-side only if needed
  }
)

// Dynamic import with options
const DepartmentDashboard = dynamic(
  () => import('@/components/agents/DepartmentDashboard'),
  {
    loading: () => <Skeleton />,
    ssr: true
  }
)
```

### Tree Shaking

Ensure only used code is included:

```typescript
// ✅ Good - Named imports
import { useState, useEffect } from 'react'
import { AgentCard } from '@/components/agents/AgentCard'

// ❌ Bad - Namespace imports (includes everything)
import * as React from 'react'
import * as AgentComponents from '@/components/agents'
```

### Dead Code Elimination

Remove unused code:

```typescript
// Use ESLint to find unused imports/variables
// .eslintrc.js
{
  rules: {
    'no-unused-vars': 'error',
    'unused-imports/no-unused-imports': 'error'
  }
}
```

## Bundle Size Management

### Analyze Bundle

```bash
# Analyze bundle size
npm run build

# View bundle analyzer
ANALYZE=true npm run build
```

### webpack-bundle-analyzer Configuration

```typescript
// next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

module.exports = withBundleAnalyzer({
  // ... config
})
```

### Reduce Bundle Size

#### 1. Use Lighter Alternatives

```typescript
// ❌ Heavy - moment.js (67KB)
import moment from 'moment'

// ✅ Light - date-fns (13KB, tree-shakeable)
import { format, parseISO } from 'date-fns'
```

#### 2. Optimize Dependencies

```json
// package.json
{
  "dependencies": {
    "lodash": "^4.17.21" // 72KB
  }
}

// Better: Use specific imports
{
  "dependencies": {
    "lodash.debounce": "^4.0.8" // 3KB
  }
}
```

#### 3. Dynamic Imports for Large Components

```typescript
// Heavy chart component
const Chart = dynamic(() => import('recharts').then(mod => mod.LineChart), {
  loading: () => <ChartSkeleton />,
  ssr: false
})
```

## Lazy Loading

### Images

```typescript
import Image from 'next/image'

function AgentAvatar({ src, alt }) {
  return (
    <Image
      src={src}
      alt={alt}
      width={40}
      height={40}
      loading="lazy" // Lazy load images
      placeholder="blur" // Show blur placeholder
    />
  )
}
```

### Components

```typescript
// Lazy load non-critical components
import { lazy, Suspense } from 'react'

const AuditTrailViewer = lazy(() => import('@/components/agents/AuditTrailViewer'))

function Dashboard() {
  return (
    <div>
      <CriticalComponent />

      <Suspense fallback={<Skeleton />}>
        <AuditTrailViewer />
      </Suspense>
    </div>
  )
}
```

### Route-Based Code Splitting

```typescript
// Next.js automatically code-splits pages
// app/dashboard/page.tsx - Separate bundle
// app/agents/page.tsx - Separate bundle
// app/departments/page.tsx - Separate bundle
```

## Memoization

### React.memo

Prevent unnecessary re-renders:

```typescript
import { memo } from 'react'

// Without memo - Re-renders on every parent render
function AgentCard({ agent }) {
  return <div>{agent.name}</div>
}

// With memo - Only re-renders when agent changes
const AgentCard = memo(function AgentCard({ agent }) {
  return <div>{agent.name}</div>
})

// Custom comparison
const AgentCard = memo(
  function AgentCard({ agent }) {
    return <div>{agent.name}</div>
  },
  (prevProps, nextProps) => {
    // Only re-render if agent.id changes
    return prevProps.agent.id === nextProps.agent.id
  }
)
```

### useMemo

Memoize expensive computations:

```typescript
import { useMemo } from 'react'

function DepartmentDashboard({ agents, filters }) {
  // ❌ Bad - Recomputes every render
  const filteredAgents = agents.filter(agent =>
    agent.department === filters.department &&
    agent.status === filters.status
  )

  // ✅ Good - Only recomputes when dependencies change
  const filteredAgents = useMemo(() => {
    return agents.filter(agent =>
      agent.department === filters.department &&
      agent.status === filters.status
    )
  }, [agents, filters])

  // Expensive calculation
  const statistics = useMemo(() => {
    return {
      avgQuality: calculateAverageQuality(filteredAgents),
      avgDuration: calculateAverageDuration(filteredAgents),
      totalExecutions: filteredAgents.length
    }
  }, [filteredAgents])

  return <div>{/* Use filteredAgents and statistics */}</div>
}
```

### useCallback

Memoize callbacks:

```typescript
import { useCallback } from 'react'

function AgentList({ agents }) {
  // ❌ Bad - New function every render
  const handleClick = (agent) => {
    console.log('Clicked', agent.name)
  }

  // ✅ Good - Same function reference
  const handleClick = useCallback((agent) => {
    console.log('Clicked', agent.name)
  }, [])

  // With dependencies
  const handleUpdate = useCallback((agent, updates) => {
    updateAgent(agent.id, updates)
    refresh()
  }, [refresh])

  return agents.map(agent => (
    <AgentCard
      key={agent.id}
      agent={agent}
      onClick={handleClick} // Stable reference
    />
  ))
}
```

## Animation Performance

### Use CSS Transforms

Prefer `transform` and `opacity` for animations:

```css
/* ✅ Good - GPU accelerated */
.animate {
  transform: translateX(100px);
  opacity: 0.5;
  transition: transform 0.3s, opacity 0.3s;
}

/* ❌ Bad - Triggers layout */
.animate {
  left: 100px;
  width: 200px;
  transition: left 0.3s, width 0.3s;
}
```

### Will-Change

Hint browser about animations:

```css
.timeline-event {
  will-change: transform;
}

/* Remove after animation */
.timeline-event.animating {
  will-change: auto;
}
```

### requestAnimationFrame

Use for smooth animations:

```typescript
function useAnimationFrame(callback: (deltaTime: number) => void) {
  const requestRef = useRef<number>()
  const previousTimeRef = useRef<number>()

  useEffect(() => {
    const animate = (time: number) => {
      if (previousTimeRef.current !== undefined) {
        const deltaTime = time - previousTimeRef.current
        callback(deltaTime)
      }
      previousTimeRef.current = time
      requestRef.current = requestAnimationFrame(animate)
    }

    requestRef.current = requestAnimationFrame(animate)

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current)
      }
    }
  }, [callback])
}
```

### Debounce Animations

```typescript
import { debounce } from 'lodash'

function OutputStream({ events }) {
  // Debounce scroll updates
  const handleScroll = debounce(() => {
    checkScrollPosition()
  }, 100)

  return (
    <div onScroll={handleScroll}>
      {events.map(event => <Event key={event.id} event={event} />)}
    </div>
  )
}
```

## WebSocket Optimization

### Batch Updates

Batch multiple updates together:

```typescript
function useAgentExecution(executionId: string) {
  const [events, setEvents] = useState<AgentEvent[]>([])
  const pendingEventsRef = useRef<AgentEvent[]>([])

  useEffect(() => {
    const ws = new WebSocket(wsUrl)

    // Batch events every 100ms
    const flushInterval = setInterval(() => {
      if (pendingEventsRef.current.length > 0) {
        setEvents(prev => [...prev, ...pendingEventsRef.current])
        pendingEventsRef.current = []
      }
    }, 100)

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data)

      if (message.type === 'event') {
        pendingEventsRef.current.push(message.event)
      }
    }

    return () => {
      clearInterval(flushInterval)
      ws.close()
    }
  }, [executionId])

  return { events }
}
```

### Throttle Messages

Limit update frequency:

```typescript
import { throttle } from 'lodash'

function useWebSocket(url: string) {
  const [data, setData] = useState([])

  // Update UI at most once per 100ms
  const throttledUpdate = throttle((newData) => {
    setData(prev => [...prev, newData])
  }, 100)

  useEffect(() => {
    const ws = new WebSocket(url)

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data)
      throttledUpdate(message)
    }

    return () => ws.close()
  }, [url])

  return data
}
```

### Virtual Scrolling

For large lists:

```typescript
import { useVirtualizer } from '@tanstack/react-virtual'

function EventTimeline({ events }) {
  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: events.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60, // Estimated row height
    overscan: 5 // Render 5 extra items for smooth scrolling
  })

  return (
    <div ref={parentRef} style={{ height: '600px', overflow: 'auto' }}>
      <div style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}>
        {virtualizer.getVirtualItems().map(virtualRow => {
          const event = events[virtualRow.index]

          return (
            <div
              key={virtualRow.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`
              }}
            >
              <Event event={event} />
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

## Monitoring

### Web Vitals

Track Core Web Vitals:

```typescript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
```

### Custom Performance Tracking

```typescript
// lib/performance.ts
export function measurePerformance(name: string) {
  const start = performance.now()

  return {
    end: () => {
      const duration = performance.now() - start
      console.log(`${name} took ${duration.toFixed(2)}ms`)

      // Send to analytics
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'timing_complete', {
          name,
          value: Math.round(duration),
          event_category: 'Performance'
        })
      }

      return duration
    }
  }
}

// Usage
function fetchExecutionData(id: string) {
  const measure = measurePerformance('fetch-execution')

  return fetch(`/api/audit/${id}`)
    .then(r => r.json())
    .finally(() => measure.end())
}
```

### React DevTools Profiler

```typescript
import { Profiler } from 'react'

function onRenderCallback(
  id: string,
  phase: 'mount' | 'update',
  actualDuration: number,
  baseDuration: number,
  startTime: number,
  commitTime: number
) {
  console.log(`${id} ${phase} took ${actualDuration.toFixed(2)}ms`)

  // Send to analytics
  if (actualDuration > 16) { // Over 1 frame (60fps)
    console.warn(`Slow render: ${id} took ${actualDuration}ms`)
  }
}

function Dashboard() {
  return (
    <Profiler id="Dashboard" onRender={onRenderCallback}>
      <DashboardContent />
    </Profiler>
  )
}
```

## Best Practices

### 1. Avoid Inline Functions

```typescript
// ❌ Bad - New function every render
<button onClick={() => handleClick(agent.id)}>
  Click
</button>

// ✅ Good - Stable function reference
const handleClick = useCallback((id: string) => {
  // Handle click
}, [])

<button onClick={() => handleClick(agent.id)}>
  Click
</button>

// Or use data attributes
<button data-agent-id={agent.id} onClick={handleClick}>
  Click
</button>
```

### 2. Optimize Re-Renders

```typescript
// ❌ Bad - Causes re-render
function Parent() {
  const config = { theme: 'dark' } // New object every render
  return <Child config={config} />
}

// ✅ Good - Stable reference
function Parent() {
  const config = useMemo(() => ({ theme: 'dark' }), [])
  return <Child config={config} />
}
```

### 3. Lazy Load Heavy Dependencies

```typescript
// ❌ Bad - Always loaded
import Chart from 'recharts'

// ✅ Good - Loaded when needed
const Chart = dynamic(() => import('recharts'), {
  loading: () => <Skeleton />,
  ssr: false
})
```

### 4. Use Production Builds

```bash
# Development (slow, includes debugging)
npm run dev

# Production (optimized)
npm run build
npm start
```

### 5. Enable Compression

```typescript
// next.config.js
module.exports = {
  compress: true, // Enable gzip compression
}
```

### 6. Optimize Images

```typescript
import Image from 'next/image'

<Image
  src="/agent.png"
  alt="Agent"
  width={400}
  height={300}
  quality={75} // Reduce quality for smaller size
  priority={false} // Don't preload
  loading="lazy"
/>
```

### 7. Prefetch Critical Resources

```typescript
// app/layout.tsx
export default function Layout({ children }) {
  return (
    <html>
      <head>
        <link rel="preconnect" href="https://api.example.com" />
        <link rel="dns-prefetch" href="https://api.example.com" />
        <link rel="prefetch" href="/dashboard" />
      </head>
      <body>{children}</body>
    </html>
  )
}
```

## Performance Checklist

- [ ] Bundle size under 200KB (gzipped)
- [ ] FCP under 1.5 seconds
- [ ] LCP under 2.5 seconds
- [ ] No layout shifts (CLS < 0.1)
- [ ] All images optimized
- [ ] Code splitting implemented
- [ ] Lazy loading for heavy components
- [ ] Memoization where appropriate
- [ ] WebSocket updates throttled
- [ ] Production build tested
- [ ] Analytics integrated
- [ ] Performance monitoring active

## Next Steps

- Review [Developer Guide](/mnt/d/Projects/aladdin/docs/ui/DEVELOPER_GUIDE.md) for architecture
- Check [State Management Guide](/mnt/d/Projects/aladdin/docs/ui/STATE_MANAGEMENT.md) for optimization patterns
- See [Examples](/mnt/d/Projects/aladdin/docs/ui/examples/) for implementation examples
