/**
 * Database Restore Script
 *
 * Restores data from a backup in the backups/ directory.
 * If no backup is specified, restores from the latest backup.
 *
 * Usage:
 *   pnpm db:restore                           # Restore latest backup
 *   pnpm db:restore --backup backup-2025-01  # Restore specific backup
 *   pnpm db:restore --confirm                 # Skip confirmation prompt
 */

import { MongoClient } from 'mongodb'
import * as fs from 'fs'
import * as path from 'path'
import * as readline from 'readline'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const PAYLOAD_DB_URI = process.env.DATABASE_URI || 'mongodb://localhost:27017/aladdin'
const OPEN_DB_URI =
  process.env.DATABASE_URI_OPEN || process.env.DATABASE_URI || 'mongodb://localhost:27017'
const BACKUPS_DIR = path.resolve(__dirname, '../../backups')

/**
 * @typedef {Object} RestoreOptions
 * @property {string} [backup] - Backup name to restore
 * @property {boolean} [confirm] - Skip confirmation prompt
 */

/**
 * Parse command line arguments
 * @returns {RestoreOptions}
 */
function parseArgs() {
  const args = process.argv.slice(2)
  /** @type {RestoreOptions} */
  const options = {}

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--backup' && args[i + 1]) {
      options.backup = args[i + 1]
      i++
    } else if (args[i] === '--confirm') {
      options.confirm = true
    }
  }

  return options
}

/**
 * Get the latest backup directory
 * @returns {string | null}
 */
function getLatestBackup() {
  if (!fs.existsSync(BACKUPS_DIR)) {
    return null
  }

  const backups = fs
    .readdirSync(BACKUPS_DIR)
    .filter((name) => {
      const backupPath = path.join(BACKUPS_DIR, name)
      return fs.statSync(backupPath).isDirectory()
    })
    .sort()
    .reverse()

  return backups.length > 0 ? backups[0] : null
}

/**
 * Ask user for confirmation
 * @param {string} backupName
 * @returns {Promise<boolean>}
 */
async function askConfirmation(backupName) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  return new Promise((resolve) => {
    rl.question(
      `\n⚠️  WARNING: This will REPLACE ALL DATA with backup: ${backupName}\n\n` +
        'Are you sure you want to continue? (yes/no): ',
      (answer) => {
        rl.close()
        resolve(answer.toLowerCase() === 'yes')
      },
    )
  })
}

/**
 * Restore PayloadCMS collections
 * @param {import('mongodb').MongoClient} client
 * @param {string} backupDir
 * @returns {Promise<void>}
 */
async function restorePayloadCollections(client, backupDir) {
  console.log('\n📥 Restoring PayloadCMS collections...')

  const payloadBackupDir = path.join(backupDir, 'payload')

  if (!fs.existsSync(payloadBackupDir)) {
    console.log('  ⏭️  No PayloadCMS backup found')
    return
  }

  const db = client.db()
  const backupFiles = fs.readdirSync(payloadBackupDir).filter((f) => f.endsWith('.json'))

  let restored = 0
  for (const file of backupFiles) {
    const collectionName = path.basename(file, '.json')

    try {
      const filePath = path.join(payloadBackupDir, file)
      const documents = JSON.parse(fs.readFileSync(filePath, 'utf-8'))

      if (!Array.isArray(documents) || documents.length === 0) {
        console.log(`  ⏭️  Skipped: ${collectionName} (no data)`)
        continue
      }

      // Clear existing data
      const collection = db.collection(collectionName)
      await collection.deleteMany({})

      // Insert backup data
      await collection.insertMany(documents)

      console.log(`  ✅ Restored: ${collectionName} (${documents.length} documents)`)
      restored++
    } catch (error) {
      console.error(`  ❌ Failed to restore ${collectionName}:`, error)
    }
  }

  console.log(`\n✅ PayloadCMS restore completed (${restored} collections)`)
}

/**
 * Restore Open MongoDB databases
 * @param {import('mongodb').MongoClient} client
 * @param {string} backupDir
 * @returns {Promise<void>}
 */
async function restoreOpenDatabases(client, backupDir) {
  console.log('\n📥 Restoring Open MongoDB databases...')

  const openBackupDir = path.join(backupDir, 'open')

  if (!fs.existsSync(openBackupDir)) {
    console.log('  ℹ️  No Open MongoDB backup found')
    return
  }

  const databases = fs.readdirSync(openBackupDir).filter((name) => {
    const dbPath = path.join(openBackupDir, name)
    return fs.statSync(dbPath).isDirectory()
  })

  if (databases.length === 0) {
    console.log('  ℹ️  No open databases in backup')
    return
  }

  let restored = 0
  for (const dbName of databases) {
    try {
      const dbBackupDir = path.join(openBackupDir, dbName)
      const db = client.db(dbName)

      // Drop existing database
      await db.dropDatabase()

      // Restore collections
      const collectionFiles = fs.readdirSync(dbBackupDir).filter((f) => f.endsWith('.json'))

      for (const file of collectionFiles) {
        const collectionName = path.basename(file, '.json')
        const filePath = path.join(dbBackupDir, file)
        const documents = JSON.parse(fs.readFileSync(filePath, 'utf-8'))

        if (Array.isArray(documents) && documents.length > 0) {
          const collection = db.collection(collectionName)
          await collection.insertMany(documents)
          console.log(`  ✅ Restored: ${dbName}/${collectionName} (${documents.length} documents)`)
        }
      }

      restored++
    } catch (error) {
      console.error(`  ❌ Failed to restore ${dbName}:`, error)
    }
  }

  console.log(`\n✅ Open databases restore completed (${restored} databases)`)
}

async function main() {
  console.log('📥 Database Restore Script')
  console.log('='.repeat(60))

  const options = parseArgs()

  // Determine backup to restore
  const backupName = options.backup || getLatestBackup()

  if (!backupName) {
    console.error('\n❌ No backups found in backups/ directory')
    console.log('ℹ️  Create a backup first: pnpm db:backup')
    process.exit(1)
  }

  const backupDir = path.join(BACKUPS_DIR, backupName)

  if (!fs.existsSync(backupDir)) {
    console.error(`\n❌ Backup not found: ${backupName}`)
    console.log('\nAvailable backups:')
    const backups = fs.readdirSync(BACKUPS_DIR).filter((name) => {
      const backupPath = path.join(BACKUPS_DIR, name)
      return fs.statSync(backupPath).isDirectory()
    })
    backups.forEach((b) => console.log(`  - ${b}`))
    process.exit(1)
  }

  console.log(`\n📁 Restoring from: ${backupName}`)

  // Show backup metadata if available
  const metadataPath = path.join(backupDir, 'metadata.json')
  if (fs.existsSync(metadataPath)) {
    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'))
    console.log(`   Created: ${metadata.timestamp}`)
  }

  // Confirm restoration
  if (!options.confirm) {
    const confirmed = await askConfirmation(backupName)
    if (!confirmed) {
      console.log('\n❌ Operation cancelled')
      process.exit(0)
    }
  }

  let payloadClient = null
  let openClient = null

  try {
    // Connect to PayloadCMS database
    console.log('\n📦 Connecting to PayloadCMS database...')
    payloadClient = new MongoClient(PAYLOAD_DB_URI)
    await payloadClient.connect()
    console.log('✅ Connected to PayloadCMS database')

    // Restore PayloadCMS collections
    await restorePayloadCollections(payloadClient, backupDir)

    // Connect to Open MongoDB (if different)
    if (OPEN_DB_URI !== PAYLOAD_DB_URI) {
      console.log('\n📦 Connecting to Open MongoDB...')
      openClient = new MongoClient(OPEN_DB_URI)
      await openClient.connect()
      console.log('✅ Connected to Open MongoDB')

      // Restore Open databases
      await restoreOpenDatabases(openClient, backupDir)
    } else {
      // Same connection, just restore open databases
      await restoreOpenDatabases(payloadClient, backupDir)
    }

    console.log('\n' + '='.repeat(60))
    console.log('🎉 Restore completed successfully!')

    process.exit(0)
  } catch (error) {
    console.error('\n❌ Restore failed:', error)
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
