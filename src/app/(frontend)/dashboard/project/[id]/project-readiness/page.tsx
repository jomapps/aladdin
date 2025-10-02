'use client'

/**
 * Project Readiness Page
 *
 * Sequential department evaluation for production readiness
 *
 * @see {@link /docs/idea/pages/project-readiness.md} for specification
 */

import { useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useProjectReadinessStore } from '@/stores/projectReadinessStore'
import { DepartmentCard } from '@/components/project-readiness/DepartmentCard'
import { ReadinessOverview } from '@/components/project-readiness/ReadinessOverview'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertCircle } from 'lucide-react'

export default function ProjectReadinessPage() {
  const params = useParams()
  const projectId = params.id as string

  const {
    gatherCount,
    gatherLineCount,
    departments,
    projectReadinessScore,
    startPolling,
    stopPolling,
    startEvaluation,
    cancelEvaluation,
  } = useProjectReadinessStore()

  useEffect(() => {
    // Start polling when page loads
    if (projectId) {
      startPolling(projectId)
    }

    // Cleanup on unmount
    return () => {
      stopPolling()
    }
  }, [projectId, startPolling, stopPolling])

  const handleEvaluate = async (departmentNumber: number) => {
    try {
      await startEvaluation(projectId, departmentNumber)
    } catch (error) {
      console.error('Failed to start evaluation:', error)
      // TODO: Show error toast
    }
  }

  const handleCancel = async (taskId: string) => {
    try {
      await cancelEvaluation(projectId, taskId)
    } catch (error) {
      console.error('Failed to cancel evaluation:', error)
      // TODO: Show error toast
    }
  }

  // Loading state
  if (departments.length === 0) {
    return (
      <div className="container mx-auto py-8 max-w-5xl">
        <Skeleton className="h-12 w-96 mb-4" />
        <Skeleton className="h-32 w-full mb-6" />
        <div className="space-y-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Project Readiness Evaluation</h1>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="space-y-2">
            <p>
              This page will help you ready the project for production. There are{' '}
              <strong>{gatherLineCount.toLocaleString()}</strong> lines of information
              available for processing.
            </p>
            <p>
              You can provide all the information you want via the chat (right sidebar).
            </p>
            <p>
              When you feel that enough information has been provided, you can run the
              evaluation for each department sequentially.
            </p>
          </AlertDescription>
        </Alert>
      </div>

      {/* Overall Readiness Score */}
      {projectReadinessScore !== null && projectReadinessScore > 0 && (
        <ReadinessOverview
          projectReadinessScore={projectReadinessScore}
          gatherLineCount={gatherLineCount}
        />
      )}

      {/* Department Cards */}
      <div className="space-y-4">
        {departments.map((dept, idx) => (
          <DepartmentCard
            key={dept.departmentId}
            department={dept}
            previousDepartment={idx > 0 ? departments[idx - 1] : null}
            projectId={projectId}
            onEvaluate={() => handleEvaluate(dept.departmentNumber)}
            onCancel={handleCancel}
          />
        ))}
      </div>

      {/* No gather data warning */}
      {gatherCount === 0 && (
        <Alert variant="destructive" className="mt-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No gather data found for this project. Please add information via the chat
            or gather page before running evaluations.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
