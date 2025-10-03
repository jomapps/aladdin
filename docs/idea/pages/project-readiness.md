# Project Readiness Page - Complete Implementation Specification

**Version**: 3.0 - Implementation Ready
**Last Updated**: January 2025
**Status**: Ready for Implementation

---

## 📋 Overview

The **Project Readiness Page** is a production-readiness evaluation system that analyzes unqualified gather data through sequential department evaluation. It provides quantitative readiness scores and actionable insights to determine if a project is ready for video generation pipeline processing.

**Key Principle**: This page evaluates unqualified gather data sequentially through all 7 core departments, building context progressively to ensure comprehensive project assessment.

---

## 🎯 Purpose

This page enables users to:
- Evaluate project readiness for production pipeline
- Get department-level quality scores (0-100)
- Identify gaps and issues before production
- Build on validated information progressively
- Collect additional context via AI chat

**NOT for**: Video generation or image creation (that happens later in the pipeline)

---

## 📍 Location & Route

### Route
```
/dashboard/project/[id]/project-readiness
```

### Layout Structure
- **Main Menu**: Standard top navigation
- **Left Sidebar**: Project navigation with "Project Readiness" link
- **Center Panel**: Department evaluation cards in process flow order
- **Right Sidebar**: AI chat integration with "Add to Gather" buttons

---

## 🏗️ Architecture

### Database Design

**Collection Name**: `project-readiness` (PayloadCMS)

**Schema**:
```typescript
{
  // Identity
  projectId: string              // Relationship to Projects collection
  departmentId: string           // Relationship to Departments collection

  // Evaluation Results
  evaluationResult: string       // Full evaluation text from AI
  evaluationSummary: string      // ~200 char summary
  rating: number                 // Department rating (0-100)
  readinessScore: number         // Project-level score (0-100)

  // Status Tracking
  status: 'pending' | 'in_progress' | 'completed' | 'failed'

  // Task Service Integration
  taskId: string                 // tasks.ft.tc task ID
  taskStatus: string             // Current task status

  // Metadata
  evaluationDuration: number     // Seconds taken
  agentModel: string             // AI model used (e.g., "anthropic/claude-sonnet-4.5")
  gatherDataCount: number        // Number of gather items processed
  iterationCount: number         // Processing iterations used

  // Issues & Recommendations
  issues: string[]               // Array of identified issues
  suggestions: string[]          // Array of improvement suggestions

  // Timestamps (auto-managed by PayloadCMS)
  createdAt: Date
  updatedAt: Date
  lastEvaluatedAt: Date
}
```

### Gather Database Integration

**Database**: `aladdin-gather-{projectId}` (MongoDB)
**Collection**: `gather`
**Access**: Read-only for evaluation purposes

**Data Retrieval**:
```typescript
// Get all gather data for evaluation
const gatherDb = mongoClient.db(`aladdin-gather-${projectId}`)
const gatherItems = await gatherDb.collection('gather').find({
  projectId
}).toArray()

// Count "lines of information"
const lineCount = gatherItems.reduce((sum, item) => {
  const content = JSON.parse(item.content)
  const lines = JSON.stringify(content).split('\n').length
  return sum + lines
}, 0)
```

---

## 🔧 Task Service Integration (tasks.ft.tc)

### Service Configuration

**Production URL**: `https://tasks.ft.tc`
**Development URL**: `http://localhost:8001`
**Authentication**: `X-API-Key` header with `CELERY_TASK_API_KEY`

**Environment Variables**:
```bash
TASKS_API_URL=https://tasks.ft.tc
CELERY_TASK_API_KEY=your_api_key_here
```

### Task Client Implementation

```typescript
// src/lib/task-service/client.ts
export class TaskServiceClient {
  private baseUrl: string
  private apiKey: string

  constructor() {
    this.baseUrl = process.env.TASKS_API_URL || 'http://localhost:8001'
    this.apiKey = process.env.CELERY_TASK_API_KEY || ''
  }

  /**
   * Submit department evaluation task
   */
  async submitEvaluation(data: EvaluationTaskData): Promise<TaskResponse> {
    const response = await fetch(`${this.baseUrl}/api/v1/tasks/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey
      },
      body: JSON.stringify({
        project_id: data.projectId,
        task_type: 'evaluate_department',
        task_data: {
          department_slug: data.departmentSlug,
          department_number: data.departmentNumber,
          gather_data: data.gatherData,
          previous_evaluations: data.previousEvaluations,
          threshold: data.threshold
        },
        priority: 1,
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/evaluation-complete`,
        metadata: {
          user_id: data.userId,
          department_id: data.departmentId
        }
      })
    })

    if (!response.ok) {
      throw new Error(`Task submission failed: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Get task status
   */
  async getTaskStatus(taskId: string): Promise<TaskStatus> {
    const response = await fetch(`${this.baseUrl}/api/v1/tasks/${taskId}/status`, {
      headers: {
        'X-API-Key': this.apiKey
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to get task status: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Cancel task
   */
  async cancelTask(taskId: string): Promise<void> {
    await fetch(`${this.baseUrl}/api/v1/tasks/${taskId}/cancel`, {
      method: 'DELETE',
      headers: {
        'X-API-Key': this.apiKey
      }
    })
  }
}

export const taskService = new TaskServiceClient()
```

### Task Type: `evaluate_department`

**Task Data Structure**:
```json
{
  "task_type": "evaluate_department",
  "task_data": {
    "department_slug": "character",
    "department_number": 2,
    "gather_data": [
      {
        "content": "{ \"characterName\": \"Maya\", \"age\": 30 }",
        "summary": "Character profile for Maya",
        "context": "Protagonist in sci-fi thriller"
      }
    ],
    "previous_evaluations": [
      {
        "department": "story",
        "rating": 85,
        "summary": "Strong narrative foundation"
      }
    ],
    "threshold": 80
  }
}
```

**Task Result Structure**:
```json
{
  "status": "completed",
  "result": {
    "department": "character",
    "rating": 87,
    "evaluation_result": "Full evaluation text...",
    "evaluation_summary": "Character development is strong...",
    "issues": ["Minor inconsistency in Maya's backstory"],
    "suggestions": ["Add more emotional depth to supporting characters"],
    "iteration_count": 3,
    "processing_time": 45.2
  }
}
```

---

## ⚙️ Sequential Evaluation Logic

### Department Process Flow

```
Story (1) → Character (2) → Visual (3) → Image Quality (4) → Video (5) → Audio (6) → Production (7)
```

**Rules**:
1. **Sequential Only**: No parallel evaluation for gather data
2. **Department 1 (Story)**: Always enabled (starting point)
3. **Departments 2-7**: Enabled only if previous department meets threshold
4. **Threshold Check**: Uses `department.coordinationSettings.minQualityThreshold` (default: 80)
5. **Cascading Context**: Each department receives all previous evaluation results

### Evaluation Workflow

```typescript
// src/lib/evaluation/sequential-evaluator.ts
export class SequentialEvaluator {
  async evaluateDepartment(
    projectId: string,
    departmentNumber: number
  ): Promise<EvaluationResult> {
    // 1. Get department configuration
    const department = await payload.find({
      collection: 'departments',
      where: { codeDepNumber: { equals: departmentNumber } }
    })

    // 2. Check if previous department meets threshold
    if (departmentNumber > 1) {
      const previousDept = await this.getPreviousEvaluation(
        projectId,
        departmentNumber - 1
      )

      const threshold = department.coordinationSettings.minQualityThreshold

      if (previousDept.rating < threshold) {
        throw new Error(
          `Cannot evaluate ${department.name}. ` +
          `Previous department scored ${previousDept.rating}, ` +
          `but threshold is ${threshold}`
        )
      }
    }

    // 3. Gather all data from gather database
    const gatherData = await this.getGatherData(projectId)

    // 4. Get all previous evaluations for context
    const previousEvaluations = await this.getPreviousEvaluations(
      projectId,
      departmentNumber
    )

    // 5. Submit task to tasks.ft.tc
    const task = await taskService.submitEvaluation({
      projectId,
      departmentSlug: department.slug,
      departmentNumber,
      departmentId: department.id,
      gatherData,
      previousEvaluations,
      threshold: department.coordinationSettings.minQualityThreshold,
      userId: currentUserId
    })

    // 6. Update status to in_progress
    await payload.create({
      collection: 'project-readiness',
      data: {
        projectId,
        departmentId: department.id,
        status: 'in_progress',
        taskId: task.task_id,
        taskStatus: 'queued'
      }
    })

    return {
      taskId: task.task_id,
      department: department.slug,
      status: 'in_progress'
    }
  }

  /**
   * Get gather data for evaluation
   */
  private async getGatherData(projectId: string) {
    const gatherDb = mongoClient.db(`aladdin-gather-${projectId}`)
    const items = await gatherDb.collection('gather').find({
      projectId
    }).toArray()

    return items.map(item => ({
      content: item.content,
      summary: item.summary,
      context: item.context,
      imageUrl: item.imageUrl,
      documentUrl: item.documentUrl
    }))
  }

  /**
   * Get previous evaluations for cascading context
   */
  private async getPreviousEvaluations(
    projectId: string,
    currentDeptNumber: number
  ) {
    const previousDepts = await payload.find({
      collection: 'departments',
      where: {
        codeDepNumber: { less_than: currentDeptNumber },
        gatherCheck: { equals: true }
      },
      sort: 'codeDepNumber'
    })

    const evaluations = []
    for (const dept of previousDepts.docs) {
      const evaluation = await payload.find({
        collection: 'project-readiness',
        where: {
          projectId: { equals: projectId },
          departmentId: { equals: dept.id },
          status: { equals: 'completed' }
        },
        limit: 1,
        sort: '-lastEvaluatedAt'
      })

      if (evaluation.docs.length > 0) {
        evaluations.push({
          department: dept.slug,
          rating: evaluation.docs[0].rating,
          summary: evaluation.docs[0].evaluationSummary
        })
      }
    }

    return evaluations
  }
}
```

### Data Filtering Logic

**Level 1: Master Orchestrator Filters**
```typescript
// Orchestrator receives ALL gather data
// Filters for department relevancy
// Example: Character department gets character-related data
const relevantData = gatherData.filter(item => {
  const content = JSON.parse(item.content)
  // AI-powered relevancy check
  return isRelevantToDepartment(content, departmentSlug)
})
```

**Level 2: Department Head Filters**
```typescript
// Department Head receives relevant data
// Delegates specific parts to specialist agents
// Example: Character Head → Character Profile Specialist, Arc Specialist
const delegations = departmentHead.delegateToSpecialists(relevantData)
```

**Multiple Departments Can Get Same Data**:
- Story and Character departments may both receive character descriptions
- Visual and Image Quality may both receive visual references

---

## 🎨 UI Components & Design

### Zustand Store with 30s Background Polling

```typescript
// src/stores/projectReadinessStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface DepartmentEvaluation {
  departmentId: string
  departmentSlug: string
  departmentNumber: number
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  rating: number | null
  taskId: string | null
  evaluationSummary: string | null
  evaluationResult: string | null
  issues: string[]
  suggestions: string[]
  lastEvaluatedAt: Date | null
}

interface ProjectReadinessState {
  // Data
  gatherCount: number
  gatherLineCount: number
  departments: DepartmentEvaluation[]
  projectReadinessScore: number | null

  // UI State
  expandedDepartments: Set<string>
  isEvaluating: Record<string, boolean>

  // Polling
  pollingInterval: NodeJS.Timeout | null

  // Actions
  startPolling: (projectId: string) => void
  stopPolling: () => void
  refreshData: (projectId: string) => Promise<void>
  toggleDepartment: (departmentId: string) => void
  startEvaluation: (projectId: string, departmentNumber: number) => Promise<void>
  updateEvaluationStatus: (departmentId: string, status: any) => void
}

export const useProjectReadinessStore = create<ProjectReadinessState>()(
  persist(
    (set, get) => ({
      // Initial state
      gatherCount: 0,
      gatherLineCount: 0,
      departments: [],
      projectReadinessScore: null,
      expandedDepartments: new Set(),
      isEvaluating: {},
      pollingInterval: null,

      // Start 30-second background polling
      startPolling: (projectId: string) => {
        const { pollingInterval, refreshData } = get()

        // Clear existing interval
        if (pollingInterval) {
          clearInterval(pollingInterval)
        }

        // Initial fetch
        refreshData(projectId)

        // Start 30-second polling
        const interval = setInterval(() => {
          refreshData(projectId)
        }, 30000) // 30 seconds

        set({ pollingInterval: interval })
      },

      // Stop polling
      stopPolling: () => {
        const { pollingInterval } = get()
        if (pollingInterval) {
          clearInterval(pollingInterval)
          set({ pollingInterval: null })
        }
      },

      // Refresh all data
      refreshData: async (projectId: string) => {
        try {
          // Fetch gather count
          const gatherResponse = await fetch(
            `/api/v1/gather/${projectId}/count`
          )
          const gatherData = await gatherResponse.json()

          // Fetch department evaluations
          const evaluationsResponse = await fetch(
            `/api/v1/project-readiness/${projectId}`
          )
          const evaluationsData = await evaluationsResponse.json()

          // Fetch task statuses for in-progress evaluations
          const inProgressDepts = evaluationsData.departments.filter(
            d => d.status === 'in_progress' && d.taskId
          )

          for (const dept of inProgressDepts) {
            const statusResponse = await fetch(
              `/api/v1/project-readiness/${projectId}/task/${dept.taskId}/status`
            )
            const statusData = await statusResponse.json()

            // Update if task completed
            if (statusData.status === 'completed' || statusData.status === 'failed') {
              await fetch(
                `/api/v1/project-readiness/${projectId}/department/${dept.departmentId}/sync`,
                { method: 'POST' }
              )
            }
          }

          // Refresh evaluations after sync
          const refreshedResponse = await fetch(
            `/api/v1/project-readiness/${projectId}`
          )
          const refreshedData = await refreshedResponse.json()

          set({
            gatherCount: gatherData.count,
            gatherLineCount: gatherData.lineCount,
            departments: refreshedData.departments,
            projectReadinessScore: refreshedData.projectReadinessScore
          })
        } catch (error) {
          console.error('Failed to refresh project readiness data:', error)
        }
      },

      // Toggle department card expansion
      toggleDepartment: (departmentId: string) => {
        set((state) => {
          const expanded = new Set(state.expandedDepartments)
          if (expanded.has(departmentId)) {
            expanded.delete(departmentId)
          } else {
            expanded.add(departmentId)
          }
          return { expandedDepartments: expanded }
        })
      },

      // Start department evaluation
      startEvaluation: async (projectId: string, departmentNumber: number) => {
        const department = get().departments.find(
          d => d.departmentNumber === departmentNumber
        )

        if (!department) return

        set((state) => ({
          isEvaluating: { ...state.isEvaluating, [department.departmentId]: true }
        }))

        try {
          const response = await fetch(
            `/api/v1/project-readiness/${projectId}/evaluate`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ departmentNumber })
            }
          )

          const result = await response.json()

          // Update department with task ID and in_progress status
          set((state) => ({
            departments: state.departments.map(d =>
              d.departmentId === department.departmentId
                ? { ...d, status: 'in_progress', taskId: result.taskId }
                : d
            )
          }))

          // Start immediate polling for this evaluation
          get().refreshData(projectId)
        } catch (error) {
          console.error('Evaluation failed:', error)
          set((state) => ({
            isEvaluating: { ...state.isEvaluating, [department.departmentId]: false }
          }))
        }
      },

      // Update evaluation status
      updateEvaluationStatus: (departmentId: string, status: any) => {
        set((state) => ({
          departments: state.departments.map(d =>
            d.departmentId === departmentId
              ? { ...d, ...status }
              : d
          ),
          isEvaluating: { ...state.isEvaluating, [departmentId]: false }
        }))
      }
    }),
    {
      name: 'project-readiness-storage',
      partialize: (state) => ({
        expandedDepartments: Array.from(state.expandedDepartments),
        // Don't persist polling state or data
      })
    }
  )
)
```

### Department Evaluation Card

**Collapsed State**:
```
┌─────────────────────────────────────────────────────┐
│ 2. Character Department                   Score: 87 │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 87%      │
│ "Character development is strong with clear..."     │ ← Summary
│ Threshold: 80  |  Status: ✅ Completed              │
│ [Expand ▼]                          [Re-evaluate]   │
└─────────────────────────────────────────────────────┘
```

**Expanded State**:
```
┌─────────────────────────────────────────────────────┐
│ 2. Character Department                   Score: 87 │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 87%      │
│ "Character development is strong with clear..."     │
├─────────────────────────────────────────────────────┤
│ 📊 Evaluation Summary:                              │
│ Character development is strong with clear arcs     │
│ and well-defined personalities. The protagonist     │
│ Maya shows complexity and growth potential...       │
│                                                     │
│ 📝 Full Evaluation:                                 │
│ [Collapsible section with full AI evaluation text] │
│                                                     │
│ ⚠️ Issues (1):                                      │
│ • Minor inconsistency in Maya's backstory timeline  │
│                                                     │
│ 💡 Suggestions (2):                                 │
│ • Add more emotional depth to supporting characters │
│ • Develop antagonist's motivation more clearly      │
│                                                     │
│ Last Evaluated: 2 hours ago                         │
│ [Collapse ▲]                        [Re-evaluate]   │
└─────────────────────────────────────────────────────┘
```

**Loading State (During Evaluation)**:
```
┌─────────────────────────────────────────────────────┐
│ 2. Character Department              Score: Pending │
│ ⏳ Evaluating...                                    │
│ ┌─────────────────────────────────────────────────┐ │
│ │ ▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░     │ │
│ │ Processing... Time: 00:02:15                    │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ [Cancel Evaluation]                                 │
└─────────────────────────────────────────────────────┘
```

**Component Implementation**:
```typescript
// src/components/project-readiness/DepartmentCard.tsx
interface DepartmentCardProps {
  department: DepartmentEvaluation
  previousDepartment: DepartmentEvaluation | null
  threshold: number
  projectId: string
  onEvaluate: () => void
}

export function DepartmentCard({
  department,
  previousDepartment,
  threshold,
  projectId,
  onEvaluate
}: DepartmentCardProps) {
  const { expandedDepartments, toggleDepartment, isEvaluating } =
    useProjectReadinessStore()

  const isExpanded = expandedDepartments.has(department.departmentId)
  const isLoading = isEvaluating[department.departmentId] ||
    department.status === 'in_progress'

  // Determine if evaluate button should be enabled
  const canEvaluate = () => {
    // Department 1 is always enabled
    if (department.departmentNumber === 1) return true

    // Other departments require previous to meet threshold
    if (!previousDepartment) return false

    return previousDepartment.status === 'completed' &&
           previousDepartment.rating >= threshold
  }

  return (
    <Card className="mb-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{department.departmentNumber}.</span>
            <div>
              <h3 className="text-lg font-semibold">
                {department.departmentSlug} Department
              </h3>
              {department.evaluationSummary && (
                <p className="text-sm text-muted-foreground">
                  {department.evaluationSummary}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {department.rating !== null && (
              <div className="text-right">
                <div className="text-2xl font-bold">
                  {department.rating}
                </div>
                <div className="text-xs text-muted-foreground">
                  Threshold: {threshold}
                </div>
              </div>
            )}

            {department.status === 'completed' && (
              <Badge variant="success">✅ Completed</Badge>
            )}
            {department.status === 'in_progress' && (
              <Badge variant="warning">⏳ Evaluating</Badge>
            )}
            {department.status === 'failed' && (
              <Badge variant="destructive">❌ Failed</Badge>
            )}
          </div>
        </div>

        {/* Progress bar for rating */}
        {department.rating !== null && (
          <div className="mt-2">
            <Progress
              value={department.rating}
              className="h-2"
              indicatorClassName={
                department.rating >= threshold
                  ? "bg-green-500"
                  : "bg-yellow-500"
              }
            />
          </div>
        )}
      </CardHeader>

      {/* Loading state */}
      {isLoading && (
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Processing evaluation...</span>
            </div>
            <AnimatedProgress />
          </div>
        </CardContent>
      )}

      {/* Expanded content */}
      {isExpanded && department.status === 'completed' && (
        <CardContent className="space-y-4">
          {/* Evaluation Summary */}
          <div>
            <h4 className="font-semibold mb-2">📊 Evaluation Summary</h4>
            <p className="text-sm">{department.evaluationSummary}</p>
          </div>

          {/* Full Evaluation (Collapsible) */}
          <Collapsible>
            <CollapsibleTrigger>
              <h4 className="font-semibold">📝 Full Evaluation</h4>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <p className="text-sm whitespace-pre-wrap mt-2">
                {department.evaluationResult}
              </p>
            </CollapsibleContent>
          </Collapsible>

          {/* Issues */}
          {department.issues.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">
                ⚠️ Issues ({department.issues.length})
              </h4>
              <ul className="list-disc list-inside space-y-1">
                {department.issues.map((issue, idx) => (
                  <li key={idx} className="text-sm">{issue}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Suggestions */}
          {department.suggestions.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">
                💡 Suggestions ({department.suggestions.length})
              </h4>
              <ul className="list-disc list-inside space-y-1">
                {department.suggestions.map((suggestion, idx) => (
                  <li key={idx} className="text-sm">{suggestion}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Metadata */}
          {department.lastEvaluatedAt && (
            <div className="text-xs text-muted-foreground">
              Last Evaluated: {formatDistanceToNow(department.lastEvaluatedAt)} ago
            </div>
          )}
        </CardContent>
      )}

      <CardFooter className="flex justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => toggleDepartment(department.departmentId)}
        >
          {isExpanded ? 'Collapse ▲' : 'Expand ▼'}
        </Button>

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
```

### Animated Progress Component

```typescript
// src/components/project-readiness/AnimatedProgress.tsx
export function AnimatedProgress() {
  const [elapsedTime, setElapsedTime] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(prev => prev + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  return (
    <div className="space-y-2">
      <div className="relative h-2 bg-secondary rounded-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 animate-pulse" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
      </div>
      <div className="text-xs text-muted-foreground text-center">
        Time: {formatTime(elapsedTime)}
      </div>
    </div>
  )
}
```

### Page Layout

```typescript
// src/app/(frontend)/dashboard/project/[id]/project-readiness/page.tsx
export default function ProjectReadinessPage({
  params
}: {
  params: { id: string }
}) {
  const projectId = params.id
  const {
    gatherCount,
    gatherLineCount,
    departments,
    projectReadinessScore,
    startPolling,
    stopPolling,
    startEvaluation
  } = useProjectReadinessStore()

  useEffect(() => {
    // Start polling when page loads
    startPolling(projectId)

    // Cleanup on unmount
    return () => stopPolling()
  }, [projectId])

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">
          Project Readiness Evaluation
        </h1>

        <div className="bg-muted p-4 rounded-lg space-y-2">
          <p className="text-sm">
            This page will help you ready the project for production.
            There are <strong>{gatherLineCount}</strong> lines of information
            available for processing.
          </p>
          <p className="text-sm">
            You can provide all the information you want via the chat.
          </p>
          <p className="text-sm">
            When you feel that enough information has been provided,
            you can run the evaluation.
          </p>
        </div>
      </div>

      {/* Overall Readiness Score */}
      {projectReadinessScore !== null && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Overall Project Readiness</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="text-5xl font-bold">
                {projectReadinessScore}
              </div>
              <div className="flex-1">
                <Progress value={projectReadinessScore} className="h-4" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Department Cards */}
      <div className="space-y-4">
        {departments.map((dept, idx) => (
          <DepartmentCard
            key={dept.departmentId}
            department={dept}
            previousDepartment={idx > 0 ? departments[idx - 1] : null}
            threshold={dept.threshold}
            projectId={projectId}
            onEvaluate={() => startEvaluation(projectId, dept.departmentNumber)}
          />
        ))}
      </div>
    </div>
  )
}
```

---

## 📡 API Endpoints

### 1. Get Project Readiness Overview

**GET** `/api/v1/project-readiness/{projectId}`

Get all department evaluations and overall readiness score.

**Response**:
```json
{
  "projectId": "proj_123",
  "projectReadinessScore": 82,
  "gatherCount": 23,
  "gatherLineCount": 1547,
  "departments": [
    {
      "departmentId": "dept_story",
      "departmentSlug": "story",
      "departmentNumber": 1,
      "status": "completed",
      "rating": 85,
      "evaluationSummary": "Strong narrative foundation...",
      "threshold": 80,
      "lastEvaluatedAt": "2025-01-15T10:30:00Z"
    },
    {
      "departmentId": "dept_character",
      "departmentSlug": "character",
      "departmentNumber": 2,
      "status": "pending",
      "rating": null,
      "threshold": 80
    }
  ]
}
```

### 2. Submit Department Evaluation

**POST** `/api/v1/project-readiness/{projectId}/evaluate`

Start evaluation for a specific department.

**Request Body**:
```json
{
  "departmentNumber": 2
}
```

**Response**:
```json
{
  "taskId": "task_abc123",
  "departmentId": "dept_character",
  "status": "queued",
  "estimatedDuration": 120
}
```

### 3. Get Task Status

**GET** `/api/v1/project-readiness/{projectId}/task/{taskId}/status`

Get current status of evaluation task.

**Response**:
```json
{
  "taskId": "task_abc123",
  "status": "processing",
  "progress": 0.65,
  "currentStep": "analyzing_character_arcs",
  "startedAt": "2025-01-15T10:30:00Z"
}
```

### 4. Sync Task Result

**POST** `/api/v1/project-readiness/{projectId}/department/{departmentId}/sync`

Sync completed task results to database.

**Response**:
```json
{
  "synced": true,
  "rating": 87,
  "status": "completed"
}
```

### 5. Get Gather Count

**GET** `/api/v1/gather/{projectId}/count`

Get gather item and line count.

**Response**:
```json
{
  "count": 23,
  "lineCount": 1547
}
```

### 6. Cancel Evaluation

**DELETE** `/api/v1/project-readiness/{projectId}/task/{taskId}/cancel`

Cancel in-progress evaluation.

**Response**:
```json
{
  "cancelled": true,
  "taskId": "task_abc123"
}
```

### 7. Get Department Details

**GET** `/api/v1/project-readiness/{projectId}/department/{departmentId}`

Get detailed evaluation for specific department.

**Response**:
```json
{
  "departmentId": "dept_character",
  "rating": 87,
  "evaluationResult": "Full evaluation text...",
  "evaluationSummary": "Summary text...",
  "issues": ["Issue 1", "Issue 2"],
  "suggestions": ["Suggestion 1"],
  "lastEvaluatedAt": "2025-01-15T10:30:00Z",
  "evaluationDuration": 45
}
```

### 8. Webhook: Evaluation Complete

**POST** `/api/webhooks/evaluation-complete`

Receive notification from tasks.ft.tc when evaluation completes.

**Request Body**:
```json
{
  "task_id": "task_abc123",
  "status": "completed",
  "project_id": "proj_123",
  "result": {
    "department": "character",
    "rating": 87,
    "evaluation_result": "Full text...",
    "evaluation_summary": "Summary...",
    "issues": [],
    "suggestions": [],
    "iteration_count": 3,
    "processing_time": 45.2
  },
  "metadata": {
    "department_id": "dept_character"
  }
}
```

**Handler Implementation**:
```typescript
// src/app/api/webhooks/evaluation-complete/route.ts
export async function POST(req: Request) {
  const body = await req.json()
  const { task_id, status, result, metadata } = body

  try {
    if (status === 'completed') {
      // Update project-readiness collection
      await payload.update({
        collection: 'project-readiness',
        where: {
          taskId: { equals: task_id }
        },
        data: {
          status: 'completed',
          rating: result.rating,
          evaluationResult: result.evaluation_result,
          evaluationSummary: result.evaluation_summary,
          issues: result.issues,
          suggestions: result.suggestions,
          evaluationDuration: result.processing_time,
          lastEvaluatedAt: new Date()
        }
      })

      // Update overall project readiness score
      await updateProjectReadinessScore(body.project_id)
    } else if (status === 'failed') {
      // Mark as failed
      await payload.update({
        collection: 'project-readiness',
        where: {
          taskId: { equals: task_id }
        },
        data: {
          status: 'failed'
        }
      })
    }

    return Response.json({ received: true })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return Response.json({ error: 'Internal error' }, { status: 500 })
  }
}
```

---

## 🎯 Threshold Gating Logic

### Gating Rules

1. **Department 1 (Story)**:
   - Always enabled
   - No prerequisites
   - Starting point for evaluation

2. **Departments 2-7**:
   - Enabled only if previous department completed
   - Previous department must meet or exceed threshold
   - Threshold from `department.coordinationSettings.minQualityThreshold`

3. **Default Threshold**: 80 (if not specified)

### Threshold Display

Each card shows:
- Current rating (if evaluated)
- Required threshold
- Visual indicator (green if met, yellow if not)

### Implementation

```typescript
function canEvaluateDepartment(
  departmentNumber: number,
  previousDepartment: DepartmentEvaluation | null,
  threshold: number
): boolean {
  // Department 1 is always enabled
  if (departmentNumber === 1) {
    return true
  }

  // Check if previous department exists
  if (!previousDepartment) {
    return false
  }

  // Check if previous department completed
  if (previousDepartment.status !== 'completed') {
    return false
  }

  // Check if previous department meets threshold
  return previousDepartment.rating >= threshold
}
```

### Visual Feedback

```typescript
// Button states
<Button
  disabled={!canEvaluate()}
  variant={canEvaluate() ? 'default' : 'secondary'}
  title={
    !canEvaluate() && departmentNumber > 1
      ? `Previous department must score ≥${threshold}`
      : 'Start evaluation'
  }
>
  Evaluate
</Button>
```

---

## 💬 AI Chat Integration

### Chat Component Reuse

**Same component as gather page**:
- Located in right sidebar
- Supports message history
- AI-powered responses

### Conditional Buttons

**"Add to Gather" buttons visible only on**:
- `/dashboard/project/[id]/gather`
- `/dashboard/project/[id]/project-readiness`

**Implementation**:
```typescript
// src/components/chat/ChatInterface.tsx
export function ChatInterface({ projectId }: { projectId: string }) {
  const pathname = usePathname()

  const showGatherButtons =
    pathname.includes('/gather') ||
    pathname.includes('/project-readiness')

  return (
    <div className="flex flex-col h-full">
      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto">
        {messages.map(msg => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
      </div>

      {/* Gather buttons (conditional) */}
      {showGatherButtons && (
        <div className="border-t p-4 space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddToGather}
          >
            📦 Add to Gather
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddAllToGather}
          >
            📦 Add All to Gather
          </Button>
        </div>
      )}

      {/* Chat input */}
      <div className="border-t p-4">
        <ChatInput onSend={handleSend} />
      </div>
    </div>
  )
}
```

### Gather Count Display

Show current gather item count in chat header:
```typescript
<div className="p-4 border-b">
  <h3 className="font-semibold">AI Assistant</h3>
  <p className="text-xs text-muted-foreground">
    {gatherCount} items in gather database
  </p>
</div>
```

---

## 📂 File Structure

### New Files to Create (~15)

**Collections**:
```
src/collections/ProjectReadiness.ts
```

**Stores**:
```
src/stores/projectReadinessStore.ts
```

**Pages**:
```
src/app/(frontend)/dashboard/project/[id]/project-readiness/page.tsx
```

**Components**:
```
src/components/project-readiness/DepartmentCard.tsx
src/components/project-readiness/AnimatedProgress.tsx
src/components/project-readiness/ReadinessOverview.tsx
src/components/project-readiness/ThresholdIndicator.tsx
src/components/project-readiness/EvaluationStatus.tsx
```

**Services**:
```
src/lib/task-service/client.ts
src/lib/task-service/types.ts
src/lib/evaluation/sequential-evaluator.ts
src/lib/evaluation/score-calculator.ts
```

**API Routes**:
```
src/app/api/v1/project-readiness/[projectId]/route.ts
src/app/api/v1/project-readiness/[projectId]/evaluate/route.ts
src/app/api/v1/project-readiness/[projectId]/task/[taskId]/status/route.ts
src/app/api/v1/project-readiness/[projectId]/department/[departmentId]/route.ts
src/app/api/v1/project-readiness/[projectId]/department/[departmentId]/sync/route.ts
src/app/api/webhooks/evaluation-complete/route.ts
```

### Files to Modify (~3)

**Left Sidebar**:
```
src/app/(frontend)/dashboard/project/[id]/components/ProjectSidebar.tsx
```

**AI Chat**:
```
src/components/chat/ChatInterface.tsx
```

**Route Configuration**:
```
src/app/(frontend)/dashboard/project/[id]/layout.tsx
```

---

## ✅ Implementation Checklist

### Phase 1: Database & Collections (Week 1)

- [ ] Create `ProjectReadiness` collection in PayloadCMS
- [ ] Add all fields (projectId, departmentId, rating, status, etc.)
- [ ] Create indexes for efficient queries
- [ ] Setup collection relationships
- [ ] Create seed data for testing

### Phase 2: Task Service Integration (Week 1)

- [ ] Create task service client (`src/lib/task-service/client.ts`)
- [ ] Implement `submitEvaluation()` method
- [ ] Implement `getTaskStatus()` method
- [ ] Implement `cancelTask()` method
- [ ] Add environment variable configuration
- [ ] Create webhook handler for task completion
- [ ] Test task submission and polling

### Phase 3: Sequential Evaluation Logic (Week 2)

- [ ] Create `SequentialEvaluator` class
- [ ] Implement gather data retrieval
- [ ] Implement previous evaluations retrieval
- [ ] Build department threshold checking
- [ ] Create data filtering logic
- [ ] Implement score aggregation
- [ ] Test sequential evaluation flow
- [ ] Integrate with existing orchestrator

### Phase 4: Zustand Store & Polling (Week 2)

- [ ] Create `projectReadinessStore.ts`
- [ ] Implement 30-second polling logic
- [ ] Add gather count tracking
- [ ] Add evaluation status tracking
- [ ] Implement department expansion state
- [ ] Add evaluation trigger actions
- [ ] Test polling and state updates

### Phase 5: UI Components (Week 2-3)

- [ ] Create `DepartmentCard` component
- [ ] Create `AnimatedProgress` component
- [ ] Create `ReadinessOverview` component
- [ ] Create `ThresholdIndicator` component
- [ ] Implement collapsible evaluation results
- [ ] Add loading states and animations
- [ ] Style cards with shadcn components
- [ ] Add responsive design

### Phase 6: Page Implementation (Week 3)

- [ ] Create page at `/dashboard/project/[id]/project-readiness/page.tsx`
- [ ] Implement page layout
- [ ] Add header with gather info
- [ ] Display department cards in order
- [ ] Show overall readiness score
- [ ] Integrate with Zustand store
- [ ] Add polling lifecycle management

### Phase 7: API Endpoints (Week 3)

- [ ] Implement GET `/api/v1/project-readiness/{projectId}`
- [ ] Implement POST `/api/v1/project-readiness/{projectId}/evaluate`
- [ ] Implement GET `/api/v1/project-readiness/{projectId}/task/{taskId}/status`
- [ ] Implement POST `/api/v1/project-readiness/{projectId}/department/{departmentId}/sync`
- [ ] Implement GET `/api/v1/gather/{projectId}/count`
- [ ] Implement DELETE `/api/v1/project-readiness/{projectId}/task/{taskId}/cancel`
- [ ] Implement GET `/api/v1/project-readiness/{projectId}/department/{departmentId}`
- [ ] Implement POST `/api/webhooks/evaluation-complete`

### Phase 8: Navigation & Integration (Week 3)

- [ ] Add "Project Readiness" link to left sidebar
- [ ] Update AI chat to show gather buttons conditionally
- [ ] Test navigation flow
- [ ] Add active state styling

### Phase 9: Testing (Week 4)

- [ ] Unit tests for sequential evaluator
- [ ] Unit tests for task service client
- [ ] Integration tests for API endpoints
- [ ] E2E tests for evaluation workflow
- [ ] Test polling and real-time updates
- [ ] Test threshold gating logic
- [ ] Test with real tasks.ft.tc service

### Phase 10: Documentation & Polish (Week 4)

- [ ] Add code comments
- [ ] Write API documentation
- [ ] Create user guide
- [ ] Add error handling
- [ ] Optimize performance
- [ ] Final QA testing

---

## 🎯 Success Criteria

### Functional Requirements

✅ **Sequential Evaluation**:
- Departments evaluate in order (1→2→3→4→5→6→7)
- No parallel evaluation for gather data
- Each department receives previous results as context

✅ **Threshold Gating**:
- Department 1 always enabled
- Other departments gated by previous threshold
- Clear visual feedback for gating state

✅ **Task Service Integration**:
- Successfully submit tasks to tasks.ft.tc
- Poll for status updates
- Handle webhook callbacks
- Cancel in-progress tasks

✅ **Zustand Polling**:
- 30-second background polling
- Updates gather count
- Updates evaluation status
- No server-side polling

✅ **Gather Integration**:
- Query gather database for data
- Display line count
- Pass all data to orchestrator

✅ **UI/UX**:
- Department cards with collapsible results
- Animated loading states
- Re-evaluate functionality
- Responsive design

✅ **AI Chat**:
- Reuse gather page component
- Conditional gather buttons
- Gather count display

### Performance Requirements

- Page load < 2 seconds
- Polling overhead < 100ms per cycle
- Evaluation submission < 1 second
- Task status check < 500ms
- Webhook processing < 200ms

### Quality Requirements

- All TypeScript types defined
- Error handling for all API calls
- Loading states for all async operations
- Graceful degradation if tasks.ft.tc unavailable
- Comprehensive test coverage

---

## 🚀 Deployment Considerations

### Environment Variables

```bash
# Task Service
TASKS_API_URL=https://tasks.ft.tc
CELERY_TASK_API_KEY=your_api_key

# App URL for webhooks
NEXT_PUBLIC_APP_URL=https://auto-movie.ft.tc

# Gather Database
MONGODB_URI=mongodb://localhost:27017/aladdin
```

### Production Checklist

- [ ] Configure production TASKS_API_URL
- [ ] Set up webhook endpoint with SSL
- [ ] Configure API key authentication
- [ ] Test polling performance under load
- [ ] Monitor task queue lengths
- [ ] Set up error tracking (Sentry)
- [ ] Configure rate limiting

---

## 📝 Technical Notes

### Key Differences from Gather Page

| Feature | Gather Page | Project Readiness |
|---------|-------------|-------------------|
| **Purpose** | Collect unqualified data | Evaluate readiness |
| **Data Flow** | User → Gather DB | Gather DB → Evaluation |
| **Processing** | Parallel (10 at a time) | Sequential (1→7) |
| **Task Queue** | BullMQ (not used yet) | tasks.ft.tc (Celery) |
| **AI Integration** | Chat creates content | Chat adds to gather |
| **Polling** | None | 30s background |

### Integration Points

1. **Orchestrator**: Uses existing `src/lib/agents/orchestrator.ts`
2. **Departments**: Queries `departments` collection for config
3. **Gather**: Reads from `aladdin-gather-{projectId}` database
4. **Chat**: Shares component with gather page

### Performance Optimization

1. **Polling**: Only check gather count and in-progress tasks
2. **Caching**: Cache department configurations
3. **Debouncing**: Debounce manual status checks
4. **Lazy Loading**: Load evaluation details on card expansion

---

**Implementation Ready** 🚀

**Estimated Effort**:
- **Total Files**: 15 new files, 3 modified files
- **Lines of Code**: ~2,000-2,500 LOC
- **Development Time**: 3-4 weeks (4 sprints)
- **Team Size**: 2-3 developers

**Next Steps**:
1. Review and approve this specification
2. Setup tasks.ft.tc integration
3. Create ProjectReadiness collection
4. Build Zustand store with polling
5. Implement UI components
6. Test with real evaluations

---

*This document is the single source of truth for the Project Readiness page implementation. All requirements and technical decisions are documented based on project architecture and user clarifications.*
