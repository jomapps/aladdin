/**
 * Master Seed Script for Aladdin Dynamic Agents System
 *
 * Seeds PayloadCMS collections with:
 * - 6 Departments (Story, Character, Visual, Video, Audio, Production)
 * - 35 Agents (6 department heads + 29 specialists)
 * - 10 Custom Tools (character analysis, plot validation, etc.)
 *
 * Agent Distribution:
 * - Story: 1 head + 4 specialists = 5 agents
 * - Character: 1 head + 9 specialists = 10 agents (includes Hair Stylist, Costume Designer, etc.)
 * - Visual: 1 head + 4 specialists = 5 agents
 * - Video: 1 head + 4 specialists = 5 agents
 * - Audio: 1 head + 4 specialists = 5 agents
 * - Production: 1 head + 4 specialists = 5 agents
 *
 * Usage:
 *   npm run seed
 *   OR
 *   node --loader ts-node/esm src/seed/index.ts
 *   OR
 *   tsx src/seed/index.ts
 *
 * @module seed
 */

import 'dotenv/config'
import { getPayload } from 'payload'
import config from '@payload-config'
import { seedDepartments } from './departments.seed'
import { seedAgents } from './agents.seed'
import { seedCustomTools } from './custom-tools.seed'

/**
 * Main seed function
 * Executes all seed operations in correct order
 */
async function seed() {
  console.log('🌱 Starting Aladdin seed process...\n')
  console.log('='.repeat(60))

  try {
    // Initialize PayloadCMS
    console.log('📦 Initializing PayloadCMS...')
    const payload = await getPayload({ config })
    console.log('✅ PayloadCMS initialized\n')

    // Seed in order: Departments → Agents → Custom Tools
    // (Agents depend on Departments, Tools depend on Departments)

    await seedDepartments(payload)
    await seedAgents(payload)
    await seedCustomTools(payload)

    console.log('='.repeat(60))
    console.log('🎉 Seed process completed successfully!\n')

    // Summary
    console.log('📊 Seed Summary:')
    console.log('  - Departments: 6')
    console.log('  - Agents: 35 (6 heads + 29 specialists)')
    console.log('    • Story: 5 agents')
    console.log(
      '    • Character: 10 agents (includes Hair Stylist, Costume Designer, Makeup Artist, Voice Creator)',
    )
    console.log('    • Visual: 5 agents')
    console.log('    • Video: 5 agents')
    console.log('    • Audio: 5 agents')
    console.log('    • Production: 5 agents')
    console.log('  - Custom Tools: 10')
    console.log('\n✨ Your Aladdin AI system is ready to use!\n')

    process.exit(0)
  } catch (error) {
    console.error('\n❌ Seed process failed:', error)
    console.error(
      '\nStack trace:',
      error instanceof Error ? error.stack : 'No stack trace available',
    )
    process.exit(1)
  }
}

// Execute seed
seed()

export { seed }
