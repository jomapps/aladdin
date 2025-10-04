/**
 * DataMode Component
 * Data ingestion mode welcome screen and UI
 */

'use client'

import { Database, Upload, FileCheck, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

function Welcome() {
  return (
    <div className="mx-auto max-w-2xl space-y-8 rounded-3xl border border-white/12 bg-white/5 p-8 text-slate-100 shadow-[0_45px_140px_-90px_rgba(56,189,248,0.85)] backdrop-blur-xl">
      {/* Icon */}
      <div className="flex justify-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-emerald-300/40 bg-emerald-500/15 shadow-[0_25px_60px_-40px_rgba(16,185,129,0.9)]">
          <Database className="h-8 w-8 text-emerald-200" />
        </div>
      </div>

      {/* Title */}
      <div className="space-y-3 text-center">
        <h3 className="text-2xl font-semibold tracking-tight text-slate-100">
          Upload &amp; Ingest
        </h3>
        <p className="text-sm text-slate-300">
          Upload or describe project data. I&apos;ll validate, enrich, and structure the information
          before ingesting it.
        </p>
      </div>

      {/* Process steps */}
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400 text-center">
          How it works
        </p>

        <div className="space-y-2">
          {[
            {
              icon: Upload,
              title: 'Describe your data',
              description: 'Tell me what you want to add',
              color: 'border border-sky-400/30 bg-sky-500/20 text-sky-100',
            },
            {
              icon: FileCheck,
              title: 'Review validation',
              description: "I'll structure and validate it",
              color: 'border border-violet-400/30 bg-violet-500/20 text-violet-100',
            },
            {
              icon: Database,
              title: 'Confirm ingestion',
              description: 'Approve to add to your project',
              color: 'border border-emerald-400/30 bg-emerald-500/20 text-emerald-100',
            },
          ].map((step, index) => {
            const Icon = step.icon
            return (
              <div
                key={index}
                className="group flex items-start gap-4 rounded-2xl border border-white/10 bg-white/8 p-4 transition duration-200 hover:border-white/20 hover:bg-white/12"
              >
                <div
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-xl shadow-[0_18px_45px_-40px_rgba(14,165,233,0.9)]',
                    step.color,
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>

                <div className="flex-1">
                  <div className="text-sm font-semibold text-slate-100">{step.title}</div>
                  <div className="mt-1 text-sm text-slate-300">{step.description}</div>
                </div>

                <div className="flex h-7 w-7 items-center justify-center rounded-full border border-white/20 bg-white/10 text-xs font-semibold text-slate-200">
                  {index + 1}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Data types */}
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400 text-center">
          Supported data types
        </p>

        <div className="flex flex-wrap justify-center gap-2">
          {['Characters', 'Scenes', 'Locations', 'Props', 'Dialogues', 'Notes'].map((type) => (
            <div
              key={type}
              className="rounded-full border border-white/12 bg-white/10 px-3 py-1.5 text-sm text-slate-200"
            >
              {type}
            </div>
          ))}
        </div>
      </div>

      {/* Info box */}
      <div className="flex items-start gap-3 rounded-2xl border border-sky-400/30 bg-sky-500/15 p-4 text-sky-100">
        <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-sky-200" />
        <p className="text-sm text-sky-100/90">
          All data is validated and structured before being added to your project. You&apos;ll have
          a chance to review and approve.
        </p>
      </div>
    </div>
  )
}

const DataMode = {
  Welcome,
}

export default DataMode
