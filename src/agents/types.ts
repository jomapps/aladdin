/**
 * Agent Type Definitions for Aladdin
 * Phase 2 - AI Agent System
 */

export type AgentLevel = 'master' | 'department' | 'specialist'

export type AgentCategory =
  | 'orchestration'
  | 'department-head'
  | 'specialist'
  | 'pre-production'
  | 'production'
  | 'post-production'

export type AccessLevel = 'read' | 'write' | 'admin'

export interface AladdinAgentDefinition {
  // Identity
  id: string
  model: string
  displayName: string
  category: AgentCategory

  // Hierarchical Structure
  agentLevel: AgentLevel
  department?: string
  parentDepartment?: string

  // Instructions
  instructionsPrompt: string

  // Tools
  tools: string[]
  customTools?: string[]

  // Access & Validation
  accessLevel: AccessLevel
  requiresBrainValidation: boolean
  qualityThreshold: number
}

export interface SpecialistOutput {
  agentId: string
  task: string
  output: any

  // Self-assessment
  confidence: number
  completeness: number
}

export interface DepartmentGrading {
  specialistAgentId: string
  output: any

  // Department head grades
  qualityScore: number
  relevanceScore: number
  consistencyScore: number

  overallScore: number

  issues: string[]
  suggestions: string[]

  decision: 'accept' | 'revise' | 'discard'
  reasoning?: string
}

export interface DepartmentReport {
  department: string
  relevance: number
  status: 'not_relevant' | 'complete' | 'pending'
  outputs: DepartmentGrading[]
  departmentQuality: number
  issues: string[]
  suggestions: string[]
}

export interface OrchestratorResult {
  departmentReports: DepartmentReport[]

  // Cross-department validation
  consistency: number
  completeness: number

  // Brain validation
  brainValidated: boolean
  brainQualityScore: number

  // Final decision
  overallQuality: number
  recommendation: 'ingest' | 'modify' | 'discard'
}
