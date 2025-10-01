# Phase 3 Brain Integration - Comprehensive Test Strategy

**Version**: 1.0.0
**Created**: 2025-10-01
**Agent**: Tester (QA Specialist)
**Status**: Complete

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Test Coverage Areas](#test-coverage-areas)
3. [Test Categories & Priorities](#test-categories--priorities)
4. [Detailed Test Cases (200+)](#detailed-test-cases-200)
5. [Mock & Fixture Strategies](#mock--fixture-strategies)
6. [Performance Benchmarks](#performance-benchmarks)
7. [Quality Metrics & Coverage Targets](#quality-metrics--coverage-targets)
8. [Test Data Management](#test-data-management)
9. [Verification Criteria](#verification-criteria)
10. [Test Environment Setup](#test-environment-setup)

---

## Executive Summary

### Scope
Phase 3 integrates the Brain service (Neo4j knowledge graph) and Celery-Redis task queue into the Aladdin project. This test strategy covers validation of:
- Brain API client operations
- Neo4j database CRUD and graph operations
- Jina AI embedding generation
- Quality validation pipeline (scoring, contradiction detection)
- MongoDB change streams → Brain synchronization
- Celery-Redis task queue operations
- PayloadCMS hooks → Brain integration
- End-to-end agent → Brain → storage workflows

### Coverage Targets
- **Overall Coverage**: 85%+ (lines, statements, branches)
- **Critical Brain Operations**: 98%+
- **Integration Points**: 95%+
- **E2E Workflows**: 90%+
- **Performance Tests**: 100% of critical paths

### Test Counts
- **Unit Tests**: 120+ test cases
- **Integration Tests**: 60+ test cases
- **E2E Tests**: 25+ test cases
- **Performance Tests**: 15+ benchmarks
- **Contract Tests**: 10+ API contracts
- **Security Tests**: 5+ security scenarios

**Total**: 235+ test cases

---

## Test Coverage Areas

### 1. Brain API Client Operations
**Priority**: Critical
**Coverage Target**: 98%

#### Test Scenarios
- WebSocket connection establishment (success/failure/retry)
- Request/response handling (JSON-RPC 2.0)
- Timeout handling and recovery
- Connection pooling and reuse
- Graceful degradation on service unavailability
- Error propagation and logging
- Context manager lifecycle (async with)
- Health check monitoring

### 2. Neo4j Database Operations
**Priority**: Critical
**Coverage Target**: 95%

#### Test Scenarios
- Node creation (Character, Project, Scene, etc.)
- Node updates (properties, labels)
- Node deletion (soft/hard delete)
- Relationship creation (FEATURES, LOCATED_IN, etc.)
- Relationship queries (traversal, filtering)
- Graph pattern matching (Cypher queries)
- Transaction handling (commit/rollback)
- Schema validation and constraints
- Index performance optimization
- Bulk operations (batch inserts)

### 3. Embedding Generation (Jina API)
**Priority**: High
**Coverage Target**: 90%

#### Test Scenarios
- Embedding generation for text content
- Batch embedding operations
- Error handling (API rate limits, timeouts)
- Embedding storage in Neo4j
- Vector similarity calculations
- Embedding cache optimization
- API key validation
- Large content chunking

### 4. Quality Validation Pipeline
**Priority**: Critical
**Coverage Target**: 98%

#### Test Scenarios
- Quality score calculation (0.0 - 1.0 scale)
- Score threshold enforcement (≥ 0.60)
- Contradiction detection (semantic conflicts)
- Consistency checks across knowledge graph
- Improvement suggestion generation
- Validation result storage
- Multi-field validation (name, backstory, traits)
- Edge case handling (empty content, special characters)

### 5. MongoDB Change Streams
**Priority**: High
**Coverage Target**: 90%

#### Test Scenarios
- Change stream initialization per project
- Insert event detection and processing
- Update event detection and processing
- Delete event handling (tombstone pattern)
- Change stream resumption after disconnect
- Filter optimization (project-specific)
- Event batching and throttling
- Error recovery and retry logic

### 6. Celery-Redis Task Queue
**Priority**: Critical
**Coverage Target**: 95%

#### Test Scenarios
- Task submission (enqueue to Redis)
- Task execution (Celery workers)
- Task status tracking (pending/running/completed/failed)
- Task retry logic (exponential backoff)
- Task cancellation
- Task result storage
- Worker health monitoring
- Queue prioritization
- Dead letter queue handling
- Task timeout enforcement

### 7. PayloadCMS Hooks Integration
**Priority**: High
**Coverage Target**: 90%

#### Test Scenarios
- afterChange hook triggering
- beforeValidate hook execution
- Project creation → Brain node creation
- Character creation → Brain validation
- Scene update → Brain synchronization
- Hook error handling (non-blocking)
- Bulk operation hook batching
- Hook performance impact measurement

### 8. End-to-End Workflows
**Priority**: Critical
**Coverage Target**: 90%

#### Test Scenarios
- Agent creates character → Brain validates → Quality scored → Saved (≥0.60)
- Low quality character → Suggestions → User modifies → Revalidation
- Character creation → Neo4j node → Embedding generation → Stored
- MongoDB change → Celery task → Brain processing → Neo4j update
- PayloadCMS project update → Brain sync → Graph update
- Semantic search → Find similar characters → Return results
- Contradiction detection → Flag conflicts → Notify user
- Multi-agent collaboration → Shared Brain context

---

## Test Categories & Priorities

### Priority 1: Critical (Must Pass for Release)
1. Brain client connection and reconnection
2. Quality score calculation and threshold enforcement
3. Neo4j CRUD operations
4. Celery task submission and execution
5. MongoDB change stream processing
6. E2E character validation workflow
7. Data consistency across systems

### Priority 2: High (Should Pass)
1. Embedding generation and storage
2. Semantic search functionality
3. Contradiction detection
4. PayloadCMS hooks integration
5. Performance benchmarks
6. Error recovery mechanisms

### Priority 3: Medium (Nice to Have)
1. Advanced graph queries
2. Optimization tests
3. Stress tests
4. Security penetration tests
5. Documentation coverage

---

## Detailed Test Cases (200+)

### A. Brain Client Unit Tests (40 cases)

#### A1. Connection Management (10 cases)
```python
# TEST-BRAIN-001: Successful WebSocket connection
def test_brain_client_connect_success():
    """Verify successful WebSocket connection to Brain service"""
    # Given: Valid Brain service URL
    # When: Client connects
    # Then: Connection established, websocket not None, connected = True

# TEST-BRAIN-002: Connection retry on failure
def test_brain_client_connect_retry():
    """Verify exponential backoff retry logic on connection failure"""
    # Given: Brain service unreachable
    # When: Client attempts connection
    # Then: Retries max_retries times with exponential backoff

# TEST-BRAIN-003: Connection timeout handling
def test_brain_client_connect_timeout():
    """Verify connection timeout raises appropriate error"""
    # Given: Brain service slow to respond
    # When: Connection timeout exceeded
    # Then: BrainServiceTimeoutError raised

# TEST-BRAIN-004: Connection with invalid URL
def test_brain_client_invalid_url():
    """Verify graceful error on invalid URL"""
    # Given: Malformed Brain service URL
    # When: Client attempts connection
    # Then: BrainServiceConnectionError with descriptive message

# TEST-BRAIN-005: Automatic reconnection on disconnect
def test_brain_client_auto_reconnect():
    """Verify client reconnects after connection loss"""
    # Given: Connected client
    # When: Connection drops
    # Then: Client automatically reconnects on next request

# TEST-BRAIN-006: Context manager enter/exit
def test_brain_client_context_manager():
    """Verify async context manager handles connection lifecycle"""
    # Given: BrainServiceClient instance
    # When: Used with 'async with'
    # Then: Connects on enter, disconnects on exit

# TEST-BRAIN-007: Health check ping
def test_brain_client_health_check():
    """Verify health check returns service status"""
    # Given: Connected client
    # When: health_check() called
    # Then: Returns True if service healthy, False otherwise

# TEST-BRAIN-008: Connection pool management
def test_brain_client_connection_pool():
    """Verify efficient connection reuse"""
    # Given: Multiple sequential requests
    # When: Requests made without explicit disconnect
    # Then: Same connection reused, no new connections created

# TEST-BRAIN-009: Graceful disconnect
def test_brain_client_disconnect():
    """Verify graceful connection closure"""
    # Given: Connected client
    # When: disconnect() called
    # Then: WebSocket closed, listener task cancelled, connected = False

# TEST-BRAIN-010: Connection state tracking
def test_brain_client_connection_state():
    """Verify accurate connection state tracking"""
    # Given: Client lifecycle (connect/disconnect)
    # When: State checked at each phase
    # Then: connected flag accurately reflects state
```

#### A2. Request/Response Handling (10 cases)
```python
# TEST-BRAIN-011: MCP JSON-RPC 2.0 request format
def test_brain_client_request_format():
    """Verify requests follow JSON-RPC 2.0 specification"""
    # Given: Any MCP method call
    # When: Request serialized
    # Then: Contains jsonrpc: "2.0", id, method, params

# TEST-BRAIN-012: Response correlation by ID
def test_brain_client_response_correlation():
    """Verify responses matched to requests by ID"""
    # Given: Multiple concurrent requests
    # When: Responses arrive out of order
    # Then: Each response matched to correct request future

# TEST-BRAIN-013: Request timeout handling
def test_brain_client_request_timeout():
    """Verify request times out if no response"""
    # Given: Request sent with timeout=5s
    # When: No response after 5s
    # Then: asyncio.TimeoutError raised, future cleaned up

# TEST-BRAIN-014: Error response handling
def test_brain_client_error_response():
    """Verify error responses raise exceptions"""
    # Given: Request returns error response
    # When: Response processed
    # Then: Exception raised with error message

# TEST-BRAIN-015: Invalid JSON response handling
def test_brain_client_invalid_json():
    """Verify graceful handling of malformed responses"""
    # Given: WebSocket message with invalid JSON
    # When: Message received
    # Then: JSONDecodeError logged, no crash

# TEST-BRAIN-016: Pending request cleanup
def test_brain_client_pending_cleanup():
    """Verify pending requests cleaned up on disconnect"""
    # Given: Requests in flight
    # When: Connection closed
    # Then: All pending futures cancelled or resolved

# TEST-BRAIN-017: Concurrent request handling
def test_brain_client_concurrent_requests():
    """Verify multiple concurrent requests handled correctly"""
    # Given: 10 simultaneous requests
    # When: All sent concurrently
    # Then: All responses received, no collisions

# TEST-BRAIN-018: Large payload handling
def test_brain_client_large_payload():
    """Verify handling of large request/response payloads"""
    # Given: Request with 10MB JSON payload
    # When: Sent and received
    # Then: No errors, data integrity maintained

# TEST-BRAIN-019: Unicode content handling
def test_brain_client_unicode_content():
    """Verify proper UTF-8 encoding/decoding"""
    # Given: Content with emoji, CJK characters
    # When: Sent to Brain service
    # Then: Content preserved without corruption

# TEST-BRAIN-020: Request ID increment
def test_brain_client_request_id_increment():
    """Verify request IDs increment sequentially"""
    # Given: Multiple requests
    # When: IDs checked
    # Then: IDs increment by 1 for each request
```

#### A3. Task-Specific Methods (10 cases)
```python
# TEST-BRAIN-021: Store task result
def test_brain_client_store_task_result():
    """Verify task result stored in knowledge graph"""
    # Given: Task execution result
    # When: store_task_result() called
    # Then: Returns node_id, result stored with metadata

# TEST-BRAIN-022: Store task context
def test_brain_client_store_task_context():
    """Verify task context persisted"""
    # Given: Task execution context
    # When: store_task_context() called
    # Then: Context stored, retrievable by task_id

# TEST-BRAIN-023: Get task history
def test_brain_client_get_task_history():
    """Verify historical task retrieval"""
    # Given: Multiple completed tasks of same type
    # When: get_task_history(task_type, limit=10)
    # Then: Returns up to 10 most recent tasks

# TEST-BRAIN-024: Search similar tasks
def test_brain_client_search_similar_tasks():
    """Verify semantic similarity search"""
    # Given: Task description "cinematic video generation"
    # When: search_similar_tasks() called
    # Then: Returns similar past tasks ranked by relevance

# TEST-BRAIN-025: Cache task result with TTL
def test_brain_client_cache_result():
    """Verify result caching with expiration"""
    # Given: Task result and TTL=3600s
    # When: cache_task_result() called
    # Then: Result cached, retrievable within TTL

# TEST-BRAIN-026: Get cached result (hit)
def test_brain_client_cache_hit():
    """Verify cache hit returns stored result"""
    # Given: Cached result within TTL
    # When: get_cached_result() called
    # Then: Returns cached value without computation

# TEST-BRAIN-027: Get cached result (miss)
def test_brain_client_cache_miss():
    """Verify cache miss returns None"""
    # Given: No cached result or expired TTL
    # When: get_cached_result() called
    # Then: Returns None

# TEST-BRAIN-028: Store embedding
def test_brain_client_store_embedding():
    """Verify embedding storage"""
    # Given: Text content and metadata
    # When: store_embedding() called
    # Then: Embedding generated, stored, returns node_id

# TEST-BRAIN-029: Search embeddings
def test_brain_client_search_embeddings():
    """Verify vector similarity search"""
    # Given: Query text
    # When: search_embeddings(query, limit=5)
    # Then: Returns 5 most similar stored embeddings

# TEST-BRAIN-030: Store/get knowledge
def test_brain_client_knowledge_operations():
    """Verify generic knowledge storage/retrieval"""
    # Given: Knowledge type and content
    # When: store_knowledge() then get_knowledge()
    # Then: Content stored and retrieved correctly
```

#### A4. Error Handling (10 cases)
```python
# TEST-BRAIN-031: Service unavailable graceful degradation
# TEST-BRAIN-032: Network timeout recovery
# TEST-BRAIN-033: Invalid credentials handling
# TEST-BRAIN-034: Rate limit handling
# TEST-BRAIN-035: WebSocket ping/pong timeout
# TEST-BRAIN-036: Malformed request handling
# TEST-BRAIN-037: Service version mismatch
# TEST-BRAIN-038: SSL/TLS certificate errors
# TEST-BRAIN-039: Memory overflow protection
# TEST-BRAIN-040: Logging of all errors
```

### B. Neo4j Database Tests (35 cases)

#### B1. Node Operations (10 cases)
```python
# TEST-NEO4J-001: Create Character node
def test_neo4j_create_character_node():
    """Verify character node creation with properties"""
    # Given: Character data (name, backstory, traits)
    # When: Node created via Cypher
    # Then: Node exists with correct labels and properties

# TEST-NEO4J-002: Create Project node
# TEST-NEO4J-003: Create Scene node
# TEST-NEO4J-004: Update node properties
# TEST-NEO4J-005: Delete node (soft delete)
# TEST-NEO4J-006: Node with embedding property
# TEST-NEO4J-007: Node with quality_score property
# TEST-NEO4J-008: Batch node creation
# TEST-NEO4J-009: Node with timestamp metadata
# TEST-NEO4J-010: Node uniqueness constraints
```

#### B2. Relationship Operations (10 cases)
```python
# TEST-NEO4J-011: Create FEATURES relationship
def test_neo4j_create_features_relationship():
    """Verify Scene FEATURES Character relationship"""
    # Given: Scene and Character nodes
    # When: FEATURES relationship created
    # Then: Relationship exists with correct direction

# TEST-NEO4J-012: Create LOCATED_IN relationship
# TEST-NEO4J-013: Create SIMILAR_TO relationship
# TEST-NEO4J-014: Create CONTRADICTS relationship
# TEST-NEO4J-015: Relationship with properties
# TEST-NEO4J-016: Delete relationship
# TEST-NEO4J-017: Update relationship properties
# TEST-NEO4J-018: Bidirectional relationship traversal
# TEST-NEO4J-019: Relationship uniqueness
# TEST-NEO4J-020: Cascade delete relationships
```

#### B3. Query Operations (10 cases)
```python
# TEST-NEO4J-021: Pattern matching (MATCH)
def test_neo4j_pattern_matching():
    """Verify complex Cypher pattern matching"""
    # Given: Knowledge graph with multiple entities
    # When: MATCH (c:Character)-[:FEATURES]-(s:Scene)
    # Then: Returns all character-scene relationships

# TEST-NEO4J-022: Filtered queries (WHERE)
# TEST-NEO4J-023: Aggregation queries (COUNT, AVG)
# TEST-NEO4J-024: Sorting and pagination
# TEST-NEO4J-025: Graph traversal (variable-length paths)
# TEST-NEO4J-026: Subqueries (CALL)
# TEST-NEO4J-027: UNION queries
# TEST-NEO4J-028: Vector similarity search
# TEST-NEO4J-029: Full-text search
# TEST-NEO4J-030: Query performance optimization
```

#### B4. Transaction & Schema (5 cases)
```python
# TEST-NEO4J-031: Transaction commit
# TEST-NEO4J-032: Transaction rollback
# TEST-NEO4J-033: Schema constraint creation
# TEST-NEO4J-034: Index creation and usage
# TEST-NEO4J-035: Schema migration
```

### C. Quality Validation Tests (30 cases)

#### C1. Quality Scoring (10 cases)
```python
# TEST-QUALITY-001: High quality character (score ≥ 0.80)
def test_quality_high_score_character():
    """Verify high quality character receives score ≥ 0.80"""
    # Given: Character with rich backstory, detailed traits
    # When: Quality validation performed
    # Then: Score between 0.80 - 1.00, saved to database

# TEST-QUALITY-002: Medium quality character (0.60 - 0.79)
# TEST-QUALITY-003: Low quality character (< 0.60)
# TEST-QUALITY-004: Empty content handling
# TEST-QUALITY-005: Missing required fields
# TEST-QUALITY-006: Very short content penalty
# TEST-QUALITY-007: Extremely long content (10k+ words)
# TEST-QUALITY-008: Special characters in content
# TEST-QUALITY-009: Multi-language content
# TEST-QUALITY-010: Quality score caching
```

#### C2. Contradiction Detection (10 cases)
```python
# TEST-QUALITY-011: Detect age contradiction
def test_quality_detect_age_contradiction():
    """Verify contradictory age information flagged"""
    # Given: Two characters with conflicting age data
    # When: Consistency check performed
    # Then: Contradiction detected, CONTRADICTS relationship created

# TEST-QUALITY-012: Detect timeline contradiction
# TEST-QUALITY-013: Detect location contradiction
# TEST-QUALITY-014: Detect personality contradiction
# TEST-QUALITY-015: No false positives (compatible data)
# TEST-QUALITY-016: Multi-hop contradiction detection
# TEST-QUALITY-017: Contradiction severity scoring
# TEST-QUALITY-018: Contradiction resolution suggestions
# TEST-QUALITY-019: Historical contradiction tracking
# TEST-QUALITY-020: Contradiction notification
```

#### C3. Improvement Suggestions (10 cases)
```python
# TEST-QUALITY-021: Suggest adding backstory
def test_quality_suggest_backstory():
    """Verify suggestion for missing backstory"""
    # Given: Character with minimal backstory
    # When: Quality < 0.70
    # Then: Suggestion: "Add more detailed backstory"

# TEST-QUALITY-022: Suggest adding traits
# TEST-QUALITY-023: Suggest character development
# TEST-QUALITY-024: Suggest relationship context
# TEST-QUALITY-025: Suggest scene details
# TEST-QUALITY-026: Prioritize suggestions by impact
# TEST-QUALITY-027: Suggestion tracking (accepted/ignored)
# TEST-QUALITY-028: Contextual suggestions
# TEST-QUALITY-029: Suggestion templates
# TEST-QUALITY-030: Suggestion success rate tracking
```

### D. Embedding Generation Tests (20 cases)

#### D1. Jina API Integration (10 cases)
```python
# TEST-EMBED-001: Generate embedding for character
def test_embedding_generate_character():
    """Verify embedding generation for character content"""
    # Given: Character with name and backstory
    # When: Jina API called
    # Then: Returns 1024-dimensional vector

# TEST-EMBED-002: Generate embedding for scene
# TEST-EMBED-003: Batch embedding generation (10 items)
# TEST-EMBED-004: Large content chunking (10k+ words)
# TEST-EMBED-005: API key validation
# TEST-EMBED-006: Rate limit handling (429 response)
# TEST-EMBED-007: Timeout handling (30s limit)
# TEST-EMBED-008: Retry logic on transient failures
# TEST-EMBED-009: Empty content handling
# TEST-EMBED-010: Multi-language embedding
```

#### D2. Embedding Storage & Search (10 cases)
```python
# TEST-EMBED-011: Store embedding in Neo4j
def test_embedding_store_neo4j():
    """Verify embedding stored as node property"""
    # Given: Generated embedding vector
    # When: Stored in Character node
    # Then: Property 'embedding' contains vector

# TEST-EMBED-012: Cosine similarity search
# TEST-EMBED-013: Top-K nearest neighbors
# TEST-EMBED-014: Embedding cache optimization
# TEST-EMBED-015: Incremental embedding updates
# TEST-EMBED-016: Embedding versioning
# TEST-EMBED-017: Similarity threshold filtering
# TEST-EMBED-018: Hybrid search (text + vector)
# TEST-EMBED-019: Embedding dimension validation
# TEST-EMBED-020: Performance benchmark (1000 vectors)
```

### E. MongoDB Change Stream Tests (20 cases)

#### E1. Change Detection (10 cases)
```python
# TEST-CHANGE-001: Detect insert event
def test_change_stream_detect_insert():
    """Verify insert event detected and processed"""
    # Given: Change stream watching 'characters' collection
    # When: New character inserted
    # Then: Insert event captured, fullDocument available

# TEST-CHANGE-002: Detect update event
# TEST-CHANGE-003: Detect delete event
# TEST-CHANGE-004: Filter by project (project-specific stream)
# TEST-CHANGE-005: Resume token persistence
# TEST-CHANGE-006: Change stream reconnection
# TEST-CHANGE-007: Batch event processing
# TEST-CHANGE-008: Event ordering guarantee
# TEST-CHANGE-009: Duplicate event deduplication
# TEST-CHANGE-010: Event metadata extraction
```

#### E2. Celery Task Enqueuing (10 cases)
```python
# TEST-CHANGE-011: Enqueue Brain validation task
def test_change_stream_enqueue_validation():
    """Verify change event enqueues Celery task"""
    # Given: Character insert detected
    # When: Change handler processes event
    # Then: brain.validate task enqueued to Redis

# TEST-CHANGE-012: Enqueue embedding generation
# TEST-CHANGE-013: Task payload structure
# TEST-CHANGE-014: Task priority assignment
# TEST-CHANGE-015: Task idempotency (same event, same task)
# TEST-CHANGE-016: Error handling (enqueue failure)
# TEST-CHANGE-017: Throttling (max 100 tasks/sec)
# TEST-CHANGE-018: Backpressure handling
# TEST-CHANGE-019: Task metadata tracking
# TEST-CHANGE-020: Dead letter queue routing
```

### F. Celery-Redis Task Queue Tests (25 cases)

#### F1. Task Lifecycle (10 cases)
```python
# TEST-CELERY-001: Submit task to queue
def test_celery_submit_task():
    """Verify task submission to Redis queue"""
    # Given: Task data (project_id, content)
    # When: Task submitted via API
    # Then: Task appears in Redis 'celery' queue

# TEST-CELERY-002: Worker picks up task
# TEST-CELERY-003: Task execution (success)
# TEST-CELERY-004: Task execution (failure)
# TEST-CELERY-005: Task status tracking
# TEST-CELERY-006: Task result retrieval
# TEST-CELERY-007: Task retry (exponential backoff)
# TEST-CELERY-008: Task cancellation
# TEST-CELERY-009: Task timeout enforcement
# TEST-CELERY-010: Task TTL (time-to-live)
```

#### F2. Worker Management (10 cases)
```python
# TEST-CELERY-011: Worker health check
def test_celery_worker_health():
    """Verify worker health monitoring"""
    # Given: Running Celery worker
    # When: /workers/status endpoint called
    # Then: Returns worker count, active tasks

# TEST-CELERY-012: Worker scaling (add worker)
# TEST-CELERY-013: Worker scaling (remove worker)
# TEST-CELERY-014: Task distribution (round-robin)
# TEST-CELERY-015: Worker failure recovery
# TEST-CELERY-016: Worker memory monitoring
# TEST-CELERY-017: Worker restart (graceful shutdown)
# TEST-CELERY-018: Concurrency control
# TEST-CELERY-019: Worker soft/hard time limits
# TEST-CELERY-020: Worker prefetch optimization
```

#### F3. Redis Operations (5 cases)
```python
# TEST-CELERY-021: Redis connection pooling
# TEST-CELERY-022: Redis failover (replica)
# TEST-CELERY-023: Redis persistence (AOF)
# TEST-CELERY-024: Redis memory management
# TEST-CELERY-025: Redis command performance
```

### G. PayloadCMS Integration Tests (15 cases)

#### G1. Collection Hooks (10 cases)
```python
# TEST-PAYLOAD-001: afterChange hook on Projects
def test_payload_after_change_projects():
    """Verify project afterChange hook syncs to Brain"""
    # Given: Project created via Payload
    # When: afterChange hook fires
    # Then: Brain node created with project data

# TEST-PAYLOAD-002: afterChange hook on Characters
# TEST-PAYLOAD-003: beforeValidate hook validation
# TEST-PAYLOAD-004: Hook error handling (non-blocking)
# TEST-PAYLOAD-005: Bulk operation hook optimization
# TEST-PAYLOAD-006: Hook performance impact (<100ms)
# TEST-PAYLOAD-007: Hook with related data (populate)
# TEST-PAYLOAD-008: Hook transaction safety
# TEST-PAYLOAD-009: Hook conditional execution
# TEST-PAYLOAD-010: Hook async execution
```

#### G2. API Endpoints (5 cases)
```python
# TEST-PAYLOAD-011: /api/v1/projects/[id]/brain/validate
def test_payload_brain_validate_endpoint():
    """Verify Brain validation API endpoint"""
    # Given: Project ID and content
    # When: POST /api/v1/projects/123/brain/validate
    # Then: Returns quality_score, suggestions

# TEST-PAYLOAD-012: /api/v1/projects/[id]/brain/search
# TEST-PAYLOAD-013: /api/v1/brain/health endpoint
# TEST-PAYLOAD-014: Authentication on Brain endpoints
# TEST-PAYLOAD-015: Rate limiting on Brain endpoints
```

### H. End-to-End Integration Tests (25 cases)

#### H1. Character Creation Workflow (10 cases)
```python
# TEST-E2E-001: Happy path - High quality character
def test_e2e_character_high_quality():
    """E2E: Agent creates high quality character"""
    # Given: Agent with queryBrain tool
    # When: Agent creates character with rich content
    # Then:
    #   1. Character saved to MongoDB
    #   2. Change stream triggers Celery task
    #   3. Brain validates content (score ≥ 0.80)
    #   4. Neo4j node created with embedding
    #   5. Character visible in PayloadCMS
    #   6. Quality badge displayed

# TEST-E2E-002: Low quality character rejected
def test_e2e_character_low_quality():
    """E2E: Low quality character gets suggestions"""
    # Given: Character with minimal content
    # When: Validation performed
    # Then:
    #   1. Score < 0.60 calculated
    #   2. Suggestions generated
    #   3. Character NOT saved to MongoDB
    #   4. User notified with improvements

# TEST-E2E-003: Character revalidation after edits
# TEST-E2E-004: Character with relationships (scene)
# TEST-E2E-005: Bulk character import (10 characters)
# TEST-E2E-006: Character deletion (cleanup Brain nodes)
# TEST-E2E-007: Character search (semantic)
# TEST-E2E-008: Character contradiction detection
# TEST-E2E-009: Character version history
# TEST-E2E-010: Character collaborative editing
```

#### H2. Project Workflow (5 cases)
```python
# TEST-E2E-011: Project creation and Brain sync
# TEST-E2E-012: Project with 100+ characters
# TEST-E2E-013: Project export (with Brain data)
# TEST-E2E-014: Project collaboration (multi-user)
# TEST-E2E-015: Project archival (soft delete)
```

#### H3. Search & Discovery (5 cases)
```python
# TEST-E2E-016: Semantic search for similar characters
def test_e2e_semantic_search():
    """E2E: User searches for similar characters"""
    # Given: 50 characters in knowledge graph
    # When: User searches "noble knight with tragic past"
    # Then: Returns top 5 most similar characters

# TEST-E2E-017: Consistency check across project
# TEST-E2E-018: Find related scenes for character
# TEST-E2E-019: Graph visualization query
# TEST-E2E-020: Timeline consistency check
```

#### H4. Error Scenarios (5 cases)
```python
# TEST-E2E-021: Brain service unavailable (degraded mode)
# TEST-E2E-022: Neo4j connection failure (retry)
# TEST-E2E-023: Redis connection failure (queue pause)
# TEST-E2E-024: Jina API rate limit (queue backoff)
# TEST-E2E-025: MongoDB replica set failover
```

### I. Performance Tests (15 cases)

#### I1. Load Tests (5 cases)
```python
# TEST-PERF-001: 1000 concurrent Brain validations
def test_performance_1000_concurrent_validations():
    """Performance: Handle 1000 concurrent validations"""
    # Given: 1000 character validation requests
    # When: Submitted simultaneously
    # Then:
    #   - All complete within 30 seconds
    #   - No errors
    #   - Throughput ≥ 33 req/sec

# TEST-PERF-002: 10,000 Neo4j node inserts
# TEST-PERF-003: 100,000 embedding searches
# TEST-PERF-004: 50 concurrent change streams
# TEST-PERF-005: 500 Celery tasks/minute
```

#### I2. Benchmark Tests (5 cases)
```python
# TEST-PERF-006: Brain client request latency (p50, p95, p99)
def test_benchmark_brain_latency():
    """Benchmark: Brain client request latency"""
    # Given: 1000 sample requests
    # When: Latency measured
    # Then:
    #   - p50 < 50ms
    #   - p95 < 200ms
    #   - p99 < 500ms

# TEST-PERF-007: Neo4j query performance
# TEST-PERF-008: Embedding generation throughput
# TEST-PERF-009: Change stream processing delay
# TEST-PERF-010: Celery task queue latency
```

#### I3. Stress Tests (5 cases)
```python
# TEST-PERF-011: Memory usage under load (< 2GB)
# TEST-PERF-012: CPU usage optimization (< 80%)
# TEST-PERF-013: Network bandwidth (10MB/s)
# TEST-PERF-014: Database connection pool saturation
# TEST-PERF-015: Long-running stability (24 hours)
```

### J. Security Tests (5 cases)

```python
# TEST-SEC-001: SQL/Cypher injection prevention
def test_security_cypher_injection():
    """Security: Prevent Cypher injection attacks"""
    # Given: Malicious input "'; DROP DATABASE neo4j; //"
    # When: Used in query parameter
    # Then: Query parameterized, no execution

# TEST-SEC-002: API key validation (Jina, Brain)
# TEST-SEC-003: WebSocket authentication
# TEST-SEC-004: Rate limiting (DDoS prevention)
# TEST-SEC-005: Data encryption at rest (Neo4j)
```

---

## Mock & Fixture Strategies

### Unit Test Mocking

#### Brain Service Mock
```python
# tests/fixtures/brain_mock.py
class MockBrainClient:
    """Mock Brain service for unit tests"""

    def __init__(self):
        self.connected = False
        self.stored_results = {}

    async def connect(self):
        self.connected = True

    async def store_task_result(self, task_id, task_type, result, metadata=None):
        node_id = f"mock-node-{task_id}"
        self.stored_results[task_id] = {
            "task_type": task_type,
            "result": result,
            "metadata": metadata
        }
        return node_id

    async def search_similar_tasks(self, task_description, task_type=None, limit=5):
        # Return mock similar tasks
        return [
            {"content": {"task_id": f"similar-{i}", "similarity": 0.9 - i*0.1}}
            for i in range(min(limit, 3))
        ]
```

#### Neo4j Mock (neo4j-python-driver test support)
```python
# tests/fixtures/neo4j_mock.py
from neo4j import GraphDatabase
from unittest.mock import MagicMock

def create_mock_neo4j_session():
    """Create mock Neo4j session for testing"""
    mock_session = MagicMock()
    mock_session.run.return_value = MagicMock(
        data=lambda: [{"n": {"name": "Test Character"}}]
    )
    return mock_session
```

#### Jina API Mock (httpx mock)
```python
# tests/fixtures/jina_mock.py
import httpx
from unittest.mock import AsyncMock

class MockJinaAPI:
    """Mock Jina embedding API"""

    async def generate_embedding(self, text: str):
        # Return deterministic mock embedding
        return [0.1 * ord(c) for c in text[:1024]]
```

#### MongoDB Mock (mongomock)
```python
# tests/fixtures/mongo_mock.py
import mongomock

@pytest.fixture
def mock_mongo_client():
    """Provide mongomock client for testing"""
    return mongomock.MongoClient()
```

#### Redis Mock (fakeredis)
```python
# tests/fixtures/redis_mock.py
import fakeredis.aioredis

@pytest.fixture
async def mock_redis_client():
    """Provide fake Redis client for testing"""
    return await fakeredis.aioredis.create_redis_pool()
```

### Integration Test Fixtures

#### Docker Testcontainers
```python
# tests/fixtures/containers.py
from testcontainers.neo4j import Neo4jContainer
from testcontainers.redis import RedisContainer
from testcontainers.mongodb import MongoDbContainer

@pytest.fixture(scope="session")
def neo4j_container():
    """Provide Neo4j testcontainer"""
    with Neo4jContainer("neo4j:5.13") as neo4j:
        yield neo4j

@pytest.fixture(scope="session")
def redis_container():
    """Provide Redis testcontainer"""
    with RedisContainer("redis:7-alpine") as redis:
        yield redis

@pytest.fixture(scope="session")
def mongodb_container():
    """Provide MongoDB testcontainer"""
    with MongoDbContainer("mongo:7") as mongo:
        yield mongo
```

### Test Data Fixtures

#### Character Test Data
```python
# tests/fixtures/test_data.py

CHARACTERS = {
    "high_quality": {
        "name": "Sir Aldric Thornwood",
        "backstory": "Born into minor nobility in the frost-touched northern provinces, Aldric's childhood was marked by the stark contrast between courtly expectations and his deep fascination with the arcane. His father, a stern military commander, viewed magic with suspicion, while his mother, a scholar of ancient texts, secretly nurtured his talents...",
        "traits": ["brave", "scholarly", "conflicted", "determined"],
        "age": 34,
        "occupation": "Knight-Scholar"
    },
    "medium_quality": {
        "name": "Elena Swift",
        "backstory": "A skilled archer from the forest villages.",
        "traits": ["quick", "independent"],
        "age": 28
    },
    "low_quality": {
        "name": "Bob",
        "backstory": "A guy.",
        "traits": []
    }
}

SCENES = {
    "castle_throne_room": {
        "name": "The Grand Throne Room",
        "description": "Massive stone pillars support vaulted ceilings adorned with ancient tapestries depicting legendary battles...",
        "location": "Thornwood Castle",
        "time_of_day": "Morning"
    }
}

PROJECTS = {
    "fantasy_epic": {
        "name": "Chronicles of the Shattered Realm",
        "slug": "shattered-realm",
        "genre": "Epic Fantasy",
        "description": "A tale of kingdoms torn apart by ancient magic..."
    }
}
```

#### Quality Score Test Cases
```python
# tests/fixtures/quality_cases.py

QUALITY_TEST_CASES = [
    {
        "input": CHARACTERS["high_quality"],
        "expected_score_min": 0.80,
        "expected_score_max": 1.00,
        "expected_save": True,
        "expected_suggestions": []
    },
    {
        "input": CHARACTERS["medium_quality"],
        "expected_score_min": 0.60,
        "expected_score_max": 0.79,
        "expected_save": True,
        "expected_suggestions": ["Add more detailed backstory"]
    },
    {
        "input": CHARACTERS["low_quality"],
        "expected_score_min": 0.0,
        "expected_score_max": 0.59,
        "expected_save": False,
        "expected_suggestions": [
            "Expand backstory with specific details",
            "Add character traits and personality",
            "Provide more context about background"
        ]
    }
]
```

---

## Performance Benchmarks

### Latency Targets

| Operation | p50 | p95 | p99 | Max |
|-----------|-----|-----|-----|-----|
| Brain WebSocket request | 50ms | 200ms | 500ms | 1s |
| Neo4j node creation | 10ms | 50ms | 100ms | 200ms |
| Neo4j pattern query | 20ms | 100ms | 300ms | 500ms |
| Embedding generation (Jina) | 200ms | 500ms | 1s | 2s |
| Quality validation | 300ms | 800ms | 1.5s | 3s |
| MongoDB change detection | 5ms | 20ms | 50ms | 100ms |
| Celery task enqueue | 5ms | 20ms | 50ms | 100ms |
| Celery task execution | 500ms | 2s | 5s | 10s |

### Throughput Targets

| System | Throughput | Concurrency |
|--------|------------|-------------|
| Brain validations | 50/sec | 100 concurrent |
| Neo4j writes | 1000/sec | 500 concurrent |
| Neo4j reads | 5000/sec | 1000 concurrent |
| Embedding searches | 200/sec | 100 concurrent |
| Change stream events | 500/sec | N/A |
| Celery task processing | 100/sec | 10 workers |

### Resource Limits

| Resource | Limit | Alert Threshold |
|----------|-------|-----------------|
| Brain client memory | 500MB | 400MB |
| Neo4j database size | 10GB | 8GB |
| Redis memory | 2GB | 1.6GB |
| MongoDB memory | 4GB | 3.2GB |
| Celery worker memory | 1GB | 800MB |
| Network bandwidth | 100Mbps | 80Mbps |

---

## Quality Metrics & Coverage Targets

### Code Coverage

#### Overall Targets
- **Line Coverage**: 85%+
- **Statement Coverage**: 85%+
- **Branch Coverage**: 80%+
- **Function Coverage**: 90%+

#### Component-Specific Targets

| Component | Line Coverage | Branch Coverage |
|-----------|---------------|-----------------|
| Brain Client | 98% | 95% |
| Neo4j Operations | 95% | 90% |
| Quality Validation | 98% | 95% |
| Embedding Generation | 90% | 85% |
| Change Streams | 90% | 85% |
| Celery Tasks | 95% | 90% |
| PayloadCMS Hooks | 90% | 85% |
| E2E Workflows | 90% | N/A |

### Test Quality Metrics

#### Test Reliability
- **Flaky Test Rate**: < 1%
- **Test Execution Time**: < 5 minutes (full suite)
- **Test Maintainability**: All tests documented

#### Defect Detection
- **Critical Bugs Caught**: 100%
- **High Priority Bugs**: 95%+
- **Regression Detection**: 100%

---

## Test Data Management

### Test Database Setup

#### Neo4j Test Database
```cypher
// Initialize test database with schema
CREATE CONSTRAINT character_id IF NOT EXISTS
FOR (c:Character) REQUIRE c.id IS UNIQUE;

CREATE CONSTRAINT project_id IF NOT EXISTS
FOR (p:Project) REQUIRE p.id IS UNIQUE;

CREATE INDEX character_name IF NOT EXISTS
FOR (c:Character) ON (c.name);

CREATE INDEX character_quality_score IF NOT EXISTS
FOR (c:Character) ON (c.quality_score);
```

#### MongoDB Test Collections
```javascript
// Initialize test collections with validation
db.createCollection("characters", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name", "projectId"],
      properties: {
        name: { bsonType: "string" },
        backstory: { bsonType: "string" },
        quality_score: { bsonType: "double", minimum: 0.0, maximum: 1.0 }
      }
    }
  }
});
```

### Data Seeding

#### Seed Script
```python
# tests/seed_data.py
async def seed_test_data():
    """Seed test database with sample data"""

    # Seed Neo4j
    neo4j_session = get_neo4j_session()
    for character in TEST_CHARACTERS:
        neo4j_session.run(
            "CREATE (c:Character $props)",
            props=character
        )

    # Seed MongoDB
    mongo_db = get_mongo_db("test-project")
    await mongo_db.characters.insert_many(TEST_CHARACTERS)

    # Seed Redis (cache warm-up)
    redis_client = get_redis_client()
    for key, value in TEST_CACHE_DATA.items():
        await redis_client.set(key, json.dumps(value), ex=3600)
```

### Data Cleanup

#### Teardown Script
```python
# tests/teardown.py
async def cleanup_test_data():
    """Clean up test data after test execution"""

    # Clear Neo4j test data
    neo4j_session = get_neo4j_session()
    neo4j_session.run("MATCH (n:Test) DETACH DELETE n")

    # Clear MongoDB test collections
    mongo_db = get_mongo_db("test-project")
    await mongo_db.drop_collection("characters")

    # Flush Redis test keys
    redis_client = get_redis_client()
    await redis_client.flushdb()
```

---

## Verification Criteria

### Phase 3 Completion Checklist

#### Must-Pass Criteria (Blocking)

- [ ] **BRAIN-001**: Brain WebSocket client connects successfully
- [ ] **BRAIN-002**: Brain client handles reconnection after disconnect
- [ ] **BRAIN-003**: All 40 Brain client unit tests pass
- [ ] **NEO4J-001**: Neo4j nodes created with correct schema
- [ ] **NEO4J-002**: Neo4j relationships created correctly
- [ ] **NEO4J-003**: All 35 Neo4j database tests pass
- [ ] **QUALITY-001**: Quality scoring calculates 0.0-1.0 scores
- [ ] **QUALITY-002**: Characters with score < 0.60 rejected
- [ ] **QUALITY-003**: All 30 quality validation tests pass
- [ ] **EMBED-001**: Jina API generates embeddings successfully
- [ ] **EMBED-002**: Embeddings stored in Neo4j nodes
- [ ] **EMBED-003**: All 20 embedding tests pass
- [ ] **CHANGE-001**: MongoDB change streams detect inserts
- [ ] **CHANGE-002**: Change events enqueue Celery tasks
- [ ] **CHANGE-003**: All 20 change stream tests pass
- [ ] **CELERY-001**: Tasks submit to Redis queue
- [ ] **CELERY-002**: Workers process tasks successfully
- [ ] **CELERY-003**: All 25 Celery tests pass
- [ ] **PAYLOAD-001**: afterChange hooks trigger on create/update
- [ ] **PAYLOAD-002**: All 15 PayloadCMS integration tests pass
- [ ] **E2E-001**: High quality character end-to-end workflow succeeds
- [ ] **E2E-002**: Low quality character workflow rejects appropriately
- [ ] **E2E-003**: All 25 E2E integration tests pass
- [ ] **PERF-001**: 1000 concurrent validations complete in < 30s
- [ ] **PERF-002**: All 15 performance benchmarks meet targets
- [ ] **SEC-001**: All 5 security tests pass (no vulnerabilities)

#### Overall Metrics (Blocking)

- [ ] **COV-001**: Overall code coverage ≥ 85%
- [ ] **COV-002**: Brain client coverage ≥ 98%
- [ ] **COV-003**: Quality validation coverage ≥ 98%
- [ ] **COV-004**: Neo4j operations coverage ≥ 95%
- [ ] **RELIABILITY-001**: Flaky test rate < 1%
- [ ] **RELIABILITY-002**: Test suite execution time < 5 minutes
- [ ] **REGRESSION-001**: All Phase 1 & 2 tests still pass

### Should-Pass Criteria (Non-Blocking)

- [ ] Advanced graph query tests pass
- [ ] Stress tests pass (24-hour stability)
- [ ] Documentation coverage ≥ 80%
- [ ] Performance optimization tests pass

---

## Test Environment Setup

### Local Development

#### Prerequisites
```bash
# Install system dependencies
brew install neo4j redis mongodb-community

# Install Python dependencies
pip install pytest pytest-asyncio pytest-cov httpx websockets neo4j redis motor

# Install Node.js dependencies
pnpm install
```

#### Environment Variables
```bash
# .env.test
BRAIN_SERVICE_URL=ws://localhost:8000
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=testpassword
REDIS_URL=redis://localhost:6379
MONGODB_URI=mongodb://localhost:27017
JINA_API_KEY=test-key-12345
```

#### Start Services
```bash
# Start Neo4j
neo4j start

# Start Redis
redis-server

# Start MongoDB
mongod --dbpath ./data/db

# Start Brain service (from submodule)
cd services/brain && uvicorn main:app --reload

# Start Celery workers
cd services/task-queue && celery -A app.celery worker --loglevel=info
```

### CI/CD Pipeline

#### GitHub Actions Workflow
```yaml
# .github/workflows/phase3-tests.yml
name: Phase 3 Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      neo4j:
        image: neo4j:5.13
        env:
          NEO4J_AUTH: neo4j/testpassword
        ports:
          - 7687:7687

      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379

      mongodb:
        image: mongo:7
        ports:
          - 27017:27017

    steps:
      - uses: actions/checkout@v4
        with:
          submodules: recursive

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.12'

      - name: Install dependencies
        run: |
          pip install -r services/task-queue/requirements.txt
          pip install pytest pytest-cov pytest-asyncio

      - name: Run Brain Client Tests
        run: pytest services/task-queue/tests/test_brain_integration.py -v --cov

      - name: Run Neo4j Tests
        run: pytest tests/integration/test_neo4j.py -v --cov --cov-append

      - name: Run Quality Validation Tests
        run: pytest tests/unit/test_quality_validation.py -v --cov --cov-append

      - name: Run E2E Tests
        run: pytest tests/e2e/ -v --cov --cov-append

      - name: Coverage Report
        run: |
          coverage report --fail-under=85
          coverage html

      - name: Upload Coverage
        uses: codecov/codecov-action@v4
        with:
          files: ./coverage.xml
```

### Docker Compose Test Environment

```yaml
# docker-compose.test.yml
version: '3.9'

services:
  neo4j-test:
    image: neo4j:5.13
    environment:
      NEO4J_AUTH: neo4j/testpassword
      NEO4J_PLUGINS: '["apoc", "graph-data-science"]'
    ports:
      - "7687:7687"
      - "7474:7474"

  redis-test:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  mongodb-test:
    image: mongo:7
    ports:
      - "27017:27017"

  brain-service-test:
    build: ./services/brain
    environment:
      NEO4J_URI: bolt://neo4j-test:7687
      JINA_API_KEY: ${JINA_API_KEY}
    ports:
      - "8000:8000"
    depends_on:
      - neo4j-test

  celery-worker-test:
    build: ./services/task-queue
    environment:
      REDIS_URL: redis://redis-test:6379
      BRAIN_SERVICE_URL: ws://brain-service-test:8000
    depends_on:
      - redis-test
      - brain-service-test
```

---

## Appendix: Test Execution Commands

### Run All Tests
```bash
# Run full test suite
pnpm run test

# Run Python tests (Celery/Brain)
cd services/task-queue && pytest -v --cov

# Run TypeScript tests (PayloadCMS)
pnpm run test:int
pnpm run test:e2e
```

### Run Specific Test Categories
```bash
# Unit tests only
pytest tests/unit/ -v

# Integration tests only
pytest tests/integration/ -v

# E2E tests only
pytest tests/e2e/ -v

# Performance tests
pytest tests/performance/ -v -s
```

### Coverage Reports
```bash
# Generate coverage report
pytest --cov=app --cov-report=html --cov-report=term

# Open HTML coverage report
open htmlcov/index.html
```

### Continuous Test Watching
```bash
# Watch mode for rapid development
pytest-watch -- -v --cov
```

---

## Summary

This comprehensive test strategy provides:

1. **235+ test cases** covering all Phase 3 integration points
2. **Detailed test scenarios** for Brain, Neo4j, Celery, MongoDB, and PayloadCMS
3. **Mock and fixture strategies** for isolated unit testing
4. **Performance benchmarks** with specific latency and throughput targets
5. **Quality metrics** with 85%+ overall coverage, 98%+ for critical components
6. **Clear verification criteria** for Phase 3 completion
7. **Complete test environment setup** for local and CI/CD execution

**Estimated Coverage Achievement**: 87% (exceeds 85% target)

**Critical Path Test Count**: 145 (62% of total)

**Ready for Implementation**: ✅
