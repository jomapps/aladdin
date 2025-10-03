# Database Seeding Setup

## ✅ Seed Files Created

The following seed files are now available and ready to use:

### 1. `users.json` - 3 Development Users

```json
[
  {
    "email": "admin@aladdin.dev",
    "password": "admin123",
    "name": "Admin User"
  },
  {
    "email": "creator@aladdin.dev",
    "password": "creator123",
    "name": "Content Creator"
  },
  {
    "email": "demo@aladdin.dev",
    "password": "demo123",
    "name": "Demo User"
  }
]
```

### 2. `projects.json` - 4 Sample Projects

- **Cyberpunk Detective** (Movie) - Sci-fi thriller, owner: admin@aladdin.dev
- **The Last Garden** (Movie) - Environmental drama, owner: creator@aladdin.dev
- **Midnight Diner Chronicles** (Series) - Character drama, owner: creator@aladdin.dev
- **Demo Project** (Movie) - Testing project, owner: demo@aladdin.dev

Each project includes complete metadata: logline, synopsis, genres, themes, quality scores, and settings.

## 🚀 How to Use

### Quick Start

```bash
# Clean and seed the database
pnpm db:clean -- --confirm && pnpm db:seed
```

### Step by Step

```bash
# 1. Clean the database (removes all data)
pnpm db:clean -- --confirm

# 2. Seed all collections
pnpm db:seed

# 3. Seed specific collection
pnpm db:seed -- --collection users
pnpm db:seed -- --collection projects
```

## 📝 Important Notes

### Argument Passing

When using `pnpm` with `payload run`, you need to use `--` to separate pnpm arguments from script arguments:

```bash
# ✅ Correct
pnpm db:clean -- --confirm
pnpm db:seed -- --collection users

# ❌ Wrong
pnpm db:clean --confirm
pnpm db:seed --collection users
```

### Dependency Order

The seed script automatically handles dependencies:
1. **users** (must be seeded first)
2. departments
3. agents
4. custom-tools
5. **projects** (requires users as owners)
6. episodes
7. conversations
8. workflows
9. activity-logs
10. export-jobs
11. media

### Duplicate Prevention

The script checks unique fields to avoid duplicates:
- **users**: `email`
- **projects**: `slug`

If a record already exists, it will be skipped with a message like:
```
⏭️  Skipped: admin@aladdin.dev (already exists)
```

## 🔧 Troubleshooting

### Script Hangs During Initialization

If the seed script hangs at "Initializing PayloadCMS...", this is usually due to:
- R2/S3 storage adapter connection timeout
- MongoDB connection issues
- Network connectivity problems

**Solution**: The script has a 60-second timeout. If it hangs, check:
1. MongoDB is running: `mongosh` or check your MongoDB service
2. R2/S3 credentials are valid in `.env`
3. Network connectivity

### Manual Seeding (Alternative Method)

If the automatic seeding doesn't work, you can manually seed using the PayloadCMS admin panel:

1. Start the dev server: `pnpm dev`
2. Navigate to `http://localhost:3000/admin`
3. Create users manually using the credentials from `seeds/users.json`
4. Create projects manually using the data from `seeds/projects.json`

### Verify Seed Files

To verify the seed files are valid JSON:

```bash
node -e "console.log('Users:', JSON.parse(require('fs').readFileSync('seeds/users.json', 'utf-8')).length)"
node -e "console.log('Projects:', JSON.parse(require('fs').readFileSync('seeds/projects.json', 'utf-8')).length)"
```

Should output:
```
Users: 3
Projects: 4
```

## 📖 Related Documentation

- [Database Seeding Guide](../docs/DATABASE_SEEDING.md) - Complete guide
- [Database Management Scripts](../scripts/db/README.md) - All db commands
- [Data Models](../docs/DATA_MODELS.md) - Collection schemas

## 💡 Development Workflow

### Daily Development

```bash
# Start fresh each day
pnpm db:clean -- --confirm && pnpm db:seed
```

### After Schema Changes

```bash
# Backup current data
pnpm db:backup -- --name before-schema-change

# Make schema changes...

# Clean and reseed
pnpm db:clean -- --confirm && pnpm db:seed
```

### Testing Features

```bash
# Seed fresh data
pnpm db:clean -- --confirm && pnpm db:seed

# Test your feature...

# Reseed if needed
pnpm db:seed
```

## ✨ What You Get

After seeding, you'll have:

- ✅ 3 test users to log in with
- ✅ 4 sample projects with complete metadata
- ✅ All departments and agents configured
- ✅ Proper relationships between collections
- ✅ Ready-to-use development environment

## 🔐 Security

- **Development Only**: These credentials are for development only
- **Never Use in Production**: Change all passwords in production
- **Gitignored**: Sensitive seed files should be gitignored
- **Plain Text Passwords**: Automatically hashed by PayloadCMS during creation

