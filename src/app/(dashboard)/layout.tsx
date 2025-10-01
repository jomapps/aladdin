import { ReactNode } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { AppProviders } from '@/providers/AppProviders'
import { ErrorBoundary } from '@/components/ErrorBoundary'

interface DashboardLayoutProps {
  children: ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  // TODO: Get user from session/auth
  const user = {
    id: '1',
    email: 'user@example.com',
    name: 'Demo User',
  }

  return (
    <ErrorBoundary>
      <AppProviders>
        <AppLayout user={user}>{children}</AppLayout>
      </AppProviders>
    </ErrorBoundary>
  )
}
