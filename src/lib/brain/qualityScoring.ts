/**
 * Phase 3: Multi-dimensional Quality Scoring
 * Analyzes content across coherence, creativity, and completeness dimensions
 */

import type { QualityScoring } from './types'

/**
 * Calculate comprehensive quality score for content
 */
export async function calculateQualityScore(
  content: any,
  type: string
): Promise<QualityScoring> {
  const coherence = calculateCoherence(content, type)
  const creativity = calculateCreativity(content, type)
  const completeness = calculateCompleteness(content, type)
  const consistency = calculateConsistency(content, type)

  // Weighted average (customizable per type)
  const weights = getWeights(type)
  const overall =
    coherence * weights.coherence +
    creativity * weights.creativity +
    completeness * weights.completeness +
    consistency * weights.consistency

  return {
    coherence,
    creativity,
    completeness,
    consistency,
    overall,
  }
}

/**
 * Calculate coherence score (internal logical consistency)
 */
function calculateCoherence(content: any, type: string): number {
  let score = 1.0

  if (type === 'character') {
    // Check personality coherence
    if (content.personality) {
      const traits = content.personality.traits || []
      const motivations = content.personality.motivations || []
      const fears = content.personality.fears || []

      // Deduct for missing core personality elements
      if (traits.length === 0) score -= 0.3
      if (motivations.length === 0) score -= 0.2
      if (fears.length === 0) score -= 0.15

      // Check trait-backstory alignment
      if (content.backstory && traits.length > 0) {
        const backstoryLower = content.backstory.toLowerCase()
        const traitsReflected = traits.filter((trait: string) =>
          backstoryLower.includes(trait.toLowerCase())
        )

        if (traitsReflected.length === 0 && traits.length > 0) {
          score -= 0.15 // Traits not reflected in backstory
        }
      }

      // Check for conflicting traits
      const conflicts = findInternalTraitConflicts(traits)
      score -= conflicts.length * 0.1
    }

    // Check age-appearance coherence
    if (content.age && content.appearance?.description) {
      const coherent = checkAgeAppearanceCoherence(content.age, content.appearance.description)
      if (!coherent) score -= 0.2
    }
  }

  if (type === 'scene') {
    // Check scene element coherence
    if (content.mood && content.description) {
      const moodAligned = checkMoodDescriptionAlignment(content.mood, content.description)
      if (!moodAligned) score -= 0.2
    }

    // Check character-location coherence
    if (content.characters?.length > 0 && !content.location) {
      score -= 0.15 // Characters but no location specified
    }
  }

  return Math.max(0, Math.min(1, score))
}

/**
 * Calculate creativity score (originality and uniqueness)
 */
function calculateCreativity(content: any, type: string): number {
  let score = 0.5 // Start at neutral

  if (type === 'character') {
    // Reward unique combinations
    if (content.personality?.traits?.length >= 5) score += 0.15
    if (content.personality?.traits?.length >= 7) score += 0.1

    // Reward detailed backstory
    if (content.backstory) {
      const wordCount = content.backstory.split(/\s+/).length
      if (wordCount > 100) score += 0.1
      if (wordCount > 200) score += 0.1
    }

    // Reward distinctive appearance
    if (content.appearance?.distinctiveFeatures?.length > 0) {
      score += 0.1
    }

    // Check for clichés
    const cliches = detectCliches(content)
    score -= cliches.length * 0.05

    // Reward originality in motivations
    if (content.personality?.motivations?.length > 0) {
      const uniqueMotivations = content.personality.motivations.filter(
        (m: string) => !isCommonMotivation(m)
      )
      score += uniqueMotivations.length * 0.05
    }
  }

  if (type === 'scene') {
    // Reward unique mood
    if (content.mood && !isCommonMood(content.mood)) {
      score += 0.1
    }

    // Reward detailed description
    if (content.description) {
      const wordCount = content.description.split(/\s+/).length
      if (wordCount > 50) score += 0.1
      if (wordCount > 100) score += 0.15
    }

    // Check for clichéd scene elements
    const sceneCliches = detectSceneCliches(content)
    score -= sceneCliches.length * 0.05
  }

  return Math.max(0, Math.min(1, score))
}

/**
 * Calculate completeness score (all required fields present and detailed)
 */
function calculateCompleteness(content: any, type: string): number {
  let score = 0
  let maxScore = 0

  if (type === 'character') {
    // Core fields (required)
    if (content.name) { score += 1; maxScore += 1 }
    if (content.fullName) { score += 0.5; maxScore += 0.5 }
    if (content.role) { score += 0.5; maxScore += 0.5 }
    if (content.age) { score += 0.5; maxScore += 0.5 }

    // Personality (important)
    maxScore += 2
    if (content.personality) {
      if (content.personality.traits?.length >= 3) score += 0.5
      if (content.personality.traits?.length >= 5) score += 0.3
      if (content.personality.motivations?.length > 0) score += 0.4
      if (content.personality.fears?.length > 0) score += 0.3
      if (content.personality.strengths?.length > 0) score += 0.25
      if (content.personality.weaknesses?.length > 0) score += 0.25
    }

    // Backstory (important)
    maxScore += 1.5
    if (content.backstory) {
      const wordCount = content.backstory.split(/\s+/).length
      if (wordCount >= 50) score += 0.5
      if (wordCount >= 100) score += 0.5
      if (wordCount >= 200) score += 0.5
    }

    // Appearance (nice to have)
    maxScore += 1
    if (content.appearance) {
      if (content.appearance.description) score += 0.3
      if (content.appearance.hairStyle) score += 0.15
      if (content.appearance.hairColor) score += 0.1
      if (content.appearance.eyeColor) score += 0.1
      if (content.appearance.clothing) score += 0.2
      if (content.appearance.distinctiveFeatures?.length > 0) score += 0.15
    }

    // Voice (optional)
    maxScore += 0.5
    if (content.voice?.description) score += 0.5
  }

  if (type === 'scene') {
    // Core fields
    if (content.name) { score += 1; maxScore += 1 }
    if (content.description) { score += 2; maxScore += 2 }
    if (content.location) { score += 1; maxScore += 1 }
    if (content.mood) { score += 0.5; maxScore += 0.5 }
    if (content.timeOfDay) { score += 0.5; maxScore += 0.5 }

    // Characters
    maxScore += 1
    if (content.characters?.length > 0) score += 0.5
    if (content.characters?.length >= 2) score += 0.3
    if (content.characters?.length >= 3) score += 0.2
  }

  if (type === 'location') {
    if (content.name) { score += 1; maxScore += 1 }
    if (content.description) { score += 2; maxScore += 2 }
    if (content.locationType) { score += 0.5; maxScore += 0.5 }
    if (content.atmosphere) { score += 0.5; maxScore += 0.5 }
  }

  return maxScore > 0 ? score / maxScore : 0
}

/**
 * Calculate consistency score (matches expected patterns)
 */
function calculateConsistency(content: any, type: string): number {
  let score = 1.0

  // Type-specific consistency checks
  if (type === 'character') {
    // Role consistency
    if (content.role === 'protagonist' && content.personality?.weaknesses?.length === 0) {
      score -= 0.1 // Protagonists should have weaknesses
    }

    if (content.role === 'antagonist' && content.personality?.strengths?.length === 0) {
      score -= 0.1 // Antagonists should have strengths
    }
  }

  return Math.max(0, Math.min(1, score))
}

/**
 * Get scoring weights for content type
 */
function getWeights(type: string): QualityScoring {
  const weights: Record<string, QualityScoring> = {
    character: {
      coherence: 0.3,
      creativity: 0.25,
      completeness: 0.3,
      consistency: 0.15,
      overall: 1.0,
    },
    scene: {
      coherence: 0.35,
      creativity: 0.25,
      completeness: 0.25,
      consistency: 0.15,
      overall: 1.0,
    },
    location: {
      coherence: 0.3,
      creativity: 0.3,
      completeness: 0.25,
      consistency: 0.15,
      overall: 1.0,
    },
    dialogue: {
      coherence: 0.4,
      creativity: 0.2,
      completeness: 0.2,
      consistency: 0.2,
      overall: 1.0,
    },
  }

  return weights[type] || weights.character
}

/**
 * Helper functions
 */

function findInternalTraitConflicts(traits: string[]): string[] {
  const conflicts: string[] = []
  const conflictPairs: Record<string, string[]> = {
    'brave': ['cowardly', 'fearful'],
    'honest': ['dishonest', 'deceitful'],
    'kind': ['cruel', 'mean'],
    'confident': ['insecure'],
  }

  const normalizedTraits = traits.map(t => t.toLowerCase())

  for (const trait of normalizedTraits) {
    const opposites = conflictPairs[trait] || []
    const foundConflicts = opposites.filter(opp => normalizedTraits.includes(opp))
    conflicts.push(...foundConflicts)
  }

  return conflicts
}

function checkAgeAppearanceCoherence(age: number, description: string): boolean {
  const desc = description.toLowerCase()

  // Young age with elderly appearance
  if (age < 18 && (desc.includes('elderly') || desc.includes('old') || desc.includes('aged'))) {
    return false
  }

  // Old age with young appearance
  if (age > 60 && (desc.includes('young') || desc.includes('youthful'))) {
    return false
  }

  return true
}

function checkMoodDescriptionAlignment(mood: string, description: string): boolean {
  const moodLower = mood.toLowerCase()
  const descLower = description.toLowerCase()

  const moodKeywords: Record<string, string[]> = {
    'tense': ['nervous', 'anxious', 'uneasy', 'apprehensive'],
    'cheerful': ['happy', 'bright', 'joyful', 'pleasant'],
    'dark': ['shadowy', 'gloomy', 'ominous', 'sinister'],
    'peaceful': ['calm', 'serene', 'tranquil', 'quiet'],
  }

  const keywords = moodKeywords[moodLower] || []
  return keywords.some(keyword => descLower.includes(keyword))
}

function detectCliches(content: any): string[] {
  const cliches: string[] = []
  const commonCliches = [
    'chosen one',
    'dark past',
    'tragic backstory',
    'mysterious stranger',
    'lost memory',
    'orphan',
  ]

  const text = JSON.stringify(content).toLowerCase()

  for (const cliche of commonCliches) {
    if (text.includes(cliche)) {
      cliches.push(cliche)
    }
  }

  return cliches
}

function isCommonMotivation(motivation: string): boolean {
  const common = ['revenge', 'love', 'power', 'money', 'survival', 'justice']
  return common.some(c => motivation.toLowerCase().includes(c))
}

function isCommonMood(mood: string): boolean {
  const common = ['happy', 'sad', 'tense', 'calm', 'dark', 'light']
  return common.includes(mood.toLowerCase())
}

function detectSceneCliches(content: any): string[] {
  const cliches: string[] = []
  const sceneCliches = [
    'dark and stormy night',
    'sudden storm',
    'ominous thunder',
    'dramatic entrance',
  ]

  const text = JSON.stringify(content).toLowerCase()

  for (const cliche of sceneCliches) {
    if (text.includes(cliche)) {
      cliches.push(cliche)
    }
  }

  return cliches
}
