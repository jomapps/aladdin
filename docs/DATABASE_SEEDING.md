# Database Seeding Guide

Complete guide for seeding the Aladdin database with users, projects, and other collections.

## 🎯 Quick Start

When you drop the database during development, run:

```bash
# Clean everything and seed fresh data
pnpm db:clean --confirm && pnpm db:seed
```

This gives you:
- ✅ 3 test users to log in with
- ✅ 4 sample projects to work with  
- ✅ All departments and agents configured

---

## 📦 Available Seed Data

### 👤 Users (seeds/users.json)

Three development users with different roles:

| Email | Password | Name | Purpose |
|-------|----------|------|---------|
| admin@aladdin.dev | admin123 | Admin User | Full admin access |
| creator@aladdin.dev | creator123 | Content Creator | Content creation |
| demo@aladdin.dev | demo123 | Demo User | Testing/demos |

**Note**: Passwords are plain text in seed files and automatically hashed by PayloadCMS during creation.

### 🎬 Projects (seeds/projects.json)

Four sample projects with complete metadata:

#### 1. Cyberpunk Detective (Movie)
- **Owner**: admin@aladdin.dev
- **Genre**: Sci-Fi, Thriller, Mystery
- **Status**: Active, Expansion phase
- **Quality**: 78%
- **Logline**: "In a neon-lit future, a rogue AI detective must solve a murder that could unravel the fabric of reality itself."

#### 2. The Last Garden (Movie)
- **Owner**: creator@aladdin.dev
- **Genre**: Drama, Sci-Fi, Adventure
- **Status**: Active, Expansion phase
- **Quality**: 72%
- **Logline**: "After Earth's ecosystem collapses, a botanist discovers the last living garden—and the ancient secret it protects."

#### 3. Midnight Diner Chronicles (Series)
- **Owner**: creator@aladdin.dev
- **Genre**: Drama, Slice of Life, Mystery
- **Status**: Active, Expansion phase
- **Quality**: 85%
- **Episodes**: 10 planned
- **Logline**: "A mysterious late-night diner serves more than food—it serves second chances, one customer at a time."

#### 4. Demo Project (Movie)
- **Owner**: demo@aladdin.dev
- **Genre**: Drama
- **Status**: Active, Expansion phase
- **Quality**: 50%
- **Public**: Yes
- **Purpose**: Testing and development

---

## 🔧 Seeding Commands

### Seed All Collections

```bash
pnpm db:seed
```

Seeds collections in dependency order:
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

### Seed Specific Collection

```bash
# Seed only users
pnpm db:seed --collection users

# Seed only projects
pnpm db:seed --collection projects
```

### Clean Before Seeding

```bash
# Clean and seed in one command
pnpm db:clean --confirm && pnpm db:seed

# Or step by step
pnpm db:clean
pnpm db:seed
```

---

## 📝 How It Works

### Dependency Order

The seed script respects collection dependencies:

```
users (required first)
  ↓
projects (requires users as owners)
  ↓
episodes (requires projects)
  ↓
conversations (requires projects)
```

### Duplicate Prevention

The script checks unique fields to avoid duplicates:

| Collection | Unique Field |
|------------|--------------|
| users | email |
| departments | slug |
| agents | agentId |
| custom-tools | toolName |
| projects | slug |
| episodes | slug |

If a record with the same unique field exists, it will be skipped.

### Project Owners

Projects have a required `owner` field that references a user:

```json
{
  "name": "My Project",
  "slug": "my-project",
  "owner": "admin@aladdin.dev",  // References user by email
  ...
}
```

The seed script automatically resolves these relationships.

### Open Database Names

Each project gets an auto-generated `openDatabaseName`:

```json
{
  "slug": "cyberpunk-detective",
  "openDatabaseName": "open_cyberpunk-detective"  // Auto-generated
}
```

This is used for project-specific MongoDB collections.

---

## 🛠️ Adding Custom Seed Data

### 1. Create a Seed File

Create a JSON file in the `seeds/` directory:

```bash
seeds/my-collection.json
```

### 2. Use Array Format

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

### 3. Run the Seed Script

```bash
pnpm db:seed --collection my-collection
```

---

## 🔄 Development Workflow

### Daily Development

```bash
# Start fresh each day
pnpm db:clean --confirm && pnpm db:seed
```

### Testing New Features

```bash
# Backup current state
pnpm db:backup --name before-feature-test

# Make changes and test...

# Restore if needed
pnpm db:restore
```

### Adding New Test Data

```bash
# 1. Modify seed files in seeds/
# 2. Clean and reseed
pnpm db:clean --confirm && pnpm db:seed
```

---

## 📊 Verification

After seeding, verify the data:

### Check Users

```bash
# Log in to PayloadCMS admin
# http://localhost:3000/admin

# Use any of the test accounts:
# - admin@aladdin.dev / admin123
# - creator@aladdin.dev / creator123
# - demo@aladdin.dev / demo123
```

### Check Projects

Navigate to the Projects collection in the admin panel. You should see:
- Cyberpunk Detective
- The Last Garden
- Midnight Diner Chronicles
- Demo Project

Each project should have:
- Complete metadata (logline, synopsis, genres)
- Quality scores
- Owner relationship
- Settings configured

---

## 🚨 Troubleshooting

### "No seed file found"

The seed file doesn't exist in the `seeds/` directory.

**Solution**: Create the file or check the filename matches the collection name.

### "Already exists, skipping"

A record with the same unique field already exists.

**Solution**: This is normal. Use `pnpm db:clean` first if you want to reseed.

### "Owner not found"

The project references a user that doesn't exist.

**Solution**: Ensure users are seeded before projects. The seed script handles this automatically.

### "Initialization timeout"

PayloadCMS initialization is hanging.

**Solution**: Check:
- MongoDB is running
- R2/S3 credentials are valid (if using cloud storage)
- Network connectivity

---

## 📖 Related Documentation

- [Database Management Scripts](../scripts/db/README.md)
- [Data Models](./DATA_MODELS.md)
- [Authentication](./AUTHENTICATION.md)

---

## 💡 Tips

1. **Always seed users first** - Projects depend on users
2. **Use meaningful test data** - Makes development easier
3. **Backup before major changes** - Use `pnpm db:backup`
4. **Keep seed files updated** - Reflect current schema
5. **Don't commit sensitive data** - Seeds directory is gitignored

---

## 🔐 Security Notes

- **Development only**: These credentials are for development only
- **Never use in production**: Change all passwords in production
- **Gitignored**: The `seeds/` directory is gitignored to prevent committing sensitive data
- **Plain text passwords**: Automatically hashed by PayloadCMS during creation

