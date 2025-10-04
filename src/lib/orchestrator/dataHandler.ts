/**
 * Data Mode Handler - Uses data-enricher agent
 * MIGRATED TO AGENT-BASED ARCHITECTURE
 */

import { AladdinAgentRunner } from '@/lib/agents/AladdinAgentRunner'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

export interface DataHandlerOptions {
  content: string | object
  projectId: string
  conversationId?: string
  userId: string
  imageUrl?: string
  documentUrl?: string
}

export interface DataHandlerResult {
  conversationId: string
  gatherItemId: string
  message: string
  summary: string
  context: string
  duplicates: Array<{
    id: string
    similarity: number
    suggestion: 'skip' | 'merge' | 'review'
  }>
}

export async function handleData(options: DataHandlerOptions): Promise<DataHandlerResult> {
  const { content, projectId, userId } = options
  const payload = await getPayload({ config: await configPromise })
  const runner = new AladdinAgentRunner(payload)

  // Use data-enricher agent
  const result = await runner.execute({
    agentId: 'data-enricher',
    prompt: `Enrich this content for the Gather system:

${typeof content === 'string' ? content : JSON.stringify(content, null, 2)}

Provide:
1. Summary (100-150 words)
2. Context explaining its relevance
3. Suggested category

Format as JSON`,
    context: { projectId, userId },
  })

  // Create gather item (simplified)
  const gatherItemId = `gather-${Date.now()}`

  return {
    conversationId: options.conversationId || `conv-${Date.now()}`,
    gatherItemId,
    message: 'Content enriched and ready for storage',
    summary: result.content.substring(0, 150),
    context: 'Enriched via data-enricher agent',
    duplicates: [],
  }
}
