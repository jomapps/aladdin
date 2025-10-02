/**
 * Project Layout
 * Shared layout for all project pages - includes RightOrchestrator (AI Chat)
 */

import RightOrchestrator from '@/components/layout/RightOrchestrator'

export default function ProjectLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      {/* AI Chat - Available on all project pages */}
      <RightOrchestrator />
    </>
  )
}

