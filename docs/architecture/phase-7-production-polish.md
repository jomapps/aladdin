# Phase 7: Production Polish Architecture

**Architect**: System Architecture Designer (Hive Mind Swarm)
**Date**: 2025-10-01
**Status**: Design Complete
**Phase**: 7 - Production Polish & Optimization
**Dependencies**: Phases 1-6 (Complete)

---

## Executive Summary

Phase 7 transforms the functional Aladdin platform into a production-ready, enterprise-grade application through comprehensive UI/UX polish, performance optimization, and operational excellence. This phase focuses on user experience refinement, system scalability, reliability, and maintainability.

### Key Innovations

1. **Responsive Dashboard UI**: Mobile-first project dashboard with sidebar navigation, timeline, and quality metrics
2. **Agent Pool Management**: Intelligent concurrency limiting and queue management for AI agents
3. **Multi-Layer Caching**: L1 (memory) + L2 (Redis) + L3 (database) caching architecture
4. **Performance Monitoring**: Real-time metrics, health checks, and alerting system
5. **Error Boundaries**: Graceful error handling with automatic recovery and user feedback
6. **Production Optimizations**: Code splitting, image optimization, API streaming, bundle reduction

### Architecture Highlights

- **Agent Concurrency**: Max 3-5 concurrent agents with intelligent queue management
- **Cache Strategy**: Multi-layer with TTL-based invalidation (1hr-7days based on data type)
- **Response Time Targets**: <200ms API routes, <100ms cache hits, <2s agent responses
- **Mobile Support**: Responsive breakpoints (sm: 640px, md: 768px, lg: 1024px, xl: 1280px)
- **Error Recovery**: Automatic retry with exponential backoff, circuit breakers, fallback mechanisms

---

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    Production Dashboard UI                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  ProjectSide │  │   Timeline   │  │   Quality    │          │
│  │     bar      │  │   Component  │  │  Dashboard   │          │
│  │              │  │              │  │              │          │
│  │ • Navigation │  │ • Scrubber   │  │ • Metrics    │          │
│  │ • Content    │  │ • Markers    │  │ • Alerts     │          │
│  │ • Activity   │  │ • Controls   │  │ • Trends     │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                 │                  │                   │
└─────────┼─────────────────┼──────────────────┼───────────────────┘
          │                 │                  │
          ▼                 ▼                  ▼
┌─────────────────────────────────────────────────────────────────┐
│               Performance & Caching Layer                        │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐  │
│  │  Multi-Layer     │  │  Agent Pool      │  │  Monitoring  │  │
│  │  Cache           │  │  Manager         │  │  & Metrics   │  │
│  │                  │  │                  │  │              │  │
│  │ L1: Memory (hot) │  │ • Concurrency    │  │ • Health     │  │
│  │ L2: Redis (warm) │  │ • Queue (FIFO)   │  │ • Metrics    │  │
│  │ L3: Database     │  │ • Priority       │  │ • Alerts     │  │
│  └──────┬───────────┘  └──────┬───────────┘  └──────┬───────┘  │
└─────────┼──────────────────────┼──────────────────────┼─────────┘
          │                      │                      │
          ▼                      ▼                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Core Application Services                     │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  API Routes (Optimized)                                   │   │
│  │  • Response streaming   • Parallel processing             │   │
│  │  • Query optimization   • Error handling                  │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Agent System (Phase 4)                                   │   │
│  │  • Master Orchestrator  • Department Heads                │   │
│  │  • Specialists (50+)    • Brain validation                │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Media Generation (Phases 5-6)                            │   │
│  │  • Image generation     • Video generation                │   │
│  │  • Reference system     • Scene assembly                  │   │
│  └──────────────────────────────────────────────────────────┘   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Data & Storage Layer                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  MongoDB    │  │  Neo4j      │  │  Redis      │             │
│  │  (Payload + │  │  (Brain)    │  │  (Cache +   │             │
│  │   Open)     │  │             │  │   Queue)    │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│  ┌─────────────────────────────────────────────────┐            │
│  │  Cloudflare R2 (Media Storage)                  │            │
│  └─────────────────────────────────────────────────┘            │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Architecture

### 1. UI Component Hierarchy

**Location**: `/src/app/dashboard/project/[id]/components/`

#### 1.1 ProjectSidebar Component

```typescript
/**
 * Project Navigation Sidebar
 * Responsive sidebar with project info, department navigation, content browser
 */

interface ProjectSidebarProps {
  projectId: string
  isOpen: boolean  // For mobile hamburger
  onClose: () => void
}

interface SidebarSection {
  id: string
  title: string
  icon: ReactNode
  items: SidebarItem[]
  collapsible: boolean
  defaultOpen: boolean
}

interface SidebarItem {
  id: string
  label: string
  href?: string
  count?: number
  status?: 'active' | 'completed' | 'pending'
  onClick?: () => void
}

export function ProjectSidebar({ projectId, isOpen, onClose }: ProjectSidebarProps) {
  // Sections
  const sections: SidebarSection[] = [
    {
      id: 'project-info',
      title: 'Project Info',
      icon: <InfoIcon />,
      items: [
        { id: 'overview', label: 'Overview', href: `/dashboard/project/${projectId}` },
        { id: 'settings', label: 'Settings', href: `/dashboard/project/${projectId}/settings` }
      ],
      collapsible: false,
      defaultOpen: true
    },
    {
      id: 'departments',
      title: 'Departments',
      icon: <DepartmentIcon />,
      items: [
        { id: 'character', label: 'Character', count: 8, status: 'active' },
        { id: 'story', label: 'Story', count: 3, status: 'completed' },
        { id: 'visual', label: 'Visual', count: 15, status: 'active' },
        { id: 'audio', label: 'Audio', count: 2, status: 'pending' }
      ],
      collapsible: true,
      defaultOpen: true
    },
    {
      id: 'content',
      title: 'Content Browser',
      icon: <FolderIcon />,
      items: [
        { id: 'characters', label: 'Characters', count: 8 },
        { id: 'scenes', label: 'Scenes', count: 12 },
        { id: 'episodes', label: 'Episodes', count: 3 },
        { id: 'media', label: 'Media', count: 45 }
      ],
      collapsible: true,
      defaultOpen: true
    },
    {
      id: 'recent',
      title: 'Recent Activity',
      icon: <ClockIcon />,
      items: [
        { id: 'act1', label: 'Character "Sarah" updated', status: 'completed' },
        { id: 'act2', label: 'Scene 5 generated', status: 'completed' },
        { id: 'act3', label: 'Video rendering...', status: 'active' }
      ],
      collapsible: true,
      defaultOpen: false
    }
  ]

  return (
    <aside
      className={cn(
        "fixed lg:sticky top-0 left-0 h-screen w-80 bg-white dark:bg-gray-900",
        "border-r border-gray-200 dark:border-gray-800",
        "transition-transform duration-300 z-40",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}
    >
      {/* Mobile close button */}
      <div className="lg:hidden p-4 flex justify-end">
        <button onClick={onClose}>
          <CloseIcon />
        </button>
      </div>

      {/* Project header */}
      <ProjectHeader projectId={projectId} />

      {/* Scrollable sections */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {sections.map(section => (
          <SidebarSection key={section.id} section={section} />
        ))}
      </div>

      {/* Footer actions */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        <button className="w-full btn-primary">
          New Content
        </button>
      </div>
    </aside>
  )
}

function SidebarSection({ section }: { section: SidebarSection }) {
  const [isOpen, setIsOpen] = useState(section.defaultOpen)

  return (
    <div className="space-y-2">
      <button
        onClick={() => section.collapsible && setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full text-sm font-medium"
      >
        <div className="flex items-center gap-2">
          {section.icon}
          <span>{section.title}</span>
        </div>
        {section.collapsible && (
          <ChevronIcon className={cn("transition-transform", isOpen && "rotate-90")} />
        )}
      </button>

      {isOpen && (
        <ul className="space-y-1 pl-6">
          {section.items.map(item => (
            <SidebarItem key={item.id} item={item} />
          ))}
        </ul>
      )}
    </div>
  )
}

function SidebarItem({ item }: { item: SidebarItem }) {
  return (
    <li>
      <Link
        href={item.href || '#'}
        onClick={item.onClick}
        className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
      >
        <span className="text-sm">{item.label}</span>
        {item.count !== undefined && (
          <span className="text-xs text-gray-500">{item.count}</span>
        )}
        {item.status && (
          <StatusBadge status={item.status} />
        )}
      </Link>
    </li>
  )
}
```

**Responsive Behavior**:
- **Desktop (≥1024px)**: Always visible, 320px wide, sticky positioning
- **Tablet (768px-1023px)**: Toggle with hamburger menu, slides from left
- **Mobile (<768px)**: Full-screen overlay, hamburger menu in header

#### 1.2 Timeline Component

```typescript
/**
 * Video Timeline/Scrubber
 * Interactive timeline for scene/clip navigation and editing
 */

interface TimelineProps {
  projectId: string
  sceneId?: string
  duration: number  // Total duration in seconds
  clips: TimelineClip[]
  currentTime: number
  onSeek: (time: number) => void
  onClipClick: (clipId: string) => void
}

interface TimelineClip {
  id: string
  startTime: number
  endTime: number
  thumbnailUrl: string
  title: string
  type: 'video' | 'audio' | 'transition'
}

export function Timeline({
  projectId,
  sceneId,
  duration,
  clips,
  currentTime,
  onSeek,
  onClipClick
}: TimelineProps) {
  const [zoom, setZoom] = useState(1)  // 1x, 2x, 4x zoom levels
  const [isDragging, setIsDragging] = useState(false)
  const timelineRef = useRef<HTMLDivElement>(null)

  // Calculate pixel-per-second ratio based on zoom
  const pixelsPerSecond = (timelineRef.current?.offsetWidth || 1000) / duration * zoom

  function handleTimelineClick(event: React.MouseEvent) {
    if (!timelineRef.current) return

    const rect = timelineRef.current.getBoundingClientRect()
    const x = event.clientX - rect.left
    const time = x / pixelsPerSecond
    onSeek(Math.max(0, Math.min(duration, time)))
  }

  return (
    <div className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
      {/* Timeline controls */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
        {/* Playback controls */}
        <div className="flex items-center gap-2">
          <button className="btn-icon"><PlayIcon /></button>
          <button className="btn-icon"><PauseIcon /></button>
          <button className="btn-icon"><StopIcon /></button>
          <span className="text-sm text-gray-600">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>

        {/* Zoom controls */}
        <div className="flex items-center gap-2">
          <button onClick={() => setZoom(z => Math.max(0.5, z / 2))}>
            <ZoomOutIcon />
          </button>
          <span className="text-sm">{zoom}x</span>
          <button onClick={() => setZoom(z => Math.min(4, z * 2))}>
            <ZoomInIcon />
          </button>
        </div>
      </div>

      {/* Timeline visualization */}
      <div className="relative overflow-x-auto h-32">
        <div
          ref={timelineRef}
          className="relative h-full cursor-pointer"
          style={{ width: `${duration * pixelsPerSecond}px` }}
          onClick={handleTimelineClick}
        >
          {/* Time markers */}
          <TimeMarkers duration={duration} pixelsPerSecond={pixelsPerSecond} />

          {/* Clips */}
          <div className="absolute top-8 left-0 right-0 h-20">
            {clips.map(clip => (
              <TimelineClipView
                key={clip.id}
                clip={clip}
                pixelsPerSecond={pixelsPerSecond}
                onClick={() => onClipClick(clip.id)}
              />
            ))}
          </div>

          {/* Playhead */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
            style={{ left: `${currentTime * pixelsPerSecond}px` }}
          >
            <div className="absolute -top-2 -left-2 w-4 h-4 bg-red-500 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  )
}

function TimelineClipView({
  clip,
  pixelsPerSecond,
  onClick
}: {
  clip: TimelineClip
  pixelsPerSecond: number
  onClick: () => void
}) {
  const left = clip.startTime * pixelsPerSecond
  const width = (clip.endTime - clip.startTime) * pixelsPerSecond

  return (
    <div
      className="absolute top-0 h-full bg-blue-500 rounded border-2 border-blue-600 overflow-hidden cursor-pointer hover:border-blue-400"
      style={{ left: `${left}px`, width: `${width}px` }}
      onClick={onClick}
    >
      <img
        src={clip.thumbnailUrl}
        alt={clip.title}
        className="w-full h-full object-cover opacity-50"
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs text-white font-medium truncate px-2">
          {clip.title}
        </span>
      </div>
    </div>
  )
}

function TimeMarkers({ duration, pixelsPerSecond }: { duration: number, pixelsPerSecond: number }) {
  const markerInterval = duration > 60 ? 10 : duration > 30 ? 5 : 1  // Adaptive marker intervals
  const markers = Math.floor(duration / markerInterval)

  return (
    <div className="absolute top-0 left-0 right-0 h-6 border-b border-gray-300 dark:border-gray-700">
      {Array.from({ length: markers + 1 }).map((_, i) => {
        const time = i * markerInterval
        const left = time * pixelsPerSecond

        return (
          <div
            key={i}
            className="absolute top-0 h-full border-l border-gray-300 dark:border-gray-700"
            style={{ left: `${left}px` }}
          >
            <span className="text-xs text-gray-500 ml-1">
              {formatTime(time)}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
```

**Key Features**:
- **Scrubber**: Click/drag to seek to specific time
- **Clip visualization**: Thumbnails with duration indicators
- **Zoom controls**: 0.5x, 1x, 2x, 4x zoom levels
- **Playback controls**: Play, pause, stop buttons
- **Time markers**: Adaptive intervals based on duration
- **Responsive**: Horizontal scroll on small screens

#### 1.3 QualityDashboard Component

```typescript
/**
 * Quality Metrics Dashboard
 * Real-time quality scores, alerts, and trends for project content
 */

interface QualityDashboardProps {
  projectId: string
}

interface QualityMetrics {
  overall: number  // 0-1
  departments: DepartmentQuality[]
  recentAlerts: QualityAlert[]
  trends: QualityTrend[]
}

interface DepartmentQuality {
  department: string
  score: number  // 0-1
  itemCount: number
  issues: number
  lastUpdated: Date
}

interface QualityAlert {
  id: string
  severity: 'info' | 'warning' | 'error'
  message: string
  itemId: string
  itemType: string
  timestamp: Date
}

interface QualityTrend {
  date: Date
  score: number
}

export function QualityDashboard({ projectId }: QualityDashboardProps) {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['quality-metrics', projectId],
    queryFn: () => fetchQualityMetrics(projectId),
    refetchInterval: 30000  // Refresh every 30s
  })

  if (isLoading) {
    return <QualityDashboardSkeleton />
  }

  return (
    <div className="space-y-6 p-6">
      {/* Overall quality score */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4">Project Quality</h2>
        <div className="flex items-center gap-4">
          <QualityScoreRing score={metrics.overall} size="large" />
          <div>
            <div className="text-4xl font-bold">
              {(metrics.overall * 100).toFixed(1)}%
            </div>
            <div className="text-sm text-gray-500">Overall Quality Score</div>
          </div>
        </div>
      </div>

      {/* Department breakdown */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Department Quality</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.departments.map(dept => (
            <DepartmentQualityCard key={dept.department} department={dept} />
          ))}
        </div>
      </div>

      {/* Recent alerts */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Quality Alerts</h3>
        {metrics.recentAlerts.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            No quality issues detected
          </div>
        ) : (
          <div className="space-y-2">
            {metrics.recentAlerts.map(alert => (
              <QualityAlertCard key={alert.id} alert={alert} />
            ))}
          </div>
        )}
      </div>

      {/* Quality trend chart */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Quality Trend (30 days)</h3>
        <QualityTrendChart data={metrics.trends} />
      </div>

      {/* Export button */}
      <div className="flex justify-end">
        <button
          onClick={() => exportQualityReport(projectId)}
          className="btn-secondary"
        >
          Export Quality Report
        </button>
      </div>
    </div>
  )
}

function DepartmentQualityCard({ department }: { department: DepartmentQuality }) {
  return (
    <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium">{department.department}</h4>
        <QualityScoreRing score={department.score} size="small" />
      </div>
      <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
        <div>{department.itemCount} items</div>
        {department.issues > 0 && (
          <div className="text-red-500">{department.issues} issues</div>
        )}
        <div className="text-xs">
          Updated {formatRelativeTime(department.lastUpdated)}
        </div>
      </div>
    </div>
  )
}

function QualityAlertCard({ alert }: { alert: QualityAlert }) {
  const severityColors = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    error: 'bg-red-50 border-red-200 text-red-800'
  }

  return (
    <div className={cn('border rounded p-3', severityColors[alert.severity])}>
      <div className="flex items-start gap-2">
        <AlertIcon severity={alert.severity} />
        <div className="flex-1">
          <div className="font-medium">{alert.message}</div>
          <div className="text-sm mt-1">
            {alert.itemType} • {formatRelativeTime(alert.timestamp)}
          </div>
        </div>
        <button className="text-sm underline">View</button>
      </div>
    </div>
  )
}

function QualityScoreRing({ score, size }: { score: number, size: 'small' | 'large' }) {
  const radius = size === 'large' ? 50 : 20
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score * circumference)

  const colorClass =
    score >= 0.8 ? 'text-green-500' :
    score >= 0.6 ? 'text-yellow-500' :
    'text-red-500'

  return (
    <svg
      width={size === 'large' ? 120 : 50}
      height={size === 'large' ? 120 : 50}
      className={colorClass}
    >
      <circle
        cx={size === 'large' ? 60 : 25}
        cy={size === 'large' ? 60 : 25}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={size === 'large' ? 10 : 4}
        opacity={0.2}
      />
      <circle
        cx={size === 'large' ? 60 : 25}
        cy={size === 'large' ? 60 : 25}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={size === 'large' ? 10 : 4}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size === 'large' ? 60 : 25} ${size === 'large' ? 60 : 25})`}
      />
      {size === 'large' && (
        <text
          x="60"
          y="65"
          textAnchor="middle"
          className="text-2xl font-bold fill-current"
        >
          {(score * 100).toFixed(0)}
        </text>
      )}
    </svg>
  )
}

function QualityTrendChart({ data }: { data: QualityTrend[] }) {
  // Simple line chart implementation or use library like recharts
  const maxScore = Math.max(...data.map(d => d.score))
  const minScore = Math.min(...data.map(d => d.score))

  return (
    <div className="h-64 border border-gray-200 dark:border-gray-800 rounded p-4">
      {/* Chart implementation */}
      <div className="text-center text-gray-500">
        Quality trend visualization
      </div>
    </div>
  )
}
```

**Key Features**:
- **Overall quality ring**: Large circular progress indicator
- **Department breakdown**: Grid of department quality cards
- **Alert system**: Color-coded alerts (info, warning, error)
- **Trend chart**: 30-day quality history
- **Export**: Generate PDF quality reports
- **Real-time updates**: Refresh every 30 seconds

---

### 2. Mobile Responsive Strategy

**Breakpoint System**:

```typescript
// Tailwind breakpoints
const breakpoints = {
  sm: '640px',   // Small devices (landscape phones)
  md: '768px',   // Medium devices (tablets)
  lg: '1024px',  // Large devices (desktops)
  xl: '1280px',  // Extra large devices
  '2xl': '1536px' // 2X Extra large devices
}

// Usage in components
<div className="
  w-full                // Mobile: Full width
  md:w-1/2              // Tablet: Half width
  lg:w-1/3              // Desktop: Third width
  p-4                   // Mobile: 16px padding
  md:p-6                // Tablet: 24px padding
  lg:p-8                // Desktop: 32px padding
">
```

**Mobile-First CSS Approach**:

```css
/* Base styles for mobile */
.sidebar {
  position: fixed;
  left: 0;
  top: 0;
  width: 100%;
  height: 100vh;
  transform: translateX(-100%);
  transition: transform 300ms;
}

.sidebar.open {
  transform: translateX(0);
}

/* Tablet and up */
@media (min-width: 768px) {
  .sidebar {
    width: 320px;
    transform: translateX(0);
  }
}

/* Desktop and up */
@media (min-width: 1024px) {
  .sidebar {
    position: sticky;
  }
}
```

**Touch-Friendly UI Elements**:

```typescript
// Minimum touch target: 44x44px
const TOUCH_TARGET_MIN = 44

// Button component with touch-friendly sizing
export function TouchButton({ children, ...props }: ButtonProps) {
  return (
    <button
      className="min-h-[44px] min-w-[44px] px-4 py-2 rounded touch-manipulation"
      {...props}
    >
      {children}
    </button>
  )
}

// Swipe gestures for mobile
function useSwipeGesture(onSwipeLeft: () => void, onSwipeRight: () => void) {
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)

  const minSwipeDistance = 50

  const onTouchStart = (e: TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e: TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return

    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (isLeftSwipe) onSwipeLeft()
    if (isRightSwipe) onSwipeRight()
  }

  return { onTouchStart, onTouchMove, onTouchEnd }
}
```

**Responsive Grid Layouts**:

```typescript
// Responsive project grid
export function ProjectGrid({ projects }: { projects: Project[] }) {
  return (
    <div className="
      grid
      grid-cols-1           // Mobile: 1 column
      sm:grid-cols-2        // Small: 2 columns
      md:grid-cols-3        // Tablet: 3 columns
      lg:grid-cols-4        // Desktop: 4 columns
      gap-4                 // 16px gap
      md:gap-6              // Tablet: 24px gap
    ">
      {projects.map(project => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  )
}
```

**Mobile-Optimized Modals**:

```typescript
// Full-screen modal on mobile, centered dialog on desktop
export function ResponsiveModal({ children, isOpen, onClose }: ModalProps) {
  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="relative z-50"
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      {/* Modal container */}
      <div className="fixed inset-0 flex items-end sm:items-center justify-center p-0 sm:p-4">
        <Dialog.Panel className="
          w-full                    // Mobile: Full width
          h-full                    // Mobile: Full height
          sm:h-auto                 // Desktop: Auto height
          sm:max-w-2xl              // Desktop: Max width 672px
          sm:rounded-lg             // Desktop: Rounded corners
          bg-white
          dark:bg-gray-900
          shadow-xl
          overflow-y-auto
        ">
          {children}
        </Dialog.Panel>
      </div>
    </Dialog>
  )
}
```

---

### 3. Agent Pool Management Architecture

**Location**: `/src/lib/agents/`

#### 3.1 Agent Pool Manager (`pool.ts`)

```typescript
/**
 * Agent Pool Manager
 * Manages concurrency limiting and queue for AI agent execution
 */

interface AgentPoolConfig {
  maxConcurrent: number  // Max 3-5 concurrent agents
  queueStrategy: 'FIFO' | 'priority' | 'department-aware'
  timeout: number  // Agent execution timeout (ms)
  retryAttempts: number
  healthCheckInterval: number  // Health check interval (ms)
}

interface AgentTask {
  id: string
  agentType: string
  department?: string
  input: any
  priority: 'low' | 'medium' | 'high' | 'critical'
  timeout: number
  retryCount: number
  createdAt: Date
  startedAt?: Date
  completedAt?: Date
  status: 'queued' | 'running' | 'completed' | 'failed' | 'timeout'
  result?: any
  error?: Error
}

interface AgentPoolStats {
  active: number
  queued: number
  completed: number
  failed: number
  averageExecutionTime: number
  queueWaitTime: number
}

export class AgentPoolManager {
  private config: AgentPoolConfig
  private activeAgents: Map<string, AgentTask>
  private queue: AgentTask[]
  private stats: AgentPoolStats
  private isShuttingDown: boolean

  constructor(config: Partial<AgentPoolConfig> = {}) {
    this.config = {
      maxConcurrent: config.maxConcurrent || 5,
      queueStrategy: config.queueStrategy || 'priority',
      timeout: config.timeout || 120000,  // 2 minutes
      retryAttempts: config.retryAttempts || 2,
      healthCheckInterval: config.healthCheckInterval || 30000  // 30 seconds
    }

    this.activeAgents = new Map()
    this.queue = []
    this.stats = {
      active: 0,
      queued: 0,
      completed: 0,
      failed: 0,
      averageExecutionTime: 0,
      queueWaitTime: 0
    }
    this.isShuttingDown = false

    // Start health check loop
    this.startHealthCheck()
  }

  /**
   * Submit agent task to pool
   */
  async submitTask(task: Omit<AgentTask, 'id' | 'status' | 'createdAt' | 'retryCount'>): Promise<string> {
    if (this.isShuttingDown) {
      throw new Error('Agent pool is shutting down')
    }

    const agentTask: AgentTask = {
      ...task,
      id: generateTaskId(),
      status: 'queued',
      createdAt: new Date(),
      retryCount: 0
    }

    // Add to queue
    this.queue.push(agentTask)
    this.stats.queued++

    // Sort queue by strategy
    this.sortQueue()

    // Try to process immediately
    this.processQueue()

    return agentTask.id
  }

  /**
   * Get task status
   */
  getTaskStatus(taskId: string): AgentTask | null {
    // Check active agents
    const active = this.activeAgents.get(taskId)
    if (active) return active

    // Check queue
    const queued = this.queue.find(t => t.id === taskId)
    if (queued) return queued

    return null
  }

  /**
   * Get pool statistics
   */
  getStats(): AgentPoolStats {
    return {
      ...this.stats,
      active: this.activeAgents.size,
      queued: this.queue.length
    }
  }

  /**
   * Process queue (start next task if capacity available)
   */
  private async processQueue() {
    // Check if we have capacity
    while (
      this.activeAgents.size < this.config.maxConcurrent &&
      this.queue.length > 0 &&
      !this.isShuttingDown
    ) {
      const task = this.queue.shift()!
      this.stats.queued--

      // Start task execution
      this.executeTask(task)
    }
  }

  /**
   * Execute agent task
   */
  private async executeTask(task: AgentTask) {
    task.status = 'running'
    task.startedAt = new Date()
    this.activeAgents.set(task.id, task)
    this.stats.active++

    try {
      // Execute with timeout
      const result = await Promise.race([
        this.runAgent(task),
        this.timeoutPromise(task.timeout || this.config.timeout)
      ])

      // Task completed successfully
      task.status = 'completed'
      task.completedAt = new Date()
      task.result = result
      this.stats.completed++

      // Update average execution time
      const executionTime = task.completedAt.getTime() - task.startedAt!.getTime()
      this.updateAverageExecutionTime(executionTime)

    } catch (error) {
      // Task failed
      console.error(`Agent task ${task.id} failed:`, error)
      task.error = error as Error

      // Retry logic
      if (task.retryCount < this.config.retryAttempts) {
        task.retryCount++
        task.status = 'queued'
        this.queue.unshift(task)  // Add to front of queue for retry
        this.stats.queued++
      } else {
        task.status = 'failed'
        task.completedAt = new Date()
        this.stats.failed++
      }
    } finally {
      // Remove from active agents
      this.activeAgents.delete(task.id)
      this.stats.active--

      // Process next task in queue
      this.processQueue()
    }
  }

  /**
   * Run agent (delegates to actual agent execution)
   */
  private async runAgent(task: AgentTask): Promise<any> {
    // Import and execute agent based on type
    const agent = await import(`@/agents/${task.department}/${task.agentType}`)
    return agent.execute(task.input)
  }

  /**
   * Timeout promise helper
   */
  private timeoutPromise(ms: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Agent execution timeout')), ms)
    })
  }

  /**
   * Sort queue by strategy
   */
  private sortQueue() {
    switch (this.config.queueStrategy) {
      case 'FIFO':
        // Already in order
        break

      case 'priority':
        this.queue.sort((a, b) => {
          const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
          return priorityOrder[a.priority] - priorityOrder[b.priority]
        })
        break

      case 'department-aware':
        // Group by department to maximize parallel processing
        this.queue.sort((a, b) => {
          if (a.department !== b.department) {
            return (a.department || '').localeCompare(b.department || '')
          }
          const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
          return priorityOrder[a.priority] - priorityOrder[b.priority]
        })
        break
    }
  }

  /**
   * Update average execution time
   */
  private updateAverageExecutionTime(newTime: number) {
    const count = this.stats.completed
    const currentAvg = this.stats.averageExecutionTime
    this.stats.averageExecutionTime = (currentAvg * (count - 1) + newTime) / count
  }

  /**
   * Health check loop
   */
  private startHealthCheck() {
    setInterval(() => {
      this.performHealthCheck()
    }, this.config.healthCheckInterval)
  }

  /**
   * Perform health check on active agents
   */
  private performHealthCheck() {
    const now = Date.now()

    for (const [id, task] of this.activeAgents.entries()) {
      const runningTime = now - task.startedAt!.getTime()

      // Check if task exceeded timeout
      if (runningTime > (task.timeout || this.config.timeout)) {
        console.warn(`Agent task ${id} exceeded timeout, marking as failed`)
        task.status = 'timeout'
        task.completedAt = new Date()
        task.error = new Error('Task exceeded timeout')
        this.activeAgents.delete(id)
        this.stats.active--
        this.stats.failed++

        // Process next task
        this.processQueue()
      }
    }
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    this.isShuttingDown = true

    console.log(`Shutting down agent pool (${this.activeAgents.size} active tasks)`)

    // Wait for active tasks to complete (with timeout)
    const shutdownTimeout = 60000  // 1 minute
    const startTime = Date.now()

    while (this.activeAgents.size > 0) {
      if (Date.now() - startTime > shutdownTimeout) {
        console.warn('Shutdown timeout reached, forcing shutdown')
        break
      }
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    console.log('Agent pool shutdown complete')
  }
}

// Singleton instance
let agentPoolInstance: AgentPoolManager | null = null

export function getAgentPool(): AgentPoolManager {
  if (!agentPoolInstance) {
    agentPoolInstance = new AgentPoolManager({
      maxConcurrent: parseInt(process.env.AGENT_MAX_CONCURRENT || '5'),
      queueStrategy: 'priority',
      timeout: 120000,
      retryAttempts: 2
    })
  }
  return agentPoolInstance
}

function generateTaskId(): string {
  return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}
```

#### 3.2 Agent Scheduler (`scheduler.ts`)

```typescript
/**
 * Agent Scheduling
 * Priority-based and department-aware scheduling
 */

interface SchedulerConfig {
  departmentWeights: Record<string, number>
  priorityWeights: Record<string, number>
  loadBalancing: 'round-robin' | 'least-loaded' | 'priority-first'
}

export class AgentScheduler {
  private config: SchedulerConfig
  private departmentLoad: Map<string, number>

  constructor(config: Partial<SchedulerConfig> = {}) {
    this.config = {
      departmentWeights: config.departmentWeights || {
        character: 1.0,
        story: 1.0,
        visual: 1.2,  // Visual generation is heavier
        audio: 0.8,
        production: 1.0
      },
      priorityWeights: config.priorityWeights || {
        critical: 4,
        high: 3,
        medium: 2,
        low: 1
      },
      loadBalancing: config.loadBalancing || 'priority-first'
    }

    this.departmentLoad = new Map()
  }

  /**
   * Calculate task priority score
   */
  calculatePriorityScore(task: AgentTask): number {
    const priorityWeight = this.config.priorityWeights[task.priority] || 1
    const departmentWeight = this.config.departmentWeights[task.department || 'default'] || 1
    const ageWeight = this.calculateAgeWeight(task)

    return priorityWeight * departmentWeight * ageWeight
  }

  /**
   * Calculate age weight (older tasks get higher priority)
   */
  private calculateAgeWeight(task: AgentTask): number {
    const ageMs = Date.now() - task.createdAt.getTime()
    const ageMinutes = ageMs / (1000 * 60)

    // Exponential increase: 1.0 at 0 min, 1.5 at 5 min, 2.0 at 10 min
    return 1.0 + Math.min(ageMinutes / 10, 1.0)
  }

  /**
   * Select next task based on load balancing strategy
   */
  selectNextTask(queue: AgentTask[]): AgentTask | null {
    if (queue.length === 0) return null

    switch (this.config.loadBalancing) {
      case 'round-robin':
        return this.selectRoundRobin(queue)

      case 'least-loaded':
        return this.selectLeastLoaded(queue)

      case 'priority-first':
      default:
        return this.selectPriorityFirst(queue)
    }
  }

  /**
   * Priority-first selection
   */
  private selectPriorityFirst(queue: AgentTask[]): AgentTask {
    return queue.reduce((highest, task) => {
      const taskScore = this.calculatePriorityScore(task)
      const highestScore = this.calculatePriorityScore(highest)
      return taskScore > highestScore ? task : highest
    })
  }

  /**
   * Round-robin by department
   */
  private selectRoundRobin(queue: AgentTask[]): AgentTask {
    // Find department with least recent execution
    const departmentLastRun = new Map<string, number>()

    for (const task of queue) {
      const dept = task.department || 'default'
      if (!departmentLastRun.has(dept)) {
        return task  // First task from this department
      }
    }

    return queue[0]  // Fallback
  }

  /**
   * Least-loaded department selection
   */
  private selectLeastLoaded(queue: AgentTask[]): AgentTask {
    let leastLoaded: AgentTask | null = null
    let minLoad = Infinity

    for (const task of queue) {
      const dept = task.department || 'default'
      const load = this.departmentLoad.get(dept) || 0

      if (load < minLoad) {
        minLoad = load
        leastLoaded = task
      }
    }

    return leastLoaded || queue[0]
  }

  /**
   * Update department load
   */
  updateDepartmentLoad(department: string, delta: number) {
    const current = this.departmentLoad.get(department) || 0
    this.departmentLoad.set(department, Math.max(0, current + delta))
  }

  /**
   * Get current department loads
   */
  getDepartmentLoads(): Record<string, number> {
    return Object.fromEntries(this.departmentLoad)
  }
}
```

---

### 4. Multi-Layer Caching Architecture

**Location**: `/src/lib/cache/`

#### 4.1 Redis Client (`redis.ts`)

```typescript
/**
 * Redis Client and Patterns
 * Connection pooling, key namespacing, TTL management
 */

import Redis from 'ioredis'

interface RedisConfig {
  url: string
  keyPrefix: string
  defaultTTL: number  // Default TTL in seconds
  maxRetriesPerRequest: number
  enableOfflineQueue: boolean
}

export class RedisClient {
  private client: Redis
  private config: RedisConfig

  constructor(config: Partial<RedisConfig> = {}) {
    this.config = {
      url: config.url || process.env.REDIS_URL || 'redis://localhost:6379',
      keyPrefix: config.keyPrefix || 'aladdin:',
      defaultTTL: config.defaultTTL || 3600,  // 1 hour
      maxRetriesPerRequest: config.maxRetriesPerRequest || 3,
      enableOfflineQueue: config.enableOfflineQueue || false
    }

    this.client = new Redis(this.config.url, {
      keyPrefix: this.config.keyPrefix,
      maxRetriesPerRequest: this.config.maxRetriesPerRequest,
      enableOfflineQueue: this.config.enableOfflineQueue,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000)
        return delay
      }
    })

    this.client.on('error', (err) => {
      console.error('Redis client error:', err)
    })

    this.client.on('connect', () => {
      console.log('Redis client connected')
    })
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.client.get(key)
      if (!value) return null

      return JSON.parse(value) as T
    } catch (error) {
      console.error(`Redis get error for key ${key}:`, error)
      return null
    }
  }

  /**
   * Set value in cache with TTL
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<boolean> {
    try {
      const serialized = JSON.stringify(value)
      const ttlSeconds = ttl || this.config.defaultTTL

      await this.client.setex(key, ttlSeconds, serialized)
      return true
    } catch (error) {
      console.error(`Redis set error for key ${key}:`, error)
      return false
    }
  }

  /**
   * Delete key from cache
   */
  async delete(key: string): Promise<boolean> {
    try {
      await this.client.del(key)
      return true
    } catch (error) {
      console.error(`Redis delete error for key ${key}:`, error)
      return false
    }
  }

  /**
   * Delete keys by pattern
   */
  async deletePattern(pattern: string): Promise<number> {
    try {
      const keys = await this.client.keys(pattern)
      if (keys.length === 0) return 0

      await this.client.del(...keys)
      return keys.length
    } catch (error) {
      console.error(`Redis deletePattern error for pattern ${pattern}:`, error)
      return 0
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key)
      return result === 1
    } catch (error) {
      console.error(`Redis exists error for key ${key}:`, error)
      return false
    }
  }

  /**
   * Get TTL for key
   */
  async ttl(key: string): Promise<number> {
    try {
      return await this.client.ttl(key)
    } catch (error) {
      console.error(`Redis TTL error for key ${key}:`, error)
      return -1
    }
  }

  /**
   * Increment counter
   */
  async increment(key: string, by: number = 1): Promise<number> {
    try {
      return await this.client.incrby(key, by)
    } catch (error) {
      console.error(`Redis increment error for key ${key}:`, error)
      return 0
    }
  }

  /**
   * Set with namespace
   */
  withNamespace(namespace: string): RedisClient {
    return new RedisClient({
      ...this.config,
      keyPrefix: `${this.config.keyPrefix}${namespace}:`
    })
  }

  /**
   * Close connection
   */
  async close(): Promise<void> {
    await this.client.quit()
  }
}

// Singleton instance
let redisInstance: RedisClient | null = null

export function getRedisClient(): RedisClient {
  if (!redisInstance) {
    redisInstance = new RedisClient()
  }
  return redisInstance
}

// Cache key generators
export const CacheKeys = {
  character: (projectId: string, characterId: string) =>
    `project:${projectId}:character:${characterId}`,

  scene: (projectId: string, sceneId: string) =>
    `project:${projectId}:scene:${sceneId}`,

  brainValidation: (entityType: string, entityId: string) =>
    `brain:validation:${entityType}:${entityId}`,

  mediaUrl: (mediaId: string) =>
    `media:url:${mediaId}`,

  agentOutput: (agentType: string, inputHash: string) =>
    `agent:output:${agentType}:${inputHash}`,

  projectList: (userId: string) =>
    `user:${userId}:projects`,

  qualityMetrics: (projectId: string) =>
    `project:${projectId}:quality`
}

// TTL constants (in seconds)
export const CacheTTL = {
  CHARACTER: 3600,        // 1 hour
  SCENE: 3600,           // 1 hour
  BRAIN_VALIDATION: 86400, // 24 hours
  MEDIA_URL: 604800,     // 7 days
  AGENT_OUTPUT: 0,       // No cache (always fresh)
  PROJECT_LIST: 300,     // 5 minutes
  QUALITY_METRICS: 1800  // 30 minutes
}
```

#### 4.2 Multi-Layer Cache (`multiLayerCache.ts`)

```typescript
/**
 * Multi-Layer Cache
 * L1: Memory (hot data), L2: Redis (warm data), L3: Database (cold data)
 */

interface CacheEntry<T> {
  value: T
  expiresAt: number
}

export class MultiLayerCache<T> {
  private l1Cache: Map<string, CacheEntry<T>>  // Memory cache
  private l2Cache: RedisClient                 // Redis cache
  private l3Fetcher: (key: string) => Promise<T | null>  // Database fetcher
  private l1MaxSize: number
  private l1TTL: number  // L1 TTL in ms
  private l2TTL: number  // L2 TTL in seconds

  constructor(options: {
    namespace: string
    l1MaxSize?: number
    l1TTL?: number
    l2TTL?: number
    l3Fetcher: (key: string) => Promise<T | null>
  }) {
    this.l1Cache = new Map()
    this.l2Cache = getRedisClient().withNamespace(options.namespace)
    this.l3Fetcher = options.l3Fetcher
    this.l1MaxSize = options.l1MaxSize || 100
    this.l1TTL = options.l1TTL || 60000  // 1 minute
    this.l2TTL = options.l2TTL || 3600   // 1 hour

    // Start L1 cleanup loop
    this.startL1Cleanup()
  }

  /**
   * Get value from cache (L1 → L2 → L3)
   */
  async get(key: string): Promise<T | null> {
    // Check L1 (memory)
    const l1Entry = this.l1Cache.get(key)
    if (l1Entry && l1Entry.expiresAt > Date.now()) {
      return l1Entry.value
    }

    // Check L2 (Redis)
    const l2Value = await this.l2Cache.get<T>(key)
    if (l2Value !== null) {
      // Warm L1 cache
      this.setL1(key, l2Value)
      return l2Value
    }

    // Fetch from L3 (database)
    const l3Value = await this.l3Fetcher(key)
    if (l3Value !== null) {
      // Warm L2 and L1 caches
      await this.set(key, l3Value)
      return l3Value
    }

    return null
  }

  /**
   * Set value in all cache layers
   */
  async set(key: string, value: T): Promise<void> {
    // Set L1
    this.setL1(key, value)

    // Set L2
    await this.l2Cache.set(key, value, this.l2TTL)
  }

  /**
   * Delete from all cache layers
   */
  async delete(key: string): Promise<void> {
    // Delete from L1
    this.l1Cache.delete(key)

    // Delete from L2
    await this.l2Cache.delete(key)
  }

  /**
   * Invalidate cache by pattern
   */
  async invalidatePattern(pattern: string): Promise<void> {
    // Clear L1 (scan all keys)
    for (const key of this.l1Cache.keys()) {
      if (this.matchPattern(key, pattern)) {
        this.l1Cache.delete(key)
      }
    }

    // Clear L2 (Redis pattern delete)
    await this.l2Cache.deletePattern(pattern)
  }

  /**
   * Set L1 cache entry
   */
  private setL1(key: string, value: T) {
    // Check if L1 cache is full
    if (this.l1Cache.size >= this.l1MaxSize) {
      // Evict oldest entry (LRU)
      const firstKey = this.l1Cache.keys().next().value
      this.l1Cache.delete(firstKey)
    }

    this.l1Cache.set(key, {
      value,
      expiresAt: Date.now() + this.l1TTL
    })
  }

  /**
   * Start L1 cleanup loop
   */
  private startL1Cleanup() {
    setInterval(() => {
      const now = Date.now()
      for (const [key, entry] of this.l1Cache.entries()) {
        if (entry.expiresAt <= now) {
          this.l1Cache.delete(key)
        }
      }
    }, 60000)  // Cleanup every minute
  }

  /**
   * Match key against pattern (* wildcard)
   */
  private matchPattern(key: string, pattern: string): boolean {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$')
    return regex.test(key)
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      l1Size: this.l1Cache.size,
      l1MaxSize: this.l1MaxSize
    }
  }
}

// Cache instances for different data types
export const characterCache = new MultiLayerCache<any>({
  namespace: 'character',
  l1MaxSize: 50,
  l1TTL: 60000,      // 1 minute
  l2TTL: 3600,       // 1 hour
  l3Fetcher: async (key) => {
    // Fetch from database
    const [projectId, characterId] = key.split(':')
    return await fetchCharacterFromDB(projectId, characterId)
  }
})

export const sceneCache = new MultiLayerCache<any>({
  namespace: 'scene',
  l1MaxSize: 50,
  l1TTL: 60000,
  l2TTL: 3600,
  l3Fetcher: async (key) => {
    const [projectId, sceneId] = key.split(':')
    return await fetchSceneFromDB(projectId, sceneId)
  }
})

export const brainValidationCache = new MultiLayerCache<any>({
  namespace: 'brain:validation',
  l1MaxSize: 100,
  l1TTL: 300000,     // 5 minutes
  l2TTL: 86400,      // 24 hours
  l3Fetcher: async (key) => {
    const [entityType, entityId] = key.split(':')
    return await fetchBrainValidation(entityType, entityId)
  }
})

// Helper functions (to be implemented)
async function fetchCharacterFromDB(projectId: string, characterId: string): Promise<any> {
  // Implement database fetch
  return null
}

async function fetchSceneFromDB(projectId: string, sceneId: string): Promise<any> {
  // Implement database fetch
  return null
}

async function fetchBrainValidation(entityType: string, entityId: string): Promise<any> {
  // Implement Brain validation fetch
  return null
}
```

**Cache Strategy by Data Type**:

| Data Type | L1 TTL | L2 TTL | L3 Source | Cache Key |
|-----------|--------|--------|-----------|-----------|
| Character/Scene | 1 min | 1 hour | MongoDB | `project:{id}:character:{id}` |
| Brain Validation | 5 min | 24 hours | Neo4j | `brain:validation:{type}:{id}` |
| Media URLs | 5 min | 7 days | R2 | `media:url:{id}` |
| Agent Outputs | N/A | N/A | N/A | No cache (always fresh) |
| Quality Metrics | 1 min | 30 min | Computed | `project:{id}:quality` |

---

### 5. Performance Monitoring Architecture

**Location**: `/src/lib/monitoring/`

#### 5.1 Metrics Collection (`metrics.ts`)

```typescript
/**
 * Performance Metrics Collection
 * Tracks API response times, agent execution, cache hit rates, errors
 */

interface MetricPoint {
  name: string
  value: number
  timestamp: Date
  tags: Record<string, string>
}

interface MetricsSummary {
  apiResponseTimes: {
    p50: number
    p95: number
    p99: number
    average: number
  }
  agentExecutionTimes: {
    p50: number
    p95: number
    p99: number
    average: number
  }
  cacheHitRate: number
  errorRate: number
  requestsPerMinute: number
}

export class MetricsCollector {
  private metrics: MetricPoint[]
  private maxMetrics: number

  constructor(maxMetrics: number = 10000) {
    this.metrics = []
    this.maxMetrics = maxMetrics
  }

  /**
   * Record metric
   */
  record(name: string, value: number, tags: Record<string, string> = {}) {
    this.metrics.push({
      name,
      value,
      timestamp: new Date(),
      tags
    })

    // Trim if exceeded max
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics)
    }
  }

  /**
   * Get metrics summary
   */
  getSummary(since?: Date): MetricsSummary {
    const cutoff = since || new Date(Date.now() - 3600000)  // Last hour
    const recentMetrics = this.metrics.filter(m => m.timestamp >= cutoff)

    return {
      apiResponseTimes: this.calculatePercentiles(
        recentMetrics.filter(m => m.name === 'api.response_time')
      ),
      agentExecutionTimes: this.calculatePercentiles(
        recentMetrics.filter(m => m.name === 'agent.execution_time')
      ),
      cacheHitRate: this.calculateCacheHitRate(recentMetrics),
      errorRate: this.calculateErrorRate(recentMetrics),
      requestsPerMinute: this.calculateRequestsPerMinute(recentMetrics)
    }
  }

  /**
   * Calculate percentiles
   */
  private calculatePercentiles(metrics: MetricPoint[]) {
    if (metrics.length === 0) {
      return { p50: 0, p95: 0, p99: 0, average: 0 }
    }

    const values = metrics.map(m => m.value).sort((a, b) => a - b)
    const p50 = values[Math.floor(values.length * 0.5)]
    const p95 = values[Math.floor(values.length * 0.95)]
    const p99 = values[Math.floor(values.length * 0.99)]
    const average = values.reduce((sum, v) => sum + v, 0) / values.length

    return { p50, p95, p99, average }
  }

  /**
   * Calculate cache hit rate
   */
  private calculateCacheHitRate(metrics: MetricPoint[]): number {
    const hits = metrics.filter(m => m.name === 'cache.hit').length
    const misses = metrics.filter(m => m.name === 'cache.miss').length
    const total = hits + misses

    return total > 0 ? hits / total : 0
  }

  /**
   * Calculate error rate
   */
  private calculateErrorRate(metrics: MetricPoint[]): number {
    const errors = metrics.filter(m => m.name === 'error').length
    const requests = metrics.filter(m => m.name === 'api.request').length

    return requests > 0 ? errors / requests : 0
  }

  /**
   * Calculate requests per minute
   */
  private calculateRequestsPerMinute(metrics: MetricPoint[]): number {
    const requests = metrics.filter(m => m.name === 'api.request')
    if (requests.length === 0) return 0

    const oldest = requests[0].timestamp.getTime()
    const newest = requests[requests.length - 1].timestamp.getTime()
    const minutes = (newest - oldest) / 60000

    return minutes > 0 ? requests.length / minutes : 0
  }
}

// Singleton instance
let metricsInstance: MetricsCollector | null = null

export function getMetrics(): MetricsCollector {
  if (!metricsInstance) {
    metricsInstance = new MetricsCollector()
  }
  return metricsInstance
}

// Metric recording helpers
export function recordApiResponse(route: string, duration: number) {
  getMetrics().record('api.response_time', duration, { route })
  getMetrics().record('api.request', 1, { route })
}

export function recordAgentExecution(agentType: string, duration: number) {
  getMetrics().record('agent.execution_time', duration, { agentType })
}

export function recordCacheHit(cacheLayer: 'L1' | 'L2' | 'L3') {
  getMetrics().record('cache.hit', 1, { layer: cacheLayer })
}

export function recordCacheMiss() {
  getMetrics().record('cache.miss', 1, {})
}

export function recordError(route: string, errorType: string) {
  getMetrics().record('error', 1, { route, errorType })
}
```

#### 5.2 Health Check System (`healthCheck.ts`)

```typescript
/**
 * Health Check Endpoints
 * Monitors database connectivity, Redis, Brain service, external APIs
 */

interface HealthCheckResult {
  healthy: boolean
  component: string
  responseTime: number
  error?: string
  details?: any
}

interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: Date
  checks: HealthCheckResult[]
}

export class HealthChecker {
  /**
   * Check all system components
   */
  async checkAll(): Promise<SystemHealth> {
    const checks = await Promise.all([
      this.checkMongoDB(),
      this.checkRedis(),
      this.checkNeo4j(),
      this.checkR2Storage(),
      this.checkFalAI(),
      this.checkDiskSpace()
    ])

    const unhealthy = checks.filter(c => !c.healthy).length
    const overall = unhealthy === 0 ? 'healthy' :
                    unhealthy <= 2 ? 'degraded' :
                    'unhealthy'

    return {
      overall,
      timestamp: new Date(),
      checks
    }
  }

  /**
   * Check MongoDB connectivity
   */
  private async checkMongoDB(): Promise<HealthCheckResult> {
    const startTime = Date.now()

    try {
      // Implement MongoDB ping
      await mongoClient.db().admin().ping()

      return {
        healthy: true,
        component: 'mongodb',
        responseTime: Date.now() - startTime
      }
    } catch (error) {
      return {
        healthy: false,
        component: 'mongodb',
        responseTime: Date.now() - startTime,
        error: (error as Error).message
      }
    }
  }

  /**
   * Check Redis connectivity
   */
  private async checkRedis(): Promise<HealthCheckResult> {
    const startTime = Date.now()

    try {
      await getRedisClient().client.ping()

      return {
        healthy: true,
        component: 'redis',
        responseTime: Date.now() - startTime
      }
    } catch (error) {
      return {
        healthy: false,
        component: 'redis',
        responseTime: Date.now() - startTime,
        error: (error as Error).message
      }
    }
  }

  /**
   * Check Neo4j Brain connectivity
   */
  private async checkNeo4j(): Promise<HealthCheckResult> {
    const startTime = Date.now()

    try {
      // Implement Neo4j health check
      const session = neo4jDriver.session()
      await session.run('RETURN 1')
      await session.close()

      return {
        healthy: true,
        component: 'neo4j',
        responseTime: Date.now() - startTime
      }
    } catch (error) {
      return {
        healthy: false,
        component: 'neo4j',
        responseTime: Date.now() - startTime,
        error: (error as Error).message
      }
    }
  }

  /**
   * Check Cloudflare R2 storage
   */
  private async checkR2Storage(): Promise<HealthCheckResult> {
    const startTime = Date.now()

    try {
      // Implement R2 health check (list buckets)
      await r2Client.s3Client.send(new ListBucketsCommand({}))

      return {
        healthy: true,
        component: 'r2_storage',
        responseTime: Date.now() - startTime
      }
    } catch (error) {
      return {
        healthy: false,
        component: 'r2_storage',
        responseTime: Date.now() - startTime,
        error: (error as Error).message
      }
    }
  }

  /**
   * Check FAL.ai API health
   */
  private async checkFalAI(): Promise<HealthCheckResult> {
    const startTime = Date.now()

    try {
      // Implement FAL.ai health check (list models or status endpoint)
      const response = await fetch('https://fal.run/health', {
        headers: { Authorization: `Bearer ${process.env.FAL_API_KEY}` }
      })

      if (!response.ok) throw new Error(`HTTP ${response.status}`)

      return {
        healthy: true,
        component: 'fal_ai',
        responseTime: Date.now() - startTime
      }
    } catch (error) {
      return {
        healthy: false,
        component: 'fal_ai',
        responseTime: Date.now() - startTime,
        error: (error as Error).message
      }
    }
  }

  /**
   * Check disk space
   */
  private async checkDiskSpace(): Promise<HealthCheckResult> {
    const startTime = Date.now()

    try {
      // Implement disk space check
      const diskSpace = await getDiskSpace()
      const freePercent = (diskSpace.free / diskSpace.total) * 100

      return {
        healthy: freePercent > 10,  // Unhealthy if < 10% free
        component: 'disk_space',
        responseTime: Date.now() - startTime,
        details: {
          total: diskSpace.total,
          free: diskSpace.free,
          freePercent: freePercent.toFixed(2) + '%'
        }
      }
    } catch (error) {
      return {
        healthy: false,
        component: 'disk_space',
        responseTime: Date.now() - startTime,
        error: (error as Error).message
      }
    }
  }
}

// Health check API route
// GET /api/v1/health
export async function healthCheckHandler() {
  const checker = new HealthChecker()
  const health = await checker.checkAll()

  return NextResponse.json(health, {
    status: health.overall === 'healthy' ? 200 :
            health.overall === 'degraded' ? 500 :
            503
  })
}

// Helper function to get disk space
async function getDiskSpace(): Promise<{ total: number, free: number }> {
  // Implement using fs.statfs or similar
  return { total: 100000000000, free: 50000000000 }
}
```

---

## Performance Targets

### API Response Times

| Endpoint | Target (p95) | Max (p99) |
|----------|--------------|-----------|
| GET /api/v1/projects | <200ms | <500ms |
| GET /api/v1/projects/[id] | <150ms | <300ms |
| POST /api/v1/chat | <2000ms | <5000ms |
| GET /api/v1/media/[id] | <100ms | <200ms |
| POST /api/v1/generate | <3000ms | <10000ms |

### Agent Execution Times

| Agent Type | Target | Max |
|------------|--------|-----|
| Character Creator | <30s | <60s |
| Story Generator | <45s | <90s |
| Image Generator | <60s | <120s |
| Video Generator | <90s | <180s |

### Cache Performance

| Metric | Target |
|--------|--------|
| L1 Hit Rate | >80% |
| L2 Hit Rate | >90% |
| L3 Fetch Time | <500ms |

### System Resources

| Resource | Target | Alert Threshold |
|----------|--------|-----------------|
| CPU Usage | <70% | >85% |
| Memory Usage | <80% | >90% |
| Disk Space | >20% free | <10% free |
| Redis Memory | <1GB | >1.5GB |

---

## Error Handling Architecture

**Location**: `/src/lib/errors/`

### Error Boundary

```typescript
/**
 * React Error Boundary
 * Catches and handles React component errors gracefully
 */

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: Error, reset: () => void }>
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  { hasError: boolean; error: Error | null }
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error boundary caught error:', error, errorInfo)
    // Log to error tracking service (e.g., Sentry)
  }

  reset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback
        return <FallbackComponent error={this.state.error} reset={this.reset} />
      }

      return <DefaultErrorFallback error={this.state.error} reset={this.reset} />
    }

    return this.props.children
  }
}

function DefaultErrorFallback({ error, reset }: { error: Error, reset: () => void }) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="max-w-md p-6 bg-white rounded-lg shadow">
        <h2 className="text-2xl font-bold text-red-600 mb-4">
          Something went wrong
        </h2>
        <p className="text-gray-700 mb-4">
          {error.message || 'An unexpected error occurred'}
        </p>
        <button onClick={reset} className="btn-primary">
          Try again
        </button>
      </div>
    </div>
  )
}
```

### Error Classification and Handling

```typescript
/**
 * Centralized Error Handler
 * Classifies errors, logs, and determines appropriate response
 */

export class ApplicationError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public isOperational: boolean = true
  ) {
    super(message)
    this.name = this.constructor.name
    Error.captureStackTrace(this, this.constructor)
  }
}

export class ValidationError extends ApplicationError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 400)
  }
}

export class AuthenticationError extends ApplicationError {
  constructor(message: string = 'Authentication required') {
    super(message, 'AUTHENTICATION_ERROR', 401)
  }
}

export class AuthorizationError extends ApplicationError {
  constructor(message: string = 'Access denied') {
    super(message, 'AUTHORIZATION_ERROR', 403)
  }
}

export class NotFoundError extends ApplicationError {
  constructor(resource: string) {
    super(`${resource} not found`, 'NOT_FOUND', 404)
  }
}

export class RateLimitError extends ApplicationError {
  constructor() {
    super('Rate limit exceeded', 'RATE_LIMIT_EXCEEDED', 429)
  }
}

export class ExternalServiceError extends ApplicationError {
  constructor(service: string, message: string) {
    super(`${service}: ${message}`, 'EXTERNAL_SERVICE_ERROR', 502)
  }
}

/**
 * Error handler middleware
 */
export function errorHandler(error: Error, req: Request): Response {
  // Log error
  console.error('Error:', error)

  // Classify error
  if (error instanceof ApplicationError) {
    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message
        }
      },
      { status: error.statusCode }
    )
  }

  // Unknown error
  return NextResponse.json(
    {
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred'
      }
    },
    { status: 500 }
  )
}

/**
 * Automatic retry with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number
    initialDelay?: number
    maxDelay?: number
    backoffMultiplier?: number
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 30000,
    backoffMultiplier = 2
  } = options

  let lastError: Error

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error

      if (attempt < maxRetries) {
        const delay = Math.min(
          initialDelay * Math.pow(backoffMultiplier, attempt),
          maxDelay
        )

        console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError!
}
```

---

## Production Optimizations

### Code Splitting

```typescript
// Dynamic imports for heavy components
const Timeline = dynamic(() => import('./Timeline'), {
  loading: () => <TimelineSkeleton />,
  ssr: false
})

const QualityDashboard = dynamic(() => import('./QualityDashboard'), {
  loading: () => <DashboardSkeleton />
})

// Route-based code splitting (automatic in Next.js App Router)
// Each route in app/ directory is automatically code-split
```

### Image Optimization

```typescript
// Next.js Image component with automatic optimization
import Image from 'next/image'

export function OptimizedImage({ src, alt }: { src: string, alt: string }) {
  return (
    <Image
      src={src}
      alt={alt}
      width={800}
      height={600}
      placeholder="blur"
      blurDataURL={generateBlurDataURL(src)}
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      loading="lazy"
    />
  )
}
```

### API Route Optimization

```typescript
// Response streaming for large payloads
export async function GET(req: Request) {
  const stream = new ReadableStream({
    async start(controller) {
      const data = await fetchLargeData()

      for (const chunk of data) {
        controller.enqueue(JSON.stringify(chunk) + '\n')
      }

      controller.close()
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson',
      'Transfer-Encoding': 'chunked'
    }
  })
}
```

### Database Query Optimization

```typescript
// Indexes for common queries
await projectsCollection.createIndex({ createdBy: 1, createdAt: -1 })
await charactersCollection.createIndex({ projectId: 1, name: 1 })
await mediaCollection.createIndex({ projectId: 1, type: 1, createdAt: -1 })

// Query projections (fetch only needed fields)
const project = await projectsCollection.findOne(
  { _id: projectId },
  { projection: { name: 1, createdBy: 1, createdAt: 1 } }
)

// Aggregation pipelines for complex queries
const stats = await projectsCollection.aggregate([
  { $match: { createdBy: userId } },
  { $group: {
      _id: '$status',
      count: { $sum: 1 }
    }
  }
]).toArray()
```

### Bundle Size Reduction

```typescript
// next.config.js
module.exports = {
  // Enable compression
  compress: true,

  // Analyze bundle size
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false
      }
    }

    return config
  },

  // Optimize packages
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons']
  }
}
```

---

## Deployment Considerations

### Environment Variables

```bash
# Phase 7 Production Environment Variables

# Application
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://aladdin.app

# Agent Pool
AGENT_MAX_CONCURRENT=5
AGENT_TIMEOUT_MS=120000
AGENT_QUEUE_STRATEGY=priority

# Redis Cache
REDIS_URL=redis://prod-redis:6379
REDIS_KEY_PREFIX=aladdin:prod:
REDIS_DEFAULT_TTL=3600

# Performance Monitoring
ENABLE_METRICS=true
METRICS_RETENTION_HOURS=24
HEALTH_CHECK_INTERVAL_MS=30000

# Error Handling
ERROR_RETRY_ATTEMPTS=3
ERROR_RETRY_DELAY_MS=1000
ENABLE_ERROR_TRACKING=true
SENTRY_DSN=https://...

# Optimization Flags
ENABLE_CODE_SPLITTING=true
ENABLE_IMAGE_OPTIMIZATION=true
ENABLE_RESPONSE_STREAMING=true
ENABLE_MULTI_LAYER_CACHE=true
```

### Infrastructure Requirements

```yaml
# Deployment infrastructure

# Application Server
app_server:
  cpu: 4 cores
  memory: 8GB
  disk: 50GB SSD

# Redis Cache
redis:
  version: 7.0+
  memory: 2GB
  persistence: RDB + AOF

# Monitoring
monitoring:
  metrics_retention: 30 days
  log_retention: 7 days
  alerting: enabled

# Scaling
autoscaling:
  min_instances: 2
  max_instances: 10
  target_cpu: 70%
  target_memory: 80%
```

---

## Success Criteria

### Phase 7 Complete When:

- [ ] All UI components responsive (mobile, tablet, desktop)
- [ ] ProjectSidebar, Timeline, QualityDashboard functional
- [ ] Agent pool management operational (3-5 concurrent)
- [ ] Multi-layer caching working (L1+L2+L3)
- [ ] Performance metrics collection active
- [ ] Health check endpoints operational
- [ ] Error boundaries catching and handling errors
- [ ] API response times meet targets (<200ms p95)
- [ ] Cache hit rates >80% (L1), >90% (L2)
- [ ] Code splitting and bundle optimization implemented
- [ ] Image optimization working
- [ ] Database queries optimized with indexes
- [ ] Production deployment successful
- [ ] Performance monitoring dashboard live
- [ ] Error tracking and alerting configured

---

## Integration with Previous Phases

### Phase 1-3 (Foundation + Brain)
- Multi-layer cache integrated with MongoDB and Neo4j
- Health checks monitor all databases
- Error handling for Brain validation failures

### Phase 4 (Multi-Department Agents)
- Agent pool manages all department heads and specialists
- Performance metrics track agent execution times
- Queue prioritization by department

### Phase 5-6 (Media Generation)
- Cache stores generated media URLs (7-day TTL)
- Timeline component displays video clips
- Quality dashboard shows media generation metrics

---

## Future Enhancements (Phase 8+)

### Advanced Monitoring
- Real-time performance dashboards
- Predictive alerting (ML-based anomaly detection)
- Distributed tracing across services

### Advanced Caching
- Edge caching with Cloudflare Workers
- Predictive cache warming
- Cache stampede prevention

### UI/UX
- Keyboard shortcuts and power user features
- Customizable dashboard layouts
- Collaborative editing with real-time sync

---

## Conclusion

Phase 7 transforms Aladdin from a functional prototype into a production-ready, enterprise-grade platform. The architecture focuses on:

1. **User Experience**: Responsive, mobile-first UI with intuitive navigation
2. **Performance**: Multi-layer caching, agent pool management, optimized queries
3. **Reliability**: Error boundaries, health checks, automatic retry mechanisms
4. **Observability**: Comprehensive metrics, monitoring, and alerting
5. **Scalability**: Code splitting, resource optimization, autoscaling support

This architecture enables Aladdin to handle production workloads efficiently while providing an excellent user experience across all devices.

---

**Architecture Status**: ✅ DESIGN COMPLETE - Ready for Implementation

**Next Steps**:
1. Review architecture with team
2. Begin Week 25 UI component implementation
3. Implement agent pool manager
4. Set up Redis and multi-layer cache
5. Implement performance monitoring
6. Deploy to production environment
7. Monitor and optimize based on real usage

---

**Architect**: System Architecture Designer (Hive Mind Swarm)
**Reviewed By**: [Pending]
**Approved By**: [Pending]
**Implementation Start**: Week 25
