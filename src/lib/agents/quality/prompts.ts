/**
 * LLM Assessment Prompts
 * Structured prompts for quality dimension assessment
 */

import { AssessmentInput } from './types'

/**
 * Build quality assessment prompt for LLM evaluation
 * Dynamically includes relevant dimensions based on department
 */
export function buildAssessmentPrompt(input: AssessmentInput): string {
  const { content, departmentId, task, expectedOutcome, projectContext } = input

  const department = departmentId.toLowerCase()
  const isCreativeDept = department === 'story' || department === 'character'
  const isTechnicalDept = department === 'video' || department === 'audio' || department === 'visual'

  return `You are a quality assessment expert for the ${department} department of a movie production system.

Your task is to evaluate the following agent output on multiple quality dimensions.

## Quality Dimensions

### 1. CONFIDENCE (0-100)
How well-crafted and professional is the output?
- Grammar, spelling, and clarity
- Structure and organization
- Attention to detail
- Polish and refinement

### 2. COMPLETENESS (0-100)
How thorough and complete is the output?
- All requested elements are present
- Sufficient detail and depth
- No major gaps or missing information
- Addresses all aspects of the task

### 3. RELEVANCE (0-100)
How well does the output address the task?
- Directly answers the prompt
- Stays on topic and focused
- Provides requested information
- Meets the expected outcome

### 4. CONSISTENCY (0-100)
How consistent is the output with existing project data?
- Matches established facts and lore
- Consistent with character traits and motivations
- Aligns with story direction and themes
- No contradictions with existing content
${isCreativeDept ? `

### 5. CREATIVITY (0-100)
How creative and engaging is the output? (${department} department)
- Original and innovative ideas
- Interesting concepts and approaches
- Compelling narrative or character development
- Emotional resonance and engagement
` : ''}${isTechnicalDept ? `

### 5. TECHNICAL (0-100)
How technically sound is the output? (${department} department)
- Follows technical standards and best practices
- Feasible and practical to implement
- Production-ready quality
- Technically accurate specifications
` : ''}

## Task Context

**Task Given:**
${task || 'No specific task provided'}

**Expected Outcome:**
${expectedOutcome || 'General quality output expected'}

**Department:**
${department}

## Output to Evaluate

\`\`\`
${content}
\`\`\`
${projectContext ? `

## Existing Project Context

\`\`\`json
${JSON.stringify(projectContext, null, 2)}
\`\`\`
` : ''}

## Your Assessment

Carefully evaluate the output on each dimension. Consider:
- Is the content appropriate for the ${department} department?
- Does it meet professional production standards?
- Are there any critical issues or red flags?
- What specific improvements could be made?

Provide your assessment as a JSON object with this exact structure:

\`\`\`json
{
  "qualityScore": <number 0-100>,
  "relevanceScore": <number 0-100>,
  "consistencyScore": <number 0-100>,
  "completenessScore": <number 0-100>,${isCreativeDept ? '\n  "creativityScore": <number 0-100>,' : ''}${isTechnicalDept ? '\n  "technicalScore": <number 0-100>,' : ''}
  "overallScore": <number 0-100>,
  "confidence": <number 0.0-1.0>,
  "issues": ["issue1", "issue2"],
  "suggestions": ["suggestion1", "suggestion2"],
  "decision": "<REJECT|RETRY|ACCEPT|EXEMPLARY>",
  "reasoning": "Clear explanation of the assessment and decision"
}
\`\`\`

**Important Guidelines:**
- Be objective and constructive in your assessment
- Focus on actionable feedback in issues and suggestions
- Use the full 0-100 scale for scoring (don't cluster around 70-80)
- Base decision on the score thresholds:
  - REJECT: < 60 (critical issues)
  - RETRY: 60-74 (needs improvement)
  - ACCEPT: 75-89 (meets standards)
  - EXEMPLARY: 90-100 (exceptional quality)
- Set confidence based on how certain you are of your assessment (0.0-1.0)
- Provide specific, actionable issues and suggestions (not generic feedback)

Return ONLY the JSON object, no additional text.`
}

/**
 * Build simplified assessment prompt for quick quality checks
 */
export function buildQuickAssessmentPrompt(
  content: string,
  departmentId: string
): string {
  return `Quickly assess this ${departmentId} department output on a scale of 0-100:

\`\`\`
${content}
\`\`\`

Return a JSON object with just the overall score and decision:

\`\`\`json
{
  "overallScore": <number 0-100>,
  "decision": "<REJECT|RETRY|ACCEPT|EXEMPLARY>",
  "reasoning": "Brief 1-sentence explanation"
}
\`\`\`

Use these thresholds:
- REJECT: < 60
- RETRY: 60-74
- ACCEPT: 75-89
- EXEMPLARY: 90-100

Return ONLY the JSON object.`
}

/**
 * Build consistency check prompt
 */
export function buildConsistencyCheckPrompt(
  content: string,
  existingContext: Record<string, any>,
  departmentId: string
): string {
  return `Check if this ${departmentId} output is consistent with existing project data.

**New Output:**
\`\`\`
${content}
\`\`\`

**Existing Project Context:**
\`\`\`json
${JSON.stringify(existingContext, null, 2)}
\`\`\`

Evaluate consistency and identify any contradictions or inconsistencies.

Return JSON:
\`\`\`json
{
  "consistencyScore": <number 0-100>,
  "inconsistencies": ["inconsistency1", "inconsistency2"],
  "reasoning": "Explanation of consistency assessment"
}
\`\`\`

Return ONLY the JSON object.`
}
