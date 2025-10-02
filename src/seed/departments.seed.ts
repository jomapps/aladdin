/**
 * Departments Seed Data
 *
 * Creates 7 core movie production departments with complete configuration:
 * - Story Department (Step 1): Narrative development and plot structure
 * - Character Department (Step 2): Character creation and development
 * - Visual Department (Step 3): Art direction and cinematography
 * - Image Quality Department (Step 4): Image consistency and quality control
 * - Video Department (Step 5): Video editing and post-production
 * - Audio Department (Step 6): Sound design and music
 * - Production Department (Step 7): Project management and coordination
 *
 * Process Flow Order (codeDepNumber):
 * 1. Story → 2. Character → 3. Visual → 4. Image Quality → 5. Video → 6. Audio → 7. Production
 *
 * @module seed/departments
 */

import type { Payload } from 'payload'

/**
 * Department seed data with complete configuration
 */
export const departmentsSeedData = [
  {
    slug: 'story',
    name: 'Story Department',
    description:
      'Develops narrative structure, plot, themes, and story arcs. Coordinates plot specialists, dialogue writers, theme analysts, and pacing experts to create compelling narratives.',
    icon: '📖',
    color: '#8B5CF6',
    codeDepNumber: 1,
    isActive: true,
    coreDepartment: true,
    gatherCheck: true,
    defaultModel: 'anthropic/claude-sonnet-4.5',
    maxAgentSteps: 25,
    coordinationSettings: {
      allowParallelExecution: true,
      requiresDepartmentHeadReview: true,
      minQualityThreshold: 85,
      maxRetries: 3,
    },
    performance: {
      totalExecutions: 0,
      successfulExecutions: 0,
      averageQualityScore: 0,
      averageExecutionTime: 0,
    },
  },
  {
    slug: 'character',
    name: 'Character Department',
    description:
      'Creates character profiles, development arcs, and relationships. Manages character consistency, psychology, and growth throughout the narrative.',
    icon: '👤',
    color: '#EC4899',
    codeDepNumber: 2,
    isActive: true,
    coreDepartment: true,
    gatherCheck: true,
    defaultModel: 'anthropic/claude-sonnet-4.5',
    maxAgentSteps: 25,
    coordinationSettings: {
      allowParallelExecution: true,
      requiresDepartmentHeadReview: true,
      minQualityThreshold: 85,
      maxRetries: 3,
    },
    performance: {
      totalExecutions: 0,
      successfulExecutions: 0,
      averageQualityScore: 0,
      averageExecutionTime: 0,
    },
  },
  {
    slug: 'visual',
    name: 'Visual Department',
    description:
      'Handles art direction, cinematography, color grading, and composition. Creates visual style guides and shot descriptions.',
    icon: '🎨',
    color: '#F59E0B',
    codeDepNumber: 3,
    isActive: true,
    coreDepartment: true,
    gatherCheck: true,
    defaultModel: 'anthropic/claude-sonnet-4.5',
    maxAgentSteps: 20,
    coordinationSettings: {
      allowParallelExecution: true,
      requiresDepartmentHeadReview: true,
      minQualityThreshold: 80,
      maxRetries: 3,
    },
    performance: {
      totalExecutions: 0,
      successfulExecutions: 0,
      averageQualityScore: 0,
      averageExecutionTime: 0,
    },
  },
  {
    slug: 'image-quality',
    name: 'Image Quality Department',
    description:
      'Ensures visual consistency and quality across all generated images. Manages master references, character profiles, and image verification.',
    icon: '🖼️',
    color: '#A855F7',
    codeDepNumber: 4,
    isActive: true,
    coreDepartment: true,
    gatherCheck: true,
    defaultModel: 'anthropic/claude-sonnet-4.5',
    maxAgentSteps: 20,
    coordinationSettings: {
      allowParallelExecution: true,
      requiresDepartmentHeadReview: true,
      minQualityThreshold: 90,
      maxRetries: 3,
    },
    performance: {
      totalExecutions: 0,
      successfulExecutions: 0,
      averageQualityScore: 0,
      averageExecutionTime: 0,
    },
  },
  {
    slug: 'video',
    name: 'Video Department',
    description:
      'Manages video editing, VFX, transitions, and post-production. Coordinates timing, pacing, and visual effects integration.',
    icon: '🎬',
    color: '#10B981',
    codeDepNumber: 5,
    isActive: true,
    coreDepartment: true,
    gatherCheck: true,
    defaultModel: 'anthropic/claude-sonnet-4.5',
    maxAgentSteps: 20,
    coordinationSettings: {
      allowParallelExecution: true,
      requiresDepartmentHeadReview: true,
      minQualityThreshold: 80,
      maxRetries: 3,
    },
    performance: {
      totalExecutions: 0,
      successfulExecutions: 0,
      averageQualityScore: 0,
      averageExecutionTime: 0,
    },
  },
  {
    slug: 'audio',
    name: 'Audio Department',
    description:
      'Handles sound design, music composition, dialogue mixing, and foley. Creates immersive audio experiences and emotional soundscapes.',
    icon: '🎵',
    color: '#3B82F6',
    codeDepNumber: 6,
    isActive: true,
    coreDepartment: true,
    gatherCheck: true,
    defaultModel: 'anthropic/claude-sonnet-4.5',
    maxAgentSteps: 20,
    coordinationSettings: {
      allowParallelExecution: true,
      requiresDepartmentHeadReview: true,
      minQualityThreshold: 80,
      maxRetries: 3,
    },
    performance: {
      totalExecutions: 0,
      successfulExecutions: 0,
      averageQualityScore: 0,
      averageExecutionTime: 0,
    },
  },
  {
    slug: 'production',
    name: 'Production Department',
    description:
      'Manages project scheduling, resource allocation, budget tracking, and cross-department coordination. Ensures smooth workflow and timely delivery.',
    icon: '📋',
    color: '#6366F1',
    codeDepNumber: 7,
    isActive: true,
    coreDepartment: true,
    gatherCheck: true,
    defaultModel: 'qwen/qwen3-vl-235b-a22b-thinking',
    maxAgentSteps: 15,
    coordinationSettings: {
      allowParallelExecution: false,
      requiresDepartmentHeadReview: true,
      minQualityThreshold: 75,
      maxRetries: 2,
    },
    performance: {
      totalExecutions: 0,
      successfulExecutions: 0,
      averageQualityScore: 0,
      averageExecutionTime: 0,
    },
  },
]

/**
 * Seed departments collection
 * @param payload - Payload CMS instance
 */
export async function seedDepartments(payload: Payload): Promise<void> {
  console.log('🏢 Seeding departments...')

  for (const deptData of departmentsSeedData) {
    try {
      // Check if department already exists
      const existing = await payload.find({
        collection: 'departments',
        where: {
          slug: {
            equals: deptData.slug,
          },
        },
        limit: 1,
      })

      if (existing.docs.length > 0) {
        console.log(`  ⏭️  Department "${deptData.name}" already exists, skipping...`)
        continue
      }

      // Create new department
      await payload.create({
        collection: 'departments',
        data: deptData,
      })

      console.log(`  ✅ Created department: ${deptData.name}`)
    } catch (error) {
      console.error(`  ❌ Failed to create department ${deptData.name}:`, error)
      throw error
    }
  }

  console.log('✅ Departments seeded successfully\n')
}
