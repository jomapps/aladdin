'use client'

import { Menu, Search, Bell, ChevronDown, PanelLeftClose, PanelLeftOpen, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLayoutStore } from '@/stores/layoutStore'
import ProjectSelector from './ProjectSelector'
import Breadcrumbs from './Breadcrumbs'
import GlobalSearch from './GlobalSearch'
import Notifications from './Notifications'
import UserMenu from './UserMenu'

interface TopMenuBarProps {
  user?: {
    id: string
    email: string
    name?: string
  }
}

export default function TopMenuBar({ user }: TopMenuBarProps) {
  const {
    isLeftSidebarOpen,
    isRightOrchestratorOpen,
    toggleLeftSidebar,
    toggleRightOrchestrator,
    setMobileLeftOverlay,
    setMobileRightOverlay,
  } = useLayoutStore()

  return (
    <header className="h-14 border-b bg-background flex items-center px-4 gap-4 sticky top-0 z-50">
      {/* Mobile Menu Toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={() => setMobileLeftOverlay(true)}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Desktop Left Sidebar Toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="hidden lg:flex"
        onClick={toggleLeftSidebar}
      >
        {isLeftSidebarOpen ? (
          <PanelLeftClose className="h-5 w-5" />
        ) : (
          <PanelLeftOpen className="h-5 w-5" />
        )}
      </Button>

      {/* Project Selector */}
      <ProjectSelector />

      {/* Breadcrumbs */}
      <Breadcrumbs />

      {/* Spacer */}
      <div className="flex-1" />

      {/* Global Search */}
      <GlobalSearch />

      {/* Notifications */}
      <Notifications />

      {/* Mobile Orchestrator Toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={() => setMobileRightOverlay(true)}
      >
        <MessageSquare className="h-5 w-5" />
      </Button>

      {/* User Menu */}
      <UserMenu user={user} />
    </header>
  )
}
