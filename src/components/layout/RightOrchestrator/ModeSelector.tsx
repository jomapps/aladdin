/**
 * ModeSelector Component
 * 4-tab mode selector for orchestrator
 */

'use client'

import { Search, Upload, Zap, MessageCircle } from 'lucide-react'
import { useLayoutStore, OrchestratorMode } from '@/stores/layoutStore'
import { cn } from '@/lib/utils'

const modes: Array<{
  id: OrchestratorMode
  label: string
  icon: React.ComponentType<{ className?: string }>
  description: string
}> = [
  {
    id: 'chat',
    label: 'Chat',
    icon: MessageCircle,
    description: 'General conversation',
  },
  {
    id: 'query',
    label: 'Query',
    icon: Search,
    description: 'Ask questions about your project',
  },
  {
    id: 'task',
    label: 'Task',
    icon: Zap,
    description: 'Execute project tasks',
  },
  {
    id: 'data',
    label: 'Uploads',
    icon: Upload,
    description: 'Upload and ingest project data',
  },
]

export default function ModeSelector() {
  const { orchestratorMode, setOrchestratorMode } = useLayoutStore()

  return (
    <div className="flex border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
      {modes.map((mode) => {
        const Icon = mode.icon
        const isActive = orchestratorMode === mode.id

        return (
          <button
            key={mode.id}
            onClick={() => setOrchestratorMode(mode.id)}
            className={cn(
              'flex-1 flex flex-col items-center gap-1.5 py-3 text-xs font-medium transition-all border-b-2',
              isActive
                ? 'border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-950'
                : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800',
            )}
            title={mode.description}
          >
            <Icon className="h-4 w-4" />
            {mode.label}
          </button>
        )
      })}
    </div>
  )
}
