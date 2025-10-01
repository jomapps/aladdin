# Database Quick Start Guide

Quick reference for Aladdin's database management commands.

---

## 🚀 Quick Commands

```bash
# Clean all databases (removes all data)
pnpm db:clean

# Seed from JSON files in seeds/ directory
pnpm db:seed

# Create a backup
pnpm db:backup

# Restore latest backup
pnpm db:restore

# Seed initial agents and departments (from src/seed/)
pnpm seed
```

---

## 📋 Common Workflows

### Fresh Start
```bash
pnpm db:clean --confirm && pnpm seed
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

### `pnpm seed` vs `pnpm db:seed`

| Command | Source | Purpose |
|---------|--------|---------|
| `pnpm seed` | `src/seed/` | Initial setup (35 agents, 6 departments) |
| `pnpm db:seed` | `seeds/` | Custom data from JSON files |

**Use both:**
```bash
pnpm seed      # Seed agents and departments
pnpm db:seed   # Seed your custom data
```

---

## ⚠️ Safety Notes

1. **`db:clean` is destructive** - Removes ALL data
2. **`db:restore` replaces data** - Current data is lost
3. **Backups are local** - Not for production use
4. **Seeds are gitignored** - Won't be committed

---

## 📖 Full Documentation

See [DATABASE_MANAGEMENT.md](./DATABASE_MANAGEMENT.md) for complete guide.

