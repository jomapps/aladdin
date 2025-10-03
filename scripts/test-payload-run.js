console.log('✅ Test script executed successfully!')
console.log('Environment variables:')
console.log('  DATABASE_URI:', process.env.DATABASE_URI || 'NOT SET')
console.log('  PAYLOAD_SECRET:', process.env.PAYLOAD_SECRET ? 'SET' : 'NOT SET')

