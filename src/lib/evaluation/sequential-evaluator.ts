/**
 * Sequential Evaluator
 *
 * Handles sequential department evaluation workflow
 *
 * @see {@link /docs/idea/pages/project-readiness.md} for specification
 */

import { getPayload } from 'payload'
import config from '@/payload.config'
import { MongoClient } from 'mongodb'
import { taskService } from '../task-service/client'
import type { GatherDataItem, PreviousEvaluation } from '../task-service/types'

export interface EvaluationResult {
  taskId: string
  department: string
  status: 'in_progress' | 'queued'
}

export class SequentialEvaluator {
  /**
   * Evaluate a department (must be done sequentially)
   */
  async evaluateDepartment(
    projectId: string,
    departmentNumber: number,
    userId?: string,
  ): Promise<EvaluationResult> {
    const payload = await getPayload({ config })

    // 1. Get department configuration
    const departments = await payload.find({
      collection: 'departments',
      where: {
        codeDepNumber: { equals: departmentNumber },
      },
      limit: 1,
    })

    if (departments.docs.length === 0) {
      throw new Error(`Department with codeDepNumber ${departmentNumber} not found`)
    }

    const department = departments.docs[0]

    // 2. Check if previous department meets threshold (unless dept 1)
    if (departmentNumber > 1) {
      await this.validatePreviousDepartment(projectId, departmentNumber, department)
    }

    // 3. Gather all data from gather database
    const gatherData = await this.getGatherData(projectId)

    // 4. Get all previous evaluations for context
    const previousEvaluations = await this.getPreviousEvaluations(projectId, departmentNumber)

    // 5. Get threshold from department settings
    const threshold =
      (department.coordinationSettings as any)?.minQualityThreshold || 80

    // 6. Submit task to tasks.ft.tc
    const task = await taskService.submitEvaluation({
      projectId,
      departmentSlug: department.slug,
      departmentNumber,
      departmentId: department.id,
      gatherData,
      previousEvaluations,
      threshold,
      userId,
    })

    // 7. Create or update project-readiness record
    const existing = await payload.find({
      collection: 'project-readiness',
      where: {
        and: [
          { projectId: { equals: projectId } },
          { departmentId: { equals: department.id } },
        ],
      },
      limit: 1,
    })

    if (existing.docs.length > 0) {
      // Update existing
      await payload.update({
        collection: 'project-readiness',
        id: existing.docs[0].id,
        data: {
          status: 'in_progress',
          taskId: task.task_id,
          taskStatus: task.status,
          gatherDataCount: gatherData.length,
        },
      })
    } else {
      // Create new
      await payload.create({
        collection: 'project-readiness',
        data: {
          projectId,
          departmentId: department.id,
          status: 'in_progress',
          taskId: task.task_id,
          taskStatus: task.status,
          gatherDataCount: gatherData.length,
        },
      })
    }

    return {
      taskId: task.task_id,
      department: department.slug,
      status: 'in_progress',
    }
  }

  /**
   * Validate that previous department meets threshold
   */
  private async validatePreviousDepartment(
    projectId: string,
    currentDeptNumber: number,
    currentDepartment: any,
  ): Promise<void> {
    const payload = await getPayload({ config })

    // Get previous department
    const previousDepts = await payload.find({
      collection: 'departments',
      where: {
        codeDepNumber: { equals: currentDeptNumber - 1 },
      },
      limit: 1,
    })

    if (previousDepts.docs.length === 0) {
      throw new Error(`Previous department not found`)
    }

    const previousDept = previousDepts.docs[0]

    // Get previous evaluation
    const previousEval = await payload.find({
      collection: 'project-readiness',
      where: {
        and: [
          { projectId: { equals: projectId } },
          { departmentId: { equals: previousDept.id } },
          { status: { equals: 'completed' } },
        ],
      },
      limit: 1,
      sort: '-lastEvaluatedAt',
    })

    if (previousEval.docs.length === 0) {
      throw new Error(
        `Cannot evaluate ${currentDepartment.name}. Previous department (${previousDept.name}) has not been evaluated yet.`,
      )
    }

    const threshold =
      (currentDepartment.coordinationSettings as any)?.minQualityThreshold || 80
    const previousRating = previousEval.docs[0].rating || 0

    if (previousRating < threshold) {
      throw new Error(
        `Cannot evaluate ${currentDepartment.name}. ` +
          `Previous department (${previousDept.name}) scored ${previousRating}, ` +
          `but threshold is ${threshold}.`,
      )
    }
  }

  /**
   * Get all gather data for a project
   */
  private async getGatherData(projectId: string): Promise<GatherDataItem[]> {
    const mongoUri = process.env.MONGODB_URI || ''
    const client = new MongoClient(mongoUri)

    try {
      await client.connect()
      const gatherDb = client.db(`aladdin-gather-${projectId}`)
      const items = await gatherDb
        .collection('gather')
        .find({ projectId })
        .toArray()

      return items.map((item) => ({
        content: item.content || '',
        summary: item.summary,
        context: item.context,
        imageUrl: item.imageUrl,
        documentUrl: item.documentUrl,
      }))
    } finally {
      await client.close()
    }
  }

  /**
   * Get previous evaluations for cascading context
   */
  private async getPreviousEvaluations(
    projectId: string,
    currentDeptNumber: number,
  ): Promise<PreviousEvaluation[]> {
    const payload = await getPayload({ config })

    // Get all departments before current one
    const previousDepts = await payload.find({
      collection: 'departments',
      where: {
        and: [
          { codeDepNumber: { less_than: currentDeptNumber } },
          { gatherCheck: { equals: true } },
        ],
      },
      sort: 'codeDepNumber',
    })

    const evaluations: PreviousEvaluation[] = []

    for (const dept of previousDepts.docs) {
      const evaluation = await payload.find({
        collection: 'project-readiness',
        where: {
          and: [
            { projectId: { equals: projectId } },
            { departmentId: { equals: dept.id } },
            { status: { equals: 'completed' } },
          ],
        },
        limit: 1,
        sort: '-lastEvaluatedAt',
      })

      if (evaluation.docs.length > 0) {
        const evalDoc = evaluation.docs[0]
        evaluations.push({
          department: dept.slug,
          rating: evalDoc.rating || 0,
          summary: evalDoc.evaluationSummary || '',
        })
      }
    }

    return evaluations
  }

  /**
   * Get gather data count for a project
   */
  async getGatherCount(projectId: string): Promise<{ count: number; lineCount: number }> {
    const mongoUri = process.env.MONGODB_URI || ''
    const client = new MongoClient(mongoUri)

    try {
      await client.connect()
      const gatherDb = client.db(`aladdin-gather-${projectId}`)
      const count = await gatherDb.collection('gather').countDocuments({ projectId })

      // Calculate line count
      const items = await gatherDb
        .collection('gather')
        .find({ projectId })
        .toArray()

      const lineCount = items.reduce((sum, item) => {
        if (!item.content) return sum
        const content = typeof item.content === 'string' ? item.content : JSON.stringify(item.content)
        const lines = content.split('\n').length
        return sum + lines
      }, 0)

      return { count, lineCount }
    } finally {
      await client.close()
    }
  }
}

// Export singleton instance
export const sequentialEvaluator = new SequentialEvaluator()
