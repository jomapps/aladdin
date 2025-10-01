/**
 * Feature Flags Examples
 *
 * This file demonstrates how to use feature flags to control
 * Data Preparation Agent behavior at runtime.
 */

import { DataPreparationAgent } from '../../agent'
import type { AgentConfig } from '../../types'

/**
 * Example 1: Development Configuration
 *
 * Optimized for fast feedback during development
 */
export function getDevelopmentAgent(): DataPreparationAgent {
  const devConfig: AgentConfig = {
    llm: {
      apiKey: process.env.OPENROUTER_API_KEY!,
      baseUrl: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
      defaultModel: 'openai/gpt-3.5-turbo', // Faster, cheaper model for dev
      backupModel: 'openai/gpt-3.5-turbo',
    },

    brain: {
      apiUrl: process.env.BRAIN_SERVICE_BASE_URL || 'https://brain.ft.tc',
      apiKey: process.env.BRAIN_SERVICE_API_KEY!,
    },

    redis: {
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    },

    // Short TTLs for development (faster cache invalidation)
    cache: {
      projectContextTTL: 60, // 1 minute
      documentTTL: 120, // 2 minutes
      entityTTL: 60, // 1 minute
    },

    // Single worker for debugging
    queue: {
      concurrency: 1,
      maxRetries: 1, // Fail fast in dev
    },

    // Enable all features for testing
    features: {
      enableCaching: true,
      enableQueue: false, // Sync processing for debugging
      enableValidation: true, // Catch errors early
      enableRelationshipDiscovery: true,
    },
  }

  return new DataPreparationAgent(devConfig)
}

/**
 * Example 2: Production Configuration
 *
 * Optimized for performance and reliability
 */
export function getProductionAgent(): DataPreparationAgent {
  const prodConfig: AgentConfig = {
    llm: {
      apiKey: process.env.OPENROUTER_API_KEY!,
      baseUrl: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
      defaultModel: 'anthropic/claude-sonnet-4.5', // High quality model
      backupModel: 'openai/gpt-4', // High quality backup
    },

    brain: {
      apiUrl: process.env.BRAIN_SERVICE_BASE_URL || 'https://brain.ft.tc',
      apiKey: process.env.BRAIN_SERVICE_API_KEY!,
    },

    redis: {
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    },

    // Long TTLs for production (better performance)
    cache: {
      projectContextTTL: 600, // 10 minutes
      documentTTL: 3600, // 1 hour
      entityTTL: 1800, // 30 minutes
    },

    // High concurrency for throughput
    queue: {
      concurrency: 10,
      maxRetries: 3,
    },

    // All features enabled
    features: {
      enableCaching: true,
      enableQueue: true, // Async processing
      enableValidation: true,
      enableRelationshipDiscovery: true,
    },
  }

  return new DataPreparationAgent(prodConfig)
}

/**
 * Example 3: Fast Processing Configuration
 *
 * Minimal processing for speed-critical operations
 */
export function getFastAgent(): DataPreparationAgent {
  const fastConfig: AgentConfig = {
    llm: {
      apiKey: process.env.OPENROUTER_API_KEY!,
      baseUrl: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
      defaultModel: 'openai/gpt-3.5-turbo', // Fast model
    },

    brain: {
      apiUrl: process.env.BRAIN_SERVICE_BASE_URL || 'https://brain.ft.tc',
      apiKey: process.env.BRAIN_SERVICE_API_KEY!,
    },

    redis: {
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    },

    cache: {
      projectContextTTL: 300,
      documentTTL: 600,
      entityTTL: 300,
    },

    queue: {
      concurrency: 5,
      maxRetries: 2,
    },

    // Minimal features for speed
    features: {
      enableCaching: true, // Keep caching for performance
      enableQueue: true,
      enableValidation: false, // Skip validation for speed
      enableRelationshipDiscovery: false, // Skip relationship discovery
    },
  }

  return new DataPreparationAgent(fastConfig)
}

/**
 * Example 4: Quality-First Configuration
 *
 * Maximum quality, slower but more accurate
 */
export function getQualityAgent(): DataPreparationAgent {
  const qualityConfig: AgentConfig = {
    llm: {
      apiKey: process.env.OPENROUTER_API_KEY!,
      baseUrl: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
      defaultModel: 'anthropic/claude-sonnet-4.5', // Best model
      backupModel: 'anthropic/claude-3-opus', // Best backup
    },

    brain: {
      apiUrl: process.env.BRAIN_SERVICE_BASE_URL || 'https://brain.ft.tc',
      apiKey: process.env.BRAIN_SERVICE_API_KEY!,
    },

    redis: {
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    },

    // Shorter TTL to ensure fresh data
    cache: {
      projectContextTTL: 300,
      documentTTL: 600,
      entityTTL: 300,
    },

    // Lower concurrency for careful processing
    queue: {
      concurrency: 3,
      maxRetries: 5, // More retries for reliability
    },

    // All features enabled for maximum quality
    features: {
      enableCaching: true,
      enableQueue: true,
      enableValidation: true, // Strict validation
      enableRelationshipDiscovery: true, // Full relationship discovery
    },
  }

  return new DataPreparationAgent(qualityConfig)
}

/**
 * Example 5: Cost-Optimized Configuration
 *
 * Minimize LLM costs while maintaining reasonable quality
 */
export function getCostOptimizedAgent(): DataPreparationAgent {
  const costConfig: AgentConfig = {
    llm: {
      apiKey: process.env.OPENROUTER_API_KEY!,
      baseUrl: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
      defaultModel: 'openai/gpt-3.5-turbo', // Cheapest model
      backupModel: 'openai/gpt-3.5-turbo',
    },

    brain: {
      apiUrl: process.env.BRAIN_SERVICE_BASE_URL || 'https://brain.ft.tc',
      apiKey: process.env.BRAIN_SERVICE_API_KEY!,
    },

    redis: {
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    },

    // Long TTL to maximize cache hits
    cache: {
      projectContextTTL: 1800, // 30 minutes
      documentTTL: 7200, // 2 hours
      entityTTL: 3600, // 1 hour
    },

    queue: {
      concurrency: 5,
      maxRetries: 2,
    },

    // Cache everything, minimal LLM usage
    features: {
      enableCaching: true, // Critical for cost savings
      enableQueue: true,
      enableValidation: true,
      enableRelationshipDiscovery: false, // Skip to save tokens
    },
  }

  return new DataPreparationAgent(costConfig)
}

/**
 * Example 6: Environment-Based Configuration
 *
 * Select configuration based on NODE_ENV
 */
export function getAgentForEnvironment(): DataPreparationAgent {
  const env = process.env.NODE_ENV || 'development'

  switch (env) {
    case 'production':
      console.log('[Agent] Using production configuration')
      return getProductionAgent()

    case 'staging':
      console.log('[Agent] Using quality configuration for staging')
      return getQualityAgent()

    case 'test':
      console.log('[Agent] Using fast configuration for testing')
      return getFastAgent()

    case 'development':
    default:
      console.log('[Agent] Using development configuration')
      return getDevelopmentAgent()
  }
}

/**
 * Example 7: Feature Flag Override at Runtime
 */
export function getAgentWithOverrides(overrides: Partial<AgentConfig['features']>): DataPreparationAgent {
  const baseConfig: AgentConfig = {
    llm: {
      apiKey: process.env.OPENROUTER_API_KEY!,
      baseUrl: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
      defaultModel: process.env.OPENROUTER_DEFAULT_MODEL || 'anthropic/claude-sonnet-4.5',
    },

    brain: {
      apiUrl: process.env.BRAIN_SERVICE_BASE_URL || 'https://brain.ft.tc',
      apiKey: process.env.BRAIN_SERVICE_API_KEY!,
    },

    redis: {
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    },

    cache: {
      projectContextTTL: 300,
      documentTTL: 3600,
      entityTTL: 1800,
    },

    queue: {
      concurrency: 5,
      maxRetries: 3,
    },

    // Default features
    features: {
      enableCaching: true,
      enableQueue: true,
      enableValidation: true,
      enableRelationshipDiscovery: true,
    },
  }

  // Apply overrides
  baseConfig.features = {
    ...baseConfig.features,
    ...overrides,
  }

  return new DataPreparationAgent(baseConfig)
}

/**
 * Example 8: Feature Flags from Environment Variables
 */
export function getAgentFromEnv(): DataPreparationAgent {
  const config: AgentConfig = {
    llm: {
      apiKey: process.env.OPENROUTER_API_KEY!,
      baseUrl: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
      defaultModel: process.env.OPENROUTER_DEFAULT_MODEL || 'anthropic/claude-sonnet-4.5',
      backupModel: process.env.OPENROUTER_BACKUP_MODEL,
    },

    brain: {
      apiUrl: process.env.BRAIN_SERVICE_BASE_URL || 'https://brain.ft.tc',
      apiKey: process.env.BRAIN_SERVICE_API_KEY!,
    },

    redis: {
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    },

    cache: {
      projectContextTTL: Number(process.env.CACHE_PROJECT_TTL) || 300,
      documentTTL: Number(process.env.CACHE_DOCUMENT_TTL) || 3600,
      entityTTL: Number(process.env.CACHE_ENTITY_TTL) || 1800,
    },

    queue: {
      concurrency: Number(process.env.QUEUE_CONCURRENCY) || 5,
      maxRetries: Number(process.env.QUEUE_MAX_RETRIES) || 3,
    },

    // Feature flags from environment
    features: {
      enableCaching: process.env.ENABLE_CACHING !== 'false', // Default true
      enableQueue: process.env.ENABLE_QUEUE === 'true', // Default false
      enableValidation: process.env.ENABLE_VALIDATION !== 'false', // Default true
      enableRelationshipDiscovery: process.env.ENABLE_RELATIONSHIPS !== 'false', // Default true
    },
  }

  return new DataPreparationAgent(config)
}

/**
 * Usage Examples
 */

// Example 1: Development usage
async function developmentExample() {
  const agent = getDevelopmentAgent()

  const document = await agent.prepare(
    { id: 'char_001', name: 'Sarah', description: 'Test character' },
    { projectId: 'proj_001', entityType: 'character' }
  )

  console.log('Dev document:', document.id)
}

// Example 2: Production with override
async function productionWithOverride() {
  // Start with production config but disable relationships for this batch
  const agent = getAgentWithOverrides({
    enableRelationshipDiscovery: false, // Skip relationships for speed
  })

  // Process batch quickly
  const items = [
    /* ... */
  ]
  const documents = await agent.prepareBatch(items)

  console.log('Processed:', documents.length, 'items')
}

// Example 3: Environment-based
async function environmentExample() {
  const agent = getAgentForEnvironment()

  // Agent configuration automatically matches NODE_ENV
  const document = await agent.prepare(
    { id: 'scene_001', name: 'Opening Scene', description: '...' },
    { projectId: 'proj_001', entityType: 'scene' }
  )
}

// Example 4: Runtime feature toggle
async function runtimeToggleExample() {
  const agent = getAgentFromEnv()

  // Check feature status
  console.log('Features:', agent.config.features)

  // Process with current feature flags
  const document = await agent.prepare(
    { id: 'loc_001', name: 'Memory Lab', description: '...' },
    { projectId: 'proj_001', entityType: 'location' }
  )
}

/**
 * Feature Flag Decision Matrix
 */
export const featureFlagMatrix = {
  enableCaching: {
    true: 'Better performance, stale data possible',
    false: 'Always fresh data, slower, higher costs',
    recommendedFor: {
      development: true,
      production: true,
      testing: false, // Want fresh data in tests
    },
  },

  enableQueue: {
    true: 'Async processing, non-blocking, higher throughput',
    false: 'Sync processing, blocking, easier debugging',
    recommendedFor: {
      development: false, // Easier to debug
      production: true, // Better performance
      testing: false, // Deterministic execution
    },
  },

  enableValidation: {
    true: 'Catch errors early, prevent bad data',
    false: 'Faster processing, risk of invalid data',
    recommendedFor: {
      development: true, // Catch errors early
      production: true, // Ensure data quality
      testing: true, // Validate test data
    },
  },

  enableRelationshipDiscovery: {
    true: 'Rich relationships, more LLM calls, slower',
    false: 'No relationships, faster, cheaper',
    recommendedFor: {
      development: true, // Full feature testing
      production: true, // Full functionality
      'bulk-import': false, // Speed over relationships
    },
  },
}

/**
 * Environment Variable Reference
 */
export const envVarReference = `
# Feature Flags
ENABLE_CACHING=true              # Enable Redis caching
ENABLE_QUEUE=true                # Enable async queue processing
ENABLE_VALIDATION=true           # Enable document validation
ENABLE_RELATIONSHIPS=true        # Enable relationship discovery

# Cache TTL (seconds)
CACHE_PROJECT_TTL=300           # Project context cache (5 min)
CACHE_DOCUMENT_TTL=3600         # Document cache (1 hour)
CACHE_ENTITY_TTL=1800           # Entity cache (30 min)

# Queue Settings
QUEUE_CONCURRENCY=5             # Number of concurrent workers
QUEUE_MAX_RETRIES=3             # Max retry attempts

# LLM Settings
OPENROUTER_DEFAULT_MODEL=anthropic/claude-sonnet-4.5
OPENROUTER_BACKUP_MODEL=openai/gpt-4

# Environment
NODE_ENV=production             # development | staging | production | test
`

/**
 * Best Practices
 */
export const featureFlagBestPractices = {
  1: 'Use environment variables for runtime configuration',
  2: 'Different configs for different environments (dev/staging/prod)',
  3: 'Enable caching in production for performance',
  4: 'Disable queue in development for easier debugging',
  5: 'Always enable validation in production',
  6: 'Disable expensive features (relationships) for bulk imports',
  7: 'Use fast/cheap models in development',
  8: 'Use high-quality models in production',
  9: 'Monitor feature flag usage with metrics',
  10: 'Document why each flag is enabled/disabled',
}
