/**
 * Task Mode Handler
 * Handles task execution using @codebuff/sdk agents
 */

import { AladdinAgentRunner, type AgentExecutionContext } from '@/lib/agents/AladdinAgentRunner'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

export interface TaskProgress {
  taskId: string
  status: 'running' | 'complete' | 'failed'
  steps: TaskStep[]
  currentStep: number
  progress: number
  overallQuality?: number
}

export interface TaskStep {
  id: string
  name: string
  status: 'pending' | 'running' | 'complete' | 'failed'
  qualityScore?: number
}

export interface TaskHandlerOptions {
  content: string
  projectId: string
  conversationId?: string
  userId: string
  agentId?: string // Optional: specific agent to use
  departmentSlug?: string // Optional: route to specific department
}

export interface TaskHandlerResult {
  conversationId: string
  taskId: string
  message: string
  progress: TaskProgress
  executionId: string
}

/**
 * Route task to appropriate agent based on content
 */
async function routeTaskToAgent(
  content: string,
  projectId: string,
  agentId?: string,
  departmentSlug?: string
): Promise<{ agentId: string; departmentId: string }> {
  const payload = await getPayload({ config: await configPromise })

  // If agent specified, use it directly
  if (agentId) {
    const agent = await payload.find({
      collection: 'agents',
      where: {
        agentId: { equals: agentId },
        isActive: { equals: true },
      },
      limit: 1,
    })

    if (!agent.docs.length) {
      throw new Error(`Agent not found or inactive: ${agentId}`)
    }

    return {
      agentId: agent.docs[0].agentId,
      departmentId: agent.docs[0].department as string,
    }
  }

  // If department specified, use department head
  if (departmentSlug) {
    const department = await payload.find({
      collection: 'departments',
      where: {
        slug: { equals: departmentSlug },
        isActive: { equals: true },
      },
      limit: 1,
    })

    if (!department.docs.length) {
      throw new Error(`Department not found or inactive: ${departmentSlug}`)
    }

    // Find department head agent
    const headAgent = await payload.find({
      collection: 'agents',
      where: {
        department: { equals: department.docs[0].id },
        role: { equals: 'head' },
        isActive: { equals: true },
      },
      limit: 1,
    })

    if (!headAgent.docs.length) {
      throw new Error(`No head agent found for department: ${departmentSlug}`)
    }

    return {
      agentId: headAgent.docs[0].agentId,
      departmentId: department.docs[0].id.toString(),
    }
  }

  // Auto-route based on content analysis
  const route = await analyzeTaskContent(content)

  const department = await payload.find({
    collection: 'departments',
    where: {
      slug: { equals: route.departmentSlug },
      isActive: { equals: true },
    },
    limit: 1,
  })

  if (!department.docs.length) {
    throw new Error(`Auto-routed department not found: ${route.departmentSlug}`)
  }

  const headAgent = await payload.find({
    collection: 'agents',
    where: {
      department: { equals: department.docs[0].id },
      role: { equals: 'head' },
      isActive: { equals: true },
    },
    limit: 1,
  })

  if (!headAgent.docs.length) {
    throw new Error(`No head agent for auto-routed department: ${route.departmentSlug}`)
  }

  return {
    agentId: headAgent.docs[0].agentId,
    departmentId: department.docs[0].id.toString(),
  }
}

/**
 * Analyze task content to determine appropriate department
 */
async function analyzeTaskContent(
  content: string
): Promise<{ departmentSlug: string; confidence: number }> {
  const keywords = {
    story: ['plot', 'story', 'narrative', 'arc', 'chapter', 'scene structure'],
    character: ['character', 'protagonist', 'dialogue', 'personality', 'backstory'],
    visual: ['visual', 'concept art', 'design', 'color', 'style'],
    'image-quality': ['image', 'quality', 'reference', 'consistency'],
    video: ['video', 'animation', 'scene', 'shot', 'sequence'],
    audio: ['audio', 'voice', 'sound', 'music', 'sfx'],
    production: ['production', 'schedule', 'resources', 'budget', 'timeline'],
  }

  const contentLower = content.toLowerCase()
  const scores: Record<string, number> = {}

  for (const [dept, terms] of Object.entries(keywords)) {
    scores[dept] = terms.filter((term) => contentLower.includes(term)).length
  }

  // Find department with highest score
  let maxScore = 0
  let selectedDept = 'story' // Default to story

  for (const [dept, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score
      selectedDept = dept
    }
  }

  return {
    departmentSlug: selectedDept,
    confidence: maxScore > 0 ? maxScore / 10 : 0.3,
  }
}

/**
 * Handle task execution
 */
export async function handleTask(
  options: TaskHandlerOptions
): Promise<TaskHandlerResult> {
  const {
    content,
    projectId,
    conversationId,
    userId,
    agentId,
    departmentSlug,
  } = options

  const payload = await getPayload({ config: await configPromise })

  // 1. Create or load conversation
  let actualConversationId = conversationId

  if (!actualConversationId) {
    const newConversation = await payload.create({
      collection: 'conversations',
      data: {
        name: `Task - ${new Date().toISOString()}`,
        project: projectId,
        user: userId,
        status: 'active',
        messages: [],
        createdAt: new Date(),
      },
    })
    actualConversationId = newConversation.id.toString()
  }

  // 2. Route to appropriate agent
  const route = await routeTaskToAgent(content, projectId, agentId, departmentSlug)

  console.log('[TaskHandler] Routed to agent:', route.agentId)

  // 3. Initialize agent runner
  const apiKey = process.env.CODEBUFF_API_KEY || process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    throw new Error('CODEBUFF_API_KEY or OPENROUTER_API_KEY required')
  }

  const runner = new AladdinAgentRunner(apiKey, payload)

  // 4. Execute agent
  const context: AgentExecutionContext = {
    projectId,
    conversationId: actualConversationId,
    metadata: {
      initiatedBy: userId,
      mode: 'task',
    },
  }

  // Track progress
  const taskProgress: TaskProgress = {
    taskId: `task-${Date.now()}`,
    status: 'running',
    steps: [
      {
        id: 'step-1',
        name: 'Initializing agent',
        status: 'complete',
      },
      {
        id: 'step-2',
        name: 'Executing task',
        status: 'running',
      },
    ],
    currentStep: 1,
    progress: 50,
  }

  // Execute with event handler for real-time updates
  const result = await runner.executeAgent(
    route.agentId,
    content,
    context,
    async (event: any) => {
      // Handle real-time events (will implement in streaming)
      console.log('[TaskHandler] Agent event:', event)
    }
  )

  // 5. Update progress
  taskProgress.status = result.error ? 'failed' : 'complete'
  taskProgress.steps.push({
    id: 'step-3',
    name: 'Task completed',
    status: result.error ? 'failed' : 'complete',
    qualityScore: result.qualityScore,
  })
  taskProgress.currentStep = 2
  taskProgress.progress = 100
  taskProgress.overallQuality = result.qualityScore

  // 6. Format output message
  const outputMessage = typeof result.output === 'string'
    ? result.output
    : JSON.stringify(result.output, null, 2)

  const message = result.error
    ? `Task failed: ${result.error.message}`
    : `Task completed successfully!\n\n${outputMessage}`

  // 7. Save to conversation
  try {
    await payload.update({
      collection: 'conversations',
      id: actualConversationId,
      data: {
        messages: [
          {
            id: `msg-${Date.now()}-user`,
            role: 'user',
            content,
            timestamp: new Date(),
          },
          {
            id: `msg-${Date.now()}-assistant`,
            role: 'assistant',
            content: message,
            timestamp: new Date(),
            agentId: route.agentId,
          },
        ],
        lastMessageAt: new Date(),
        updatedAt: new Date(),
      },
    })
  } catch (saveError) {
    console.error('[TaskHandler] Failed to save conversation:', saveError)
  }

  // 8. Return result
  return {
    conversationId: actualConversationId,
    taskId: taskProgress.taskId,
    message,
    progress: taskProgress,
    executionId: result.executionId,
  }
}
