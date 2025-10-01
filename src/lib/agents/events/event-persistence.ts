/**
 * Event Persistence Layer
 *
 * Handles storage of agent events in the AgentExecutions collection.
 * Provides efficient event storage with minimal database overhead.
 *
 * @see {@link /docs/architecture/dynamic-agents-architecture.md} Section 5: Real-time Event Streaming
 */

import type { Payload } from 'payload'
import type { AgentEvent } from './types'

/**
 * Payload instance (set during initialization)
 */
let payloadInstance: Payload | null = null

/**
 * Initialize event persistence with Payload instance
 *
 * @param payload - PayloadCMS instance
 */
export function initializeEventPersistence(payload: Payload): void {
  payloadInstance = payload
  console.log('[EventPersistence] Initialized with Payload instance')
}

/**
 * Persist event to database
 *
 * Appends event to the events array in the AgentExecutions document.
 * Uses atomic array push for efficient updates.
 *
 * @param executionId - Execution document ID
 * @param event - Agent event to persist
 */
export async function persistEvent(executionId: string, event: AgentEvent): Promise<void> {
  if (!payloadInstance) {
    console.warn('[EventPersistence] Payload not initialized, skipping persistence')
    return
  }

  try {
    // Find execution document
    const execution = await payloadInstance.findByID({
      collection: 'agent-executions',
      id: executionId,
    })

    if (!execution) {
      console.warn(`[EventPersistence] Execution not found: ${executionId}`)
      return
    }

    // Append event to events array
    const events = (execution.events as any[]) || []
    events.push({ event })

    // Update execution document
    await payloadInstance.update({
      collection: 'agent-executions',
      id: executionId,
      data: {
        events,
      },
    })
  } catch (error) {
    console.error('[EventPersistence] Failed to persist event:', error)
    // Don't throw - event persistence failure shouldn't break execution
  }
}

/**
 * Persist multiple events in batch
 *
 * More efficient than persisting events individually.
 *
 * @param executionId - Execution document ID
 * @param events - Array of events to persist
 */
export async function persistEventBatch(
  executionId: string,
  events: AgentEvent[]
): Promise<void> {
  if (!payloadInstance) {
    console.warn('[EventPersistence] Payload not initialized, skipping persistence')
    return
  }

  try {
    // Find execution document
    const execution = await payloadInstance.findByID({
      collection: 'agent-executions',
      id: executionId,
    })

    if (!execution) {
      console.warn(`[EventPersistence] Execution not found: ${executionId}`)
      return
    }

    // Append all events to events array
    const existingEvents = (execution.events as any[]) || []
    const newEvents = events.map((event) => ({ event }))

    // Update execution document
    await payloadInstance.update({
      collection: 'agent-executions',
      id: executionId,
      data: {
        events: [...existingEvents, ...newEvents],
      },
    })
  } catch (error) {
    console.error('[EventPersistence] Failed to persist event batch:', error)
  }
}

/**
 * Get all events for an execution
 *
 * @param executionId - Execution document ID
 * @returns Array of events
 */
export async function getExecutionEvents(executionId: string): Promise<AgentEvent[]> {
  if (!payloadInstance) {
    console.warn('[EventPersistence] Payload not initialized')
    return []
  }

  try {
    const execution = await payloadInstance.findByID({
      collection: 'agent-executions',
      id: executionId,
    })

    if (!execution || !execution.events) {
      return []
    }

    // Extract events from array field
    return (execution.events as any[]).map((item) => item.event as AgentEvent)
  } catch (error) {
    console.error('[EventPersistence] Failed to get execution events:', error)
    return []
  }
}

/**
 * Get events of a specific type for an execution
 *
 * @param executionId - Execution document ID
 * @param eventType - Event type to filter
 * @returns Array of filtered events
 */
export async function getExecutionEventsByType(
  executionId: string,
  eventType: AgentEvent['type']
): Promise<AgentEvent[]> {
  const events = await getExecutionEvents(executionId)
  return events.filter((event) => event.type === eventType)
}

/**
 * Count events for an execution
 *
 * @param executionId - Execution document ID
 * @returns Number of events
 */
export async function countExecutionEvents(executionId: string): Promise<number> {
  if (!payloadInstance) {
    console.warn('[EventPersistence] Payload not initialized')
    return 0
  }

  try {
    const execution = await payloadInstance.findByID({
      collection: 'agent-executions',
      id: executionId,
    })

    if (!execution || !execution.events) {
      return 0
    }

    return (execution.events as any[]).length
  } catch (error) {
    console.error('[EventPersistence] Failed to count events:', error)
    return 0
  }
}

/**
 * Get latest N events for an execution
 *
 * @param executionId - Execution document ID
 * @param limit - Maximum number of events to return
 * @returns Array of latest events
 */
export async function getLatestEvents(executionId: string, limit: number): Promise<AgentEvent[]> {
  const events = await getExecutionEvents(executionId)
  return events.slice(-limit)
}

/**
 * Delete all events for an execution
 *
 * Useful for cleanup or testing.
 *
 * @param executionId - Execution document ID
 */
export async function clearExecutionEvents(executionId: string): Promise<void> {
  if (!payloadInstance) {
    console.warn('[EventPersistence] Payload not initialized')
    return
  }

  try {
    await payloadInstance.update({
      collection: 'agent-executions',
      id: executionId,
      data: {
        events: [],
      },
    })

    console.log(`[EventPersistence] Cleared events for execution ${executionId}`)
  } catch (error) {
    console.error('[EventPersistence] Failed to clear events:', error)
  }
}

/**
 * Get event statistics for an execution
 *
 * @param executionId - Execution document ID
 * @returns Event statistics
 */
export async function getEventStatistics(executionId: string): Promise<{
  total: number
  byType: Record<string, number>
  firstEvent?: AgentEvent
  lastEvent?: AgentEvent
}> {
  const events = await getExecutionEvents(executionId)

  if (events.length === 0) {
    return {
      total: 0,
      byType: {},
    }
  }

  const byType: Record<string, number> = {}
  events.forEach((event) => {
    byType[event.type] = (byType[event.type] || 0) + 1
  })

  return {
    total: events.length,
    byType,
    firstEvent: events[0],
    lastEvent: events[events.length - 1],
  }
}
