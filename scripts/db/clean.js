/**
 * Database Clean Script
 *
 * Removes all collections from both PayloadCMS (protected) and Open MongoDB databases.
 * Use with caution - this will delete ALL data!
 *
 * Usage:
 *   pnpm db:clean
 *   pnpm db:clean --confirm  (skip confirmation prompt)
 */

import { MongoClient } from 'mongodb'
import * as readline from 'readline'

const PAYLOAD_DB_URI = process.env.DATABASE_URI || 'mongodb://localhost:27017/aladdin'
const OPEN_DB_URI =
  process.env.DATABASE_URI_OPEN || process.env.DATABASE_URI || 'mongodb://localhost:27017'

// Collections to clean in PayloadCMS database
const PAYLOAD_COLLECTIONS = [
  'users',
  'media',
  'projects',
  'episodes',
  'conversations',
  'workflows',
  'activity-logs',
  'export-jobs',
  'departments',
  'agents',
  'custom-tools',
  'agent-executions',
  'payload-preferences',
  'payload-migrations',
]

async function askConfirmation() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  return new Promise((resolve) => {
    rl.question(
      '\n⚠️  WARNING: This will DELETE ALL DATA from both databases!\n' +
        '   - PayloadCMS database (protected)\n' +
        '   - All Open MongoDB project databases\n\n' +
        'Are you sure you want to continue? (yes/no): ',
      (answer) => {
        rl.close()
        resolve(answer.toLowerCase() === 'yes')
      },
    )
  })
}

async function cleanPayloadDatabase(client) {
  console.log('\n🧹 Cleaning PayloadCMS database...')

  const db = client.db()
  const collections = await db.listCollections().toArray()
  const existingCollections = collections.map((c) => c.name)

  let cleaned = 0
  for (const collectionName of PAYLOAD_COLLECTIONS) {
    if (existingCollections.includes(collectionName)) {
      try {
        await db.collection(collectionName).deleteMany({})
        console.log(`  ✅ Cleaned: ${collectionName}`)
        cleaned++
      } catch (error) {
        console.error(`  ❌ Failed to clean ${collectionName}:`, error)
      }
    } else {
      console.log(`  ⏭️  Skipped: ${collectionName} (doesn't exist)`)
    }
  }

  console.log(`\n✅ PayloadCMS database cleaned (${cleaned} collections)`)
}

async function cleanOpenDatabases(client) {
  console.log('\n🧹 Cleaning Open MongoDB databases...')

  const adminDb = client.db('admin')
  const { databases } = await adminDb.admin().listDatabases()

  // Find all project-scoped databases to drop: open_* and aladdin-gather-*
  const candidateDatabases = databases.filter(
    (db) => db.name.startsWith('open_') || db.name.startsWith('aladdin-gather-'),
  )

  if (candidateDatabases.length === 0) {
    console.log('  ℹ️  No open or gather databases found')
    return
  }

  let dropped = 0
  for (const database of candidateDatabases) {
    try {
      await client.db(database.name).dropDatabase()
      console.log(`  ✅ Dropped: ${database.name}`)
      dropped++
    } catch (error) {
      console.error(`  ❌ Failed to drop ${database.name}:`, error)
    }
  }

  console.log(`\n✅ Open/Gather databases cleaned (${dropped} databases dropped)`)
}

async function main() {
  console.log('🗑️  Database Clean Script')
  console.log('='.repeat(60))

  // Check for --confirm flag
  const skipConfirmation = process.argv.includes('--confirm')

  if (!skipConfirmation) {
    const confirmed = await askConfirmation()
    if (!confirmed) {
      console.log('\n❌ Operation cancelled')
      process.exit(0)
    }
  } else {
    console.log('\n✅ Confirmation skipped (--confirm flag provided)')
  }

  let payloadClient = null
  let openClient = null

  try {
    // Connect to PayloadCMS database
    console.log('\n📦 Connecting to PayloadCMS database...')
    payloadClient = new MongoClient(PAYLOAD_DB_URI)
    await payloadClient.connect()
    console.log('✅ Connected to PayloadCMS database')

    // Clean or drop PayloadCMS database
    if (process.argv.includes('--drop-db') || process.argv.includes('--drop')) {
      const dbName = payloadClient.db().databaseName
      console.log(`\n🗑️  Dropping database: ${dbName}`)

      try {
        await payloadClient.db().dropDatabase()
        console.log(`✅ Dropped PayloadCMS database: ${dbName}`)

        // Verify it's gone
        const adminDb = payloadClient.db('admin')
        const { databases } = await adminDb.admin().listDatabases()
        const stillExists = databases.find(db => db.name === dbName)

        if (stillExists) {
          console.error(`❌ WARNING: Database ${dbName} still exists after drop!`)
          console.error('   Manual cleanup may be required.')
        } else {
          console.log(`✅ Verified: Database ${dbName} has been completely removed`)
        }
      } catch (error) {
        console.error(`❌ Failed to drop database:`, error.message)
        throw error
      }
    } else {
      await cleanPayloadDatabase(payloadClient)
    }

    // Connect to Open MongoDB (if different)
    if (OPEN_DB_URI !== PAYLOAD_DB_URI) {
      console.log('\n📦 Connecting to Open MongoDB...')
      openClient = new MongoClient(OPEN_DB_URI)
      await openClient.connect()
      console.log('✅ Connected to Open MongoDB')

      // Clean Open databases
      await cleanOpenDatabases(openClient)
    } else {
      // Same connection, just clean open databases
      await cleanOpenDatabases(payloadClient)
    }

    console.log('\n' + '='.repeat(60))
    console.log('🎉 Database cleaning completed successfully!')
    console.log('\nℹ️  You can now run: pnpm db:seed')

    process.exit(0)
  } catch (error) {
    console.error('\n❌ Database cleaning failed:', error)
    process.exit(1)
  } finally {
    // Close connections
    if (payloadClient) {
      await payloadClient.close()
    }
    if (openClient && openClient !== payloadClient) {
      await openClient.close()
    }
  }
}

// Run the script
main()
