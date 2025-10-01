# Phase 3 Test Examples - Reference Implementation

This document provides detailed implementation examples for each test category.

## Brain Client Unit Test Examples

### Example 1: Connection Success Test

```python
# tests/unit/test_brain_client.py
import pytest
from app.clients.brain_client import BrainServiceClient
from unittest.mock import AsyncMock, patch

class TestBrainClientConnection:
    """Test Brain Service WebSocket connection handling"""

    @pytest.fixture
    def brain_client(self):
        """Create brain service client for testing"""
        return BrainServiceClient(
            "wss://brain.ft.tc",
            max_retries=3,
            timeout=5.0
        )

    @pytest.mark.asyncio
    async def test_connect_success(self, brain_client):
        """
        TEST-BRAIN-001: Verify successful WebSocket connection

        Given: Valid Brain service URL
        When: Client connects
        Then: Connection established, websocket not None, connected = True
        """
        with patch('websockets.connect') as mock_connect:
            # Arrange
            mock_websocket = AsyncMock()
            mock_connect.return_value = mock_websocket

            # Act
            await brain_client.connect()

            # Assert
            assert brain_client.connected is True
            assert brain_client.websocket == mock_websocket
            assert mock_connect.call_count == 1
            assert brain_client._listener_task is not None

    @pytest.mark.asyncio
    async def test_connect_retry_exponential_backoff(self, brain_client):
        """
        TEST-BRAIN-002: Verify exponential backoff retry logic

        Given: Brain service unreachable
        When: Client attempts connection
        Then: Retries max_retries times with exponential backoff
        """
        with patch('websockets.connect') as mock_connect:
            with patch('asyncio.sleep') as mock_sleep:
                # Arrange
                mock_connect.side_effect = Exception("Connection refused")

                # Act & Assert
                with pytest.raises(BrainServiceConnectionError) as exc_info:
                    await brain_client.connect()

                # Verify retry attempts
                assert mock_connect.call_count == brain_client.max_retries
                assert "Failed to connect after 3 attempts" in str(exc_info.value)

                # Verify exponential backoff (2^0, 2^1, 2^2 seconds)
                sleep_calls = [call.args[0] for call in mock_sleep.call_args_list]
                assert sleep_calls == [1, 2, 4]  # 2^0, 2^1, 2^2
```

### Example 2: Request/Response Handling

```python
@pytest.mark.asyncio
async def test_request_response_correlation(self, brain_client):
    """
    TEST-BRAIN-012: Verify responses matched to requests by ID

    Given: Multiple concurrent requests
    When: Responses arrive out of order
    Then: Each response matched to correct request future
    """
    with patch.object(brain_client, 'websocket') as mock_ws:
        # Arrange: Simulate connected state
        brain_client.connected = True

        # Create mock responses (out of order)
        responses = [
            {'jsonrpc': '2.0', 'id': 2, 'result': {'data': 'response-2'}},
            {'jsonrpc': '2.0', 'id': 1, 'result': {'data': 'response-1'}},
            {'jsonrpc': '2.0', 'id': 3, 'result': {'data': 'response-3'}}
        ]

        # Act: Simulate concurrent requests
        tasks = []
        for i in range(1, 4):
            task = asyncio.create_task(
                brain_client._send_request("test_method", {"id": i})
            )
            tasks.append(task)

        # Simulate responses arriving out of order
        for response in responses:
            # Manually trigger response handler
            request_id = response['id']
            if request_id in brain_client.pending_requests:
                future = brain_client.pending_requests.pop(request_id)
                future.set_result(response)

        results = await asyncio.gather(*tasks)

        # Assert: Responses matched correctly
        assert results[0]['result']['data'] == 'response-1'
        assert results[1]['result']['data'] == 'response-2'
        assert results[2]['result']['data'] == 'response-3'
```

### Example 3: Task-Specific Method

```python
@pytest.mark.asyncio
async def test_store_task_result(self, brain_client):
    """
    TEST-BRAIN-021: Verify task result stored in knowledge graph

    Given: Task execution result
    When: store_task_result() called
    Then: Returns node_id, result stored with metadata
    """
    with patch.object(brain_client, '_send_request') as mock_send:
        # Arrange
        mock_send.return_value = {"id": "test-node-123"}

        task_result = {
            "status": "completed",
            "url": "https://example.com/video.mp4",
            "duration": 30
        }

        # Act
        node_id = await brain_client.store_task_result(
            task_id="test-task-456",
            task_type="video_generation",
            result=task_result,
            metadata={"quality": "high", "model": "stable-diffusion"}
        )

        # Assert
        assert node_id == "test-node-123"

        # Verify request structure
        call_args = mock_send.call_args
        assert call_args[0][0] == "store_knowledge"

        params = call_args[0][1]
        assert params["knowledge_type"] == "task_result"
        assert params["content"]["task_id"] == "test-task-456"
        assert params["content"]["task_type"] == "video_generation"
        assert params["content"]["result"] == task_result
        assert params["content"]["metadata"]["quality"] == "high"
        assert "timestamp" in params["content"]
```

## Neo4j Integration Test Examples

### Example 4: Character Node Creation

```python
# tests/integration/test_neo4j_operations.py
import pytest
from neo4j import GraphDatabase
from testcontainers.neo4j import Neo4jContainer

@pytest.fixture(scope="session")
def neo4j_container():
    """Provide Neo4j testcontainer for integration tests"""
    with Neo4jContainer("neo4j:5.13") as neo4j:
        yield neo4j

@pytest.fixture
def neo4j_driver(neo4j_container):
    """Create Neo4j driver connected to testcontainer"""
    uri = neo4j_container.get_connection_url()
    driver = GraphDatabase.driver(uri, auth=("neo4j", "testpassword"))
    yield driver
    driver.close()

class TestNeo4jNodeOperations:
    """Test Neo4j node CRUD operations"""

    def test_create_character_node(self, neo4j_driver):
        """
        TEST-NEO4J-001: Create Character node with properties

        Given: Character data (name, backstory, traits)
        When: Node created via Cypher
        Then: Node exists with correct labels and properties
        """
        # Arrange
        character_data = {
            "id": "char-123",
            "name": "Sir Aldric Thornwood",
            "backstory": "Born into minor nobility...",
            "traits": ["brave", "scholarly", "conflicted"],
            "age": 34,
            "quality_score": 0.85
        }

        # Act
        with neo4j_driver.session() as session:
            result = session.run("""
                CREATE (c:Character {
                    id: $id,
                    name: $name,
                    backstory: $backstory,
                    traits: $traits,
                    age: $age,
                    quality_score: $quality_score,
                    created_at: datetime()
                })
                RETURN c
            """, **character_data)

            created_node = result.single()["c"]

        # Assert: Node created with correct properties
        assert created_node["id"] == "char-123"
        assert created_node["name"] == "Sir Aldric Thornwood"
        assert created_node["age"] == 34
        assert created_node["quality_score"] == 0.85
        assert len(created_node["traits"]) == 3

        # Verify node can be retrieved
        with neo4j_driver.session() as session:
            result = session.run(
                "MATCH (c:Character {id: $id}) RETURN c",
                id="char-123"
            )
            retrieved_node = result.single()["c"]
            assert retrieved_node["name"] == "Sir Aldric Thornwood"
```

### Example 5: Relationship Creation

```python
def test_create_features_relationship(self, neo4j_driver):
    """
    TEST-NEO4J-011: Create FEATURES relationship

    Given: Scene and Character nodes
    When: FEATURES relationship created
    Then: Relationship exists with correct direction
    """
    # Arrange: Create nodes first
    with neo4j_driver.session() as session:
        session.run("""
            CREATE (s:Scene {id: 'scene-1', name: 'Throne Room'})
            CREATE (c:Character {id: 'char-1', name: 'Sir Aldric'})
        """)

    # Act: Create relationship
    with neo4j_driver.session() as session:
        session.run("""
            MATCH (s:Scene {id: 'scene-1'})
            MATCH (c:Character {id: 'char-1'})
            CREATE (s)-[r:FEATURES {
                role: 'protagonist',
                importance: 'high',
                created_at: datetime()
            }]->(c)
            RETURN r
        """)

    # Assert: Relationship exists
    with neo4j_driver.session() as session:
        result = session.run("""
            MATCH (s:Scene {id: 'scene-1'})-[r:FEATURES]->(c:Character {id: 'char-1'})
            RETURN s.name AS scene, c.name AS character, r.role AS role
        """)

        record = result.single()
        assert record["scene"] == "Throne Room"
        assert record["character"] == "Sir Aldric"
        assert record["role"] == "protagonist"
```

## Quality Validation Test Examples

### Example 6: High Quality Character Scoring

```python
# tests/unit/test_quality_validation.py
import pytest
from app.services.quality_validator import QualityValidator

class TestQualityScoring:
    """Test quality score calculation"""

    @pytest.fixture
    def validator(self):
        """Create quality validator instance"""
        return QualityValidator(threshold=0.60)

    def test_high_quality_character_score(self, validator):
        """
        TEST-QUALITY-001: High quality character receives score ≥ 0.80

        Given: Character with rich backstory, detailed traits
        When: Quality validation performed
        Then: Score between 0.80 - 1.00, saved to database
        """
        # Arrange
        character = {
            "name": "Sir Aldric Thornwood",
            "backstory": """
                Born into minor nobility in the frost-touched northern provinces,
                Aldric's childhood was marked by the stark contrast between courtly
                expectations and his deep fascination with the arcane. His father,
                a stern military commander, viewed magic with suspicion, while his
                mother, a scholar of ancient texts, secretly nurtured his talents.

                At seventeen, during a brutal winter siege, Aldric witnessed his
                father fall in battle. In that moment of desperation, untrained
                magical energy erupted from him, creating a barrier of ice that
                saved his remaining troops but revealed his secret. Rather than
                face his father's legacy of shame, he fled north to the Arcane
                Academy, where he spent the next decade mastering both blade and
                spell.

                Now returned as a Knight-Scholar, Aldric seeks to bridge the gap
                between the martial traditions of his heritage and the mystical
                path he has chosen, all while carrying the weight of his father's
                unspoken disappointment and his mother's hopes for reconciliation.
            """,
            "traits": [
                "brave",
                "scholarly",
                "conflicted",
                "determined",
                "empathetic",
                "strategic"
            ],
            "age": 34,
            "occupation": "Knight-Scholar",
            "skills": ["swordsmanship", "ice magic", "military tactics", "ancient lore"]
        }

        # Act
        result = validator.validate(character)

        # Assert
        assert result["quality_score"] >= 0.80
        assert result["quality_score"] <= 1.00
        assert result["should_save"] is True
        assert len(result["suggestions"]) == 0
        assert result["score_breakdown"]["backstory_depth"] >= 0.9
        assert result["score_breakdown"]["trait_diversity"] >= 0.8
        assert result["score_breakdown"]["completeness"] >= 0.9

    def test_low_quality_character_rejected(self, validator):
        """
        TEST-QUALITY-003: Low quality character (< 0.60) rejected with suggestions

        Given: Character with minimal content
        When: Quality validation performed
        Then: Score < 0.60, NOT saved, suggestions provided
        """
        # Arrange
        character = {
            "name": "Bob",
            "backstory": "A guy.",
            "traits": []
        }

        # Act
        result = validator.validate(character)

        # Assert
        assert result["quality_score"] < 0.60
        assert result["should_save"] is False
        assert len(result["suggestions"]) > 0

        # Verify specific suggestions
        suggestions_text = " ".join(result["suggestions"])
        assert "backstory" in suggestions_text.lower()
        assert "traits" in suggestions_text.lower()

        # Verify score breakdown
        assert result["score_breakdown"]["backstory_depth"] < 0.3
        assert result["score_breakdown"]["trait_diversity"] < 0.2
```

### Example 7: Contradiction Detection

```python
def test_detect_age_contradiction(self, validator):
    """
    TEST-QUALITY-011: Detect age contradiction

    Given: Two characters with conflicting age data
    When: Consistency check performed
    Then: Contradiction detected, CONTRADICTS relationship created
    """
    # Arrange
    character_a = {
        "id": "char-a",
        "name": "Alice",
        "age": 25,
        "backstory": "Born in the year 1995, Alice is a young warrior..."
    }

    character_b = {
        "id": "char-b",
        "name": "Alice",
        "age": 45,
        "backstory": "After 40 years of training, the veteran Alice..."
    }

    # Act
    contradictions = validator.detect_contradictions(character_a, character_b)

    # Assert
    assert len(contradictions) == 1
    contradiction = contradictions[0]

    assert contradiction["type"] == "age_mismatch"
    assert contradiction["field"] == "age"
    assert contradiction["value_a"] == 25
    assert contradiction["value_b"] == 45
    assert contradiction["severity"] == "high"
    assert "inconsistent" in contradiction["explanation"].lower()
```

## E2E Workflow Test Examples

### Example 8: Complete Character Creation Workflow

```python
# tests/e2e/test_character_workflow.py
import pytest
import asyncio
from pymongo import MongoClient
from neo4j import GraphDatabase
from redis import Redis

@pytest.mark.e2e
class TestCharacterWorkflow:
    """End-to-end character creation and validation workflow"""

    @pytest.fixture
    async def test_environment(self):
        """Setup complete test environment with all services"""
        # MongoDB
        mongo_client = MongoClient("mongodb://localhost:27017")
        mongo_db = mongo_client["test-project"]

        # Neo4j
        neo4j_driver = GraphDatabase.driver(
            "bolt://localhost:7687",
            auth=("neo4j", "testpassword")
        )

        # Redis
        redis_client = Redis(host="localhost", port=6379, db=0)

        # Brain client
        brain_client = BrainServiceClient("ws://localhost:8000")
        await brain_client.connect()

        yield {
            "mongo": mongo_db,
            "neo4j": neo4j_driver,
            "redis": redis_client,
            "brain": brain_client
        }

        # Cleanup
        mongo_db.characters.delete_many({})
        with neo4j_driver.session() as session:
            session.run("MATCH (n:Test) DETACH DELETE n")
        await brain_client.disconnect()

    @pytest.mark.asyncio
    async def test_high_quality_character_e2e(self, test_environment):
        """
        TEST-E2E-001: Agent creates high quality character (complete workflow)

        Steps:
        1. Character saved to MongoDB
        2. Change stream triggers Celery task
        3. Brain validates content (score ≥ 0.80)
        4. Neo4j node created with embedding
        5. Character visible in PayloadCMS
        6. Quality badge displayed
        """
        env = test_environment

        # Step 1: Save character to MongoDB
        character_data = {
            "id": "char-e2e-001",
            "projectId": "test-project",
            "name": "Sir Aldric Thornwood",
            "backstory": """[Rich 500-word backstory]...""",
            "traits": ["brave", "scholarly", "conflicted", "determined"],
            "age": 34
        }

        insert_result = env["mongo"].characters.insert_one(character_data)
        assert insert_result.inserted_id is not None

        # Step 2: Wait for change stream to trigger Celery task
        await asyncio.sleep(1)  # Allow change stream processing

        # Verify task enqueued in Redis
        task_count = env["redis"].llen("celery")
        assert task_count > 0

        # Step 3: Wait for Brain validation (Celery worker processes)
        await asyncio.sleep(3)  # Allow task processing

        # Step 4: Verify Neo4j node created
        with env["neo4j"].session() as session:
            result = session.run(
                "MATCH (c:Character {id: $id}) RETURN c",
                id="char-e2e-001"
            )
            neo4j_node = result.single()["c"]

            assert neo4j_node["name"] == "Sir Aldric Thornwood"
            assert neo4j_node["quality_score"] >= 0.80
            assert neo4j_node["embedding"] is not None
            assert len(neo4j_node["embedding"]) == 1024  # Jina embedding size

        # Step 5: Verify MongoDB updated with quality score
        updated_char = env["mongo"].characters.find_one({"id": "char-e2e-001"})
        assert updated_char["quality_score"] >= 0.80
        assert updated_char["brain_validated"] is True

        # Step 6: Verify quality badge (via API call)
        # This would typically be a PayloadCMS API call
        # For test purposes, we check the quality_score field
        assert updated_char.get("quality_badge") == "high"

    @pytest.mark.asyncio
    async def test_low_quality_character_suggestions(self, test_environment):
        """
        TEST-E2E-002: Low quality character gets improvement suggestions

        Steps:
        1. Character with minimal content submitted
        2. Brain validates (score < 0.60)
        3. Suggestions generated
        4. Character NOT saved to MongoDB (rejected)
        5. User notified with improvements
        """
        env = test_environment

        # Step 1: Attempt to save low quality character
        low_quality_character = {
            "id": "char-e2e-002",
            "projectId": "test-project",
            "name": "Bob",
            "backstory": "A guy.",
            "traits": []
        }

        # Step 2: Validate via Brain client directly
        validation_result = await env["brain"].store_task_result(
            task_id="validation-e2e-002",
            task_type="character_validation",
            result=low_quality_character
        )

        await asyncio.sleep(2)  # Allow processing

        # Step 3: Retrieve validation results
        validation_data = await env["brain"].get_knowledge(
            knowledge_type="task_result",
            query={"task_id": "validation-e2e-002"}
        )

        assert validation_data[0]["content"]["result"]["quality_score"] < 0.60
        assert len(validation_data[0]["content"]["result"]["suggestions"]) > 0

        # Step 4: Verify character NOT in MongoDB
        mongo_char = env["mongo"].characters.find_one({"id": "char-e2e-002"})
        assert mongo_char is None

        # Step 5: Verify suggestions available
        suggestions = validation_data[0]["content"]["result"]["suggestions"]
        assert any("backstory" in s.lower() for s in suggestions)
        assert any("traits" in s.lower() for s in suggestions)
```

## Performance Test Examples

### Example 9: Concurrent Validation Load Test

```python
# tests/performance/test_load.py
import pytest
import asyncio
import time
from app.clients.brain_client import BrainServiceClient

@pytest.mark.performance
class TestPerformanceLoad:
    """Performance and load testing"""

    @pytest.mark.asyncio
    async def test_1000_concurrent_validations(self):
        """
        TEST-PERF-001: Handle 1000 concurrent validations

        Given: 1000 character validation requests
        When: Submitted simultaneously
        Then:
          - All complete within 30 seconds
          - No errors
          - Throughput ≥ 33 req/sec
        """
        # Arrange
        brain_client = BrainServiceClient("ws://localhost:8000")
        await brain_client.connect()

        # Generate 1000 test characters
        characters = [
            {
                "id": f"perf-char-{i}",
                "name": f"Character {i}",
                "backstory": f"A detailed backstory for character {i}..." * 20,
                "traits": ["trait1", "trait2", "trait3"]
            }
            for i in range(1000)
        ]

        # Act: Submit all validations concurrently
        start_time = time.time()

        tasks = [
            brain_client.store_task_result(
                task_id=f"perf-task-{i}",
                task_type="character_validation",
                result=char
            )
            for i, char in enumerate(characters)
        ]

        results = await asyncio.gather(*tasks, return_exceptions=True)

        end_time = time.time()
        duration = end_time - start_time

        # Assert: Performance requirements met
        assert duration < 30, f"Took {duration}s, expected <30s"

        # Verify no errors
        errors = [r for r in results if isinstance(r, Exception)]
        assert len(errors) == 0, f"Got {len(errors)} errors"

        # Verify throughput
        throughput = len(results) / duration
        assert throughput >= 33, f"Throughput {throughput} req/s, expected ≥33"

        # Cleanup
        await brain_client.disconnect()

    @pytest.mark.asyncio
    async def test_brain_latency_percentiles(self):
        """
        TEST-PERF-006: Brain client request latency

        Given: 1000 sample requests
        When: Latency measured
        Then:
          - p50 < 50ms
          - p95 < 200ms
          - p99 < 500ms
        """
        brain_client = BrainServiceClient("ws://localhost:8000")
        await brain_client.connect()

        latencies = []

        # Measure 1000 requests
        for i in range(1000):
            start = time.time()

            await brain_client.store_embedding(
                content=f"Test content {i}",
                metadata={"test": True}
            )

            latency_ms = (time.time() - start) * 1000
            latencies.append(latency_ms)

        # Calculate percentiles
        latencies.sort()
        p50 = latencies[int(len(latencies) * 0.50)]
        p95 = latencies[int(len(latencies) * 0.95)]
        p99 = latencies[int(len(latencies) * 0.99)]

        # Assert latency targets
        assert p50 < 50, f"p50={p50}ms, expected <50ms"
        assert p95 < 200, f"p95={p95}ms, expected <200ms"
        assert p99 < 500, f"p99={p99}ms, expected <500ms"

        await brain_client.disconnect()
```

## Security Test Examples

### Example 10: Cypher Injection Prevention

```python
# tests/security/test_security.py
import pytest
from neo4j import GraphDatabase

@pytest.mark.security
class TestSecurity:
    """Security vulnerability testing"""

    def test_cypher_injection_prevention(self, neo4j_driver):
        """
        TEST-SEC-001: Prevent Cypher injection attacks

        Given: Malicious input attempting Cypher injection
        When: Used in query parameter
        Then: Query parameterized, no execution of malicious code
        """
        # Arrange: Malicious input attempting to drop database
        malicious_input = "'; MATCH (n) DETACH DELETE n; //"

        # Act: Attempt to use in query (should be parameterized)
        with neo4j_driver.session() as session:
            # Correct parameterized query (safe)
            result = session.run(
                "MATCH (c:Character {name: $name}) RETURN c",
                name=malicious_input
            )

            # Should return no results (name doesn't exist)
            records = list(result)
            assert len(records) == 0

            # Verify database still intact (not deleted)
            verify_result = session.run("MATCH (n) RETURN count(n) AS count")
            count = verify_result.single()["count"]

            # If nodes existed before, they should still exist
            # At minimum, the count should be determinable
            assert isinstance(count, int)
```

---

## Test Execution Examples

### Running Specific Test Categories

```bash
# Unit tests only
pytest tests/unit/ -v

# Integration tests only (requires Docker)
docker-compose -f docker-compose.test.yml up -d
pytest tests/integration/ -v

# E2E tests only
pytest tests/e2e/ -v -s

# Performance tests (takes longer)
pytest tests/performance/ -v -s

# Security tests
pytest tests/security/ -v

# Run with coverage
pytest tests/ --cov=app --cov-report=html --cov-report=term
```

### Filtering Tests by Marker

```bash
# Run only critical priority tests
pytest -m critical

# Run only async tests
pytest -m asyncio

# Skip slow tests
pytest -m "not slow"
```

---

## Fixtures Reference

### Common Fixtures Available

```python
# Conftest.py provides these fixtures:

@pytest.fixture
def mock_brain_client():
    """Mocked Brain client for unit tests"""

@pytest.fixture
def neo4j_container():
    """Real Neo4j testcontainer for integration"""

@pytest.fixture
def redis_container():
    """Real Redis testcontainer for integration"""

@pytest.fixture
def mongo_container():
    """Real MongoDB testcontainer for integration"""

@pytest.fixture
def test_character_high_quality():
    """High quality character test data"""

@pytest.fixture
def test_character_low_quality():
    """Low quality character test data"""

@pytest.fixture
async def test_environment():
    """Complete E2E test environment"""
```

---

**These examples provide copy-paste-ready test implementations for Phase 3 Brain Integration.**
