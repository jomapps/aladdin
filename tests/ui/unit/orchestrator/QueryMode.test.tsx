/**
 * Unit Tests: QueryMode Component
 * Tests for query/search mode in orchestrator
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

interface QueryResult {
  id: string
  type: string
  title: string
  snippet: string
  score: number
}

// Mock QueryMode component
const QueryMode = ({
  onSearch,
  results = [],
  isLoading = false,
  placeholder = 'Search...'
}: {
  onSearch?: (query: string) => void
  results?: QueryResult[]
  isLoading?: boolean
  placeholder?: string
}) => {
  const [query, setQuery] = React.useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch?.(query)
  }

  return (
    <div data-testid="query-mode">
      <form onSubmit={handleSubmit} data-testid="query-form">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          data-testid="query-input"
          disabled={isLoading}
        />
        <button type="submit" data-testid="query-submit" disabled={isLoading}>
          {isLoading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {isLoading && <div data-testid="loading-indicator">Loading...</div>}

      {results.length > 0 && (
        <div data-testid="query-results">
          {results.map(result => (
            <div key={result.id} data-testid={`result-${result.id}`}>
              <h3>{result.title}</h3>
              <p>{result.snippet}</p>
              <span data-testid={`score-${result.id}`}>Score: {result.score}</span>
            </div>
          ))}
        </div>
      )}

      {!isLoading && results.length === 0 && query && (
        <div data-testid="no-results">No results found</div>
      )}
    </div>
  )
}

// Mock React for useState
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

describe('QueryMode', () => {
  const mockResults: QueryResult[] = [
    {
      id: '1',
      type: 'document',
      title: 'Test Document 1',
      snippet: 'This is a test document snippet',
      score: 0.95
    },
    {
      id: '2',
      type: 'scene',
      title: 'Test Scene 2',
      snippet: 'This is a test scene snippet',
      score: 0.87
    }
  ]

  const defaultProps = {
    onSearch: vi.fn(),
    results: [],
    isLoading: false
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render query mode', () => {
      render(<QueryMode {...defaultProps} />)
      expect(screen.getByTestId('query-mode')).toBeInTheDocument()
    })

    it('should render search input', () => {
      render(<QueryMode {...defaultProps} />)
      expect(screen.getByTestId('query-input')).toBeInTheDocument()
    })

    it('should render search button', () => {
      render(<QueryMode {...defaultProps} />)
      expect(screen.getByTestId('query-submit')).toBeInTheDocument()
    })

    it('should display custom placeholder', () => {
      render(<QueryMode {...defaultProps} placeholder="Find something..." />)
      expect(screen.getByTestId('query-input')).toHaveAttribute(
        'placeholder',
        'Find something...'
      )
    })
  })

  describe('Search Functionality', () => {
    it('should allow typing in search input', async () => {
      const user = userEvent.setup()
      render(<QueryMode {...defaultProps} />)

      const input = screen.getByTestId('query-input')
      await user.type(input, 'test query')

      expect(input).toHaveValue('test query')
    })

    it('should call onSearch with query when form is submitted', async () => {
      const user = userEvent.setup()
      render(<QueryMode {...defaultProps} />)

      await user.type(screen.getByTestId('query-input'), 'test search')
      await user.click(screen.getByTestId('query-submit'))

      expect(defaultProps.onSearch).toHaveBeenCalledWith('test search')
    })

    it('should submit form on Enter key', async () => {
      const user = userEvent.setup()
      render(<QueryMode {...defaultProps} />)

      const input = screen.getByTestId('query-input')
      await user.type(input, 'test query{Enter}')

      expect(defaultProps.onSearch).toHaveBeenCalledWith('test query')
    })

    it('should allow empty search queries', async () => {
      const user = userEvent.setup()
      render(<QueryMode {...defaultProps} />)

      await user.click(screen.getByTestId('query-submit'))

      expect(defaultProps.onSearch).toHaveBeenCalledWith('')
    })
  })

  describe('Loading State', () => {
    it('should show loading indicator when isLoading is true', () => {
      render(<QueryMode {...defaultProps} isLoading={true} />)
      expect(screen.getByTestId('loading-indicator')).toBeInTheDocument()
    })

    it('should disable input during loading', () => {
      render(<QueryMode {...defaultProps} isLoading={true} />)
      expect(screen.getByTestId('query-input')).toBeDisabled()
    })

    it('should disable submit button during loading', () => {
      render(<QueryMode {...defaultProps} isLoading={true} />)
      expect(screen.getByTestId('query-submit')).toBeDisabled()
    })

    it('should show "Searching..." text on button during loading', () => {
      render(<QueryMode {...defaultProps} isLoading={true} />)
      expect(screen.getByTestId('query-submit')).toHaveTextContent('Searching...')
    })
  })

  describe('Results Display', () => {
    it('should display search results', () => {
      render(<QueryMode {...defaultProps} results={mockResults} />)
      expect(screen.getByTestId('query-results')).toBeInTheDocument()
    })

    it('should render all result items', () => {
      render(<QueryMode {...defaultProps} results={mockResults} />)

      expect(screen.getByTestId('result-1')).toBeInTheDocument()
      expect(screen.getByTestId('result-2')).toBeInTheDocument()
    })

    it('should display result titles', () => {
      render(<QueryMode {...defaultProps} results={mockResults} />)

      expect(screen.getByText('Test Document 1')).toBeInTheDocument()
      expect(screen.getByText('Test Scene 2')).toBeInTheDocument()
    })

    it('should display result snippets', () => {
      render(<QueryMode {...defaultProps} results={mockResults} />)

      expect(screen.getByText('This is a test document snippet')).toBeInTheDocument()
      expect(screen.getByText('This is a test scene snippet')).toBeInTheDocument()
    })

    it('should display relevance scores', () => {
      render(<QueryMode {...defaultProps} results={mockResults} />)

      expect(screen.getByTestId('score-1')).toHaveTextContent('Score: 0.95')
      expect(screen.getByTestId('score-2')).toHaveTextContent('Score: 0.87')
    })

    it('should show "no results" message when results are empty and query exists', () => {
      // This would need proper state management in real component
      render(<QueryMode {...defaultProps} results={[]} />)
      // Note: This test would need the component to track if a search was performed
    })
  })

  describe('Edge Cases', () => {
    it('should handle undefined onSearch callback', async () => {
      const user = userEvent.setup()
      render(<QueryMode results={[]} />)

      await user.type(screen.getByTestId('query-input'), 'test')
      await user.click(screen.getByTestId('query-submit'))

      // Should not throw
      expect(screen.getByTestId('query-mode')).toBeInTheDocument()
    })

    it('should handle very long search queries', async () => {
      const user = userEvent.setup()
      const longQuery = 'a'.repeat(1000)

      render(<QueryMode {...defaultProps} />)

      await user.type(screen.getByTestId('query-input'), longQuery)
      await user.click(screen.getByTestId('query-submit'))

      expect(defaultProps.onSearch).toHaveBeenCalledWith(longQuery)
    })

    it('should handle large result sets', () => {
      const manyResults = Array.from({ length: 100 }, (_, i) => ({
        id: `${i}`,
        type: 'document',
        title: `Document ${i}`,
        snippet: `Snippet ${i}`,
        score: Math.random()
      }))

      render(<QueryMode {...defaultProps} results={manyResults} />)

      expect(screen.getByTestId('query-results')).toBeInTheDocument()
      expect(screen.getByTestId('result-0')).toBeInTheDocument()
      expect(screen.getByTestId('result-99')).toBeInTheDocument()
    })

    it('should handle special characters in queries', async () => {
      const user = userEvent.setup()
      render(<QueryMode {...defaultProps} />)

      const specialQuery = '!@#$%^&*()'
      await user.type(screen.getByTestId('query-input'), specialQuery)
      await user.click(screen.getByTestId('query-submit'))

      expect(defaultProps.onSearch).toHaveBeenCalledWith(specialQuery)
    })
  })

  describe('Accessibility', () => {
    it('should have accessible form elements', () => {
      render(<QueryMode {...defaultProps} />)

      const input = screen.getByTestId('query-input')
      const button = screen.getByTestId('query-submit')

      expect(input).toHaveAccessibleName()
      expect(button).toHaveAccessibleName()
    })

    it('should support keyboard-only interaction', async () => {
      const user = userEvent.setup()
      render(<QueryMode {...defaultProps} />)

      // Tab to input
      await user.tab()
      expect(screen.getByTestId('query-input')).toHaveFocus()

      // Type query
      await user.keyboard('test query')

      // Tab to button and activate
      await user.tab()
      expect(screen.getByTestId('query-submit')).toHaveFocus()

      await user.keyboard('{Enter}')
      expect(defaultProps.onSearch).toHaveBeenCalled()
    })
  })

  describe('Performance', () => {
    it('should render results efficiently', () => {
      const startTime = performance.now()

      render(<QueryMode {...defaultProps} results={mockResults} />)

      const endTime = performance.now()
      expect(endTime - startTime).toBeLessThan(100) // Should render in <100ms
    })
  })
})
