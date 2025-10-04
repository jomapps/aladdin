/**
 * Composite Generator - Iterative Image Composition
 * Builds composite images iteratively with verification retry loop
 */

import axios from 'axios'
import type { Neo4jConnection } from '../brain/neo4j'
import type {
  Scene,
  CompositeStep,
  CompositeIteration,
  VerificationResult,
  CompositeGenerationError
} from './types'
import { verifyComposite } from './verifier'

const MAX_ITERATIONS = 20
const MAX_VERIFICATION_RETRIES = 5
const VERIFICATION_THRESHOLD = 0.7

/**
 * Generate composite image iteratively
 */
export async function generateComposite(
  scene: Scene,
  steps: CompositeStep[],
  neo4j: Neo4jConnection
): Promise<{
  finalImageUrl: string
  iterations: CompositeIteration[]
}> {
  const iterations: CompositeIteration[] = []
  let currentImageUrl: string | undefined = undefined
  let totalIterations = 0

  try {
    // Process each composite step
    for (const step of steps) {
      console.log(`Processing step ${step.step}/${steps.length}: ${step.description}`)

      let verified = false
      let retryCount = 0

      // Retry loop for verification
      while (!verified && retryCount < MAX_VERIFICATION_RETRIES) {
        totalIterations++

        // Emergency break at 20 iterations
        if (totalIterations > MAX_ITERATIONS) {
          throw new Error(
            `Emergency break: Maximum ${MAX_ITERATIONS} iterations reached`
          )
        }

        // Generate composite for this step
        const result = await generateStepComposite(
          step,
          currentImageUrl,
          scene.description
        )

        // Verify the result
        const verification = await verifyComposite(
          result.imageUrl,
          step,
          scene.description,
          neo4j
        )

        // Record iteration
        const iteration: CompositeIteration = {
          iteration: totalIterations,
          step,
          input_image_url: currentImageUrl,
          output_image_url: result.imageUrl,
          verification,
          timestamp: new Date()
        }
        iterations.push(iteration)

        // Check verification
        if (verification.overall_pass && verification.combined_score >= VERIFICATION_THRESHOLD) {
          verified = true
          currentImageUrl = result.imageUrl
          console.log(`Step ${step.step} verified after ${retryCount + 1} attempts`)
        } else {
          retryCount++
          console.log(
            `Step ${step.step} verification failed (attempt ${retryCount}/${MAX_VERIFICATION_RETRIES}):`,
            `Score: ${verification.combined_score.toFixed(2)}`
          )

          if (retryCount >= MAX_VERIFICATION_RETRIES) {
            throw new CompositeGenerationError(
              `Step ${step.step} failed verification after ${MAX_VERIFICATION_RETRIES} retries`,
              scene.id,
              totalIterations,
              step,
              { verification }
            )
          }

          // Use failed image as input for retry
          currentImageUrl = result.imageUrl
        }
      }
    }

    if (!currentImageUrl) {
      throw new Error('No composite image generated')
    }

    return {
      finalImageUrl: currentImageUrl,
      iterations
    }
  } catch (error) {
    if (error instanceof CompositeGenerationError) {
      throw error
    }

    throw new CompositeGenerationError(
      `Composite generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      scene.id,
      totalIterations,
      steps[0],
      { error }
    )
  }
}

/**
 * Generate composite for a single step using nano-banana/edit
 */
async function generateStepComposite(
  step: CompositeStep,
  currentImageUrl: string | undefined,
  sceneDescription: string
): Promise<{ imageUrl: string; description: string }> {
  try {
    const falApiKey = process.env.FAL_API_KEY
    if (!falApiKey) {
      throw new Error('FAL_API_KEY not configured')
    }

    // Build image URLs array (current image + references, max 3 total)
    const imageUrls: string[] = []

    if (currentImageUrl) {
      imageUrls.push(currentImageUrl)
    }

    // Add reference images (max 3 total including current)
    const availableSlots = 3 - imageUrls.length
    const referenceUrls = step.references
      .slice(0, availableSlots)
      .map(ref => ref.url)

    imageUrls.push(...referenceUrls)

    // Ensure we have at least one image
    if (imageUrls.length === 0) {
      throw new Error('No images available for composite generation')
    }

    // Call nano-banana/edit endpoint
    const response = await axios.post(
      'https://fal.run/fal-ai/nano-banana/edit',
      {
        prompt: step.prompt,
        image_urls: imageUrls,
        num_images: 1,
        output_format: 'png',
        sync_mode: false
      },
      {
        headers: {
          'Authorization': `Key ${falApiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 60000 // 60 second timeout
      }
    )

    const data = response.data

    if (!data.images || data.images.length === 0) {
      throw new Error('No images returned from nano-banana/edit')
    }

    return {
      imageUrl: data.images[0].url,
      description: data.description || step.description
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status
      const message = error.response?.data?.error?.message || error.message
      throw new Error(`FAL API error [${status}]: ${message}`)
    }

    throw error
  }
}

/**
 * Optimize composite step order
 * Location first, then characters, then props
 */
export function optimizeStepOrder(steps: CompositeStep[]): CompositeStep[] {
  const typeOrder = {
    location: 1,
    character: 2,
    prop: 3,
    lighting: 4,
    effect: 5
  }

  return [...steps].sort((a, b) => {
    const orderA = typeOrder[a.type] || 99
    const orderB = typeOrder[b.type] || 99
    return orderA - orderB
  })
}

/**
 * Get composite generation stats
 */
export function getCompositeStats(iterations: CompositeIteration[]): {
  totalIterations: number
  successfulSteps: number
  failedSteps: number
  averageScore: number
  totalRetries: number
} {
  const totalIterations = iterations.length
  const uniqueSteps = new Set(iterations.map(i => i.step.step))
  const successfulSteps = uniqueSteps.size

  // Calculate average verification score
  const totalScore = iterations.reduce((sum, iter) => {
    return sum + iter.verification.combined_score
  }, 0)
  const averageScore = totalIterations > 0 ? totalScore / totalIterations : 0

  // Count retries (iterations beyond unique steps)
  const totalRetries = totalIterations - successfulSteps

  return {
    totalIterations,
    successfulSteps,
    failedSteps: 0, // Would be non-zero only on final failure
    averageScore,
    totalRetries
  }
}

/**
 * Build enhanced prompt with previous context
 */
function buildEnhancedPrompt(
  step: CompositeStep,
  hasPreviousImage: boolean
): string {
  if (hasPreviousImage) {
    return `${step.prompt} Seamlessly integrate with existing scene elements, maintaining consistency and cohesion.`
  }
  return step.prompt
}

/**
 * Validate composite generation prerequisites
 */
export function validateCompositePrerequisites(
  scene: Scene,
  steps: CompositeStep[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!scene.id) {
    errors.push('Scene ID is required')
  }

  if (!scene.description) {
    errors.push('Scene description is required')
  }

  if (steps.length === 0) {
    errors.push('At least one composite step is required')
  }

  for (const step of steps) {
    if (!step.prompt) {
      errors.push(`Step ${step.step} is missing prompt`)
    }

    if (step.references.length > 3) {
      errors.push(`Step ${step.step} has too many references (max 3)`)
    }
  }

  return {
    valid: errors.length === 0,
    errors
  }
}
