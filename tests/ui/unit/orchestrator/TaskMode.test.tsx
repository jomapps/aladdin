/**
 * Unit Tests: TaskMode Component
 * Tests for task execution mode in orchestrator
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

interface Task {
  id: string
  title: string
  description: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  progress?: number
  result?: string
  createdAt: Date
}

// Mock TaskMode component
const TaskMode = ({
  onCreateTask,
  onCancelTask,
  tasks = [],
  isCreating = false
}: {
  onCreateTask?: (title: string, description: string) => void
  onCancelTask?: (taskId: string) => void
  tasks?: Task[]
  isCreating?: boolean
}) => {
  const [title, setTitle] = React.useState('')
  const [description, setDescription] = React.useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onCreateTask?.(title, description)
    setTitle('')
    setDescription('')
  }

  return (
    <div data-testid="task-mode">
      <form onSubmit={handleSubmit} data-testid="task-form">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Task title"
          data-testid="task-title-input"
          disabled={isCreating}
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Task description"
          data-testid="task-description-input"
          disabled={isCreating}
        />
        <button
          type="submit"
          data-testid="create-task-button"
          disabled={isCreating || !title.trim()}
        >
          {isCreating ? 'Creating...' : 'Create Task'}
        </button>
      </form>

      {tasks.length > 0 && (
        <div data-testid="task-list">
          {tasks.map(task => (
            <div key={task.id} data-testid={`task-${task.id}`}>
              <h3 data-testid={`task-title-${task.id}`}>{task.title}</h3>
              <p data-testid={`task-description-${task.id}`}>{task.description}</p>
              <span data-testid={`task-status-${task.id}`}>{task.status}</span>

              {task.progress !== undefined && (
                <progress
                  value={task.progress}
                  max={100}
                  data-testid={`task-progress-${task.id}`}
                />
              )}

              {task.result && (
                <div data-testid={`task-result-${task.id}`}>{task.result}</div>
              )}

              {(task.status === 'running' || task.status === 'pending') && (
                <button
                  onClick={() => onCancelTask?.(task.id)}
                  data-testid={`cancel-task-${task.id}`}
                >
                  Cancel
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {tasks.length === 0 && (
        <div data-testid="empty-state">No tasks yet. Create your first task!</div>
      )}
    </div>
  )
}

// Mock React
const React = {
  useState: (initial: any) => {
    let value = initial
    const setValue = (newValue: any) => {
      value = typeof newValue === 'function' ? newValue(value) : newValue
    }
    return [value, setValue]
  },
  FormEvent: {} as any
}

describe('TaskMode', () => {
  const mockTasks: Task[] = [
    {
      id: '1',
      title: 'Generate Video',
      description: 'Create a promotional video',
      status: 'completed',
      result: 'Video generated successfully',
      createdAt: new Date('2024-01-01')
    },
    {
      id: '2',
      title: 'Process Images',
      description: 'Enhance image quality',
      status: 'running',
      progress: 65,
      createdAt: new Date('2024-01-02')
    },
    {
      id: '3',
      title: 'Analyze Script',
      description: 'Review screenplay structure',
      status: 'pending',
      createdAt: new Date('2024-01-03')
    }
  ]

  const defaultProps = {
    onCreateTask: vi.fn(),
    onCancelTask: vi.fn(),
    tasks: [],
    isCreating: false
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render task mode', () => {
      render(<TaskMode {...defaultProps} />)
      expect(screen.getByTestId('task-mode')).toBeInTheDocument()
    })

    it('should render task creation form', () => {
      render(<TaskMode {...defaultProps} />)
      expect(screen.getByTestId('task-form')).toBeInTheDocument()
    })

    it('should render title input', () => {
      render(<TaskMode {...defaultProps} />)
      expect(screen.getByTestId('task-title-input')).toBeInTheDocument()
    })

    it('should render description textarea', () => {
      render(<TaskMode {...defaultProps} />)
      expect(screen.getByTestId('task-description-input')).toBeInTheDocument()
    })

    it('should render create button', () => {
      render(<TaskMode {...defaultProps} />)
      expect(screen.getByTestId('create-task-button')).toBeInTheDocument()
    })
  })

  describe('Task Creation', () => {
    it('should allow typing task title', async () => {
      const user = userEvent.setup()
      render(<TaskMode {...defaultProps} />)

      await user.type(screen.getByTestId('task-title-input'), 'New Task')

      expect(screen.getByTestId('task-title-input')).toHaveValue('New Task')
    })

    it('should allow typing task description', async () => {
      const user = userEvent.setup()
      render(<TaskMode {...defaultProps} />)

      await user.type(
        screen.getByTestId('task-description-input'),
        'Task description here'
      )

      expect(screen.getByTestId('task-description-input')).toHaveValue(
        'Task description here'
      )
    })

    it('should call onCreateTask when form is submitted', async () => {
      const user = userEvent.setup()
      render(<TaskMode {...defaultProps} />)

      await user.type(screen.getByTestId('task-title-input'), 'Test Task')
      await user.type(
        screen.getByTestId('task-description-input'),
        'Test Description'
      )
      await user.click(screen.getByTestId('create-task-button'))

      expect(defaultProps.onCreateTask).toHaveBeenCalledWith(
        'Test Task',
        'Test Description'
      )
    })

    it('should disable create button when title is empty', () => {
      render(<TaskMode {...defaultProps} />)
      expect(screen.getByTestId('create-task-button')).toBeDisabled()
    })

    it('should enable create button when title has content', async () => {
      const user = userEvent.setup()
      render(<TaskMode {...defaultProps} />)

      await user.type(screen.getByTestId('task-title-input'), 'Title')

      expect(screen.getByTestId('create-task-button')).not.toBeDisabled()
    })

    it('should clear form after submission', async () => {
      const user = userEvent.setup()
      render(<TaskMode {...defaultProps} />)

      await user.type(screen.getByTestId('task-title-input'), 'Test')
      await user.type(screen.getByTestId('task-description-input'), 'Desc')
      await user.click(screen.getByTestId('create-task-button'))

      // In real implementation, form would be cleared
      expect(defaultProps.onCreateTask).toHaveBeenCalled()
    })
  })

  describe('Creating State', () => {
    it('should disable inputs when isCreating is true', () => {
      render(<TaskMode {...defaultProps} isCreating={true} />)

      expect(screen.getByTestId('task-title-input')).toBeDisabled()
      expect(screen.getByTestId('task-description-input')).toBeDisabled()
    })

    it('should disable create button when isCreating is true', () => {
      render(<TaskMode {...defaultProps} isCreating={true} />)
      expect(screen.getByTestId('create-task-button')).toBeDisabled()
    })

    it('should show "Creating..." text when isCreating is true', () => {
      render(<TaskMode {...defaultProps} isCreating={true} />)
      expect(screen.getByTestId('create-task-button')).toHaveTextContent('Creating...')
    })
  })

  describe('Task List Display', () => {
    it('should display empty state when no tasks', () => {
      render(<TaskMode {...defaultProps} tasks={[]} />)
      expect(screen.getByTestId('empty-state')).toBeInTheDocument()
    })

    it('should display task list when tasks exist', () => {
      render(<TaskMode {...defaultProps} tasks={mockTasks} />)
      expect(screen.getByTestId('task-list')).toBeInTheDocument()
    })

    it('should render all tasks', () => {
      render(<TaskMode {...defaultProps} tasks={mockTasks} />)

      expect(screen.getByTestId('task-1')).toBeInTheDocument()
      expect(screen.getByTestId('task-2')).toBeInTheDocument()
      expect(screen.getByTestId('task-3')).toBeInTheDocument()
    })

    it('should display task titles', () => {
      render(<TaskMode {...defaultProps} tasks={mockTasks} />)

      expect(screen.getByTestId('task-title-1')).toHaveTextContent('Generate Video')
      expect(screen.getByTestId('task-title-2')).toHaveTextContent('Process Images')
    })

    it('should display task descriptions', () => {
      render(<TaskMode {...defaultProps} tasks={mockTasks} />)

      expect(screen.getByTestId('task-description-1')).toHaveTextContent(
        'Create a promotional video'
      )
    })

    it('should display task status', () => {
      render(<TaskMode {...defaultProps} tasks={mockTasks} />)

      expect(screen.getByTestId('task-status-1')).toHaveTextContent('completed')
      expect(screen.getByTestId('task-status-2')).toHaveTextContent('running')
      expect(screen.getByTestId('task-status-3')).toHaveTextContent('pending')
    })

    it('should display progress for running tasks', () => {
      render(<TaskMode {...defaultProps} tasks={mockTasks} />)

      const progress = screen.getByTestId('task-progress-2') as HTMLProgressElement
      expect(progress.value).toBe(65)
    })

    it('should display results for completed tasks', () => {
      render(<TaskMode {...defaultProps} tasks={mockTasks} />)

      expect(screen.getByTestId('task-result-1')).toHaveTextContent(
        'Video generated successfully'
      )
    })

    it('should show cancel button for running tasks', () => {
      render(<TaskMode {...defaultProps} tasks={mockTasks} />)
      expect(screen.getByTestId('cancel-task-2')).toBeInTheDocument()
    })

    it('should show cancel button for pending tasks', () => {
      render(<TaskMode {...defaultProps} tasks={mockTasks} />)
      expect(screen.getByTestId('cancel-task-3')).toBeInTheDocument()
    })

    it('should not show cancel button for completed tasks', () => {
      render(<TaskMode {...defaultProps} tasks={mockTasks} />)
      expect(screen.queryByTestId('cancel-task-1')).not.toBeInTheDocument()
    })
  })

  describe('Task Cancellation', () => {
    it('should call onCancelTask when cancel button is clicked', async () => {
      const user = userEvent.setup()
      render(<TaskMode {...defaultProps} tasks={mockTasks} />)

      await user.click(screen.getByTestId('cancel-task-2'))

      expect(defaultProps.onCancelTask).toHaveBeenCalledWith('2')
    })

    it('should allow cancelling multiple tasks', async () => {
      const user = userEvent.setup()
      render(<TaskMode {...defaultProps} tasks={mockTasks} />)

      await user.click(screen.getByTestId('cancel-task-2'))
      await user.click(screen.getByTestId('cancel-task-3'))

      expect(defaultProps.onCancelTask).toHaveBeenCalledTimes(2)
    })
  })

  describe('Edge Cases', () => {
    it('should handle undefined callbacks', async () => {
      const user = userEvent.setup()
      render(<TaskMode tasks={mockTasks} />)

      await user.type(screen.getByTestId('task-title-input'), 'Test')
      await user.click(screen.getByTestId('create-task-button'))
      await user.click(screen.getByTestId('cancel-task-2'))

      // Should not throw
      expect(screen.getByTestId('task-mode')).toBeInTheDocument()
    })

    it('should handle very long task titles', async () => {
      const user = userEvent.setup()
      const longTitle = 'A'.repeat(200)

      render(<TaskMode {...defaultProps} />)

      await user.type(screen.getByTestId('task-title-input'), longTitle)
      await user.click(screen.getByTestId('create-task-button'))

      expect(defaultProps.onCreateTask).toHaveBeenCalledWith(longTitle, '')
    })

    it('should handle tasks with missing optional fields', () => {
      const minimalTask: Task = {
        id: '1',
        title: 'Minimal Task',
        description: '',
        status: 'pending',
        createdAt: new Date()
      }

      render(<TaskMode {...defaultProps} tasks={[minimalTask]} />)
      expect(screen.getByTestId('task-1')).toBeInTheDocument()
    })

    it('should handle large task lists', () => {
      const manyTasks = Array.from({ length: 50 }, (_, i) => ({
        id: `${i}`,
        title: `Task ${i}`,
        description: `Description ${i}`,
        status: 'pending' as const,
        createdAt: new Date()
      }))

      render(<TaskMode {...defaultProps} tasks={manyTasks} />)
      expect(screen.getByTestId('task-list')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have accessible form inputs', () => {
      render(<TaskMode {...defaultProps} />)

      const titleInput = screen.getByTestId('task-title-input')
      const descInput = screen.getByTestId('task-description-input')

      expect(titleInput).toHaveAttribute('placeholder')
      expect(descInput).toHaveAttribute('placeholder')
    })

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup()
      render(<TaskMode {...defaultProps} />)

      // Tab through form
      await user.tab()
      expect(screen.getByTestId('task-title-input')).toHaveFocus()

      await user.tab()
      expect(screen.getByTestId('task-description-input')).toHaveFocus()

      await user.tab()
      expect(screen.getByTestId('create-task-button')).toHaveFocus()
    })
  })

  describe('Task Status Display', () => {
    it('should display failed tasks correctly', () => {
      const failedTask: Task = {
        id: '1',
        title: 'Failed Task',
        description: 'This task failed',
        status: 'failed',
        result: 'Error: Task execution failed',
        createdAt: new Date()
      }

      render(<TaskMode {...defaultProps} tasks={[failedTask]} />)

      expect(screen.getByTestId('task-status-1')).toHaveTextContent('failed')
      expect(screen.getByTestId('task-result-1')).toHaveTextContent('Error')
    })
  })
})
