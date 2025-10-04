/**
 * TaskMode Component
 * Task execution mode welcome screen and UI
 */

'use client'

import { Zap, Layers, CheckCircle, BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'

function Welcome() {
  return (
    <div className="mx-auto max-w-2xl space-y-8 rounded-3xl border border-white/12 bg-white/5 p-8 text-slate-100 shadow-[0_45px_140px_-90px_rgba(124,58,237,0.85)] backdrop-blur-xl">
      {/* Icon */}
      <div className="flex justify-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-amber-300/40 bg-amber-500/15 shadow-[0_25px_60px_-40px_rgba(249,115,22,0.8)]">
          <Zap className="h-8 w-8 text-amber-200" />
        </div>
      </div>

      {/* Title */}
      <div className="space-y-3 text-center">
        <h3 className="text-2xl font-semibold tracking-tight text-slate-100">
          Task Execution Mode
        </h3>
        <p className="text-sm text-slate-300">
          Execute complex tasks with multi-agent orchestration. I&apos;ll coordinate departments to
          complete your request.
        </p>
      </div>

      {/* Features */}
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400 text-center">
          Features
        </p>

        <div className="space-y-2">
          {[
            {
              icon: Layers,
              title: 'Department Coordination',
              description: 'Multiple specialized agents work together',
              color: 'border border-violet-400/30 bg-violet-500/20 text-violet-100',
            },
            {
              icon: BarChart3,
              title: 'Quality Tracking',
              description: 'Real-time quality scores for each step',
              color: 'border border-sky-400/30 bg-sky-500/20 text-sky-100',
            },
            {
              icon: CheckCircle,
              title: 'Progress Monitoring',
              description: 'Live updates as tasks complete',
              color: 'border border-emerald-400/30 bg-emerald-500/20 text-emerald-100',
            },
          ].map((feature, index) => {
            const Icon = feature.icon
            return (
              <div
                key={index}
                className="group flex items-start gap-4 rounded-2xl border border-white/10 bg-white/8 p-4 transition duration-200 hover:border-white/20 hover:bg-white/12"
              >
                <div
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-xl shadow-[0_18px_45px_-40px_rgba(249,115,22,0.8)]',
                    feature.color,
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>

                <div className="flex-1">
                  <div className="text-sm font-semibold text-slate-100">{feature.title}</div>
                  <div className="mt-1 text-sm text-slate-300">{feature.description}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Example tasks */}
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400 text-center">
          Example tasks
        </p>

        <div className="space-y-2">
          {[
            'Create a new character with full profile',
            'Generate scene breakdown for Act 1',
            'Analyze character relationships',
            'Export project to screenplay format',
          ].map((task, index) => (
            <button
              key={index}
              className="w-full rounded-xl border border-white/10 bg-white/8 px-4 py-3 text-left text-sm text-slate-200 transition duration-200 hover:border-amber-300/50 hover:bg-amber-500/15"
            >
              {task}
            </button>
          ))}
        </div>
      </div>

      {/* Departments */}
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400 text-center">
          Available departments
        </p>

        <div className="grid grid-cols-3 gap-2">
          {['Character', 'Scene', 'Location', 'Prop', 'Dialogue', 'Export'].map((dept) => (
            <div
              key={dept}
              className="rounded-lg border border-white/12 bg-white/10 px-2 py-1.5 text-center text-xs font-medium text-slate-200"
            >
              {dept}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const TaskMode = {
  Welcome,
}

export default TaskMode
