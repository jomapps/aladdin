/**
 * Master Orchestrator
 * Coordinates multi-agent workflows and department routing
 */

import { AladdinAgentRunner, type AgentExecutionContext } from './AladdinAgentRunner'
import type { Payload } from 'payload'
import { getPayload } from 'payload'
import config from '@/payload.config'

/**
 * Orchestration request
 */
export interface OrchestrationRequest {
  prompt: string
  projectId: string
  conversationId?: string
  userId?: string
  metadata?: Record<string, unknown>
}

/**
 * Orchestration result
 */
export interface OrchestrationResult {
  masterOutput: string
  departmentResults: DepartmentResult[]
  totalExecutionTime: number
  totalTokens: number
  estimatedCost: number
  success: boolean
  error?: string
}

/**
 * Department execution result
 */
export interface DepartmentResult {
  departmentId: string
  departmentName: string
  departmentHeadOutput: string
  specialistResults: SpecialistResult[]
  executionTime: number
  qualityScore?: number
}

/**
 * Specialist execution result
 */
export interface SpecialistResult {
  agentId: string
  agentName: string
  output: string
  executionTime: number
  qualityScore?: number
}

/**
 * Orchestrator class
 * Manages hierarchical agent execution: Master → Department Heads → Specialists
 */
export class Orchestrator {
  private runner: AladdinAgentRunner
  private payload: Payload

  constructor(payload: Payload) {
    this.runner = new AladdinAgentRunner(payload)
    this.payload = payload
  }

  /**
   * Execute orchestrated workflow
   * 
   * Flow:
   * 1. Master Orchestrator analyzes request
   * 2. Routes to relevant department heads
   * 3. Department heads delegate to specialists
   * 4. Results aggregated and returned
   */
  async orchestrate(request: OrchestrationRequest): Promise<OrchestrationResult> {
    const startTime = Date.now()
    console.log('[Orchestrator] Starting orchestration...')

    try {
      // 1. Execute Master Orchestrator
      const masterResult = await this.executeMasterOrchestrator(request)

      // 2. Parse department routing from master output
      const departmentRouting = this.parseDepartmentRouting(masterResult.output)

      // 3. Execute department heads in parallel
      const departmentResults = await this.executeDepartments(departmentRouting, request)

      // 4. Calculate totals
      const totalExecutionTime = Date.now() - startTime
      const totalTokens = this.calculateTotalTokens([masterResult, ...departmentResults.flatMap(d => d.specialistResults)])
      const estimatedCost = this.calculateTotalCost([masterResult, ...departmentResults.flatMap(d => d.specialistResults)])

      return {
        masterOutput: masterResult.output,
        departmentResults,
        totalExecutionTime,
        totalTokens,
        estimatedCost,
        success: true,
      }
    } catch (error) {
      console.error('[Orchestrator] Orchestration failed:', error)

      return {
        masterOutput: '',
        departmentResults: [],
        totalExecutionTime: Date.now() - startTime,
        totalTokens: 0,
        estimatedCost: 0,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  /**
   * Execute Master Orchestrator agent
   */
  private async executeMasterOrchestrator(request: OrchestrationRequest) {
    console.log('[Orchestrator] Executing Master Orchestrator...')

    const context: AgentExecutionContext = {
      projectId: request.projectId,
      conversationId: request.conversationId || `orchestration-${Date.now()}`,
      metadata: {
        userId: request.userId,
        ...request.metadata,
      },
    }

    // Find master orchestrator agent
    const masterAgent = await this.findMasterOrchestrator()

    return await this.runner.executeAgent(
      masterAgent.agentId,
      request.prompt,
      context,
    )
  }

  /**
   * Execute department heads based on routing
   */
  private async executeDepartments(
    routing: Array<{ departmentSlug: string; instructions: string }>,
    request: OrchestrationRequest,
  ): Promise<DepartmentResult[]> {
    console.log(`[Orchestrator] Executing ${routing.length} departments...`)

    const results = await Promise.all(
      routing.map(async (route) => {
        try {
          // Find department head agent
          const deptHead = await this.findDepartmentHead(route.departmentSlug)

          const context: AgentExecutionContext = {
            projectId: request.projectId,
            conversationId: request.conversationId || `dept-${Date.now()}`,
            metadata: {
              userId: request.userId,
              department: route.departmentSlug,
              ...request.metadata,
            },
          }

          // Execute department head
          const deptResult = await this.runner.executeAgent(
            deptHead.agentId,
            route.instructions,
            context,
          )

          // Parse specialist routing from department head output
          const specialistRouting = this.parseSpecialistRouting(deptResult.output)

          // Execute specialists if any
          const specialistResults = await this.executeSpecialists(
            specialistRouting,
            route.departmentSlug,
            request,
          )

          return {
            departmentId: deptHead.id,
            departmentName: deptHead.name,
            departmentHeadOutput: deptResult.output,
            specialistResults,
            executionTime: deptResult.executionTime,
            qualityScore: deptResult.qualityScore,
          }
        } catch (error) {
          console.error(`[Orchestrator] Department execution failed (${route.departmentSlug}):`, error)

          return {
            departmentId: route.departmentSlug,
            departmentName: route.departmentSlug,
            departmentHeadOutput: `Error: ${error instanceof Error ? error.message : String(error)}`,
            specialistResults: [],
            executionTime: 0,
          }
        }
      }),
    )

    return results
  }

  /**
   * Execute specialist agents
   */
  private async executeSpecialists(
    routing: Array<{ agentId: string; instructions: string }>,
    departmentSlug: string,
    request: OrchestrationRequest,
  ): Promise<SpecialistResult[]> {
    if (routing.length === 0) return []

    console.log(`[Orchestrator] Executing ${routing.length} specialists for ${departmentSlug}...`)

    const results = await Promise.all(
      routing.map(async (route) => {
        try {
          const context: AgentExecutionContext = {
            projectId: request.projectId,
            conversationId: request.conversationId || `specialist-${Date.now()}`,
            metadata: {
              userId: request.userId,
              department: departmentSlug,
              ...request.metadata,
            },
          }

          const result = await this.runner.executeAgent(
            route.agentId,
            route.instructions,
            context,
          )

          return {
            agentId: route.agentId,
            agentName: route.agentId,
            output: result.output,
            executionTime: result.executionTime,
            qualityScore: result.qualityScore,
          }
        } catch (error) {
          console.error(`[Orchestrator] Specialist execution failed (${route.agentId}):`, error)

          return {
            agentId: route.agentId,
            agentName: route.agentId,
            output: `Error: ${error instanceof Error ? error.message : String(error)}`,
            executionTime: 0,
          }
        }
      }),
    )

    return results
  }

  /**
   * Find master orchestrator agent
   */
  private async findMasterOrchestrator() {
    const result = await this.payload.find({
      collection: 'agents',
      where: {
        agentLevel: { equals: 'master' },
        isActive: { equals: true },
      },
      limit: 1,
    })

    if (!result.docs.length) {
      throw new Error('Master orchestrator agent not found')
    }

    return result.docs[0]
  }

  /**
   * Find department head agent by department slug
   */
  private async findDepartmentHead(departmentSlug: string) {
    // First find the department
    const deptResult = await this.payload.find({
      collection: 'departments',
      where: {
        slug: { equals: departmentSlug },
      },
      limit: 1,
    })

    if (!deptResult.docs.length) {
      throw new Error(`Department not found: ${departmentSlug}`)
    }

    const department = deptResult.docs[0]

    // Find department head agent
    const agentResult = await this.payload.find({
      collection: 'agents',
      where: {
        department: { equals: department.id },
        isDepartmentHead: { equals: true },
        isActive: { equals: true },
      },
      limit: 1,
    })

    if (!agentResult.docs.length) {
      throw new Error(`Department head not found for: ${departmentSlug}`)
    }

    return agentResult.docs[0]
  }

  /**
   * Parse department routing from master orchestrator output
   * Expected format: JSON array of {departmentSlug, instructions}
   */
  private parseDepartmentRouting(output: string): Array<{ departmentSlug: string; instructions: string }> {
    // Simple parsing - can be enhanced with structured outputs
    // For now, return empty array (will be enhanced in next iteration)
    return []
  }

  /**
   * Parse specialist routing from department head output
   */
  private parseSpecialistRouting(output: string): Array<{ agentId: string; instructions: string }> {
    // Simple parsing - can be enhanced with structured outputs
    return []
  }

  /**
   * Calculate total tokens used
   */
  private calculateTotalTokens(results: Array<{ tokenUsage?: { totalTokens: number } }>): number {
    return results.reduce((sum, r) => sum + (r.tokenUsage?.totalTokens || 0), 0)
  }

  /**
   * Calculate total estimated cost
   */
  private calculateTotalCost(results: Array<{ tokenUsage?: { estimatedCost?: number } }>): number {
    return results.reduce((sum, r) => sum + (r.tokenUsage?.estimatedCost || 0), 0)
  }
}

/**
 * Get or create global orchestrator instance
 */
let orchestratorInstance: Orchestrator | null = null

export async function getOrchestrator(): Promise<Orchestrator> {
  if (!orchestratorInstance) {
    const payload = await getPayload({ config })
    orchestratorInstance = new Orchestrator(payload)
  }
  return orchestratorInstance
}

/**
 * Execute orchestrated workflow (convenience function)
 */
export async function orchestrate(request: OrchestrationRequest): Promise<OrchestrationResult> {
  const orchestrator = await getOrchestrator()
  return await orchestrator.orchestrate(request)
}

