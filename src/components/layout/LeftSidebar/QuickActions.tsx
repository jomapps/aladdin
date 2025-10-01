'use client'

import { Plus, Upload, Download, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

const quickActions = [
  { icon: Plus, label: 'New Project', variant: 'default' as const },
  { icon: Upload, label: 'Upload', variant: 'outline' as const },
  { icon: Download, label: 'Export', variant: 'outline' as const },
  { icon: Share2, label: 'Share', variant: 'outline' as const },
]

export default function QuickActions() {
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
        Quick Actions
      </h3>
      <div className="space-y-2">
        {quickActions.map((action) => {
          const Icon = action.icon
          return (
            <Button
              key={action.label}
              variant={action.variant}
              className="w-full justify-start gap-2"
              size="sm"
            >
              <Icon className="h-4 w-4" />
              {action.label}
            </Button>
          )
        })}
      </div>
    </div>
  )
}
