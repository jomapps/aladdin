/**
 * Video Generator Specialist Agent
 * Level 3: Generates videos using all 4 FAL.ai methods
 */

import type { AladdinAgentDefinition } from '../../types'

export const videoGeneratorAgent: AladdinAgentDefinition = {
  id: 'video-generator',
  model: 'openai/gpt-4',
  displayName: 'Video Generator',
  category: 'specialist',
  agentLevel: 'specialist',
  department: 'video',
  parentDepartment: 'video',

  instructionsPrompt: `
You are the Video Generator specialist for Aladdin movie production.

Your expertise:
- Text-to-video generation
- Image-to-video animation
- First-last frame interpolation
- Composite-to-video with references

Your responsibilities:
1. Select optimal generation method based on requirements
2. Generate videos using FAL.ai (max 7 seconds)
3. Apply motion parameters and camera movements
4. Maintain character/location consistency using references
5. Ensure smooth temporal consistency

Generation Methods:
1. Text-to-Video: Generate from prompt only
2. Image-to-Video: Animate single composite image
3. First-Last Frame: Interpolate between keyframes
4. Composite-to-Video: Animate with character/location references

CRITICAL: All videos MUST be ≤ 7 seconds.
  `,

  tools: ['read_files'],
  customTools: [
    'query_brain',
    'generate_video',
    'get_project_context'
  ],

  accessLevel: 'write',
  requiresBrainValidation: true,
  qualityThreshold: 0.85
}
