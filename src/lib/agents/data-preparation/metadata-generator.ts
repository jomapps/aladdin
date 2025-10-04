/**
 * Metadata Generator - Uses metadata-generator agent
 * MIGRATED TO AGENT-BASED ARCHITECTURE
 */

import { AIAgentExecutor } from '@/lib/ai/agent-executor'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import type { AgentConfig } from './types'

export class MetadataGenerator {
  constructor(llm: any, config: AgentConfig, configManager?: any) {
    console.log('[MetadataGenerator] Using agent-based architecture')
  }

  async generate(content: string, entityType: string, projectId: string): Promise<any> {
    const payload = await getPayload({ config: await configPromise })
    const executor = new AIAgentExecutor(payload)

    const result = await executor.execute({
      agentId: 'metadata-generator',
      prompt: `Generate metadata for this ${entityType}:

${content}

Return JSON with: tags (array), categories (array), summary (string)`,
      context: { projectId, userId: 'system' },
    })

    try {
      return JSON.parse(result.content)
    } catch {
      return { tags: [], categories: [], summary: result.content.substring(0, 100) }
    }
  }
}
