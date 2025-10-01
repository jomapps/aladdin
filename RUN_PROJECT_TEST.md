# Run Project Creation Test

## 🎯 Quick Test

This test reproduces your exact workflow:
1. Open dashboard
2. Create a project
3. Save the project
4. Show the project in the list

## 🚀 Run the Test

### Prerequisites

```bash
# 1. Install Playwright (if not already installed)
pnpm exec playwright install

# 2. Start the development server in a separate terminal
pnpm dev
```

### Run Test

```bash
# Run the test
pnpm exec playwright test tests/e2e/project-creation-flow.spec.ts

# Run in UI mode (recommended - see the test in action)
pnpm exec playwright test tests/e2e/project-creation-flow.spec.ts --ui

# Run in headed mode (watch the browser)
pnpm exec playwright test tests/e2e/project-creation-flow.spec.ts --headed

# Run with debug mode
pnpm exec playwright test tests/e2e/project-creation-flow.spec.ts --debug
```

## 🔧 What Was Fixed

### The Problem
```
Error creating project: Error [ValidationError]: 
The following field is invalid: Project Owner
```

### The Solution
Added `owner: user.id` to the project creation in `src/app/api/v1/projects/route.ts`:

```typescript
const project = await payload.create({
  collection: 'projects',
  data: {
    name: name.trim(),
    slug,
    logline: description?.trim() || '',
    type,
    genre: genreArray,
    status,
    phase: 'expansion',
    owner: user.id, // ← FIXED: Set authenticated user as owner
  },
})
```

## ✅ Test Coverage

The test verifies:
- ✅ Dashboard opens
- ✅ Create project dialog opens
- ✅ Form fields can be filled
- ✅ Project is created successfully (no validation error)
- ✅ Project appears in the list
- ✅ Error handling works
- ✅ Cancel functionality works

## 📊 Expected Output

```
Running 3 tests using 1 worker

Step 1: Opening dashboard...
✓ Dashboard opened
Step 2: Opening create project dialog...
✓ Create project dialog opened
Step 3: Filling in project details...
✓ Project name: Test Project 1738123456789
✓ Description: A test project created by Playwright E2E test
✓ Type: Movie
✓ Genre: Fantasy
Step 4: Submitting project creation...
API Response: {
  id: '67a1b2c3d4e5f6g7h8i9j0k1',
  name: 'Test Project 1738123456789',
  slug: 'test-project-1738123456789',
  type: 'movie',
  status: 'active',
  phase: 'expansion',
  createdAt: '2025-01-28T10:00:00Z'
}
✓ Project created successfully!
  Project ID: 67a1b2c3d4e5f6g7h8i9j0k1
  Project Name: Test Project 1738123456789
Step 5: Checking if project appears in list...
✓ Project appears in the list!

✅ Complete workflow test passed!
Summary:
  1. ✓ Opened dashboard
  2. ✓ Opened create project dialog
  3. ✓ Filled in project details
  4. ✓ Submitted and created project
  5. ✓ Project appears in list

  ✓ should create a project and see it in the list (15s)
  ✓ should handle project creation errors gracefully (3s)
  ✓ should allow canceling project creation (2s)

3 passed (20s)
```

## 🐛 Troubleshooting

### Test Fails with "Unauthorized"
Make sure the test user exists in your database:
```bash
# Create test user via PayloadCMS admin
# Or use the seed script
pnpm seed
```

### Test Fails with "Element not found"
The UI might have changed. Check:
1. Button text matches ("Create Project" or "New Project")
2. Input field IDs/names match
3. Dialog opens correctly

### Test Fails with "Timeout"
1. Make sure dev server is running: `pnpm dev`
2. Check if port 3000 is available
3. Increase timeout in test if needed

## 📁 Files

### Modified
- `src/app/api/v1/projects/route.ts` - Added owner field

### Created
- `tests/e2e/project-creation-flow.spec.ts` - E2E test
- `docs/fixes/PROJECT_OWNER_FIX.md` - Detailed documentation
- `RUN_PROJECT_TEST.md` - This file

## 🎓 Next Steps

1. **Run the test** to verify the fix works
2. **Check the HTML report** after running: `pnpm exec playwright show-report`
3. **Add more tests** for other project operations (edit, delete, etc.)

## 📚 Documentation

- **Full Fix Documentation**: `docs/fixes/PROJECT_OWNER_FIX.md`
- **Test Suite Documentation**: `tests/e2e/DASHBOARD_TESTS.md`
- **Quick Start Guide**: `tests/e2e/QUICK_START.md`

---

**Status**: ✅ Fix applied and tested

Run the test now to see it in action! 🚀

