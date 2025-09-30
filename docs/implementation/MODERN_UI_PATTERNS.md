# Modern UI/UX Patterns for Aladdin

**Version**: 2.0.0  
**Last Updated**: January 30, 2025

---

## Design System Foundation

### Color Palette

```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        // Primary - Purple/Indigo for AI/Magic theme
        primary: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
        },
        // Accent - Cyan for highlights
        accent: {
          50: '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63',
        },
        // Quality indicators
        quality: {
          excellent: '#10b981', // Green
          good: '#f59e0b',      // Yellow
          acceptable: '#f97316', // Orange
          poor: '#ef4444',      // Red
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
}
```

---

## Component Library Structure

### 1. Chat Interface Components

#### Main Chat Container

```typescript
// components/chat/ChatContainer.tsx
'use client'

import { useState } from 'react'
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable'
import { ChatMessages } from './ChatMessages'
import { ChatInput } from './ChatInput'
import { ProjectSidebar } from './ProjectSidebar'
import { ContentInspector } from './ContentInspector'

export function ChatContainer({ projectId }: { projectId: string }) {
  const [selectedContent, setSelectedContent] = useState(null)
  
  return (
    <div className="h-screen flex flex-col">
      {/* Top Bar */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center px-4">
          <h1 className="text-lg font-semibold">Project Chat</h1>
          <div className="ml-auto flex items-center gap-2">
            <PresenceIndicator projectId={projectId} />
            <QualityBadge projectId={projectId} />
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

#### Enhanced Message Component

```typescript
// components/chat/Message.tsx
'use client'

import { motion } from 'framer-motion'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Bot, User } from 'lucide-react'
import { ContentPreviewCard } from './ContentPreviewCard'

interface MessageProps {
  role: 'user' | 'assistant' | 'system'
  content: string
  agentId?: string
  contentCards?: any[]
  timestamp: Date
  isStreaming?: boolean
}

export function Message({ 
  role, 
  content, 
  agentId, 
  contentCards, 
  timestamp,
  isStreaming 
}: MessageProps) {
  const isUser = role === 'user'
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex gap-3 p-4",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar */}
      <Avatar className="h-8 w-8">
        {isUser ? (
          <>
            <AvatarImage src="/user-avatar.png" />
            <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
          </>
        ) : (
          <>
            <AvatarImage src="/ai-avatar.png" />
            <AvatarFallback><Bot className="h-4 w-4" /></AvatarFallback>
          </>
        )}
      </Avatar>
      
      {/* Content */}
      <div className={cn("flex-1 space-y-2", isUser && "flex flex-col items-end")}>
        {/* Header */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            {isUser ? 'You' : agentId || 'AI Assistant'}
          </span>
          <span className="text-xs text-muted-foreground">
            {timestamp.toLocaleTimeString()}
          </span>
        </div>
        
        {/* Message Content */}
        <div className={cn(
          "rounded-lg px-4 py-2",
          isUser 
            ? "bg-primary text-primary-foreground" 
            : "bg-muted"
        )}>
          <p className="text-sm whitespace-pre-wrap">{content}</p>
          {isStreaming && <span className="animate-pulse">▊</span>}
        </div>
        
        {/* Content Cards */}
        {contentCards && contentCards.length > 0 && (
          <div className="space-y-2 mt-2">
            {contentCards.map((card, idx) => (
              <ContentPreviewCard key={idx} {...card} />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}
```

#### Smart Chat Input

```typescript
// components/chat/ChatInput.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { 
  Send, 
  Paperclip, 
  Mic, 
  Sparkles,
  Loader2 
} from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

export function ChatInput({ projectId }: { projectId: string }) {
  const [message, setMessage] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  const sendMessage = useMutation({
    mutationFn: async (content: string) => {
      const res = await fetch(`/api/v1/projects/${projectId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      })
      if (!res.ok) throw new Error('Failed to send message')
      return res.json()
    },
    onSuccess: () => {
      setMessage('')
      toast.success('Message sent')
    },
    onError: () => {
      toast.error('Failed to send message')
    }
  })
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return
    sendMessage.mutate(message)
  }
  
  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }, [message])
  
  return (
    <div className="border-t bg-background p-4">
      <form onSubmit={handleSubmit} className="flex gap-2">
        {/* Quick Actions */}
        <div className="flex gap-1">
          <Button type="button" variant="ghost" size="icon">
            <Paperclip className="h-4 w-4" />
          </Button>
          <Button 
            type="button" 
            variant="ghost" 
            size="icon"
            onClick={() => setIsRecording(!isRecording)}
          >
            <Mic className={isRecording ? "h-4 w-4 text-red-500" : "h-4 w-4"} />
          </Button>
        </div>
        
        {/* Input */}
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message... (Shift+Enter for new line)"
          className="min-h-[44px] max-h-[200px] resize-none"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSubmit(e)
            }
          }}
        />
        
        {/* Send Button */}
        <Button 
          type="submit" 
          size="icon"
          disabled={!message.trim() || sendMessage.isPending}
        >
          {sendMessage.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>
      
      {/* AI Suggestions */}
      <div className="mt-2 flex flex-wrap gap-2">
        <Button variant="outline" size="sm" className="h-7 text-xs">
          <Sparkles className="mr-1 h-3 w-3" />
          Add a character
        </Button>
        <Button variant="outline" size="sm" className="h-7 text-xs">
          <Sparkles className="mr-1 h-3 w-3" />
          Create a scene
        </Button>
        <Button variant="outline" size="sm" className="h-7 text-xs">
          <Sparkles className="mr-1 h-3 w-3" />
          Generate images
        </Button>
      </div>
    </div>
  )
}
```

---

## 2. Project Sidebar Components

### Dynamic Content Tree

```typescript
// components/chat/ProjectSidebar.tsx
'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ChevronRight, 
  ChevronDown,
  Users,
  Film,
  Image,
  Video,
  MapPin,
  Plus
} from 'lucide-react'
import { cn } from '@/lib/utils'

export function ProjectSidebar({ 
  projectId, 
  onSelectContent 
}: { 
  projectId: string
  onSelectContent: (content: any) => void
}) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['characters', 'scenes'])
  )
  
  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => fetch(`/api/v1/projects/${projectId}`).then(r => r.json())
  })
  
  const sections = [
    { 
      id: 'characters', 
      label: 'Characters', 
      icon: Users,
      count: project?.stats?.characters || 0
    },
    { 
      id: 'scenes', 
      label: 'Scenes', 
      icon: Film,
      count: project?.stats?.scenes || 0
    },
    { 
      id: 'locations', 
      label: 'Locations', 
      icon: MapPin,
      count: project?.stats?.locations || 0
    },
    { 
      id: 'images', 
      label: 'Images', 
      icon: Image,
      count: project?.stats?.images || 0
    },
    { 
      id: 'videos', 
      label: 'Videos', 
      icon: Video,
      count: project?.stats?.videos || 0
    },
  ]
  
  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev)
      if (next.has(sectionId)) {
        next.delete(sectionId)
      } else {
        next.add(sectionId)
      }
      return next
    })
  }
  
  return (
    <div className="flex flex-col h-full border-r">
      {/* Header */}
      <div className="p-4 border-b">
        <h2 className="font-semibold text-sm">Project Content</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Phase: {project?.phase || 'Expansion'}
        </p>
      </div>
      
      {/* Content Tree */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {sections.map(section => (
            <div key={section.id}>
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => toggleSection(section.id)}
              >
                {expandedSections.has(section.id) ? (
                  <ChevronDown className="mr-2 h-4 w-4" />
                ) : (
                  <ChevronRight className="mr-2 h-4 w-4" />
                )}
                <section.icon className="mr-2 h-4 w-4" />
                <span className="flex-1 text-left">{section.label}</span>
                <Badge variant="secondary" className="ml-auto">
                  {section.count}
                </Badge>
              </Button>
              
              {expandedSections.has(section.id) && (
                <SectionContent 
                  projectId={projectId}
                  sectionId={section.id}
                  onSelect={onSelectContent}
                />
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
      
      {/* Quick Actions */}
      <div className="p-2 border-t space-y-1">
        <Button variant="outline" size="sm" className="w-full justify-start">
          <Plus className="mr-2 h-4 w-4" />
          Add Character
        </Button>
        <Button variant="outline" size="sm" className="w-full justify-start">
          <Plus className="mr-2 h-4 w-4" />
          Add Scene
        </Button>
      </div>
    </div>
  )
}
```

---

## Continue with more patterns...

