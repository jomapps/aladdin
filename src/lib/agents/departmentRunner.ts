/**
 * Department Head Execution Logic
 * Handles spawning and managing specialist agents
 */

import { CodebuffClient } from '@codebuff/sdk'
import type { DepartmentGrading, SpecialistOutput } from '@/agents/types'
import { gradeOutputTool } from '@/agents/tools/gradeOutput'

export interface DepartmentRunConfig {
  departmentId: string
  instructions: string
  projectSlug: string
  client: CodebuffClient
}

/**
 * Run specialist agent
 */
export async function runSpecialist(
  client: CodebuffClient,
  specialistId: string,
  instructions: string,
  context: Record<string, any>
): Promise<SpecialistOutput> {
  console.log(`  🔧 Running specialist: ${specialistId}`)

  try {
    const result = await client.run({
      agent: specialistId,
      prompt: instructions,
      customToolDefinitions: [] // Add specialist-specific tools
    })

    return {
      agentId: specialistId,
      task: instructions,
      output: result.output,
      confidence: result.output.confidence || 0.7,
      completeness: result.output.completeness || 0.8
    }
  } catch (error) {
    console.error(`❌ Specialist error (${specialistId}):`, error)
    return {
      agentId: specialistId,
      task: instructions,
      output: { error: error instanceof Error ? error.message : 'Unknown error' },
      confidence: 0,
      completeness: 0
    }
  }
}

/**
 * Grade specialist output using department head
 */
export async function gradeSpecialistOutput(
  client: CodebuffClient,
  departmentId: string,
  specialistOutput: SpecialistOutput
): Promise<DepartmentGrading> {
  console.log(`  📊 Grading output from ${specialistOutput.agentId}`)

  try {
    const gradingResult = await client.run({
      agent: departmentId,
      prompt: `Grade this specialist output: ${JSON.stringify(specialistOutput)}`,
      customToolDefinitions: [gradeOutputTool]
    })

    const grading = gradingResult.output

    return {
      specialistAgentId: specialistOutput.agentId,
      output: specialistOutput.output,
      qualityScore: grading.qualityScore || 0.7,
      relevanceScore: grading.relevanceScore || 0.75,
      consistencyScore: grading.consistencyScore || 0.7,
      overallScore: grading.overallScore || 0.72,
      issues: grading.issues || [],
      suggestions: grading.suggestions || [],
      decision: grading.decision || 'accept',
      reasoning: grading.reasoning
    }
  } catch (error) {
    console.error(`❌ Grading error:`, error)
    return {
      specialistAgentId: specialistOutput.agentId,
      output: specialistOutput.output,
      qualityScore: 0.5,
      relevanceScore: 0.5,
      consistencyScore: 0.5,
      overallScore: 0.5,
      issues: ['Grading failed'],
      suggestions: [],
      decision: 'discard',
      reasoning: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Run multiple specialists in parallel
 */
export async function runSpecialistsParallel(
  client: CodebuffClient,
  specialists: Array<{ id: string; instructions: string }>,
  context: Record<string, any>
): Promise<SpecialistOutput[]> {
  console.log(`  🚀 Running ${specialists.length} specialists in parallel...`)

  return await Promise.all(
    specialists.map(s => runSpecialist(client, s.id, s.instructions, context))
  )
}

/**
 * Grade multiple outputs in parallel
 */
export async function gradeOutputsParallel(
  client: CodebuffClient,
  departmentId: string,
  outputs: SpecialistOutput[]
): Promise<DepartmentGrading[]> {
  console.log(`  📊 Grading ${outputs.length} outputs in parallel...`)

  return await Promise.all(
    outputs.map(o => gradeSpecialistOutput(client, departmentId, o))
  )
}

/**
 * Filter outputs based on quality threshold
 */
export function filterAcceptedOutputs(
  gradings: DepartmentGrading[],
  threshold: number = 0.60
): DepartmentGrading[] {
  return gradings.filter(g => g.overallScore >= threshold && g.decision === 'accept')
}
