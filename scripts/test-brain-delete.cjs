/**
 * Test Brain API DELETE Endpoint
 * 
 * This script tests if the Brain API DELETE endpoint works correctly.
 * 
 * Usage:
 *   node scripts/test-brain-delete.js <nodeId> <projectId>
 */

const axios = require('axios')
require('dotenv').config()

const nodeId = process.argv[2]
const projectId = process.argv[3]

if (!nodeId || !projectId) {
  console.error('❌ Error: Node ID and Project ID are required')
  console.log('Usage: node scripts/test-brain-delete.js <nodeId> <projectId>')
  console.log('Example: node scripts/test-brain-delete.js 68e0e835a74df94e04112dd0 68df4dab400c86a6a8cf40c6')
  process.exit(1)
}

const BRAIN_URL = process.env.BRAIN_SERVICE_BASE_URL || 'https://brain.ft.tc'
const BRAIN_API_KEY = process.env.BRAIN_SERVICE_API_KEY

if (!BRAIN_API_KEY) {
  console.error('❌ Error: BRAIN_SERVICE_API_KEY not found in .env')
  process.exit(1)
}

async function testBrainDelete() {
  console.log('🧪 Testing Brain API DELETE Endpoint')
  console.log('=' .repeat(60))
  console.log(`Brain URL: ${BRAIN_URL}`)
  console.log(`Node ID: ${nodeId}`)
  console.log(`Project ID: ${projectId}`)
  console.log('')

  try {
    // Test 1: Check if node exists (GET)
    console.log('📊 Step 1: Checking if node exists...')
    try {
      const getResponse = await axios.get(
        `${BRAIN_URL}/api/v1/nodes/${nodeId}`,
        {
          params: { project_id: projectId },
          headers: {
            'Authorization': `Bearer ${BRAIN_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      )
      console.log('   ✅ Node exists:', getResponse.data)
      console.log('')
    } catch (getError) {
      if (getError.response?.status === 404) {
        console.log('   ⚠️  Node not found (404) - This is okay, we can still test DELETE')
        console.log('')
      } else {
        console.log('   ❌ GET request failed:', getError.response?.status, getError.response?.data)
        console.log('')
      }
    }

    // Test 2: Try to delete the node
    console.log('🗑️  Step 2: Attempting to delete node...')
    console.log(`   DELETE ${BRAIN_URL}/api/v1/nodes/${nodeId}?project_id=${projectId}`)
    console.log('')

    const deleteResponse = await axios.delete(
      `${BRAIN_URL}/api/v1/nodes/${nodeId}`,
      {
        params: { project_id: projectId },
        headers: {
          'Authorization': `Bearer ${BRAIN_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    )

    console.log('   ✅ DELETE successful!')
    console.log('   Response:', JSON.stringify(deleteResponse.data, null, 2))
    console.log('')

    // Test 3: Verify node is deleted
    console.log('✅ Step 3: Verifying node is deleted...')
    try {
      await axios.get(
        `${BRAIN_URL}/api/v1/nodes/${nodeId}`,
        {
          params: { project_id: projectId },
          headers: {
            'Authorization': `Bearer ${BRAIN_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      )
      console.log('   ⚠️  Node still exists (unexpected)')
    } catch (verifyError) {
      if (verifyError.response?.status === 404) {
        console.log('   ✅ Node successfully deleted (404 on GET)')
      } else {
        console.log('   ❌ Verification failed:', verifyError.response?.status)
      }
    }

    console.log('')
    console.log('=' .repeat(60))
    console.log('✅ SUCCESS: Brain DELETE endpoint works!')
    console.log('')

  } catch (error) {
    console.log('')
    console.log('=' .repeat(60))
    console.log('❌ FAILURE: Brain DELETE endpoint failed')
    console.log('')
    
    if (error.response) {
      console.log('Status:', error.response.status)
      console.log('Status Text:', error.response.statusText)
      console.log('Response Data:', JSON.stringify(error.response.data, null, 2))
      console.log('')
      
      if (error.response.status === 405) {
        console.log('⚠️  405 Method Not Allowed - The DELETE method is not supported')
        console.log('   This means the Brain API endpoint does not accept DELETE requests')
        console.log('   Possible causes:')
        console.log('   1. The endpoint is not implemented')
        console.log('   2. The endpoint path is incorrect')
        console.log('   3. The server configuration blocks DELETE requests')
      } else if (error.response.status === 404) {
        console.log('✅ 404 Not Found - This is actually okay!')
        console.log('   The node doesn\'t exist, so deletion "succeeded" (nothing to delete)')
      } else if (error.response.status === 401 || error.response.status === 403) {
        console.log('⚠️  Authentication/Authorization error')
        console.log('   Check if BRAIN_SERVICE_API_KEY is correct')
      }
    } else if (error.request) {
      console.log('❌ No response received from server')
      console.log('   Error:', error.message)
    } else {
      console.log('❌ Error:', error.message)
    }
    
    console.log('')
    process.exit(1)
  }
}

// Run test
testBrainDelete()

