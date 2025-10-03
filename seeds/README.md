# Seeds Directory

This directory contains JSON seed data for database seeding.

## 📁 Structure

Each file corresponds to a PayloadCMS collection:

```
seeds/
├── README.md              # This file
├── departments.json       # Department data
├── agents.json           # Agent data
├── custom-tools.json     # Custom tools
├── users.json            # User accounts
├── projects.json         # Project data
├── episodes.json         # Episode data
└── ...                   # Other collections
```

## 🌱 Usage

```bash
# Seed all collections
pnpm db:seed

# Seed specific collection
pnpm db:seed --collection departments

# Clean before seeding
pnpm db:seed --clean
```

## 📝 File Format

Each seed file should be a JSON array of objects:

```json
[
  {
    "field1": "value1",
    "field2": "value2"
  },
  {
    "field1": "value3",
    "field2": "value4"
  }
]
```

## 🔑 Unique Fields

The seed script checks these fields to avoid duplicates:

- **users**: `email`
- **departments**: `slug`
- **agents**: `agentId`
- **custom-tools**: `toolName`
- **projects**: `slug`
- **episodes**: `slug`

## 📋 Collection Order

Collections are seeded in dependency order:

1. users
2. departments
3. agents
4. custom-tools
5. projects
6. episodes
7. conversations
8. workflows
9. activity-logs
10. export-jobs
11. media

## 💡 Tips

1. **Use the main seed script** for initial agent setup:
   ```bash
   pnpm seed  # Uses src/seed/index.ts
   ```

2. **Use db:seed** for custom data:
   ```bash
   pnpm db:seed  # Uses seeds/*.json files
   ```

3. **Export existing data** to create seed files:
   ```bash
   pnpm db:backup
   # Copy JSON files from backups/ to seeds/
   ```

4. **Combine both approaches**:
   ```bash
   pnpm seed           # Seed agents and departments
   pnpm db:seed        # Seed custom data
   ```

## 🚫 Gitignored

This directory is gitignored to avoid committing sensitive data.
Add your own seed files as needed for development.

## 📖 Available Seed Files

### 👤 users.json

Contains 3 default development users:

- **admin@aladdin.dev** (password: `admin123`) - Admin user
- **creator@aladdin.dev** (password: `creator123`) - Content creator
- **demo@aladdin.dev** (password: `demo123`) - Demo/testing user

**Note**: Passwords are plain text in seed files and automatically hashed by PayloadCMS.

### 🎬 projects.json

Contains 4 sample projects with different types and statuses:

1. **Cyberpunk Detective** (Movie) - Sci-fi thriller, 78% quality
2. **The Last Garden** (Movie) - Environmental drama, 72% quality
3. **Midnight Diner Chronicles** (Series) - Character drama, 85% quality, 10 episodes
4. **Demo Project** (Movie) - Testing project, public

Each project includes:
- Complete metadata (logline, synopsis, genres, themes)
- Quality scores and progress tracking
- Owner relationships (linked to users)
- Settings and configurations
- Auto-generated `openDatabaseName` for project-specific collections

### 🔗 Relationships

Projects reference users via the `owner` field:
- Projects must be seeded **after** users
- Owner field uses user email as reference
- Seed script handles dependency order automatically

## 💡 Development Workflow

When dropping the database during development:

```bash
# Option 1: Clean and seed in one go
pnpm db:clean && pnpm db:seed

# Option 2: Step by step
pnpm db:clean    # Remove all data
pnpm db:seed     # Load fresh seed data
```

This ensures you always have:
- ✅ Test users to log in with
- ✅ Sample projects to work with
- ✅ Proper relationships between collections

## 📖 More Examples

See the main seed script for comprehensive examples:
- `src/seed/departments.seed.ts`
- `src/seed/agents.seed.ts`
- `src/seed/custom-tools.seed.ts`

