'use client'

/**
 * Project Sidebar - Navigation and Content Browser
 * Phase 7: Production Polish
 */

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useProjectRecentActivity } from '@/lib/react-query'
import { formatDistanceToNow } from 'date-fns'
import {
  BookOpen,
  Boxes,
  ChevronDown,
  ChevronRight,
  Clapperboard,
  Film,
  Loader2,
  MessageSquare,
  Package,
  Palette,
  Settings,
  ShieldCheck,
  Sparkles,
  Target,
  User2,
  Users,
  Waves,
  X,
  type LucideIcon,
} from 'lucide-react'

interface Department {
  id: string
  name: string
  icon: LucideIcon
  path: string
  accent: string
}

interface ContentItem {
  id: string
  type: string
  name: string
  timestamp: Date
}

interface ProjectSidebarProps {
  projectId: string
  projectName: string
  isOpen?: boolean
  onToggle?: () => void
}

const DEPARTMENTS: Department[] = [
  { id: 'story', name: 'Story', icon: BookOpen, path: '/story', accent: 'from-sky-400/40 to-indigo-400/20' },
  { id: 'character', name: 'Character', icon: User2, path: '/character', accent: 'from-emerald-400/45 to-sky-400/20' },
  { id: 'visual', name: 'Visual', icon: Palette, path: '/visual', accent: 'from-fuchsia-400/45 to-amber-300/20' },
  { id: 'video', name: 'Video', icon: Clapperboard, path: '/video', accent: 'from-purple-400/45 to-sky-400/20' },
  { id: 'audio', name: 'Audio', icon: Waves, path: '/audio', accent: 'from-emerald-400/40 to-cyan-400/20' },
  { id: 'image-quality', name: 'Image Quality', icon: Sparkles, path: '/image-quality', accent: 'from-amber-300/50 to-rose-300/20' },
  { id: 'production', name: 'Production', icon: Target, path: '/production', accent: 'from-indigo-400/40 to-rose-300/20' },
]

export default function ProjectSidebar({
  projectId,
  projectName,
  isOpen = true,
  onToggle,
}: ProjectSidebarProps) {
  const pathname = usePathname()
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['departments']))
  const [gatherCount, setGatherCount] = useState<number>(0)
  const { data: recentActivity, isLoading: isLoadingActivity } = useProjectRecentActivity(
    projectId,
    { limit: 5 },
  )

  // Fetch gather count with caching (1 minute TTL)
  useEffect(() => {
    let isMounted = true
    let cacheTimeout: NodeJS.Timeout

    async function fetchGatherCount() {
      try {
        const response = await fetch(`/api/v1/gather/${projectId}/count`)
        if (!response.ok) throw new Error('Failed to fetch count')
        const data = await response.json()
        if (isMounted) {
          setGatherCount(data.count || 0)
        }
      } catch (error) {
        console.error('Failed to fetch gather count:', error)
      }
    }

    fetchGatherCount()
    // Refresh count every 60 seconds
    cacheTimeout = setInterval(fetchGatherCount, 60000)

    return () => {
      isMounted = false
      clearInterval(cacheTimeout)
    }
  }, [projectId])

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev)
      if (next.has(section)) {
        next.delete(section)
      } else {
        next.add(section)
      }
      return next
    })
  }

  const basePath = `/dashboard/project/${projectId}`

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden" onClick={onToggle} />}

      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 top-0 h-screen w-72 overflow-y-auto
          border-r border-white/10 bg-white/5 backdrop-blur-2xl
          shadow-[0_60px_160px_-100px_rgba(59,130,246,0.65)] transition-transform duration-300 ease-in-out
          z-50 lg:z-0 lg:sticky
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Project Info */}
        <div className="border-b border-white/10 px-5 py-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                Project
              </p>
              <h2 className="mt-2 line-clamp-2 text-lg font-semibold text-slate-100">
                {projectName}
              </h2>
            </div>
            <button
              onClick={onToggle}
              className="lg:hidden rounded-xl border border-white/10 bg-white/10 p-1.5 text-slate-100"
              aria-label="Close navigation"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <Link
            href={basePath}
            className="mt-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-slate-400 hover:text-slate-200"
          >
            Overview
          </Link>
        </div>

        {/* Navigation Sections */}
        <nav className="space-y-6 px-4 py-5 text-slate-100">
          {/* Departments */}
          <div>
            <button
              onClick={() => toggleSection('departments')}
              className="flex w-full items-center justify-between rounded-xl border border-white/5 bg-white/5 px-4 py-3 text-left text-sm font-semibold uppercase tracking-[0.3em] text-slate-300 hover:border-white/30 hover:bg-white/10"
            >
              <span>Departments</span>
              {expandedSections.has('departments') ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
            {expandedSections.has('departments') && (
              <div className="mt-3 space-y-2">
                {DEPARTMENTS.map((dept) => {
                  const isActive = pathname.includes(dept.path)
                  const Icon = dept.icon
                  return (
                    <Link
                      key={dept.id}
                      href={`${basePath}${dept.path}`}
                      className={`
                        group relative flex items-center gap-3 overflow-hidden rounded-2xl border border-white/10 px-4 py-3 text-sm transition
                        ${
                          isActive
                            ? 'border-white/30 bg-white/10'
                            : 'bg-white/5 hover:border-white/20 hover:bg-white/10'
                        }
                      `}
                    >
                      <span
                        className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-gradient-to-br ${dept.accent}`}
                      >
                        <Icon className="h-4 w-4 text-slate-100" />
                      </span>
                      <span className="font-medium tracking-wide text-slate-200">{dept.name}</span>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

          {/* Content Browser */}
          <div>
            <button
              onClick={() => toggleSection('content')}
              className="flex w-full items-center justify-between rounded-xl border border-white/5 bg-white/5 px-4 py-3 text-left text-sm font-semibold uppercase tracking-[0.3em] text-slate-300 hover:border-white/30 hover:bg-white/10"
            >
              <span>Content</span>
              {expandedSections.has('content') ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
            {expandedSections.has('content') && (
              <div className="mt-3 space-y-2">
                <Link
                  href={`${basePath}/scenes`}
                  className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 transition hover:border-white/30 hover:bg-white/10"
                >
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/10">
                    <Film className="h-4 w-4" />
                  </span>
                  <span className="font-medium tracking-wide">Scenes</span>
                </Link>
                <Link
                  href={`${basePath}/characters`}
                  className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 transition hover:border-white/30 hover:bg-white/10"
                >
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/10">
                    <Users className="h-4 w-4" />
                  </span>
                  <span className="font-medium tracking-wide">Characters</span>
                </Link>
                <Link
                  href={`${basePath}/assets`}
                  className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 transition hover:border-white/30 hover:bg-white/10"
                >
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/10">
                    <Boxes className="h-4 w-4" />
                  </span>
                  <span className="font-medium tracking-wide">Assets</span>
                </Link>
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div>
            <button
              onClick={() => toggleSection('recent')}
              className="flex w-full items-center justify-between rounded-xl border border-white/5 bg-white/5 px-4 py-3 text-left text-sm font-semibold uppercase tracking-[0.3em] text-slate-300 hover:border-white/30 hover:bg-white/10"
            >
              <span>Recent</span>
              {expandedSections.has('recent') ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
            {expandedSections.has('recent') && (
              <div className="mt-3 space-y-2">
                {isLoadingActivity ? (
                  <div className="flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 py-6">
                    <Loader2 className="h-4 w-4 animate-spin text-slate-300" />
                  </div>
                ) : !recentActivity || recentActivity.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-white/10 bg-white/5 px-4 py-6 text-sm text-slate-400">
                    No recent activity yet.
                  </p>
                ) : (
                  recentActivity.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 transition hover:border-white/30 hover:bg-white/10"
                    >
                      <div className="font-medium text-slate-100">{item.entityName}</div>
                      <div className="text-xs text-slate-400">
                        {item.action} •{' '}
                        {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="space-y-2 border-t border-white/10 pt-5">
            {/* Gather Link - Top Position */}
            <Link
              href={`${basePath}/gather`}
              className={`
                flex items-center gap-3 rounded-2xl border border-white/10 px-4 py-3 text-sm transition-colors
                ${
                  pathname.includes('/gather')
                    ? 'border-white/30 bg-white/10 text-slate-100'
                    : 'bg-white/5 text-slate-200 hover:border-white/20 hover:bg-white/10'
                }
              `}
            >
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/10">
                <Package className="h-4 w-4" />
              </span>
              <span>Gather</span>
              {gatherCount > 0 && (
                <span className="ml-auto rounded-full border border-white/10 bg-white/10 px-2 py-0.5 text-xs text-slate-200">
                  {gatherCount}
                </span>
              )}
            </Link>

            {/* Project Readiness Link */}
            <Link
              href={`${basePath}/project-readiness`}
              className={`
                flex items-center gap-3 rounded-2xl border border-white/10 px-4 py-3 text-sm transition-colors
                ${
                  pathname.includes('/project-readiness')
                    ? 'border-white/30 bg-white/10 text-slate-100'
                    : 'bg-white/5 text-slate-200 hover:border-white/20 hover:bg-white/10'
                }
              `}
            >
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/10">
                <ShieldCheck className="h-4 w-4" />
              </span>
              <span>Project Readiness</span>
            </Link>

            {/* Chat Link */}
            <Link
              href={`${basePath}/chat`}
              className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 transition hover:border-white/20 hover:bg-white/10"
            >
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/10">
                <MessageSquare className="h-4 w-4" />
              </span>
              <span>Chat with AI</span>
            </Link>

            {/* Settings Link */}
            <Link
              href={`${basePath}/settings`}
              className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 transition hover:border-white/20 hover:bg-white/10"
            >
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/10">
                <Settings className="h-4 w-4" />
              </span>
              <span>Settings</span>
            </Link>
          </div>
        </nav>
      </aside>
    </>
  )
}
