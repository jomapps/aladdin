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
  charactersCount: number
  totalDuration: number
}

export default function DashboardClient({
  projectId,
  projectName,
  scenes,
  charactersCount,
  totalDuration,
}: DashboardClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-transparent text-slate-100">
      {/* Mobile Navigation */}
      <MobileNav onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} projectName={projectName} />

      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <ProjectSidebar
          projectId={projectId}
          projectName={projectName}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-10">
          <div className="mx-auto flex max-w-6xl flex-col gap-8 pb-12">
            {/* Quality Dashboard */}
            <Suspense fallback={<div className="h-64 animate-pulse rounded-3xl border border-slate-700/60 bg-slate-900/60" />}>
              <QualityDashboard projectId={projectId} />
            </Suspense>

            {/* Timeline */}
            <Suspense fallback={<div className="h-48 animate-pulse rounded-3xl border border-slate-700/60 bg-slate-900/60" />}>
              <section className="rounded-3xl border border-slate-700/60 bg-slate-950/70 p-6 backdrop-blur-xl text-white shadow-[0_40px_120px_-60px_rgba(124,58,237,0.6)]">
                <h2 className="mb-4 text-xl font-semibold uppercase tracking-[0.3em] text-slate-100/80">
                  Project Timeline
                </h2>
                <Timeline scenes={scenes} duration={Math.max(totalDuration, 19)} currentTime={7} />
              </section>
            </Suspense>

            {/* Project Overview */}
            <section className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              <div className="glass-panel rounded-3xl border-white/10 bg-white/5 p-6 text-slate-100 shadow-[0_30px_100px_-70px_rgba(56,189,248,0.8)]">
                <h3 className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-300">
                  Scenes
                </h3>
                <div className="mt-4 text-4xl font-bold text-sky-200">{scenes.length}</div>
                <p className="mt-2 text-sm text-slate-400">Total scenes scripted for this production.</p>
              </div>

              <div className="glass-panel rounded-3xl border-white/10 bg-white/5 p-6 text-slate-100 shadow-[0_30px_100px_-70px_rgba(34,211,238,0.65)]">
                <h3 className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-300">
                  Characters
                </h3>
                <div className="mt-4 text-4xl font-bold text-emerald-200">{charactersCount}</div>
                <p className="mt-2 text-sm text-slate-400">Active characters ready for casting and development.</p>
              </div>

              <div className="glass-panel rounded-3xl border-white/10 bg-white/5 p-6 text-slate-100 shadow-[0_30px_100px_-70px_rgba(99,102,241,0.55)]">
                <h3 className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-300">
                  Runtime
                </h3>
                <div className="mt-4 text-4xl font-bold text-indigo-200">
                  {totalDuration > 0
                    ? `${Math.floor(totalDuration / 60)}m ${totalDuration % 60}s`
                    : '0s'}
                </div>
                <p className="mt-2 text-sm text-slate-400">Aggregate duration across all finished scenes.</p>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  )
}
