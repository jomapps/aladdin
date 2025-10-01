# Phase 5 Configuration System - Architecture Diagrams

**Version**: 1.0.0
**Date**: 2025-10-01
**Companion to**: phase-5-configuration-architecture.md

---

## System Architecture Overview

```mermaid
graph TB
    subgraph "Data Preparation Agent"
        subgraph "New: Configuration Layer"
            CM[ConfigManager<br/>Singleton]
            ER[EntityRegistry<br/>Config Storage]
            PM[PromptManager<br/>Template Engine]
            CV[ConfigValidator<br/>Schema Validation]
            CL[ConfigLoader<br/>File System]
        end

        subgraph "Existing: Core Components"
            AGENT[DataPreparationAgent<br/>Main Orchestrator]
            CG[ContextGatherer<br/>Context Assembly]
            MG[MetadataGenerator<br/>LLM Metadata]
            DE[DataEnricher<br/>Data Enhancement]
            RD[RelationshipDiscoverer<br/>Link Discovery]
            VAL[BrainDocumentValidator<br/>Quality Check]
            CACHE[CacheManager<br/>Redis Cache]
            QUEUE[QueueManager<br/>BullMQ Queue]
        end

        CM --> ER
        CM --> CV
        ER --> CL
        PM --> CM

        AGENT --> CM
        AGENT --> CG
        AGENT --> MG
        AGENT --> DE
        AGENT --> RD
        AGENT --> VAL
        AGENT --> CACHE
        AGENT --> QUEUE

        MG --> PM
        VAL --> CM
        DE --> CM
        RD --> CM
    end

    USER[User Request] --> AGENT
    AGENT --> BRAIN[Brain Service<br/>Storage]

    style CM fill:#e1f5ff
    style ER fill:#e1f5ff
    style PM fill:#e1f5ff
    style CV fill:#e1f5ff
    style CL fill:#e1f5ff
```

---

## Configuration Loading Flow

```mermaid
sequenceDiagram
    participant User
    participant Agent as DataPreparationAgent
    participant CM as ConfigManager
    participant ER as EntityRegistry
    participant CV as ConfigValidator
    participant Cache as LRU Cache

    User->>Agent: prepare(data, options)
    Agent->>CM: getConfig(entityType)

    CM->>Cache: check cache
    alt Config Cached
        Cache-->>CM: return cached config
    else Not Cached
        CM->>ER: lookup(entityType)
        ER-->>CM: return config

        alt Has extends
            CM->>CM: getConfig(baseType)
            CM->>CM: deepMerge(base, config)
        end

        CM->>CV: validate(config)
        CV-->>CM: validation result

        alt Valid
            CM->>Cache: set(entityType, config)
        else Invalid
            CM-->>Agent: throw ConfigurationError
        end
    end

    CM-->>Agent: return config
    Agent->>Agent: process with config
    Agent-->>User: return result
```

---

## Configuration Inheritance Chain

```mermaid
graph LR
    DEFAULT[Default Config<br/>Built-in Fallback] --> BASE[Base Config<br/>config/defaults.ts]
    BASE --> CHAR[Character Config<br/>config/entities/character.ts]
    BASE --> SCENE[Scene Config<br/>config/entities/scene.ts]
    BASE --> LOC[Location Config<br/>config/entities/location.ts]
    BASE --> EP[Episode Config<br/>config/entities/episode.ts]
    BASE --> CUSTOM[Custom Config<br/>User-defined]

    style DEFAULT fill:#ffcccc
    style BASE fill:#ffffcc
    style CHAR fill:#ccffcc
    style SCENE fill:#ccffcc
    style LOC fill:#ccffcc
    style EP fill:#ccffcc
    style CUSTOM fill:#ccccff
```

---

## Entity Configuration Structure

```mermaid
classDiagram
    class EntityConfig {
        +string entityType
        +string collectionSlug
        +string? extends
        +MetadataConfig metadata
        +LLMConfig llm
        +RelationshipConfig relationships
        +QualityConfig quality
        +ProcessingConfig processing
        +FeatureFlags features
    }

    class MetadataConfig {
        +string[] required
        +string[] optional
        +Map~string,FieldConfig~ schema
        +Map~string,any~ defaults
    }

    class LLMConfig {
        +PromptTemplates prompts
        +string? model
        +number? temperature
        +number? maxTokens
    }

    class PromptTemplates {
        +string analyze
        +string extract
        +string summarize
        +string relationships
    }

    class RelationshipConfig {
        +RelationshipType[] allowed
        +boolean autoDiscover
        +number confidenceThreshold
    }

    class QualityConfig {
        +number minimumScore
        +string[] requiredFields
        +ValidationRule[] validationRules
    }

    class ProcessingConfig {
        +boolean async
        +Priority priority
        +number cacheTTL
        +number retryAttempts
    }

    class FeatureFlags {
        +boolean enableLLM
        +boolean enableCache
        +boolean enableQueue
        +boolean enableValidation
        +boolean enableRelationships
    }

    EntityConfig --> MetadataConfig
    EntityConfig --> LLMConfig
    EntityConfig --> RelationshipConfig
    EntityConfig --> QualityConfig
    EntityConfig --> ProcessingConfig
    EntityConfig --> FeatureFlags
    LLMConfig --> PromptTemplates
```

---

## Validation Pipeline

```mermaid
flowchart TD
    START([Document Created]) --> SCHEMA{Schema<br/>Validation}

    SCHEMA -->|Invalid| ERROR1[Throw ConfigurationError]
    SCHEMA -->|Valid| CUSTOM{Custom<br/>Validation}

    CUSTOM -->|Failed| ERROR2[Collect Errors]
    CUSTOM -->|Passed| RUNTIME{Runtime<br/>Validation}

    RUNTIME -->|Failed| ERROR3[Collect Errors/Warnings]
    RUNTIME -->|Passed| QUALITY{Quality<br/>Check}

    QUALITY -->|Below Threshold| ERROR4[Quality Error]
    QUALITY -->|Above Threshold| RELATIONS{Relationship<br/>Validation}

    RELATIONS -->|Invalid| ERROR5[Relationship Error]
    RELATIONS -->|Valid| SUCCESS([Document Valid])

    ERROR2 --> COMBINE[Combine All Errors]
    ERROR3 --> COMBINE
    ERROR4 --> COMBINE
    ERROR5 --> COMBINE

    COMBINE --> RETURN{Has<br/>Errors?}
    RETURN -->|Yes| FAIL[Reject Document]
    RETURN -->|No, Only Warnings| WARN[Log Warnings & Continue]

    style ERROR1 fill:#ffcccc
    style ERROR2 fill:#ffcccc
    style ERROR3 fill:#ffcccc
    style ERROR4 fill:#ffcccc
    style ERROR5 fill:#ffcccc
    style FAIL fill:#ff0000,color:#fff
    style SUCCESS fill:#00ff00
    style WARN fill:#ffff00
```

---

## Prompt Template Processing

```mermaid
sequenceDiagram
    participant MG as MetadataGenerator
    participant PM as PromptManager
    participant TE as TemplateEngine
    participant Cache as Compiled Cache
    participant LLM as LLM Client

    MG->>PM: getPrompt(entityType, stage, vars)
    PM->>PM: getCacheKey(entityType, stage)

    alt Template Compiled
        PM->>Cache: get(cacheKey)
        Cache-->>PM: compiled template
    else Not Compiled
        PM->>PM: getTemplate(entityType, stage)
        PM->>TE: compile(template)
        TE-->>PM: compiled function
        PM->>Cache: set(cacheKey, compiled)
    end

    PM->>TE: interpolate(compiled, vars)
    TE-->>PM: final prompt
    PM-->>MG: return prompt

    MG->>LLM: complete(prompt)
    LLM-->>MG: response
```

---

## Configuration Hot Reload (Development)

```mermaid
sequenceDiagram
    participant FS as File System
    participant Watcher as ConfigWatcher
    participant Loader as ConfigLoader
    participant ER as EntityRegistry
    participant CM as ConfigManager
    participant Cache as Config Cache

    FS->>Watcher: file changed event
    Watcher->>Loader: load(filePath)
    Loader->>Loader: parse & validate
    Loader-->>Watcher: new config

    Watcher->>ER: register(entityType, config)
    ER->>CM: notify change

    CM->>Cache: invalidate(entityType)
    Cache-->>CM: cache cleared

    CM->>CM: log reload

    Note over CM: Next request will use<br/>updated configuration
```

---

## Performance Optimization Flow

```mermaid
graph TD
    REQUEST[New Request] --> CHECK_CONFIG{Config<br/>Cached?}

    CHECK_CONFIG -->|Yes| USE_CACHED[Use Cached Config<br/>~1ms]
    CHECK_CONFIG -->|No| LOAD[Load Config<br/>~10ms]

    LOAD --> CHECK_INHERIT{Has<br/>extends?}
    CHECK_INHERIT -->|Yes| LOAD_BASE[Load Base Config<br/>~5ms]
    CHECK_INHERIT -->|No| VALIDATE

    LOAD_BASE --> MERGE[Deep Merge<br/>~2ms]
    MERGE --> VALIDATE[Validate Schema<br/>~3ms]

    VALIDATE --> CACHE_CONFIG[Cache Config<br/>~1ms]
    CACHE_CONFIG --> USE_CACHED

    USE_CACHED --> CHECK_PROMPT{Prompt<br/>Cached?}

    CHECK_PROMPT -->|Yes| USE_PROMPT[Use Compiled<br/>~1ms]
    CHECK_PROMPT -->|No| COMPILE[Compile Template<br/>~5ms]

    COMPILE --> CACHE_PROMPT[Cache Compiled<br/>~1ms]
    CACHE_PROMPT --> USE_PROMPT

    USE_PROMPT --> INTERPOLATE[Interpolate Vars<br/>~2ms]
    INTERPOLATE --> PROCESS[Process Request]

    style USE_CACHED fill:#90EE90
    style USE_PROMPT fill:#90EE90
    style LOAD fill:#FFD700
    style COMPILE fill:#FFD700
```

---

## Security Architecture

```mermaid
graph TB
    subgraph "Configuration Source"
        USER_CONFIG[User Config Files]
        BUILTIN[Built-in Configs]
    end

    subgraph "Security Layer"
        PATH_VAL[Path Validator<br/>Allowed Paths Only]
        SCHEMA_VAL[Schema Validator<br/>JSON Schema]
        FUNC_ANAL[Function Analyzer<br/>Dangerous Patterns]
        SANDBOX[VM2 Sandbox<br/>Isolated Execution]
    end

    subgraph "Safe Execution"
        SAFE_FUNCS[Predefined Validators<br/>Allowlist]
        SANDBOXED[Sandboxed Custom<br/>Limited Scope]
    end

    USER_CONFIG --> PATH_VAL
    BUILTIN --> PATH_VAL

    PATH_VAL --> SCHEMA_VAL
    SCHEMA_VAL --> FUNC_ANAL

    FUNC_ANAL -->|Safe| SAFE_FUNCS
    FUNC_ANAL -->|Custom| SANDBOX

    SANDBOX --> SANDBOXED

    SAFE_FUNCS --> AGENT[Agent Processing]
    SANDBOXED --> AGENT

    style PATH_VAL fill:#ff9999
    style SCHEMA_VAL fill:#ff9999
    style FUNC_ANAL fill:#ff9999
    style SANDBOX fill:#ff9999
    style SAFE_FUNCS fill:#99ff99
```

---

## Migration Phases

```mermaid
gantt
    title Configuration System Migration Timeline
    dateFormat  YYYY-MM-DD
    section Phase 1: Preparation
    Create config structure    :p1-1, 2025-10-01, 1d
    Define types              :p1-2, after p1-1, 1d
    Write entity configs      :p1-3, after p1-2, 1d

    section Phase 2: Foundation
    Implement ConfigManager   :p2-1, after p1-3, 1d
    Implement EntityRegistry  :p2-2, after p2-1, 1d
    Implement PromptManager   :p2-3, after p2-2, 1d
    Add to agent init        :p2-4, after p2-3, 1d

    section Phase 3: Integration
    Update MetadataGenerator  :p3-1, after p2-4, 1d
    Update Validator         :p3-2, after p3-1, 1d
    Update DataEnricher      :p3-3, after p3-2, 1d
    Add feature flags        :p3-4, after p3-3, 1d

    section Phase 4: Complete
    Full integration         :p4-1, after p3-4, 2d
    Performance optimization :p4-2, after p4-1, 1d
    Documentation           :p4-3, after p4-2, 1d

    section Testing
    Unit tests              :test1, after p2-4, 7d
    Integration tests       :test2, after p3-4, 3d
    Performance tests       :test3, after p4-2, 1d
```

---

## Component Interaction Matrix

| Component | ConfigManager | PromptManager | EntityRegistry | Validator |
|-----------|--------------|---------------|----------------|-----------|
| **DataPreparationAgent** | Gets entity configs | - | - | - |
| **MetadataGenerator** | - | Gets prompts | - | - |
| **DataEnricher** | Gets quality thresholds | - | - | - |
| **RelationshipDiscoverer** | Gets relationship rules | - | - | - |
| **BrainDocumentValidator** | Gets validation rules | - | - | Uses |
| **ConfigManager** | - | Provides prompts | Loads configs | Validates configs |
| **PromptManager** | Reads config | - | - | - |

---

## File Structure

```
src/lib/agents/data-preparation/
├── config/
│   ├── types.ts                    # Type definitions
│   ├── defaults.ts                 # Base configuration
│   ├── manager.ts                  # ConfigManager class
│   ├── validator.ts                # ConfigValidator class
│   ├── loader.ts                   # ConfigLoader class
│   ├── entities/
│   │   ├── index.ts               # Export all configs
│   │   ├── character.ts           # Character config
│   │   ├── scene.ts               # Scene config
│   │   ├── location.ts            # Location config
│   │   ├── episode.ts             # Episode config
│   │   ├── dialogue.ts            # Dialogue config
│   │   └── concept.ts             # Concept config
│   ├── prompts/
│   │   ├── manager.ts             # PromptManager class
│   │   ├── engine.ts              # TemplateEngine class
│   │   └── cache.ts               # Prompt caching
│   └── index.ts                    # Main exports
├── agent.ts                        # Updated agent
├── metadata-generator.ts           # Updated generator
├── validator.ts                    # Updated validator
├── data-enricher.ts               # Updated enricher
└── relationship-discoverer.ts     # Updated discoverer
```

---

## Memory and Performance Profile

```mermaid
pie title Memory Usage Distribution
    "Base Config (1KB)" : 10
    "Entity Configs (2KB each × 6)" : 120
    "Compiled Prompts (500B each × 24)" : 12
    "LRU Cache Overhead" : 8
    "ConfigManager State" : 5
    "Total: ~25KB" : 0
```

---

## Error Handling Flow

```mermaid
stateDiagram-v2
    [*] --> LoadConfig
    LoadConfig --> ValidateSchema

    ValidateSchema --> SchemaError: Invalid Schema
    ValidateSchema --> CheckInheritance: Valid Schema

    CheckInheritance --> LoadBase: Has extends
    CheckInheritance --> ValidateRules: No extends
    LoadBase --> MergeConfigs
    MergeConfigs --> ValidateRules

    ValidateRules --> ValidationError: Invalid Rules
    ValidateRules --> CacheConfig: Valid Rules

    CacheConfig --> [*]: Success

    SchemaError --> LogError
    ValidationError --> LogError
    LogError --> UseDefaults
    UseDefaults --> [*]: Fallback

    note right of UseDefaults
        Always fallback to defaults
        Never block execution
    end note
```

---

## Extensibility Points

```mermaid
mindmap
  root((Configuration<br/>System))
    Entity Types
      Built-in Types
        Character
        Scene
        Location
        Episode
        Dialogue
        Concept
      Custom Types
        User-defined
        Plugin-based
    Validators
      Predefined
        required
        minLength
        pattern
        range
        oneOf
      Custom
        Sandboxed functions
        Type-safe builders
    Prompts
      Templates
        4-stage prompts
        Custom stages
      Variables
        Dynamic interpolation
        Context injection
    Relationships
      Types
        APPEARS_IN
        RELATES_TO
        Custom types
      Discovery
        Auto-discovery
        Manual definition
    Features
      Toggles
        enableLLM
        enableCache
        enableQueue
        enableValidation
      Processing
        Async/Sync
        Priority
        TTL
```

---

## Summary

These diagrams provide visual representations of:

1. **System Architecture**: Overall structure and component relationships
2. **Data Flow**: How data moves through the configuration system
3. **Inheritance**: Configuration inheritance chain
4. **Processing**: Request processing pipeline
5. **Security**: Security layers and validation
6. **Performance**: Optimization strategies and timings
7. **Migration**: Implementation phases and timeline

All diagrams use standard notation (Mermaid) for consistency and can be rendered in most documentation viewers.

---

**Related Documents**:
- phase-5-configuration-architecture.md (Main architecture document)
- PHASE_5_CONFIGURATION_PLAN.md (Implementation plan)

**Diagram Tools**:
- Mermaid (https://mermaid.js.org/)
- GitHub/GitLab native rendering
- VS Code Mermaid extensions
