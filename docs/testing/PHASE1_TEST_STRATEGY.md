# Phase 1 Test Strategy - Aladdin Platform

**Version**: 1.0.0
**Date**: 2025-10-01
**Agent**: Tester (Hive Mind Swarm)
**Status**: Ready for Implementation

---

## Executive Summary

This document outlines the comprehensive testing strategy for Phase 1 (Foundation) of the Aladdin AI movie production platform. The strategy ensures 80%+ code coverage across all critical components with a focus on integration testing, E2E workflows, and database validation.

### Coverage Goals
- **Overall Coverage**: 80%+
- **Critical Paths**: 95%+
- **Integration Tests**: All PayloadCMS collections and database operations
- **E2E Tests**: Complete user authentication and project creation flows

---

## 1. Test Architecture

### 1.1 Test Pyramid Structure

```
                /\
               /E2E\           <- 15% - High-value user flows
              /------\
             /  Int.  \        <- 50% - API & Database integration
            /----------\
           /   Unit     \      <- 35% - Business logic & utilities
          /--------------\
```

### 1.2 Test Categories

| Category | Framework | Location | Purpose |
|----------|-----------|----------|---------|
| Unit | Vitest | `tests/unit/` | Isolated business logic |
| Integration | Vitest | `tests/int/` | PayloadCMS collections & DB |
| E2E | Playwright | `tests/e2e/` | User workflows |
| Fixtures | N/A | `tests/fixtures/` | Test data generators |
| Utilities | N/A | `tests/utils/` | Test helpers |

---

## 2. Phase 1 Test Requirements

### 2.1 PayloadCMS Collections Testing

#### 2.1.1 Projects Collection

**File**: `tests/int/collections/projects.int.spec.ts`

**Test Cases**:
- ✅ Create project with required fields only (name)
- ✅ Create project with full metadata
- ✅ Auto-generate slug from name
- ✅ Auto-generate openDatabaseName from slug
- ✅ Validate unique slug constraint
- ✅ Project owner relationship binding
- ✅ Project phase enum validation
- ✅ Project type enum validation
- ✅ Update project metadata
- ✅ Delete project (soft delete if implemented)
- ✅ Query projects by owner
- ✅ Query projects by status

**Coverage Target**: 95%

#### 2.1.2 Episodes Collection

**File**: `tests/int/collections/episodes.int.spec.ts`

**Test Cases**:
- ✅ Create episode with project relationship
- ✅ Episode numbering validation
- ✅ Season numbering (optional)
- ✅ Episode status transitions
- ✅ Query episodes by project
- ✅ Query episodes by episode number
- ✅ Update episode content
- ✅ Delete episode

**Coverage Target**: 90%

#### 2.1.3 Conversations Collection

**File**: `tests/int/collections/conversations.int.spec.ts`

**Test Cases**:
- ✅ Create conversation linked to project
- ✅ Add messages to conversation (array operations)
- ✅ Message role validation (user/assistant/system)
- ✅ Timestamp ordering
- ✅ Archive conversation
- ✅ Query conversations by project
- ✅ Query by last message timestamp

**Coverage Target**: 90%

#### 2.1.4 Workflows Collection

**File**: `tests/int/collections/workflows.int.spec.ts`

**Test Cases**:
- ✅ Create workflow for project
- ✅ Update workflow phase
- ✅ Quality gate validation
- ✅ Quality gate threshold checks
- ✅ Workflow state transitions
- ✅ Query workflows by project

**Coverage Target**: 85%

#### 2.1.5 Users Collection

**File**: `tests/int/collections/users.int.spec.ts`

**Test Cases**:
- ✅ Create user with email/password
- ✅ Password hashing validation
- ✅ Unique email constraint
- ✅ User preferences storage
- ✅ Avatar relationship
- ✅ Update user profile
- ✅ User authentication flow

**Coverage Target**: 90%

#### 2.1.6 Media Collection

**File**: `tests/int/collections/media.int.spec.ts`

**Test Cases**:
- ✅ Upload file (mocked R2)
- ✅ File metadata storage
- ✅ Project relationship binding
- ✅ Linked document references (open DB)
- ✅ Generation metadata storage
- ✅ Query media by project
- ✅ Delete media (cleanup R2)

**Coverage Target**: 85%

---

### 2.2 Database Testing

#### 2.2.1 Protected MongoDB (PayloadCMS)

**File**: `tests/int/database/protected-mongodb.int.spec.ts`

**Test Cases**:
- ✅ Connection establishment
- ✅ Connection pooling
- ✅ Transaction support
- ✅ Error handling (connection failures)
- ✅ Concurrent operations
- ✅ Index verification

**Coverage Target**: 90%

#### 2.2.2 Open MongoDB (Per-Project)

**File**: `tests/int/database/open-mongodb.int.spec.ts`

**Test Cases**:
- ✅ Create project-specific database
- ✅ Database naming convention (open_[slug])
- ✅ Create collection with validation schema
- ✅ Insert document with required fields
- ✅ Insert document with flexible content
- ✅ Validation error handling
- ✅ Query documents by projectId
- ✅ Update documents
- ✅ Delete documents
- ✅ Collection cleanup
- ✅ Database isolation verification

**Coverage Target**: 95%

#### 2.2.3 Database Utilities

**File**: `tests/int/database/database-utils.int.spec.ts`

**Test Cases**:
- ✅ getOpenDatabase() function
- ✅ createCollection() with schema
- ✅ Connection reuse
- ✅ Error recovery
- ✅ Database cleanup utilities

**Coverage Target**: 90%

---

### 2.3 Authentication Testing

#### 2.3.1 Authentication Flow

**File**: `tests/int/auth/authentication.int.spec.ts`

**Test Cases**:
- ✅ User registration
- ✅ Login with valid credentials
- ✅ Login with invalid credentials
- ✅ Session creation
- ✅ Session persistence
- ✅ Session expiration
- ✅ Logout
- ✅ Get current user
- ✅ Update user session

**Coverage Target**: 95%

#### 2.3.2 Route Protection

**File**: `tests/int/auth/route-protection.int.spec.ts`

**Test Cases**:
- ✅ Protected API routes return 401 when not authenticated
- ✅ Protected API routes succeed when authenticated
- ✅ withAuth middleware functionality
- ✅ User context injection

**Coverage Target**: 95%

---

### 2.4 E2E User Workflows

#### 2.4.1 Authentication Flow

**File**: `tests/e2e/auth.e2e.spec.ts`

**Test Cases**:
- ✅ User lands on homepage (login page)
- ✅ User can register new account
- ✅ User can login with credentials
- ✅ User redirected to dashboard after login
- ✅ Homepage redirects to dashboard if already logged in
- ✅ Dashboard redirects to homepage if not logged in
- ✅ User can logout
- ✅ Invalid credentials show error message

**Coverage Target**: 100%

#### 2.4.2 Project Creation Flow

**File**: `tests/e2e/project-creation.e2e.spec.ts`

**Test Cases**:
- ✅ User navigates to create project
- ✅ User fills project form (minimal fields)
- ✅ User creates project
- ✅ Project appears in project list
- ✅ User can view project details
- ✅ OpenDatabaseName auto-generated correctly
- ✅ User can edit project
- ✅ User can delete project

**Coverage Target**: 100%

#### 2.4.3 Media Upload Flow

**File**: `tests/e2e/media-upload.e2e.spec.ts`

**Test Cases**:
- ✅ User navigates to media upload
- ✅ User selects file
- ✅ File uploads successfully (mocked R2)
- ✅ Media appears in media library
- ✅ User can view media details
- ✅ User can delete media

**Coverage Target**: 90%

---

## 3. Test Data & Fixtures

### 3.1 Fixture Structure

**Directory**: `tests/fixtures/`

#### Files:
- `users.fixture.ts` - User test data generators
- `projects.fixture.ts` - Project test data generators
- `episodes.fixture.ts` - Episode test data generators
- `conversations.fixture.ts` - Conversation test data generators
- `media.fixture.ts` - Media file mocks
- `database.fixture.ts` - Database state setup/teardown

### 3.2 Fixture Example

```typescript
// tests/fixtures/projects.fixture.ts
import { ObjectId } from 'mongodb'

export const createTestProject = (overrides = {}) => ({
  name: 'Test Project',
  slug: 'test-project',
  type: 'movie',
  phase: 'expansion',
  owner: new ObjectId().toString(),
  openDatabaseName: 'open_test-project',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

export const createTestProjectList = (count: number) =>
  Array.from({ length: count }, (_, i) =>
    createTestProject({
      name: `Test Project ${i + 1}`,
      slug: `test-project-${i + 1}`,
    })
  )
```

---

## 4. Test Utilities

### 4.1 Test Helpers

**Directory**: `tests/utils/`

#### Files:
- `payload-helper.ts` - PayloadCMS instance management
- `db-helper.ts` - Database setup/teardown
- `auth-helper.ts` - Authentication helpers
- `cleanup-helper.ts` - Test cleanup utilities
- `mock-r2.ts` - R2 storage mocks

### 4.2 Helper Example

```typescript
// tests/utils/payload-helper.ts
import { getPayload, Payload } from 'payload'
import config from '@/payload.config'

let cachedPayload: Payload | null = null

export async function getTestPayload(): Promise<Payload> {
  if (cachedPayload) return cachedPayload

  const payloadConfig = await config
  cachedPayload = await getPayload({ config: payloadConfig })

  return cachedPayload
}

export async function cleanupTestData() {
  const payload = await getTestPayload()

  // Delete test projects
  await payload.delete({
    collection: 'projects',
    where: {
      slug: { like: 'test-' },
    },
  })

  // Delete test users
  await payload.delete({
    collection: 'users',
    where: {
      email: { like: 'test@' },
    },
  })
}
```

---

## 5. Test Execution Plan

### 5.1 Local Development

```bash
# Run all tests
pnpm test

# Run integration tests only
pnpm test:int

# Run E2E tests only
pnpm test:e2e

# Run specific test file
pnpm test:int tests/int/collections/projects.int.spec.ts

# Run with coverage
pnpm test:int --coverage

# Watch mode
pnpm test:int --watch
```

### 5.2 Pre-Commit Hook

```bash
# .husky/pre-commit
#!/bin/sh
pnpm test:int
```

### 5.3 CI/CD Pipeline

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      mongodb:
        image: mongo:7
        ports:
          - 27017:27017

    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - run: pnpm install
      - run: pnpm test:int
      - run: pnpm test:e2e

      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

---

## 6. Coverage Requirements

### 6.1 Minimum Coverage Thresholds

```typescript
// vitest.config.mts
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      thresholds: {
        branches: 75,
        functions: 80,
        lines: 80,
        statements: 80,
      },
      exclude: [
        'node_modules/',
        'tests/',
        '*.config.*',
        '.next/',
      ],
    },
  },
})
```

### 6.2 Critical Path Coverage

**100% Required**:
- Authentication flows
- Project creation with database setup
- Database connection utilities

**95% Required**:
- PayloadCMS collection operations
- Route protection middleware

**85% Required**:
- Media upload handling
- Quality validation logic

---

## 7. Test Implementation Checklist

### 7.1 Setup Phase
- [ ] Create test directory structure
- [ ] Setup Vitest configuration
- [ ] Setup Playwright configuration
- [ ] Create fixture generators
- [ ] Create test utilities
- [ ] Mock R2 storage adapter
- [ ] Setup test MongoDB instances

### 7.2 Integration Tests
- [ ] Projects collection tests
- [ ] Episodes collection tests
- [ ] Conversations collection tests
- [ ] Workflows collection tests
- [ ] Users collection tests
- [ ] Media collection tests
- [ ] Protected MongoDB tests
- [ ] Open MongoDB tests
- [ ] Database utilities tests
- [ ] Authentication tests
- [ ] Route protection tests

### 7.3 E2E Tests
- [ ] Authentication flow tests
- [ ] Project creation flow tests
- [ ] Media upload flow tests

### 7.4 Quality Gates
- [ ] All tests passing
- [ ] 80%+ coverage achieved
- [ ] Critical paths 95%+ coverage
- [ ] No failing assertions
- [ ] CI/CD pipeline configured
- [ ] Pre-commit hooks working

---

## 8. Test Maintenance Guidelines

### 8.1 Writing Tests
1. Use descriptive test names explaining what and why
2. Follow Arrange-Act-Assert pattern
3. Keep tests isolated and independent
4. Mock external dependencies (R2, APIs)
5. Clean up test data after each test
6. Use fixtures for consistent test data

### 8.2 Test Organization
1. One test file per collection/feature
2. Group related tests with describe blocks
3. Use beforeAll/afterAll for expensive setup
4. Use beforeEach/afterEach for test isolation
5. Keep tests under 50 lines when possible

### 8.3 Best Practices
1. Tests should be deterministic (no random failures)
2. Avoid test interdependence
3. Test behavior, not implementation
4. Write tests before or with implementation (TDD)
5. Update tests when requirements change
6. Document complex test scenarios

---

## 9. Known Issues & Limitations

### 9.1 Current Limitations
- R2 storage mocked (no real upload testing in local env)
- MongoDB test instances required locally
- Playwright tests require running dev server

### 9.2 Future Enhancements
- Add performance benchmarks
- Add load testing for concurrent operations
- Add visual regression testing
- Add API contract testing
- Add mutation testing

---

## 10. Success Metrics

### 10.1 Phase 1 Verification Criteria

All tests must pass:
```bash
✅ Integration Tests: All PayloadCMS collections CRUD
✅ Integration Tests: Database connections (both MongoDB instances)
✅ Integration Tests: Authentication flows
✅ E2E Tests: User login/logout
✅ E2E Tests: Project creation
✅ E2E Tests: Media upload
✅ Coverage: 80%+ overall
✅ Coverage: 95%+ critical paths
```

### 10.2 Phase Completion

**Phase 1 Complete When**:
1. All test suites pass consistently
2. Coverage thresholds met
3. CI/CD pipeline green
4. Manual QA verification complete
5. Documentation updated

---

## Appendix A: Test File Structure

```
tests/
├── fixtures/
│   ├── users.fixture.ts
│   ├── projects.fixture.ts
│   ├── episodes.fixture.ts
│   ├── conversations.fixture.ts
│   ├── media.fixture.ts
│   └── database.fixture.ts
│
├── utils/
│   ├── payload-helper.ts
│   ├── db-helper.ts
│   ├── auth-helper.ts
│   ├── cleanup-helper.ts
│   └── mock-r2.ts
│
├── unit/
│   ├── lib/
│   │   └── utils.unit.spec.ts
│   └── hooks/
│       └── project-hooks.unit.spec.ts
│
├── int/
│   ├── collections/
│   │   ├── projects.int.spec.ts
│   │   ├── episodes.int.spec.ts
│   │   ├── conversations.int.spec.ts
│   │   ├── workflows.int.spec.ts
│   │   ├── users.int.spec.ts
│   │   └── media.int.spec.ts
│   │
│   ├── database/
│   │   ├── protected-mongodb.int.spec.ts
│   │   ├── open-mongodb.int.spec.ts
│   │   └── database-utils.int.spec.ts
│   │
│   └── auth/
│       ├── authentication.int.spec.ts
│       └── route-protection.int.spec.ts
│
└── e2e/
    ├── auth.e2e.spec.ts
    ├── project-creation.e2e.spec.ts
    └── media-upload.e2e.spec.ts
```

---

## Appendix B: Environment Setup

### Test Environment Variables

```bash
# test.env
DATABASE_URI_PROTECTED=mongodb://localhost:27017/aladdin_test
DATABASE_URI_OPEN=mongodb://localhost:27017/aladdin_open_test
PAYLOAD_SECRET=test-secret-key
NODE_ENV=test

# Mock R2 credentials (not real)
R2_ACCOUNT_ID=test-account
R2_BUCKET=test-bucket
R2_ACCESS_KEY_ID=test-key
R2_SECRET_ACCESS_KEY=test-secret
R2_PUBLIC_URL=http://localhost:9000/test-bucket
```

---

**Document Status**: ✅ Complete and Ready for Implementation
**Next Step**: Implementation of test suites by development team
**Estimated Implementation Time**: 2-3 days for full test suite