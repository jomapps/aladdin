# Automated Gather Testing Documentation

Complete testing guide for the automated gather item creation system.

## 📋 Overview

This document covers the comprehensive test suite for automated gather, including:
- **Python Unit Tests** (celery-redis/tests/)
- **E2E Playwright Tests** (tests/e2e/)
- **Mock Infrastructure** for external services
- **CI/CD Integration** guidelines

## 🧪 Test Coverage

### Python Tests (celery-redis/tests/)

#### 1. **test_automated_gather_tasks.py** - Main Task Orchestration
**Coverage**: 45+ tests

**Test Categories**:
- ✅ Dynamic department querying (no hardcoded lists)
- ✅ Sequential processing with cascading context
- ✅ Quality threshold checking (per-department)
- ✅ Max iterations limit (50 total)
- ✅ Cancellation and partial result preservation
- ✅ WebSocket event emission (progress updates)
- ✅ Auto-evaluation triggering after completion
- ✅ Department-specific model usage
- ✅ Department-specific threshold usage
- ✅ Automation metadata storage
- ✅ Brain indexing with project isolation
- ✅ Context management and token limits

**Key Tests**:
```python
test_dynamic_department_query()
test_sequential_processing_with_cascading_context()
test_quality_threshold_checking()
test_max_iterations_limit()
test_cancellation_preserves_partial_results()
test_websocket_event_emission()
test_auto_evaluation_trigger()
test_department_specific_model_usage()
test_automation_metadata_storage()
test_brain_indexing_with_project_isolation()
```

#### 2. **test_duplicate_detection.py** - LLM-Based Deduplication
**Coverage**: 20+ tests

**Test Categories**:
- ✅ Semantic similarity detection (LLM-powered)
- ✅ 90% threshold enforcement (exactly)
- ✅ Newer item retention (timestamp-based)
- ✅ Batch processing (20 items per batch)
- ✅ API retry logic (3 attempts with exponential backoff)
- ✅ Malformed JSON handling
- ✅ Timestamp parsing variations
- ✅ Empty list edge cases
- ✅ Model parameter configuration

**Key Tests**:
```python
test_semantic_similarity_detection_above_threshold()
test_90_percent_threshold_enforcement()
test_newer_item_retention()
test_batch_processing()
test_api_retry_logic()
test_max_retries_exceeded()
test_malformed_json_response_handling()
test_json_in_markdown_code_block()
```

#### 3. **test_dynamic_departments.py** - Dynamic Department Support
**Coverage**: 15+ tests

**Test Categories**:
- ✅ Processing with 7 departments
- ✅ Processing with 10 departments
- ✅ Processing with no departments
- ✅ Handling mixed gatherCheck values
- ✅ Respecting codeDepNumber ordering
- ✅ Large scale (100+ departments)
- ✅ Department-specific settings usage
- ✅ Context cascading between departments
- ✅ Default model/threshold fallbacks

**Key Tests**:
```python
test_processing_with_7_departments()
test_processing_with_10_departments()
test_processing_with_no_departments()
test_mixed_gather_check_values()
test_code_dep_number_ordering()
test_large_scale_department_processing()
test_department_specific_settings_usage()
test_department_context_cascading()
```

### E2E Tests (tests/e2e/)

#### **automated-gather.spec.ts** - End-to-End Workflows
**Coverage**: 9 test scenarios

**Test Scenarios**:
1. ✅ **Start automation from readiness page**
   - Button visibility and enablement
   - Required gather item check (minimum 1)
   - Modal opening on click

2. ✅ **Monitor progress in real-time**
   - Department processing status
   - Deduplication step visibility
   - Quality progress tracking
   - Iteration count display
   - Items created counter

3. ✅ **Handle cancellation mid-process**
   - Cancel button availability
   - Cancellation confirmation
   - Partial results preservation message

4. ✅ **Verify automated items creation**
   - Items visible on gather page
   - Automation metadata display
   - Department filtering

5. ✅ **Auto-trigger evaluations**
   - Evaluation status checking
   - Sequential processing verification
   - Rating display after completion

6. ✅ **Display automation history**
   - History section visibility
   - Timestamp display
   - Item count tracking

7. ✅ **Button state management**
   - Enabled/disabled states
   - Loading state during automation
   - Tooltip explanations

8. ✅ **Network error handling**
   - Offline mode simulation
   - Error message display
   - Retry logic verification

9. ✅ **Sequential evaluation enforcement**
   - Locked department detection
   - Requirement messages

## 🚀 Running Tests

### Python Tests

#### Quick Start
```bash
# From project root
pnpm run test:celery

# Or directly from celery-redis
cd celery-redis
./run-tests.sh
```

#### Specific Test Categories
```bash
# All tests
./run-tests.sh all

# Only unit tests
./run-tests.sh unit

# Only integration tests
./run-tests.sh integration

# Specific test file
./run-tests.sh tasks          # automated gather tasks
./run-tests.sh duplication    # duplicate detection
./run-tests.sh departments    # dynamic departments

# With coverage report
./run-tests.sh coverage

# Fast tests only (exclude slow)
./run-tests.sh fast
```

#### Using pytest directly
```bash
cd celery-redis

# All tests with verbose output
pytest -v

# Specific test file
pytest tests/test_automated_gather_tasks.py -v

# Specific test
pytest tests/test_automated_gather_tasks.py::TestAutomatedGatherTasks::test_dynamic_department_query -v

# With coverage
pytest --cov=app --cov-report=html

# Marked tests
pytest -m unit          # Only unit tests
pytest -m integration   # Only integration tests
pytest -m "not slow"    # Exclude slow tests
```

### E2E Tests

#### Quick Start
```bash
# From project root
pnpm run test:e2e:automated-gather
```

#### Test Modes
```bash
# Headless mode (default)
pnpm run test:e2e:automated-gather

# UI mode (interactive)
pnpm run test:e2e:automated-gather:ui

# Headed mode (visible browser)
pnpm run test:e2e:automated-gather:headed
```

#### Direct Playwright
```bash
# Run specific test
npx playwright test tests/e2e/automated-gather.spec.ts

# Run with UI
npx playwright test tests/e2e/automated-gather.spec.ts --ui

# Run headed
npx playwright test tests/e2e/automated-gather.spec.ts --headed

# Debug mode
npx playwright test tests/e2e/automated-gather.spec.ts --debug
```

## 🏗️ Test Infrastructure

### Fixtures (conftest.py)

#### API Mocking
- `mock_openrouter_api_key` - Sets test API key in environment
- `mock_openai_client` - Mock OpenAI/OpenRouter client
- `mock_payload_client` - Mock Payload CMS client
- `mock_brain_client` - Mock Brain service client
- `mock_mongodb_client` - Mock MongoDB client
- `mock_websocket_emitter` - Mock WebSocket event emitter

#### Sample Data
- `sample_gather_items` - Pre-configured gather items
- `sample_departments` - Department configurations
- `task_data` - Task execution data
- `generated_items` - LLM-generated items
- `duplicate_items` - Items with duplicates
- `previous_department_results` - Cascading context data

#### Task Context
- `mock_celery_task` - Mock Celery task instance
- `mock_quality_analyzer` - Mock quality scoring

### Mock Helpers (mocks.py)

#### MockPayloadClient
```python
from tests.mocks import MockPayloadClient, create_sample_departments

depts = create_sample_departments(count=5)
client = MockPayloadClient(departments=depts)

result = client.find({
    'collection': 'departments',
    'where': {'gatherCheck': {'equals': True}},
    'sort': 'codeDepNumber'
})
```

#### MockBrainClient
```python
from tests.mocks import MockBrainClient

brain = MockBrainClient()

# Create nodes
brain.batch_create_nodes(
    project_id='proj-123',
    nodes=[{'content': 'test'}],
    node_type='GatherItem'
)

# Search duplicates
duplicates = brain.search_duplicates(
    project_id='proj-123',
    content='test content',
    threshold=0.9
)
```

#### MockMongoDBClient
```python
from tests.mocks import MockMongoDBClient

db = MockMongoDBClient()
collection = db.get_collection('gather-items')

# Insert
collection.insert_many([{'content': 'test'}])

# Query
items = collection.find({'projectId': 'proj-123'})
```

#### MockWebSocketEmitter
```python
from tests.mocks import MockWebSocketEmitter

ws = MockWebSocketEmitter()

# Emit event
ws.emit('department_started', {'department': 'story'}, room='proj-123')

# Get events
events = ws.get_events(event_type='department_started')
```

## 📊 Coverage Goals

### Python Tests
- **Statements**: > 80%
- **Branches**: > 75%
- **Functions**: > 80%
- **Lines**: > 80%

### E2E Tests
- **Critical Paths**: 100%
- **User Workflows**: 100%
- **Error Scenarios**: > 90%

## 🔧 CI/CD Integration

### GitHub Actions Example

```yaml
name: Automated Gather Tests

on:
  push:
    branches: [develop, master]
    paths:
      - 'celery-redis/**'
      - 'tests/e2e/automated-gather.spec.ts'
  pull_request:
    branches: [develop, master]

jobs:
  python-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: |
          cd celery-redis
          pip install -r requirements-test.txt

      - name: Run tests with coverage
        run: |
          cd celery-redis
          pytest --cov=app --cov-report=xml --cov-report=term-missing

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./celery-redis/coverage.xml
          flags: python
          name: automated-gather-python

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: pnpm install

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: pnpm run test:e2e:automated-gather

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-results
          path: test-results/
```

### Test Markers

Use pytest markers for CI/CD optimization:

```python
@pytest.mark.unit
def test_unit_logic():
    """Fast unit test"""
    pass

@pytest.mark.integration
@pytest.mark.requires_api
def test_integration_with_api():
    """Integration test requiring API"""
    pass

@pytest.mark.slow
def test_large_dataset():
    """Slow test for large datasets"""
    pass
```

Run specific markers in CI:
```bash
# Fast CI pipeline (unit tests only)
pytest -m unit

# Full CI pipeline (all tests)
pytest

# Nightly build (include slow tests)
pytest -m "slow or integration"
```

## 🐛 Debugging Tests

### Python Tests

#### Debug Single Test
```bash
# With pytest debugger
pytest tests/test_automated_gather_tasks.py::test_name --pdb

# With verbose output
pytest tests/test_automated_gather_tasks.py::test_name -vv -s

# With print statements visible
pytest tests/test_automated_gather_tasks.py::test_name -s
```

#### Debug Fixtures
```python
# In conftest.py, add prints
@pytest.fixture
def sample_departments():
    depts = [...]
    print(f"DEBUG: Created {len(depts)} departments")
    return depts
```

### E2E Tests

#### Debug with Playwright
```bash
# Debug mode (step through)
npx playwright test tests/e2e/automated-gather.spec.ts --debug

# Headed mode (see browser)
npx playwright test tests/e2e/automated-gather.spec.ts --headed

# UI mode (interactive)
npx playwright test tests/e2e/automated-gather.spec.ts --ui

# Trace viewer
npx playwright show-trace trace.zip
```

#### Debug Output
The E2E tests include extensive console logging:
```typescript
console.log('[Test] Step 1: Navigate to homepage...')
console.log('[Test] ✓ Auto-logged in')
```

## 📝 Writing New Tests

### Python Test Template
```python
import pytest
from unittest.mock import patch

class TestMyFeature:
    @patch('app.tasks.my_module.external_api')
    def test_my_feature(
        self,
        mock_api,
        sample_departments,
        mock_celery_task
    ):
        """Test description"""
        # Arrange
        mock_api.return_value = {'result': 'success'}

        # Act
        from app.tasks.my_module import my_function
        result = my_function(sample_departments[0])

        # Assert
        assert result['status'] == 'success'
        mock_api.assert_called_once()
```

### E2E Test Template
```typescript
test('should do something', async () => {
  test.setTimeout(TEST_TIMEOUT)

  console.log('[Test] Step 1: Description...')
  // ... test code
  console.log('[Test] ✓ Step 1 complete')

  console.log('[Test] Step 2: Description...')
  // ... test code
  console.log('[Test] ✓ Step 2 complete')
})
```

## 🔍 Common Issues

### Python Tests

#### Issue: Import Errors
**Solution**: Run from celery-redis directory
```bash
cd celery-redis
pytest
```

#### Issue: Mock Not Applied
**Solution**: Patch where used, not where defined
```python
# Correct
@patch('app.tasks.my_task.external_api')

# Wrong
@patch('app.external.api')
```

#### Issue: Fixture Not Found
**Solution**: Ensure fixture is in conftest.py or imported
```python
from tests.conftest import my_fixture
```

### E2E Tests

#### Issue: Element Not Found
**Solution**: Add explicit waits
```typescript
await expect(element).toBeVisible({ timeout: 10000 })
```

#### Issue: Test Flakiness
**Solution**: Use proper wait strategies
```typescript
// Good
await page.waitForLoadState('networkidle')

// Bad
await page.waitForTimeout(1000)
```

## 📚 Additional Resources

- [Pytest Documentation](https://docs.pytest.org/)
- [unittest.mock Guide](https://docs.python.org/3/library/unittest.mock.html)
- [Playwright Testing](https://playwright.dev/docs/intro)
- [Automated Gather Specification](../idea/automated-gather.md)
- [Test README](../../celery-redis/tests/README.md)

## ✅ Test Checklist

Before deploying automated gather:

- [ ] All Python tests pass (`./run-tests.sh`)
- [ ] Coverage > 80% (`./run-tests.sh coverage`)
- [ ] All E2E tests pass (`pnpm run test:e2e:automated-gather`)
- [ ] Tests pass in CI/CD pipeline
- [ ] No test warnings or deprecations
- [ ] Mock services properly isolated
- [ ] Edge cases covered (0 depts, 100+ depts, cancellation)
- [ ] Error scenarios tested
- [ ] Real-time progress monitoring verified
- [ ] Duplicate detection validated
- [ ] Department ordering respected
- [ ] Quality thresholds enforced
- [ ] Metadata properly stored
