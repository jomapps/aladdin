/**
 * Core Department Protection Tests
 * 
 * Tests that core departments cannot be deleted while custom departments can be.
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { getPayload } from 'payload'
import config from '../../src/payload.config'
import type { Payload } from 'payload'

describe('Core Department Protection', () => {
  let payload: Payload
  let customDepartmentId: string

  beforeAll(async () => {
    payload = await getPayload({ config })
  })

  afterAll(async () => {
    // Clean up custom department if it exists
    if (customDepartmentId) {
      try {
        await payload.delete({
          collection: 'departments',
          id: customDepartmentId,
        })
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  })

  it('should prevent deletion of core departments', async () => {
    // Find a core department (e.g., Story Department)
    const coreDepartments = await payload.find({
      collection: 'departments',
      where: {
        slug: {
          equals: 'story',
        },
      },
      limit: 1,
    })

    expect(coreDepartments.docs.length).toBe(1)
    const storyDept = coreDepartments.docs[0]
    expect(storyDept.coreDepartment).toBe(true)

    // Attempt to delete the core department
    try {
      await payload.delete({
        collection: 'departments',
        id: storyDept.id,
      })
      
      // If we reach here, the test should fail
      expect(true).toBe(false) // Force failure
    } catch (error) {
      // Expected to throw an error due to access control
      expect(error).toBeDefined()
    }

    // Verify the department still exists
    const stillExists = await payload.findByID({
      collection: 'departments',
      id: storyDept.id,
    })
    expect(stillExists).toBeDefined()
    expect(stillExists.slug).toBe('story')
  })

  it('should allow deletion of custom departments', async () => {
    // Create a custom department
    const customDept = await payload.create({
      collection: 'departments',
      data: {
        slug: 'test-custom-dept',
        name: 'Test Custom Department',
        description: 'A test custom department that can be deleted',
        icon: '🧪',
        color: '#FF0000',
        priority: 10,
        isActive: true,
        coreDepartment: false,
        defaultModel: 'anthropic/claude-3-haiku',
        maxAgentSteps: 10,
        coordinationSettings: {
          allowParallelExecution: true,
          requiresDepartmentHeadReview: false,
          minQualityThreshold: 70,
          maxRetries: 2,
        },
        performance: {
          totalExecutions: 0,
          successfulExecutions: 0,
          averageQualityScore: 0,
          averageExecutionTime: 0,
        },
      },
    })

    customDepartmentId = customDept.id
    expect(customDept.coreDepartment).toBe(false)

    // Delete the custom department (should succeed)
    await payload.delete({
      collection: 'departments',
      id: customDepartmentId,
    })

    // Verify it's deleted
    try {
      await payload.findByID({
        collection: 'departments',
        id: customDepartmentId,
      })
      // If we reach here, the test should fail
      expect(true).toBe(false)
    } catch (error) {
      // Expected - department should not exist
      expect(error).toBeDefined()
    }

    customDepartmentId = '' // Clear the ID since it's deleted
  })

  it('should have exactly 6 core departments', async () => {
    const coreDepartments = await payload.find({
      collection: 'departments',
      where: {
        coreDepartment: {
          equals: true,
        },
      },
    })

    expect(coreDepartments.docs.length).toBe(6)

    const coreSlugs = coreDepartments.docs.map(dept => dept.slug).sort()
    expect(coreSlugs).toEqual([
      'audio',
      'character',
      'production',
      'story',
      'video',
      'visual',
    ])
  })

  it('should have coreDepartment field as read-only in admin', async () => {
    // This test verifies the field configuration
    const departmentCollection = payload.collections['departments']
    const coreDepartmentField = departmentCollection.config.fields.find(
      (field: any) => field.name === 'coreDepartment'
    )

    expect(coreDepartmentField).toBeDefined()
    expect(coreDepartmentField.type).toBe('checkbox')
    expect(coreDepartmentField.defaultValue).toBe(false)
    expect(coreDepartmentField.admin?.readOnly).toBe(true)
  })

  it('should allow updating other fields of core departments', async () => {
    // Find a core department
    const coreDepartments = await payload.find({
      collection: 'departments',
      where: {
        slug: {
          equals: 'character',
        },
      },
      limit: 1,
    })

    const characterDept = coreDepartments.docs[0]
    const originalPriority = characterDept.priority

    // Update a non-protected field
    const updated = await payload.update({
      collection: 'departments',
      id: characterDept.id,
      data: {
        priority: originalPriority + 1,
      },
    })

    expect(updated.priority).toBe(originalPriority + 1)
    expect(updated.coreDepartment).toBe(true) // Should remain true

    // Restore original priority
    await payload.update({
      collection: 'departments',
      id: characterDept.id,
      data: {
        priority: originalPriority,
      },
    })
  })
})

