console.log('1. Script starting...')

import 'dotenv/config'
console.log('2. dotenv loaded')

import { getPayload } from 'payload'
console.log('3. getPayload imported')

console.log('4. About to import config...')
import config from '@payload-config'
console.log('5. config imported:', typeof config)

console.log('✅ All imports successful!')

