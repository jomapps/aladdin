/**
 * Test Script for Qualification System Refactoring
 *
 * Verifies that all agents are properly configured and accessible
 * Run with: npx tsx scripts/test-qualification-refactor.ts
 */

import { getPayloadClient } from '@/lib/payload'

interface AgentCheck {
  agentId: string
  name: string
  department: string
  found: boolean
  error?: string
}

async function testQualificationAgents() {
  console.log('🔍 Testing Qualification System Agent Configuration\n')

  const payload = await getPayloadClient()

  const agentsToCheck = [
    { agentId: 'story-head-001', purpose: 'World building & Story development' },
    { agentId: 'visual-head-001', purpose: 'Visual guidelines & style' },
  ]

  const results: AgentCheck[] = []

  for (const { agentId, purpose } of agentsToCheck) {
    console.log(`\n📋 Checking agent: ${agentId}`)
    console.log(`   Purpose: ${purpose}`)

    try {
      const agent = await payload.find({
        collection: 'agents',
        where: {
          agentId: { equals: agentId },
          isActive: { equals: true },
        },
        limit: 1,
      })

      if (agent.docs.length === 0) {
        console.log(`   ❌ Agent not found or inactive`)
        results.push({
          agentId,
          name: 'Unknown',
          department: 'Unknown',
          found: false,
          error: 'Agent not found or inactive',
        })
      } else {
        const doc = agent.docs[0]
        console.log(`   ✅ Found: ${doc.name}`)
        console.log(`   📁 Department: ${typeof doc.department === 'string' ? doc.department : 'Complex'}`)
        console.log(`   🤖 Model: ${doc.model}`)
        console.log(`   📊 Max Steps: ${doc.maxAgentSteps}`)

        results.push({
          agentId: doc.agentId,
          name: doc.name,
          department: typeof doc.department === 'string' ? doc.department : 'Complex',
          found: true,
        })
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      results.push({
        agentId,
        name: 'Unknown',
        department: 'Unknown',
        found: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  // Summary
  console.log('\n\n📊 Summary\n')
  console.log('━'.repeat(60))

  const foundCount = results.filter(r => r.found).length
  const totalCount = results.length

  console.log(`Total Agents Checked: ${totalCount}`)
  console.log(`Found: ${foundCount}`)
  console.log(`Missing: ${totalCount - foundCount}`)

  console.log('\n📋 Details:')
  results.forEach(result => {
    const status = result.found ? '✅' : '❌'
    console.log(`  ${status} ${result.agentId}`)
    if (result.found) {
      console.log(`     Name: ${result.name}`)
      console.log(`     Department: ${result.department}`)
    } else {
      console.log(`     Error: ${result.error}`)
    }
  })

  // Environment variables check
  console.log('\n\n🔧 Environment Variables\n')
  console.log('━'.repeat(60))

  const envVars = [
    'OPENROUTER_API_KEY',
    'OPENROUTER_BASE_URL',
    'FAL_KEY',
    'BRAIN_SERVICE_API_KEY',
    'BRAIN_SERVICE_BASE_URL',
  ]

  envVars.forEach(envVar => {
    const value = process.env[envVar]
    if (value) {
      const masked = envVar.includes('KEY') || envVar.includes('API')
        ? `${value.substring(0, 8)}...${value.substring(value.length - 4)}`
        : value
      console.log(`  ✅ ${envVar}: ${masked}`)
    } else {
      console.log(`  ❌ ${envVar}: Not set`)
    }
  })

  // Exit with appropriate code
  const allFound = results.every(r => r.found)
  const allEnvVarsSet = envVars.every(v => !!process.env[v])

  console.log('\n\n🎯 Final Status\n')
  console.log('━'.repeat(60))

  if (allFound && allEnvVarsSet) {
    console.log('✅ All checks passed! Qualification system is ready.')
    process.exit(0)
  } else {
    console.log('❌ Some checks failed. Please review the errors above.')
    if (!allFound) {
      console.log('   → Missing agents. Run seed script: npm run seed')
    }
    if (!allEnvVarsSet) {
      console.log('   → Missing environment variables. Check .env file')
    }
    process.exit(1)
  }
}

// Run the test
testQualificationAgents().catch(error => {
  console.error('❌ Test script failed:', error)
  process.exit(1)
})
