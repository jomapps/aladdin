/**
 * Agent Pool Management
 * Manages agent instances and configurations
 */

import { CodebuffClient } from '@codebuff/sdk'
import type { AladdinAgentDefinition } from '@/agents/types'
import { allAgents } from '@/agents'

export class AgentPool {
  private client: CodebuffClient
  private agentConfigs: Map<string, AladdinAgentDefinition> = new Map()

  constructor() {
    // Use OpenRouter if configured, otherwise use direct Anthropic
    const useOpenRouter = !!process.env.OPENROUTER_BASE_URL
    const apiKey = useOpenRouter
      ? process.env.OPENROUTER_API_KEY
      : process.env.CODEBUFF_API_KEY

    if (!apiKey) {
      throw new Error(
        useOpenRouter
          ? 'OPENROUTER_API_KEY is required when OPENROUTER_BASE_URL is set'
          : 'CODEBUFF_API_KEY environment variable is required'
      )
    }

    this.client = new CodebuffClient({
      apiKey,
      baseURL: useOpenRouter ? process.env.OPENROUTER_BASE_URL : undefined,
    })

    console.log(
      useOpenRouter
        ? `🌐 AgentPool using OpenRouter at ${process.env.OPENROUTER_BASE_URL}`
        : '🤖 AgentPool using direct Anthropic API'
    )

    // Register all agents from the agent registry
    console.log('🚀 Registering all Aladdin agents...')
    allAgents.forEach((agent) => {
      this.registerAgent(agent)
    })
    console.log(`✅ Registered ${allAgents.length} agents total`)
  }

  /**
   * Register an agent configuration
   */
  registerAgent(config: AladdinAgentDefinition): void {
    this.agentConfigs.set(config.id, config)
    console.log(`✅ Registered agent: ${config.displayName} (${config.id})`)
  }

  /**
   * Get agent configuration by ID
   */
  getAgentConfig(agentId: string): AladdinAgentDefinition | undefined {
    return this.agentConfigs.get(agentId)
  }

  /**
   * Run an agent with given parameters
   */
  async runAgent(
    agentId: string,
    prompt: string,
    options: {
      customToolDefinitions?: any[]
      previousRun?: any
      handleEvent?: (event: any) => void
    } = {},
  ) {
    const config = this.getAgentConfig(agentId)
    if (!config) {
      throw new Error(`Agent not found: ${agentId}`)
    }

    console.log(`🤖 Running agent: ${config.displayName}`)

    return await this.client.run({
      agent: agentId,
      prompt,
      ...options,
    })
  }

  /**
   * List all registered agents
   */
  listAgents(): AladdinAgentDefinition[] {
    return Array.from(this.agentConfigs.values())
  }

  /**
   * Get agents by level
   */
  getAgentsByLevel(level: 'master' | 'department' | 'specialist'): AladdinAgentDefinition[] {
    return this.listAgents().filter((agent) => agent.agentLevel === level)
  }

  /**
   * Get agents by department
   */
  getAgentsByDepartment(department: string): AladdinAgentDefinition[] {
    return this.listAgents().filter((agent) => agent.department === department)
  }
}

// Singleton instance
let agentPoolInstance: AgentPool | null = null

export function getAgentPool(): AgentPool {
  if (!agentPoolInstance) {
    agentPoolInstance = new AgentPool()
  }
  return agentPoolInstance
}
