/**
 * Audio Integrator Specialist
 */

import type { AladdinAgentDefinition } from '../../types'

export const audioIntegratorAgent: AladdinAgentDefinition = {
  id: 'audio-integrator',
  model: 'openai/gpt-4',
  displayName: 'Audio Integrator',
  category: 'specialist',
  agentLevel: 'specialist',
  department: 'video',
  parentDepartment: 'video',
  instructionsPrompt: `You integrate ElevenLabs voice dialogue, music, and SFX with video.`,
  tools: ['read_files'],
  customTools: ['integrate_audio', 'query_brain', 'generate_text_to_speech'],
  accessLevel: 'write',
  requiresBrainValidation: true,
  qualityThreshold: 0.85
}
