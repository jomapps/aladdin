# Task Service Requirements for Automated Gather Creation

**Service**: Task Service (tasks.ft.tc - Celery/Redis)
**Version**: 1.0.0
**Date**: January 2025
**Status**: Requirements Specification

---

## 📋 Overview

The Task Service needs 1 new task type, 3 helper modules, and WebSocket integration to support the Automated Gather Creation feature. These additions enable async content generation, duplicate detection, quality analysis, and real-time progress updates.

---

## 🆕 New Task Type

### Task: `automated_gather_creation`

**Queue**: `cpu_intensive` (content generation is CPU-bound)
**Priority**: `1` (high - user-initiated)
**Timeout**: `600` seconds (10 minutes)
**Retry**: `3` attempts with exponential backoff

**Task Input**:
```python
{
    'project_id': '507f1f77bcf86cd799439011',
    'user_id': 'user-123',
    'max_iterations': 50,
    'enable_auto_evaluation': True,
    'webhook_url': 'https://app.aladdin.com/api/webhooks/automated-gather-progress'
}
```

**Task Output**:
```python
{
    'status': 'completed',
    'iterations': 45,
    'departments_processed': 7,
    'items_created': 89,
    'processing_time_ms': 425000,
    'summary': [
        {
            'department': 'story',
            'name': 'Story Department',
            'quality_score': 85,
            'iterations': 8,
            'items_created': 15
        },
        # ... more departments
    ]
}
```

**File Location**: `celery-redis/app/tasks/automated_gather_tasks.py`

---

## 📁 New Files Required

### 1. Main Task File

**Path**: `celery-redis/app/tasks/automated_gather_tasks.py`

**Purpose**: Orchestrate the automated gather creation workflow

**Key Functions**:
```python
@celery_app.task(bind=True, name='automated_gather_creation')
def automated_gather_creation(self, task_data):
    """
    Main task for automated gather creation
    - Queries dynamic departments
    - Generates content per department
    - Deduplicates items
    - Saves to MongoDB + Brain
    - Analyzes quality
    - Triggers evaluations
    - Sends WebSocket progress updates
    """
    pass

def query_departments_for_automation(project_id):
    """Query Payload CMS for departments with gatherCheck=true"""
    pass

def send_websocket_event(event_data):
    """Send real-time progress via WebSocket"""
    pass

def trigger_department_evaluation(project_id, department_number):
    """Trigger evaluation task for completed department"""
    pass
```

**Dependencies**:
- `codebuff` SDK (for @codebuff/sdk integration)
- `pymongo` (MongoDB client)
- `requests` (HTTP for Brain API, Payload API)
- `redis` (WebSocket pub/sub)
- `celery` (task framework)

---

### 2. Content Generator Module

**Path**: `celery-redis/app/agents/gather_content_generator.py`

**Purpose**: Generate gather items using @codebuff/sdk

**Key Functions**:
```python
def generate_content_batch(
    project_id: str,
    department: dict,
    existing_context: list,
    previous_departments: list,
    model: str
) -> list[dict]:
    """
    Generate 5-10 gather items for a department

    Args:
        project_id: Project ID
        department: Department object with slug, name, description, defaultModel
        existing_context: List of existing gather items + brain context
        previous_departments: Results from previously processed departments
        model: OpenRouter model ID (e.g., "anthropic/claude-sonnet-4.5")

    Returns:
        List of dicts with keys: content, summary, context
    """
    pass

def format_gather_items(items: list) -> str:
    """Format gather items into summary for prompt context"""
    pass
```

**Dependencies**:
- `codebuff` - CodeBuffSDK client
- `json` - JSON parsing
- `re` - Regex for JSON extraction

**Environment Variables**:
- `OPENROUTER_API_KEY` - OpenRouter API key

---

### 3. Duplicate Detector Module

**Path**: `celery-redis/app/agents/duplicate_detector.py`

**Purpose**: Detect semantic duplicates using LLM

**Key Functions**:
```python
def deduplicate_items(new_items: list, existing_items: list) -> list:
    """
    Remove duplicates from new_items based on similarity to existing_items

    Args:
        new_items: Newly generated gather items
        existing_items: All existing gather items for the project

    Returns:
        List of non-duplicate items (newer items retained)
    """
    pass

def check_semantic_similarity(text1: str, text2: str) -> float:
    """
    Calculate semantic similarity using LLM

    Args:
        text1: First text
        text2: Second text

    Returns:
        Similarity score 0.0 - 1.0
    """
    pass

def batch_similarity_check(new_item: dict, existing_items: list, threshold: float = 0.90) -> bool:
    """
    Optimized batch similarity checking
    Returns True if duplicate found
    """
    pass
```

**Performance Optimization**:
- Truncate texts to 500 chars for comparison
- Cache similarity scores (Redis)
- Batch API calls where possible
- Early exit on first duplicate found

**Dependencies**:
- `codebuff` - SDK for LLM calls
- `redis` - Caching layer
- `hashlib` - Content hashing for cache keys

---

### 4. Quality Analyzer Module

**Path**: `celery-redis/app/agents/quality_analyzer.py`

**Purpose**: Analyze gather item quality per department

**Key Functions**:
```python
def analyze_department_quality(
    project_id: str,
    department: dict,
    gather_items: list
) -> float:
    """
    Calculate quality score for department's gather items

    Args:
        project_id: Project ID
        department: Department object
        gather_items: All gather items for the project

    Returns:
        Quality score 0-100
    """
    pass

def calculate_coverage_score(department: dict, items: list) -> float:
    """Calculate content coverage score"""
    pass

def calculate_depth_score(items: list) -> float:
    """Calculate content depth/detail score"""
    pass

def calculate_coherence_score(items: list) -> float:
    """Calculate content coherence score"""
    pass
```

**Quality Metrics**:
- **Coverage** (40%): How many aspects of department are covered
- **Depth** (30%): Level of detail in gather items
- **Coherence** (20%): Consistency and logical flow
- **Actionability** (10%): How usable the content is

**Dependencies**:
- `codebuff` - LLM for quality analysis
- Brain API - Coverage analysis endpoint

---

### 5. MongoDB Helper Module

**Path**: `celery-redis/app/helpers/gather_database.py`

**Purpose**: MongoDB operations for gather items

**Key Functions**:
```python
def read_gather_items(project_id: str) -> list[dict]:
    """Read all gather items for a project"""
    pass

def save_to_gather_db(
    project_id: str,
    items: list[dict],
    user_id: str,
    automation_metadata: dict
) -> list[dict]:
    """
    Save gather items to MongoDB

    Returns:
        List of saved items with _id fields
    """
    pass

def get_gather_db(project_id: str):
    """Get MongoDB database for project: aladdin-gather-{projectId}"""
    pass
```

**MongoDB Connection**:
- Use `MONGODB_URI` environment variable
- Database: `aladdin-gather-{projectId}`
- Collection: `gather`

---

### 6. Brain API Helper Module

**Path**: `celery-redis/app/helpers/brain_client.py`

**Purpose**: Brain service API integration

**Key Functions**:
```python
def get_brain_context(project_id: str) -> list[dict]:
    """Get brain context for project using semantic search"""
    pass

def index_in_brain(project_id: str, items: list, department: dict):
    """Batch index gather items in Brain (Neo4j)"""
    pass

def search_brain_duplicates(content: str, project_id: str, threshold: float = 0.90) -> list:
    """Search for duplicate nodes in Brain"""
    pass

def get_department_context(project_id: str, department: str, previous_depts: list) -> dict:
    """Get aggregated context from previous departments"""
    pass
```

**Brain API Endpoints Used**:
- `POST /api/v1/nodes/batch` - Batch node creation
- `POST /api/v1/search/duplicates` - Duplicate search
- `GET /api/v1/context/department` - Context retrieval
- `POST /api/v1/analyze/coverage` - Coverage analysis

**Environment Variables**:
- `BRAIN_SERVICE_BASE_URL` - Brain service URL (e.g., https://brain.ft.tc)
- `BRAIN_SERVICE_API_KEY` - Brain API key

---

### 7. Payload CMS Helper Module

**Path**: `celery-redis/app/helpers/payload_client.py`

**Purpose**: Query Payload CMS for departments

**Key Functions**:
```python
def get_payload_client():
    """Initialize Payload API client"""
    pass

def query_departments_for_automation(project_id: str) -> list[dict]:
    """
    Query departments with gatherCheck=true, sorted by codeDepNumber

    Returns:
        List of department objects with:
        - id, slug, name, description
        - codeDepNumber, gatherCheck, isActive
        - defaultModel, coordinationSettings
    """
    pass
```

**Payload API**:
- Endpoint: `{NEXT_PUBLIC_APP_URL}/api/departments`
- Query: `?where[gatherCheck][equals]=true&where[isActive][equals]=true&sort=codeDepNumber`

**Environment Variables**:
- `NEXT_PUBLIC_APP_URL` - Main app URL
- `PAYLOAD_API_KEY` - Payload API key (if needed)

---

## 🔌 WebSocket Integration

### Redis Pub/Sub for Real-time Updates

**Purpose**: Send progress updates to WebSocket server

**Implementation**:
```python
# celery-redis/app/helpers/websocket.py

import redis
import json

redis_client = redis.Redis.from_url(os.getenv('REDIS_URL'))

def send_websocket_event(event_data: dict):
    """
    Publish event to Redis channel for WebSocket broadcast
    """
    channel = f"automated-gather:{event_data.get('project_id')}"
    redis_client.publish(channel, json.dumps(event_data))
```

**Event Types**:
```python
# Department started
{
    'type': 'department_started',
    'project_id': '...',
    'department': 'story',
    'department_name': 'Story Department',
    'threshold': 80,
    'model': 'anthropic/claude-sonnet-4.5'
}

# Iteration complete
{
    'type': 'iteration_complete',
    'project_id': '...',
    'department': 'story',
    'department_name': 'Story Department',
    'iteration': 5,
    'total_iterations': 12,
    'quality_score': 75,
    'items_created': 8,
    'threshold': 80
}

# Deduplication in progress
{
    'type': 'deduplicating',
    'project_id': '...',
    'department': 'story'
}

# Department complete
{
    'type': 'department_complete',
    'project_id': '...',
    'department': 'story',
    'department_name': 'Story Department',
    'quality_score': 85,
    'iterations_used': 12
}

# Automation complete
{
    'type': 'automation_complete',
    'project_id': '...',
    'total_iterations': 45,
    'departments_processed': 7,
    'items_created': 89,
    'summary': [ ... ]
}
```

**Redis Channel Pattern**:
- Channel: `automated-gather:{projectId}`
- WebSocket server subscribes to this channel
- Broadcasts events to connected clients

---

## 🔧 Configuration & Environment

### New Environment Variables

```bash
# .env file additions for celery-redis service

# OpenRouter (for @codebuff/sdk)
OPENROUTER_API_KEY=sk-or-v1-xxxxx

# Brain Service
BRAIN_SERVICE_BASE_URL=https://brain.ft.tc
BRAIN_SERVICE_API_KEY=brain-api-key-xxxxx

# MongoDB (existing, confirm availability)
MONGODB_URI=mongodb://localhost:27017

# Redis (existing, confirm availability)
REDIS_URL=redis://localhost:6379

# Main App (for Payload CMS queries)
NEXT_PUBLIC_APP_URL=https://app.aladdin.com

# Payload API (if auth required)
PAYLOAD_API_KEY=payload-key-xxxxx  # Optional
```

### Celery Configuration Updates

**File**: `celery-redis/app/celery_config.py`

```python
# Add new task routing
task_routes = {
    # Existing routes...
    'automated_gather_creation': {'queue': 'cpu_intensive'},
}

# Add task timeouts
task_time_limit = {
    'automated_gather_creation': 600,  # 10 minutes
}

# Add retry configuration
task_autoretry_for = (Exception,)
task_retry_kwargs = {'max_retries': 3, 'countdown': 60}
task_retry_backoff = True
task_retry_backoff_max = 600
task_retry_jitter = True
```

---

## 🔄 Integration with Evaluation Tasks

### Trigger Evaluation After Gather Creation

**Implementation**:
```python
def trigger_department_evaluation(project_id: str, department_number: int):
    """
    Trigger sequential evaluation for completed department
    """
    from app.tasks.evaluation_tasks import evaluate_department

    # Submit evaluation task to queue
    evaluate_department.apply_async(
        kwargs={
            'project_id': project_id,
            'department_number': department_number,
            'user_id': task_data.get('user_id'),
            'auto_triggered': True
        },
        priority=1  # High priority for auto-triggered evaluations
    )
```

**Flow**:
1. Department gather creation completes
2. Quality threshold reached (≥80%)
3. Trigger evaluation task for that department
4. Evaluation runs asynchronously
5. Next department starts gather creation (if auto-evaluation enabled)

---

## 🧪 Testing Requirements

### Unit Tests

**File**: `celery-redis/tests/test_automated_gather_tasks.py`

```python
def test_automated_gather_creation_task():
    """Test main task orchestration"""
    pass

def test_query_departments_for_automation():
    """Test dynamic department querying"""
    pass

def test_content_generation():
    """Test gather item generation"""
    pass

def test_duplicate_detection():
    """Test semantic deduplication"""
    pass

def test_quality_analysis():
    """Test quality scoring"""
    pass

def test_websocket_events():
    """Test real-time event broadcasting"""
    pass

def test_brain_integration():
    """Test Brain API calls"""
    pass

def test_mongodb_operations():
    """Test MongoDB read/write"""
    pass

def test_evaluation_trigger():
    """Test auto-evaluation triggering"""
    pass
```

### Integration Tests

**File**: `celery-redis/tests/test_automated_gather_integration.py`

```python
def test_end_to_end_automation():
    """Test complete automation workflow"""
    pass

def test_multi_department_flow():
    """Test sequential department processing"""
    pass

def test_cancellation():
    """Test task cancellation mid-process"""
    pass

def test_error_recovery():
    """Test retry logic and error handling"""
    pass
```

### Performance Tests

```python
def test_50_iterations_performance():
    """Ensure task completes within 10 minutes"""
    pass

def test_concurrent_automation():
    """Test multiple projects running simultaneously"""
    pass
```

---

## 📊 Monitoring & Logging

### Logging Strategy

```python
import logging

logger = logging.getLogger(__name__)

# Log levels:
# - INFO: Progress milestones (dept started, iteration complete)
# - WARNING: Quality not improving, approaching max iterations
# - ERROR: API failures, validation errors
# - DEBUG: Detailed execution flow

# Example:
logger.info(f"[AutoGather] Started dept {dept['name']} (threshold: {threshold}%)")
logger.debug(f"[AutoGather] Generated {len(new_items)} items in iteration {iteration}")
logger.warning(f"[AutoGather] Quality stagnant at {quality_score}% for 3 iterations")
logger.error(f"[AutoGather] Brain API failed: {error}")
```

### Metrics to Track

**Celery Task Metrics**:
- Task execution time
- Success/failure rate
- Retry attempts
- Queue wait time

**Business Metrics**:
- Iterations per department (avg, min, max)
- Items created per iteration
- Quality score progression
- Duplicate detection rate
- Time to reach threshold

**Performance Metrics**:
- MongoDB query time
- Brain API response time
- LLM generation time
- Deduplication time

### Monitoring Dashboards

- **Celery Flower**: Task monitoring UI
- **Grafana**: Custom dashboards for metrics
- **CloudWatch/DataDog**: Application logs
- **Redis Commander**: Queue inspection

---

## 🚨 Error Handling

### Error Scenarios & Responses

**1. Brain API Unavailable**:
```python
try:
    brain_context = get_brain_context(project_id)
except BrainAPIError as e:
    logger.error(f"Brain API failed: {e}")
    # Fallback: Use only MongoDB gather items (no semantic context)
    brain_context = []
```

**2. MongoDB Connection Lost**:
```python
try:
    gather_items = read_gather_items(project_id)
except MongoDBError as e:
    logger.error(f"MongoDB failed: {e}")
    # Retry with exponential backoff
    self.retry(exc=e, countdown=60)
```

**3. LLM API Rate Limit**:
```python
try:
    new_items = generate_content_batch(...)
except RateLimitError as e:
    logger.warning(f"Rate limited: {e}")
    # Wait and retry
    time.sleep(30)
    new_items = generate_content_batch(...)
```

**4. Task Cancellation**:
```python
if self.request.id in cancelled_tasks:
    logger.info(f"Task cancelled by user")
    # Save partial results before exiting
    send_websocket_event({
        'type': 'automation_cancelled',
        'items_created_so_far': len(gather_items)
    })
    raise TaskCancelled()
```

**5. Max Iterations Reached**:
```python
if total_iterations >= max_iterations:
    logger.warning(f"Max iterations ({max_iterations}) reached")
    send_websocket_event({
        'type': 'max_iterations_reached',
        'final_quality_score': quality_score,
        'threshold': threshold
    })
    # Continue to next department (don't fail)
```

---

## 📦 Dependencies Installation

### Python Packages

```bash
# requirements.txt additions

# @codebuff/sdk (OpenRouter integration)
codebuff>=1.0.0

# MongoDB
pymongo>=4.0.0

# HTTP clients
requests>=2.28.0
httpx>=0.24.0  # For async requests

# Redis (existing, confirm version)
redis>=4.5.0

# Celery (existing, confirm version)
celery>=5.3.0
```

### Installation Command

```bash
cd celery-redis
pip install -r requirements.txt
```

---

## 🚀 Deployment Checklist

### Pre-Deployment
- [ ] All helper modules implemented
- [ ] Main task tested (unit + integration)
- [ ] Environment variables configured
- [ ] Dependencies installed
- [ ] Error handling verified
- [ ] Logging configured
- [ ] WebSocket integration tested

### Deployment Steps
1. Update `requirements.txt`
2. Install dependencies: `pip install -r requirements.txt`
3. Set environment variables
4. Deploy updated Celery workers
5. Restart Celery service: `systemctl restart celery`
6. Verify task registration: `celery -A app.celery_app inspect registered`
7. Monitor logs: `tail -f /var/log/celery/worker.log`

### Post-Deployment
- [ ] Submit test task and verify execution
- [ ] Check WebSocket events received
- [ ] Verify MongoDB writes
- [ ] Confirm Brain API calls working
- [ ] Monitor task performance metrics

---

## 📋 Implementation Priority

### Week 1-2: Foundation
1. ✅ Main task skeleton (`automated_gather_tasks.py`)
2. ✅ Helper modules setup
3. ✅ MongoDB integration
4. ✅ Payload CMS query

### Week 2-3: Core Logic
5. ✅ Content generation (@codebuff/sdk)
6. ✅ Duplicate detection (LLM-based)
7. ✅ Quality analysis
8. ✅ WebSocket integration

### Week 3-4: Integration
9. ✅ Brain API integration
10. ✅ Evaluation trigger logic
11. ✅ Error handling
12. ✅ Testing (unit + integration)

### Week 4-5: Polish
13. ✅ Performance optimization
14. ✅ Monitoring setup
15. ✅ Documentation
16. ✅ Deployment

---

## ✅ Acceptance Criteria

- [ ] Task `automated_gather_creation` executes successfully
- [ ] Dynamic department query works (no hardcoded depts)
- [ ] Content generation uses dept-specific models
- [ ] Duplicate detection filters effectively (90% threshold)
- [ ] Quality analysis returns accurate scores
- [ ] MongoDB writes successful (with automation metadata)
- [ ] Brain API integration functional (batch nodes, duplicates, context)
- [ ] WebSocket events sent in real-time
- [ ] Auto-evaluation triggers sequentially
- [ ] Task completes within 10 minutes (50 iterations)
- [ ] Cancellation preserves partial results
- [ ] Error handling prevents data loss
- [ ] Tests pass (unit, integration, performance)
- [ ] Monitoring dashboards functional

---

**Status**: Ready for Implementation
**Estimated Effort**: 2 weeks (Week 1-2 of main project)
**Risk Level**: Medium (new integrations with Brain, @codebuff/sdk)
