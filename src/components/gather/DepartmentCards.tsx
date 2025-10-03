'use client'

/**
 * Department Cards Component
 * Displays all core departments as clickable cards
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Loader2, TrendingUp, CheckCircle2, Clock, AlertCircle, PartyPopper } from 'lucide-react'
import { toast } from 'sonner'

interface Department {
  id: string
  slug: string
  name: string
  description: string
  icon?: string
  color?: string
  codeDepNumber: number
  isActive: boolean
  coreDepartment: boolean
  gatherCheck: boolean
}

interface DepartmentEvaluation {
  departmentId: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  rating: number | null
  threshold: number
  lastEvaluatedAt: Date | null
}

interface DepartmentCardsProps {
  projectId: string
  onEvaluate?: (departmentSlug: string, departmentNumber: number) => void
}

export default function DepartmentCards({ projectId, onEvaluate }: DepartmentCardsProps) {
  const router = useRouter()
  const [departments, setDepartments] = useState<Department[]>([])
  const [evaluations, setEvaluations] = useState<Map<string, DepartmentEvaluation>>(new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [celebratingDepts, setCelebratingDepts] = useState<Set<string>>(new Set())

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        // Fetch departments and evaluations in parallel
        const [deptsResponse, evalsResponse] = await Promise.all([
          fetch(`/api/v1/departments?isActive=true&gatherCheck=true&coreDepartment=true`),
          fetch(`/api/v1/project-readiness/${projectId}`),
        ])

        if (!deptsResponse.ok) {
          throw new Error('Failed to fetch departments')
        }

        const deptsData = await deptsResponse.json()

        // Filter and sort by codeDepNumber (ascending)
        const filteredDepartments = (deptsData.departments || [])
          .filter((dept: Department) => dept.coreDepartment && dept.gatherCheck)
          .sort((a: Department, b: Department) => a.codeDepNumber - b.codeDepNumber)

        setDepartments(filteredDepartments)

        // Process evaluations if available
        if (evalsResponse.ok) {
          const evalsData = await evalsResponse.json()
          const evalMap = new Map<string, DepartmentEvaluation>()
          const previousEvaluations = new Map(evaluations)

          evalsData.departments?.forEach((dept: any) => {
            const newEval: DepartmentEvaluation = {
              departmentId: dept.departmentId,
              status: dept.status,
              rating: dept.rating,
              threshold: dept.threshold,
              lastEvaluatedAt: dept.lastEvaluatedAt,
            }
            evalMap.set(dept.departmentId, newEval)

            // Check if threshold was just crossed
            const prevEval = previousEvaluations.get(dept.departmentId)
            const wasNotMeetingThreshold = !prevEval || (prevEval.rating !== null && prevEval.rating < prevEval.threshold)
            const nowMeetsThreshold = newEval.rating !== null && newEval.rating >= newEval.threshold

            if (wasNotMeetingThreshold && nowMeetsThreshold && newEval.status === 'completed') {
              setCelebratingDepts(prev => new Set(prev).add(dept.departmentId))

              // Show toast notification
              toast.success(`🎉 ${dept.departmentName} department reached threshold!`, {
                description: `Score: ${newEval.rating}% (Threshold: ${newEval.threshold}%)`
              })
            }
          })

          setEvaluations(evalMap)
        }
      } catch (err) {
        console.error('[DepartmentCards] Error fetching data:', err)
        setError(err instanceof Error ? err.message : 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [projectId])

  const handleDepartmentClick = (slug: string) => {
    router.push(`/dashboard/project/${projectId}/${slug}`)
  }

  const handleEvaluateClick = (e: React.MouseEvent, slug: string, number: number) => {
    e.stopPropagation() // Prevent card click
    if (onEvaluate) {
      onEvaluate(slug, number)
    }
  }

  const getStatusBadge = (evaluation?: DepartmentEvaluation) => {
    if (!evaluation || evaluation.status === 'pending') {
      return (
        <Badge variant="outline" className="gap-1">
          <Clock className="h-3 w-3" />
          Pending
        </Badge>
      )
    }

    if (evaluation.status === 'in_progress') {
      return (
        <Badge variant="secondary" className="gap-1">
          <Loader2 className="h-3 w-3 animate-spin" />
          Evaluating
        </Badge>
      )
    }

    if (evaluation.status === 'completed' && evaluation.rating !== null) {
      const meetsThreshold = evaluation.rating >= evaluation.threshold
      return (
        <Badge variant={meetsThreshold ? 'default' : 'destructive'} className="gap-1">
          {meetsThreshold ? (
            <CheckCircle2 className="h-3 w-3" />
          ) : (
            <AlertCircle className="h-3 w-3" />
          )}
          {evaluation.rating}%
        </Badge>
      )
    }

    if (evaluation.status === 'failed') {
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertCircle className="h-3 w-3" />
          Failed
        </Badge>
      )
    }

    return null
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-3">
              <div className="h-8 w-8 bg-muted rounded-full mb-2" />
              <div className="h-5 bg-muted rounded w-3/4" />
            </CardHeader>
            <CardContent>
              <div className="h-4 bg-muted rounded w-full mb-2" />
              <div className="h-4 bg-muted rounded w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive mb-2">Failed to load departments</p>
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    )
  }

  if (departments.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No departments found</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {departments.map((dept) => {
        const evaluation = evaluations.get(dept.id)
        const isEvaluating = evaluation?.status === 'in_progress'

        return (
          <Card
            key={dept.id}
            className="transition-all hover:shadow-lg border-l-4 flex flex-col min-h-[200px]"
            style={{ borderLeftColor: dept.color || '#6b7280' }}
          >
            <CardHeader
              className="px-6 py-5 cursor-pointer"
              onClick={() => handleDepartmentClick(dept.slug)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 flex-1">
                  {dept.icon && (
                    <div
                      className="flex items-center justify-center w-10 h-10 rounded-full text-2xl flex-shrink-0"
                      style={{ backgroundColor: `${dept.color}20` || '#f3f4f6' }}
                    >
                      {dept.icon}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-semibold text-foreground break-words">
                      {dept.name}
                    </h3>
                    <p className="text-xs text-muted-foreground">Department {dept.codeDepNumber}</p>
                  </div>
                </div>
                {getStatusBadge(evaluation)}
              </div>
            </CardHeader>

            <CardContent
              className="flex-1 cursor-pointer px-6 pb-5"
              onClick={() => handleDepartmentClick(dept.slug)}
            >
              <p className="text-sm text-muted-foreground whitespace-normal break-words">
                {dept.description}
              </p>

              {/* Threshold Display (Always show if evaluation exists) */}
              {evaluation && (
                <div className="mt-3 pt-3 border-t">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Required Threshold:</span>
                    <span className="font-medium text-foreground">{evaluation.threshold}%</span>
                  </div>
                  {evaluation.rating !== null && (
                    <div className="flex items-center justify-between text-xs mt-1">
                      <span className="text-muted-foreground">Current Score:</span>
                      <span className={`font-medium ${evaluation.rating >= evaluation.threshold ? 'text-green-500' : 'text-yellow-500'}`}>
                        {evaluation.rating}%
                      </span>
                    </div>
                  )}
                  {evaluation.lastEvaluatedAt && (
                    <div className="flex items-center justify-between text-xs mt-1">
                      <span className="text-muted-foreground">Last Evaluated:</span>
                      <span className="font-medium">
                        {new Date(evaluation.lastEvaluatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>

            <CardFooter className="flex-col gap-3 pt-4 px-6 pb-6">
              {/* Congratulations Alert */}
              {celebratingDepts.has(dept.id) && evaluation?.rating !== null && evaluation.rating >= evaluation.threshold && (
                <Alert className="w-full bg-green-500/10 border-green-500/50">
                  <PartyPopper className="h-4 w-4 text-green-500" />
                  <AlertTitle className="text-green-500">Congratulations!</AlertTitle>
                  <AlertDescription className="text-green-500/90">
                    You can now move to the next department or add more info to this department.
                  </AlertDescription>
                </Alert>
              )}

              <Button
                onClick={(e) => handleEvaluateClick(e, dept.slug, dept.codeDepNumber)}
                disabled={isEvaluating || (evaluation?.rating !== null && evaluation.rating < evaluation.threshold && evaluation.status === 'completed')}
                variant={evaluation?.status === 'completed' && evaluation.rating !== null && evaluation.rating >= evaluation.threshold ? 'outline' : 'default'}
                className="w-full"
                size="sm"
              >
                {isEvaluating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Evaluating...
                  </>
                ) : evaluation?.status === 'completed' && evaluation.rating !== null && evaluation.rating >= evaluation.threshold ? (
                  <>
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Re-evaluate
                  </>
                ) : (
                  <>
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Evaluate
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        )
      })}
    </div>
  )
}
