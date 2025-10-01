# Brain Service Required - Fail Fast Configuration

**Date**: January 2025  
**Status**: ✅ Configured to fail fast when Brain service is unavailable

---

## Change Summary

Updated the system to **fail fast** when Brain service is not configured, rather than silently continuing without it.

### Philosophy

**Brain service is critical** to the movie production system. Without it:
- No data enrichment
- No context storage
- No AI-powered features
- Incomplete data pipeline

Therefore, it's better to **fail immediately** with a clear error message than to continue with degraded functionality.

---

## Changes Made

### 1. Brain Client - Clear Error Message

**File**: `src/lib/brain/client.ts`

```typescript
if (!apiUrl || !apiKey) {
  const errorMessage = 
    'Brain API configuration missing. Set BRAIN_SERVICE_BASE_URL and BRAIN_SERVICE_API_KEY environment variables. ' +
    'Brain service is required for all operations.'
  console.error('[BrainClient] ' + errorMessage)
  throw new Error(errorMessage)
}
```

**Before**: Warning + throw error (confusing)  
**After**: Clear error message explaining Brain is required

### 2. Data Prep Hooks - Fail Fast

**File**: `src/lib/agents/data-preparation/payload-hooks.ts`

```typescript
try {
  // Get brain service - will throw error if not configured
  const brainService = getBrainServiceInterceptor()
  
  // ... sync logic ...
  
} catch (error: any) {
  console.error(`[DataPrepHook] Error syncing ${collectionSlug}:${doc.id}:`, error)
  
  // If Brain service is not configured, fail the operation
  if (error.message?.includes('Brain API configuration missing')) {
    throw new Error(
      `Brain service is required but not configured. Cannot create ${collectionSlug}. ` +
      `Please set BRAIN_SERVICE_BASE_URL and BRAIN_SERVICE_API_KEY environment variables.`
    )
  }
  
  // For other errors, also fail to ensure data consistency
  throw new Error(
    `Failed to sync ${collectionSlug} to Brain service: ${error.message || 'Unknown error'}`
  )
}
```

**Before**: Caught error, logged warning, continued  
**After**: Throws error immediately, stops operation

---

## Behavior

### When Brain Service is NOT Configured

#### Before (Silent Failure)
```
[DataPrepHook] Brain service not available, skipping sync for projects:123
POST /api/v1/projects 201 in 1114ms
✓ Project created (but without Brain sync!)
```

#### After (Fail Fast)
```
[BrainClient] Brain API configuration missing. Set BRAIN_SERVICE_BASE_URL and BRAIN_SERVICE_API_KEY environment variables. Brain service is required for all operations.
[DataPrepHook] Error syncing projects:123
Error: Brain service is required but not configured. Cannot create projects.
POST /api/v1/projects 500 in 150ms
✗ Project creation failed
```

### When Brain Service IS Configured

```
[DataPrepHook] Synced projects:68dd1ca093799c1eefb6b294
POST /api/v1/projects 201 in 1114ms
✓ Project created successfully
```

---

## Required Environment Variables

Your `.env` file **must** have these variables:

```env
# Brain Service (REQUIRED)
BRAIN_SERVICE_BASE_URL=https://brain.ft.tc
BRAIN_SERVICE_API_KEY=ae6e18cb408bc7128f23585casdlaelwlekoqdsldsa
```

### Supported Variable Names

The code supports multiple naming conventions:

```env
# Primary (recommended)
BRAIN_SERVICE_BASE_URL=https://brain.ft.tc
BRAIN_SERVICE_API_KEY=your-key-here

# Alternative names (legacy support)
BRAIN_API_URL=https://brain.ft.tc
BRAIN_API_KEY=your-key-here

# Also supported
BRAIN_SERVICE_URL=https://brain.ft.tc
```

---

## Error Messages

### Missing Configuration

```
Error: Brain API configuration missing. 
Set BRAIN_SERVICE_BASE_URL and BRAIN_SERVICE_API_KEY environment variables. 
Brain service is required for all operations.
```

**Action**: Add the required environment variables to your `.env` file

### Brain Service Unreachable

```
Error: Failed to sync projects to Brain service: 
Connection refused to https://brain.ft.tc
```

**Action**: Check if Brain service is running and accessible

### Brain Service Error

```
Error: Failed to sync projects to Brain service: 
Invalid API key
```

**Action**: Verify your `BRAIN_SERVICE_API_KEY` is correct

---

## Impact on Operations

### Operations That Require Brain Service

All of these will **fail immediately** if Brain service is not configured:

- ✅ Creating projects
- ✅ Creating scenes
- ✅ Creating characters
- ✅ Creating locations
- ✅ Any PayloadCMS collection with data prep hooks

### Operations That Don't Require Brain Service

These continue to work normally:

- ✅ User authentication
- ✅ Static page rendering
- ✅ Admin panel access
- ✅ Media uploads (R2)

---

## Benefits of Fail Fast

### 1. **Data Consistency**
- Ensures all data is properly synced to Brain
- No partial or incomplete data states
- Maintains data integrity

### 2. **Clear Error Messages**
- Developers know immediately what's wrong
- No silent failures or degraded functionality
- Easy to diagnose configuration issues

### 3. **Prevents Confusion**
- No "why isn't this working?" moments
- No debugging why AI features aren't available
- Clear indication that Brain service is required

### 4. **Production Safety**
- Catches configuration errors before deployment
- Prevents running in production without Brain service
- Forces proper setup

---

## Development Workflow

### Starting Development

1. **Check Environment Variables**
   ```bash
   # Verify Brain service is configured
   grep BRAIN_SERVICE .env
   ```

2. **Start Services**
   ```bash
   # Start Brain service first
   # Then start Next.js
   pnpm dev
   ```

3. **Verify Connection**
   - Try creating a project
   - Should succeed if Brain service is configured
   - Should fail with clear error if not

### Troubleshooting

#### Error: "Brain API configuration missing"

**Solution**:
```bash
# Add to .env
echo "BRAIN_SERVICE_BASE_URL=https://brain.ft.tc" >> .env
echo "BRAIN_SERVICE_API_KEY=your-key-here" >> .env
```

#### Error: "Connection refused"

**Solution**:
- Check if Brain service is running
- Verify the URL is correct
- Check network connectivity

#### Error: "Invalid API key"

**Solution**:
- Verify the API key in `.env`
- Check if key has expired
- Generate new key if needed

---

## Testing

### Manual Test

```bash
# 1. Remove Brain service config (temporarily)
# Comment out in .env:
# BRAIN_SERVICE_BASE_URL=...
# BRAIN_SERVICE_API_KEY=...

# 2. Restart dev server
pnpm dev

# 3. Try to create a project
# Should fail with clear error message

# 4. Restore Brain service config
# Uncomment in .env

# 5. Restart dev server
pnpm dev

# 6. Try to create a project
# Should succeed
```

### Automated Test

The E2E test will fail if Brain service is not configured:

```bash
pnpm exec playwright test tests/e2e/project-creation-flow.spec.ts
```

---

## Migration Guide

If you were relying on the old behavior (silent failure), you need to:

### 1. Ensure Brain Service is Configured

Add to `.env`:
```env
BRAIN_SERVICE_BASE_URL=https://brain.ft.tc
BRAIN_SERVICE_API_KEY=your-key-here
```

### 2. Ensure Brain Service is Running

The Brain service must be accessible at the configured URL.

### 3. Update Error Handling

If you have custom error handling, update it to handle Brain service errors:

```typescript
try {
  await createProject(data)
} catch (error) {
  if (error.message.includes('Brain service is required')) {
    // Handle Brain service configuration error
    console.error('Brain service not configured!')
  }
}
```

---

## Checklist

- [x] Brain client throws clear error when not configured
- [x] Data prep hooks fail fast on Brain errors
- [x] Error messages explain what's needed
- [x] Supports multiple environment variable names
- [x] Documented required configuration
- [x] Documented error messages
- [x] Documented troubleshooting steps

---

## Summary

**Before**: Silent failure, degraded functionality  
**After**: Fail fast with clear error messages

**Philosophy**: Brain service is critical, so fail immediately if it's not available rather than continuing with incomplete functionality.

**Result**: Better developer experience, clearer errors, data consistency guaranteed.

---

**Status**: ✅ **Configured to fail fast**

Brain service is now required for all operations. Configure it properly or operations will fail with clear error messages.

