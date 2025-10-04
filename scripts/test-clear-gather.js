/**
 * Test Script for Clear Gather API
 * 
 * This script tests the clear gather endpoint by:
 * 1. Checking current gather count
 * 2. Calling the clear endpoint
 * 3. Verifying the gather is empty
 * 
 * Usage:
 *   node scripts/test-clear-gather.js <projectId>
 */

const projectId = process.argv[2]

if (!projectId) {
  console.error('❌ Error: Project ID is required')
  console.log('Usage: node scripts/test-clear-gather.js <projectId>')
  process.exit(1)
}

const BASE_URL = 'http://localhost:3001'

async function testClearGather() {
  console.log('🧪 Testing Clear Gather API')
  console.log('=' .repeat(60))
  console.log(`Project ID: ${projectId}`)
  console.log('')

  try {
    // Step 1: Check current gather count
    console.log('📊 Step 1: Checking current gather count...')
    const countResponse = await fetch(`${BASE_URL}/api/v1/gather/${projectId}?limit=1`)
    
    if (!countResponse.ok) {
      throw new Error(`Failed to fetch gather items: ${countResponse.statusText}`)
    }

    const countData = await countResponse.json()
    console.log(`   Current count: ${countData.total} items`)
    console.log('')

    if (countData.total === 0) {
      console.log('✅ Gather is already empty. Nothing to clear.')
      return
    }

    // Step 2: Call clear endpoint
    console.log('🗑️  Step 2: Calling clear endpoint...')
    console.log('   ⚠️  This will delete all gather data!')
    console.log('')

    const clearResponse = await fetch(`${BASE_URL}/api/v1/gather/${projectId}/clear`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!clearResponse.ok) {
      const errorData = await clearResponse.json()
      throw new Error(`Clear failed: ${errorData.error || clearResponse.statusText}`)
    }

    const clearData = await clearResponse.json()
    console.log('   Response:', JSON.stringify(clearData, null, 2))
    console.log('')

    // Step 3: Verify gather is empty
    console.log('✅ Step 3: Verifying gather is empty...')
    const verifyResponse = await fetch(`${BASE_URL}/api/v1/gather/${projectId}?limit=1`)
    
    if (!verifyResponse.ok) {
      throw new Error(`Failed to verify: ${verifyResponse.statusText}`)
    }

    const verifyData = await verifyResponse.json()
    console.log(`   New count: ${verifyData.total} items`)
    console.log('')

    // Results
    console.log('=' .repeat(60))
    if (verifyData.total === 0) {
      console.log('✅ SUCCESS: Gather cleared successfully!')
      console.log(`   Deleted: ${clearData.deleted.gather} gather items`)
      console.log(`   Deleted: ${clearData.deleted.brain} brain nodes`)
    } else {
      console.log('⚠️  WARNING: Gather not completely cleared')
      console.log(`   Expected: 0 items`)
      console.log(`   Actual: ${verifyData.total} items`)
    }

    if (clearData.errors && clearData.errors.length > 0) {
      console.log('')
      console.log('⚠️  Errors encountered:')
      clearData.errors.forEach((error, i) => {
        console.log(`   ${i + 1}. ${error}`)
      })
    }

  } catch (error) {
    console.error('')
    console.error('❌ Test failed:', error.message)
    process.exit(1)
  }
}

// Run test
testClearGather()

