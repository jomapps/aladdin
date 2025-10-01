'use client'

import { Clock, FileText, Folder, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRecentItems } from '@/lib/react-query'
import { formatDistanceToNow } from 'date-fns'

export default function RecentItems() {
  const { data: recentItems, isLoading, error } = useRecentItems({ limit: 5 })

  if (isLoading) {
    return (
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
          <Clock className="h-3 w-3" />
          Recent
        </h3>
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
          <Clock className="h-3 w-3" />
          Recent
        </h3>
        <p className="text-xs text-muted-foreground px-3 py-2">Unable to load recent items</p>
      </div>
    )
  }

  if (!recentItems || recentItems.length === 0) {
    return (
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
          <Clock className="h-3 w-3" />
          Recent
        </h3>
        <p className="text-xs text-muted-foreground px-3 py-2">No recent activity</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
        <Clock className="h-3 w-3" />
        Recent
      </h3>
      <div className="space-y-1">
        {recentItems.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className="flex items-start gap-2 px-3 py-2 rounded-md text-sm hover:bg-accent transition-colors"
          >
            {item.type === 'project' ? (
              <Folder className="h-4 w-4 mt-0.5 text-muted-foreground" />
            ) : (
              <FileText className="h-4 w-4 mt-0.5 text-muted-foreground" />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{item.name}</p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
