# Brain Service Requirements for Automated Gather Creation

**Service**: Brain Service (brain.ft.tc)
**Version**: 1.0.0
**Date**: January 2025
**Status**: Requirements Specification

---

## 📋 Overview

The Brain service needs 4 new endpoints and 1 schema enhancement to support the Automated Gather Creation feature. These additions enable semantic deduplication, context aggregation, batch operations, and coverage analysis.

---

## 🆕 New Endpoints Required

### 1. Batch Node Creation

**Endpoint**: `POST /api/v1/nodes/batch`

**Purpose**: Efficiently create multiple gather items at once to reduce API calls and improve performance.

**Request Body**:
```json
{
  "nodes": [
    {
      "type": "GatherItem",
      "content": "Full text content for embedding",
      "projectId": "507f1f77bcf86cd799439011",
      "properties": {
        "department": "story",
        "departmentName": "Story Department",
        "isAutomated": true,
        "iteration": 5,
        "qualityScore": 75,
        "model": "anthropic/claude-sonnet-4.5",
        "taskId": "celery-task-123",
        "summary": "Brief summary",
        "context": "Why this matters"
      }
    },
    {
      "type": "GatherItem",
      "content": "Another gather item content",
      "projectId": "507f1f77bcf86cd799439011",
      "properties": {
        "department": "character",
        "departmentName": "Character Department",
        "isAutomated": true,
        "iteration": 3,
        "qualityScore": 80
      }
    }
  ]
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "created": 2,
  "nodeIds": [
    "neo4j-internal-id-123",
    "neo4j-internal-id-124"
  ],
  "nodes": [
    {
      "id": "neo4j-internal-id-123",
      "type": "GatherItem",
      "properties": { ... },
      "embedding": { "dimensions": 1536 }
    },
    {
      "id": "neo4j-internal-id-124",
      "type": "GatherItem",
      "properties": { ... },
      "embedding": { "dimensions": 1536 }
    }
  ],
  "timing": {
    "embedding_time_ms": 450,
    "neo4j_write_time_ms": 120,
    "total_time_ms": 570
  }
}
```

**Error Response** (400 Bad Request):
```json
{
  "error": "batch_validation_failed",
  "message": "Invalid nodes in batch",
  "details": {
    "invalid_nodes": [
      { "index": 0, "reason": "Missing required field: content" }
    ]
  }
}
```

**Implementation Notes**:
- Maximum batch size: 50 nodes (configurable)
- Each node content gets embedded via Jina AI
- Nodes written to Neo4j in a single transaction
- Return node IDs in same order as input
- Validate all nodes before processing (fail-fast)
- Support projectId isolation

---

### 2. Duplicate Search by Similarity

**Endpoint**: `POST /api/v1/search/duplicates`

**Purpose**: Find semantically similar nodes to detect duplicates before saving new gather items.

**Request Body**:
```json
{
  "content": "Text content to check for duplicates",
  "projectId": "507f1f77bcf86cd799439011",
  "threshold": 0.90,
  "limit": 10,
  "type": "GatherItem",
  "excludeNodeIds": ["neo4j-id-to-exclude"]
}
```

**Response** (200 OK):
```json
{
  "duplicates": [
    {
      "nodeId": "neo4j-internal-id-456",
      "similarity": 0.95,
      "content": "Similar content text",
      "properties": {
        "department": "story",
        "summary": "Brief summary",
        "createdAt": "2025-01-15T10:30:00Z",
        "isAutomated": false
      }
    },
    {
      "nodeId": "neo4j-internal-id-789",
      "similarity": 0.92,
      "content": "Another similar text",
      "properties": {
        "department": "story",
        "summary": "Different summary",
        "createdAt": "2025-01-14T15:20:00Z",
        "isAutomated": true
      }
    }
  ],
  "query_embedding_time_ms": 200,
  "search_time_ms": 150,
  "total_time_ms": 350
}
```

**Query Parameters** (Optional):
- `type` - Filter by node type (default: "GatherItem")
- `department` - Filter by department slug
- `excludeAutomated` - Exclude automated items (boolean)

**Implementation Notes**:
- Generate embedding for input content
- Use cosine similarity search in Neo4j
- Filter by projectId for isolation
- Return results sorted by similarity (highest first)
- Include full node properties for decision making
- Support exclusion list (don't compare against specific nodes)

---

### 3. Department Context Retrieval

**Endpoint**: `GET /api/v1/context/department`

**Purpose**: Aggregate context from previous departments to inform content generation.

**Query Parameters**:
```
projectId=507f1f77bcf86cd799439011
department=character
previousDepartments[]=story
previousDepartments[]=visual
limit=20
```

**Response** (200 OK):
```json
{
  "projectId": "507f1f77bcf86cd799439011",
  "targetDepartment": "character",
  "context": {
    "story": {
      "nodeCount": 15,
      "qualityScore": 85,
      "topNodes": [
        {
          "nodeId": "neo4j-id-1",
          "content": "Story premise: A hero's journey...",
          "summary": "Main story arc",
          "relevance": 0.95
        },
        {
          "nodeId": "neo4j-id-2",
          "content": "Plot structure: Three act structure...",
          "summary": "Narrative structure",
          "relevance": 0.88
        }
      ],
      "keyThemes": ["redemption", "family", "sacrifice"]
    },
    "visual": {
      "nodeCount": 12,
      "qualityScore": 78,
      "topNodes": [ ... ],
      "keyThemes": ["dark aesthetic", "noir lighting"]
    }
  },
  "aggregatedSummary": "The story follows a redemption arc with dark visual themes...",
  "relevantNodes": [
    {
      "nodeId": "neo4j-id-1",
      "department": "story",
      "content": "...",
      "relevanceToTarget": 0.92
    }
  ],
  "totalNodesAggregated": 27,
  "timing": {
    "query_time_ms": 180,
    "aggregation_time_ms": 220,
    "total_time_ms": 400
  }
}
```

**Implementation Notes**:
- Query nodes from specified previous departments
- Filter by projectId
- Calculate relevance scores using embeddings
- Return top N most relevant nodes per department
- Generate aggregated summary using LLM (optional)
- Extract key themes/concepts per department
- Sort nodes by relevance to target department

---

### 4. Coverage Analysis

**Endpoint**: `POST /api/v1/analyze/coverage`

**Purpose**: Analyze gather item coverage for a department and identify gaps.

**Request Body**:
```json
{
  "projectId": "507f1f77bcf86cd799439011",
  "department": "story",
  "gatherItems": [
    {
      "content": "Plot overview: ...",
      "summary": "Plot structure"
    },
    {
      "content": "Character relationships: ...",
      "summary": "Character dynamics"
    }
  ],
  "departmentDescription": "Story Department handles narrative, plot, pacing, and structure"
}
```

**Response** (200 OK):
```json
{
  "department": "story",
  "coverageScore": 75,
  "analysis": {
    "coveredAspects": [
      {
        "aspect": "Plot Structure",
        "coverage": 90,
        "itemCount": 5,
        "quality": "excellent"
      },
      {
        "aspect": "Character Arcs",
        "coverage": 70,
        "itemCount": 3,
        "quality": "good"
      }
    ],
    "gaps": [
      {
        "aspect": "Pacing",
        "coverage": 20,
        "itemCount": 1,
        "severity": "high",
        "suggestion": "Add detailed pacing breakdown for each act"
      },
      {
        "aspect": "Dialogue Samples",
        "coverage": 0,
        "itemCount": 0,
        "severity": "medium",
        "suggestion": "Include representative dialogue examples"
      }
    ],
    "recommendations": [
      "Focus next iteration on pacing details",
      "Add dialogue samples to demonstrate character voices",
      "Expand on theme development"
    ]
  },
  "itemDistribution": {
    "plot": 8,
    "character": 5,
    "theme": 3,
    "pacing": 1,
    "dialogue": 0
  },
  "qualityMetrics": {
    "depth": 72,
    "breadth": 68,
    "coherence": 85,
    "actionability": 70
  },
  "timing": {
    "embedding_time_ms": 300,
    "analysis_time_ms": 450,
    "total_time_ms": 750
  }
}
```

**Implementation Notes**:
- Use LLM to analyze content coverage
- Extract aspects/topics from department description
- Cluster gather items by topic/aspect
- Calculate coverage per aspect
- Identify gaps and missing areas
- Generate actionable recommendations
- Return quality metrics (depth, breadth, coherence)

---

## 🔧 Schema Enhancements

### Neo4j Node Labels & Properties

#### New Node Type: `GatherItem:Automated`

```cypher
CREATE (n:GatherItem:Automated {
  id: "unique-id",
  projectId: "507f1f77bcf86cd799439011",
  content: "Full text content",
  department: "story",
  departmentName: "Story Department",
  isAutomated: true,
  iteration: 5,
  qualityScore: 75.5,
  model: "anthropic/claude-sonnet-4.5",
  taskId: "celery-task-abc123",
  summary: "Brief summary",
  context: "Why this matters",
  embedding: [0.123, 0.456, ...],  // 1536 dimensions
  createdAt: datetime(),
  createdBy: "user-id-123"
})
```

#### New Relationships

```cypher
// Context relationship (gather item based on previous items)
(:GatherItem)-[:BASED_ON {
  relevance: 0.85,
  contextType: "previous_department"
}]->(:GatherItem)

// Department association
(:GatherItem)-[:BELONGS_TO {
  iteration: 5
}]->(:Department {
  slug: "story",
  name: "Story Department"
})

// Task tracking
(:GatherItem)-[:GENERATED_IN {
  batchIndex: 2,
  totalInBatch: 10
}]->(:AutomationTask {
  taskId: "celery-task-abc123",
  status: "completed"
})

// Sequential dependency (for cascading context)
(:GatherItem)-[:FOLLOWS {
  departmentOrder: 1
}]->(:GatherItem)
```

### Indexes Required

```cypher
// Embedding similarity index (for fast duplicate search)
CREATE VECTOR INDEX gatherItemEmbeddings
FOR (n:GatherItem) ON (n.embedding)
OPTIONS {indexConfig: {
  `vector.dimensions`: 1536,
  `vector.similarity_function`: 'cosine'
}}

// ProjectId isolation index
CREATE INDEX gatherItemProjectId
FOR (n:GatherItem) ON (n.projectId)

// Department filtering index
CREATE INDEX gatherItemDepartment
FOR (n:GatherItem) ON (n.department)

// Automation tracking index
CREATE INDEX gatherItemTaskId
FOR (n:GatherItem) ON (n.taskId)

// Composite index for common queries
CREATE INDEX gatherItemProjectDept
FOR (n:GatherItem) ON (n.projectId, n.department)
```

---

## 🔐 Authentication & Security

### API Key Authentication
- All endpoints require `Authorization: Bearer <BRAIN_API_KEY>` header
- Same authentication as existing Brain endpoints
- Validate API key before processing

### ProjectId Isolation
- **CRITICAL**: All queries MUST filter by `projectId`
- Prevent cross-project data leakage
- Validate projectId exists and user has access

### Rate Limiting
- Batch endpoint: 10 requests/minute per project
- Duplicate search: 30 requests/minute per project
- Context retrieval: 20 requests/minute per project
- Coverage analysis: 5 requests/minute per project

---

## 📊 Performance Requirements

### Response Times (95th percentile)
- Batch node creation (10 nodes): < 1000ms
- Duplicate search: < 500ms
- Context retrieval: < 800ms
- Coverage analysis: < 1500ms

### Throughput
- Batch endpoint: Support 50 nodes per request
- Concurrent requests: Handle 100 concurrent batch operations
- Embedding queue: Process 1000 embeddings/minute

### Caching
- Cache department context for 5 minutes
- Cache coverage analysis for 2 minutes
- Invalidate cache on new node creation

---

## 🧪 Testing Requirements

### Unit Tests
- [ ] Batch node creation with valid input
- [ ] Batch validation fails correctly
- [ ] Duplicate search finds similar nodes
- [ ] Duplicate search respects threshold
- [ ] Context retrieval aggregates correctly
- [ ] Coverage analysis identifies gaps
- [ ] ProjectId isolation enforced
- [ ] Embedding generation for batch

### Integration Tests
- [ ] End-to-end batch creation + duplicate search
- [ ] Context retrieval across departments
- [ ] Coverage analysis with real gather items
- [ ] Concurrent batch operations
- [ ] Rate limiting enforcement

### Performance Tests
- [ ] Batch creation at scale (1000 nodes)
- [ ] Duplicate search with 10k existing nodes
- [ ] Context retrieval with 100+ departments
- [ ] Response time under load

---

## 📝 API Documentation Updates

### OpenAPI/Swagger Specs
- Add 4 new endpoint definitions
- Include request/response schemas
- Add authentication requirements
- Document error codes

### Example Requests
- Provide curl examples for each endpoint
- Include Postman collection
- Add client library examples (Python, TypeScript)

---

## 🚀 Deployment Checklist

### Before Deployment
- [ ] All 4 endpoints implemented and tested
- [ ] Neo4j indexes created
- [ ] Schema migrations applied
- [ ] API documentation updated
- [ ] Rate limiting configured
- [ ] Monitoring dashboards created

### Monitoring
- Track endpoint response times
- Monitor embedding queue length
- Alert on error rate spikes
- Track batch operation sizes
- Monitor Neo4j query performance

### Rollback Plan
- Endpoints are additive (no breaking changes)
- Can disable endpoints via feature flag
- Neo4j indexes can be dropped if needed
- No data migration required

---

## 📋 Implementation Priority

### Phase 1 (Week 5) - Critical
1. ✅ Batch node creation endpoint
2. ✅ Duplicate search endpoint
3. ✅ Neo4j schema updates
4. ✅ Indexes creation

### Phase 2 (Week 5) - Important
5. ✅ Context retrieval endpoint
6. ✅ Coverage analysis endpoint
7. ✅ Rate limiting
8. ✅ Caching layer

### Phase 3 (Week 6) - Polish
9. ✅ Performance optimization
10. ✅ Comprehensive testing
11. ✅ Documentation
12. ✅ Monitoring setup

---

## 🔗 Dependencies

### External Services
- **Jina AI**: Embedding generation (existing)
- **Neo4j**: Graph database (existing)
- **Redis**: Caching layer (existing)

### Internal Services
- **Task Service**: Provides taskId for tracking
- **Main App**: Provides projectId and authentication

---

## 📞 Support & Contact

**Service Owner**: Brain Service Team
**Repository**: `mcp-brain-service/`
**Documentation**: `/mcp-brain-service/docs/`
**Issues**: GitHub Issues

---

## ✅ Acceptance Criteria

- [ ] All 4 endpoints deployed and functional
- [ ] Response times meet performance requirements
- [ ] ProjectId isolation verified
- [ ] Rate limiting enforced
- [ ] Tests pass (unit, integration, performance)
- [ ] Documentation complete
- [ ] Monitoring in place
- [ ] Automated Gather Creation successfully uses all endpoints

---

**Status**: Ready for Implementation
**Estimated Effort**: 1 week (Week 5 of main project)
**Risk Level**: Low (additive changes only)
