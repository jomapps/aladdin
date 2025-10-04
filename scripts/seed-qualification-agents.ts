#!/usr/bin/env node
/**
 * Standalone script to seed only qualification agents
 *
 * Usage:
 *   payload run scripts/seed-qualification-agents.ts
 *   OR
 *   npm run seed:qualification-agents
 *
 * This script will:
 * 1. Load agent definitions from seeds/qualification-agents.json
 * 2. Create or update 5 qualification workflow agents
 * 3. Link agents to their respective departments
 * 4. Verify all agents are properly configured
 */

import { getPayload } from 'payload'
import config from '@payload-config'
import { seedQualificationAgents, verifyQualificationAgents } from '../src/seed/qualification-agents.seed.js'

async function main() {
  console.log('🚀 Qualification Agents Seed Script')
  console.log('='.repeat(60))
  console.log('')

  try {
    // Initialize Payload
    console.log('📦 Initializing PayloadCMS...')
    const payload = await getPayload({ config })
    console.log('✅ PayloadCMS initialized\n')

    // Run the seed
    await seedQualificationAgents(payload)

    // Verify the agents
    const isValid = await verifyQualificationAgents(payload)

    console.log('')
    console.log('='.repeat(60))

    if (isValid) {
      console.log('✅ Qualification agents seeded and verified successfully!')
      console.log('')
      console.log('📋 Agents Created/Updated:')
      console.log('  1. Character Department Agent - 360° character reference generation')
      console.log('  2. World Department Agent - Story bible and world building')
      console.log('  3. Story Department Agent - Screenplay and scene breakdown')
      console.log('  4. Visual Department Agent - Visual style guide creation')
      console.log('  5. Evaluation Agent - Quality scoring and gap analysis')
      console.log('')
      console.log('🎯 Next Steps:')
      console.log('  - Review agents in PayloadCMS admin (/admin/collections/agents)')
      console.log('  - Test agents with AladdinAgentRunner')
      console.log('  - Update qualification workflow to use these agents')
      console.log('')
      process.exit(0)
    } else {
      console.error('❌ Qualification agents verification failed!')
      console.error('Please check the errors above and run the script again.')
      console.log('')
      process.exit(1)
    }

  } catch (error) {
    console.error('')
    console.error('❌ Error seeding qualification agents:', error)
    console.error('')
    if (error instanceof Error) {
      console.error('Stack trace:', error.stack)
    }
    console.error('')
    process.exit(1)
  }
}

// Execute
main()
