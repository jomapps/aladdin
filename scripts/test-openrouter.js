#!/usr/bin/env node
/**
 * Test OpenRouter API Key
 * Simple script to verify OpenRouter credentials work
 */

import 'dotenv/config'
import axios from 'axios'

async function testOpenRouter() {
  const apiKey = process.env.OPENROUTER_API_KEY
  const baseUrl = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1'
  const defaultModel = process.env.OPENROUTER_DEFAULT_MODEL || 'anthropic/claude-sonnet-4.5'
  const backupModel = process.env.OPENROUTER_BACKUP_MODEL || 'qwen/qwen3-vl-235b-a22b-thinking'
  const referer = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  console.log('🔍 Testing OpenRouter Configuration\n')
  console.log('Base URL:', baseUrl)
  console.log('Referer:', referer)
  console.log('API Key:', apiKey ? `${apiKey.substring(0, 15)}...` : '❌ MISSING')
  console.log('Default Model:', defaultModel)
  console.log('Backup Model:', backupModel)
  console.log('\n' + '='.repeat(60) + '\n')

  if (!apiKey) {
    console.error('❌ OPENROUTER_API_KEY is not set in .env')
    process.exit(1)
  }

  const client = axios.create({
    baseURL: baseUrl,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': referer,
      'X-Title': 'Aladdin Movie Production',
    },
  })

  // Test default model
  console.log(`🧪 Testing default model: ${defaultModel}`)
  try {
    const response = await client.post('/chat/completions', {
      model: defaultModel,
      messages: [{ role: 'user', content: 'Ping' }],
      max_tokens: 10,
    })

    console.log('✅ Default model works!')
    console.log('   Response:', response.data.choices[0].message.content)
    console.log('   Model:', response.data.model)
    console.log('   Tokens:', response.data.usage.total_tokens)
  } catch (error) {
    console.error('❌ Default model failed!')
    console.error('   Status:', error.response?.status)
    console.error('   Error:', error.response?.data || error.message)
  }

  console.log('\n' + '-'.repeat(60) + '\n')

  // Test backup model
  console.log(`🧪 Testing backup model: ${backupModel}`)
  try {
    const response = await client.post('/chat/completions', {
      model: backupModel,
      messages: [{ role: 'user', content: 'Ping' }],
      max_tokens: 10,
    })

    console.log('✅ Backup model works!')
    console.log('   Response:', response.data.choices[0].message.content)
    console.log('   Model:', response.data.model)
    console.log('   Tokens:', response.data.usage.total_tokens)
  } catch (error) {
    console.error('❌ Backup model failed!')
    console.error('   Status:', error.response?.status)
    console.error('   Error:', error.response?.data || error.message)
  }

  console.log('\n' + '='.repeat(60) + '\n')
  console.log('✅ Test complete')
}

testOpenRouter().catch((error) => {
  console.error('💥 Unexpected error:', error.message)
  process.exit(1)
})
