#!/usr/bin/env node
/**
 * Script to replace all getPayloadHMR with getPayload
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const files = [
  'src/app/api/orchestrator/chat/route.ts',
  'src/app/api/orchestrator/data/confirm/route.ts',
  'src/app/api/orchestrator/data/route.ts',
  'src/app/api/orchestrator/history/route.ts',
  'src/app/api/orchestrator/query/route.ts',
  'src/app/api/orchestrator/stream/route.ts',
  'src/app/api/orchestrator/task/route.ts',
  'src/app/api/v1/agents/run/route.ts',
  'src/app/api/v1/chat/conversation/route.ts',
  'src/app/api/v1/chat/[conversationId]/route.ts',
  'src/app/api/v1/chat/[conversationId]/stream/route.ts',
  'src/lib/monitoring/healthCheck.ts',
]

files.forEach((filePath) => {
  const fullPath = path.join(process.cwd(), filePath)

  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${filePath}`)
    return
  }

  let content = fs.readFileSync(fullPath, 'utf8')
  const originalContent = content

  // Replace getPayloadHMR({ config: configPromise }) with getPayload({ config: await configPromise })
  content = content.replace(
    /await getPayloadHMR\(\{ config: configPromise \}\)/g,
    'await getPayload({ config: await configPromise })',
  )

  if (content !== originalContent) {
    fs.writeFileSync(fullPath, content, 'utf8')
    console.log(`✅ Fixed: ${filePath}`)
  } else {
    console.log(`ℹ️  No changes needed: ${filePath}`)
  }
})

console.log('\n✨ Done!')
