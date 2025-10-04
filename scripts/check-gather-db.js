/**
 * Check Gather Database Script
 * Verifies gather items in MongoDB for a specific project
 * 
 * Usage: node scripts/check-gather-db.js <projectId>
 */

import 'dotenv/config'
import { MongoClient } from 'mongodb'

const projectId = process.argv[2]

if (!projectId) {
  console.error('❌ Error: Project ID is required')
  console.log('Usage: node scripts/check-gather-db.js <projectId>')
  process.exit(1)
}

async function checkGatherDatabase() {
  const uri = process.env.DATABASE_URI_OPEN || process.env.DATABASE_URI || 'mongodb://localhost:27017'
  const client = new MongoClient(uri)

  try {
    await client.connect()
    console.log('✅ Connected to MongoDB')

    const dbName = `aladdin-gather-${projectId}`
    const db = client.db(dbName)
    const collection = db.collection('gather')

    // Get total count
    const totalCount = await collection.countDocuments({ projectId })
    console.log(`\n📊 Total gather items: ${totalCount}`)

    // Get automated items count
    const automatedCount = await collection.countDocuments({ projectId, isAutomated: true })
    console.log(`🤖 Automated items: ${automatedCount}`)

    // Get manual items count
    const manualCount = await collection.countDocuments({ projectId, isAutomated: { $ne: true } })
    console.log(`👤 Manual items: ${manualCount}`)

    // Get recent items (last 10)
    console.log('\n📝 Recent items (last 10):')
    const recentItems = await collection
      .find({ projectId })
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray()

    recentItems.forEach((item, index) => {
      console.log(`\n${index + 1}. ${item._id}`)
      console.log(`   Summary: ${item.summary?.slice(0, 80)}...`)
      console.log(`   Created: ${item.createdAt}`)
      console.log(`   Automated: ${item.isAutomated ? 'Yes' : 'No'}`)
      if (item.automationMetadata) {
        console.log(`   Department: ${item.automationMetadata.department}`)
        console.log(`   Model: ${item.automationMetadata.model}`)
      }
    })

    // Get items by department
    console.log('\n📂 Items by department:')
    const departments = await collection.distinct('automationMetadata.department', { projectId })
    for (const dept of departments) {
      const count = await collection.countDocuments({
        projectId,
        'automationMetadata.department': dept,
      })
      console.log(`   ${dept}: ${count} items`)
    }

    // Check for AI enhancement items
    console.log('\n🤖 AI Enhancement items:')
    const enhancementItems = await collection
      .find({
        projectId,
        'automationMetadata.model': 'ai-enhancement',
      })
      .sort({ createdAt: -1 })
      .toArray()

    console.log(`   Total: ${enhancementItems.length}`)
    if (enhancementItems.length > 0) {
      console.log('   Recent enhancements:')
      enhancementItems.slice(0, 5).forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.summary?.slice(0, 60)}...`)
        console.log(`      Created: ${item.createdAt}`)
      })
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  } finally {
    await client.close()
    console.log('\n✅ Disconnected from MongoDB')
  }
}

checkGatherDatabase()

