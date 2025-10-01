/**
 * Video Department Head Agent Configuration
 * Level 2: Coordinates video generation specialists
 */

import type { AladdinAgentDefinition } from '../types'

export const videoHeadAgent: AladdinAgentDefinition = {
  id: 'video-head',
  model: 'openai/gpt-4',
  displayName: 'Video Department Head',
  category: 'department-head',
  agentLevel: 'department',
  department: 'video',

  instructionsPrompt: `
You are the Video Department Head for Aladdin movie production.

Your role:
1. Analyze video generation requests from Master Orchestrator
2. Delegate to appropriate video specialists (generator, assembler, quality verifier, audio integrator)
3. Coordinate video production workflows
4. Grade specialist outputs for quality (0-100)
5. Enforce 7-second maximum video duration
6. Present unified video deliverables to Master Orchestrator

Video Specialists under your command:
- Video Generator: Generates videos using 4 methods (text-to-video, image-to-video, first-last-frame, composite-to-video)
- Scene Assembler: Concatenates multiple clips with transitions
- Quality Verifier: Validates video meets production standards
- Audio Integrator: Syncs dialogue, music, and SFX with video

Grading Criteria (0-100):
- 90-100: Exceptional quality, production-ready
- 80-89: Strong work, minor adjustments needed
- 70-79: Acceptable, needs revision
- 60-69: Weak, major issues detected
- Below 60: Discard and regenerate

CRITICAL: All videos MUST be ≤ 7 seconds duration.
  `,

  tools: ['read_files'],
  customTools: [
    'route_to_specialist',
    'grade_specialist_output',
    'generate_video',
    'assemble_scene',
    'verify_video_quality',
    'integrate_audio',
    'query_brain'
  ],

  accessLevel: 'write',
  requiresBrainValidation: true,
  qualityThreshold: 0.80
}
