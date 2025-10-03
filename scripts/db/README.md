# Database Management Scripts

Comprehensive database management tools for Aladdin's PayloadCMS and Open MongoDB databases.

## 📋 Available Scripts

### 1. `pnpm db:clean` - Clean All Databases

Removes all data from both PayloadCMS (protected) and Open MongoDB databases.

**Usage:**
```bash
# Interactive mode (asks for confirmation)
pnpm db:clean

# Skip confirmation prompt
pnpm db:clean --confirm
```

**What it does:**
- Clears all PayloadCMS collections (users, projects, agents, etc.)
- Drops all Open MongoDB project databases (open_*)
- Preserves database structure (only removes data)

**⚠️ Warning:** This is destructive! All data will be lost.

---

### 2. `pnpm db:seed` - Seed from JSON Files

Seeds data from JSON files in the `seeds/` directory.

**Usage:**
```bash
# Seed all collections
pnpm db:seed

# Seed specific collection
pnpm db:seed --collection departments

# Clean before seeding
pnpm db:seed --clean
```

**Seed File Structure:**
```
seeds/
├── departments.json      # Department data
├── agents.json          # Agent data
├── custom-tools.json    # Custom tools
├── users.json           # User accounts
└── projects.json        # Project data
```

**Example seed file (seeds/departments.json):**
```json
[
  {
    "slug": "story",
    "name": "Story Department",
    "description": "Narrative development and plot structure",
    "icon": "📖",
    "color": "#8B5CF6",
    "priority": 1,
    "isActive": true
  }
]
```

**Features:**
- Respects collection dependencies (departments before agents)
- Skips existing items (checks unique fields)
- Supports partial seeding (specific collections)
- Creates seeds/ directory if missing

---

### 3. `pnpm db:backup` - Backup Databases

Creates a timestamped backup of all databases in the `backups/` directory.

**Usage:**
```bash
# Create backup with auto-generated name
pnpm db:backup

# Create backup with custom name
pnpm db:backup --name pre-migration
```

**Backup Structure:**
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

**What it backs up:**
- All PayloadCMS collections
- All Open MongoDB project databases (open_*)
- Metadata (timestamp, database URIs)

**Backup naming:**
- Auto: `backup-YYYY-MM-DDTHH-MM-SS`
- Custom: `{name}-YYYY-MM-DDTHH-MM-SS`

---

### 4. `pnpm db:restore` - Restore from Backup

Restores data from a backup in the `backups/` directory.

**Usage:**
```bash
# Restore latest backup (interactive)
pnpm db:restore

# Restore specific backup
pnpm db:restore --backup backup-2025-01-28T10-30-00

# Skip confirmation prompt
pnpm db:restore --confirm
```

**What it does:**
- Lists available backups if none specified
- Shows backup metadata (creation time)
- Asks for confirmation before restoring
- Replaces ALL current data with backup data

**⚠️ Warning:** This will replace all existing data!

---

## 🔄 Common Workflows

### Fresh Start
```bash
# Clean everything and seed fresh data
pnpm db:clean --confirm
pnpm db:seed
```

### Before Major Changes
```bash
# Backup before making changes
pnpm db:backup --name before-migration

# Make your changes...

# Restore if needed
pnpm db:restore --backup before-migration-2025-01-28T10-30-00
```

### Seed Specific Data
```bash
# Seed only departments and agents
pnpm db:seed --collection departments
pnpm db:seed --collection agents
```

### Development Reset
```bash
# Clean and reseed in one go
pnpm db:clean --confirm && pnpm db:seed
```

---

## 📁 Directory Structure

```
aladdin/
├── scripts/
│   └── db/
│       ├── clean.ts       # Clean script
│       ├── seed.ts        # Seed script
│       ├── backup.ts      # Backup script
│       ├── restore.ts     # Restore script
│       └── README.md      # This file
├── seeds/                 # Seed data (gitignored)
│   ├── departments.json
│   ├── agents.json
│   └── ...
└── backups/              # Backups (gitignored)
    ├── backup-2025-01-28T10-30-00/
    └── backup-2025-01-28T14-15-00/
```

---

## 🔧 Configuration

Scripts use environment variables from `.env`:

```bash
# PayloadCMS Database (protected)
DATABASE_URI=mongodb://localhost:27017/aladdin

# Open MongoDB (per-project databases)
DATABASE_URI_OPEN=mongodb://localhost:27017
```

If `DATABASE_URI_OPEN` is not set, it falls back to `DATABASE_URI`.

---

## 🛡️ Safety Features

### Clean Script
- Interactive confirmation prompt
- Shows what will be deleted
- Can be skipped with `--confirm` flag

### Restore Script
- Lists available backups
- Shows backup metadata
- Requires confirmation before restoring
- Validates backup exists

### Seed Script
- Checks for existing data (skips duplicates)
- Respects collection dependencies
- Creates directories if missing
- Handles errors gracefully

### Backup Script
- Timestamped backups (no overwrites)
- Includes metadata
- Handles connection errors
- Closes connections properly

---

## 📝 Notes

1. **Backups are local** - Not suitable for production backups
2. **Seeds are gitignored** - Add your own seed files
3. **Use with caution** - Clean and restore are destructive
4. **Test first** - Try on development before production
5. **Backup regularly** - Before major changes or migrations

---

## 🐛 Troubleshooting

### "No backups found"
- Run `pnpm db:backup` first to create a backup

### "Collection doesn't exist"
- Normal if collection hasn't been created yet
- Seed script will skip non-existent collections

### "Connection failed"
- Check `DATABASE_URI` in `.env`
- Ensure MongoDB is running
- Verify connection string format

### "Permission denied"
- Ensure MongoDB user has proper permissions
- Check database access rights

---

## 🔗 Related

- Main seed script: `src/seed/index.ts` (for initial agent setup)
- Database utilities: `src/lib/db/openDatabase.ts`
- PayloadCMS config: `src/payload.config.ts`

---

## 💡 PayloadCMS Best Practices

All scripts follow PayloadCMS recommended patterns:

### Using `payload run` Command
Scripts are executed using `payload run` which:
- ✅ Automatically loads environment variables from `.env`
- ✅ Handles TypeScript transpilation (tsx/swc)
- ✅ Provides proper Node.js environment setup
- ✅ Supports Hot Module Replacement (HMR) in development

### Using `getPayload()` Pattern
The seed script uses the official PayloadCMS pattern:

```typescript
import { getPayload, type Payload } from 'payload'
import config from '@payload-config'

const seed = async () => {
  // Get a cached Payload instance
  const payload = await getPayload({ config })

  // Use payload.create(), payload.find(), etc.
  await payload.create({
    collection: 'users',
    data: { email: 'user@example.com' }
  })
}
```

**Key Benefits:**
- ✅ Payload instance is automatically cached (efficient)
- ✅ No manual dotenv configuration needed
- ✅ Proper TypeScript typing with `Payload` type
- ✅ Works in standalone scripts outside Next.js

### References
- [PayloadCMS Local API Docs](https://payloadcms.com/docs/local-api/overview)
- [Using Payload Outside Next.js](https://payloadcms.com/docs/local-api/outside-nextjs)
- [Payload Run Command](https://payloadcms.com/docs/local-api/outside-nextjs#payload-run)

