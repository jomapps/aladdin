# Aladdin Database Seeding System

This directory contains the database seeding system for the Aladdin AI Movie Production platform using **PayloadCMS 3.0 patterns**.

Complete seed data for departments, agents, and custom tools needed for the hierarchical AI agent workflow.

## 📦 What Gets Seeded

### 1. Departments (6 total)
Complete movie production departments with configuration:

- **Story Department** (Priority 1)
  - Icon: 📖 | Color: #8B5CF6
  - Narrative structure, plot, themes, story arcs
  - Quality threshold: 85%

- **Character Department** (Priority 2)
  - Icon: 👤 | Color: #EC4899
  - Character profiles, development arcs, relationships
  - Quality threshold: 85%

- **Visual Department** (Priority 3)
  - Icon: 🎨 | Color: #F59E0B
  - Art direction, cinematography, color, composition
  - Quality threshold: 80%

- **Video Department** (Priority 4)
  - Icon: 🎬 | Color: #10B981
  - Editing, VFX, transitions, post-production
  - Quality threshold: 80%

- **Audio Department** (Priority 5)
  - Icon: 🎵 | Color: #3B82F6
  - Sound design, music, dialogue mixing, foley
  - Quality threshold: 80%

- **Production Department** (Priority 6)
  - Icon: 📋 | Color: #6366F1
  - Scheduling, budget, resource management, coordination
  - Quality threshold: 75%

### 2. Agents (35 total)

#### Department Heads (6)
One per department, coordinates specialists:
- Story Department Head
- Character Department Head
- Visual Department Head
- Video Department Head
- Audio Department Head
- Production Department Head

**Key Features:**
- `isDepartmentHead: true`
- `requiresReview: false`
- High-quality prompts from dynamic-agents.md and AI_AGENT_INTEGRATION.md
- Realistic performance metrics (88-93% success rate)
- Claude 3.5 Sonnet model (except Production uses Claude 3 Haiku)

#### Specialists (29 total)

**Story Department (4 specialists):**
- Plot Structure Specialist
- Dialogue Specialist
- Theme Specialist
- Pacing Specialist

**Character Department (9 specialists):**
- Character Creator (core personality, backstory, arc foundation)
- Character Profile Builder (physical traits, background)
- Character Arc Developer (character growth, transformation)
- Relationship Designer (dynamics, conflicts)
- Psychology Analyst (motivations, fears)
- Hair Stylist (hairstyle design)
- Costume Designer (wardrobe, clothing)
- Makeup Artist (makeup, special effects)
- Voice Profile Creator (voice characteristics)

**Visual Department (4 specialists):**
- Art Direction Specialist
- Cinematography Specialist
- Color Theory Specialist
- Composition Specialist

**Video Department (4 specialists):**
- Editing Specialist
- VFX Specialist
- Transitions Specialist
- Post-Production Specialist

**Audio Department (4 specialists):**
- Sound Design Specialist
- Music Composition Specialist
- Dialogue Mixing Specialist
- Foley Specialist

**Production Department (4 specialists):**
- Scheduling Specialist
- Budget Specialist
- Resource Management Specialist
- Coordination Specialist

**Key Features:**
- `isDepartmentHead: false`
- `requiresReview: true`
- Specialized expertise and skills
- Model selection: Claude 3.5 Sonnet (creative) or Claude 3 Haiku (operational)
- Realistic metrics (86-94% success rates)

### 3. Custom Tools (10 total)

#### Character Tools (3)
- **Fetch Character Profile**: Retrieve complete character data
- **Check Character Consistency**: Validate character actions/dialogue
- **Map Character Relationships**: Generate relationship maps

#### Story Tools (5)
- **Validate Plot Structure**: Check story framework compliance
- **Analyze Dialogue Authenticity**: Natural speech pattern analysis
- **Calculate Scene Pacing**: Optimize scene rhythm and flow
- **Track Theme Consistency**: Monitor thematic elements
- **Assess Content Quality**: Comprehensive quality evaluation (global)

#### Visual Tools (1)
- **Generate Visual Style Guide**: Create color palettes and aesthetic direction

#### Quality Tools (1)
- **Assess Content Quality**: Multi-dimensional quality assessment (global)

**Key Features:**
- Complete input/output schemas (Zod JSON)
- TypeScript implementation code
- Example inputs and test cases
- Performance metrics
- Department-specific or global availability
- Comprehensive documentation

## 🚀 Usage

### Using PayloadCMS Pattern (Recommended)

```bash
# Run the seed script using Payload's built-in runner
payload run src/seed/index.ts

# Or use the npm script alias
npm run db:seed

# Or use pnpm
pnpm run db:seed
```

### Using the legacy seed command

```bash
npm run seed

# Or using tsx directly
tsx src/seed/index.ts

# Or using node with loader
node --loader tsx src/seed/index.ts
```

### Seed Process

The seed script executes in order:

1. **Initialize PayloadCMS** - Connect to database
2. **Seed Departments** - Create 6 departments
3. **Seed Agents** - Create 30 agents (linked to departments)
4. **Seed Custom Tools** - Create 10 tools (linked to departments)

Each step checks for existing data and skips duplicates.

### Output Example

```
🌱 Starting Aladdin seed process...
============================================================
📦 Initializing PayloadCMS...
✅ PayloadCMS initialized

🏢 Seeding departments...
  ✅ Created department: Story Department
  ✅ Created department: Character Department
  ✅ Created department: Visual Department
  ✅ Created department: Video Department
  ✅ Created department: Audio Department
  ✅ Created department: Production Department
✅ Departments seeded successfully

🤖 Seeding agents...
  ✅ Created agent: Story Department Head
  ✅ Created agent: Plot Structure Specialist
  ... (35 total: 6 heads + 29 specialists)
✅ Agents seeded successfully

🛠️  Seeding custom tools...
  ✅ Created tool: Fetch Character Profile
  ✅ Created tool: Check Character Consistency
  ... (10 total)
✅ Custom tools seeded successfully

============================================================
🎉 Seed process completed successfully!

📊 Seed Summary:
  - Departments: 6
  - Agents: 35 (6 heads + 29 specialists)
  - Custom Tools: 10

✨ Your Aladdin AI system is ready to use!
```

## 📂 File Structure

```
src/seed/
├── index.ts                  # Master seed script
├── departments.seed.ts       # Department seed data
├── agents.seed.ts            # Agent seed data (with prompts)
├── custom-tools.seed.ts      # Custom tools seed data
└── README.md                 # This file
```

## 🔧 Configuration

### Model Selection

Agents use different models based on complexity:

- **Claude 3.5 Sonnet**: Creative/complex tasks (story, character, visual, video, audio)
- **Claude 3 Haiku**: Operational/simple tasks (production, post-production)

### Quality Thresholds

Each department has minimum quality scores:

- Story/Character: 85%
- Visual/Video/Audio: 80%
- Production: 75%

### Performance Metrics

Realistic metrics included for all agents:
- Success rate: 86-94%
- Average execution time: 26-45 seconds
- Total executions: 125-250
- Token usage: 1.2M-2.5M

## 🎯 Key Features

### High-Quality Prompts

All agents use professional prompts from `docs/idea/dynamic-agents.md`:
- Clear role definition
- Expertise areas
- Quality standards
- Task approach
- Output requirements

### Department Coordination

- Department heads coordinate specialists
- Parallel execution supported
- Quality review workflow
- Retry mechanisms

### Custom Tools

All tools include:
- Zod input schemas
- TypeScript implementation
- Example usage
- Test cases
- Performance tracking
- Documentation

## 🔍 Verification

After seeding, verify in PayloadCMS admin:

1. Navigate to `/admin/collections/departments` - Should see 6 departments
2. Navigate to `/admin/collections/agents` - Should see 30 agents
3. Navigate to `/admin/collections/custom-tools` - Should see 10 tools

Check that:
- Each department has exactly 1 department head
- Department heads have `requiresReview: false`
- Specialists have `requiresReview: true`
- Tools are linked to correct departments

## 🛠️ Troubleshooting

### Duplicate Key Errors

If you see duplicate key errors, data already exists. The seed script skips existing entries automatically.

### Department Not Found

If agents fail with "Department not found", ensure departments seed completed successfully first.

### Missing Dependencies

Ensure all required packages are installed:
```bash
npm install
# or
pnpm install
```

### Database Connection Issues

Check your `.env` file has correct database credentials:
```
DATABASE_URI=mongodb://localhost:27017/aladdin
```

## 📚 Related Documentation

- **Architecture**: `/docs/idea/dynamic-agents.md`
- **Collections**: `/src/collections/`
- **Agent Runner**: `/src/lib/agents/`
- **Coordination**: `/src/lib/agents/coordination/`

## 🎬 Next Steps

After seeding:

1. Start the development server: `npm run dev`
2. Access PayloadCMS admin: `http://localhost:3000/admin`
3. Test agent execution with orchestrator
4. Create your first project/episode
5. Watch the AI agents coordinate to produce content!

## 📝 Notes

- All data is idempotent - safe to run multiple times
- Existing data is never overwritten
- Performance metrics are realistic estimates
- Prompts are production-ready from documentation
- Custom tools provide working implementations

## 🔄 PayloadCMS 3.0 Migration Notes

This seed system has been migrated from PayloadCMS 2.x to 3.0 patterns:

### Key Changes:
1. **Import Pattern**: Changed from `payload.config` to `@payload-config`
2. **Initialization**: Changed from `await payload.init()` to `await getPayload({ config })`
3. **Execution**: Uses `payload run <script>` instead of `tsx <script>`
4. **TypeScript**: All seed files use `.ts` extension
5. **Module System**: Uses ES modules (`import`/`export`) instead of CommonJS

### Before (PayloadCMS 2.x):
```typescript
import payload from 'payload'
import config from './payload.config'

await payload.init({ config })
```

### After (PayloadCMS 3.0):
```typescript
import { getPayload } from 'payload'
import config from '@payload-config'

const payload = await getPayload({ config })
```

## 📖 References

- [PayloadCMS External Scripts Documentation](https://payloadcms.com/docs/configuration/external-scripts)
- [PayloadCMS Collections API](https://payloadcms.com/docs/local-api/collections)
- [Aladdin AI Agent System Documentation](../../docs/AI_AGENT_INTEGRATION.md)

---

**Generated for**: Aladdin AI Movie Production Platform
**Version**: 1.0.0
**Date**: October 2025
