# Configuration System Tests

Comprehensive test suite for the Data Preparation Agent configuration system.

## Test Files

### 1. `config-manager.test.ts`
**Coverage**: ConfigManager core functionality

Tests:
- Configuration initialization
- Registration and retrieval
- Default configuration fallbacks
- Prompt template handling
- Variable substitution
- Validation methods
- Feature flag checks
- Edge cases

**Key Scenarios**:
- Single and batch configuration registration
- Configuration override behavior
- Cache key generation
- Validation rule enforcement
- Missing configuration handling

### 2. `entity-configs.test.ts`
**Coverage**: Entity-specific configurations

Tests:
- Character configuration
- Scene configuration
- Location configuration
- Episode configuration
- Concept configuration
- Cross-entity validation
- Configuration consistency

**Key Scenarios**:
- Required fields validation
- Context source selection
- Metadata template validation
- Relationship rule validation
- Prompt template structure
- Validation rule completeness

### 3. `integration.test.ts`
**Coverage**: Configuration integration with agents

Tests:
- DataPreparationAgent with configuration
- MetadataGenerator with custom prompts
- Multi-entity configuration handling
- Feature flag integration
- Custom rule overrides
- Context source optimization
- Relationship rule application

**Key Scenarios**:
- Validation using entity configuration
- Enrichment strategy selection
- Prompt variable substitution
- Feature-based behavior changes
- Runtime configuration overrides

### 4. `prompts.test.ts`
**Coverage**: Prompt template functionality

Tests:
- Variable substitution
- Character prompt templates
- Scene prompt templates
- Location prompt templates
- Episode prompt templates
- Template validation
- Output format detection
- Performance benchmarks

**Key Scenarios**:
- Single and multiple variable replacement
- Missing variable handling
- Special character handling
- Unicode support
- Large template handling

### 5. `performance.test.ts`
**Coverage**: Configuration system performance

Tests:
- Configuration loading speed
- Cache effectiveness
- Memory usage
- Concurrent access
- Validation performance
- Prompt substitution speed
- Benchmarking

**Key Scenarios**:
- 100+ configuration loading
- Cache hit rate measurement
- Memory leak detection
- Concurrent read/write operations
- Large-scale validation

### 6. `feature-flags.test.ts`
**Coverage**: Feature flag behavior

Tests:
- Individual feature flags
- Feature combinations
- Performance impact
- Production vs development configs
- Runtime changes
- Feature dependencies

**Key Scenarios**:
- Caching enable/disable
- Queue enable/disable
- Validation enable/disable
- Relationship discovery toggle
- Independent feature states

### 7. `validation-rules.test.ts`
**Coverage**: Validation rule enforcement

Tests:
- Required rule
- MinLength rule
- MaxLength rule
- Pattern rule
- Multiple rules
- Custom rules
- Error messages
- Edge cases

**Key Scenarios**:
- Field presence validation
- String length validation
- Regex pattern matching
- Multiple rule failures
- Null/undefined handling

## Test Fixtures

Located in `fixtures/`:
- `entity-data.ts` - Sample entity data
- `context-data.ts` - Sample context objects
- `config-data.ts` - Sample configurations

## Running Tests

### All Configuration Tests
```bash
npm test tests/lib/agents/data-preparation/config
```

### Specific Test File
```bash
npm test tests/lib/agents/data-preparation/config/config-manager.test.ts
```

### Watch Mode
```bash
npm test -- --watch tests/lib/agents/data-preparation/config
```

### Coverage Report
```bash
npm test -- --coverage tests/lib/agents/data-preparation/config
```

## Coverage Goals

| Component | Target Coverage |
|-----------|----------------|
| ConfigManager | 95%+ |
| Entity Configs | 90%+ |
| Integration | 85%+ |
| Prompts | 90%+ |
| Performance | 80%+ |
| Feature Flags | 95%+ |
| Validation | 95%+ |
| **Overall** | **90%+** |

## Test Patterns

### 1. Arrange-Act-Assert
```typescript
it('should register configuration', () => {
  // Arrange
  const config = createTestConfig()

  // Act
  configManager.register('entity', config)

  // Assert
  expect(configManager.has('entity')).toBe(true)
})
```

### 2. Table-Driven Tests
```typescript
const testCases = [
  { input: 'valid', expected: true },
  { input: 'invalid', expected: false }
]

testCases.forEach(({ input, expected }) => {
  it(`should handle ${input}`, () => {
    expect(validate(input)).toBe(expected)
  })
})
```

### 3. Mocking
```typescript
const mockLLM = {
  complete: vi.fn().mockResolvedValue('mock response')
}

const generator = new MetadataGenerator(mockLLM, config)
```

## Best Practices

1. **Isolation**: Each test should be independent
2. **Clarity**: Use descriptive test names
3. **Coverage**: Test success and failure paths
4. **Performance**: Keep tests fast (<100ms per test)
5. **Maintainability**: Use fixtures for common data

## Edge Cases Tested

- Empty/null/undefined values
- Very long strings (1000+ chars)
- Special characters (@#$%^&*())
- Unicode characters (日本語, العربية)
- HTML/XSS attempts
- Concurrent operations
- Missing configurations
- Invalid data types

## Integration Points

These tests validate:
- ConfigManager ↔ DataPreparationAgent
- ConfigManager ↔ MetadataGenerator
- ConfigManager ↔ BrainDocumentValidator
- EntityConfig ↔ Validation
- EntityConfig ↔ Relationships
- PromptTemplates ↔ LLM Client

## Future Test Additions

- [ ] Schema migration tests
- [ ] Configuration versioning tests
- [ ] Multi-language prompt templates
- [ ] A/B testing configuration variants
- [ ] Configuration hot-reloading
- [ ] Distributed configuration sync

## Debugging Failed Tests

1. Check test output for error messages
2. Use `console.log` for debugging (temporary)
3. Run single test with `it.only()`
4. Check fixtures for correct test data
5. Verify mock implementations
6. Review recent code changes

## Contributing

When adding new configuration features:
1. Write tests first (TDD)
2. Update this README
3. Ensure coverage goals are met
4. Add fixtures if needed
5. Update integration tests

## Related Documentation

- [Configuration System Design](/docs/agents/data-preparation-configuration.md)
- [Entity Configuration Schema](/docs/agents/entity-config-schema.md)
- [Testing Guidelines](/docs/testing-guidelines.md)
