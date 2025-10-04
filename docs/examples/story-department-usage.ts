/**
 * Story Department Usage Examples
 * Demonstrates how to use the refactored Story Department with AladdinAgentRunner
 */

import { storyDepartment, breakScreenplayIntoScenes } from '@/lib/qualification/storyDepartment'
import type { Screenplay, StoryBible } from '@/lib/qualification/storyDepartment'

/**
 * Example 1: Complete Story Processing
 * Generates screenplay and breaks it into scenes
 */
export async function processCompleteStory(
  projectId: string,
  projectSlug: string,
  userId: string
) {
  try {
    console.log('🎬 Starting story processing...')

    // Process the entire story pipeline
    const result = await storyDepartment.processStory(projectId, projectSlug, userId)

    console.log(`✅ Story processing complete!`)
    console.log(`   Screenplay: ${result.screenplay.title}`)
    console.log(`   Scenes: ${result.scenes.length}`)
    console.log(`   Duration: ${result.screenplay.estimatedDuration}s`)

    return result
  } catch (error) {
    console.error('❌ Story processing failed:', error)
    throw error
  }
}

/**
 * Example 2: Scene Breakdown Only
 * Use when you already have a screenplay and need to break it down
 */
export async function breakdownExistingScreenplay(
  screenplay: Screenplay,
  storyBible: StoryBible,
  projectId: string,
  projectSlug: string
) {
  try {
    console.log('🎞️ Breaking down screenplay into scenes...')

    const scenes = await breakScreenplayIntoScenes(
      screenplay,
      storyBible,
      projectId,
      projectSlug
    )

    console.log(`✅ Scene breakdown complete: ${scenes.length} scenes`)

    // Log scene summary
    scenes.forEach((scene, index) => {
      console.log(`   Scene ${index + 1}:`, {
        number: scene.sceneNumber,
        duration: scene.expectedDuration,
        intensity: scene.dramaticEffect.intensity,
        tone: scene.dramaticEffect.emotionalTone,
      })
    })

    return scenes
  } catch (error) {
    console.error('❌ Scene breakdown failed:', error)
    throw error
  }
}

/**
 * Example 3: Story Processing with Event Streaming
 * Monitor agent execution in real-time
 */
export async function processStoryWithStreaming(
  projectId: string,
  projectSlug: string,
  userId: string,
  onProgress?: (event: { phase: string; message: string }) => void
) {
  try {
    // Notify start
    onProgress?.({ phase: 'start', message: 'Starting story processing' })

    // Get story data
    onProgress?.({ phase: 'data', message: 'Loading story bible and characters' })

    // Process story
    const result = await storyDepartment.processStory(projectId, projectSlug, userId)

    // Notify completion
    onProgress?.({ phase: 'complete', message: `Generated ${result.scenes.length} scenes` })

    return result
  } catch (error) {
    onProgress?.({ phase: 'error', message: (error as Error).message })
    throw error
  }
}

/**
 * Example 4: Batch Processing Multiple Projects
 * Process stories for multiple projects in sequence
 */
export async function batchProcessStories(
  projects: Array<{ projectId: string; projectSlug: string; userId: string }>
) {
  const results = []

  for (const project of projects) {
    console.log(`\n📽️ Processing project: ${project.projectSlug}`)

    try {
      const result = await storyDepartment.processStory(
        project.projectId,
        project.projectSlug,
        project.userId
      )

      results.push({
        projectSlug: project.projectSlug,
        success: true,
        screenplay: result.screenplay,
        sceneCount: result.scenes.length,
      })

      console.log(`   ✅ Success: ${result.scenes.length} scenes`)
    } catch (error) {
      console.error(`   ❌ Failed: ${(error as Error).message}`)

      results.push({
        projectSlug: project.projectSlug,
        success: false,
        error: (error as Error).message,
      })
    }

    // Add delay between projects to avoid rate limits
    await new Promise((resolve) => setTimeout(resolve, 2000))
  }

  return results
}

/**
 * Example 5: Story Processing with Quality Validation
 * Validate generated content meets quality standards
 */
export async function processStoryWithValidation(
  projectId: string,
  projectSlug: string,
  userId: string,
  minQualityScore: number = 0.8
) {
  const result = await storyDepartment.processStory(projectId, projectSlug, userId)

  // Validate screenplay quality
  const qualityChecks = {
    hasTitle: !!result.screenplay.title,
    hasLogline: !!result.screenplay.logline,
    hasSynopsis: !!result.screenplay.synopsis,
    hasScenes: result.scenes.length > 0,
    scenesInRange: result.scenes.every(
      (scene) => scene.expectedDuration >= 3 && scene.expectedDuration <= 7
    ),
    hasDramaticEffect: result.scenes.every((scene) => !!scene.dramaticEffect),
    hasCameraDirection: result.scenes.every((scene) => !!scene.cameraDirection),
    hasLightingDirection: result.scenes.every((scene) => !!scene.lightingDirection),
  }

  const passedChecks = Object.values(qualityChecks).filter(Boolean).length
  const totalChecks = Object.keys(qualityChecks).length
  const qualityScore = passedChecks / totalChecks

  console.log(`\n📊 Quality Check Results:`)
  console.log(`   Score: ${(qualityScore * 100).toFixed(1)}%`)
  console.log(`   Passed: ${passedChecks}/${totalChecks} checks`)
  Object.entries(qualityChecks).forEach(([check, passed]) => {
    console.log(`   ${passed ? '✅' : '❌'} ${check}`)
  })

  if (qualityScore < minQualityScore) {
    throw new Error(`Quality score ${qualityScore} below minimum ${minQualityScore}`)
  }

  return {
    ...result,
    qualityScore,
    qualityChecks,
  }
}

/**
 * Example 6: Error Handling and Retry Logic
 * Demonstrates handling agent execution failures
 */
export async function processStoryWithRetry(
  projectId: string,
  projectSlug: string,
  userId: string,
  maxRetries: number = 3
) {
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Attempt ${attempt}/${maxRetries}...`)

      const result = await storyDepartment.processStory(projectId, projectSlug, userId)

      console.log(`✅ Success on attempt ${attempt}`)
      return result
    } catch (error) {
      lastError = error as Error
      console.error(`❌ Attempt ${attempt} failed:`, lastError.message)

      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000 // Exponential backoff
        console.log(`   Retrying in ${delay / 1000}s...`)
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }
  }

  throw new Error(`Story processing failed after ${maxRetries} attempts: ${lastError?.message}`)
}

/**
 * Example 7: Scene Analysis and Statistics
 * Analyze generated scenes for insights
 */
export async function analyzeScenes(
  projectId: string,
  projectSlug: string,
  userId: string
) {
  const result = await storyDepartment.processStory(projectId, projectSlug, userId)

  const analysis = {
    totalScenes: result.scenes.length,
    totalDuration: result.scenes.reduce((sum, scene) => sum + scene.expectedDuration, 0),
    averageDuration: 0,
    intensityDistribution: {
      low: 0, // 0-3
      medium: 0, // 4-6
      high: 0, // 7-10
    },
    emotionalTones: new Map<string, number>(),
    locations: new Set<string>(),
    characters: new Set<string>(),
    shotTypes: new Map<string, number>(),
  }

  analysis.averageDuration = analysis.totalDuration / analysis.totalScenes

  result.scenes.forEach((scene) => {
    // Intensity distribution
    const intensity = scene.dramaticEffect.intensity
    if (intensity <= 3) analysis.intensityDistribution.low++
    else if (intensity <= 6) analysis.intensityDistribution.medium++
    else analysis.intensityDistribution.high++

    // Emotional tones
    const tone = scene.dramaticEffect.emotionalTone
    analysis.emotionalTones.set(tone, (analysis.emotionalTones.get(tone) || 0) + 1)

    // Locations
    if (scene.location) analysis.locations.add(scene.location)

    // Characters
    scene.characters?.forEach((char) => analysis.characters.add(char))

    // Shot types
    if (scene.cameraDirection?.shotType) {
      const shotType = scene.cameraDirection.shotType
      analysis.shotTypes.set(shotType, (analysis.shotTypes.get(shotType) || 0) + 1)
    }
  })

  console.log('\n📈 Scene Analysis:')
  console.log(`   Total Scenes: ${analysis.totalScenes}`)
  console.log(`   Total Duration: ${analysis.totalDuration}s`)
  console.log(`   Average Duration: ${analysis.averageDuration.toFixed(1)}s`)
  console.log(`\n   Intensity Distribution:`)
  console.log(`     Low (0-3): ${analysis.intensityDistribution.low}`)
  console.log(`     Medium (4-6): ${analysis.intensityDistribution.medium}`)
  console.log(`     High (7-10): ${analysis.intensityDistribution.high}`)
  console.log(`\n   Unique Locations: ${analysis.locations.size}`)
  console.log(`   Unique Characters: ${analysis.characters.size}`)

  return analysis
}
