import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import { redirect } from 'next/navigation'
import React from 'react'

import config from '@/payload.config'
import LoginForm from '@/components/auth/LoginForm'

export default async function HomePage() {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  // If user is already authenticated, redirect to dashboard
  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-16">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-sky-400/10 via-transparent to-transparent" />
        <div className="absolute left-1/2 top-24 h-64 w-64 -translate-x-1/2 rounded-full bg-sky-400/20 blur-3xl" />
        <div className="absolute bottom-10 right-10 h-72 w-72 rounded-full bg-purple-500/20 blur-3xl" />
      </div>

      <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-16 md:flex-row md:items-center md:justify-between">
        <div className="max-w-xl text-center md:text-left">
          <span className="gradient-border inline-flex items-center gap-2 rounded-full px-5 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-200">
            <span className="inline-flex h-2 w-2 rounded-full bg-emerald-300" />
            AI Production Suite
          </span>
          <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-slate-100 sm:text-5xl">
            Direct the impossible with <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-300 via-indigo-200 to-purple-300">Aladdin</span>
          </h1>
          <p className="mt-5 text-base text-slate-300 sm:text-lg">
            Orchestrate scripts, shots, and post-production through an agent-driven cinematic
            studio. Sign in to collaborate with specialists that bring your vision to life in
            minutes, not months.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 text-sm text-slate-400 sm:flex-row sm:items-center sm:text-base">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-emerald-300" />
              Production-ready infrastructure
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-sky-300" />
              Studio-grade quality metrics
            </div>
          </div>
        </div>

        <div className="w-full max-w-md">
          <LoginForm />
        </div>
      </div>
    </div>
  )
}
