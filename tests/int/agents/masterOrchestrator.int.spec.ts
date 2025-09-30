/**
 * Master Orchestrator Integration Tests
 * Tests hierarchical agent execution
 */

import { describe, it, expect } from 'vitest'
import { handleUserRequest } from '@/lib/agents/orchestrator'

describe('Master Orchestrator', () => {
  it('should analyze user request and route to departments', async () => {
    const result = await handleUserRequest({
      projectSlug: 'test-project',
      userPrompt: 'Create a cyberpunk detective character named Sarah'
    })

    expect(result).toBeDefined()
    expect(result.departmentReports).toBeDefined()
    expect(result.departmentReports.length).toBeGreaterThan(0)
  })

  it('should route to character department for character creation', async () => {
    const result = await handleUserRequest({
      projectSlug: 'test-project',
      userPrompt: 'Create character Sarah'
    })

    const characterReport = result.departmentReports.find(
      r => r.department === 'character'
    )

    expect(characterReport).toBeDefined()
    expect(characterReport?.status).toBe('complete')
  })

  it('should calculate overall quality score', async () => {
    const result = await handleUserRequest({
      projectSlug: 'test-project',
      userPrompt: 'Create detective character'
    })

    expect(result.overallQuality).toBeGreaterThanOrEqual(0)
    expect(result.overallQuality).toBeLessThanOrEqual(1)
  })

  it('should provide recommendation based on quality', async () => {
    const result = await handleUserRequest({
      projectSlug: 'test-project',
      userPrompt: 'Create character'
    })

    expect(result.recommendation).toMatch(/ingest|modify|discard/)
  })
})
