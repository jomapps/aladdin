# Automated Gather Architecture

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         React Component                          │
│                                                                   │
│  ┌────────────────┐  ┌──────────────────┐  ┌─────────────────┐ │
│  │useAutomatedGather│  │useGatherProgress│  │useGatherWebSocket│ │
│  └────────┬───────┘  └────────┬─────────┘  └────────┬────────┘ │
│           │                    │                      │          │
└───────────┼────────────────────┼──────────────────────┼──────────┘
            │                    │                      │
            ▼                    ▼                      ▼
┌───────────────────────────────────────────────────────────────────┐
│                     Zustand Store (automatedGatherStore)          │
│                                                                    │
│  State:                                                            │
│  - taskId: string | null                                          │
│  - status: TaskStatusValue | null                                 │
│  - progress: AutomationProgress                                   │
│  - lastUpdate: string | null                                      │
│                                                                    │
│  Actions:                                                          │
│  - startAutomation(taskId)                                        │
│  - updateProgress(status)                                         │
│  - updateDepartmentProgress(dept)                                 │
│  - setStatus(status)                                              │
│  - cancelAutomation()                                             │
│  - reset()                                                         │
└────────────────┬───────────────────────────┬──────────────────────┘
                 │                           │
                 ▼                           ▼
┌─────────────────────────┐        ┌──────────────────────────┐
│   Task Service API      │        │   WebSocket Server       │
│   (tasks.ft.tc)         │        │   (/api/ws)              │
│                         │        │                          │
│  POST /tasks/submit     │        │  - Subscribe to events   │
│  GET /tasks/{id}/status │        │  - Real-time updates     │
│  DELETE /tasks/{id}     │        │  - Auto reconnection     │
└─────────────────────────┘        └──────────────────────────┘
```

## 🔄 Data Flow

### 1. Starting Automation

```
User clicks "Start"
      │
      ▼
useAutomatedGather.startAutomation()
      │
      ▼
POST /api/gather/automate
      │
      ▼
Task Service: Submit task
      │
      ▼
Return taskId
      │
      ▼
store.startAutomation(taskId)
      │
      ▼
State updated: status = 'queued'
      │
      ▼
UI re-renders with progress bar
```

### 2. Progress Updates (Polling)

```
useGatherProgress() hook mounted
      │
      ▼
Check if taskId exists
      │
      ▼
Fetch status from Task Service
      │
      ▼
store.updateProgress(status)
      │
      ▼
Poll every 2s if active
      │
      ▼
UI updates with progress
```

### 3. Real-time Updates (WebSocket)

```
useGatherWebSocket() hook mounted
      │
      ▼
Connect to ws://host/api/ws
      │
      ▼
Subscribe to 'automated-gather' channel
      │
      ▼
Receive event from server
      │
      ├─── automated-gather-start
      │    └──> store.setStatus('processing')
      │
      ├─── automated-gather-progress
      │    └──> store.updateDepartmentProgress(data)
      │
      ├─── automated-gather-complete
      │    └──> store.setStatus('completed')
      │
      └─── automated-gather-error
           └──> store.setStatus('failed')
      │
      ▼
UI updates instantly
```

### 4. Canceling Automation

```
User clicks "Cancel"
      │
      ▼
useAutomatedGather.cancelAutomation()
      │
      ▼
DELETE /api/gather/automate/{taskId}
      │
      ▼
Task Service: Cancel task
      │
      ▼
store.cancelAutomation()
      │
      ▼
State updated: status = 'cancelled'
      │
      ▼
WebSocket receives cancel event
      │
      ▼
UI shows cancelled state
```

## 📊 State Management Flow

```
┌──────────────────────────────────────────────────────────────┐
│                    Initial State                              │
│  {                                                            │
│    taskId: null,                                              │
│    status: null,                                              │
│    progress: {                                                │
│      completedDepartments: [],                               │
│      failedDepartments: [],                                  │
│      overallProgress: 0,                                     │
│      departments: {}                                         │
│    }                                                          │
│  }                                                            │
└──────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│                 startAutomation(taskId)                       │
│  {                                                            │
│    taskId: "task_123",                                        │
│    status: "queued",                                          │
│    progress: { ... },                                         │
│    lastUpdate: "2025-10-04T12:00:00Z"                        │
│  }                                                            │
└──────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│           updateDepartmentProgress(department)                │
│  {                                                            │
│    taskId: "task_123",                                        │
│    status: "processing",                                      │
│    progress: {                                                │
│      currentDepartment: "engineering",                        │
│      completedDepartments: [],                               │
│      failedDepartments: [],                                  │
│      overallProgress: 10,                                    │
│      departments: {                                          │
│        "engineering": {                                      │
│          status: "processing",                              │
│          progress: 50,                                      │
│          currentStep: "Analyzing requirements"              │
│        }                                                     │
│      }                                                       │
│    }                                                          │
│  }                                                            │
└──────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│                    Final State                                │
│  {                                                            │
│    taskId: "task_123",                                        │
│    status: "completed",                                       │
│    progress: {                                                │
│      currentDepartment: null,                                │
│      completedDepartments: ["engineering", "design", ...],   │
│      failedDepartments: [],                                  │
│      overallProgress: 100,                                   │
│      departments: {                                          │
│        "engineering": { status: "completed", ... },          │
│        "design": { status: "completed", ... },              │
│        ...                                                   │
│      }                                                        │
│    }                                                          │
│  }                                                            │
└──────────────────────────────────────────────────────────────┘
```

## 🎯 Hook Responsibilities

### useAutomatedGather
**Responsibility**: Automation control
- Start automation (API call)
- Cancel automation (API call)
- Reset state
- Error handling
- Loading state management

**Does NOT handle**:
- Progress tracking
- WebSocket connections
- UI rendering

### useGatherProgress
**Responsibility**: Progress monitoring
- Fetch current status
- Poll for updates
- Format progress data
- Calculate completion percentage

**Does NOT handle**:
- Starting/stopping automation
- WebSocket real-time updates
- UI rendering

### useGatherWebSocket
**Responsibility**: Real-time updates
- WebSocket connection management
- Event subscription
- Auto-reconnection
- Event parsing and dispatching

**Does NOT handle**:
- Progress polling
- Starting/stopping automation
- UI rendering

## 🔒 State Consistency

### Polling + WebSocket Strategy

```
┌─────────────────────────────────────────┐
│         useGatherProgress               │
│         (Polling - 2s interval)         │
│                                         │
│  - Reliable fallback                   │
│  - Works without WebSocket             │
│  - Catches missed events               │
└─────────────────────────────────────────┘
                    +
┌─────────────────────────────────────────┐
│       useGatherWebSocket                │
│       (Real-time - instant)             │
│                                         │
│  - Instant updates                     │
│  - Better UX                           │
│  - Event-driven                        │
└─────────────────────────────────────────┘
                    =
┌─────────────────────────────────────────┐
│       Best of Both Worlds               │
│                                         │
│  - Always up-to-date                   │
│  - Works with/without WebSocket        │
│  - No race conditions                  │
│  - State always converges              │
└─────────────────────────────────────────┘
```

### State Update Priority

1. **WebSocket Event** (if available)
   - Immediate update
   - Low latency
   - Event-driven

2. **Polling Update** (fallback)
   - Regular intervals (2s)
   - Catches any missed events
   - Ensures consistency

3. **Store Updates** (always)
   - Single source of truth
   - All updates go through store
   - React re-renders automatically

## 🛡️ Error Handling

```
┌─────────────────────────────────────────┐
│          Error Scenarios                │
└─────────────────────────────────────────┘
                    │
        ├───────────┼───────────┐
        ▼           ▼           ▼
┌──────────┐  ┌──────────┐  ┌──────────┐
│ API Error│  │WS Error  │  │Task Error│
└──────────┘  └──────────┘  └──────────┘
      │            │            │
      ▼            ▼            ▼
┌──────────────────────────────────────┐
│         Error Handling Strategy      │
│                                      │
│  1. Catch error                     │
│  2. Set error state                 │
│  3. Display to user                 │
│  4. Retry if appropriate            │
│  5. Cleanup resources               │
└──────────────────────────────────────┘
```

### WebSocket Reconnection

```
Connection Lost
      │
      ▼
Wait (reconnectDelay * attempts)
      │
      ▼
Attempt Reconnection
      │
      ├─── Success
      │    └──> Reset attempts
      │    └──> Re-subscribe
      │
      └─── Failure
           └──> Increment attempts
           └──> Retry (max 5 times)
           └──> Fallback to polling
```

## 📈 Performance Considerations

### Optimization Strategies

1. **Selective Updates**
   - Only update changed departments
   - Calculate progress incrementally
   - Memoize computed values

2. **Network Efficiency**
   - Poll only when task is active
   - WebSocket reconnection with backoff
   - Cancel requests on unmount

3. **React Performance**
   - Use Zustand for global state
   - Selective store subscriptions
   - Proper dependency arrays

4. **Memory Management**
   - Cleanup WebSocket on unmount
   - Clear intervals on unmount
   - Reset state when done

## 🔗 Integration Points

### Required API Endpoints

```typescript
// Start automation
POST /api/gather/automate
Request: { projectId, gatherData, threshold }
Response: { taskId }

// Cancel automation
DELETE /api/gather/automate/{taskId}
Response: { success }

// WebSocket
WS /api/ws
Subscribe: { type: 'subscribe', channel: 'automated-gather', taskId }
Events: AutomatedGatherEvent[]
```

### Task Service Integration

```typescript
// Submit task
taskService.submitTask('automated_gather', data)

// Check status
taskService.getTaskStatus(taskId)

// Cancel task
taskService.cancelTask(taskId)
```

## 🎨 UI Component Structure

```
AutomatedGatherPanel
├── Controls
│   ├── StartButton (useAutomatedGather)
│   ├── CancelButton (useAutomatedGather)
│   └── ResetButton (useAutomatedGather)
│
├── ProgressDisplay
│   ├── OverallProgress (useGatherProgress)
│   ├── CurrentDepartment (useGatherProgress)
│   └── ProgressBar (useGatherProgress)
│
├── DepartmentList
│   └── DepartmentCard (store.progress.departments)
│       ├── Status Badge
│       ├── Progress Bar
│       ├── Current Step
│       └── Quality Score
│
└── Summary
    ├── CompletedCount (useGatherProgress)
    ├── FailedCount (useGatherProgress)
    └── TotalCount (store.progress.departments)
```

---

**Architecture Status**: ✅ Complete and Production Ready
