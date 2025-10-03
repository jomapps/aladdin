'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Film, BarChart3 } from 'lucide-react'
import { QuickActions } from '@/components/dashboard/QuickActions'

export default function DashboardPage() {
  // TODO: Get user from session/auth
  const displayName = 'User'

  return (
    <div className="space-y-10">
      {/* Welcome Section */}
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 px-8 py-10 text-slate-100 shadow-[0_50px_140px_-80px_rgba(56,189,248,0.8)]">
        <div className="absolute inset-0">
          <div className="absolute inset-y-0 right-[-20%] hidden w-1/2 bg-[conic-gradient(from_120deg_at_50%_50%,rgba(56,189,248,0.35)_0%,rgba(124,58,237,0.45)_50%,rgba(249,115,22,0.35)_100%)] blur-3xl md:block" />
          <div className="absolute bottom-0 left-0 h-32 w-32 rounded-full bg-sky-400/20 blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl space-y-5">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-200">
              Production Control Room
            </span>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
              Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-300 via-indigo-200 to-purple-300">{displayName}</span>
            </h1>
            <p className="text-base text-slate-300 sm:text-lg">
              Resume your productions, monitor quality, and orchestrate every creative department
              from one cinematic dashboard.
            </p>
            <div className="flex flex-wrap gap-3 text-sm text-slate-300">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" /> Real-time status updates
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2">
                <span className="h-1.5 w-1.5 rounded-full bg-sky-300" /> Specialists on standby
              </div>
            </div>
          </div>
          <div className="flex w-full max-w-sm flex-col items-start gap-4 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-300">
              Production Pulse
            </p>
            <div className="grid w-full grid-cols-2 gap-4 text-center text-slate-200">
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-slate-400">Projects</p>
                <p className="mt-2 text-2xl font-bold">--</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-slate-400">Readiness</p>
                <p className="mt-2 text-2xl font-bold">--</p>
              </div>
            </div>
            <p className="text-xs text-slate-400">
              Connect departments to unlock live quality metrics and production schedules.
            </p>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <QuickActions />

      {/* Recent Activity */}
      <Card className="border-white/10 bg-white/5 text-slate-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="h-5 w-5 text-sky-300" />
            Recent Activity
          </CardTitle>
          <CardDescription className="text-slate-400">
            Your latest project updates and department hand-offs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/10 bg-white/5 py-10 text-center text-slate-300">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/10">
              <Film className="h-6 w-6 text-slate-200" />
            </span>
            <p className="text-base">No recent activity yet.</p>
            <p className="text-sm text-slate-400">Create your first project to spin up the production timeline.</p>
          </div>
        </CardContent>
      </Card>

      {/* Getting Started */}
      <Card className="border-white/10 bg-white/5 text-slate-100">
        <CardHeader>
          <CardTitle className="text-lg font-semibold tracking-wide">Getting Started</CardTitle>
          <CardDescription className="text-slate-400">
            New to Aladdin? Follow the four-stage launch plan to light up every department.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {[{
              step: '1',
              title: 'Create a Project',
              description: 'Open a new production shell with your core vision.',
            },
            {
              step: '2',
              title: 'Define Your Story',
              description: 'Outline plot beats, characters, and tone with AI support.',
            },
            {
              step: '3',
              title: 'Generate Departments',
              description: 'Spin up concept art, scenes, and assets across specialists.',
            },
            {
              step: '4',
              title: 'Collaborate & Review',
              description: 'Share previews and refine with your creative partners.',
            }].map(({ step, title, description }) => (
              <div key={step} className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 transition duration-200 hover:border-white/30 hover:bg-white/10">
                <div className="absolute right-4 top-4 text-sm font-semibold text-slate-500">
                  Step {step}
                </div>
                <h4 className="text-base font-semibold text-slate-100">{title}</h4>
                <p className="mt-2 text-sm text-slate-400">{description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
