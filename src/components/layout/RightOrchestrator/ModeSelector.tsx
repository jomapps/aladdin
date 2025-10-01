/**
 * ModeSelector Component
 * 4-tab mode selector for orchestrator
 */

'use client'

import { Search, Database, Zap, MessageCircle } from 'lucide-react'
import { useLayoutStore, OrchestratorMode } from '@/stores/layoutStore'
import { cn } from '@/lib/utils'

const modes: Array<{
  id: OrchestratorMode
  label: string
  icon: React.ComponentType<{ className?: string }>
  description: string
  color: string
}> = [
  {
    id: 'query',
    label: 'Query',
    icon: Search,
    description: 'Ask questions about your project',
    color: 'text-purple-600 border-purple-600 bg-purple-50',
  },
  {
    id: 'data',
    label: 'Data',
    icon: Database,
    description: 'Add or update project data',
    color: 'text-green-600 border-green-600 bg-green-50',
  },
  {
    id: 'task',
    label: 'Task',
    icon: Zap,
    description: 'Execute project tasks',
    color: 'text-orange-600 border-orange-600 bg-orange-50',
  },
  {
    id: 'chat',
    label: 'Chat',
    icon: MessageCircle,
    description: 'General conversation',
    color: 'text-indigo-600 border-indigo-600 bg-indigo-50',
  },
]

export default function ModeSelector() {
  const { orchestratorMode, setOrchestratorMode } = useLayoutStore()

  return (
    <div className="flex border-b">
      {modes.map((mode) => {
        const Icon = mode.icon
        const isActive = orchestratorMode === mode.id
        const [textColor, borderColor, bgColor] = mode.color.split(' ')

        return (
          <button
            key={mode.id}
            onClick={() => setOrchestratorMode(mode.id)}
            className={cn(
              'flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors border-b-2',
              isActive
                ? `${borderColor} ${textColor} ${bgColor}`
                : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-accent'
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
