/**
 * Project Dashboard Main Page
 * Phase 7: Production Polish - Integrated Components
 */

import { redirect } from 'next/navigation'
import { getPayloadHMR } from '@payloadcms/next/utilities'
import configPromise from '@payload-config'
import { Suspense } from 'react'
import DashboardClient from './DashboardClient'

export default async function ProjectDashboardPage({
  params,
}: {
  params: { id: string }
}) {
  const payload = await getPayloadHMR({ config: configPromise })
  const { user } = await payload.auth({ req: undefined as any })

  if (!user) {
    redirect('/')
  }

  // Fetch project
  const project = await payload.findByID({
    collection: 'projects',
    id: params.id,
  })

  if (!project) {
    redirect('/dashboard')
  }

  // Mock scenes data for timeline
  const mockScenes = [
    {
      id: '1',
      name: 'Opening Scene',
      startTime: 0,
      duration: 5,
      status: 'complete' as const,
    },
    {
      id: '2',
      name: 'Character Introduction',
      startTime: 5,
      duration: 8,
      status: 'processing' as const,
    },
    {
      id: '3',
      name: 'Climax',
      startTime: 13,
      duration: 6,
      status: 'draft' as const,
    },
  ]

  return (
    <DashboardClient
      projectId={params.id}
      projectName={project.name as string}
      scenes={mockScenes}
    />
  )
}
