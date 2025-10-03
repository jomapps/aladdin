/**
 * Project Layout
 * Shared layout for all project pages - includes RightOrchestrator (AI Chat)
 */

import ProjectLayoutClient from './ProjectLayoutClient'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const { id: projectId } = await params

  // Fetch project name server-side to display in RightOrchestrator header
  let projectName: string | undefined
  try {
    const payload = await getPayload({ config: await configPromise })
    const project = await payload.findByID({ collection: 'projects', id: projectId })
    projectName = project?.name as string | undefined
  } catch (err) {
    // Non-fatal: header will just show default title
    projectName = undefined
  }

  return (
    <ProjectLayoutClient projectId={projectId} projectName={projectName}>
      {children}
    </ProjectLayoutClient>
  )
}
