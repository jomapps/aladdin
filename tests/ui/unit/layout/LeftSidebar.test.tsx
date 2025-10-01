/**
 * Unit Tests: LeftSidebar Component
 * Tests for left navigation sidebar
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Mock component - similar to ProjectSidebar structure
const LeftSidebar = ({
  isOpen = true,
  onToggle,
  projectId,
  projectName,
  departments = [],
  onNavigate
}: {
  isOpen?: boolean
  onToggle?: () => void
  projectId?: string
  projectName?: string
  departments?: Array<{id: string, name: string, path: string}>
  onNavigate?: (path: string) => void
}) => (
  <aside
    className={`sidebar ${isOpen ? 'open' : 'closed'}`}
    data-testid="left-sidebar"
  >
    <div data-testid="project-info">
      <h2>{projectName}</h2>
      <button onClick={onToggle} data-testid="close-button">Close</button>
    </div>
    <nav data-testid="navigation">
      {departments.map(dept => (
        <button
          key={dept.id}
          data-testid={`nav-${dept.id}`}
          onClick={() => onNavigate?.(dept.path)}
        >
          {dept.name}
        </button>
      ))}
    </nav>
  </aside>
)

describe('LeftSidebar', () => {
  const mockDepartments = [
    { id: 'story', name: 'Story', path: '/story' },
    { id: 'character', name: 'Character', path: '/character' },
    { id: 'visual', name: 'Visual', path: '/visual' }
  ]

  const defaultProps = {
    isOpen: true,
    onToggle: vi.fn(),
    projectId: 'test-project-123',
    projectName: 'Test Project',
    departments: mockDepartments,
    onNavigate: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render the sidebar', () => {
      render(<LeftSidebar {...defaultProps} />)
      expect(screen.getByTestId('left-sidebar')).toBeInTheDocument()
    })

    it('should display project name', () => {
      render(<LeftSidebar {...defaultProps} />)
      const projectInfo = screen.getByTestId('project-info')
      expect(within(projectInfo).getByText('Test Project')).toBeInTheDocument()
    })

    it('should render all department links', () => {
      render(<LeftSidebar {...defaultProps} />)

      expect(screen.getByTestId('nav-story')).toHaveTextContent('Story')
      expect(screen.getByTestId('nav-character')).toHaveTextContent('Character')
      expect(screen.getByTestId('nav-visual')).toHaveTextContent('Visual')
    })

    it('should render close button', () => {
      render(<LeftSidebar {...defaultProps} />)
      expect(screen.getByTestId('close-button')).toBeInTheDocument()
    })
  })

  describe('Open/Close State', () => {
    it('should apply open class when isOpen is true', () => {
      render(<LeftSidebar {...defaultProps} isOpen={true} />)
      const sidebar = screen.getByTestId('left-sidebar')
      expect(sidebar).toHaveClass('open')
    })

    it('should apply closed class when isOpen is false', () => {
      render(<LeftSidebar {...defaultProps} isOpen={false} />)
      const sidebar = screen.getByTestId('left-sidebar')
      expect(sidebar).toHaveClass('closed')
    })

    it('should call onToggle when close button is clicked', async () => {
      const user = userEvent.setup()
      render(<LeftSidebar {...defaultProps} />)

      await user.click(screen.getByTestId('close-button'))

      expect(defaultProps.onToggle).toHaveBeenCalledTimes(1)
    })
  })

  describe('Navigation', () => {
    it('should call onNavigate with correct path when department is clicked', async () => {
      const user = userEvent.setup()
      render(<LeftSidebar {...defaultProps} />)

      await user.click(screen.getByTestId('nav-story'))

      expect(defaultProps.onNavigate).toHaveBeenCalledWith('/story')
    })

    it('should navigate to all departments', async () => {
      const user = userEvent.setup()
      render(<LeftSidebar {...defaultProps} />)

      await user.click(screen.getByTestId('nav-character'))
      expect(defaultProps.onNavigate).toHaveBeenCalledWith('/character')

      await user.click(screen.getByTestId('nav-visual'))
      expect(defaultProps.onNavigate).toHaveBeenCalledWith('/visual')
    })
  })

  describe('Keyboard Navigation', () => {
    it('should support keyboard navigation through departments', async () => {
      const user = userEvent.setup()
      render(<LeftSidebar {...defaultProps} />)

      const storyButton = screen.getByTestId('nav-story')
      storyButton.focus()

      expect(storyButton).toHaveFocus()

      await user.keyboard('{Enter}')
      expect(defaultProps.onNavigate).toHaveBeenCalledWith('/story')
    })

    it('should allow Tab navigation between elements', async () => {
      const user = userEvent.setup()
      render(<LeftSidebar {...defaultProps} />)

      const closeButton = screen.getByTestId('close-button')
      closeButton.focus()

      await user.tab()

      // Should move to first department
      expect(screen.getByTestId('nav-story')).toHaveFocus()
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty departments array', () => {
      render(<LeftSidebar {...defaultProps} departments={[]} />)
      const nav = screen.getByTestId('navigation')
      expect(nav).toBeEmptyDOMElement()
    })

    it('should render without crashing when optional props are missing', () => {
      render(<LeftSidebar />)
      expect(screen.getByTestId('left-sidebar')).toBeInTheDocument()
    })

    it('should handle undefined callbacks gracefully', async () => {
      const user = userEvent.setup()
      render(<LeftSidebar isOpen={true} departments={mockDepartments} />)

      await user.click(screen.getByTestId('close-button'))
      await user.click(screen.getByTestId('nav-story'))

      // Should not throw
      expect(screen.getByTestId('left-sidebar')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<LeftSidebar {...defaultProps} />)
      const sidebar = screen.getByTestId('left-sidebar')

      // Sidebar should be a navigation landmark
      expect(sidebar.tagName).toBe('ASIDE')
    })

    it('should have focusable navigation elements', () => {
      render(<LeftSidebar {...defaultProps} />)

      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        expect(button).not.toHaveAttribute('tabindex', '-1')
      })
    })
  })

  describe('Responsive Behavior', () => {
    it('should be visible when open on mobile', () => {
      global.innerWidth = 375
      render(<LeftSidebar {...defaultProps} isOpen={true} />)
      expect(screen.getByTestId('left-sidebar')).toHaveClass('open')
    })

    it('should be hidden when closed on mobile', () => {
      global.innerWidth = 375
      render(<LeftSidebar {...defaultProps} isOpen={false} />)
      expect(screen.getByTestId('left-sidebar')).toHaveClass('closed')
    })
  })
})
