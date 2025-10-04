/**
 * Relationship Discoverer - Uses relationship-discoverer agent
 * MIGRATED TO AGENT-BASED ARCHITECTURE
 */

import { AIAgentExecutor } from '@/lib/ai/agent-executor'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import type { AgentConfig } from './types'

export class RelationshipDiscoverer {
  constructor(llm: any, config: AgentConfig) {
    console.log('[RelationshipDiscoverer] Using agent-based architecture')
  }

  async discover(content: string, context: any, projectId: string): Promise<any[]> {
    const payload = await getPayload({ config: await configPromise })
    const executor = new AIAgentExecutor(payload)

    const result = await executor.execute({
      agentId: 'relationship-discoverer',
      prompt: `Find relationships in this content:

${content}

Context: ${JSON.stringify(context)}

Return JSON array of relationships with: type, targetId, strength (0-1)`,
      context: { projectId, userId: 'system' },
    })

    try {
      return JSON.parse(result.content)
    } catch {
      return []
    }
  }
}
