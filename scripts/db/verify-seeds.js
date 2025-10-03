/**
 * Verify Seed Data Script
 * 
 * Checks if users and projects were seeded successfully
 */

import 'dotenv/config'
import { getPayload } from 'payload'
import config from '@payload-config'

async function main() {
  console.log('🔍 Verifying seed data...\n')

  try {
    const payload = await getPayload({ config })
    console.log('✅ PayloadCMS connected\n')

    // Check users
    console.log('👤 Checking users...')
    const users = await payload.find({
      collection: 'users',
      limit: 100,
    })
    console.log(`   Found ${users.docs.length} users:`)
    users.docs.forEach(user => {
      console.log(`   - ${user.email} (${user.name})`)
    })

    // Check projects
    console.log('\n🎬 Checking projects...')
    const projects = await payload.find({
      collection: 'projects',
      limit: 100,
    })
    console.log(`   Found ${projects.docs.length} projects:`)
    projects.docs.forEach(project => {
      console.log(`   - ${project.name} (${project.slug}) - Owner: ${project.owner}`)
    })

    console.log('\n✅ Verification complete!')
    process.exit(0)
  } catch (error) {
    console.error('\n❌ Verification failed:', error.message)
    process.exit(1)
  }
}

main()

