/**
 * Prompt Template Utilities
 * Utilities for creating, validating, and rendering LLM prompt templates
 */

export interface PromptTemplate {
  stage: 'analyze' | 'extract' | 'summarize' | 'relationships'
  template: string
  variables: string[]
  outputFormat: 'json' | 'text'
  examples?: any[]
  validationCriteria?: string[]
}

export interface PromptContext {
  data: any
  context: {
    project: any
    payload: any
    brain: any
    opendb: any
    related: any
  }
  metadata?: Record<string, any>
  additionalContext?: string
}

/**
 * Render a prompt template with variable substitution
 */
export function renderPrompt(
  template: PromptTemplate,
  context: PromptContext
): string {
  let rendered = template.template

  // Replace variables
  rendered = rendered.replace(/\{data\}/g, JSON.stringify(context.data, null, 2))
  rendered = rendered.replace(/\{context\.project\}/g, JSON.stringify(context.context.project, null, 2))
  rendered = rendered.replace(/\{context\.payload\}/g, JSON.stringify(context.context.payload, null, 2))
  rendered = rendered.replace(/\{context\.brain\}/g, JSON.stringify(context.context.brain, null, 2))
  rendered = rendered.replace(/\{context\.opendb\}/g, JSON.stringify(context.context.opendb, null, 2))
  rendered = rendered.replace(/\{context\.related\}/g, JSON.stringify(context.context.related, null, 2))

  if (context.metadata) {
    rendered = rendered.replace(/\{metadata\}/g, JSON.stringify(context.metadata, null, 2))
  }

  if (context.additionalContext) {
    rendered = rendered.replace(/\{additionalContext\}/g, context.additionalContext)
  }

  return rendered
}

/**
 * Build a comprehensive context string for prompts
 */
export function buildContextString(context: PromptContext['context']): string {
  const sections: string[] = []

  // Project context
  if (context.project) {
    sections.push(`PROJECT INFORMATION:
- Name: ${context.project.name}
- Type: ${context.project.type || 'Not specified'}
- Genre: ${context.project.genre?.join(', ') || 'Not specified'}
- Tone: ${context.project.tone || 'Not specified'}
- Themes: ${context.project.themes?.join(', ') || 'Not specified'}
- Target Audience: ${context.project.targetAudience || 'Not specified'}
- Phase: ${context.project.phase || 'Not specified'}`)
  }

  // Existing entities from Brain
  if (context.brain && context.brain.totalCount > 0) {
    sections.push(`EXISTING ENTITIES IN KNOWLEDGE GRAPH:
- Total entities: ${context.brain.totalCount}
- Related nodes: ${context.brain.relatedNodes?.length || 0}
- Similar content: ${context.brain.similarContent?.length || 0}`)
  }

  // Related entities
  if (context.related) {
    const relatedSummary = Object.entries(context.related)
      .filter(([_, entities]) => Array.isArray(entities) && entities.length > 0)
      .map(([type, entities]) => `- ${type}: ${(entities as any[]).length}`)
      .join('\n')

    if (relatedSummary) {
      sections.push(`RELATED ENTITIES:\n${relatedSummary}`)
    }
  }

  return sections.join('\n\n')
}

/**
 * Format examples for few-shot learning
 */
export function formatExamples(examples: any[]): string {
  if (!examples || examples.length === 0) {
    return ''
  }

  return examples
    .map((example, index) => {
      return `EXAMPLE ${index + 1}:
Input: ${JSON.stringify(example.input, null, 2)}
Output: ${JSON.stringify(example.output, null, 2)}`
    })
    .join('\n\n')
}

/**
 * Create system message for Claude
 */
export function createSystemMessage(role: string, capabilities: string[]): string {
  return `You are a specialized AI assistant for narrative content metadata extraction and analysis.

ROLE: ${role}

CAPABILITIES:
${capabilities.map(c => `- ${c}`).join('\n')}

GUIDELINES:
- Provide accurate, detailed metadata based on the input content
- Use the project context to inform your analysis
- Be consistent with existing entities in the knowledge graph
- Identify meaningful relationships between entities
- Format all outputs as valid JSON
- Include confidence scores when making inferences
- Explain your reasoning for key decisions`
}

/**
 * Create validation section for prompts
 */
export function createValidationSection(criteria: string[]): string {
  return `VALIDATION CRITERIA:
${criteria.map(c => `- ${c}`).join('\n')}

Before submitting your response, verify that it meets ALL validation criteria.`
}

/**
 * Token-efficient context builder (for large datasets)
 */
export function buildCompactContext(context: PromptContext['context'], maxLength: number = 1000): string {
  const compact = {
    project: context.project ? {
      name: context.project.name,
      type: context.project.type,
      genre: context.project.genre,
      phase: context.project.phase
    } : null,
    entityCounts: {
      brain: context.brain?.totalCount || 0,
      characters: context.related?.characters?.length || 0,
      scenes: context.related?.scenes?.length || 0,
      locations: context.related?.locations?.length || 0,
      concepts: context.related?.concepts?.length || 0
    }
  }

  const str = JSON.stringify(compact, null, 2)
  return str.length > maxLength ? str.substring(0, maxLength) + '...' : str
}

/**
 * Extract JSON from LLM response (handles markdown code blocks)
 */
export function extractJSON(response: string): any {
  // Try to parse directly
  try {
    return JSON.parse(response)
  } catch {
    // Extract from markdown code block
    const jsonMatch = response.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1])
    }

    // Try to find JSON object in text
    const objectMatch = response.match(/\{[\s\S]*\}/)
    if (objectMatch) {
      return JSON.parse(objectMatch[0])
    }

    throw new Error('No valid JSON found in response')
  }
}
