/**
 * Quality Scorer Integration Example
 * Demonstrates usage in a real agent workflow
 */

import { createQualityScorer } from './index'
import type { AssessmentInput, QualityAssessment } from './types'

/**
 * Example 1: Story Department - Opening Scene Assessment
 */
export async function assessStoryScene() {
  const scorer = createQualityScorer({
    enableCache: true,
    cacheTTL: 3600,
  })

  const sceneContent = `
INT. DIMLY LIT APARTMENT - NIGHT

DETECTIVE SARAH CHEN (35, sharp eyes, worn badge) studies crime scene photos
spread across her kitchen table. Coffee long cold. Third night without sleep.

Her phone BUZZES. Unknown number.

SARAH
(answering)
Chen.

DISTORTED VOICE (V.O.)
You're looking in the wrong place, Detective.

Sarah's hand instinctively moves to her holster.

SARAH
Who is this?

DISTORTED VOICE (V.O.)
The answer isn't in the past. It's in the mirror.

The line goes DEAD. Sarah catches her reflection in the window -
something's wrong. Behind her, a SHADOW moves.

FADE TO BLACK.
`

  const assessment = await scorer.assessQuality({
    content: sceneContent,
    departmentId: 'story',
    task: 'Create compelling opening scene for thriller screenplay',
    expectedOutcome: 'Strong narrative hook that engages audience and establishes tone',
    projectContext: {
      genre: 'psychological thriller',
      setting: 'modern urban',
      tone: 'dark and suspenseful',
      protagonist: 'Detective Sarah Chen',
    },
  })

  console.log('=== Story Scene Assessment ===')
  console.log(`Overall Score: ${assessment.overallScore}/100`)
  console.log(`Decision: ${assessment.decision}`)
  console.log(`Confidence: ${(assessment.confidence * 100).toFixed(0)}%`)
  console.log('\nDimension Scores:')
  console.log(`- Creativity: ${assessment.dimensions.creativity}`)
  console.log(`- Consistency: ${assessment.dimensions.consistency}`)
  console.log(`- Completeness: ${assessment.dimensions.completeness}`)
  console.log(`- Relevance: ${assessment.dimensions.relevance}`)
  console.log(`- Confidence: ${assessment.dimensions.confidence}`)

  if (assessment.issues.length > 0) {
    console.log('\nIssues:')
    assessment.issues.forEach((issue) => console.log(`- ${issue}`))
  }

  if (assessment.suggestions.length > 0) {
    console.log('\nSuggestions:')
    assessment.suggestions.forEach((suggestion) => console.log(`- ${suggestion}`))
  }

  console.log(`\nReasoning: ${assessment.reasoning}`)

  return assessment
}

/**
 * Example 2: Character Department - Character Profile Assessment
 */
export async function assessCharacterProfile() {
  const scorer = createQualityScorer()

  const characterProfile = `
NAME: Marcus "Ghost" Rivera
AGE: 28
ROLE: Supporting Character - Tech Specialist

BACKGROUND:
Former NSA analyst turned freelance hacker. Left government service after
discovering classified operations he couldn't morally support. Now operates
in the gray areas of cybersecurity.

PHYSICAL DESCRIPTION:
Lean build, perpetually tired eyes, multiple screen-tan. Usually wears hoodies
and noise-canceling headphones. Has a nervous habit of tapping rhythms on
any available surface.

PERSONALITY:
Brilliant but paranoid. Trusts technology more than people. Speaks in technical
jargon when anxious. Loyal once trust is earned, but that trust is hard-won.

MOTIVATION:
Seeking redemption for past government work. Wants to expose corruption but
fears the consequences. Torn between doing the right thing and staying safe.

RELATIONSHIPS:
- Detective Sarah Chen: Reluctant ally, respects her integrity
- The Antagonist: Unknown connection, fears what they know about his past

SKILLS:
Expert in: Digital forensics, encryption, network infiltration
Weaknesses: Social situations, physical confrontation, trusting others

ARC:
Starts as isolated loner → Forced to work with team → Learns to trust →
Makes ultimate sacrifice to protect others
`

  const assessment = await scorer.assessQuality({
    content: characterProfile,
    departmentId: 'character',
    task: 'Create supporting character profile',
    expectedOutcome: 'Well-rounded character with clear motivations and growth arc',
    projectContext: {
      protagonist: 'Detective Sarah Chen',
      genre: 'psychological thriller',
      existingCharacters: ['Sarah Chen (Protagonist)'],
    },
  })

  console.log('\n=== Character Profile Assessment ===')
  console.log(`Overall Score: ${assessment.overallScore}/100`)
  console.log(`Decision: ${assessment.decision}`)
  console.log('\nKey Dimensions:')
  console.log(`- Consistency: ${assessment.dimensions.consistency}`)
  console.log(`- Completeness: ${assessment.dimensions.completeness}`)
  console.log(`- Creativity: ${assessment.dimensions.creativity}`)

  return assessment
}

/**
 * Example 3: Department Head Review Workflow
 */
export class DepartmentHeadReviewer {
  private scorer = createQualityScorer({ enableCache: true })

  async reviewSpecialistOutput(
    specialistId: string,
    output: string,
    task: string,
    departmentId: string
  ): Promise<ReviewResult> {
    console.log(`\n[${departmentId.toUpperCase()}] Reviewing output from ${specialistId}...`)

    const assessment = await this.scorer.assessQuality({
      content: output,
      departmentId,
      task,
      level: 'specialist',
    })

    const result: ReviewResult = {
      specialistId,
      approved: false,
      qualityScore: assessment.overallScore,
      decision: assessment.decision,
      feedback: {
        issues: assessment.issues,
        suggestions: assessment.suggestions,
        reasoning: assessment.reasoning,
      },
    }

    // Determine approval
    if (assessment.decision === 'ACCEPT' || assessment.decision === 'EXEMPLARY') {
      result.approved = true
      console.log(`✅ APPROVED (Score: ${assessment.overallScore})`)
    } else if (assessment.decision === 'RETRY') {
      console.log(`⚠️  NEEDS REVISION (Score: ${assessment.overallScore})`)
      console.log(`Issues: ${assessment.issues.join(', ')}`)
    } else {
      console.log(`❌ REJECTED (Score: ${assessment.overallScore})`)
      console.log(`Critical Issues: ${assessment.issues.join(', ')}`)
    }

    return result
  }

  async batchReview(
    outputs: Array<{ id: string; content: string; task: string }>>,
    departmentId: string
  ): Promise<BatchReviewResult> {
    console.log(`\n[BATCH REVIEW] Reviewing ${outputs.length} outputs...`)

    const results = await Promise.all(
      outputs.map((output) =>
        this.reviewSpecialistOutput(output.id, output.content, output.task, departmentId)
      )
    )

    const approved = results.filter((r) => r.approved).length
    const needsRevision = results.filter((r) => r.decision === 'RETRY').length
    const rejected = results.filter((r) => r.decision === 'REJECT').length

    const summary: BatchReviewResult = {
      total: outputs.length,
      approved,
      needsRevision,
      rejected,
      averageScore: results.reduce((sum, r) => sum + r.qualityScore, 0) / results.length,
      results,
    }

    console.log('\n=== Batch Review Summary ===')
    console.log(`Total: ${summary.total}`)
    console.log(`✅ Approved: ${summary.approved}`)
    console.log(`⚠️  Needs Revision: ${summary.needsRevision}`)
    console.log(`❌ Rejected: ${summary.rejected}`)
    console.log(`Average Score: ${summary.averageScore.toFixed(1)}/100`)

    return summary
  }
}

/**
 * Example 4: Quick Quality Gate
 */
export async function quickQualityGate(
  content: string,
  departmentId: string
): Promise<boolean> {
  const scorer = createQualityScorer()

  const quickScore = await scorer.quickCheck(content, departmentId)

  console.log(`Quick Quality Check: ${quickScore}/100`)

  if (quickScore >= 75) {
    console.log('✅ Passed quality gate')
    return true
  } else {
    console.log('❌ Failed quality gate - full assessment required')
    return false
  }
}

/**
 * Example 5: Consistency Validation
 */
export async function validateConsistency(
  newContent: string,
  departmentId: string,
  projectContext: Record<string, any>
): Promise<boolean> {
  const scorer = createQualityScorer()

  const consistencyScore = await scorer.checkConsistency(
    newContent,
    projectContext,
    departmentId
  )

  console.log(`Consistency Score: ${consistencyScore}/100`)

  if (consistencyScore >= 75) {
    console.log('✅ Consistent with project context')
    return true
  } else {
    console.log('⚠️  Consistency issues detected')
    return false
  }
}

// Type definitions for examples
interface ReviewResult {
  specialistId: string
  approved: boolean
  qualityScore: number
  decision: string
  feedback: {
    issues: string[]
    suggestions: string[]
    reasoning: string
  }
}

interface BatchReviewResult {
  total: number
  approved: number
  needsRevision: number
  rejected: number
  averageScore: number
  results: ReviewResult[]
}

// Main execution for testing
if (require.main === module) {
  ;(async () => {
    try {
      // Run example assessments
      console.log('Running Quality Scorer Examples...\n')

      await assessStoryScene()
      await assessCharacterProfile()

      // Quick gate example
      await quickQualityGate('Brief scene description', 'story')

      console.log('\n✅ All examples completed successfully')
    } catch (error) {
      console.error('Example execution failed:', error)
      process.exit(1)
    }
  })()
}
