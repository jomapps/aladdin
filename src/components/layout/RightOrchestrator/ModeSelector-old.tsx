'use client'

import { MessageSquare, Bot, Wrench, History } from 'lucide-react'
import { useLayoutStore, OrchestratorMode } from '@/stores/layoutStore'
import { cn } from '@/lib/utils'

const modes = [
  { id: 'chat' as OrchestratorMode, icon: MessageSquare, label: 'Chat' },
  { id: 'agents' as OrchestratorMode, icon: Bot, label: 'Agents' },
  { id: 'tools' as OrchestratorMode, icon: Wrench, label: 'Tools' },
  { id: 'history' as OrchestratorMode, icon: History, label: 'History' },
]

export default function ModeSelector() {
  const { orchestratorMode, setOrchestratorMode } = useLayoutStore()

  return (
    <div className="flex border-b">
      {modes.map((mode) => {
        const Icon = mode.icon
        const isActive = orchestratorMode === mode.id

        return (
          <button
            key={mode.id}
            onClick={() => setOrchestratorMode(mode.id)}
            className={cn(
              'flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors border-b-2',
              isActive
                ? 'border-primary text-primary bg-primary/5'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-accent'
            )}
          >
            <Icon className="h-4 w-4" />
            {mode.label}
          </button>
        )
      })}
    </div>
  )
}
