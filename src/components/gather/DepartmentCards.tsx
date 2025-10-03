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
      <div className="py-12 text-center">
        <p className="text-slate-300">No departments found</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {departments.map((dept, index) => {
        const evaluation = evaluations.get(dept.id)
        const isEvaluating = evaluation?.status === 'in_progress'

        // First department is always evaluable
        const isFirstDepartment = index === 0

        // Check if previous department has crossed threshold
        let previousDeptMetThreshold = false
        let previousDeptName = ''
        if (index > 0) {
          const previousDept = departments[index - 1]
          previousDeptName = previousDept.name
          const previousEval = evaluations.get(previousDept.id)
          previousDeptMetThreshold = previousEval?.rating !== null &&
                                     previousEval.rating >= previousEval.threshold &&
                                     previousEval.status === 'completed'

          // Debug logging
          console.log(`[DepartmentCards] Dept: ${dept.name} (${index})`, {
            previousDept: previousDeptName,
            previousEval: previousEval ? {
              rating: previousEval.rating,
              threshold: previousEval.threshold,
              status: previousEval.status,
              meetsThreshold: previousDeptMetThreshold
            } : 'No evaluation',
            canEvaluate: isFirstDepartment || previousDeptMetThreshold
          })
        }

        // Evaluate button is enabled if:
        // 1. It's the first department, OR
        // 2. Previous department has crossed threshold
        const canEvaluate = isFirstDepartment || previousDeptMetThreshold

        return (
          <Card
            key={dept.id}
            className={`min-h-[200px] flex flex-col border border-slate-800/70 bg-slate-900/70 text-white transition-all hover:border-sky-400/40 hover:shadow-[0_24px_80px_-45px_rgba(15,23,42,0.9)] ${!canEvaluate ? 'opacity-60' : ''}`}
            style={{ boxShadow: `inset 4px 0 0 ${dept.color || '#38bdf8'}` }}
          >
            <CardHeader
              className="px-6 py-5 cursor-pointer"
              onClick={() => handleDepartmentClick(dept.slug)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 flex-1">
                  {dept.icon && (
                    <div
                      className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl text-2xl text-white"
                      style={{ backgroundColor: `${dept.color || '#38bdf8'}33` }}
                    >
                      {dept.icon}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-semibold text-white break-words">
                      {dept.name}
                    </h3>
                    <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
                      Department {dept.codeDepNumber}
                    </p>
                  </div>
                </div>
                {getStatusBadge(evaluation)}
              </div>
            </CardHeader>

            <CardContent
              className="flex-1 cursor-pointer px-6 pb-5"
              onClick={() => handleDepartmentClick(dept.slug)}
            >
              <p className="text-sm text-slate-300 whitespace-normal break-words">
                {dept.description}
              </p>

              {/* Threshold Display (Always show if evaluation exists) */}
              {evaluation && (
                <div className="mt-3 border-t border-slate-800/70 pt-3">
                  <div className="flex items-center justify-between text-xs text-slate-300">
                    <span>Required Threshold:</span>
                    <span className="font-semibold text-white">{evaluation.threshold}%</span>
                  </div>
                  {evaluation.rating !== null && (
                    <div className="mt-1 flex items-center justify-between text-xs text-slate-300">
                      <span>Current Score:</span>
                      <span
                        className={`font-semibold ${evaluation.rating >= evaluation.threshold ? 'text-emerald-300' : 'text-amber-300'}`}
                      >
                        {evaluation.rating}%
                      </span>
                    </div>
                  )}
                  {evaluation.lastEvaluatedAt && (
                    <div className="mt-1 flex items-center justify-between text-xs text-slate-300">
                      <span>Last Evaluated:</span>
                      <span className="font-medium text-white">
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
                <Alert className="w-full border-emerald-400/40 bg-emerald-500/15 text-emerald-100">
                  <PartyPopper className="h-4 w-4 text-emerald-200" />
                  <AlertTitle className="text-emerald-200">Congratulations!</AlertTitle>
                  <AlertDescription className="text-emerald-100/90">
                    You can now move to the next department or add more info to this department.
                  </AlertDescription>
                </Alert>
              )}

              {/* Warning if previous department hasn't met threshold */}
              {!canEvaluate && !isFirstDepartment && (
                <Alert className="w-full border-amber-400/40 bg-amber-500/15 text-amber-100">
                  <AlertCircle className="h-4 w-4 text-amber-200" />
                  <AlertTitle className="text-sm text-amber-100">Previous Department Required</AlertTitle>
                  <AlertDescription className="text-xs text-amber-100/80">
                    Complete <strong>{previousDeptName}</strong> department and meet its threshold first to unlock evaluation.
                  </AlertDescription>
                </Alert>
              )}

              <Button
                onClick={(e) => handleEvaluateClick(e, dept.slug, dept.codeDepNumber)}
                disabled={isEvaluating || !canEvaluate}
                variant={evaluation?.status === 'completed' && evaluation.rating !== null && evaluation.rating >= evaluation.threshold ? 'outline' : 'default'}
                className={`w-full ${
                  evaluation?.status === 'completed' && evaluation.rating !== null && evaluation.rating >= evaluation.threshold
                    ? 'border-slate-700/70 bg-slate-900/60 text-white hover:border-sky-400/40 hover:bg-slate-900/80'
                    : 'bg-gradient-to-r from-sky-500 to-indigo-500 text-white hover:brightness-110'
                }`}
                size="sm"
              >
                {isEvaluating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Evaluating...
                  </>
                ) : !canEvaluate ? (
                  <>
                    <Clock className="mr-2 h-4 w-4" />
                    Locked
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
