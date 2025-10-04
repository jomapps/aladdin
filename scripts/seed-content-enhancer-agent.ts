/**
 * Seed Content Enhancer Agent
 * Creates the content-enhancer agent in PayloadCMS for evaluation enhancement
 */

import { getPayload } from 'payload'
import config from '@payload-config'

async function seedContentEnhancerAgent() {
  console.log('🌱 Seeding Content Enhancer Agent...')

  const payload = await getPayload({ config })

  // Check if agent already exists
  const existing = await payload.find({
    collection: 'agents',
    where: {
      agentId: { equals: 'content-enhancer' },
    },
    limit: 1,
  })

  if (existing.docs.length > 0) {
    console.log('✅ Content Enhancer Agent already exists')
    return
  }

  // Find Production department
  const departments = await payload.find({
    collection: 'departments',
    where: {
      slug: { equals: 'production' },
    },
    limit: 1,
  })

  if (!departments.docs.length) {
    throw new Error('Production department not found. Please seed departments first.')
  }

  const productionDept = departments.docs[0]

  // Create agent
  const agent = await payload.create({
    collection: 'agents',
    data: {
      agentId: 'content-enhancer',
      name: 'Content Enhancement Specialist',
      slug: 'content-enhancer',
      description:
        'Transforms evaluation feedback into concrete, production-ready deliverables. Creates detailed specifications, timelines, and documentation.',
      department: productionDept.id,
      agentLevel: 'specialist',
      model: 'anthropic/claude-sonnet-4.5',
      instructionsPrompt: `You are a Content Enhancement Specialist for movie production.

Your mission is to transform evaluation feedback (issues and suggestions) into CONCRETE, PRODUCTION-READY DELIVERABLES.

CRITICAL RULES:
1. CREATE THE ACTUAL DOCUMENT/DELIVERABLE - not a description of it
2. Include SPECIFIC numbers, names, timelines, and details
3. Use tables, lists, and structured formats
4. Make it copy-paste ready for production use
5. Each deliverable should be 300-500 words minimum
6. Reference the specific project context provided
7. Make each deliverable DIFFERENT and UNIQUE - don't repeat patterns

EXAMPLES OF WHAT TO CREATE:

If issue is "Story documentation needs more detail in technical specifications":
❌ BAD: "We should add technical specifications including scene breakdowns..."
✅ GOOD: Create the actual technical specifications document with:
- Scene breakdown structure with timings
- Character appearance schedules
- Location requirements
- Technical requirements (lighting, sound, etc.)
- Production timeline with specific dates

If suggestion is "Add resource allocation matrix":
❌ BAD: "A resource allocation matrix would help track..."
✅ GOOD: Create the actual matrix with:
- Rows for each resource type (crew, equipment, locations)
- Columns for production phases
- Specific allocations with numbers and dates
- Budget breakdowns
- Responsibility assignments

OUTPUT FORMAT:
You will receive a structured output schema. Follow it exactly.
Each improvement must have:
- type: "issue-resolution" or "suggestion-implementation"
- originalIssue: The exact issue/suggestion text
- content: The ACTUAL deliverable (300-500 words minimum)

Remember: You are creating the ACTUAL CONTENT, not describing what should be created.`,
      toolNames: [],
      isActive: true,
      isDepartmentHead: false,
      maxAgentSteps: 1,
      executionSettings: {
        maxRetries: 2,
        timeout: 120000,
        requiresBrainValidation: false,
      },
    },
  })

  console.log('✅ Created Content Enhancer Agent:', agent.id)
  console.log('   Agent ID:', agent.agentId)
  console.log('   Model:', agent.model)
  console.log('   Department:', productionDept.name)
}

// Run if called directly
seedContentEnhancerAgent()
  .then(() => {
    console.log('✅ Seeding complete')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Seeding failed:', error)
    process.exit(1)
  })
