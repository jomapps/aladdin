/**
 * Two-Step Verification System
 * Parallel verification using Brain multimodal + FAL vision model
 */

import axios from 'axios'
import type { Neo4jConnection } from '../brain/neo4j'
import type {
  VerificationResult,
  BrainVerification,
  FalVerification,
  CompositeStep
} from './types'

/**
 * Run two-step parallel verification
 * BOTH verifications must pass
 */
export async function verifyComposite(
  imageUrl: string,
  step: CompositeStep,
  sceneDescription: string,
  neo4j: Neo4jConnection
): Promise<VerificationResult> {
  try {
    // Run both verifications in PARALLEL
    const [brainResult, falResult] = await Promise.all([
      verifyWithBrain(imageUrl, step, sceneDescription, neo4j),
      verifyWithFAL(imageUrl, step, sceneDescription)
    ])

    // Calculate combined score
    const combinedScore = (brainResult.score + falResult.score) / 2

    // Both must pass for overall pass
    const overallPass = brainResult.passed && falResult.passed

    return {
      brain: brainResult,
      fal: falResult,
      overall_pass: overallPass,
      combined_score: combinedScore
    }
  } catch (error) {
    throw new Error(
      `Verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Brain multimodal query verification
 */
async function verifyWithBrain(
  imageUrl: string,
  step: CompositeStep,
  sceneDescription: string,
  neo4j: Neo4jConnection
): Promise<BrainVerification> {
  try {
    // Build verification query
    const query = buildBrainVerificationQuery(step, sceneDescription)

    // Execute multimodal query through brain
    const response = await executeBrainMultimodalQuery(imageUrl, query, neo4j)

    // Parse brain response
    const score = extractScoreFromBrainResponse(response)
    const feedback = response.feedback || response.description || ''
    const issues = response.issues || []

    const passed = score >= 0.7 && issues.length === 0

    return {
      passed,
      score,
      feedback,
      issues: issues.length > 0 ? issues : undefined
    }
  } catch (error) {
    console.error('Brain verification error:', error)
    return {
      passed: false,
      score: 0,
      feedback: `Brain verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      issues: ['Brain verification error']
    }
  }
}

/**
 * FAL moondream2 vision model verification
 */
async function verifyWithFAL(
  imageUrl: string,
  step: CompositeStep,
  sceneDescription: string
): Promise<FalVerification> {
  try {
    const falApiKey = process.env.FAL_API_KEY
    if (!falApiKey) {
      throw new Error('FAL_API_KEY not configured')
    }

    // Build verification prompt
    const prompt = buildFALVerificationPrompt(step, sceneDescription)

    // Call FAL moondream2 visual-query endpoint
    const response = await axios.post(
      'https://fal.run/fal-ai/moondream2/visual-query',
      {
        image_url: imageUrl,
        prompt
      },
      {
        headers: {
          'Authorization': `Key ${falApiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    )

    const output = response.data.output || ''

    // Parse FAL response
    const meetsRequirements = parseFALResponse(output, step)
    const score = meetsRequirements ? 0.9 : 0.3

    return {
      passed: meetsRequirements && score >= 0.7,
      score,
      description: output,
      meets_requirements: meetsRequirements
    }
  } catch (error) {
    console.error('FAL verification error:', error)
    return {
      passed: false,
      score: 0,
      description: `FAL verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      meets_requirements: false
    }
  }
}

/**
 * Build brain verification query
 */
function buildBrainVerificationQuery(
  step: CompositeStep,
  sceneDescription: string
): string {
  const requirements = [
    `Step ${step.step}: ${step.description}`,
    `Scene context: ${sceneDescription}`,
    `Expected elements: ${step.references.map(r => r.type).join(', ')}`
  ]

  return `Analyze this image and verify it meets these requirements:
${requirements.join('\n')}

Rate the image on a scale of 0-1 based on:
1. Presence of required elements (${step.type})
2. Visual quality and consistency
3. Alignment with scene description
4. Reference matching

Provide score and list any issues found.`
}

/**
 * Build FAL verification prompt
 */
function buildFALVerificationPrompt(
  step: CompositeStep,
  sceneDescription: string
): string {
  return `Does this image contain ${step.type} as described: "${step.description}"?
Scene context: ${sceneDescription}.
Answer YES if all elements are present and properly rendered, or NO with explanation if anything is missing or incorrect.`
}

/**
 * Execute brain multimodal query
 * This would integrate with the actual brain multimodal system
 */
async function executeBrainMultimodalQuery(
  imageUrl: string,
  query: string,
  neo4j: Neo4jConnection
): Promise<any> {
  // TODO: Integrate with actual brain multimodal query system
  // For now, return a mock structure

  // This should call the brain's multimodal query endpoint
  // which analyzes the image using vision models

  // Mock response for type safety
  return {
    score: 0.8,
    feedback: 'Image meets requirements',
    description: 'Analysis complete',
    issues: []
  }
}

/**
 * Extract score from brain response
 */
function extractScoreFromBrainResponse(response: any): number {
  // Try different response formats
  if (typeof response.score === 'number') {
    return response.score
  }

  if (typeof response.rating === 'number') {
    return response.rating
  }

  if (typeof response.confidence === 'number') {
    return response.confidence
  }

  // Try to parse from text
  const text = response.feedback || response.description || ''
  const scoreMatch = text.match(/score[:\s]+([0-9.]+)/i)
  if (scoreMatch) {
    return parseFloat(scoreMatch[1])
  }

  // Default to 0.5 if no score found
  return 0.5
}

/**
 * Parse FAL response for requirements check
 */
function parseFALResponse(output: string, step: CompositeStep): boolean {
  const lowerOutput = output.toLowerCase()

  // Check for positive indicators
  const positiveIndicators = ['yes', 'present', 'contains', 'correct', 'properly']
  const hasPositive = positiveIndicators.some(ind => lowerOutput.includes(ind))

  // Check for negative indicators
  const negativeIndicators = ['no', 'missing', 'absent', 'incorrect', 'not found']
  const hasNegative = negativeIndicators.some(ind => lowerOutput.includes(ind))

  // Check if step type is mentioned
  const mentionsType = lowerOutput.includes(step.type)

  return hasPositive && !hasNegative && mentionsType
}

/**
 * Get detailed verification report
 */
export function getVerificationReport(result: VerificationResult): string {
  const lines = [
    `Verification Result: ${result.overall_pass ? 'PASS' : 'FAIL'}`,
    `Combined Score: ${result.combined_score.toFixed(2)}`,
    '',
    'Brain Verification:',
    `  - Status: ${result.brain.passed ? 'PASS' : 'FAIL'}`,
    `  - Score: ${result.brain.score.toFixed(2)}`,
    `  - Feedback: ${result.brain.feedback}`
  ]

  if (result.brain.issues && result.brain.issues.length > 0) {
    lines.push(`  - Issues: ${result.brain.issues.join(', ')}`)
  }

  lines.push(
    '',
    'FAL Verification:',
    `  - Status: ${result.fal.passed ? 'PASS' : 'FAIL'}`,
    `  - Score: ${result.fal.score.toFixed(2)}`,
    `  - Description: ${result.fal.description}`,
    `  - Meets Requirements: ${result.fal.meets_requirements ? 'YES' : 'NO'}`
  )

  return lines.join('\n')
}
