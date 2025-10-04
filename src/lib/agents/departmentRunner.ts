/**
 * Department Head Execution Logic
 * Handles spawning and managing specialist agents
 */

import { AladdinAgentRunner, type AgentExecutionContext } from './AladdinAgentRunner'
import type { DepartmentGrading, SpecialistOutput } from '@/agents/types'
import { gradeOutputTool } from '@/agents/tools/gradeOutput'
import type { Payload } from 'payload'

export interface DepartmentRunConfig {
  departmentId: string
  instructions: string
  projectSlug: string
  runner: AladdinAgentRunner
}

/**
 * Run specialist agent
 */
export async function runSpecialist(
  runner: AladdinAgentRunner,
  specialistId: string,
  instructions: string,
  context: AgentExecutionContext,
): Promise<SpecialistOutput> {
  console.log(`  🔧 Running specialist: ${specialistId}`)

  try {
    const result = await runner.executeAgent(specialistId, instructions, context)

    return {
      agentId: specialistId,
      task: instructions,
      output: result.output,
      confidence: result.qualityScore || 0.7,
      completeness: 0.8,
    }
  } catch (error) {
    console.error(`❌ Specialist error (${specialistId}):`, error)
    return {
      agentId: specialistId,
      task: instructions,
      output: { error: error instanceof Error ? error.message : 'Unknown error' },
      confidence: 0,
      completeness: 0,
    }
  }
}

/**
 * Grade specialist output using department head
 */
export async function gradeSpecialistOutput(
  runner: AladdinAgentRunner,
  departmentId: string,
  specialistOutput: SpecialistOutput,
  context: AgentExecutionContext,
): Promise<DepartmentGrading> {
  console.log(`  📊 Grading output from ${specialistOutput.agentId}`)

  try {
    const gradingPrompt = `Grade this specialist output: ${JSON.stringify(specialistOutput)}`
    const gradingResult = await runner.executeAgent(departmentId, gradingPrompt, context)

    // Parse grading from output (simplified - can be enhanced with structured outputs)
    const grading =
      typeof gradingResult.output === 'string'
        ? { qualityScore: gradingResult.qualityScore || 0.7 }
        : gradingResult.object

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
      reasoning: grading.reasoning,
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
      reasoning: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Run multiple specialists in parallel
 */
export async function runSpecialistsParallel(
  runner: AladdinAgentRunner,
  specialists: Array<{ id: string; instructions: string }>,
  context: AgentExecutionContext,
): Promise<SpecialistOutput[]> {
  console.log(`  🚀 Running ${specialists.length} specialists in parallel...`)

  return await Promise.all(
    specialists.map((s) => runSpecialist(runner, s.id, s.instructions, context)),
  )
}

/**
 * Grade multiple outputs in parallel
 */
export async function gradeOutputsParallel(
  runner: AladdinAgentRunner,
  departmentId: string,
  outputs: SpecialistOutput[],
  context: AgentExecutionContext,
): Promise<DepartmentGrading[]> {
  console.log(`  📊 Grading ${outputs.length} outputs in parallel...`)

  return await Promise.all(
    outputs.map((o) => gradeSpecialistOutput(runner, departmentId, o, context)),
  )
}

/**
 * Filter outputs based on quality threshold
 */
export function filterAcceptedOutputs(
  gradings: DepartmentGrading[],
  threshold: number = 0.6,
): DepartmentGrading[] {
  return gradings.filter((g) => g.overallScore >= threshold && g.decision === 'accept')
}
