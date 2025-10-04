'use client'

/**
 * Qualification Progress Page
 *
 * Real-time display of qualification data generation progress
 * Shows phase progression (A → B → C → D) and department status
 */

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQualificationStore } from '@/stores/qualificationStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Circle,
  Clock,
  Loader2,
  XCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const PHASE_LABELS = {
  A: 'Analysis',
  B: 'Breakdown',
  C: 'Compilation',
  D: 'Delivery',
}

export default function QualificationProgressPage() {
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string

  const { progress, isPolling, startPolling, stopPolling, cancelQualification } =
    useQualificationStore()

  useEffect(() => {
    if (projectId) {
      startPolling(projectId)
    }

    return () => {
      stopPolling()
    }
  }, [projectId, startPolling, stopPolling])

  const handleCancel = async () => {
    if (confirm('Are you sure you want to cancel qualification? This cannot be undone.')) {
      try {
        await cancelQualification(projectId)
        router.push(`/dashboard/project/${projectId}/project-readiness`)
      } catch (error) {
        console.error('Failed to cancel qualification:', error)
      }
    }
  }

  const getPhaseIcon = (phase: string | null, isActive: boolean) => {
    if (!phase) return <Circle className="h-5 w-5 text-slate-600" />
    if (isActive) return <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
    return <CheckCircle2 className="h-5 w-5 text-green-400" />
  }

  const getDepartmentStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-400" />
      case 'processing':
        return <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-400" />
      default:
        return <Clock className="h-5 w-5 text-slate-500" />
    }
  }

  const getDepartmentStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 text-green-300 border-green-500/40'
      case 'processing':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40'
      case 'failed':
        return 'bg-red-500/20 text-red-300 border-red-500/40'
      default:
        return 'bg-slate-500/20 text-slate-300 border-slate-500/40'
    }
  }

  if (!progress) {
    return (
      <div className="mx-auto max-w-6xl space-y-6 px-6 py-10">
        <Skeleton className="h-12 w-96 bg-slate-800/60" />
        <Skeleton className="h-32 w-full bg-slate-800/60" />
        <Skeleton className="h-64 w-full bg-slate-800/60" />
      </div>
    )
  }

  const isComplete = progress.completedDepartments === progress.totalDepartments
  const hasErrors = progress.departments.some((d) => d.status === 'failed')

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-6 py-10 text-white">
      {/* Header */}
      <div className="space-y-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/dashboard/project/${projectId}/project-readiness`)}
          className="gap-2 text-slate-300 hover:text-white hover:bg-slate-800/50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Readiness
        </Button>

        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">
            Qualification Progress
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Real-time progress for qualified data generation across all departments
          </p>
        </div>
      </div>

      {/* Overall Progress */}
      <Card className="border-slate-800/60 bg-slate-900/40">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">Overall Progress</CardTitle>
            <Badge
              className={cn(
                'border',
                isComplete
                  ? 'bg-green-500/20 text-green-300 border-green-500/40'
                  : isPolling
                    ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                    : 'bg-slate-500/20 text-slate-300 border-slate-500/40'
              )}
            >
              {isComplete
                ? 'Completed'
                : `${progress.completedDepartments}/${progress.totalDepartments} Departments`}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Progress</span>
              <span className="font-medium text-white">{Math.round(progress.overallProgress)}%</span>
            </div>
            <Progress value={progress.overallProgress} className="h-2" />
          </div>

          {progress.estimatedCompletion && !isComplete && (
            <p className="text-sm text-slate-400">
              Estimated completion:{' '}
              <span className="text-slate-300">
                {new Date(progress.estimatedCompletion).toLocaleTimeString()}
              </span>
            </p>
          )}

          {!isComplete && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              className="border-red-500/40 bg-red-500/10 text-red-300 hover:bg-red-500/20"
            >
              Cancel Qualification
            </Button>
          )}

          {isComplete && (
            <Button
              onClick={() => router.push(`/dashboard/project/${projectId}/scenes`)}
              className="gap-2 bg-blue-600 hover:bg-blue-700"
            >
              Continue to Scenes
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Phase Progress Indicator */}
      {progress.currentDepartment && (
        <Card className="border-slate-800/60 bg-slate-900/40">
          <CardHeader>
            <CardTitle className="text-white">Current Phase</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-4">
              {(['A', 'B', 'C', 'D'] as const).map((phase, index) => {
                const isActive = progress.currentDepartment?.currentPhase === phase
                const isPast = progress.currentDepartment?.currentPhase
                  ? phase < progress.currentDepartment.currentPhase
                  : false

                return (
                  <div key={phase} className="flex flex-1 items-center gap-2">
                    <div
                      className={cn(
                        'flex flex-1 flex-col items-center gap-2 rounded-lg border p-4',
                        isActive
                          ? 'border-blue-500/40 bg-blue-500/10'
                          : isPast
                            ? 'border-green-500/40 bg-green-500/10'
                            : 'border-slate-700/40 bg-slate-800/20'
                      )}
                    >
                      {getPhaseIcon(isPast || isActive ? phase : null, isActive)}
                      <div className="text-center">
                        <div className="text-sm font-medium text-white">Phase {phase}</div>
                        <div className="text-xs text-slate-400">{PHASE_LABELS[phase]}</div>
                      </div>
                    </div>
                    {index < 3 && (
                      <ArrowRight
                        className={cn(
                          'h-4 w-4 flex-shrink-0',
                          isPast ? 'text-green-400' : 'text-slate-600'
                        )}
                      />
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Department Status Cards */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-white">Department Status</h2>

        {hasErrors && (
          <Alert className="border-red-500/40 bg-red-500/10 text-red-100">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              Some departments failed to generate qualified data. Check the error details below.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {progress.departments.map((dept) => (
            <Card
              key={dept.departmentId}
              className={cn(
                'border transition-all',
                dept.status === 'processing'
                  ? 'border-blue-500/40 bg-blue-500/5'
                  : dept.status === 'completed'
                    ? 'border-green-500/40 bg-green-500/5'
                    : dept.status === 'failed'
                      ? 'border-red-500/40 bg-red-500/5'
                      : 'border-slate-800/60 bg-slate-900/40'
              )}
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <CardTitle className="text-base text-white">{dept.departmentName}</CardTitle>
                    <p className="mt-1 text-xs text-slate-400">Department {dept.departmentNumber}</p>
                  </div>
                  {getDepartmentStatusIcon(dept.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <Badge className={cn('border', getDepartmentStatusColor(dept.status))}>
                  {dept.status.charAt(0).toUpperCase() + dept.status.slice(1)}
                </Badge>

                {dept.status === 'processing' && (
                  <>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Progress</span>
                        <span className="text-slate-300">{dept.progress}%</span>
                      </div>
                      <Progress value={dept.progress} className="h-1.5" />
                    </div>
                    {dept.currentPhase && (
                      <p className="text-xs text-slate-400">
                        Current: Phase {dept.currentPhase} ({PHASE_LABELS[dept.currentPhase]})
                      </p>
                    )}
                  </>
                )}

                {dept.status === 'completed' && (
                  <p className="text-xs text-green-400">
                    {dept.qualifiedDataCount.toLocaleString()} qualified data items generated
                  </p>
                )}

                {dept.status === 'failed' && dept.error && (
                  <Alert className="border-red-500/40 bg-red-500/10">
                    <AlertDescription className="text-xs text-red-200">
                      {dept.error}
                    </AlertDescription>
                  </Alert>
                )}

                {dept.completedAt && (
                  <p className="text-xs text-slate-500">
                    Completed at {new Date(dept.completedAt).toLocaleTimeString()}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
