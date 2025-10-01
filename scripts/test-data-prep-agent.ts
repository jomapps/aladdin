/**
 * Test Script for Data Preparation Agent
 * Tests the agent with sample data
 */

import { getDataPreparationAgent } from '../src/lib/agents/data-preparation'

async function testAgent() {
  console.log('🧪 Testing Data Preparation Agent...\n')

  const agent = getDataPreparationAgent()

  // Test data: Sample character
  const testCharacter = {
    id: 'char_test_123',
    name: 'Aladdin',
    description: 'A street-smart young man with a heart of gold',
    appearance: 'Brown vest, purple pants, red fez',
    personality: 'Resourceful, kind, adventurous',
    backstory: 'Orphaned street thief who dreams of a better life',
  }

  const options = {
    projectId: 'proj_aladdin_test',
    entityType: 'character',
    sourceCollection: 'characters',
    sourceId: 'char_test_123',
    userId: 'user_test',
    createdByType: 'user' as const,
  }

  try {
    console.log('📝 Input Data:')
    console.log(JSON.stringify(testCharacter, null, 2))
    console.log('\n⚙️  Processing through agent...\n')

    const result = await agent.prepare(testCharacter, options)

    console.log('✅ Agent Processing Complete!\n')
    console.log('📊 Result Summary:')
    console.log('- Document ID:', result.id)
    console.log('- Type:', result.type)
    console.log('- Project ID:', result.project_id)
    console.log('- Text Length:', result.text.length, 'characters')
    console.log('- Metadata Keys:', Object.keys(result.metadata).length)
    console.log('- Relationships:', result.relationships.length)
    console.log('\n📋 Generated Metadata:')
    console.log(JSON.stringify(result.metadata, null, 2))
    console.log('\n🔗 Discovered Relationships:')
    console.log(JSON.stringify(result.relationships, null, 2))
    console.log('\n📄 Searchable Text (first 200 chars):')
    console.log(result.text.substring(0, 200) + '...')

    console.log('\n✅ Test Passed!')
  } catch (error) {
    console.error('\n❌ Test Failed:', error)
    process.exit(1)
  }
}

// Run test
testAgent()
  .then(() => {
    console.log('\n🎉 All tests completed successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Test suite failed:', error)
    process.exit(1)
  })

