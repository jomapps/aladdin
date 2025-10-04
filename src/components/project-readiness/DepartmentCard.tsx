'use client'

/**
 * Department Evaluation Card
 *
 * Displays department evaluation status, results, and controls
 */

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { AnimatedProgress } from './AnimatedProgress'
import type { DepartmentEvaluation } from '@/stores/projectReadinessStore'

interface DepartmentCardProps {
  department: DepartmentEvaluation
  previousDepartment: DepartmentEvaluation | null
  projectId: string
  onEvaluate: () => void
  onCancel?: (taskId: string) => void
}

export function DepartmentCard({
  department,
  previousDepartment,
  projectId,
  onEvaluate,
  onCancel,
}: DepartmentCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showFullEvaluation, setShowFullEvaluation] = useState(false)

  const isLoading = department.status === 'in_progress'

  // Determine if evaluate button should be enabled
  const canEvaluate = () => {
    // Department 1 is always enabled
    if (department.departmentNumber === 1) return true

    // Other departments require previous to meet threshold
    if (!previousDepartment) return false

    return (
      previousDepartment.status === 'completed' &&
      previousDepartment.rating !== null &&
      previousDepartment.rating >= department.threshold
    )
  }

  const getStatusBadge = () => {
    switch (department.status) {
      case 'completed':
        return (
          <Badge
            data-testid="department-status"
            variant="default"
            className="bg-green-600 hover:bg-green-700"
          >
            ✅ Completed
          </Badge>
        )
      case 'in_progress':
        return (
          <Badge
            data-testid="department-status"
            variant="default"
            className="bg-yellow-600 hover:bg-yellow-700"
          >
            ⏳ Evaluating
          </Badge>
        )
      case 'failed':
        return (
          <Badge data-testid="department-status" variant="destructive">
            ❌ Failed
          </Badge>
        )
      default:
        return (
          <Badge data-testid="department-status" variant="secondary">
            ⏸️ Pending
          </Badge>
        )
    }
  }

  const getProgressBarColor = () => {
    if (!department.rating) return ''
    return department.rating >= department.threshold ? 'bg-green-500' : 'bg-yellow-500'
  }

  return (
    <Card
      data-testid={`department-${department.departmentSlug}`}
      className="mb-6 border border-slate-800/70 bg-slate-900/70 text-white shadow-[0_24px_80px_-50px_rgba(15,23,42,0.9)]"
    >
      <CardHeader className="px-6 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <span className="text-3xl font-semibold text-slate-500">
              {department.departmentNumber}.
            </span>
            <div className="flex-1">
              <h3 className="text-lg font-semibold capitalize text-white">
                {department.departmentName || department.departmentSlug}
              </h3>
              {department.evaluationSummary && (
                <p className="mt-1 line-clamp-2 text-sm text-slate-300">
                  {department.evaluationSummary}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {department.rating !== null && (
              <div className="text-right">
                <div data-testid="department-rating" className="text-3xl font-bold text-white">
                  {department.rating}
                </div>
                <div className="text-xs text-slate-400">Threshold: {department.threshold}</div>
              </div>
            )}

            {getStatusBadge()}
          </div>
        </div>

        {/* Progress bar for rating */}
        {department.rating !== null && (
          <div className="mt-3">
            <Progress
              value={department.rating}
              className="h-2 overflow-hidden rounded-full border border-slate-800/70 bg-slate-950/60"
            >
              <div
                className={`h-full ${getProgressBarColor()} transition-all`}
                style={{ width: `${department.rating}%` }}
              />
            </Progress>
          </div>
        )}
      </CardHeader>

      {/* Loading state */}
      {isLoading && (
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Processing evaluation...</span>
            </div>
            <AnimatedProgress />
            {department.taskId && onCancel && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onCancel(department.taskId!)}
                className="w-full"
              >
                Cancel Evaluation
              </Button>
            )}
          </div>
        </CardContent>
      )}

      {/* Expanded content */}
      {isExpanded && department.status === 'completed' && (
        <CardContent className="space-y-4 border-t pt-4">
          {/* Evaluation Summary */}
          {department.evaluationSummary && (
            <div data-testid="evaluation-summary">
              <h4 className="font-semibold mb-2 flex items-center gap-2">📊 Evaluation Summary</h4>
              <p className="text-sm">{department.evaluationSummary}</p>
            </div>
          )}

          {/* Full Evaluation (Collapsible) */}
          {department.evaluationResult && (
            <Collapsible open={showFullEvaluation} onOpenChange={setShowFullEvaluation}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full justify-between">
                  <span className="font-semibold">📝 Full Evaluation</span>
                  {showFullEvaluation ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-2 p-3 bg-muted rounded-md">
                  <p className="text-sm whitespace-pre-wrap">{department.evaluationResult}</p>
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Issues */}
          {department.issues && department.issues.length > 0 && (
            <div data-testid="evaluation-issues">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                ⚠️ Issues ({department.issues.length})
              </h4>
              <ul className="list-disc list-inside space-y-1">
                {department.issues.map((issue, idx) => (
                  <li key={idx} className="text-sm">
                    {typeof issue === 'string' ? issue : (issue as any).issue}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Suggestions */}
          {department.suggestions && department.suggestions.length > 0 && (
            <div data-testid="evaluation-suggestions">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                💡 Suggestions ({department.suggestions.length})
              </h4>
              <ul className="list-disc list-inside space-y-1">
                {department.suggestions.map((suggestion, idx) => (
                  <li key={idx} className="text-sm">
                    {typeof suggestion === 'string' ? suggestion : (suggestion as any).suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Metadata */}
          {department.lastEvaluatedAt && (
            <div className="text-xs text-muted-foreground pt-2 border-t">
              Last Evaluated:{' '}
              {formatDistanceToNow(new Date(department.lastEvaluatedAt), {
                addSuffix: true,
              })}
            </div>
          )}
        </CardContent>
      )}

      {/* Gating message for disabled evaluations */}
      {!canEvaluate() && department.departmentNumber > 1 && (
        <CardContent className="border-t pt-4">
          <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
            ℹ️ Previous department must score ≥{department.threshold} to unlock this evaluation
            {previousDepartment && previousDepartment.rating !== null && (
              <span className="ml-1">(currently: {previousDepartment.rating})</span>
            )}
          </div>
        </CardContent>
      )}

      <CardFooter className="flex justify-between border-t">
        {department.status === 'completed' && (
          <Button variant="ghost" size="sm" onClick={() => setIsExpanded(!isExpanded)}>
            {isExpanded ? (
              <>
                Collapse <ChevronUp className="ml-2 h-4 w-4" />
              </>
            ) : (
              <>
                Expand <ChevronDown className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        )}

        {department.status !== 'completed' && <div />}

        <Button
          onClick={onEvaluate}
          disabled={!canEvaluate() || isLoading}
          variant={department.status === 'completed' ? 'outline' : 'default'}
        >
          {department.status === 'completed' ? 'Re-evaluate' : 'Evaluate'}
        </Button>
      </CardFooter>
    </Card>
  )
}
