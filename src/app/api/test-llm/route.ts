/**
 * Test LLM Enhancement API
 * GET /api/test-llm - Tests if LLM can generate detailed content
 */

import { NextResponse } from 'next/server'
import { getLLMClient } from '@/lib/llm/client'

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

export async function GET() {
  const startTime = Date.now()
  const log: string[] = []

  try {
    log.push('🧪 Testing LLM Enhancement Generation')
    log.push('')
    log.push(`📝 Input: ${testInput.slice(0, 100)}...`)
    log.push(`❌ Issues: ${issues.length}`)
    log.push(`💡 Suggestions: ${suggestions.length}`)
    log.push('')
    log.push('='.repeat(80))
    log.push('')

    // Initialize LLM client
    log.push('🔧 Initializing LLM client...')
    const llm = getLLMClient()
    log.push('✅ LLM client initialized')
    log.push('')

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

    log.push('📤 Sending request to LLM...')
    log.push(`   Prompt length: ${prompt.length} characters`)
    log.push('')

    // Call LLM
    const response = await llm.chat(
      [
        {
          role: 'system',
          content:
            'You are an expert movie production assistant. Generate detailed, production-ready content.',
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

    const duration = Date.now() - startTime
    log.push('✅ LLM response received!')
    log.push(`   Response length: ${response.content.length} characters`)
    log.push(`   Model used: ${response.model}`)
    log.push(`   Tokens used: ${response.usage.totalTokens}`)
    log.push(`   Duration: ${duration}ms`)
    log.push('')
    log.push('='.repeat(80))
    log.push('')

    // Parse response
    log.push('🔍 Parsing JSON response...')
    const content = response.content.trim()
    log.push(`   Preview: ${content.slice(0, 200)}...`)
    log.push('')

    const jsonMatch = content.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      log.push('❌ Failed to find JSON array in response')
      log.push('Full response:')
      log.push(content)
      return NextResponse.json({
        success: false,
        error: 'Failed to parse JSON',
        log: log.join('\n'),
        fullResponse: content,
      })
    }

    const improvements = JSON.parse(jsonMatch[0])
    log.push(`✅ Successfully parsed ${improvements.length} improvements`)
    log.push('')
    log.push('='.repeat(80))
    log.push('')

    // Display results
    const results: any[] = []
    improvements.forEach((improvement: any, index: number) => {
      log.push(`📦 Improvement ${index + 1}:`)
      log.push(`   Type: ${improvement.type}`)
      log.push(`   Original Issue: ${improvement.originalIssue}`)
      log.push(`   Content Length: ${improvement.content.length} characters`)
      log.push('')
      log.push('   Content Preview:')
      log.push('   ' + '-'.repeat(76))
      log.push('   ' + improvement.content.slice(0, 300).replace(/\n/g, '\n   '))
      log.push('   ' + '-'.repeat(76))
      log.push('')

      results.push({
        type: improvement.type,
        originalIssue: improvement.originalIssue,
        contentLength: improvement.content.length,
        contentPreview: improvement.content.slice(0, 300),
        fullContent: improvement.content,
      })
    })

    log.push('='.repeat(80))
    log.push('✅ TEST PASSED - LLM generated detailed content successfully!')
    log.push('='.repeat(80))

    return NextResponse.json({
      success: true,
      duration,
      model: response.model,
      tokensUsed: response.usage.totalTokens,
      improvementsCount: improvements.length,
      results,
      log: log.join('\n'),
    })
  } catch (error) {
    log.push('')
    log.push('❌ TEST FAILED')
    log.push('')
    log.push(`Error: ${error instanceof Error ? error.message : String(error)}`)
    if (error instanceof Error && error.stack) {
      log.push('')
      log.push('Stack trace:')
      log.push(error.stack)
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        log: log.join('\n'),
      },
      { status: 500 },
    )
  }
}

