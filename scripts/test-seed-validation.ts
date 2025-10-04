/**
 * Test seed validation - simulates the agent creation
 */

// Test utility agent data
const chatAssistant = {
  agentId: 'chat-assistant',
  name: 'Chat Assistant',
  department: 'production',
  isDepartmentHead: false,
  requiresReview: true,
  isActive: true,
}

console.log('Testing validation logic...\n')

// Simulate validation from Agents.ts line 56
if (chatAssistant.isDepartmentHead === false && chatAssistant.requiresReview === false) {
  console.log('❌ FAIL: Specialist agents must have requiresReview set to true')
} else {
  console.log('✅ PASS: Validation should succeed')
}

console.log('\nAgent data:')
console.log(JSON.stringify(chatAssistant, null, 2))
