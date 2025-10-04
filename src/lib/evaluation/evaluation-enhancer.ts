/**
 * Evaluation Enhancer Service
 * Uses AI agents to analyze evaluation results and generate improvements
 */

import { AIAgentExecutor } from '@/lib/ai/agent-executor'
import { getDataPreparationAgent } from '@/lib/agents/data-preparation/agent'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { getBrainClient } from '@/lib/brain/client'
import { gatherDB } from '@/lib/db/gatherDatabase'
import { z } from 'zod'

export interface EnhanceOptions {
  projectId: string
  departmentId: string
  departmentSlug: string
  departmentName: string
  evaluationResult: string
  evaluationSummary: string
  issues: string[]
  suggestions: string[]
  rating: number
}

export interface EnhanceResult {
  itemsCreated: number
  message: string
}

class EvaluationEnhancer {
  /**
   * Enhance evaluation by generating content that addresses issues and suggestions
   */
  async enhance(options: EnhanceOptions): Promise<EnhanceResult> {
    const {
      projectId,
      departmentId,
      departmentSlug,
      departmentName,
      evaluationResult,
      evaluationSummary,
      issues,
      suggestions,
      rating,
    } = options

    console.log('[EvaluationEnhancer] Starting enhancement for', departmentName)

    // 1. Get project context
    const payload = await getPayload({ config })
    const project = await payload.findByID({
      collection: 'projects',
      id: projectId,
    })

    // 2. Get existing gather data from MongoDB to avoid duplicates
    const gatherItems = await gatherDB.getGatherItems(projectId, {
      limit: 50,
      sort: 'latest',
      department: departmentSlug,
    })

    const existingContent = gatherItems.items
      .map((item) => {
        // Parse content if it's JSON stringified
        try {
          const parsed = JSON.parse(item.content)
          return typeof parsed === 'string' ? parsed : JSON.stringify(parsed)
        } catch {
          return item.content
        }
      })
      .join('\n\n---\n\n')
      .slice(0, 3000) // Limit to 3000 chars to avoid token overflow

    // 3. Use AladdinAgentRunner to generate comprehensive improvements
    const improvements = await this.generateImprovements(
      project,
      departmentName,
      evaluationResult,
      evaluationSummary,
      issues,
      suggestions,
      rating,
      existingContent,
      projectId,
    )

    console.log('[EvaluationEnhancer] Generated improvements:', improvements.length)

    // 3. Save each improvement to gather database and brain
    const dataPrep = getDataPreparationAgent()
    let itemsCreated = 0

    // Get user ID from payload (for createdBy field)
    const userId = 'ai-enhancement-system'

    for (const improvement of improvements) {
      try {
        console.log('[EvaluationEnhancer] ========================================')
        console.log('[EvaluationEnhancer] 📦 Processing improvement:', {
          type: improvement.type,
          originalIssue: improvement.originalIssue?.slice(0, 50),
          contentLength: improvement.content?.length,
          contentType: typeof improvement.content,
          contentPreview: improvement.content?.slice(0, 200),
        })

        // Create summary and context for gather item
        const summary = `AI Enhancement: ${improvement.type} - ${improvement.originalIssue.slice(0, 100)}`
        const context = `Generated to address: ${improvement.originalIssue}`

        // Save to gather database (MongoDB)
        console.log('[EvaluationEnhancer] 💾 Saving to gather database...')
        console.log('[EvaluationEnhancer] Content to save (length):', improvement.content.length)
        console.log(
          '[EvaluationEnhancer] Content to save (preview):',
          improvement.content.slice(0, 300),
        )

        const gatherDoc = await gatherDB.createGatherItem(projectId, {
          projectId,
          content: improvement.content, // ✅ Store as string directly, NOT JSON.stringify
          summary,
          context,
          createdBy: userId,
          isAutomated: true,
          automationMetadata: {
            taskId: `ai-enhance-${Date.now()}`,
            department: departmentSlug,
            departmentName,
            iteration: 1,
            qualityScore: rating,
            basedOnNodes: [],
            model: 'ai-enhancement',
          },
        })
        console.log('[EvaluationEnhancer] ✅ Saved to gather:', gatherDoc._id)
        console.log('[EvaluationEnhancer] Saved content length:', gatherDoc.content?.length)

        // Prepare and enrich data for brain service
        console.log('[EvaluationEnhancer] Preparing data for brain service...')
        const brainDocument = await dataPrep.prepare(
          {
            id: gatherDoc._id?.toString() || '',
            content: improvement.content,
            type: improvement.type,
            department: departmentSlug,
            metadata: {
              enhancementType: improvement.type,
              originalIssue: improvement.originalIssue,
              departmentName,
              rating,
            },
          },
          {
            projectId,
            entityType: 'gather-enhancement',
            sourceCollection: 'gather',
            sourceId: gatherDoc._id?.toString() || '',
          },
        )
        console.log('[EvaluationEnhancer] Data prepared for brain')

        // Store in brain service using addNode
        console.log('[EvaluationEnhancer] Storing in brain service...')
        const brainClient = getBrainClient()

        const brainPayload = {
          type: brainDocument.type,
          content: brainDocument.text, // REQUIRED: Content to embed for semantic search
          projectId, // REQUIRED: Project isolation
          properties: {
            ...brainDocument.metadata,
            text: brainDocument.text,
          },
          generateEmbedding: true,
        }

        console.log('[EvaluationEnhancer] Brain payload:', {
          type: brainPayload.type,
          contentLength: brainPayload.content?.length,
          projectId: brainPayload.projectId,
          propertiesKeys: Object.keys(brainPayload.properties || {}),
          generateEmbedding: brainPayload.generateEmbedding,
        })

        await brainClient.addNode(brainPayload)
        console.log('[EvaluationEnhancer] Stored in brain service')

        itemsCreated++
        console.log(
          `[EvaluationEnhancer] ✅ Successfully created item ${itemsCreated}:`,
          improvement.type,
        )
      } catch (error) {
        console.error('[EvaluationEnhancer] ❌ Failed to save improvement:', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          improvement: {
            type: improvement.type,
            originalIssue: improvement.originalIssue?.slice(0, 100),
          },
        })
        // Continue with other improvements
      }
    }

    // Verify items were actually saved by checking the count
    console.log('[EvaluationEnhancer] Verifying saved items...')
    const verifyCount = await gatherDB.getGatherCount(projectId)
    console.log('[EvaluationEnhancer] Current gather count:', verifyCount)
    console.log('[EvaluationEnhancer] Items created this session:', itemsCreated)

    return {
      itemsCreated,
      message: `Successfully created ${itemsCreated} enhancement items addressing evaluation feedback`,
    }
  }

  /**
   * Generate improvements using Vercel AI SDK with structured outputs
   */
  private async generateImprovements(
    project: any,
    departmentName: string,
    evaluationResult: string,
    evaluationSummary: string,
    issues: string[],
    suggestions: string[],
    rating: number,
    existingContent: string,
    projectId: string,
  ): Promise<Array<{ type: string; content: string; originalIssue: string }>> {
    const prompt = `You are an expert movie production assistant creating CONCRETE DELIVERABLES to resolve evaluation issues.

PROJECT: ${project.name}
Genre: ${project.genre || 'Not specified'} | Type: ${project.type || 'Not specified'}
Themes: ${project.themes?.join(', ') || 'Not specified'}

DEPARTMENT: ${departmentName}
CURRENT RATING: ${rating}/100

EVALUATION FEEDBACK:
${evaluationSummary}

ISSUES TO RESOLVE:
${issues.map((issue, i) => `${i + 1}. ${issue}`).join('\n')}

SUGGESTIONS TO IMPLEMENT:
${suggestions.map((suggestion, i) => `${i + 1}. ${suggestion}`).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

EXISTING CONTENT ALREADY CREATED (DO NOT DUPLICATE):
${existingContent || 'None yet - this is the first enhancement'}

⚠️ CRITICAL: Review the existing content above. Your new deliverables must:
1. NOT repeat or duplicate what's already been created
2. Build upon and extend the existing work
3. Fill in gaps and missing details
4. Address issues that haven't been resolved yet
5. Create NEW, DIFFERENT deliverables each time

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

YOUR MISSION: Create ACTUAL DELIVERABLES that directly resolve each issue/suggestion.

DO NOT write about what should be done. CREATE THE ACTUAL CONTENT.

EXAMPLES OF WHAT TO CREATE:

If issue is "Story documentation needs more detail in technical specifications":
❌ BAD: "We should add technical specifications including scene breakdowns..."
✅ GOOD: "TECHNICAL SPECIFICATIONS FOR ${project.name}

Scene Breakdown Structure:
- Scene 1: Opening sequence (2 min 30 sec)
  * Location: Desert marketplace at dawn
  * Characters: Aladdin (protagonist), 3 merchants, crowd extras
  * Technical requirements: Wide establishing shot, handheld camera for chase
  * Lighting: Golden hour natural light, practical lanterns
  * Props: Market stalls, stolen bread, guard uniforms
  * VFX: None required
  * Audio: Ambient marketplace sounds, footsteps, dialogue

- Scene 2: Cave of Wonders entrance (3 min 15 sec)
  * Location: Desert canyon exterior + cave interior set
  * Characters: Aladdin, Jafar (disguised), Abu
  * Technical requirements: Crane shot for reveal, steadicam for cave entry
  * Lighting: Moonlight exterior, mystical blue glow interior
  * Props: Magic lamp, treasure piles, tiger head entrance
  * VFX: Glowing cave entrance, magical effects, sand tiger animation
  * Audio: Wind, mystical ambience, tiger roar, echo effects

[Continue for all major scenes...]"

If issue is "Timeline estimates appear optimistic":
❌ BAD: "Timeline should be reviewed and adjusted with buffers..."
✅ GOOD: "REVISED ${departmentName} TIMELINE WITH 20% BUFFER

Phase 1: Story Development (Weeks 1-4)
- Week 1-2: Story outline and beat sheet (Original: 1 week, Revised: 2 weeks)
  * Day 1-3: Brainstorming and concept development
  * Day 4-7: First draft outline
  * Day 8-10: Review and revisions
  * Day 11-14: Final outline approval
  * Buffer: 3 days for stakeholder feedback

- Week 3-4: Detailed scene breakdown (Original: 1 week, Revised: 2 weeks)
  * Day 15-18: Scene-by-scene descriptions
  * Day 19-21: Character arc integration
  * Day 22-25: Technical requirements documentation
  * Day 26-28: Review and refinement
  * Buffer: 2 days for technical consultation

Phase 2: Script Development (Weeks 5-10)
[Continue with detailed breakdown...]

RISK MITIGATION:
- Built-in review cycles every 2 weeks
- Stakeholder approval gates at phase transitions
- 20% time buffer for unexpected revisions
- Parallel workstreams where possible"

If issue is "Resource allocation needs clarification":
❌ BAD: "Create a resource allocation matrix..."
✅ GOOD: "RESOURCE ALLOCATION MATRIX - ${departmentName}

PERSONNEL ALLOCATION:
┌─────────────────────┬──────────┬─────────┬──────────────┬─────────────┐
│ Role                │ Quantity │ Hours/Wk│ Weeks Needed │ Total Hours │
├─────────────────────┼──────────┼─────────┼──────────────┼─────────────┤
│ Story Lead          │    1     │   40    │     10       │     400     │
│ Story Writers       │    2     │   35    │      8       │     560     │
│ Story Editors       │    1     │   20    │      6       │     120     │
│ Research Assistant  │    1     │   15    │      4       │      60     │
│ Story Coordinator   │    1     │   25    │     10       │     250     │
└─────────────────────┴──────────┴─────────┴──────────────┴─────────────┘

BUDGET BREAKDOWN:
- Personnel: $85,000 (Story Lead: $35k, Writers: $40k, Others: $10k)
- Software/Tools: $2,500 (Final Draft, Celtx, collaboration tools)
- Research Materials: $1,500 (books, reference films, consultants)
- Contingency (15%): $13,350
TOTAL: $102,350

EQUIPMENT & TOOLS:
- 3x Workstations with dual monitors
- Final Draft Pro licenses (3)
- Celtx Team subscription
- Shared cloud storage (2TB)
- Video conferencing setup

DEPENDENCIES:
- Requires concept art team availability (Week 3+)
- Needs producer approval at Week 2, 5, 8
- Character department input required (Week 4-6)"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CRITICAL RULES:
1. CREATE THE ACTUAL DOCUMENT/DELIVERABLE - not a description of it
2. Include SPECIFIC numbers, names, timelines, and details
3. Use tables, lists, and structured formats
4. Make it copy-paste ready for production use
5. Each deliverable should be 300-500 words minimum
6. Reference the specific project context (${project.name}, ${project.genre})
7. Make each deliverable DIFFERENT and UNIQUE - don't repeat patterns

Return ONLY valid JSON (no markdown, no extra text):
[
  {
    "type": "issue-resolution",
    "originalIssue": "exact issue text",
    "content": "THE ACTUAL DELIVERABLE CONTENT HERE (300-500 words)"
  }
]`

    // Define structured output schema
    const improvementSchema = z.object({
      improvements: z.array(
        z.object({
          type: z.enum(['issue-resolution', 'suggestion-implementation']),
          originalIssue: z.string(),
          content: z.string().min(300).max(3000),
        }),
      ),
    })

    try {
      console.log('[EvaluationEnhancer] ========================================')
      console.log('[EvaluationEnhancer] 🚀 STARTING AI AGENT EXECUTION')
      console.log('[EvaluationEnhancer] ========================================')
      console.log('[EvaluationEnhancer] Prompt length:', prompt.length)
      console.log('[EvaluationEnhancer] Issues count:', issues.length)
      console.log('[EvaluationEnhancer] Suggestions count:', suggestions.length)

      // Get PayloadCMS instance
      const payload = await getPayload({ config })

      // Initialize AI Agent Executor
      const executor = new AIAgentExecutor(payload)

      // Execute with structured output (no JSON parsing needed!)
      console.log('[EvaluationEnhancer] 📤 Executing agent with structured output...')
      const result = await executor.execute({
        agentId: 'content-enhancer', // Must exist in PayloadCMS
        prompt,
        context: {
          projectId,
          conversationId: `eval-enhance-${Date.now()}`,
          metadata: {
            departmentName,
            rating,
            issuesCount: issues.length,
            suggestionsCount: suggestions.length,
          },
        },
        structuredOutput: {
          schema: improvementSchema,
          description: 'Generate production-ready deliverables for evaluation issues',
        },
        maxSteps: 1, // Single-step generation
        temperature: 0.7,
        maxTokens: 16000,
      })

      console.log('[EvaluationEnhancer] ========================================')
      console.log('[EvaluationEnhancer] ✅ AI AGENT RESPONSE RECEIVED!')
      console.log('[EvaluationEnhancer] ========================================')
      console.log('[EvaluationEnhancer] Execution time:', result.executionTime, 'ms')
      console.log('[EvaluationEnhancer] Token usage:', result.usage)
      console.log('[EvaluationEnhancer] Improvements generated:', result.object.improvements.length)

      // No JSON parsing needed! Structured output is already validated by Zod
      const improvements = result.object.improvements

      console.log('[EvaluationEnhancer] ✅ Structured output validated by Zod schema')
      console.log('[EvaluationEnhancer] Improvements:', improvements.length)

      return improvements
    } catch (error) {
      console.error('[EvaluationEnhancer] ❌ AGENT GENERATION FAILED:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        errorType: error?.constructor?.name,
        fullError: JSON.stringify(error, null, 2),
      })
      // NO FALLBACK - throw the error so we can see what's wrong
      console.error('[EvaluationEnhancer] ❌ THROWING ERROR - NO FALLBACK')
      throw new Error(
        `Agent generation failed: ${error instanceof Error ? error.message : String(error)}`,
      )
    }
  }

  /**
   * Generate fallback improvements if LLM fails
   */
  private generateFallbackImprovements(
    issues: string[],
    suggestions: string[],
  ): Array<{ type: string; content: string; originalIssue: string }> {
    const improvements: Array<{ type: string; content: string; originalIssue: string }> = []

    issues.forEach((issue) => {
      improvements.push({
        type: 'issue-resolution',
        originalIssue: issue,
        content: `Addressing issue: ${issue}\n\nThis requires detailed attention and specific implementation based on the project context. Consider reviewing similar successful projects and adapting their approaches to resolve this issue effectively.`,
      })
    })

    suggestions.forEach((suggestion) => {
      improvements.push({
        type: 'suggestion-implementation',
        originalIssue: suggestion,
        content: `Implementing suggestion: ${suggestion}\n\nThis enhancement will improve the overall quality of the project. Focus on integrating this suggestion in a way that aligns with the project's existing themes and style.`,
      })
    })

    return improvements
  }
}

export const evaluationEnhancer = new EvaluationEnhancer()
