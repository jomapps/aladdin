/**
 * Character Department Integration Tests
 * Tests character department head and specialists
 */

import { describe, it, expect } from 'vitest'
import { getAgentPool } from '@/lib/agents/agentPool'

describe('Character Department', () => {
  it('should register character department head', () => {
    const pool = getAgentPool()
    const config = pool.getAgentConfig('character-department-head')

    expect(config).toBeDefined()
    expect(config?.displayName).toBe('Character Department Head')
    expect(config?.agentLevel).toBe('department')
  })

  it('should have character creation tools', () => {
    const pool = getAgentPool()
    const config = pool.getAgentConfig('character-department-head')

    expect(config?.customTools).toContain('save_character')
    expect(config?.customTools).toContain('grade_output')
  })

  it('should list specialist agents', () => {
    const pool = getAgentPool()
    const specialists = pool.getAgentsByLevel('specialist')

    expect(specialists.length).toBeGreaterThan(0)

    const hairStylist = specialists.find(s => s.id === 'hair-stylist-specialist')
    expect(hairStylist).toBeDefined()
  })
})
