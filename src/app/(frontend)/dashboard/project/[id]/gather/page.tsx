/**
 * Gather Page
 * Unqualified data collection and management system
 */

import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import GatherPageClient from './GatherPageClient'

interface GatherPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function GatherPage({ params }: GatherPageProps) {
  const { id: projectId } = await params

  // Validate project exists
  try {
    const payload = await getPayload({ config: await config })
    const project = await payload.findByID({
      collection: 'projects',
      id: projectId,
    })

    if (!project) {
      redirect('/dashboard/projects')
    }

    return (
      <Suspense fallback={<GatherPageSkeleton />}>
        <GatherPageClient projectId={projectId} projectName={project.name} />
      </Suspense>
    )
  } catch (error) {
    console.error('[Gather Page] Error:', error)
    redirect('/dashboard/projects')
  }
}

function GatherPageSkeleton() {
  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="h-8 w-64 bg-gray-200 rounded animate-pulse" />
      </div>
      <div className="flex-1 p-6">
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-24 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  )
}

