/**
 * Database Backup Script
 *
 * Creates a backup of all PayloadCMS collections and Open MongoDB databases.
 * Backups are stored in the backups/ directory with timestamps.
 *
 * Usage:
 *   pnpm db:backup
 *   pnpm db:backup --name my-backup  # Custom backup name
 */

import { MongoClient } from 'mongodb'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const PAYLOAD_DB_URI = process.env.DATABASE_URI || 'mongodb://localhost:27017/aladdin'
const OPEN_DB_URI =
  process.env.DATABASE_URI_OPEN || process.env.DATABASE_URI || 'mongodb://localhost:27017'
const BACKUPS_DIR = path.resolve(__dirname, '../../backups')

// Collections to backup from PayloadCMS
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
]

interface BackupOptions {
  name?: string
}

function parseArgs(): BackupOptions {
  const args = process.argv.slice(2)
  const options: BackupOptions = {}

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--name' && args[i + 1]) {
      options.name = args[i + 1]
      i++
    }
  }

  return options
}

function getBackupName(customName?: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
  return customName ? `${customName}-${timestamp}` : `backup-${timestamp}`
}

async function backupPayloadCollections(client: MongoClient, backupDir: string): Promise<void> {
  console.log('\n💾 Backing up PayloadCMS collections...')

  const db = client.db()
  const collections = await db.listCollections().toArray()
  const existingCollections = collections.map((c) => c.name)

  let backed = 0
  for (const collectionName of PAYLOAD_COLLECTIONS) {
    if (!existingCollections.includes(collectionName)) {
      console.log(`  ⏭️  Skipped: ${collectionName} (doesn't exist)`)
      continue
    }

    try {
      const collection = db.collection(collectionName)
      const documents = await collection.find({}).toArray()

      const filePath = path.join(backupDir, 'payload', `${collectionName}.json`)
      fs.writeFileSync(filePath, JSON.stringify(documents, null, 2))

      console.log(`  ✅ Backed up: ${collectionName} (${documents.length} documents)`)
      backed++
    } catch (error) {
      console.error(`  ❌ Failed to backup ${collectionName}:`, error)
    }
  }

  console.log(`\n✅ PayloadCMS backup completed (${backed} collections)`)
}

async function backupOpenDatabases(client: MongoClient, backupDir: string): Promise<void> {
  console.log('\n💾 Backing up Open MongoDB databases...')

  const adminDb = client.db('admin')
  const { databases } = await adminDb.admin().listDatabases()

  // Find all databases starting with 'open_'
  const openDatabases = databases.filter((db: any) => db.name.startsWith('open_'))

  if (openDatabases.length === 0) {
    console.log('  ℹ️  No open databases found')
    return
  }

  let backed = 0
  for (const database of openDatabases) {
    try {
      const db = client.db(database.name)
      const collections = await db.listCollections().toArray()

      const dbDir = path.join(backupDir, 'open', database.name)
      fs.mkdirSync(dbDir, { recursive: true })

      for (const collectionInfo of collections) {
        const collection = db.collection(collectionInfo.name)
        const documents = await collection.find({}).toArray()

        const filePath = path.join(dbDir, `${collectionInfo.name}.json`)
        fs.writeFileSync(filePath, JSON.stringify(documents, null, 2))

        console.log(
          `  ✅ Backed up: ${database.name}/${collectionInfo.name} (${documents.length} documents)`,
        )
      }

      backed++
    } catch (error) {
      console.error(`  ❌ Failed to backup ${database.name}:`, error)
    }
  }

  console.log(`\n✅ Open databases backup completed (${backed} databases)`)
}

async function createBackupMetadata(backupDir: string): Promise<void> {
  const metadata = {
    timestamp: new Date().toISOString(),
    payloadDbUri: PAYLOAD_DB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'), // Hide credentials
    openDbUri: OPEN_DB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'),
    version: '1.0.0',
  }

  const metadataPath = path.join(backupDir, 'metadata.json')
  fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2))
  console.log('\n📝 Backup metadata created')
}

async function main() {
  console.log('💾 Database Backup Script')
  console.log('='.repeat(60))

  const options = parseArgs()
  const backupName = getBackupName(options.name)
  const backupDir = path.join(BACKUPS_DIR, backupName)

  // Create backup directory structure
  console.log(`\n📁 Creating backup directory: ${backupName}`)
  fs.mkdirSync(path.join(backupDir, 'payload'), { recursive: true })
  fs.mkdirSync(path.join(backupDir, 'open'), { recursive: true })

  let payloadClient: MongoClient | null = null
  let openClient: MongoClient | null = null

  try {
    // Connect to PayloadCMS database
    console.log('\n📦 Connecting to PayloadCMS database...')
    payloadClient = new MongoClient(PAYLOAD_DB_URI)
    await payloadClient.connect()
    console.log('✅ Connected to PayloadCMS database')

    // Backup PayloadCMS collections
    await backupPayloadCollections(payloadClient, backupDir)

    // Connect to Open MongoDB (if different)
    if (OPEN_DB_URI !== PAYLOAD_DB_URI) {
      console.log('\n📦 Connecting to Open MongoDB...')
      openClient = new MongoClient(OPEN_DB_URI)
      await openClient.connect()
      console.log('✅ Connected to Open MongoDB')

      // Backup Open databases
      await backupOpenDatabases(openClient, backupDir)
    } else {
      // Same connection, just backup open databases
      await backupOpenDatabases(payloadClient, backupDir)
    }

    // Create metadata file
    await createBackupMetadata(backupDir)

    console.log('\n' + '='.repeat(60))
    console.log('🎉 Backup completed successfully!')
    console.log(`\n📁 Backup location: ${backupDir}`)
    console.log(`\nℹ️  To restore: pnpm db:restore --backup ${backupName}`)

    process.exit(0)
  } catch (error) {
    console.error('\n❌ Backup failed:', error)
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
