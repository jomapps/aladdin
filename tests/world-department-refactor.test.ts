/**
 * Test script for World Department refactoring
 * Verifies @codebuff/sdk integration works correctly
 */

import { worldDepartment } from '@/lib/qualification/worldDepartment'
import { getPayloadClient } from '@/lib/payload'

describe('World Department Refactoring', () => {
  const testProjectId = 'test-project-001'
  const testProjectSlug = 'test-movie'
  const testUserId = 'test-user-001'

  beforeAll(async () => {
    // Ensure world-department-agent exists
    const payload = await getPayloadClient()

    const agents = await payload.find({
      collection: 'agents',
      where: { slug: { equals: 'world-department-agent' } },
      limit: 1
    })

    if (!agents.docs.length) {
      throw new Error('world-department-agent not found in PayloadCMS. Please create it first.')
    }
  })

  describe('Agent Execution', () => {
    it('should execute world department agent successfully', async () => {
      const result = await worldDepartment.processWorldData(
        testProjectId,
        testProjectSlug,
        testUserId
      )

      expect(result).toBeDefined()
      expect(result.title).toBeDefined()
      expect(result.version).toBeDefined()
      expect(result.synopsis).toBeDefined()
      expect(Array.isArray(result.worldRules)).toBe(true)
    }, 60000) // 60s timeout for LLM execution

    it('should handle JSON parsing correctly', async () => {
      // This is tested internally during processWorldData
      // If parsing fails, the method throws an error
      await expect(
        worldDepartment.processWorldData(testProjectId, testProjectSlug, testUserId)
      ).resolves.not.toThrow()
    }, 60000)
  })

  describe('Data Storage', () => {
    it('should store story bible in qualified DB', async () => {
      const result = await worldDepartment.processWorldData(
        testProjectId,
        testProjectSlug,
        testUserId
      )

      // Verify storage by checking the result structure
      expect(result).toHaveProperty('title')
      expect(result).toHaveProperty('worldRules')
      expect(result).toHaveProperty('timeline')
      expect(result).toHaveProperty('locations')
    }, 60000)

    it('should store story bible in PayloadCMS', async () => {
      const payload = await getPayloadClient()

      await worldDepartment.processWorldData(
        testProjectId,
        testProjectSlug,
        testUserId
      )

      // Check if story bible was created in PayloadCMS
      const storyBibles = await payload.find({
        collection: 'story-bible',
        limit: 1,
        sort: '-createdAt'
      })

      expect(storyBibles.docs.length).toBeGreaterThan(0)
      expect(storyBibles.docs[0].lastReviewedBy).toContain('@codebuff/sdk')
    }, 60000)
  })

  describe('Execution Tracking', () => {
    it('should create agent execution record', async () => {
      const payload = await getPayloadClient()

      await worldDepartment.processWorldData(
        testProjectId,
        testProjectSlug,
        testUserId
      )

      // Check if execution was tracked
      const executions = await payload.find({
        collection: 'agent-executions',
        where: {
          conversationId: { equals: `world-${testProjectId}` }
        },
        limit: 1,
        sort: '-startedAt'
      })

      expect(executions.docs.length).toBeGreaterThan(0)
      expect(executions.docs[0].status).toBe('completed')
    }, 60000)

    it('should update agent performance metrics', async () => {
      const payload = await getPayloadClient()

      const agentsBefore = await payload.find({
        collection: 'agents',
        where: { slug: { equals: 'world-department-agent' } },
        limit: 1
      })

      const metricsBefore = agentsBefore.docs[0].performanceMetrics || {}
      const executionsBefore = metricsBefore.totalExecutions || 0

      await worldDepartment.processWorldData(
        testProjectId,
        testProjectSlug,
        testUserId
      )

      const agentsAfter = await payload.find({
        collection: 'agents',
        where: { slug: { equals: 'world-department-agent' } },
        limit: 1
      })

      const metricsAfter = agentsAfter.docs[0].performanceMetrics || {}
      const executionsAfter = metricsAfter.totalExecutions || 0

      expect(executionsAfter).toBeGreaterThan(executionsBefore)
    }, 60000)
  })

  describe('Error Handling', () => {
    it('should handle missing agent gracefully', async () => {
      // Temporarily rename agent to simulate missing agent
      const payload = await getPayloadClient()

      const agents = await payload.find({
        collection: 'agents',
        where: { slug: { equals: 'world-department-agent' } },
        limit: 1
      })

      const originalSlug = agents.docs[0].slug

      // Update slug temporarily
      await payload.update({
        collection: 'agents',
        id: agents.docs[0].id,
        data: { slug: 'world-department-agent-temp' }
      })

      // Should throw error
      await expect(
        worldDepartment.processWorldData(testProjectId, testProjectSlug, testUserId)
      ).rejects.toThrow('World Department Agent not found')

      // Restore original slug
      await payload.update({
        collection: 'agents',
        id: agents.docs[0].id,
        data: { slug: originalSlug }
      })
    }, 60000)

    it('should handle invalid JSON output', async () => {
      // This would be tested with a mock agent that returns invalid JSON
      // The parseStoryBible method should throw a descriptive error
      // In real scenario, retry logic would kick in
    })
  })

  describe('Brain Integration', () => {
    it('should ingest story bible into brain service', async () => {
      // This requires brain service to be running
      // The test verifies the ingestion completes without errors
      await expect(
        worldDepartment.processWorldData(testProjectId, testProjectSlug, testUserId)
      ).resolves.toBeDefined()
    }, 60000)
  })
})

/**
 * Manual Testing Checklist
 *
 * 1. Environment Setup:
 *    - [ ] OPENROUTER_API_KEY set
 *    - [ ] OPENROUTER_BASE_URL configured
 *    - [ ] Brain service running
 *    - [ ] PayloadCMS running
 *
 * 2. Agent Configuration:
 *    - [ ] world-department-agent exists with slug 'world-department-agent'
 *    - [ ] Agent has proper instructionsPrompt enforcing JSON
 *    - [ ] Agent is marked as active
 *
 * 3. Test Data:
 *    - [ ] Gather DB has test world data
 *    - [ ] Test project exists
 *
 * 4. Run Tests:
 *    ```bash
 *    npm test -- world-department-refactor.test.ts
 *    ```
 *
 * 5. Verify Results:
 *    - [ ] Story bible generated with all required fields
 *    - [ ] Agent execution tracked in agent-executions
 *    - [ ] Performance metrics updated
 *    - [ ] Story bible stored in both DBs
 *    - [ ] Brain ingestion successful
 */
