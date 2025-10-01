import type { AgentDefinition } from '@codebuff/sdk'
import type { Payload } from 'payload'

/**
 * PayloadCMS Agent document type
 */
export interface PayloadAgent {
  id: string
  agentId: string
  name: string
  model: string
  instructionsPrompt: string
  toolNames?: Array<{ toolName: string }>
  maxAgentSteps?: number
  isDepartmentHead: boolean
  department: string | Record<string, unknown>
  executionSettings?: {
    temperature?: number
    timeout?: number
    maxRetries?: number
  }
}

/**
 * PayloadCMS Custom Tool document type
 */
export interface PayloadCustomTool {
  toolName: string
  displayName: string
  description: string
  inputSchema: unknown
  outputSchema?: unknown
  exampleInputs?: Array<{ example: unknown }>
  executeFunction: string
  setupCode?: string
  isActive: boolean
}

/**
 * Agent definition with extended metadata
 */
export interface ExtendedAgentDefinition extends AgentDefinition {
  metadata?: {
    isDepartmentHead: boolean
    department: string
    specialization?: string
    skills?: string[]
    qualityThreshold?: number
    executionSettings?: Record<string, unknown>
  }
}

/**
 * Agent Definition Mapper Utilities
 *
 * Provides utilities for mapping PayloadCMS agent definitions to @codebuff/sdk format.
 * Handles conversion of agents, tools, and execution parameters.
 *
 * @example
 * ```typescript
 * const mapper = new AgentDefinitionMapper(payload);
 *
 * // Map single agent
 * const agentDef = await mapper.mapAgent('story-head-001');
 *
 * // Map department agents
 * const deptAgents = await mapper.mapDepartmentAgents('dept-story');
 *
 * // Map custom tools
 * const tools = await mapper.mapCustomTools(['tool-1', 'tool-2']);
 * ```
 */
export class AgentDefinitionMapper {
  private payload: Payload

  /**
   * Create a new AgentDefinitionMapper
   *
   * @param payload - PayloadCMS instance
   */
  constructor(payload: Payload) {
    this.payload = payload
  }

  /**
   * Map a single PayloadCMS agent to @codebuff/sdk AgentDefinition
   *
   * @param agentId - Agent ID to map
   * @param includeMetadata - Whether to include extended metadata
   * @returns Agent definition
   */
  async mapAgent(agentId: string, includeMetadata = false): Promise<ExtendedAgentDefinition> {
    const agentDoc = await this.payload.find({
      collection: 'agents',
      where: {
        agentId: { equals: agentId },
        isActive: { equals: true },
      },
      limit: 1,
    })

    if (!agentDoc.docs.length) {
      throw new Error(`Agent not found: ${agentId}`)
    }

    return this.mapAgentDocument(agentDoc.docs[0], includeMetadata)
  }

  /**
   * Map multiple agents by IDs
   *
   * @param agentIds - Array of agent IDs
   * @param includeMetadata - Whether to include extended metadata
   * @returns Array of agent definitions
   */
  async mapAgents(agentIds: string[], includeMetadata = false): Promise<ExtendedAgentDefinition[]> {
    const agentsDoc = await this.payload.find({
      collection: 'agents',
      where: {
        agentId: { in: agentIds },
        isActive: { equals: true },
      },
      limit: agentIds.length,
    })

    return agentsDoc.docs.map(agent => this.mapAgentDocument(agent, includeMetadata))
  }

  /**
   * Map all agents in a department
   *
   * @param departmentId - Department ID
   * @param includeMetadata - Whether to include extended metadata
   * @returns Array of agent definitions
   */
  async mapDepartmentAgents(
    departmentId: string,
    includeMetadata = false
  ): Promise<ExtendedAgentDefinition[]> {
    const agentsDoc = await this.payload.find({
      collection: 'agents',
      where: {
        department: { equals: departmentId },
        isActive: { equals: true },
      },
      sort: '-isDepartmentHead',
    })

    return agentsDoc.docs.map(agent => this.mapAgentDocument(agent, includeMetadata))
  }

  /**
   * Map PayloadCMS agent document to AgentDefinition
   *
   * @param agent - PayloadCMS agent document
   * @param includeMetadata - Whether to include extended metadata
   * @returns Agent definition
   */
  mapAgentDocument(agent: any, includeMetadata = false): ExtendedAgentDefinition {
    const definition: ExtendedAgentDefinition = {
      id: agent.agentId,
      model: agent.model,
      displayName: agent.name,
      toolNames: agent.toolNames?.map((t: any) => t.toolName) || [],
      instructionsPrompt: agent.instructionsPrompt,
    }

    if (includeMetadata) {
      definition.metadata = {
        isDepartmentHead: agent.isDepartmentHead,
        department: typeof agent.department === 'string' ? agent.department : agent.department?.id,
        specialization: agent.specialization,
        skills: agent.skills?.map((s: any) => s.skill) || [],
        qualityThreshold: agent.qualityThreshold,
        executionSettings: agent.executionSettings,
      }
    }

    return definition
  }

  /**
   * Map custom tools by tool names
   *
   * @param toolNames - Array of tool names
   * @returns Array of custom tool definitions
   */
  async mapCustomTools(toolNames: string[]): Promise<any[]> {
    if (!toolNames.length) {
      return []
    }

    const toolsDoc = await this.payload.find({
      collection: 'custom-tools',
      where: {
        toolName: { in: toolNames },
        isActive: { equals: true },
      },
      limit: toolNames.length,
    })

    return toolsDoc.docs.map(tool => this.mapToolDocument(tool)).filter(Boolean)
  }

  /**
   * Map all global custom tools
   *
   * @returns Array of global tool definitions
   */
  async mapGlobalTools(): Promise<any[]> {
    const toolsDoc = await this.payload.find({
      collection: 'custom-tools',
      where: {
        isGlobal: { equals: true },
        isActive: { equals: true },
      },
      limit: 100,
    })

    return toolsDoc.docs.map(tool => this.mapToolDocument(tool)).filter(Boolean)
  }

  /**
   * Map custom tools for a department
   *
   * @param departmentId - Department ID
   * @returns Array of tool definitions
   */
  async mapDepartmentTools(departmentId: string): Promise<any[]> {
    const toolsDoc = await this.payload.find({
      collection: 'custom-tools',
      where: {
        or: [
          { isGlobal: { equals: true } },
          { departments: { contains: departmentId } },
        ],
        isActive: { equals: true },
      },
      limit: 100,
    })

    return toolsDoc.docs.map(tool => this.mapToolDocument(tool)).filter(Boolean)
  }

  /**
   * Map custom tools for a specific agent
   *
   * @param agentId - Agent ID
   * @returns Array of tool definitions
   */
  async mapAgentTools(agentId: string): Promise<any[]> {
    // Get agent first
    const agent = await this.mapAgent(agentId, true)

    if (!agent.toolNames?.length) {
      // Return global tools if agent has no specific tools
      return this.mapGlobalTools()
    }

    // Get agent's department tools filtered by agent's toolNames
    const agentDoc = await this.payload.find({
      collection: 'agents',
      where: {
        agentId: { equals: agentId },
      },
      limit: 1,
    })

    if (!agentDoc.docs.length) {
      return []
    }

    const departmentId = typeof agentDoc.docs[0].department === 'string'
      ? agentDoc.docs[0].department
      : agentDoc.docs[0].department?.id

    const toolsDoc = await this.payload.find({
      collection: 'custom-tools',
      where: {
        and: [
          {
            or: [
              { isGlobal: { equals: true } },
              { departments: { contains: departmentId } },
            ],
          },
          { toolName: { in: agent.toolNames } },
          { isActive: { equals: true } },
        ],
      },
      limit: 100,
    })

    return toolsDoc.docs.map(tool => this.mapToolDocument(tool)).filter(Boolean)
  }

  /**
   * Map PayloadCMS tool document to @codebuff/sdk tool definition
   *
   * @param tool - PayloadCMS tool document
   * @returns Tool definition or null if invalid
   */
  private mapToolDocument(tool: any): any | null {
    try {
      // Parse and create executable function
      let executeFunction: Function

      try {
        executeFunction = new Function(`return ${tool.executeFunction}`)()
      } catch (error) {
        console.error(`Failed to parse execute function for tool ${tool.toolName}:`, error)
        return null
      }

      return {
        toolName: tool.toolName,
        description: tool.description,
        inputSchema: tool.inputSchema,
        exampleInputs: tool.exampleInputs?.map((e: any) => e.example) || [],
        execute: executeFunction,
      }
    } catch (error) {
      console.error(`Failed to map tool ${tool.toolName}:`, error)
      return null
    }
  }

  /**
   * Validate agent definition completeness
   *
   * @param definition - Agent definition to validate
   * @returns Validation result with errors
   */
  validateAgentDefinition(definition: ExtendedAgentDefinition): {
    valid: boolean
    errors: string[]
  } {
    const errors: string[] = []

    if (!definition.id) {
      errors.push('Agent ID is required')
    }

    if (!definition.model) {
      errors.push('Model is required')
    }

    if (!definition.instructionsPrompt) {
      errors.push('Instructions prompt is required')
    }

    if (definition.instructionsPrompt && definition.instructionsPrompt.length < 50) {
      errors.push('Instructions prompt should be at least 50 characters')
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  /**
   * Get agent execution configuration
   *
   * @param agentId - Agent ID
   * @returns Execution configuration
   */
  async getAgentExecutionConfig(agentId: string): Promise<{
    maxAgentSteps: number
    temperature: number
    timeout: number
    maxRetries: number
  }> {
    const agentDoc = await this.payload.find({
      collection: 'agents',
      where: {
        agentId: { equals: agentId },
      },
      limit: 1,
    })

    if (!agentDoc.docs.length) {
      throw new Error(`Agent not found: ${agentId}`)
    }

    const agent = agentDoc.docs[0]
    const settings = agent.executionSettings || {}

    return {
      maxAgentSteps: agent.maxAgentSteps || 20,
      temperature: settings.temperature || 0.7,
      timeout: settings.timeout || 300,
      maxRetries: settings.maxRetries || 3,
    }
  }
}

/**
 * Helper function to create agent definition from PayloadCMS agent
 *
 * @param agent - PayloadCMS agent document
 * @returns Agent definition for @codebuff/sdk
 */
export function createAgentDefinition(agent: PayloadAgent): AgentDefinition {
  return {
    id: agent.agentId,
    model: agent.model,
    displayName: agent.name,
    toolNames: agent.toolNames?.map(t => t.toolName) || [],
    instructionsPrompt: agent.instructionsPrompt,
  }
}

/**
 * Helper function to extract tool names from agents
 *
 * @param agents - Array of PayloadCMS agents
 * @returns Array of unique tool names
 */
export function extractToolNames(agents: PayloadAgent[]): string[] {
  const toolNames = new Set<string>()

  agents.forEach(agent => {
    agent.toolNames?.forEach(t => toolNames.add(t.toolName))
  })

  return Array.from(toolNames)
}

/**
 * Helper function to group agents by department
 *
 * @param agents - Array of PayloadCMS agents
 * @returns Map of department ID to agents
 */
export function groupAgentsByDepartment(agents: PayloadAgent[]): Map<string, PayloadAgent[]> {
  const grouped = new Map<string, PayloadAgent[]>()

  agents.forEach(agent => {
    const deptId = typeof agent.department === 'string' ? agent.department : agent.department.id
    if (!grouped.has(deptId as string)) {
      grouped.set(deptId as string, [])
    }
    grouped.get(deptId as string)!.push(agent)
  })

  return grouped
}
