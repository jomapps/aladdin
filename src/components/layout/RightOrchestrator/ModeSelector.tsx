/**
 * ModeSelector Component
 * 4-tab mode selector for orchestrator
 */

'use client'

import { Search, Upload, Zap, MessageCircle } from 'lucide-react'
import { useLayoutStore, OrchestratorMode } from '@/stores/layoutStore'
import { useOrchestratorStore } from '@/stores/orchestratorStore'
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
  const { setMode } = useOrchestratorStore()

  const handleModeChange = (newMode: OrchestratorMode) => {
    // Update both stores to keep them in sync
    setOrchestratorMode(newMode)
    setMode(newMode)
  }

  return (
    <div className="flex border-b border-white/10 bg-white/5">
      {modes.map((mode) => {
        const Icon = mode.icon
        const isActive = orchestratorMode === mode.id

        return (
          <button
            key={mode.id}
            onClick={() => handleModeChange(mode.id)}
            className={cn(
              'flex-1 flex flex-col items-center gap-1.5 py-3 text-xs font-semibold uppercase tracking-[0.2em] transition-all border-b-2',
              isActive
                ? 'border-sky-300/70 bg-white/12 text-slate-100 shadow-[0_18px_45px_-35px_rgba(56,189,248,0.7)]'
                : 'border-transparent text-slate-400 hover:text-sky-200 hover:bg-white/8',
            )}
            title={mode.description}
          >
            <Icon className={cn('h-4 w-4', isActive ? 'text-sky-200' : 'text-slate-400')} />
            {mode.label}
          </button>
        )
      })}
    </div>
  )
}
