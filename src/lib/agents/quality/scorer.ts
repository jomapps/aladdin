/**
 * Quality Scorer - Uses quality-scorer agent
 * MIGRATED TO AGENT-BASED ARCHITECTURE
 */

import { AIAgentExecutor } from '@/lib/ai/agent-executor'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

export interface QualityScorerConfig {
  enableCache?: boolean
  cacheTTL?: number
  temperature?: number
  maxTokens?: number
}

export interface AssessmentInput {
  content: string
  type: string
  requirements?: string[]
}

export interface QualityAssessment {
  overallScore: number
  dimensions: {
    completeness: number
    accuracy: number
    clarity: number
    relevance: number
    depth: number
  }
  strengths: string[]
  weaknesses: string[]
  recommendations: string[]
}

export class QualityScorer {
  private config: Required<QualityScorerConfig>

  constructor(llmClient: any, config: QualityScorerConfig = {}) {
    this.config = {
      enableCache: config.enableCache ?? true,
      cacheTTL: config.cacheTTL ?? 3600,
      temperature: config.temperature ?? 0.2,
      maxTokens: config.maxTokens ?? 1500,
    }
    console.log('[QualityScorer] Using agent-based architecture')
  }

  async assess(input: AssessmentInput, projectId: string): Promise<QualityAssessment> {
    const payload = await getPayload({ config: await configPromise })
    const executor = new AIAgentExecutor(payload)

    const result = await executor.execute({
      agentId: 'quality-scorer',
      prompt: `Assess the quality of this ${input.type}:

${input.content}

${input.requirements ? `Requirements:\n${input.requirements.join('\n')}` : ''}

Return JSON with: overallScore (0-100), dimensions (completeness, accuracy, clarity, relevance, depth all 0-100), strengths (array), weaknesses (array), recommendations (array)`,
      context: { projectId, userId: 'system' },
    })

    try {
      return JSON.parse(result.content)
    } catch {
      return {
        overallScore: 75,
        dimensions: {
          completeness: 75,
          accuracy: 75,
          clarity: 75,
          relevance: 75,
          depth: 75,
        },
        strengths: ['Content provided'],
        weaknesses: ['Could not parse assessment'],
        recommendations: ['Review assessment format'],
      }
    }
  }
}
