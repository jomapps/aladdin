/**
 * Aladdin AI Agents - Complete Agent Registry
 * 
 * This file exports all AI agents for the Aladdin movie production platform.
 * Agents are organized hierarchically:
 * - Level 1: Master Orchestrator (1 agent)
 * - Level 2: Department Heads (7 agents)
 * - Level 3: Specialist Agents (40+ agents)
 * 
 * Architecture: @codebuff/sdk
 * All agents use @codebuff/sdk for execution and coordination.
 * 
 * Services:
 * - brain.ft.tc - Knowledge graph validation (Neo4j + Jina AI)
 * - tasks.ft.tc - Task queue management (BullMQ + Redis)
 */

// ============================================================================
// LEVEL 1: MASTER ORCHESTRATOR
// ============================================================================

export { masterOrchestratorAgent } from './masterOrchestrator'

// ============================================================================
// LEVEL 2: DEPARTMENT HEADS
// ============================================================================

export { storyHeadAgent } from './departments/storyHead'
export { characterDepartmentHead } from './departments/characterHead'
export { visualHeadAgent } from './departments/visualHead'
export { videoHeadAgent } from './departments/videoHead'
export { audioHeadAgent } from './departments/audioHead'
export { productionHeadAgent } from './departments/productionHead'
export { imageQualityHeadAgent } from './departments/imageQualityHead'

// ============================================================================
// LEVEL 3: STORY DEPARTMENT SPECIALISTS
// ============================================================================

export { storyArchitectAgent } from './specialists/story/storyArchitect'
export { episodePlannerAgent } from './specialists/story/episodePlanner'
export { dialogueWriterAgent } from './specialists/story/dialogueWriter'
export { worldBuilderAgent } from './specialists/story/worldBuilder'
export { themeAnalyzerAgent } from './specialists/story/themeAnalyzer'

// ============================================================================
// LEVEL 3: CHARACTER DEPARTMENT SPECIALISTS
// ============================================================================

export { hairStylistAgent } from './departments/characterHead'
// Additional character specialists to be added

// ============================================================================
// LEVEL 3: VISUAL DEPARTMENT SPECIALISTS
// ============================================================================

export { conceptArtistAgent } from './specialists/visual/conceptArtist'
export { storyboardArtistAgent } from './specialists/visual/storyboardArtist'
export { environmentDesignerAgent } from './specialists/visual/environmentDesigner'
export { lightingDesignerAgent } from './specialists/visual/lightingDesigner'
export { cameraOperatorAgent } from './specialists/visual/cameraOperator'

// ============================================================================
// LEVEL 3: VIDEO DEPARTMENT SPECIALISTS
// ============================================================================

export { videoGeneratorAgent } from './specialists/video/videoGenerator'
export { sceneAssemblerAgent } from './specialists/video/sceneAssembler'
export { audioIntegratorAgent } from './specialists/video/audioIntegrator'
export { qualityVerifierAgent as videoQualityVerifierAgent } from './specialists/video/qualityVerifier'

// ============================================================================
// LEVEL 3: AUDIO DEPARTMENT SPECIALISTS
// ============================================================================

export { voiceCreatorAgent } from './specialists/audio/voiceCreator'
export { musicComposerAgent } from './specialists/audio/musicComposer'
export { soundDesignerAgent } from './specialists/audio/soundDesigner'
export { foleyArtistAgent } from './specialists/audio/foleyArtist'
export { audioMixerAgent } from './specialists/audio/audioMixer'

// ============================================================================
// LEVEL 3: PRODUCTION DEPARTMENT SPECIALISTS
// ============================================================================

export { productionManagerAgent } from './specialists/production/productionManager'
export { qualityControllerAgent } from './specialists/production/qualityController'
export { schedulerAgent } from './specialists/production/scheduler'
export { budgetCoordinatorAgent } from './specialists/production/budgetCoordinator'

// ============================================================================
// LEVEL 3: IMAGE QUALITY DEPARTMENT SPECIALISTS
// ============================================================================

export { masterReferenceGeneratorAgent } from './specialists/imageQuality/masterReferenceGenerator'
export { profile360CreatorAgent } from './specialists/imageQuality/profile360Creator'
export { consistencyVerifierAgent } from './specialists/imageQuality/consistencyVerifier'
export { imageDescriptorAgent } from './specialists/imageQuality/imageDescriptor'
export { shotComposerAgent } from './specialists/imageQuality/shotComposer'

// ============================================================================
// AGENT COLLECTIONS BY DEPARTMENT
// ============================================================================

import { masterOrchestratorAgent } from './masterOrchestrator'

import { storyHeadAgent } from './departments/storyHead'
import { characterDepartmentHead } from './departments/characterHead'
import { visualHeadAgent } from './departments/visualHead'
import { videoHeadAgent } from './departments/videoHead'
import { audioHeadAgent } from './departments/audioHead'
import { productionHeadAgent } from './departments/productionHead'
import { imageQualityHeadAgent } from './departments/imageQualityHead'

import { storyArchitectAgent } from './specialists/story/storyArchitect'
import { episodePlannerAgent } from './specialists/story/episodePlanner'
import { dialogueWriterAgent } from './specialists/story/dialogueWriter'
import { worldBuilderAgent } from './specialists/story/worldBuilder'
import { themeAnalyzerAgent } from './specialists/story/themeAnalyzer'

import { hairStylistAgent } from './departments/characterHead'

import { conceptArtistAgent } from './specialists/visual/conceptArtist'
import { storyboardArtistAgent } from './specialists/visual/storyboardArtist'
import { environmentDesignerAgent } from './specialists/visual/environmentDesigner'
import { lightingDesignerAgent } from './specialists/visual/lightingDesigner'
import { cameraOperatorAgent } from './specialists/visual/cameraOperator'

import { videoGeneratorAgent } from './specialists/video/videoGenerator'
import { sceneAssemblerAgent } from './specialists/video/sceneAssembler'
import { audioIntegratorAgent } from './specialists/video/audioIntegrator'
import { qualityVerifierAgent } from './specialists/video/qualityVerifier'

import { voiceCreatorAgent } from './specialists/audio/voiceCreator'
import { musicComposerAgent } from './specialists/audio/musicComposer'
import { soundDesignerAgent } from './specialists/audio/soundDesigner'
import { foleyArtistAgent } from './specialists/audio/foleyArtist'
import { audioMixerAgent } from './specialists/audio/audioMixer'

import { productionManagerAgent } from './specialists/production/productionManager'
import { qualityControllerAgent } from './specialists/production/qualityController'
import { schedulerAgent } from './specialists/production/scheduler'
import { budgetCoordinatorAgent } from './specialists/production/budgetCoordinator'

import { masterReferenceGeneratorAgent } from './specialists/imageQuality/masterReferenceGenerator'
import { profile360CreatorAgent } from './specialists/imageQuality/profile360Creator'
import { consistencyVerifierAgent } from './specialists/imageQuality/consistencyVerifier'
import { imageDescriptorAgent } from './specialists/imageQuality/imageDescriptor'
import { shotComposerAgent } from './specialists/imageQuality/shotComposer'

/**
 * All department head agents
 */
export const departmentHeads = [
  storyHeadAgent,
  characterDepartmentHead,
  visualHeadAgent,
  videoHeadAgent,
  audioHeadAgent,
  productionHeadAgent,
  imageQualityHeadAgent,
]

/**
 * All specialist agents by department
 */
export const specialists = {
  story: [
    storyArchitectAgent,
    episodePlannerAgent,
    dialogueWriterAgent,
    worldBuilderAgent,
    themeAnalyzerAgent,
  ],
  character: [
    hairStylistAgent,
    // More to be added
  ],
  visual: [
    conceptArtistAgent,
    storyboardArtistAgent,
    environmentDesignerAgent,
    lightingDesignerAgent,
    cameraOperatorAgent,
  ],
  video: [
    videoGeneratorAgent,
    sceneAssemblerAgent,
    audioIntegratorAgent,
    qualityVerifierAgent,
  ],
  audio: [
    voiceCreatorAgent,
    musicComposerAgent,
    soundDesignerAgent,
    foleyArtistAgent,
    audioMixerAgent,
  ],
  production: [
    productionManagerAgent,
    qualityControllerAgent,
    schedulerAgent,
    budgetCoordinatorAgent,
  ],
  imageQuality: [
    masterReferenceGeneratorAgent,
    profile360CreatorAgent,
    consistencyVerifierAgent,
    imageDescriptorAgent,
    shotComposerAgent,
  ],
}

/**
 * All agents in a flat array
 */
export const allAgents = [
  masterOrchestratorAgent,
  ...departmentHeads,
  ...specialists.story,
  ...specialists.character,
  ...specialists.visual,
  ...specialists.video,
  ...specialists.audio,
  ...specialists.production,
  ...specialists.imageQuality,
]

/**
 * Get agent by ID
 */
export function getAgentById(id: string) {
  return allAgents.find((agent) => agent.id === id)
}

/**
 * Get all agents for a department
 */
export function getAgentsByDepartment(department: string) {
  return allAgents.filter((agent) => agent.department === department)
}

/**
 * Get department head for a department
 */
export function getDepartmentHead(department: string) {
  return departmentHeads.find((agent) => agent.department === department)
}

/**
 * Get all specialist agents for a department
 */
export function getDepartmentSpecialists(department: string) {
  return specialists[department as keyof typeof specialists] || []
}

/**
 * Agent statistics
 */
export const agentStats = {
  total: allAgents.length,
  masterOrchestrator: 1,
  departmentHeads: departmentHeads.length,
  specialists: allAgents.length - departmentHeads.length - 1,
  byDepartment: {
    story: specialists.story.length,
    character: specialists.character.length,
    visual: specialists.visual.length,
    video: specialists.video.length,
    audio: specialists.audio.length,
    production: specialists.production.length,
    imageQuality: specialists.imageQuality.length,
  },
}

