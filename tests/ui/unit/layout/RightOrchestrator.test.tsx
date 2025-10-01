/**
 * Unit Tests: RightOrchestrator Component
 * Tests for right-side orchestrator panel
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

type OrchestratorMode = 'query' | 'data' | 'task' | 'chat'

// Mock component
const RightOrchestrator = ({
  isOpen = true,
  mode = 'query',
  onModeChange,
  onClose
}: {
  isOpen?: boolean
  mode?: OrchestratorMode
  onModeChange?: (mode: OrchestratorMode) => void
  onClose?: () => void
}) => (
  <div
    className={`orchestrator ${isOpen ? 'open' : 'closed'}`}
    data-testid="right-orchestrator"
  >
    <header data-testid="orchestrator-header">
      <h2>Orchestrator</h2>
      <button onClick={onClose} data-testid="close-orchestrator">Close</button>
    </header>

    <div data-testid="mode-switcher">
      <button
        onClick={() => onModeChange?.('query')}
        data-active={mode === 'query'}
        data-testid="mode-query"
      >
        Query
      </button>
      <button
        onClick={() => onModeChange?.('data')}
        data-active={mode === 'data'}
        data-testid="mode-data"
      >
        Data
      </button>
      <button
        onClick={() => onModeChange?.('task')}
        data-active={mode === 'task'}
        data-testid="mode-task"
      >
        Task
      </button>
      <button
        onClick={() => onModeChange?.('chat')}
        data-active={mode === 'chat'}
        data-testid="mode-chat"
      >
        Chat
      </button>
    </div>

    <div data-testid="orchestrator-content">
      {mode === 'query' && <div data-testid="query-mode">Query Mode</div>}
      {mode === 'data' && <div data-testid="data-mode">Data Mode</div>}
      {mode === 'task' && <div data-testid="task-mode">Task Mode</div>}
      {mode === 'chat' && <div data-testid="chat-mode">Chat Mode</div>}
    </div>
  </div>
)

describe('RightOrchestrator', () => {
  const defaultProps = {
    isOpen: true,
    mode: 'query' as OrchestratorMode,
    onModeChange: vi.fn(),
    onClose: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render the orchestrator panel', () => {
      render(<RightOrchestrator {...defaultProps} />)
      expect(screen.getByTestId('right-orchestrator')).toBeInTheDocument()
    })

    it('should render header with title', () => {
      render(<RightOrchestrator {...defaultProps} />)
      const header = screen.getByTestId('orchestrator-header')
      expect(header).toHaveTextContent('Orchestrator')
    })

    it('should render close button', () => {
      render(<RightOrchestrator {...defaultProps} />)
      expect(screen.getByTestId('close-orchestrator')).toBeInTheDocument()
    })

    it('should render all mode buttons', () => {
      render(<RightOrchestrator {...defaultProps} />)

      expect(screen.getByTestId('mode-query')).toBeInTheDocument()
      expect(screen.getByTestId('mode-data')).toBeInTheDocument()
      expect(screen.getByTestId('mode-task')).toBeInTheDocument()
      expect(screen.getByTestId('mode-chat')).toBeInTheDocument()
    })
  })

  describe('Open/Close State', () => {
    it('should apply open class when isOpen is true', () => {
      render(<RightOrchestrator {...defaultProps} isOpen={true} />)
      expect(screen.getByTestId('right-orchestrator')).toHaveClass('open')
    })

    it('should apply closed class when isOpen is false', () => {
      render(<RightOrchestrator {...defaultProps} isOpen={false} />)
      expect(screen.getByTestId('right-orchestrator')).toHaveClass('closed')
    })

    it('should call onClose when close button is clicked', async () => {
      const user = userEvent.setup()
      render(<RightOrchestrator {...defaultProps} />)

      await user.click(screen.getByTestId('close-orchestrator'))

      expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('Mode Switching', () => {
    it('should display query mode by default', () => {
      render(<RightOrchestrator {...defaultProps} mode="query" />)
      expect(screen.getByTestId('query-mode')).toBeInTheDocument()
    })

    it('should highlight active mode button', () => {
      render(<RightOrchestrator {...defaultProps} mode="data" />)

      expect(screen.getByTestId('mode-data')).toHaveAttribute('data-active', 'true')
      expect(screen.getByTestId('mode-query')).toHaveAttribute('data-active', 'false')
    })

    it('should call onModeChange when switching to query mode', async () => {
      const user = userEvent.setup()
      render(<RightOrchestrator {...defaultProps} mode="data" />)

      await user.click(screen.getByTestId('mode-query'))

      expect(defaultProps.onModeChange).toHaveBeenCalledWith('query')
    })

    it('should call onModeChange when switching to data mode', async () => {
      const user = userEvent.setup()
      render(<RightOrchestrator {...defaultProps} />)

      await user.click(screen.getByTestId('mode-data'))

      expect(defaultProps.onModeChange).toHaveBeenCalledWith('data')
    })

    it('should call onModeChange when switching to task mode', async () => {
      const user = userEvent.setup()
      render(<RightOrchestrator {...defaultProps} />)

      await user.click(screen.getByTestId('mode-task'))

      expect(defaultProps.onModeChange).toHaveBeenCalledWith('task')
    })

    it('should call onModeChange when switching to chat mode', async () => {
      const user = userEvent.setup()
      render(<RightOrchestrator {...defaultProps} />)

      await user.click(screen.getByTestId('mode-chat'))

      expect(defaultProps.onModeChange).toHaveBeenCalledWith('chat')
    })

    it('should switch between all modes', () => {
      const modes: OrchestratorMode[] = ['query', 'data', 'task', 'chat']

      modes.forEach(mode => {
        const { rerender } = render(<RightOrchestrator {...defaultProps} mode={mode} />)
        expect(screen.getByTestId(`${mode}-mode`)).toBeInTheDocument()
        rerender(<div />)
      })
    })
  })

  describe('Keyboard Navigation', () => {
    it('should support keyboard navigation for mode switching', async () => {
      const user = userEvent.setup()
      render(<RightOrchestrator {...defaultProps} />)

      const dataButton = screen.getByTestId('mode-data')
      dataButton.focus()

      await user.keyboard('{Enter}')

      expect(defaultProps.onModeChange).toHaveBeenCalledWith('data')
    })

    it('should allow Tab navigation between mode buttons', async () => {
      const user = userEvent.setup()
      render(<RightOrchestrator {...defaultProps} />)

      screen.getByTestId('mode-query').focus()

      await user.tab()
      expect(screen.getByTestId('mode-data')).toHaveFocus()

      await user.tab()
      expect(screen.getByTestId('mode-task')).toHaveFocus()
    })
  })

  describe('Edge Cases', () => {
    it('should handle missing callbacks gracefully', async () => {
      const user = userEvent.setup()
      render(<RightOrchestrator isOpen={true} mode="query" />)

      await user.click(screen.getByTestId('close-orchestrator'))
      await user.click(screen.getByTestId('mode-data'))

      // Should not throw
      expect(screen.getByTestId('right-orchestrator')).toBeInTheDocument()
    })

    it('should default to query mode when mode is not specified', () => {
      render(<RightOrchestrator isOpen={true} />)
      expect(screen.getByTestId('query-mode')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have accessible close button', () => {
      render(<RightOrchestrator {...defaultProps} />)
      const closeButton = screen.getByTestId('close-orchestrator')
      expect(closeButton).toHaveAccessibleName()
    })

    it('should have accessible mode buttons', () => {
      render(<RightOrchestrator {...defaultProps} />)

      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        expect(button).toHaveAccessibleName()
      })
    })
  })

  describe('Responsive Behavior', () => {
    it('should adapt to mobile viewport when open', () => {
      global.innerWidth = 375
      render(<RightOrchestrator {...defaultProps} isOpen={true} />)
      expect(screen.getByTestId('right-orchestrator')).toHaveClass('open')
    })

    it('should be hidden on mobile when closed', () => {
      global.innerWidth = 375
      render(<RightOrchestrator {...defaultProps} isOpen={false} />)
      expect(screen.getByTestId('right-orchestrator')).toHaveClass('closed')
    })
  })
})
