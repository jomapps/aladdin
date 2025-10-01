/**
 * Chat Page - Server Component Wrapper
 * Phase 2: Chat Interface with AI Agents
 */

import { redirect } from 'next/navigation'
import { getPayloadHMR } from '@payloadcms/next/utilities'
import configPromise from '@payload-config'
import ChatInterface from './ChatInterface'

export default async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const payload = await getPayloadHMR({ config: configPromise })
  const { user } = await payload.auth({ req: undefined as any })

  if (!user) {
    redirect('/')
  }

  // Fetch project
  const project = await payload.findByID({
    collection: 'projects',
    id,
  })

  if (!project) {
    redirect('/dashboard')
  }

  return (
    <div className="h-screen flex flex-col">
      <header className="border-b border-gray-200 bg-white px-6 py-4">
        <h1 className="text-2xl font-bold">{project.name} - Chat</h1>
        <p className="text-sm text-gray-600 mt-1">
          Collaborate with AI agents to develop your project
        </p>
      </header>

      <main className="flex-1 overflow-hidden">
        <ChatInterface projectId={id} projectSlug={project.slug} userId={user.id} />
      </main>
    </div>
  )
}
