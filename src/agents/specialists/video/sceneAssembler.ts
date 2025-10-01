/**
 * Scene Assembler Specialist
 */

import type { AladdinAgentDefinition } from '../../types'

export const sceneAssemblerAgent: AladdinAgentDefinition = {
  id: 'scene-assembler',
  model: 'openai/gpt-4',
  displayName: 'Scene Assembler',
  category: 'specialist',
  agentLevel: 'specialist',
  department: 'video',
  parentDepartment: 'video',
  instructionsPrompt: `You assemble scenes from multiple video clips with transitions and audio.`,
  tools: ['read_files'],
  customTools: ['assemble_scene', 'query_brain'],
  accessLevel: 'write',
  requiresBrainValidation: true,
  qualityThreshold: 0.85
}
