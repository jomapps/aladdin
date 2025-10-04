/**
 * Shot Agent - Scene Analysis & Composite Planning
 * Analyzes scene requirements and decides composite steps
 */

import { getNode, semanticSearch } from '../brain/queries'
import type { Neo4jConnection } from '../brain/neo4j'
import type {
  Scene,
  ShotDecision,
  CompositeStep,
  ReferenceImage,
  CameraAngle
} from './types'

/**
 * Analyze scene and create shot decision
 */
export async function analyzeShotRequirements(
  scene: Scene,
  neo4j: Neo4jConnection
): Promise<ShotDecision> {
  try {
    // Step 1: Query brain for scene context
    const sceneContext = await querySceneContext(scene, neo4j)

    // Step 2: Determine composite steps order
    const compositeSteps = await planCompositeSteps(scene, sceneContext)

    // Step 3: Select character angles based on camera angle
    const characterAngles = selectCharacterAngles(scene, sceneContext)

    // Step 4: Determine pacing and timing
    const pacing = calculatePacing(scene, sceneContext)

    return {
      sceneId: scene.id,
      compositeSteps,
      characterAngles,
      pacing,
      reasoning: generateReasoning(scene, compositeSteps, characterAngles, pacing)
    }
  } catch (error) {
    throw new Error(
      `Shot analysis failed for scene ${scene.id}: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Query brain for scene context and references
 */
async function querySceneContext(
  scene: Scene,
  neo4j: Neo4jConnection
): Promise<any> {
  const context: any = {
    location: null,
    characters: [],
    props: [],
    references: []
  }

  // Get location if specified
  if (scene.location) {
    const locationNodes = await semanticSearch(neo4j, [], {
      types: ['Location'],
      limit: 1,
      projectId: scene.projectId
    })
    if (locationNodes.length > 0) {
      context.location = locationNodes[0].node
    }
  }

  // Get characters with 360° profiles
  if (scene.characters && scene.characters.length > 0) {
    for (const charId of scene.characters) {
      const charNode = await getNode(neo4j, charId)
      if (charNode) {
        context.characters.push(charNode)
      }
    }
  }

  // Get props if specified
  if (scene.props && scene.props.length > 0) {
    for (const propId of scene.props) {
      const propNode = await getNode(neo4j, propId)
      if (propNode) {
        context.props.push(propNode)
      }
    }
  }

  return context
}

/**
 * Plan composite steps in order: location → characters → props
 */
async function planCompositeSteps(
  scene: Scene,
  context: any
): Promise<CompositeStep[]> {
  const steps: CompositeStep[] = []
  let stepNumber = 1

  // Step 1: Location/Background (if exists)
  if (context.location) {
    const locationRefs = await getLocationReferences(context.location)
    steps.push({
      step: stepNumber++,
      type: 'location',
      description: `Establish ${context.location.properties.name} as background`,
      references: locationRefs.slice(0, 3), // Max 3 references
      prompt: buildLocationPrompt(scene, context.location)
    })
  }

  // Step 2: Characters (one step per character)
  for (const character of context.characters) {
    const charRefs = await getCharacterReferences(character, scene.cameraAngle)
    steps.push({
      step: stepNumber++,
      type: 'character',
      description: `Add ${character.properties.name} to scene`,
      references: charRefs.slice(0, 3),
      prompt: buildCharacterPrompt(scene, character, scene.cameraAngle)
    })
  }

  // Step 3: Props (if exists)
  for (const prop of context.props) {
    const propRefs = await getPropReferences(prop)
    steps.push({
      step: stepNumber++,
      type: 'prop',
      description: `Add ${prop.properties.name} to scene`,
      references: propRefs.slice(0, 3),
      prompt: buildPropPrompt(scene, prop)
    })
  }

  return steps
}

/**
 * Select character angles based on camera angle
 */
function selectCharacterAngles(
  scene: Scene,
  context: any
): Record<string, CameraAngle> {
  const angles: Record<string, CameraAngle> = {}
  const cameraAngle = scene.cameraAngle || 'front'

  for (const character of context.characters) {
    // Map camera angle to character angle
    angles[character.id] = mapCameraToCharacterAngle(cameraAngle, character)
  }

  return angles
}

/**
 * Map camera angle to character 360° profile angle
 */
function mapCameraToCharacterAngle(
  cameraAngle: CameraAngle,
  character: any
): CameraAngle {
  // Default mapping logic
  const angleMap: Record<CameraAngle, CameraAngle> = {
    'front': 'front',
    'side': 'side',
    'back': 'back',
    'three_quarter': 'three_quarter',
    'top': 'top',
    'bottom': 'bottom',
    'dutch': 'three_quarter' // Dutch angle uses three-quarter view
  }

  return angleMap[cameraAngle] || 'front'
}

/**
 * Calculate pacing and timing
 */
function calculatePacing(scene: Scene, context: any): any {
  // Default pacing based on scene complexity
  const characterCount = context.characters.length
  const hasAction = scene.description.toLowerCase().includes('fight') ||
                   scene.description.toLowerCase().includes('run')

  return {
    duration: Math.min(5 + characterCount, 7), // 5-7 seconds max
    motion_strength: hasAction ? 0.8 : 0.5,
    transition_type: hasAction ? 'fast_cut' : 'smooth'
  }
}

/**
 * Get location reference images
 */
async function getLocationReferences(location: any): Promise<ReferenceImage[]> {
  const refs: ReferenceImage[] = []

  // Get location images from node properties
  if (location.properties.images) {
    for (const img of location.properties.images.slice(0, 3)) {
      refs.push({
        url: img.url,
        type: 'location',
        weight: 1.0
      })
    }
  }

  return refs
}

/**
 * Get character reference images for specific angle
 */
async function getCharacterReferences(
  character: any,
  angle?: CameraAngle
): Promise<ReferenceImage[]> {
  const refs: ReferenceImage[] = []
  const targetAngle = angle || 'front'

  // Get 360° profile images for the angle
  if (character.properties.profile360) {
    const angleImages = character.properties.profile360[targetAngle]
    if (angleImages) {
      for (const img of angleImages.slice(0, 3)) {
        refs.push({
          url: img.url,
          type: 'character',
          weight: 1.0,
          characterId: character.id,
          angle: targetAngle
        })
      }
    }
  }

  return refs
}

/**
 * Get prop reference images
 */
async function getPropReferences(prop: any): Promise<ReferenceImage[]> {
  const refs: ReferenceImage[] = []

  if (prop.properties.images) {
    for (const img of prop.properties.images.slice(0, 3)) {
      refs.push({
        url: img.url,
        type: 'prop',
        weight: 1.0
      })
    }
  }

  return refs
}

/**
 * Build prompts for each step type
 */
function buildLocationPrompt(scene: Scene, location: any): string {
  return `Create a detailed ${scene.timeOfDay || 'daytime'} scene of ${location.properties.name}. ${scene.description}. High quality, cinematic lighting.`
}

function buildCharacterPrompt(scene: Scene, character: any, angle?: CameraAngle): string {
  const angleDesc = angle ? `${angle} view` : 'front view'
  return `Add ${character.properties.name} to the scene in ${angleDesc}. Maintain consistency with reference images. ${scene.description}.`
}

function buildPropPrompt(scene: Scene, prop: any): string {
  return `Add ${prop.properties.name} to the scene. ${scene.description}. Ensure proper scale and placement.`
}

/**
 * Generate reasoning for shot decision
 */
function generateReasoning(
  scene: Scene,
  steps: CompositeStep[],
  angles: Record<string, CameraAngle>,
  pacing: any
): string {
  const stepDesc = steps.map(s => `${s.step}. ${s.description}`).join(', ')
  const angleDesc = Object.entries(angles).map(([id, angle]) => `${angle} angle`).join(', ')

  return `Scene ${scene.sceneNumber} requires ${steps.length} composite steps: ${stepDesc}. ` +
         `Character angles: ${angleDesc}. ` +
         `Pacing: ${pacing.duration}s duration with ${pacing.motion_strength} motion strength.`
}
