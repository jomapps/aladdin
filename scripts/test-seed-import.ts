/**
 * Test script to verify seed imports work correctly
 */

import { getPayload } from 'payload'
import config from '@payload-config'

async function test() {
  console.log('Testing PayloadCMS import...')

  try {
    const payload = await getPayload({ config })
    console.log('✅ PayloadCMS initialized successfully')

    // Test database connection
    const users = await payload.find({
      collection: 'users',
      limit: 1,
    })

    console.log('✅ Database connection working')
    console.log(`Found ${users.totalDocs} users`)

    process.exit(0)
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

await test()
