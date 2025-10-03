# Database Quick Start Guide

Quick reference for Aladdin's database management commands.

---

## 🚀 Quick Commands

```bash
# Clean all databases (removes all data)
pnpm db:clean

# Reset databases and seed core data (drops Payload + gather DBs)
pnpm db:seed

# Create a backup
pnpm db:backup

# Restore latest backup
pnpm db:restore
```

---

## 📋 Common Workflows

### Fresh Start
```bash
pnpm db:seed
```

### Before Major Changes
```bash
pnpm db:backup --name before-migration
# Make changes...
# If needed: pnpm db:restore
```

### Seed Custom Data
```bash
# 1. Add JSON files to seeds/ directory
# 2. Run seed command
pnpm db:seed
```

---

## 📁 Directory Structure

```
aladdin/
├── scripts/db/          # Database scripts
│   ├── clean.ts
│   ├── seed.ts
│   ├── backup.ts
│   └── restore.ts
├── seeds/              # Seed data (gitignored)
│   ├── departments.json
│   ├── agents.json
│   └── ...
├── backups/           # Backups (gitignored)
│   └── backup-2025-01-28T10-30-00/
└── src/seed/          # Initial seed scripts
    ├── index.ts
    ├── departments.seed.ts
    └── agents.seed.ts
```

---

## 🔑 Key Differences

Use a single command for a fresh start:

```bash
pnpm db:seed
```

This drops Payload and gather databases and programmatically seeds core data from `src/seed/index.ts`.

---

## ⚠️ Safety Notes

1. **`db:clean` is destructive** - Removes ALL data
2. **`db:restore` replaces data** - Current data is lost
3. **Backups are local** - Not for production use
4. **Seeds are gitignored** - Won't be committed

---

## 📖 Full Documentation

See [DATABASE_MANAGEMENT.md](./DATABASE_MANAGEMENT.md) for complete guide.

