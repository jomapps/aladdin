# Database Management Guide

Complete guide to managing Aladdin's databases using the built-in management scripts.

**Version**: 1.0.0  
**Last Updated**: 2025-01-28

---

## 📊 Database Architecture

Aladdin uses two MongoDB database systems:

### 1. PayloadCMS Database (Protected)
- **Purpose**: Core application data
- **Collections**: users, projects, episodes, agents, departments, etc.
- **Connection**: `DATABASE_URI` environment variable
- **Access**: Managed by PayloadCMS

### 2. Open MongoDB (Per-Project)
- **Purpose**: Flexible per-project content storage
- **Databases**: `open_{projectSlug}` (one per project)
- **Collections**: characters, scenes, locations, etc. (project-specific)
- **Connection**: `DATABASE_URI_OPEN` environment variable
- **Access**: Direct MongoDB access

---

## 🛠️ Management Scripts

### Overview

| Script | Purpose | Destructive | Requires Confirmation |
|--------|---------|-------------|----------------------|
| `db:clean` | Remove all data | ✅ Yes | ✅ Yes |
| `db:seed` | Load data from JSON | ❌ No | ❌ No |
| `db:backup` | Create backup | ❌ No | ❌ No |
| `db:restore` | Restore from backup | ✅ Yes | ✅ Yes |

---

## 🧹 Clean Database

**Command**: `pnpm db:clean`

Removes all data from both databases while preserving structure.

### Usage

```bash
# Interactive mode (asks for confirmation)
pnpm db:clean

# Skip confirmation (use in scripts)
pnpm db:clean --confirm
```

### What Gets Cleaned

**PayloadCMS Collections:**
- users
- media
- projects
- episodes
- conversations
- workflows
- activity-logs
- export-jobs
- departments
- agents
- custom-tools
- agent-executions

**Open MongoDB:**
- All databases starting with `open_*`

### Example Output

```
🗑️  Database Clean Script
============================================================

⚠️  WARNING: This will DELETE ALL DATA from both databases!
   - PayloadCMS database (protected)
   - All Open MongoDB project databases

Are you sure you want to continue? (yes/no): yes

📦 Connecting to PayloadCMS database...
✅ Connected to PayloadCMS database

🧹 Cleaning PayloadCMS database...
  ✅ Cleaned: users
  ✅ Cleaned: departments
  ✅ Cleaned: agents
  ...

✅ PayloadCMS database cleaned (12 collections)

🧹 Cleaning Open MongoDB databases...
  ✅ Dropped: open_project1
  ✅ Dropped: open_project2

✅ Open databases cleaned (2 databases dropped)

============================================================
🎉 Database cleaning completed successfully!

ℹ️  You can now run: pnpm db:seed
```

---

## 🌱 Seed Database

**Command**: `pnpm db:seed`

Loads data from JSON files in the `seeds/` directory.

### Usage

```bash
# Seed all collections
pnpm db:seed

# Seed specific collection
pnpm db:seed --collection departments

# Clean before seeding
pnpm db:seed --clean
```

### Seed File Structure

Create JSON files in the `seeds/` directory:

```
seeds/
├── departments.json
├── agents.json
├── custom-tools.json
├── users.json
└── projects.json
```

### Example Seed File

**seeds/departments.json:**
```json
[
  {
    "slug": "story",
    "name": "Story Department",
    "description": "Narrative development and plot structure",
    "icon": "📖",
    "color": "#8B5CF6",
    "priority": 1,
    "isActive": true,
    "defaultModel": "anthropic/claude-sonnet-4.5",
    "maxAgentSteps": 25
  },
  {
    "slug": "character",
    "name": "Character Department",
    "description": "Character creation and development",
    "icon": "👤",
    "color": "#EC4899",
    "priority": 2,
    "isActive": true,
    "defaultModel": "anthropic/claude-sonnet-4.5",
    "maxAgentSteps": 25
  }
]
```

### Seeding Order

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

### Duplicate Handling

The seed script checks unique fields to avoid duplicates:

- **users**: `email`
- **departments**: `slug`
- **agents**: `agentId`
- **custom-tools**: `toolName`
- **projects**: `slug`
- **episodes**: `slug`

Existing items are skipped automatically.

---

## 💾 Backup Database

**Command**: `pnpm db:backup`

Creates a timestamped backup of all databases.

### Usage

```bash
# Auto-generated backup name
pnpm db:backup

# Custom backup name
pnpm db:backup --name pre-migration
```

### Backup Structure

```
backups/
└── backup-2025-01-28T10-30-00/
    ├── metadata.json           # Backup info
    ├── payload/               # PayloadCMS collections
    │   ├── users.json
    │   ├── departments.json
    │   ├── agents.json
    │   └── projects.json
    └── open/                  # Open MongoDB databases
        ├── open_project1/
        │   ├── characters.json
        │   └── scenes.json
        └── open_project2/
            └── episodes.json
```

### Backup Naming

- **Auto**: `backup-YYYY-MM-DDTHH-MM-SS`
- **Custom**: `{name}-YYYY-MM-DDTHH-MM-SS`

### Example Output

```
💾 Database Backup Script
============================================================

📁 Creating backup directory: backup-2025-01-28T10-30-00

📦 Connecting to PayloadCMS database...
✅ Connected to PayloadCMS database

💾 Backing up PayloadCMS collections...
  ✅ Backed up: users (5 documents)
  ✅ Backed up: departments (6 documents)
  ✅ Backed up: agents (35 documents)
  ...

✅ PayloadCMS backup completed (12 collections)

💾 Backing up Open MongoDB databases...
  ✅ Backed up: open_project1/characters (10 documents)
  ✅ Backed up: open_project1/scenes (25 documents)

✅ Open databases backup completed (2 databases)

📝 Backup metadata created

============================================================
🎉 Backup completed successfully!

📁 Backup location: /path/to/backups/backup-2025-01-28T10-30-00

ℹ️  To restore: pnpm db:restore --backup backup-2025-01-28T10-30-00
```

---

## 📥 Restore Database

**Command**: `pnpm db:restore`

Restores data from a backup.

### Usage

```bash
# Restore latest backup (interactive)
pnpm db:restore

# Restore specific backup
pnpm db:restore --backup backup-2025-01-28T10-30-00

# Skip confirmation
pnpm db:restore --confirm
```

### Restore Process

1. Lists available backups (if none specified)
2. Shows backup metadata
3. Asks for confirmation
4. Replaces ALL current data with backup data

### Example Output

```
📥 Database Restore Script
============================================================

📁 Restoring from: backup-2025-01-28T10-30-00
   Created: 2025-01-28T10:30:00.000Z

⚠️  WARNING: This will REPLACE ALL DATA with backup: backup-2025-01-28T10-30-00

Are you sure you want to continue? (yes/no): yes

📦 Connecting to PayloadCMS database...
✅ Connected to PayloadCMS database

📥 Restoring PayloadCMS collections...
  ✅ Restored: users (5 documents)
  ✅ Restored: departments (6 documents)
  ✅ Restored: agents (35 documents)
  ...

✅ PayloadCMS restore completed (12 collections)

📥 Restoring Open MongoDB databases...
  ✅ Restored: open_project1/characters (10 documents)
  ✅ Restored: open_project1/scenes (25 documents)

✅ Open databases restore completed (2 databases)

============================================================
🎉 Restore completed successfully!
```

---

## 🔄 Common Workflows

### Fresh Development Setup

```bash
# 1. Clean everything
pnpm db:clean --confirm

# 2. Seed initial data (agents, departments)
pnpm seed

# 3. Seed custom data (optional)
pnpm db:seed
```

### Before Major Changes

```bash
# 1. Create backup
pnpm db:backup --name before-migration

# 2. Make your changes...

# 3. If something goes wrong, restore
pnpm db:restore --backup before-migration-2025-01-28T10-30-00
```

### Export Data for Seeding

```bash
# 1. Create backup
pnpm db:backup --name export

# 2. Copy JSON files from backups/ to seeds/
cp backups/export-*/payload/*.json seeds/

# 3. Now you can seed from these files
pnpm db:seed
```

### Reset to Clean State

```bash
# One-liner: clean and reseed
pnpm db:clean --confirm && pnpm seed
```

---

## ⚙️ Configuration

### Environment Variables

```bash
# .env

# PayloadCMS Database (protected)
DATABASE_URI=mongodb://localhost:27017/aladdin

# Open MongoDB (per-project databases)
DATABASE_URI_OPEN=mongodb://localhost:27017
```

If `DATABASE_URI_OPEN` is not set, it defaults to `DATABASE_URI`.

---

## 🛡️ Safety Features

### Confirmation Prompts
- `db:clean` requires confirmation
- `db:restore` requires confirmation
- Use `--confirm` flag to skip in scripts

### Duplicate Prevention
- `db:seed` checks unique fields
- Skips existing items automatically

### Error Handling
- Graceful error messages
- Continues on non-critical errors
- Closes connections properly

### Backup Safety
- Timestamped backups (no overwrites)
- Includes metadata
- Validates backup exists before restore

---

## 📝 Best Practices

1. **Backup before major changes**
   ```bash
   pnpm db:backup --name before-{feature}
   ```

2. **Use seeds for repeatable data**
   - Create seed files for common test data
   - Version control seed files (if not sensitive)

3. **Test on development first**
   - Never run `db:clean` on production
   - Test restore process before needed

4. **Regular backups**
   - Backup before deployments
   - Backup before database migrations

5. **Document custom seeds**
   - Add README to seeds/ directory
   - Explain seed file purpose

---

## 🐛 Troubleshooting

### "No backups found"
**Solution**: Create a backup first
```bash
pnpm db:backup
```

### "Connection failed"
**Solution**: Check MongoDB connection
```bash
# Verify MongoDB is running
mongosh $DATABASE_URI

# Check .env file
cat .env | grep DATABASE_URI
```

### "Collection doesn't exist"
**Solution**: Normal for new databases
- Seed script skips non-existent collections
- Collections are created on first insert

### "Permission denied"
**Solution**: Check MongoDB permissions
```bash
# Ensure user has proper roles
db.grantRolesToUser("username", ["readWrite", "dbAdmin"])
```

---

## 🔗 Related Documentation

- [Seed Data README](../src/seed/README.md) - Main seed script
- [Database Scripts README](../scripts/db/README.md) - Script details
- [Seeds README](../seeds/README.md) - Seed file format
- [Open Database](../src/lib/db/openDatabase.ts) - Per-project databases

---

## 📚 Additional Resources

- [MongoDB Documentation](https://docs.mongodb.com/)
- [PayloadCMS Documentation](https://payloadcms.com/docs)
- [Aladdin Architecture](./ARCHITECTURE.md)

