'use client'

import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLayoutStore } from '@/stores/layoutStore'
import { cn } from '@/lib/utils'
import Navigation from './Navigation'
import QuickActions from './QuickActions'
import RecentItems from './RecentItems'
import ProjectTools from './ProjectTools'

export default function LeftSidebar() {
  const {
    isLeftSidebarOpen,
    isMobileLeftOverlay,
    setMobileLeftOverlay,
  } = useLayoutStore()

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden lg:flex flex-col border-r bg-background transition-all duration-300',
          isLeftSidebarOpen ? 'w-1/5 min-w-[250px] max-w-[300px]' : 'w-0 overflow-hidden'
        )}
      >
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <Navigation />
          <QuickActions />
          <RecentItems />
          <ProjectTools />
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isMobileLeftOverlay && (
        <>
          <div
            className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileLeftOverlay(false)}
          />
          <aside className="fixed left-0 top-0 bottom-0 z-50 w-64 bg-background border-r lg:hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="font-semibold">Menu</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileLeftOverlay(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              <Navigation />
              <QuickActions />
              <RecentItems />
              <ProjectTools />
            </div>
          </aside>
        </>
      )}
    </>
  )
}
