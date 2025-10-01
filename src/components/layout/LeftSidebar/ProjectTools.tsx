'use client'

import { BarChart3, Search, CheckSquare, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'

const tools = [
  { icon: BarChart3, label: 'Analytics', color: 'text-blue-500' },
  { icon: Search, label: 'Search', color: 'text-green-500' },
  { icon: CheckSquare, label: 'Tasks', color: 'text-orange-500' },
  { icon: Zap, label: 'Automation', color: 'text-purple-500' },
]

export default function ProjectTools() {
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
        Tools
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {tools.map((tool) => {
          const Icon = tool.icon
          return (
            <Button
              key={tool.label}
              variant="outline"
              className="h-auto flex-col gap-2 p-3"
              size="sm"
            >
              <Icon className={`h-5 w-5 ${tool.color}`} />
              <span className="text-xs">{tool.label}</span>
            </Button>
          )
        })}
      </div>
    </div>
  )
}
