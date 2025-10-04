'use client'

/**
 * Project Readiness Page
 *
 * Sequential department evaluation for production readiness
 *
 * @see {@link /docs/idea/pages/project-readiness.md} for specification
 */

import { useEffect, useRef } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { useProjectReadinessStore } from '@/stores/projectReadinessStore'
import { DepartmentCard } from '@/components/project-readiness/DepartmentCard'
import { ReadinessOverview } from '@/components/project-readiness/ReadinessOverview'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

export default function ProjectReadinessPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const projectId = params.id as string
  const evaluateDepartmentSlug = searchParams.get('evaluate')
  const hasTriggeredEvaluation = useRef(false)

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

  // Auto-trigger evaluation from query parameter
  useEffect(() => {
    if (evaluateDepartmentSlug && departments.length > 0 && !hasTriggeredEvaluation.current) {
      hasTriggeredEvaluation.current = true

      // Find department by slug
      const department = departments.find((d) => d.departmentSlug === evaluateDepartmentSlug)

      if (department) {
        console.log(
          `[ProjectReadiness] Auto-triggering evaluation for ${department.departmentName}`,
        )
        toast.info(`Starting evaluation for ${department.departmentName} department...`)
        handleEvaluate(department.departmentNumber)
      } else {
        console.warn(`[ProjectReadiness] Department not found for slug: ${evaluateDepartmentSlug}`)
      }
    }
  }, [evaluateDepartmentSlug, departments])

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
      <div className="mx-auto max-w-6xl space-y-6 px-6 py-10 text-white">
        <Skeleton className="mb-4 h-12 w-96 rounded-xl bg-slate-800/60" />
        <Skeleton className="mb-6 h-32 w-full rounded-3xl bg-slate-800/60" />
        <div className="space-y-4">
          <Skeleton className="h-48 w-full rounded-3xl bg-slate-800/60" />
          <Skeleton className="h-48 w-full rounded-3xl bg-slate-800/60" />
          <Skeleton className="h-48 w-full rounded-3xl bg-slate-800/60" />
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-6 py-10 text-white">
      {/* Header */}
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">
            Project Readiness Evaluation
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-300/90">
            Validate each department sequentially to unlock production. Provide supporting context
            via the AI chat, then trigger evaluations when you are ready.
          </p>
        </div>

        <Alert className="border-sky-400/40 bg-sky-500/10 text-sky-100">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="space-y-2 text-sm">
            <p>
              {gatherLineCount.toLocaleString()} lines of information are available for this
              project. The more detailed your gather data, the stronger the evaluation results.
            </p>
            <p>You can continue to enrich context through the AI chat in the right sidebar.</p>
            <p>Run the evaluation for each department once its prerequisites are complete.</p>
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
      <div className="space-y-5">
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
        <Alert className="border-amber-400/40 bg-amber-500/15 text-amber-100">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            No gather data found for this project. Add information through the chat or Gather page
            before running evaluations so departments have material to assess.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
