/**
 * Master Seed Script for Aladdin Dynamic Agents System
 *
 * Seeds PayloadCMS collections with:
 * - 7 Departments (Story, Character, Visual, Image Quality, Video, Audio, Production)
 * - 35 Agents (6 department heads + 29 specialists)
 * - 10 Custom Tools (character analysis, plot validation, etc.)
 *
 * Usage:
 *   payload run src/seed/index.ts
 *   OR
 *   npm run db:seed
 *
 * @module seed
 */

import { getPayload } from 'payload'
import config from '@payload-config'
import { seedDepartments } from './departments.seed.js'
import { seedAgents } from './agents.seed.js'
import { seedCustomTools } from './custom-tools.seed.js'
import { seedUsers } from './users.seed.js'
import { seedProjects } from './projects.seed.js'
import { seedQualificationAgents } from './qualification-agents.seed.js'

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

    // Seed order:
    // Users → Departments → Agents → Custom Tools → Qualification Agents → Projects
    // (Agents & Tools depend on Departments; Projects depend on Users)

    await seedUsers(payload)
    await seedDepartments(payload)
    await seedAgents(payload)
    await seedCustomTools(payload)
    await seedQualificationAgents(payload)
    await seedProjects(payload)

    console.log('='.repeat(60))
    console.log('🎉 Seed process completed successfully!\n')

    // Summary
    console.log('📊 Seed Summary:')
    console.log('  - Users: 3')
    console.log('  - Departments: 7')
    console.log('  - Agents: 40 (6 heads + 29 specialists + 5 qualification agents)')
    console.log('    • Story: 5 agents')
    console.log(
      '    • Character: 10 agents (includes Hair Stylist, Costume Designer, Makeup Artist, Voice Creator)',
    )
    console.log('    • Visual: 5 agents')
    console.log('    • Video: 5 agents')
    console.log('    • Audio: 5 agents')
    console.log('    • Production: 5 agents')
    console.log('    • Qualification: 5 agents (Character, World, Story, Visual, Evaluation)')
    console.log('  - Custom Tools: 10')
    console.log('  - Projects: 4')
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
await seed()
