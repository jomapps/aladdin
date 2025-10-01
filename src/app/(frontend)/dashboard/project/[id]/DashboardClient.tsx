'use client'

/**
 * Dashboard Client Component
 * Phase 7: Production Polish
 */

import { useState, Suspense } from 'react'
import ProjectSidebar from './components/ProjectSidebar'
import MobileNav from './components/MobileNav'
import QualityDashboard from './components/QualityDashboard'
import Timeline from './components/Timeline'

interface Scene {
  id: string
  name: string
  startTime: number
  duration: number
  status: 'draft' | 'processing' | 'complete'
}

interface DashboardClientProps {
  projectId: string
  projectName: string
  scenes: Scene[]
}

export default function DashboardClient({
  projectId,
  projectName,
  scenes,
}: DashboardClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Navigation */}
      <MobileNav
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        projectName={projectName}
      />

      <div className="flex">
        {/* Sidebar */}
        <ProjectSidebar
          projectId={projectId}
          projectName={projectName}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-8 overflow-auto">
          <div className="max-w-7xl mx-auto">
            <div className="space-y-6">
              {/* Quality Dashboard */}
              <Suspense fallback={<div className="h-64 bg-gray-100 animate-pulse rounded-lg" />}>
                <QualityDashboard projectId={projectId} />
              </Suspense>

              {/* Timeline */}
              <Suspense fallback={<div className="h-48 bg-gray-100 animate-pulse rounded-lg" />}>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Project Timeline</h2>
                  <Timeline scenes={scenes} duration={19} currentTime={7} />
                </div>
              </Suspense>

              {/* Project Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Scenes</h3>
                  <div className="text-3xl font-bold text-blue-600">{scenes.length}</div>
                  <p className="text-sm text-gray-600 mt-1">Total scenes in project</p>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Characters</h3>
                  <div className="text-3xl font-bold text-blue-600">5</div>
                  <p className="text-sm text-gray-600 mt-1">Active characters</p>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Duration</h3>
                  <div className="text-3xl font-bold text-blue-600">19s</div>
                  <p className="text-sm text-gray-600 mt-1">Total video length</p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
