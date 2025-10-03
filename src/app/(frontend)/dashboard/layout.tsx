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
      <div className="min-h-screen bg-gray-50">
        <DashboardNav user={user} />
        <main className="w-full px-4 sm:px-6 lg:px-8 py-8">{children}</main>
      </div>
    </AppProviders>
  )
}
