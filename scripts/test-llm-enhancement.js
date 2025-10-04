/**
 * Test LLM Enhancement Generation
 * Tests if the LLM can generate detailed content from evaluation feedback
 * 
 * Usage: node scripts/test-llm-enhancement.js
 */

import 'dotenv/config'
import { getLLMClient } from '../src/lib/llm/client.js'

const testInput = `Aladdin and the 40 Thieves is a classic tale set in ancient Arabia. The story follows Aladdin, a poor but clever young man who discovers a magical lamp containing a powerful genie. The 40 thieves are a band of ruthless criminals led by their cunning captain. They hide their stolen treasures in a secret cave that opens with the magic words 'Open Sesame'.

Aladdin's character arc: He starts as a street urchin, gains power through the lamp, learns the responsibility that comes with power, and ultimately wins the heart of Princess Jasmine through his genuine kindness rather than magic.`

const issues = [
  'Story documentation needs more detail in technical specifications',
  'Timeline estimates for story tasks appear optimistic',
  'Resource allocation for story needs clarification',
]

const suggestions = [
  'Add detailed technical specifications for story deliverables',
  'Review and adjust story timeline with 20% buffer',
  'Create resource allocation matrix for story',
]

async function testLLMEnhancement() {
  console.log('🧪 Testing LLM Enhancement Generation\n')
  console.log('📝 Input:', testInput.slice(0, 100) + '...\n')
  console.log('❌ Issues:', issues.length)
  console.log('💡 Suggestions:', suggestions.length)
  console.log('\n' + '='.repeat(80) + '\n')

  try {
    // Initialize LLM client
    console.log('🔧 Initializing LLM client...')
    const llm = getLLMClient()
    console.log('✅ LLM client initialized\n')

    // Create prompt
    const prompt = `You are an expert movie production assistant creating CONCRETE DELIVERABLES to resolve evaluation issues.

PROJECT: Aladdin and the 40 Thieves
Genre: Fantasy Adventure | Type: Feature Film
Themes: Power, Responsibility, Love, Redemption

EXISTING CONTENT:
${testInput}

ISSUES TO RESOLVE:
${issues.map((issue, i) => `${i + 1}. ${issue}`).join('\n')}

SUGGESTIONS TO IMPLEMENT:
${suggestions.map((suggestion, i) => `${i + 1}. ${suggestion}`).join('\n')}

YOUR MISSION: Create ACTUAL DELIVERABLES that directly resolve each issue/suggestion.

DO NOT write about what should be done. CREATE THE ACTUAL CONTENT.

CRITICAL RULES:
1. CREATE THE ACTUAL DOCUMENT/DELIVERABLE - not a description of it
2. Include SPECIFIC numbers, names, timelines, and details
3. Use tables, lists, and structured formats
4. Make it copy-paste ready for production use
5. Each deliverable should be 300-500 words minimum
6. Reference the specific project context (Aladdin, Fantasy Adventure)

Return ONLY valid JSON (no markdown, no extra text):
[
  {
    "type": "issue-resolution",
    "originalIssue": "exact issue text",
    "content": "THE ACTUAL DELIVERABLE CONTENT HERE (300-500 words)"
  }
]`

    console.log('📤 Sending request to LLM...')
    console.log('   Prompt length:', prompt.length, 'characters\n')

    // Call LLM
    const response = await llm.chat(
      [
        {
          role: 'system',
          content: 'You are an expert movie production assistant. Generate detailed, production-ready content.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      {
        maxTokens: 4000,
        temperature: 0.7,
      },
    )

    console.log('✅ LLM response received!')
    console.log('   Response length:', response.content.length, 'characters')
    console.log('   Model used:', response.model)
    console.log('   Tokens used:', response.usage.totalTokens)
    console.log('\n' + '='.repeat(80) + '\n')

    // Parse response
    console.log('🔍 Parsing JSON response...')
    const content = response.content.trim()
    console.log('   Preview:', content.slice(0, 200) + '...\n')

    const jsonMatch = content.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      console.error('❌ Failed to find JSON array in response')
      console.log('Full response:', content)
      process.exit(1)
    }

    const improvements = JSON.parse(jsonMatch[0])
    console.log('✅ Successfully parsed', improvements.length, 'improvements\n')
    console.log('='.repeat(80) + '\n')

    // Display results
    improvements.forEach((improvement, index) => {
      console.log(`📦 Improvement ${index + 1}:`)
      console.log(`   Type: ${improvement.type}`)
      console.log(`   Original Issue: ${improvement.originalIssue}`)
      console.log(`   Content Length: ${improvement.content.length} characters`)
      console.log(`\n   Content Preview:`)
      console.log('   ' + '-'.repeat(76))
      console.log('   ' + improvement.content.slice(0, 300).replace(/\n/g, '\n   '))
      console.log('   ' + '-'.repeat(76))
      console.log()
    })

    console.log('='.repeat(80))
    console.log('✅ TEST PASSED - LLM generated detailed content successfully!')
    console.log('='.repeat(80))

  } catch (error) {
    console.error('\n❌ TEST FAILED\n')
    console.error('Error:', error.message)
    if (error.stack) {
      console.error('\nStack trace:')
      console.error(error.stack)
    }
    process.exit(1)
  }
}

testLLMEnhancement()

