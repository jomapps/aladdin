import type { Payload } from 'payload'
import { promises as fs } from 'fs'
import path from 'path'

interface AgentDefinition {
  name: string
  slug: string
  description: string
  systemPrompt: string
  model: string
  temperature: number
  maxTokens: number
  tools: any[]
  department: string
}

interface AgentSeedData {
  agents: AgentDefinition[]
}

/**
 * Seeds the qualification workflow agents into PayloadCMS
 * These agents replace direct LLM calls with proper agent definitions
 */
export async function seedQualificationAgents(payload: Payload): Promise<void> {
  try {
    console.log('🤖 Starting qualification agents seed...')

    // Load agent definitions from JSON file
    const seedFilePath = path.join(process.cwd(), 'seeds', 'qualification-agents.json')
    const seedData = await fs.readFile(seedFilePath, 'utf-8')
    const agentData: AgentSeedData = JSON.parse(seedData)

    console.log(`📋 Found ${agentData.agents.length} agent definitions to seed`)

    // Department slug to ID mapping
    const departmentMap: Record<string, string> = {
      'character-department': '',
      'world-department': '',
      'story-department': '',
      'visual-department': '',
      'evaluation': ''
    }

    // Fetch department IDs
    console.log('🔍 Fetching department IDs...')
    for (const deptSlug of Object.keys(departmentMap)) {
      const dept = await payload.find({
        collection: 'departments',
        where: {
          slug: {
            equals: deptSlug
          }
        },
        limit: 1
      })

      if (dept.docs.length > 0) {
        departmentMap[deptSlug] = dept.docs[0].id
        console.log(`  ✓ Found department: ${deptSlug} (${dept.docs[0].id})`)
      } else {
        console.warn(`  ⚠️  Department not found: ${deptSlug}`)
      }
    }

    // Process each agent definition
    for (const agentDef of agentData.agents) {
      console.log(`\n📝 Processing agent: ${agentDef.name}`)

      // Check if agent already exists
      const existingAgent = await payload.find({
        collection: 'agents',
        where: {
          slug: {
            equals: agentDef.slug
          }
        },
        limit: 1
      })

      if (existingAgent.docs.length > 0) {
        console.log(`  ℹ️  Agent already exists: ${agentDef.slug}`)
        console.log(`  🔄 Updating existing agent...`)

        // Update existing agent
        await payload.update({
          collection: 'agents',
          id: existingAgent.docs[0].id,
          data: {
            name: agentDef.name,
            description: agentDef.description,
            systemPrompt: agentDef.systemPrompt,
            model: agentDef.model,
            temperature: agentDef.temperature,
            maxTokens: agentDef.maxTokens,
            tools: agentDef.tools,
            department: departmentMap[agentDef.department] || null
          }
        })

        console.log(`  ✅ Updated agent: ${agentDef.slug}`)
      } else {
        console.log(`  ➕ Creating new agent...`)

        // Create new agent
        await payload.create({
          collection: 'agents',
          data: {
            name: agentDef.name,
            slug: agentDef.slug,
            description: agentDef.description,
            systemPrompt: agentDef.systemPrompt,
            model: agentDef.model,
            temperature: agentDef.temperature,
            maxTokens: agentDef.maxTokens,
            tools: agentDef.tools,
            department: departmentMap[agentDef.department] || null,
            isActive: true
          }
        })

        console.log(`  ✅ Created agent: ${agentDef.slug}`)
      }
    }

    console.log('\n✅ Qualification agents seed completed successfully!')
    console.log(`\n📊 Summary:`)
    console.log(`  - Total agents processed: ${agentData.agents.length}`)
    console.log(`  - Departments linked: ${Object.values(departmentMap).filter(id => id).length}`)

  } catch (error) {
    console.error('❌ Error seeding qualification agents:', error)
    throw error
  }
}

/**
 * Verify that all agents are properly configured
 */
export async function verifyQualificationAgents(payload: Payload): Promise<boolean> {
  try {
    console.log('\n🔍 Verifying qualification agents...')

    const requiredAgents = [
      'character-department-agent',
      'world-department-agent',
      'story-department-agent',
      'visual-department-agent',
      'evaluation-agent'
    ]

    let allValid = true

    for (const agentSlug of requiredAgents) {
      const agent = await payload.find({
        collection: 'agents',
        where: {
          slug: {
            equals: agentSlug
          }
        },
        limit: 1
      })

      if (agent.docs.length === 0) {
        console.error(`  ❌ Missing agent: ${agentSlug}`)
        allValid = false
      } else {
        const agentDoc = agent.docs[0]

        // Verify required fields
        const checks = [
          { field: 'name', value: agentDoc.name },
          { field: 'systemPrompt', value: agentDoc.systemPrompt },
          { field: 'model', value: agentDoc.model },
          { field: 'department', value: agentDoc.department }
        ]

        let agentValid = true
        for (const check of checks) {
          if (!check.value) {
            console.error(`  ❌ Agent ${agentSlug} missing ${check.field}`)
            agentValid = false
            allValid = false
          }
        }

        if (agentValid) {
          console.log(`  ✅ Agent valid: ${agentSlug}`)
        }
      }
    }

    if (allValid) {
      console.log('\n✅ All qualification agents are properly configured!')
    } else {
      console.error('\n❌ Some qualification agents are missing or misconfigured')
    }

    return allValid

  } catch (error) {
    console.error('❌ Error verifying qualification agents:', error)
    return false
  }
}

/**
 * Export both functions for use in seed scripts
 */
export default {
  seedQualificationAgents,
  verifyQualificationAgents
}
