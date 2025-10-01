/**
 * Real-time Event Streaming - Integration Example
 *
 * This file demonstrates how to integrate the event streaming system
 * with AladdinAgentRunner and Department Head agents.
 *
 * @see {@link /docs/architecture/dynamic-agents-architecture.md}
 * @see {@link /src/lib/agents/events/README.md}
 */

import { AladdinAgentRunner } from '@/lib/agents/AladdinAgentRunner'
import {
  getEventEmitter,
  startWebSocketServer,
  initializeEventPersistence,
  type AgentEvent,
} from '@/lib/agents/events'
import type { Payload } from 'payload'

/**
 * ========================================
 * EXAMPLE 1: Initialize Event System
 * ========================================
 *
 * Initialize the event streaming infrastructure on server startup.
 */
export async function initializeEventStreaming(payload: Payload): Promise<void> {
  // 1. Initialize event persistence with Payload
  initializeEventPersistence(payload)

  // 2. Initialize event emitter with Redis
  const emitter = getEventEmitter()
  await emitter.initialize(process.env.REDIS_URL)

  // 3. Start WebSocket server
  await startWebSocketServer({
    port: parseInt(process.env.WS_PORT || '3001'),
    redisUrl: process.env.REDIS_URL,
    heartbeatInterval: 30000,
    clientTimeout: 60000,
    verbose: process.env.NODE_ENV === 'development',
  })

  console.log('[EventStreaming] Initialized successfully')
}

/**
 * ========================================
 * EXAMPLE 2: Extended AladdinAgentRunner with Events
 * ========================================
 *
 * Extend AladdinAgentRunner to emit real-time events during execution.
 */
export class EventEmittingAgentRunner extends AladdinAgentRunner {
  private emitter = getEventEmitter()

  /**
   * Override executeAgent to add event emission
   */
  async executeAgent(
    agentId: string,
    prompt: string,
    context: any,
    onEvent?: any
  ): Promise<any> {
    const startTime = Date.now()

    // Emit agent-start event
    await this.emitter.emitAgentStart(
      context.executionId || `exec-${Date.now()}`,
      agentId,
      'Agent Name', // You can fetch this from DB
      'department',
      prompt,
      false,
      context.conversationId
    )

    // Execute agent with enhanced event handler
    const result = await super.executeAgent(agentId, prompt, context, async (codebuffEvent) => {
      // Map @codebuff/sdk events to Aladdin events
      await this.handleCodebuffEvent(context.executionId, agentId, codebuffEvent)

      // Call original handler if provided
      if (onEvent) {
        await onEvent(codebuffEvent)
      }
    })

    // Emit agent-complete event
    await this.emitter.emitAgentComplete(
      context.executionId,
      agentId,
      'Agent Name',
      'department',
      result.output,
      result.qualityScore || 0,
      Date.now() - startTime,
      result.tokenUsage,
      context.conversationId
    )

    return result
  }

  /**
   * Handle @codebuff/sdk events and convert to Aladdin events
   */
  private async handleCodebuffEvent(
    executionId: string,
    agentId: string,
    codebuffEvent: any
  ): Promise<void> {
    // Map different @codebuff/sdk event types
    switch (codebuffEvent.type) {
      case 'agent_step':
        await this.emitter.emitAgentEvent({
          type: 'agent-thinking',
          executionId,
          agentId,
          agentName: 'Agent Name',
          currentStep: codebuffEvent.step || 'Processing...',
          progress: codebuffEvent.progress,
          thoughtProcess: codebuffEvent.thought,
          timestamp: new Date(),
        })
        break

      case 'tool_use':
        await this.emitter.emitAgentEvent({
          type: 'tool-call',
          executionId,
          agentId,
          toolName: codebuffEvent.toolName,
          input: codebuffEvent.input,
          startTime: new Date(),
          timestamp: new Date(),
        })
        break

      case 'tool_result':
        await this.emitter.emitAgentEvent({
          type: 'tool-result',
          executionId,
          agentId,
          toolName: codebuffEvent.toolName,
          output: codebuffEvent.output,
          success: !codebuffEvent.error,
          executionTime: codebuffEvent.executionTime || 0,
          error: codebuffEvent.error,
          timestamp: new Date(),
        })
        break
    }
  }
}

/**
 * ========================================
 * EXAMPLE 3: Department Head with Events
 * ========================================
 *
 * Department head that emits coordination events.
 */
export class EventEmittingDepartmentHead {
  private emitter = getEventEmitter()
  private runner: EventEmittingAgentRunner

  constructor(apiKey: string, payload: Payload) {
    this.runner = new EventEmittingAgentRunner(apiKey, payload)
  }

  /**
   * Coordinate department execution with event emission
   */
  async coordinate(
    departmentSlug: string,
    departmentName: string,
    prompt: string,
    context: any
  ): Promise<any> {
    const executionId = context.executionId || `exec-${Date.now()}`
    const startTime = Date.now()

    // Emit department-start event
    await this.emitter.emitAgentEvent({
      type: 'department-start',
      executionId,
      department: departmentSlug,
      departmentName,
      agentId: `${departmentSlug}-head`,
      relevance: 1.0,
      estimatedTime: 5000,
      timestamp: new Date(),
    })

    try {
      // Spawn specialists and collect outputs
      const specialistOutputs: any[] = []

      // Example: Spawn 3 specialists
      const specialists = [
        { id: 'spec-1', name: 'Specialist 1', task: 'Task 1' },
        { id: 'spec-2', name: 'Specialist 2', task: 'Task 2' },
        { id: 'spec-3', name: 'Specialist 3', task: 'Task 3' },
      ]

      for (const specialist of specialists) {
        // Emit agent-start for specialist
        await this.emitter.emitAgentStart(
          executionId,
          specialist.id,
          specialist.name,
          departmentSlug,
          specialist.task,
          false,
          context.conversationId
        )

        // Execute specialist
        const result = await this.runner.executeAgent(
          specialist.id,
          specialist.task,
          { ...context, executionId },
          undefined
        )

        specialistOutputs.push(result)

        // Emit quality-check for specialist output
        await this.emitter.emitAgentEvent({
          type: 'quality-check',
          executionId,
          stage: 'specialist',
          department: departmentSlug,
          scores: {
            quality: result.qualityScore || 0,
            overall: result.qualityScore || 0,
          },
          threshold: 80,
          passed: (result.qualityScore || 0) >= 80,
          timestamp: new Date(),
        })
      }

      // Calculate department quality score
      const avgQualityScore =
        specialistOutputs.reduce((sum, r) => sum + (r.qualityScore || 0), 0) /
        specialistOutputs.length

      // Emit review-status
      await this.emitter.emitAgentEvent({
        type: 'review-status',
        executionId,
        department: departmentSlug,
        reviewedBy: `${departmentSlug}-head`,
        specialistId: 'all',
        decision: avgQualityScore >= 80 ? 'approved' : 'revision-needed',
        scores: {
          quality: avgQualityScore,
          relevance: avgQualityScore,
          consistency: avgQualityScore,
          overall: avgQualityScore,
        },
        feedback: `Department output ${avgQualityScore >= 80 ? 'meets' : 'does not meet'} quality standards`,
        timestamp: new Date(),
      })

      // Emit department-complete event
      await this.emitter.emitAgentEvent({
        type: 'department-complete',
        executionId,
        department: departmentSlug,
        departmentName,
        outputs: specialistOutputs.map((r) => r.output),
        qualityScore: avgQualityScore,
        executionTime: Date.now() - startTime,
        specialistsUsed: specialists.length,
        timestamp: new Date(),
      })

      return {
        department: departmentSlug,
        outputs: specialistOutputs,
        qualityScore: avgQualityScore,
        executionTime: Date.now() - startTime,
      }
    } catch (error) {
      // Emit error event
      await this.emitter.emitAgentEvent({
        type: 'error',
        executionId,
        department: departmentSlug,
        agentId: `${departmentSlug}-head`,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          code: 'DEPARTMENT_EXECUTION_ERROR',
          recoverable: false,
        },
        context: { departmentSlug, prompt },
        timestamp: new Date(),
      })

      throw error
    }
  }
}

/**
 * ========================================
 * EXAMPLE 4: Master Orchestrator with Events
 * ========================================
 *
 * Master orchestrator that coordinates all departments.
 */
export class EventEmittingOrchestrator {
  private emitter = getEventEmitter()
  private departments: EventEmittingDepartmentHead[]

  constructor(apiKey: string, payload: Payload) {
    this.departments = [
      new EventEmittingDepartmentHead(apiKey, payload),
      // Add more departments...
    ]
  }

  /**
   * Orchestrate execution across all departments
   */
  async orchestrate(
    prompt: string,
    projectId: string,
    episodeId?: string,
    conversationId?: string
  ): Promise<any> {
    const executionId = `exec-${Date.now()}`
    const startTime = Date.now()

    // Emit orchestration-start
    await this.emitter.emitOrchestrationStart(
      executionId,
      {
        projectId,
        episodeId,
        userPrompt: prompt,
        complexity: this.assessComplexity(prompt),
      },
      conversationId
    )

    try {
      // Coordinate departments in parallel
      const departmentResults = await Promise.all(
        this.departments.map((dept) =>
          dept.coordinate(
            'story', // Department slug
            'Story Department', // Department name
            prompt,
            {
              executionId,
              projectId,
              episodeId,
              conversationId,
            }
          )
        )
      )

      // Calculate overall quality
      const overallQuality =
        departmentResults.reduce((sum, r) => sum + r.qualityScore, 0) / departmentResults.length

      // Emit orchestration-complete
      await this.emitter.emitOrchestrationComplete(
        executionId,
        {
          departments: departmentResults.map((r) => r.department),
          overallQuality,
          consistency: overallQuality, // Simplified
          recommendation: overallQuality >= 80 ? 'ingest' : 'review',
        },
        {
          totalTime: Date.now() - startTime,
          tokensUsed: 0, // Calculate from results
          agentsSpawned: departmentResults.reduce((sum, r) => sum + (r.outputs?.length || 0), 0),
          departmentsInvolved: departmentResults.length,
        },
        conversationId
      )

      return {
        executionId,
        departments: departmentResults,
        overallQuality,
        recommendation: overallQuality >= 80 ? 'ingest' : 'review',
      }
    } catch (error) {
      // Emit error event
      await this.emitter.emitAgentEvent({
        type: 'error',
        executionId,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          code: 'ORCHESTRATION_ERROR',
          recoverable: false,
        },
        context: { prompt, projectId },
        timestamp: new Date(),
      })

      throw error
    }
  }

  /**
   * Assess prompt complexity
   */
  private assessComplexity(prompt: string): 'low' | 'medium' | 'high' {
    const words = prompt.split(' ').length
    if (words < 20) return 'low'
    if (words < 50) return 'medium'
    return 'high'
  }
}

/**
 * ========================================
 * EXAMPLE 5: Client-side Hook
 * ========================================
 *
 * React hook for consuming real-time events.
 */
export function createClientHook() {
  return `
import { useEffect, useState, useCallback } from 'react'
import type { AgentEvent } from '@/lib/agents/events'

interface UseAgentExecutionResult {
  events: AgentEvent[]
  isConnected: boolean
  progress: number
  currentStep: string
  error: Error | null
}

export function useAgentExecution(executionId: string): UseAgentExecutionResult {
  const [events, setEvents] = useState<AgentEvent[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [ws, setWs] = useState<WebSocket | null>(null)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const websocket = new WebSocket(\`ws://\${window.location.hostname}:3001\`)

    websocket.addEventListener('open', () => {
      setIsConnected(true)
      setError(null)
      websocket.send(JSON.stringify({
        type: 'subscribe',
        executionId
      }))
    })

    websocket.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'event') {
          setEvents(prev => [...prev, data.event])
        }
      } catch (err) {
        console.error('Failed to parse message:', err)
      }
    })

    websocket.addEventListener('error', (event) => {
      setError(new Error('WebSocket error'))
      console.error('WebSocket error:', event)
    })

    websocket.addEventListener('close', () => {
      setIsConnected(false)
    })

    setWs(websocket)

    return () => {
      websocket.close()
    }
  }, [executionId])

  // Calculate progress from events
  const progress = events.filter(e =>
    e.type === 'agent-complete' || e.type === 'department-complete'
  ).length / Math.max(1, events.length) * 100

  // Get current step
  const thinkingEvents = events.filter(e => e.type === 'agent-thinking')
  const currentStep = thinkingEvents.length > 0
    ? thinkingEvents[thinkingEvents.length - 1].currentStep
    : 'Initializing...'

  return {
    events,
    isConnected,
    progress,
    currentStep,
    error
  }
}
`
}

/**
 * ========================================
 * EXAMPLE 6: Complete Usage
 * ========================================
 *
 * Full example showing initialization and usage.
 */
export async function completeUsageExample(payload: Payload): Promise<void> {
  // 1. Initialize event streaming on server startup
  await initializeEventStreaming(payload)

  // 2. Create orchestrator
  const orchestrator = new EventEmittingOrchestrator(
    process.env.CODEBUFF_API_KEY!,
    payload
  )

  // 3. Execute with real-time events
  const result = await orchestrator.orchestrate(
    'Create a dramatic opening scene for a sci-fi thriller',
    'proj-123',
    'ep-001',
    'conv-456'
  )

  console.log('Execution complete:', result)

  // Events are automatically:
  // - Emitted to local EventEmitter listeners
  // - Broadcast via Redis Pub/Sub
  // - Sent to WebSocket clients
  // - Persisted to MongoDB
}
`
