/**
 * Unit Tests: TopMenuBar Component
 * Tests for top navigation menu bar
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Mock component - replace with actual import once component exists
const TopMenuBar = ({
  onMenuToggle,
  onOrchestratorToggle,
  projectName,
  userName,
  showOrchestrator = false
}: {
  onMenuToggle?: () => void
  onOrchestratorToggle?: () => void
  projectName?: string
  userName?: string
  showOrchestrator?: boolean
}) => (
  <header className="top-menu-bar" data-testid="top-menu-bar">
    <button onClick={onMenuToggle} data-testid="menu-toggle">
      Menu
    </button>
    <h1 data-testid="project-name">{projectName || 'Project'}</h1>
    <button onClick={onOrchestratorToggle} data-testid="orchestrator-toggle">
      {showOrchestrator ? 'Hide' : 'Show'} Orchestrator
    </button>
    <div data-testid="user-menu">{userName || 'User'}</div>
  </header>
)

describe('TopMenuBar', () => {
  const defaultProps = {
    onMenuToggle: vi.fn(),
    onOrchestratorToggle: vi.fn(),
    projectName: 'Test Project',
    userName: 'Test User',
    showOrchestrator: false
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render the top menu bar', () => {
      render(<TopMenuBar {...defaultProps} />)
      expect(screen.getByTestId('top-menu-bar')).toBeInTheDocument()
    })

    it('should display project name', () => {
      render(<TopMenuBar {...defaultProps} />)
      expect(screen.getByTestId('project-name')).toHaveTextContent('Test Project')
    })

    it('should display user name', () => {
      render(<TopMenuBar {...defaultProps} />)
      expect(screen.getByTestId('user-menu')).toHaveTextContent('Test User')
    })

    it('should render menu toggle button', () => {
      render(<TopMenuBar {...defaultProps} />)
      expect(screen.getByTestId('menu-toggle')).toBeInTheDocument()
    })

    it('should render orchestrator toggle button', () => {
      render(<TopMenuBar {...defaultProps} />)
      expect(screen.getByTestId('orchestrator-toggle')).toBeInTheDocument()
    })
  })

  describe('Interactions', () => {
    it('should call onMenuToggle when menu button is clicked', async () => {
      const user = userEvent.setup()
      render(<TopMenuBar {...defaultProps} />)

      await user.click(screen.getByTestId('menu-toggle'))

      expect(defaultProps.onMenuToggle).toHaveBeenCalledTimes(1)
    })

    it('should call onOrchestratorToggle when orchestrator button is clicked', async () => {
      const user = userEvent.setup()
      render(<TopMenuBar {...defaultProps} />)

      await user.click(screen.getByTestId('orchestrator-toggle'))

      expect(defaultProps.onOrchestratorToggle).toHaveBeenCalledTimes(1)
    })

    it('should toggle orchestrator button text', () => {
      const { rerender } = render(<TopMenuBar {...defaultProps} showOrchestrator={false} />)
      expect(screen.getByTestId('orchestrator-toggle')).toHaveTextContent('Show Orchestrator')

      rerender(<TopMenuBar {...defaultProps} showOrchestrator={true} />)
      expect(screen.getByTestId('orchestrator-toggle')).toHaveTextContent('Hide Orchestrator')
    })
  })

  describe('Keyboard Accessibility', () => {
    it('should allow keyboard navigation to menu toggle', async () => {
      const user = userEvent.setup()
      render(<TopMenuBar {...defaultProps} />)

      const menuButton = screen.getByTestId('menu-toggle')
      menuButton.focus()

      expect(menuButton).toHaveFocus()

      await user.keyboard('{Enter}')
      expect(defaultProps.onMenuToggle).toHaveBeenCalled()
    })

    it('should allow keyboard navigation to orchestrator toggle', async () => {
      const user = userEvent.setup()
      render(<TopMenuBar {...defaultProps} />)

      const orchestratorButton = screen.getByTestId('orchestrator-toggle')
      orchestratorButton.focus()

      expect(orchestratorButton).toHaveFocus()

      await user.keyboard('{Enter}')
      expect(defaultProps.onOrchestratorToggle).toHaveBeenCalled()
    })
  })

  describe('Edge Cases', () => {
    it('should render with default values when props are missing', () => {
      render(<TopMenuBar />)
      expect(screen.getByTestId('project-name')).toHaveTextContent('Project')
      expect(screen.getByTestId('user-menu')).toHaveTextContent('User')
    })

    it('should handle long project names', () => {
      const longName = 'A'.repeat(100)
      render(<TopMenuBar {...defaultProps} projectName={longName} />)
      expect(screen.getByTestId('project-name')).toHaveTextContent(longName)
    })

    it('should not crash when callbacks are undefined', async () => {
      const user = userEvent.setup()
      render(<TopMenuBar projectName="Test" userName="Test" />)

      await user.click(screen.getByTestId('menu-toggle'))
      await user.click(screen.getByTestId('orchestrator-toggle'))

      // Should not throw
      expect(screen.getByTestId('top-menu-bar')).toBeInTheDocument()
    })
  })

  describe('Responsive Behavior', () => {
    it('should be visible on mobile viewports', () => {
      global.innerWidth = 375
      render(<TopMenuBar {...defaultProps} />)
      expect(screen.getByTestId('top-menu-bar')).toBeVisible()
    })

    it('should be visible on desktop viewports', () => {
      global.innerWidth = 1920
      render(<TopMenuBar {...defaultProps} />)
      expect(screen.getByTestId('top-menu-bar')).toBeVisible()
    })
  })
})
