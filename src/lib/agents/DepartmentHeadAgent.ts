import type { Payload } from 'payload'
import { AladdinAgentRunner, type AgentExecutionContext, type AgentExecutionResult } from './AladdinAgentRunner'

/**
 * Request for department head processing
 */
export interface DepartmentHeadRequest {
  departmentId: string
  prompt: string
  context: AgentExecutionContext
  requiresSpecialists?: boolean
  minQualityThreshold?: number
}

/**
 * Result of specialist execution
 */
export interface SpecialistResult {
  agentId: string
  agentName: string
  specialization: string
  output: unknown
  qualityScore?: number
  executionTime: number
  reviewStatus: 'approved' | 'rejected' | 'revision-needed'
  reviewNotes?: string
}

/**
 * Result of department head processing
 */
export interface DepartmentHeadResult {
  departmentId: string
  departmentName: string
  headExecutionId: string
  output: unknown
  qualityScore: number
  specialistResults: SpecialistResult[]
  metadata: {
    analysisTime: number
    specialistsUsed: number
    totalExecutionTime: number
    successfulSpecialists: number
    failedSpecialists: number
  }
}

/**
 * Analysis of request complexity and requirements
 */
interface RequestAnalysis {
  complexity: 'simple' | 'moderate' | 'complex'
  requiredSkills: string[]
  estimatedSpecialists: number
  time: number
}

/**
 * DepartmentHeadAgent
 *
 * Orchestrates department-level workflows by coordinating specialist agents.
 *
 * Responsibilities:
 * 1. Analyze incoming requests and determine complexity
 * 2. Select and spawn appropriate specialist agents
 * 3. Delegate tasks to specialists (parallel execution)
 * 4. Review all specialist outputs
 * 5. Synthesize final department output
 * 6. Ensure quality thresholds are met
 *
 * @example
 * ```typescript
 * const departmentHead = new DepartmentHeadAgent(apiKey, payload);
 *
 * const result = await departmentHead.processRequest({
 *   departmentId: 'dept-story',
 *   prompt: 'Create a compelling opening sequence',
 *   context: {
 *     projectId: 'proj-123',
 *     conversationId: 'conv-456',
 *   },
 * });
 * ```
 */
export class DepartmentHeadAgent {
  private runner: AladdinAgentRunner
  private payload: Payload

  /**
   * Create a new DepartmentHeadAgent
   *
   * @param apiKey - Codebuff API key
   * @param payload - PayloadCMS instance
   * @param cwd - Current working directory
   */
  constructor(apiKey: string, payload: Payload, cwd?: string) {
    this.runner = new AladdinAgentRunner(apiKey, payload, cwd)
    this.payload = payload
  }

  /**
   * Process a request through department head and specialists
   *
   * @param request - Department head request
   * @returns Promise resolving to department head result
   */
  async processRequest(request: DepartmentHeadRequest): Promise<DepartmentHeadResult> {
    const startTime = Date.now()

    // 1. Fetch department
    const department = await this.payload.findByID({
      collection: 'departments',
      id: request.departmentId,
    })

    // 2. Fetch department head agent
    const headAgent = await this.getDepartmentHead(request.departmentId)

    // 3. Analyze request complexity
    const analysis = await this.analyzeRequest(request.prompt, headAgent.agentId)

    // 4. Determine if specialists are needed
    const needsSpecialists = request.requiresSpecialists !== false && analysis.complexity !== 'simple'

    let specialistResults: SpecialistResult[] = []
    let synthesisPrompt = request.prompt

    if (needsSpecialists) {
      // 5. Select required specialists
      const specialists = await this.selectSpecialists(request.departmentId, analysis)

      // 6. Spawn specialists in parallel
      specialistResults = await this.executeSpecialistsParallel(
        specialists,
        request.prompt,
        request.context
      )

      // 7. Review specialist outputs
      const reviewedResults = await this.reviewSpecialistOutputs(
        headAgent.agentId,
        specialistResults,
        request.minQualityThreshold || department.coordinationSettings?.minQualityThreshold || 80
      )

      specialistResults = reviewedResults

      // 8. Prepare synthesis prompt with specialist outputs
      synthesisPrompt = this.createSynthesisPrompt(request.prompt, reviewedResults)
    }

    // 9. Department head synthesizes final output
    const headResult = await this.runner.executeAgent(
      headAgent.agentId,
      synthesisPrompt,
      request.context
    )

    // 10. Assess final quality
    const qualityScore = await this.assessQuality(headResult.output, specialistResults)

    const totalExecutionTime = Date.now() - startTime

    return {
      departmentId: request.departmentId,
      departmentName: department.name,
      headExecutionId: headResult.executionId,
      output: headResult.output,
      qualityScore,
      specialistResults,
      metadata: {
        analysisTime: analysis.time,
        specialistsUsed: specialistResults.length,
        totalExecutionTime,
        successfulSpecialists: specialistResults.filter(r => r.reviewStatus === 'approved').length,
        failedSpecialists: specialistResults.filter(r => r.reviewStatus === 'rejected').length,
      },
    }
  }

  /**
   * Get department head agent
   *
   * @param departmentId - Department ID
   * @returns Department head agent
   */
  private async getDepartmentHead(departmentId: string): Promise<any> {
    const headQuery = await this.payload.find({
      collection: 'agents',
      where: {
        department: { equals: departmentId },
        isDepartmentHead: { equals: true },
        isActive: { equals: true },
      },
      limit: 1,
    })

    if (!headQuery.docs.length) {
      throw new Error(`No active department head found for department: ${departmentId}`)
    }

    return headQuery.docs[0]
  }

  /**
   * Analyze request to determine complexity and requirements
   *
   * @param prompt - User prompt
   * @param headAgentId - Department head agent ID
   * @returns Request analysis
   */
  private async analyzeRequest(prompt: string, headAgentId: string): Promise<RequestAnalysis> {
    const startTime = Date.now()

    // Simple heuristic-based analysis
    // In production, this could use the head agent to analyze
    const wordCount = prompt.split(/\s+/).length
    const hasMultipleParts = /and|also|additionally|furthermore/i.test(prompt)
    const hasComplexTerms = /complex|detailed|comprehensive|elaborate/i.test(prompt)

    let complexity: 'simple' | 'moderate' | 'complex' = 'simple'
    let estimatedSpecialists = 1

    if (wordCount > 100 || hasMultipleParts || hasComplexTerms) {
      complexity = 'complex'
      estimatedSpecialists = 4
    } else if (wordCount > 50 || hasMultipleParts) {
      complexity = 'moderate'
      estimatedSpecialists = 2
    }

    // Extract required skills (basic keyword matching)
    const requiredSkills: string[] = []
    const skillKeywords = {
      dialogue: ['dialogue', 'conversation', 'speech', 'talking'],
      plot: ['plot', 'story', 'narrative', 'storyline'],
      character: ['character', 'protagonist', 'personality', 'traits'],
      theme: ['theme', 'meaning', 'symbolism', 'message'],
      structure: ['structure', 'act', 'sequence', 'pacing'],
    }

    for (const [skill, keywords] of Object.entries(skillKeywords)) {
      if (keywords.some(keyword => prompt.toLowerCase().includes(keyword))) {
        requiredSkills.push(skill)
      }
    }

    return {
      complexity,
      requiredSkills,
      estimatedSpecialists,
      time: Date.now() - startTime,
    }
  }

  /**
   * Select appropriate specialist agents
   *
   * @param departmentId - Department ID
   * @param analysis - Request analysis
   * @returns Array of specialist agents
   */
  private async selectSpecialists(departmentId: string, analysis: RequestAnalysis): Promise<any[]> {
    const query: any = {
      department: { equals: departmentId },
      isDepartmentHead: { equals: false },
      isActive: { equals: true },
    }

    // Filter by required skills if available
    if (analysis.requiredSkills.length > 0) {
      query['skills.skill'] = { in: analysis.requiredSkills }
    }

    const specialistsQuery = await this.payload.find({
      collection: 'agents',
      where: query,
      sort: '-performanceMetrics.successRate',
      limit: analysis.estimatedSpecialists,
    })

    return specialistsQuery.docs
  }

  /**
   * Execute specialists in parallel
   *
   * @param specialists - Array of specialist agents
   * @param prompt - Original prompt
   * @param context - Execution context
   * @returns Array of specialist results
   */
  private async executeSpecialistsParallel(
    specialists: any[],
    prompt: string,
    context: AgentExecutionContext
  ): Promise<SpecialistResult[]> {
    const executions = specialists.map(async (specialist) => {
      const startTime = Date.now()

      try {
        const result = await this.runner.executeAgent(
          specialist.agentId,
          prompt,
          context
        )

        return {
          agentId: specialist.agentId,
          agentName: specialist.name,
          specialization: specialist.specialization || 'general',
          output: result.output,
          qualityScore: result.qualityScore,
          executionTime: Date.now() - startTime,
          reviewStatus: 'approved' as const,
        }
      } catch (error) {
        return {
          agentId: specialist.agentId,
          agentName: specialist.name,
          specialization: specialist.specialization || 'general',
          output: null,
          qualityScore: 0,
          executionTime: Date.now() - startTime,
          reviewStatus: 'rejected' as const,
          reviewNotes: error instanceof Error ? error.message : 'Execution failed',
        }
      }
    })

    return Promise.all(executions)
  }

  /**
   * Review specialist outputs for quality
   *
   * @param headAgentId - Department head agent ID
   * @param results - Specialist results
   * @param minThreshold - Minimum quality threshold
   * @returns Reviewed results
   */
  private async reviewSpecialistOutputs(
    headAgentId: string,
    results: SpecialistResult[],
    minThreshold: number
  ): Promise<SpecialistResult[]> {
    return results.map((result) => {
      // Simple quality assessment
      // In production, could use head agent to review
      const qualityScore = result.qualityScore || 75

      if (qualityScore < minThreshold) {
        return {
          ...result,
          reviewStatus: 'rejected',
          reviewNotes: `Quality score ${qualityScore} below threshold ${minThreshold}`,
        }
      }

      if (qualityScore < minThreshold + 10) {
        return {
          ...result,
          reviewStatus: 'revision-needed',
          reviewNotes: `Quality score ${qualityScore} is acceptable but could be improved`,
        }
      }

      return {
        ...result,
        reviewStatus: 'approved',
        reviewNotes: 'Approved by department head',
      }
    })
  }

  /**
   * Create synthesis prompt combining specialist outputs
   *
   * @param originalPrompt - Original user prompt
   * @param results - Specialist results
   * @returns Synthesis prompt
   */
  private createSynthesisPrompt(originalPrompt: string, results: SpecialistResult[]): string {
    const approvedResults = results.filter(r => r.reviewStatus === 'approved')

    let synthesisPrompt = `Original request: ${originalPrompt}\n\n`
    synthesisPrompt += `You are the department head. Review and synthesize the following specialist outputs into a cohesive final result:\n\n`

    approvedResults.forEach((result, index) => {
      synthesisPrompt += `## Specialist ${index + 1}: ${result.agentName} (${result.specialization})\n`
      synthesisPrompt += `Quality Score: ${result.qualityScore || 'N/A'}\n`
      synthesisPrompt += `Output:\n${JSON.stringify(result.output, null, 2)}\n\n`
    })

    synthesisPrompt += `\nPlease synthesize these outputs into a cohesive, high-quality final result that addresses the original request.`

    return synthesisPrompt
  }

  /**
   * Assess final quality of department output
   *
   * @param output - Final output
   * @param specialistResults - Specialist results
   * @returns Quality score (0-100)
   */
  private async assessQuality(output: unknown, specialistResults: SpecialistResult[]): Promise<number> {
    // Simple quality calculation based on specialist results
    if (specialistResults.length === 0) {
      return 85 // Default for head-only executions
    }

    const approvedCount = specialistResults.filter(r => r.reviewStatus === 'approved').length
    const totalCount = specialistResults.length

    const approvalRate = (approvedCount / totalCount) * 100
    const avgSpecialistScore = specialistResults.reduce((sum, r) => sum + (r.qualityScore || 0), 0) / totalCount

    // Weighted average: 60% approval rate, 40% specialist scores
    return Math.round(approvalRate * 0.6 + avgSpecialistScore * 0.4)
  }
}
