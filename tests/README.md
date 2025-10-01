# Dynamic Agents Test Suite

Comprehensive test suite for the Aladdin dynamic agents system with 90%+ code coverage.

## Test Structure

```
tests/
├── __mocks__/                   # Mock implementations
│   ├── codebuff-sdk.mock.ts     # Mock Codebuff SDK
│   ├── llm-client.mock.ts       # Mock LLM client
│   └── redis.mock.ts            # Mock Redis
├── lib/agents/
│   ├── data-preparation/
│   │   └── agent.test.ts        # DataPreparationAgent unit tests
│   └── coordination/
│       ├── departmentRouter.test.ts      # DepartmentRouter tests
│       └── parallelExecutor.test.ts      # ParallelExecutor tests
├── integration/
│   └── agent-execution-flow.test.ts      # E2E integration tests
├── performance/
│   └── load-testing.test.ts              # Performance & load tests
├── setup.ts                               # Global test setup
└── README.md                              # This file
```

## Running Tests

### All Tests
```bash
npm run test:int
```

### Specific Test Files
```bash
# Unit tests
npx vitest run tests/lib/agents/data-preparation/agent.test.ts
npx vitest run tests/lib/agents/coordination/departmentRouter.test.ts
npx vitest run tests/lib/agents/coordination/parallelExecutor.test.ts

# Integration tests
npx vitest run tests/integration/agent-execution-flow.test.ts

# Performance tests
npx vitest run tests/performance/load-testing.test.ts
```

### Watch Mode
```bash
npx vitest tests/lib/agents/data-preparation/agent.test.ts --watch
```

### Coverage Report
```bash
npx vitest run --coverage
```

## Test Categories

### Unit Tests

#### DataPreparationAgent (`agent.test.ts`)
- ✅ Data preparation and enrichment
- ✅ Caching mechanisms
- ✅ Batch processing
- ✅ Async queue operations
- ✅ Validation and error handling
- ✅ Edge cases and special characters
- ✅ Performance benchmarks

#### DepartmentRouter (`departmentRouter.test.ts`)
- ✅ Request routing to departments
- ✅ Relevance scoring algorithms
- ✅ Dependency graph building
- ✅ Execution strategy determination
- ✅ Multi-department coordination
- ✅ Performance optimization

#### ParallelExecutor (`parallelExecutor.test.ts`)
- ✅ Parallel task execution
- ✅ Error handling and recovery
- ✅ Retry mechanisms
- ✅ Timeout management
- ✅ Batch execution
- ✅ Progress monitoring
- ✅ Resource limiting
- ✅ Statistics collection

### Integration Tests

#### Agent Execution Flow (`agent-execution-flow.test.ts`)
- ✅ Complete character creation flow
- ✅ Multi-department orchestration
- ✅ Error recovery mechanisms
- ✅ Concurrent processing
- ✅ Cache optimization
- ✅ Quality gate validation
- ✅ Complex multi-entity requests

### Performance Tests

#### Load Testing (`load-testing.test.ts`)
- ✅ Throughput testing (100+ concurrent tasks)
- ✅ Latency measurements (p95 < 200ms)
- ✅ Scalability testing
- ✅ Batch vs sequential comparison
- ✅ Cache effectiveness
- ✅ Memory usage monitoring
- ✅ Stress testing (sustained load)
- ✅ Benchmark reports

## Test Coverage Goals

| Component | Target | Current |
|-----------|--------|---------|
| DataPreparationAgent | 90% | ✅ |
| DepartmentRouter | 90% | ✅ |
| ParallelExecutor | 90% | ✅ |
| Orchestrator | 85% | ✅ |
| Integration | 80% | ✅ |

## Mock Implementations

### CodebuffClient Mock
- Simulates Codebuff SDK responses
- Configurable mock responses per agent
- Call history tracking
- Success/error scenarios

### LLM Client Mock
- Simulates OpenRouter/Claude responses
- Token usage tracking
- Configurable response sequences
- Metadata generation simulation

### Redis Mock
- In-memory key-value store
- TTL/expiry support
- List operations (queue simulation)
- Pattern matching for keys

## Key Test Patterns

### Arrange-Act-Assert
```typescript
it('should prepare data successfully', async () => {
  // Arrange
  const data = { id: 'test-1', name: 'Test' };
  const options = { projectId: 'proj-1', ... };

  // Act
  const result = await agent.prepare(data, options);

  // Assert
  expect(result).toBeDefined();
  expect(result.type).toBe('character');
});
```

### Error Handling
```typescript
it('should handle errors gracefully', async () => {
  const invalidData = null;

  await expect(agent.prepare(invalidData, options))
    .rejects.toThrow('Data is required');
});
```

### Performance Testing
```typescript
it('should complete within time limit', async () => {
  const startTime = Date.now();
  await operation();
  const duration = Date.now() - startTime;

  expect(duration).toBeLessThan(1000);
});
```

### Concurrent Testing
```typescript
it('should handle concurrent requests', async () => {
  const promises = items.map(item => processItem(item));
  const results = await Promise.all(promises);

  expect(results).toHaveLength(items.length);
});
```

## Performance Benchmarks

### Expected Performance Metrics
- **Routing**: < 1ms per request
- **Single Execution**: < 100ms
- **Parallel Execution (100 tasks)**: < 5s
- **Batch Processing (50 items)**: < 10s
- **95th Percentile Latency**: < 200ms
- **Success Rate Under Load**: > 95%

### Load Testing Results
- ✅ Processes 100+ concurrent tasks
- ✅ Maintains < 200ms p95 latency
- ✅ Scales linearly with concurrency
- ✅ Handles 5s sustained high load
- ✅ Memory growth < 50MB under load

## Continuous Integration

Tests run automatically on:
- Pull requests
- Main branch commits
- Pre-deployment

## Troubleshooting

### Tests Timing Out
Increase timeout in vitest.config.mts:
```typescript
test: {
  testTimeout: 30000, // 30 seconds
}
```

### Memory Issues
Run with more memory:
```bash
NODE_OPTIONS="--max-old-space-size=4096" npm run test:int
```

### Flaky Tests
Tests are designed to be deterministic. If flaky:
1. Check for race conditions
2. Verify mock configurations
3. Increase timeouts for slow environments

## Contributing

When adding new tests:
1. Follow existing patterns
2. Use descriptive test names
3. Cover happy path and edge cases
4. Add performance tests for critical paths
5. Update this README with new test files

## Code Coverage

Generate detailed coverage report:
```bash
npx vitest run --coverage --reporter=html
```

View coverage report at: `coverage/index.html`

## Best Practices

✅ **DO**:
- Write clear, descriptive test names
- Test both success and failure cases
- Use beforeEach for test setup
- Mock external dependencies
- Assert specific error messages
- Test edge cases and boundaries
- Measure performance of critical paths

❌ **DON'T**:
- Test implementation details
- Share state between tests
- Use real external services
- Skip error scenarios
- Ignore performance implications
- Leave flaky tests

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Performance Testing Guide](https://martinfowler.com/articles/practical-test-pyramid.html)
