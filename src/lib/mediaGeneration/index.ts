/**
 * Media Generation Pipeline
 * Complete scene generation system with shot analysis, iterative compositing, and video generation
 */

// Main scene generator
export {
  generateScene,
  generateSceneBatch,
  getSceneProgress
} from './sceneGenerator'

// Shot agent
export {
  analyzeShotRequirements
} from './shotAgent'

// Composite generator
export {
  generateComposite,
  optimizeStepOrder,
  validateCompositePrerequisites,
  getCompositeStats
} from './compositeGenerator'

// Verifier
export {
  verifyComposite,
  getVerificationReport
} from './verifier'

// Types
export type {
  Scene,
  SceneStatus,
  CameraAngle,
  CompositeStepType,
  ShotDecision,
  CompositeStep,
  ReferenceImage,
  CompositeIteration,
  VerificationResult,
  BrainVerification,
  FalVerification,
  VideoResult,
  LastFrameResult,
  SceneUpdatePayload,
  SceneGeneratorConfig
} from './types'

// Errors
export {
  SceneGenerationError,
  CompositeGenerationError,
  VerificationError
} from './types'
