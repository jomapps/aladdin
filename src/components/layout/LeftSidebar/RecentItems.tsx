'use client'

import { Clock, FileText, Folder } from 'lucide-react'
import Link from 'next/link'

const recentItems = [
  { type: 'project', name: 'AI Movie Project', href: '/dashboard/project/1', time: '2 hours ago' },
  { type: 'document', name: 'Script Draft', href: '/dashboard/document/1', time: '5 hours ago' },
  { type: 'project', name: 'Commercial Video', href: '/dashboard/project/2', time: '1 day ago' },
]

export default function RecentItems() {
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
        <Clock className="h-3 w-3" />
        Recent
      </h3>
      <div className="space-y-1">
        {recentItems.map((item) => (
          <Link
            key={item.href}
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
              <p className="text-xs text-muted-foreground">{item.time}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
