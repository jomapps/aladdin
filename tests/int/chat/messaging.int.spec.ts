/**
 * Chat Messaging Integration Tests
 * Tests conversation and message handling
 */

import { describe, it, expect } from 'vitest'
import { getPayloadHMR } from '@payloadcms/next/utilities'
import configPromise from '@payload-config'

describe('Chat Messaging', () => {
  it('should create conversation', async () => {
    const payload = await getPayloadHMR({ config: configPromise })

    const conversation = await payload.create({
      collection: 'conversations',
      data: {
        name: 'Test Conversation',
        project: 'test-project-id',
        status: 'active',
        messages: []
      }
    })

    expect(conversation).toBeDefined()
    expect(conversation.id).toBeDefined()
    expect(conversation.status).toBe('active')
  })

  it('should add messages to conversation', async () => {
    const payload = await getPayloadHMR({ config: configPromise })

    const conversation = await payload.create({
      collection: 'conversations',
      data: {
        name: 'Test Conversation',
        project: 'test-project-id',
        status: 'active',
        messages: []
      }
    })

    const message = {
      id: Date.now().toString(),
      role: 'user' as const,
      content: 'Create a character',
      timestamp: new Date().toISOString()
    }

    const updated = await payload.update({
      collection: 'conversations',
      id: conversation.id,
      data: {
        messages: [message]
      }
    })

    expect(updated.messages).toHaveLength(1)
    expect(updated.messages[0].content).toBe('Create a character')
  })
})
