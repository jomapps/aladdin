/**
 * Project Layout
 * Shared layout for all project pages - includes RightOrchestrator (AI Chat)
 */

import RightOrchestrator from '@/components/layout/RightOrchestrator'

export default function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { id: string }
}) {
  const projectId = params.id
  return (
    <>
      {children}
      {/* AI Chat - Available on all project pages */}
      <RightOrchestrator projectId={projectId} />
    </>
  )
}
