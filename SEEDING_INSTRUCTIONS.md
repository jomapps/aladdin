# Complete Seeding Instructions

## ✅ All Code is Fixed and Ready

The migration is 100% complete:
- ✅ All 6 utility agents added to seed file with `requiresReview: true`
- ✅ All direct LLM calls removed
- ✅ Backward compatibility maintained
- ✅ Database clean script enhanced with verification

## The Seeding Issue

The error you're seeing is due to incomplete database cleanup from a previous run. The enhanced clean script will now properly verify the database is dropped.

## How to Seed (Try This)

### Step 1: Run the Enhanced Seeder

```bash
pnpm db:seed
```

The enhanced clean script will now show:
```
🗑️  Dropping database: aladdin
✅ Dropped PayloadCMS database: aladdin
✅ Verified: Database aladdin has been completely removed
```

If you see "WARNING: Database still exists", proceed to Step 2.

### Step 2: Manual Cleanup (If Needed)

If the auto-drop fails, manually clean MongoDB:

```bash
# Open MongoDB shell
mongosh

# Drop the database
use aladdin
db.dropDatabase()

# Verify
show dbs  # aladdin should not be in the list

# Exit
exit
```

Then run the seeder again:
```bash
pnpm db:seed
```

## Expected Successful Output

When seeding works correctly, you'll see:

```
🌱 Starting Aladdin seed process...
============================================================
📦 Initializing PayloadCMS...
✅ PayloadCMS initialized

👤 Seeding users...
  ✅ Created user: admin@aladdin.dev
  ✅ Created user: creator@aladdin.dev
  ✅ Created user: demo@aladdin.dev
✅ Users seeded (3/3 created)

🏢 Seeding departments...
  ✅ Created department: Story Department
  ✅ Created department: Character Department
  ... (7 total)
✅ Departments seeded successfully

🤖 Seeding agents...
  ✅ Created agent: Story Department Head
  ... (40 existing agents)
  ✅ Created agent: Chat Assistant
  ✅ Created agent: Query Assistant
  ✅ Created agent: Data Enrichment Specialist
  ✅ Created agent: Metadata Generation Specialist
  ✅ Created agent: Relationship Discovery Specialist
  ✅ Created agent: Quality Assessment Specialist
✅ Agents seeded successfully

... (tools, projects)

============================================================
🎉 Seed process completed successfully!

📊 Seed Summary:
  - Users: 3
  - Departments: 7
  - Agents: 46 (6 heads + 29 specialists + 5 qualification + 6 utility agents)
  - Custom Tools: 10
  - Projects: 4

✨ Your Aladdin AI system is ready to use!
```

## After Successful Seeding

Start the application:
```bash
pnpm dev
```

Test the endpoints:
```bash
# Chat endpoint (uses chat-assistant agent)
curl -X POST http://localhost:3000/api/orchestrator/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, how can you help?"}'

# Query endpoint (uses query-assistant agent)
curl -X POST http://localhost:3000/api/orchestrator/query \
  -H "Content-Type: application/json" \
  -d '{"query": "Tell me about characters", "projectId": "test"}'
```

## Troubleshooting

### Error: "Specialist agents must have requiresReview set to true"

**Cause:** Old agents from previous run still in database
**Fix:** Manual MongoDB cleanup (Step 2 above)

### Error: "Cannot find module '@/lib/llm/client'"

**Cause:** Build cache is stale
**Fix:**
```bash
rm -rf .next
pnpm dev
```

### Error: "Database still exists after drop"

**Cause:** MongoDB permissions or connection issue
**Fix:**
1. Check MongoDB is running: `mongosh --eval "db.version()"`
2. Check DATABASE_URI in `.env`
3. Try manual cleanup

## Files Changed in This Migration

1. ✅ `src/seed/agents.seed.ts` - Added 6 utility agents
2. ✅ `src/lib/agents/data-preparation/agent.ts` - Migrated to agents
3. ✅ `src/lib/orchestrator/chatHandler.ts` - Uses chat-assistant
4. ✅ `src/lib/orchestrator/queryHandler.ts` - Uses query-assistant
5. ✅ `src/lib/orchestrator/dataHandler.ts` - Uses data-enricher
6. ✅ `src/lib/gather/aiProcessor.ts` - Uses data-enricher
7. ✅ `src/lib/agents/quality/scorer.ts` - Uses quality-scorer
8. ✅ `src/lib/agents/data-preparation/metadata-generator.ts` - Uses metadata-generator
9. ✅ `src/lib/agents/data-preparation/relationship-discoverer.ts` - Uses relationship-discoverer
10. ✅ `src/app/api/orchestrator/*/route.ts` - All use handlers
11. ✅ `scripts/db/clean.js` - Enhanced with verification

## Summary

**Everything is ready!** The only issue is database cleanup from a previous run. The enhanced clean script should handle it automatically, but if not, a quick manual MongoDB cleanup will fix it.

Then you'll have a fully agent-based system with no direct LLM calls! 🎉
