'use client'

/**
 * Project Sidebar - Navigation and Content Browser
 * Phase 7: Production Polish
 */

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface Department {
  id: string
  name: string
  icon: string
  path: string
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
  { id: 'story', name: 'Story', icon: '📖', path: '/story' },
  { id: 'character', name: 'Character', icon: '👤', path: '/character' },
  { id: 'visual', name: 'Visual', icon: '🎨', path: '/visual' },
  { id: 'video', name: 'Video', icon: '🎬', path: '/video' },
  { id: 'audio', name: 'Audio', icon: '🔊', path: '/audio' },
  { id: 'image-quality', name: 'Image Quality', icon: '✨', path: '/image-quality' },
  { id: 'production', name: 'Production', icon: '🎯', path: '/production' },
]

export default function ProjectSidebar({
  projectId,
  projectName,
  isOpen = true,
  onToggle,
}: ProjectSidebarProps) {
  const pathname = usePathname()
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['departments']))
  const [recentActivity] = useState<ContentItem[]>([
    { id: '1', type: 'scene', name: 'Opening Scene', timestamp: new Date() },
    { id: '2', type: 'character', name: 'Main Character', timestamp: new Date() },
  ])

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
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 h-screen
          w-64 bg-white border-r border-gray-200
          transform transition-transform duration-300 ease-in-out
          z-50 lg:z-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          overflow-y-auto
        `}
      >
        {/* Project Info */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 truncate">{projectName}</h2>
            <button
              onClick={onToggle}
              className="lg:hidden p-1 hover:bg-gray-100 rounded"
            >
              ✕
            </button>
          </div>
          <Link
            href={basePath}
            className="text-sm text-blue-600 hover:text-blue-700 mt-1 block"
          >
            ← Back to Overview
          </Link>
        </div>

        {/* Navigation Sections */}
        <nav className="p-2">
          {/* Departments */}
          <div className="mb-4">
            <button
              onClick={() => toggleSection('departments')}
              className="w-full flex items-center justify-between p-2 hover:bg-gray-50 rounded text-left"
            >
              <span className="font-medium text-gray-900">Departments</span>
              <span className="text-gray-500">
                {expandedSections.has('departments') ? '▼' : '▶'}
              </span>
            </button>
            {expandedSections.has('departments') && (
              <div className="mt-1 space-y-1 pl-2">
                {DEPARTMENTS.map((dept) => {
                  const isActive = pathname.includes(dept.path)
                  return (
                    <Link
                      key={dept.id}
                      href={`${basePath}${dept.path}`}
                      className={`
                        flex items-center gap-2 px-3 py-2 rounded text-sm
                        transition-colors
                        ${
                          isActive
                            ? 'bg-blue-50 text-blue-700 font-medium'
                            : 'text-gray-700 hover:bg-gray-50'
                        }
                      `}
                    >
                      <span>{dept.icon}</span>
                      <span>{dept.name}</span>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

          {/* Content Browser */}
          <div className="mb-4">
            <button
              onClick={() => toggleSection('content')}
              className="w-full flex items-center justify-between p-2 hover:bg-gray-50 rounded text-left"
            >
              <span className="font-medium text-gray-900">Content</span>
              <span className="text-gray-500">
                {expandedSections.has('content') ? '▼' : '▶'}
              </span>
            </button>
            {expandedSections.has('content') && (
              <div className="mt-1 space-y-1 pl-2">
                <Link
                  href={`${basePath}/scenes`}
                  className="flex items-center gap-2 px-3 py-2 rounded text-sm text-gray-700 hover:bg-gray-50"
                >
                  <span>🎬</span>
                  <span>Scenes</span>
                </Link>
                <Link
                  href={`${basePath}/characters`}
                  className="flex items-center gap-2 px-3 py-2 rounded text-sm text-gray-700 hover:bg-gray-50"
                >
                  <span>👤</span>
                  <span>Characters</span>
                </Link>
                <Link
                  href={`${basePath}/assets`}
                  className="flex items-center gap-2 px-3 py-2 rounded text-sm text-gray-700 hover:bg-gray-50"
                >
                  <span>📁</span>
                  <span>Assets</span>
                </Link>
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="mb-4">
            <button
              onClick={() => toggleSection('recent')}
              className="w-full flex items-center justify-between p-2 hover:bg-gray-50 rounded text-left"
            >
              <span className="font-medium text-gray-900">Recent</span>
              <span className="text-gray-500">
                {expandedSections.has('recent') ? '▼' : '▶'}
              </span>
            </button>
            {expandedSections.has('recent') && (
              <div className="mt-1 space-y-1 pl-2">
                {recentActivity.length === 0 ? (
                  <p className="px-3 py-2 text-sm text-gray-500">No recent activity</p>
                ) : (
                  recentActivity.map((item) => (
                    <div
                      key={item.id}
                      className="px-3 py-2 rounded text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <div className="font-medium">{item.name}</div>
                      <div className="text-xs text-gray-500">{item.type}</div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="border-t border-gray-200 pt-4 mt-4">
            <Link
              href={`${basePath}/chat`}
              className="flex items-center gap-2 px-3 py-2 rounded text-sm text-gray-700 hover:bg-gray-50 w-full"
            >
              <span>💬</span>
              <span>Chat with AI</span>
            </Link>
            <Link
              href={`${basePath}/settings`}
              className="flex items-center gap-2 px-3 py-2 rounded text-sm text-gray-700 hover:bg-gray-50 w-full"
            >
              <span>⚙️</span>
              <span>Settings</span>
            </Link>
          </div>
        </nav>
      </aside>
    </>
  )
}
