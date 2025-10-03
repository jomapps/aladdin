'use client'

import { useRouter } from 'next/navigation'
import { Film, Plus, Users } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CreateProjectDialog } from './CreateProjectDialog'

export function QuickActions() {
  const router = useRouter()

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {/* Create Project Card */}
      <Card className="group relative overflow-hidden border-white/10 bg-white/5 p-0 backdrop-blur-2xl transition duration-300 hover:-translate-y-1 hover:shadow-[0_40px_120px_-50px_rgba(124,58,237,0.8)]">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/40 via-transparent to-sky-400/25 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        <CardHeader className="relative z-10 flex flex-row items-center space-y-0 pb-2">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-sky-100 shadow-[0_20px_50px_-30px_rgba(56,189,248,0.8)]">
            <Plus className="h-5 w-5" />
          </div>
          <CardTitle className="ml-3 text-sm font-semibold tracking-wide text-slate-100 uppercase">
            New Project
          </CardTitle>
          <span className="ml-auto rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-200">
            Start
          </span>
        </CardHeader>
        <CardContent className="relative z-10 pb-6">
          <CardDescription className="mb-5 max-w-xs text-slate-300">
            Launch a fresh production and unlock agents tailored to your vision.
          </CardDescription>
          <div className="max-w-xs">
            <CreateProjectDialog />
          </div>
        </CardContent>
      </Card>

      {/* My Projects Card */}
      <Card
        className="group relative cursor-pointer overflow-hidden border-white/10 bg-white/5 p-0 backdrop-blur-2xl transition duration-300 hover:-translate-y-1 hover:shadow-[0_40px_120px_-50px_rgba(14,165,233,0.75)]"
        onClick={() => router.push('/dashboard/projects')}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-sky-400/40 via-transparent to-emerald-300/20 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        <CardHeader className="relative z-10 flex flex-row items-center space-y-0 pb-2">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-emerald-100 shadow-[0_20px_50px_-30px_rgba(16,185,129,0.7)]">
            <Film className="h-5 w-5" />
          </div>
          <CardTitle className="ml-3 text-sm font-semibold tracking-wide text-slate-100 uppercase">
            My Projects
          </CardTitle>
          <span className="ml-auto rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-200">
            Library
          </span>
        </CardHeader>
        <CardContent className="relative z-10 pb-6">
          <CardDescription className="mb-5 max-w-xs text-slate-300">
            Step into detailed dashboards for every production you are shaping.
          </CardDescription>
          <Button
            variant="outline"
            className="w-full border-white/20 bg-white/10 text-slate-100 hover:border-white/40 hover:bg-white/20"
            onClick={(e) => {
              e.stopPropagation()
              router.push('/dashboard/projects')
            }}
          >
            <Film className="mr-2 h-4 w-4" />
            View Projects
          </Button>
        </CardContent>
      </Card>

      {/* Team Card */}
      <Card
        className="group relative cursor-pointer overflow-hidden border-white/10 bg-white/5 p-0 backdrop-blur-2xl transition duration-300 hover:-translate-y-1 hover:shadow-[0_40px_120px_-50px_rgba(234,179,8,0.65)]"
        onClick={() => router.push('/dashboard/team')}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-amber-400/40 via-transparent to-rose-300/20 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        <CardHeader className="relative z-10 flex flex-row items-center space-y-0 pb-2">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-amber-100 shadow-[0_20px_50px_-30px_rgba(234,179,8,0.6)]">
            <Users className="h-5 w-5" />
          </div>
          <CardTitle className="ml-3 text-sm font-semibold tracking-wide text-slate-100 uppercase">
            Dream Team
          </CardTitle>
          <span className="ml-auto rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-200">
            Collaborate
          </span>
        </CardHeader>
        <CardContent className="relative z-10 pb-6">
          <CardDescription className="mb-5 max-w-xs text-slate-300">
            Sync directors, writers, and specialists in a shared creative hub.
          </CardDescription>
          <Button
            variant="outline"
            className="w-full border-white/20 bg-white/10 text-slate-100 hover:border-white/40 hover:bg-white/20"
            onClick={(e) => {
              e.stopPropagation()
              router.push('/dashboard/team')
            }}
          >
            <Users className="mr-2 h-4 w-4" />
            Manage Team
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
