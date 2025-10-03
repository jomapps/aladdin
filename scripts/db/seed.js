/**
 * Database Seed Script
 *
 * Seeds data from JSON files in the seeds/ directory.
 * Supports collection-wise seeding with dependency resolution.
 *
 * Usage:
 *   pnpm db:seed                    # Seed all collections (recommended)
 *   pnpm db:seed --collection users # Seed specific collection
 *   pnpm db:seed --clean            # Clean before seeding
 *
 * Note: Uses PayloadCMS best practices with getPayload() pattern
 */

import { getPayload } from 'payload'
import config from '@payload-config'

import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

console.log('🔍 Script starting...')

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

console.log('✅ config imported')
// Collection seeding order (respects dependencies)
const COLLECTION_ORDER = [
  'users',
  'departments',
  'agents',
  'custom-tools',
  'projects',
  'episodes',
  'conversations',
  'workflows',
  'activity-logs',
  'export-jobs',
  'media',
]
const SEEDS_DIR = path.join(__dirname, '..', '..', 'seeds')

async function loadSeedData(collectionName) {
  const seedFile = path.join(SEEDS_DIR, `${collectionName}.json`)

  if (!fs.existsSync(seedFile)) {
    console.log(`  ⏭️  No seed file found: ${collectionName}.json`)
    return []
  }

  try {
    const data = JSON.parse(fs.readFileSync(seedFile, 'utf-8'))
    return Array.isArray(data) ? data : [data]
  } catch (error) {
    console.error(`  ❌ Failed to load ${collectionName}.json:`, error)
    return []
  }
}

async function seedCollection(payload, collectionName) {
  console.log(`\n📦 Seeding ${collectionName}...`)

  const data = await loadSeedData(collectionName)

  if (data.length === 0) {
    return 0
  }

  let seeded = 0

  for (const item of data) {
    try {
      // Check if item already exists (by unique field if available)
      const uniqueField = getUniqueField(collectionName)
      if (uniqueField && item[uniqueField]) {
        const existing = await payload.find({
          collection: collectionName,
          where: {
            [uniqueField]: {
              equals: item[uniqueField],
            },
          },
          limit: 1,
        })

        if (existing.docs.length > 0) {
          console.log(`  ⏭️  Skipped: ${item[uniqueField]} (already exists)`)
          continue
        }
      }

      await payload.create({
        collection: collectionName,
        data: item,
      })

      const identifier = item.name || item.title || item.slug || item.email || item.id || 'item'
      console.log(`  ✅ Created: ${identifier}`)
      seeded++
    } catch (error) {
      console.error(`  ❌ Failed to seed item:`, error.message)
    }
  }

  console.log(`✅ ${collectionName} seeded (${seeded}/${data.length} items)`)
  return seeded
}

function getUniqueField(collectionName) {
  const uniqueFields = {
    users: 'email',
    departments: 'slug',
    agents: 'agentId',
    'custom-tools': 'toolName',
    projects: 'slug',
    episodes: 'slug',
  }

  return uniqueFields[collectionName] || null
}

function parseArgs() {
  const args = process.argv.slice(2)
  const options = {
    collection: null,
    clean: false,
  }

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--collection' && args[i + 1]) {
      options.collection = args[i + 1]
      i++
    } else if (args[i] === '--clean') {
      options.clean = true
    }
  }

  return options
}

async function cleanCollection(payload, collectionName) {
  try {
    const items = await payload.find({
      collection: collectionName,
      limit: 1000,
    })

    for (const item of items.docs) {
      await payload.delete({
        collection: collectionName,
        id: item.id,
      })
    }

    console.log(`  🧹 Cleaned ${collectionName}`)
  } catch (error) {
    console.log(`  ⏭️  Skipped cleaning ${collectionName} (collection may not exist)`)
  }
}

async function main() {
  console.log('🌱 Database Seed Script')
  console.log('='.repeat(60))

  const options = parseArgs()

  // Check if seeds directory exists
  if (!fs.existsSync(SEEDS_DIR)) {
    console.log(`\n📁 Creating seeds directory: ${SEEDS_DIR}`)
    fs.mkdirSync(SEEDS_DIR, { recursive: true })
    console.log('ℹ️  Add JSON files to seeds/ directory to seed data')
    console.log('   Example: seeds/departments.json, seeds/agents.json')
    process.exit(0)
  }

  try {
    // Initialize PayloadCMS
    console.log('\n📦 Initializing PayloadCMS...')
    console.log('   Database URI:', process.env.DATABASE_URI || 'NOT SET')
    console.log('   Payload Secret:', process.env.PAYLOAD_SECRET ? 'SET' : 'NOT SET')

    // Add timeout for initialization with abort capability
    const initTimeout = setTimeout(() => {
      console.log('⏳ Still initializing... (this may take a moment on first run)')
      console.log('   If this hangs, check:')
      console.log('   - MongoDB is running')
      console.log('   - R2/S3 credentials are valid')
      console.log('   - Network connectivity')
    }, 5000)

    // Add a hard timeout
    const abortTimeout = setTimeout(() => {
      console.error('\n❌ Initialization timeout after 60 seconds')
      console.error('   This usually means:')
      console.error('   - MongoDB connection is hanging')
      console.error('   - S3/R2 storage adapter cannot connect')
      console.error('   - Network issues')
      process.exit(1)
    }, 60000)

    const payload = await getPayload({ config })
    console.log('✅ PayloadCMS initialized')
    clearTimeout(initTimeout)
    clearTimeout(abortTimeout)

    // Determine which collections to seed
    const collectionsToSeed = options.collection ? [options.collection] : COLLECTION_ORDER

    // Clean if requested
    if (options.clean) {
      console.log('\n🧹 Cleaning collections...')
      for (const collection of collectionsToSeed) {
        await cleanCollection(payload, collection)
      }
    }

    // Seed collections
    let totalSeeded = 0
    for (const collection of collectionsToSeed) {
      const seeded = await seedCollection(payload, collection)
      totalSeeded += seeded
    }

    console.log('\n' + '='.repeat(60))
    console.log(`🎉 Seeding completed! (${totalSeeded} items seeded)`)

    process.exit(0)
  } catch (error) {
    console.error('\n❌ Seeding failed:', error)
    process.exit(1)
  }
}

// Run the script
main()
