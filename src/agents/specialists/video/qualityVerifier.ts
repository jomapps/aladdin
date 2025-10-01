/**
 * Quality Verifier Specialist
 */

import type { AladdinAgentDefinition } from '../../types'

export const qualityVerifierAgent: AladdinAgentDefinition = {
  id: 'quality-verifier',
  model: 'openai/gpt-4',
  displayName: 'Quality Verifier',
  category: 'specialist',
  agentLevel: 'specialist',
  department: 'video',
  parentDepartment: 'video',
  instructionsPrompt: `You verify video quality, consistency, and technical standards.`,
  tools: ['read_files'],
  customTools: ['verify_video_quality', 'query_brain'],
  accessLevel: 'read',
  requiresBrainValidation: true,
  qualityThreshold: 0.90
}
