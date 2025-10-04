# Three-Tier Database Architecture

## Overview

This project implements a **three-tier MongoDB database system** designed to manage content through different stages of validation and qualification:

1. **Gather Database** (Tier 1) - Unqualified content collection
2. **Qualified Database** (Tier 2) - Validated and approved content
3. **Open Database** (Tier 3) - Flexible schema for dynamic content

## Database Architecture

### Tier 1: Gather Database
- **Naming Pattern**: `aladdin-gather-{projectId}`
- **Purpose**: Initial content collection with strict schema validation
- **Features**:
  - Structured schema with required fields
  - Support for automation metadata
  - Text search capabilities
  - **Locking mechanism** - locks after qualification button pressed
  - Read-only mode post-qualification

### Tier 2: Qualified Database
- **Naming Pattern**: `qualified_{projectSlug}`
- **Purpose**: Validated and approved content storage
- **Features**:
  - Flexible JSON content structure
  - Quality rating system (0-1 scale)
  - Brain validation tracking
  - User approval workflows
  - Version control (auto-incrementing)
  - Migration metadata from gather sources
  - Validation and approval history

### Tier 3: Open Database
- **Naming Pattern**: `open_{projectSlug}`
- **Purpose**: Flexible schema for dynamic, evolving content
- **Features**:
  - Minimal required fields (name, projectId)
  - Completely flexible content structure
  - Dynamic collection creation
  - Agent and user content support

## File Structure

```
src/lib/db/
├── gatherDatabase.ts       # Gather database manager (Tier 1)
├── qualifiedDatabase.ts    # Qualified database manager (Tier 2)
├── openDatabase.ts         # Open database manager (Tier 3)
├── databaseNaming.ts       # Naming utilities and validation
├── migration.ts            # Migration from gather → qualified
└── index.ts               # Central export point
```

## Key Features

### 1. Database Locking System

When the qualification button is pressed:
- Gather database is **locked** via `_system_lock` collection
- Prevents further modifications to gather content
- Stores migration metadata (who, when, why, target slug)
- Can only be unlocked by admin operation

```typescript
// Lock gather database
await lockGatherDatabase(projectId, userId, projectSlug, "Migrated to qualified");

// Check lock status
const lockStatus = await getGatherLockStatus(projectId);
// Returns: { isLocked, lockedAt, lockedBy, reason, migratedToSlug }
```

### 2. Migration System

Automated migration from gather → qualified with:
- **Validation**: Content structure, quality thresholds
- **Transformation**: JSON parsing, metadata enrichment
- **Locking**: Automatic database locking
- **Batch processing**: Configurable batch sizes
- **Error handling**: Comprehensive error tracking
- **Dry run mode**: Test migrations without changes

```typescript
// Migrate with options
const result = await migrateGatherToQualified(
  projectId,
  projectSlug,
  collectionName,
  userId,
  {
    dryRun: false,
    batchSize: 100,
    minQualityScore: 0.5,
    validateOnly: false
  }
);

// Result includes:
// - itemsMigrated, itemsSkipped
// - errors, warnings
// - databaseLocked status
// - summary message
```

### 3. Naming Utilities

Robust validation and naming conventions:

```typescript
// Validate and sanitize project slugs
const slug = validateProjectSlug("my-project"); // ✅
validateProjectSlug("my project"); // ❌ throws error

// Generate database names
const gatherDb = getGatherDatabaseName(projectId);
// → "aladdin-gather-{projectId}"

const qualifiedDb = getQualifiedDatabaseName(projectSlug);
// → "qualified_{projectSlug}"

const openDb = getOpenDatabaseName(projectSlug);
// → "open_{projectSlug}"

// Extract information
const slug = extractProjectSlugFromDbName("qualified_my-project");
// → "my-project"

const tier = getDatabaseTier("qualified_my-project");
// → "qualified"
```

### 4. Qualified Content Versioning

Qualified items use automatic version control:

```typescript
// Create item (version 1)
const item1 = await createQualifiedItem(projectSlug, collectionName, {
  projectId,
  projectSlug,
  name: "Feature Spec",
  content: { /* flexible JSON */ },
  // ... other fields
});

// Update creates version 2
const item2 = await qualifiedDB.updateQualifiedItem(
  projectSlug,
  collectionName,
  item1._id,
  { content: { /* updated content */ } }
);
// New version created, original preserved
```

## Usage Examples

### Initialize and Use Gather Database

```typescript
import { gatherDB, GatherItem } from '@/lib/db';

// Create gather item
const item = await gatherDB.createGatherItem(projectId, {
  content: JSON.stringify({ data: "value" }),
  summary: "Item summary",
  context: "Item context",
  createdBy: "user-id",
  isAutomated: false
});

// Query with filters
const results = await gatherDB.getGatherItems(projectId, {
  page: 1,
  limit: 20,
  search: "keyword",
  sort: "latest",
  hasImage: true
});
```

### Initialize and Use Qualified Database

```typescript
import { qualifiedDB, QualifiedItem } from '@/lib/db';

// Create qualified item
const qualifiedItem = await qualifiedDB.createQualifiedItem(
  projectSlug,
  "features",
  {
    projectId,
    projectSlug,
    name: "Authentication System",
    createdAt: new Date(),
    createdBy: "user-id",
    createdByType: "user",
    qualityRating: 0.92,
    brainValidated: true,
    userApproved: true,
    content: {
      type: "feature",
      description: "OAuth 2.0 implementation",
      requirements: [/* ... */]
    },
    metadata: {
      originalSummary: "Auth feature",
      validationHistory: [/* ... */]
    }
  }
);

// Query qualified items
const items = await qualifiedDB.getQualifiedItems(
  projectSlug,
  "features",
  {
    minQuality: 0.8,
    validated: true,
    approved: true,
    sort: "quality"
  }
);
```

### Run Migration

```typescript
import {
  migrateGatherToQualified,
  getMigrationStatus
} from '@/lib/db';

// Check migration status
const status = await getMigrationStatus(projectId, projectSlug);
console.log(status);
// {
//   gatherLocked: { isLocked: false },
//   gatherCount: 150,
//   qualifiedCount: 0,
//   canMigrate: true,
//   suggestions: ["Ready to migrate 150 items..."]
// }

// Run migration
const result = await migrateGatherToQualified(
  projectId,
  projectSlug,
  "migrated-content",
  "user-id"
);

console.log(result.summary);
// "Migration completed: 145 items migrated, 5 skipped"
```

### Use Open Database for Flexible Content

```typescript
import { openDB } from '@/lib/db';

// Create collection with base schema
const collection = await openDB.createCollection(
  projectSlug,
  "dynamic-content"
);

// Insert flexible content
await collection.insertOne({
  name: "API Documentation",
  projectId: projectId,
  version: 1.0,
  content: {
    // Completely flexible structure
    endpoints: [/* ... */],
    authentication: {/* ... */},
    customFields: {/* ... */}
  }
});
```

## Environment Variables

```bash
# MongoDB Connection URIs (fallback to DATABASE_URI)
DATABASE_URI=mongodb://localhost:27017
DATABASE_URI_OPEN=mongodb://localhost:27017    # Optional: dedicated open DB
DATABASE_URI_QUALIFIED=mongodb://localhost:27017 # Optional: dedicated qualified DB
```

## Error Handling

All database operations include comprehensive error handling:

```typescript
try {
  const result = await migrateGatherToQualified(
    projectId,
    projectSlug,
    collectionName,
    userId
  );

  if (!result.success) {
    console.error("Migration failed:", result.errors);
    console.warn("Warnings:", result.warnings);
  }
} catch (error) {
  console.error("Migration error:", error);
}
```

## Migration Workflow

1. **User presses "Qualify" button** in UI
2. **System checks** gather database lock status
3. **Validation phase** - check all items meet quality threshold
4. **Lock gather database** - prevent modifications
5. **Transform and migrate** - batch process items to qualified DB
6. **Track results** - log successes, errors, warnings
7. **Gather DB locked** - read-only mode, migration complete

## Best Practices

1. **Always validate inputs** using naming utilities
2. **Use batch operations** for large datasets
3. **Check lock status** before attempting migrations
4. **Implement retry logic** for transient failures
5. **Monitor quality scores** before qualification
6. **Test with dry runs** before production migrations
7. **Keep gather DBs locked** after qualification
8. **Use version control** in qualified DB for updates

## Security Considerations

- Project IDs validated as MongoDB ObjectId or UUID
- Project slugs sanitized and validated
- Collection names checked against MongoDB restrictions
- Lock mechanism prevents accidental overwrites
- Admin-only unlock operations
- Audit trail in metadata

## Future Enhancements

- [ ] Automated quality scoring before migration
- [ ] Multi-project bulk migrations
- [ ] Rollback mechanisms
- [ ] Advanced search across qualified collections
- [ ] Real-time sync between tiers
- [ ] Conflict resolution for concurrent updates
- [ ] Archive/backup automation
- [ ] Performance monitoring and optimization
