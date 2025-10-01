/**
 * Main Orchestration Logic
 * Handles hierarchical agent execution and coordination
 */

import { CodebuffClient } from '@codebuff/sdk'
import { masterOrchestratorAgent } from '@/agents/masterOrchestrator'
import { characterDepartmentHead } from '@/agents/departments/characterHead'
import {
  routeToDepartmentTool,
  queryBrainTool,
  getProjectContextTool,
  saveCharacterTool,
  gradeOutputTool,
} from '@/agents/tools'
import type { DepartmentReport, OrchestratorResult } from '@/agents/types'

export interface OrchestratorConfig {
  projectSlug: string
  userPrompt: string
  conversationId?: string
}

/**
 * Main orchestration entry point
 * Handles user request through Master Orchestrator → Department Heads → Specialists
 */
export async function handleUserRequest(config: OrchestratorConfig): Promise<OrchestratorResult> {
  const { projectSlug, userPrompt, conversationId } = config

  // Initialize Codebuff client
  const codebuff = new CodebuffClient({
    apiKey: process.env.CODEBUFF_API_KEY || '',
  })

  try {
    // 1. Master Orchestrator analyzes request
    console.log('🎬 Master Orchestrator analyzing request...')

    const orchestratorRun = await codebuff.run({
      agent: masterOrchestratorAgent.id,
      prompt: userPrompt,
      customToolDefinitions: [routeToDepartmentTool, queryBrainTool, getProjectContextTool],
    })

    // Extract departments needed from orchestrator output
    const departmentsNeeded = extractDepartments(orchestratorRun.output)
    console.log(`📋 Departments needed: ${departmentsNeeded.join(', ')}`)

    // 2. Route to department heads in parallel
    const departmentReports = await Promise.all(
      departmentsNeeded.map((dept) =>
        runDepartmentHead(
          codebuff,
          dept,
          orchestratorRun.output.instructions?.[dept] || userPrompt,
          projectSlug,
        ),
      ),
    )

    // 3. Orchestrator aggregates results
    console.log('🔄 Aggregating department reports...')

    const aggregated = await codebuff.run({
      agent: masterOrchestratorAgent.id,
      prompt: `Aggregate these department reports: ${JSON.stringify(departmentReports)}`,
      previousRun: orchestratorRun,
      customToolDefinitions: [queryBrainTool],
    })

    // 4. Calculate final quality scores
    const overallQuality = calculateOverallQuality(departmentReports)
    const consistency = calculateConsistency(departmentReports)

    // 5. Brain validation (TODO: implement real brain service validation)
    const brainValidation = {
      validated: false, // Default to false until real validation is implemented
      score: 0,
    }

    const result: OrchestratorResult = {
      departmentReports,
      consistency,
      completeness: calculateCompleteness(departmentReports),
      brainValidated: brainValidation.validated,
      brainQualityScore: brainValidation.score,
      overallQuality,
      recommendation:
        overallQuality >= 0.75 ? 'ingest' : overallQuality >= 0.5 ? 'modify' : 'discard',
    }

    console.log(`✅ Orchestration complete. Quality: ${overallQuality.toFixed(2)}`)
    return result
  } catch (error) {
    console.error('❌ Orchestration error:', error)
    throw error
  }
}

/**
 * Run a department head with its specialists
 */
async function runDepartmentHead(
  codebuff: CodebuffClient,
  departmentName: string,
  instructions: string,
  projectSlug: string,
): Promise<DepartmentReport> {
  console.log(`🏢 Running ${departmentName} department head...`)

  try {
    // Get department head configuration
    const deptHeadConfig = getDepartmentHeadConfig(departmentName)

    if (!deptHeadConfig) {
      return {
        department: departmentName,
        relevance: 0,
        status: 'not_relevant',
        outputs: [],
        departmentQuality: 0,
        issues: [`Department ${departmentName} not configured`],
        suggestions: [],
      }
    }

    // 1. Department head assesses relevance
    const deptHeadRun = await codebuff.run({
      agent: deptHeadConfig.id,
      prompt: instructions,
      customToolDefinitions: [gradeOutputTool, saveCharacterTool, getProjectContextTool],
    })

    // Extract relevance from output
    const relevance = extractRelevance(deptHeadRun.output)

    if (relevance < 0.3) {
      return {
        department: departmentName,
        relevance,
        status: 'not_relevant',
        outputs: [],
        departmentQuality: 0,
        issues: [],
        suggestions: [],
      }
    }

    // 2. Extract specialists needed
    const specialistsNeeded = extractSpecialists(deptHeadRun.output)
    console.log(`  👥 Spawning ${specialistsNeeded.length} specialists...`)

    // 3. Spawn specialists (TODO: implement real specialist agents)
    const specialistOutputs = specialistsNeeded.map((specialist) => ({
      specialistAgentId: specialist.id,
      output: {}, // Empty output until real specialists are implemented
      qualityScore: 0,
      relevanceScore: 0,
      consistencyScore: 0,
      overallScore: 0,
      issues: [],
      suggestions: [],
      decision: 'pending' as const,
      reasoning: 'Awaiting specialist implementation',
    }))

    // 4. Calculate department quality
    const departmentQuality =
      specialistOutputs.length > 0
        ? specialistOutputs.reduce((sum, o) => sum + o.overallScore, 0) / specialistOutputs.length
        : 0

    return {
      department: departmentName,
      relevance,
      status: 'complete',
      outputs: specialistOutputs,
      departmentQuality,
      issues: [],
      suggestions: [],
    }
  } catch (error) {
    console.error(`❌ Error in ${departmentName} department:`, error)
    return {
      department: departmentName,
      relevance: 0,
      status: 'pending',
      outputs: [],
      departmentQuality: 0,
      issues: [error instanceof Error ? error.message : 'Unknown error'],
      suggestions: [],
    }
  }
}

// Helper functions
function extractDepartments(output: any): string[] {
  // Parse orchestrator output for departments
  if (output.departments && Array.isArray(output.departments)) {
    return output.departments
  }
  // Default to character department for Phase 2
  return ['character']
}

function extractRelevance(output: any): number {
  if (output.relevance && typeof output.relevance === 'number') {
    return output.relevance
  }
  return 0.8 // Default relevance
}

function extractSpecialists(output: any): Array<{ id: string; instructions: string }> {
  if (output.specialists && Array.isArray(output.specialists)) {
    return output.specialists
  }
  // Default specialists for character department
  return [
    { id: 'character-creator', instructions: 'Create character profile' },
    { id: 'hair-stylist', instructions: 'Design hairstyle' },
  ]
}

function getDepartmentHeadConfig(department: string) {
  const configs: Record<string, any> = {
    character: characterDepartmentHead,
    // Add other departments as they're implemented
  }
  return configs[department]
}

function calculateOverallQuality(reports: DepartmentReport[]): number {
  if (reports.length === 0) return 0
  const sum = reports.reduce((acc, r) => acc + r.departmentQuality, 0)
  return sum / reports.length
}

function calculateConsistency(reports: DepartmentReport[]): number {
  // TODO: implement real cross-department consistency checking
  // For now, return 0 until real implementation
  return 0
}

function calculateCompleteness(reports: DepartmentReport[]): number {
  const relevantReports = reports.filter((r) => r.relevance >= 0.3)
  if (relevantReports.length === 0) return 0

  const completedReports = relevantReports.filter((r) => r.status === 'complete')
  return completedReports.length / relevantReports.length
}
