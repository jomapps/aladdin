import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import { redirect } from 'next/navigation'
import React from 'react'

import config from '@/payload.config'
import DashboardNav from '@/components/dashboard/DashboardNav'
import { AppProviders } from '@/providers/AppProviders'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  // If user is not authenticated, redirect to home page
  if (!user) {
    redirect('/')
  }

  return (
    <AppProviders>
      <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
        <div className="pointer-events-none absolute inset-0 opacity-90" aria-hidden>
          <div className="absolute inset-0 bg-[linear-gradient(160deg,#020617_0%,#050b19_55%,#0b172f_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(900px_circle_at_20%_15%,rgba(56,189,248,0.35),transparent_65%)] mix-blend-screen" />
          <div className="absolute inset-0 bg-[radial-gradient(1100px_circle_at_80%_0%,rgba(124,58,237,0.32),transparent_72%)] mix-blend-screen" />
        </div>

        <div className="relative z-10 flex min-h-screen flex-col">
          <DashboardNav user={user} />
          <main className="mx-auto w-full flex-1 px-4 py-10 sm:px-6 lg:px-10">{children}</main>
        </div>
      </div>
    </AppProviders>
  )
}
