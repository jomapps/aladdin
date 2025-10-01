/**
 * Phase 3: Contradiction Detection Algorithms
 * Detects semantic, temporal, and logical contradictions in content
 */

import type { Contradiction, SemanticSearchResult } from './types'

/**
 * Detect contradictions between new content and existing content
 */
export async function detectContradictions(
  newContent: any,
  type: string,
  projectId: string,
  similarContent: SemanticSearchResult[],
  context?: any
): Promise<Contradiction[]> {
  const contradictions: Contradiction[] = []

  // Type-specific contradiction detection
  if (type === 'character') {
    contradictions.push(...detectCharacterContradictions(newContent, similarContent))
  } else if (type === 'scene') {
    contradictions.push(...detectSceneContradictions(newContent, similarContent))
  } else if (type === 'dialogue') {
    contradictions.push(...detectDialogueContradictions(newContent, similarContent))
  }

  // General logical contradictions
  contradictions.push(...detectLogicalContradictions(newContent, type))

  return contradictions
}

/**
 * Detect character-specific contradictions
 */
function detectCharacterContradictions(
  newCharacter: any,
  existingCharacters: SemanticSearchResult[]
): Contradiction[] {
  const contradictions: Contradiction[] = []

  for (const existing of existingCharacters) {
    const existingChar = existing.node.properties

    // Same name but different identity
    if (
      newCharacter.name === existingChar.name &&
      newCharacter.fullName !== existingChar.fullName
    ) {
      contradictions.push({
        type: 'direct',
        severity: 'critical',
        description: `Character name "${newCharacter.name}" already exists with different full name`,
        conflictingNodes: [existing.node.id],
        suggestedResolution: `Use a different character name or merge with existing character`,
      })
    }

    // Age contradiction (if both specified)
    if (
      newCharacter.age &&
      existingChar.age &&
      Math.abs(newCharacter.age - existingChar.age) > 10 &&
      existing.score > 0.9 // Very similar character
    ) {
      contradictions.push({
        type: 'semantic',
        severity: 'medium',
        description: `Age differs significantly from similar character (${newCharacter.age} vs ${existingChar.age})`,
        conflictingNodes: [existing.node.id],
      })
    }

    // Personality trait contradictions
    if (newCharacter.personality?.traits && existingChar.personality?.traits) {
      const conflictingTraits = findConflictingTraits(
        newCharacter.personality.traits,
        existingChar.personality.traits
      )

      if (conflictingTraits.length > 0 && existing.score > 0.85) {
        contradictions.push({
          type: 'semantic',
          severity: 'medium',
          description: `Contradictory personality traits: ${conflictingTraits.join(', ')}`,
          conflictingNodes: [existing.node.id],
          suggestedResolution: 'Resolve conflicting traits or differentiate the characters',
        })
      }
    }
  }

  return contradictions
}

/**
 * Detect scene-specific contradictions
 */
function detectSceneContradictions(
  newScene: any,
  existingScenes: SemanticSearchResult[]
): Contradiction[] {
  const contradictions: Contradiction[] = []

  for (const existing of existingScenes) {
    const existingScene = existing.node.properties

    // Timeline contradictions
    if (newScene.sceneNumber && existingScene.sceneNumber) {
      if (newScene.sceneNumber === existingScene.sceneNumber) {
        contradictions.push({
          type: 'direct',
          severity: 'critical',
          description: `Scene number ${newScene.sceneNumber} already exists`,
          conflictingNodes: [existing.node.id],
          suggestedResolution: 'Assign a different scene number',
        })
      }
    }

    // Location contradictions
    if (
      newScene.location &&
      existingScene.location &&
      newScene.location !== existingScene.location &&
      existing.score > 0.9
    ) {
      contradictions.push({
        type: 'semantic',
        severity: 'low',
        description: `Very similar scene but different location (${newScene.location} vs ${existingScene.location})`,
        conflictingNodes: [existing.node.id],
      })
    }
  }

  return contradictions
}

/**
 * Detect dialogue-specific contradictions
 */
function detectDialogueContradictions(
  newDialogue: any,
  existingDialogue: SemanticSearchResult[]
): Contradiction[] {
  const contradictions: Contradiction[] = []

  // Check for exact duplicates
  for (const existing of existingDialogue) {
    const existingDlg = existing.node.properties

    if (
      newDialogue.text === existingDlg.text &&
      newDialogue.character === existingDlg.character &&
      existing.score > 0.95
    ) {
      contradictions.push({
        type: 'direct',
        severity: 'high',
        description: 'Identical dialogue already exists',
        conflictingNodes: [existing.node.id],
        suggestedResolution: 'Use existing dialogue or modify this one',
      })
    }
  }

  return contradictions
}

/**
 * Detect general logical contradictions within content
 */
function detectLogicalContradictions(content: any, type: string): Contradiction[] {
  const contradictions: Contradiction[] = []

  if (type === 'character') {
    // Age vs description contradiction
    if (content.age && content.appearance?.description) {
      const desc = content.appearance.description.toLowerCase()

      if (content.age < 18 && (desc.includes('elderly') || desc.includes('old'))) {
        contradictions.push({
          type: 'logical',
          severity: 'high',
          description: 'Age conflicts with appearance description (young age but elderly description)',
          conflictingNodes: [],
          suggestedResolution: 'Adjust age or appearance description to match',
        })
      }

      if (content.age > 60 && desc.includes('young')) {
        contradictions.push({
          type: 'logical',
          severity: 'medium',
          description: 'Age conflicts with appearance description (elderly age but young description)',
          conflictingNodes: [],
          suggestedResolution: 'Adjust age or appearance description to match',
        })
      }
    }

    // Role vs personality contradiction
    if (content.role === 'protagonist' && content.personality?.traits) {
      const traits = content.personality.traits.map((t: string) => t.toLowerCase())

      // Check for overwhelmingly negative traits for protagonist
      const negativeTraits = traits.filter((t: string) =>
        ['evil', 'cruel', 'heartless', 'sadistic', 'villainous'].includes(t)
      )

      if (negativeTraits.length > 2) {
        contradictions.push({
          type: 'logical',
          severity: 'medium',
          description: 'Protagonist has many villainous traits',
          conflictingNodes: [],
          suggestedResolution: 'Consider changing role to antagonist or balancing traits',
        })
      }
    }
  }

  return contradictions
}

/**
 * Find conflicting personality traits
 */
function findConflictingTraits(traits1: string[], traits2: string[]): string[] {
  const conflictPairs: Record<string, string[]> = {
    'brave': ['cowardly', 'fearful', 'timid'],
    'honest': ['dishonest', 'deceitful', 'lying'],
    'kind': ['cruel', 'mean', 'heartless'],
    'confident': ['insecure', 'self-doubting'],
    'extroverted': ['introverted', 'shy', 'withdrawn'],
    'optimistic': ['pessimistic', 'cynical'],
    'calm': ['anxious', 'nervous', 'agitated'],
    'ambitious': ['lazy', 'unmotivated'],
    'intelligent': ['stupid', 'unintelligent', 'dim-witted'],
    'friendly': ['hostile', 'unfriendly', 'antagonistic'],
  }

  const conflicts: string[] = []
  const normalizedTraits1 = traits1.map(t => t.toLowerCase())
  const normalizedTraits2 = traits2.map(t => t.toLowerCase())

  for (const trait1 of normalizedTraits1) {
    const opposites = conflictPairs[trait1] || []

    for (const trait2 of normalizedTraits2) {
      if (opposites.includes(trait2)) {
        conflicts.push(`${trait1} vs ${trait2}`)
      }
    }
  }

  return conflicts
}

/**
 * Calculate semantic similarity score between two text strings
 */
export function calculateSemanticSimilarity(text1: string, text2: string): number {
  // Simple word-based similarity (can be enhanced with embeddings)
  const words1 = new Set(text1.toLowerCase().split(/\s+/))
  const words2 = new Set(text2.toLowerCase().split(/\s+/))

  const intersection = new Set([...words1].filter(word => words2.has(word)))
  const union = new Set([...words1, ...words2])

  return intersection.size / union.size
}

/**
 * Detect temporal contradictions in timelines
 */
export function detectTemporalContradictions(
  events: Array<{ name: string; timestamp: Date; description?: string }>
): Contradiction[] {
  const contradictions: Contradiction[] = []

  // Sort events by timestamp
  const sortedEvents = [...events].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())

  // Check for illogical temporal ordering
  for (let i = 0; i < sortedEvents.length - 1; i++) {
    const current = sortedEvents[i]
    const next = sortedEvents[i + 1]

    // Check if events that should be ordered are in wrong order
    if (
      current.description?.includes('after') &&
      next.description?.includes('before') &&
      current.timestamp > next.timestamp
    ) {
      contradictions.push({
        type: 'temporal',
        severity: 'high',
        description: `Temporal contradiction: ${current.name} occurs after ${next.name} but should be before`,
        conflictingNodes: [],
        suggestedResolution: 'Adjust event timestamps to match logical order',
      })
    }
  }

  return contradictions
}
