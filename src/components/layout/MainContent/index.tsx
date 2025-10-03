'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { useLayoutStore } from '@/stores/layoutStore'

interface MainContentProps {
  children: ReactNode
  className?: string
}

export default function MainContent({ children, className }: MainContentProps) {
  const { isLeftSidebarOpen, isRightOrchestratorOpen } = useLayoutStore()

  return (
    <main
      className={cn(
        'flex-1 overflow-y-auto bg-muted/30 transition-all duration-300',
        className
      )}
    >
      <div className="container mx-auto p-6 max-w-full">
        {children}
      </div>
    </main>
  )
}
