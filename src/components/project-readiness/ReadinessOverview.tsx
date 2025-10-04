'use client'

/**
 * Readiness Overview Component
 *
 * Displays overall project readiness score and status
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'

interface ReadinessOverviewProps {
  projectReadinessScore: number
  gatherLineCount: number
}

export function ReadinessOverview({
  projectReadinessScore,
  gatherLineCount,
}: ReadinessOverviewProps) {
  const getRecommendation = (score: number) => {
    if (score >= 80) return { label: 'Ready for Production', variant: 'success' as const }
    if (score >= 60) return { label: 'Needs Improvement', variant: 'warning' as const }
    return { label: 'Not Ready', variant: 'destructive' as const }
  }

  const recommendation = getRecommendation(projectReadinessScore)

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-500'
    if (score >= 60) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Overall Project Readiness</span>
          <Badge variant={recommendation.variant}>{recommendation.label}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Score Display */}
          <div className="flex items-center gap-6">
            <div data-testid="overall-readiness-score" className="text-6xl font-bold">
              {projectReadinessScore}
            </div>
            <div className="flex-1">
              <Progress value={projectReadinessScore} className="h-4">
                <div
                  className={`h-full ${getScoreColor(projectReadinessScore)} transition-all`}
                  style={{ width: `${projectReadinessScore}%` }}
                />
              </Progress>
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>0</span>
                <span>50</span>
                <span>100</span>
              </div>
            </div>
          </div>

          {/* Info Text */}
          <div className="text-sm text-muted-foreground">
            This score is calculated from all completed department evaluations. There are{' '}
            <strong>{gatherLineCount}</strong> lines of information available for processing.
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
