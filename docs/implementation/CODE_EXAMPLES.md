# Code Examples - Ready to Use

**Version**: 2.0.0  
**Last Updated**: January 30, 2025

---

## Quick Reference: Copy-Paste Ready Code

### 1. Tailwind Config with Custom Theme

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
          50: '#f5f3ff',
          100: '#ede9fe',
          500: '#8b5cf6',
          600: '#7c3aed',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        quality: {
          excellent: '#10b981',
          good: '#f59e0b',
          acceptable: '#f97316',
          poor: '#ef4444',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
```

---

### 2. React Query Provider Setup

```typescript
// app/providers.tsx
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
            retry: 1,
          },
          mutations: {
            retry: 1,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
```

```typescript
// app/layout.tsx
import { Providers } from './providers'
import { Toaster } from 'sonner'
import './globals.css'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          {children}
          <Toaster position="top-right" />
        </Providers>
      </body>
    </html>
  )
}
```

---

### 3. Complete Chat Interface

```typescript
// app/dashboard/project/[id]/chat/page.tsx
import { Suspense } from 'react'
import { ChatContainer } from '@/components/chat/ChatContainer'
import { ChatSkeleton } from '@/components/chat/ChatSkeleton'

export default function ChatPage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<ChatSkeleton />}>
      <ChatContainer projectId={params.id} />
    </Suspense>
  )
}
```

```typescript
// components/chat/ChatContainer.tsx
'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable'
import { ChatMessages } from './ChatMessages'
import { ChatInput } from './ChatInput'
import { ProjectSidebar } from './ProjectSidebar'
import { ContentInspector } from './ContentInspector'
import { PresenceIndicator } from './PresenceIndicator'
import { QualityBadge } from './QualityBadge'

export function ChatContainer({ projectId }: { projectId: string }) {
  const [selectedContent, setSelectedContent] = useState<any>(null)

  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const res = await fetch(`/api/v1/projects/${projectId}`)
      if (!res.ok) throw new Error('Failed to fetch project')
      return res.json()
    },
  })

  return (
    <div className="h-screen flex flex-col">
      {/* Top Bar */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center px-4">
          <h1 className="text-lg font-semibold">{project?.name || 'Loading...'}</h1>
          <div className="ml-auto flex items-center gap-2">
            <PresenceIndicator projectId={projectId} />
            <QualityBadge score={project?.overallQuality || 0} />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* Sidebar */}
        <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
          <ProjectSidebar
            projectId={projectId}
            onSelectContent={setSelectedContent}
          />
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Chat Area */}
        <ResizablePanel defaultSize={selectedContent ? 50 : 80}>
          <div className="flex flex-col h-full">
            <ChatMessages projectId={projectId} />
            <ChatInput projectId={projectId} />
          </div>
        </ResizablePanel>

        {/* Inspector Panel (conditional) */}
        {selectedContent && (
          <>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={30} minSize={20}>
              <ContentInspector
                content={selectedContent}
                onClose={() => setSelectedContent(null)}
              />
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
    </div>
  )
}
```

---

### 4. Streaming Message Component

```typescript
// components/chat/StreamingMessage.tsx
'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface StreamingMessageProps {
  messageId: string
  className?: string
}

export function StreamingMessage({ messageId, className }: StreamingMessageProps) {
  const [content, setContent] = useState('')
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    const eventSource = new EventSource(`/api/v1/messages/${messageId}/stream`)

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data)

      if (data.type === 'token') {
        setContent((prev) => prev + data.content)
      } else if (data.type === 'done') {
        setIsComplete(true)
        eventSource.close()
      }
    }

    eventSource.onerror = () => {
      eventSource.close()
      setIsComplete(true)
    }

    return () => eventSource.close()
  }, [messageId])

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('prose prose-sm max-w-none dark:prose-invert', className)}
    >
      <div dangerouslySetInnerHTML={{ __html: content }} />
      {!isComplete && (
        <span className="inline-block w-2 h-4 ml-1 bg-current animate-pulse">
          ▊
        </span>
      )}
    </motion.div>
  )
}
```

---

### 5. Content Preview Card

```typescript
// components/chat/ContentPreviewCard.tsx
'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, X, Edit, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface ContentPreviewCardProps {
  type: 'character' | 'scene' | 'location'
  data: any
  qualityRating: number
  brainValidated: boolean
  onIngest: () => void
  onModify: () => void
  onDiscard: () => void
}

export function ContentPreviewCard({
  type,
  data,
  qualityRating,
  brainValidated,
  onIngest,
  onModify,
  onDiscard,
}: ContentPreviewCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const qualityColor =
    qualityRating >= 0.9
      ? 'bg-quality-excellent'
      : qualityRating >= 0.75
      ? 'bg-quality-good'
      : qualityRating >= 0.6
      ? 'bg-quality-acceptable'
      : 'bg-quality-poor'

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="border-2 border-primary/20 hover:border-primary/40 transition-colors">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="capitalize">
                {type}
              </Badge>
              {brainValidated && (
                <Badge variant="secondary" className="text-xs">
                  ✓ Brain Validated
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className={cn('w-2 h-2 rounded-full', qualityColor)} />
              <span className="text-sm font-medium">
                {(qualityRating * 100).toFixed(0)}%
              </span>
            </div>
          </div>
          <h3 className="text-lg font-semibold mt-2">{data.name}</h3>
        </CardHeader>

        <CardContent>
          <p className={cn('text-sm text-muted-foreground', !isExpanded && 'line-clamp-3')}>
            {data.description || data.content?.description || 'No description available'}
          </p>

          {data.content && Object.keys(data.content).length > 1 && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 w-full"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="mr-2 h-4 w-4" />
                  Show Less
                </>
              ) : (
                <>
                  <ChevronDown className="mr-2 h-4 w-4" />
                  Show More
                </>
              )}
            </Button>
          )}

          {isExpanded && data.content && (
            <div className="mt-4 space-y-2 text-sm">
              {Object.entries(data.content).map(([key, value]) => (
                <div key={key}>
                  <span className="font-medium capitalize">{key}: </span>
                  <span className="text-muted-foreground">
                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>

        <CardFooter className="flex gap-2">
          <Button onClick={onIngest} className="flex-1" size="sm">
            <Check className="mr-2 h-4 w-4" />
            Ingest
          </Button>
          <Button onClick={onModify} variant="outline" className="flex-1" size="sm">
            <Edit className="mr-2 h-4 w-4" />
            Modify
          </Button>
          <Button onClick={onDiscard} variant="destructive" className="flex-1" size="sm">
            <X className="mr-2 h-4 w-4" />
            Discard
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  )
}
```

---

### 6. API Route with Streaming

```typescript
// app/api/v1/messages/[id]/stream/route.ts
import { NextRequest } from 'next/server'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Simulate streaming response
        const message = 'This is a streaming response from the AI agent...'
        const words = message.split(' ')

        for (const word of words) {
          const data = JSON.stringify({
            type: 'token',
            content: word + ' ',
          })
          controller.enqueue(encoder.encode(`data: ${data}\n\n`))
          await new Promise((resolve) => setTimeout(resolve, 100))
        }

        const done = JSON.stringify({ type: 'done' })
        controller.enqueue(encoder.encode(`data: ${done}\n\n`))
      } catch (error) {
        controller.error(error)
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
```

---

## More examples available in the full documentation!

