/**
 * Not Found Component
 *
 * 404 page component
 */

'use client'

import React from 'react'
import Link from 'next/link'

interface NotFoundProps {
  title?: string
  message?: string
  showBackButton?: boolean
  backUrl?: string
  backLabel?: string
}

export function NotFound({
  title = 'Page Not Found',
  message = "The page you're looking for doesn't exist or has been moved.",
  showBackButton = true,
  backUrl = '/',
  backLabel = 'Go to Home',
}: NotFoundProps) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-6 py-16 text-slate-100">
      <div className="pointer-events-none absolute inset-0 opacity-85" aria-hidden>
        <div className="absolute inset-0 bg-[linear-gradient(160deg,#020617_0%,#050b19_55%,#0b172f_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(1200px_circle_at_20%_75%,rgba(56,189,248,0.35),transparent_72%)] mix-blend-screen" />
        <div className="absolute inset-0 bg-[radial-gradient(900px_circle_at_80%_25%,rgba(124,58,237,0.32),transparent_72%)] mix-blend-screen" />
      </div>

      <div className="relative z-10 w-full max-w-2xl space-y-10 text-center">
        <div className="mx-auto flex h-48 w-48 items-center justify-center rounded-full border border-white/12 bg-white/6 shadow-[0_60px_160px_-90px_rgba(56,189,248,0.85)]">
          <h1 className="text-6xl font-bold tracking-[0.4em] text-slate-200">404</h1>
        </div>

        <div className="space-y-4">
          <h2 className="text-4xl font-semibold tracking-tight text-slate-100">{title}</h2>
          <p className="text-lg text-slate-300">{message}</p>
        </div>

        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          {showBackButton && (
            <Link
              href={backUrl}
              className="w-full max-w-[12rem] rounded-xl border border-sky-400/40 bg-sky-500/20 px-6 py-3 text-sm font-semibold text-sky-100 transition hover:border-sky-300/60 hover:bg-sky-500/30"
            >
              {backLabel}
            </Link>
          )}
          <button
            onClick={() => window.history.back()}
            className="w-full max-w-[12rem] rounded-xl border border-white/15 bg-white/8 px-6 py-3 text-sm font-semibold text-slate-100 transition hover:border-white/25 hover:bg-white/12"
          >
            Go Back
          </button>
        </div>

        <div className="space-y-5 rounded-2xl border border-white/10 bg-white/6 px-8 py-6">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-400">
            Looking for something specific?
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm font-semibold text-sky-200">
            <Link href="/projects" className="transition hover:text-sky-100">
              Browse Projects
            </Link>
            <Link href="/dashboard" className="transition hover:text-sky-100">
              Dashboard
            </Link>
            <Link href="/help" className="transition hover:text-sky-100">
              Help Center
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Resource Not Found (for specific entities)
 */
export function ResourceNotFound({
  resourceType = 'Resource',
  resourceId,
}: {
  resourceType?: string
  resourceId?: string
}) {
  return (
    <div className="rounded-2xl border border-white/12 bg-white/6 p-8 text-center text-slate-100 backdrop-blur-xl">
      <svg
        className="mx-auto mb-4 h-16 w-16 text-sky-200"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <h3 className="mb-2 text-xl font-semibold text-slate-100">{resourceType} Not Found</h3>
      <p className="mb-6 text-slate-300">
        {resourceId
          ? `${resourceType} with ID "${resourceId}" doesn't exist.`
          : `The ${resourceType.toLowerCase()} you're looking for doesn't exist.`}
      </p>
      <button
        onClick={() => window.history.back()}
        className="rounded-lg border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-white/25 hover:bg-white/16"
      >
        Go Back
      </button>
    </div>
  )
}
