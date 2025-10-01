'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface MainContentProps {
  children: ReactNode
  className?: string
}

export default function MainContent({ children, className }: MainContentProps) {
  return (
    <main
      className={cn(
        'flex-1 overflow-y-auto bg-muted/30',
        className
      )}
    >
      <div className="container mx-auto p-6 max-w-7xl">
        {children}
      </div>
    </main>
  )
}
