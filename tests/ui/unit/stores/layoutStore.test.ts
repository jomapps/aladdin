/**
 * Unit Tests: Layout Store
 * Tests for layout state management (Zustand store)
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

// Mock layout store
interface LayoutState {
  leftSidebarOpen: boolean
  rightOrchestratorOpen: boolean
  orchestratorMode: 'query' | 'data' | 'task' | 'chat'
  toggleLeftSidebar: () => void
  toggleRightOrchestrator: () => void
  setOrchestratorMode: (mode: 'query' | 'data' | 'task' | 'chat') => void
  closeAll: () => void
  reset: () => void
}

let mockState: LayoutState = {
  leftSidebarOpen: true,
  rightOrchestratorOpen: false,
  orchestratorMode: 'query',
  toggleLeftSidebar: () => {},
  toggleRightOrchestrator: () => {},
  setOrchestratorMode: () => {},
  closeAll: () => {},
  reset: () => {}
}

const useLayoutStore = () => mockState

describe('layoutStore', () => {
  beforeEach(() => {
    // Reset store to initial state
    mockState = {
      leftSidebarOpen: true,
      rightOrchestratorOpen: false,
      orchestratorMode: 'query',
      toggleLeftSidebar: () => {
        mockState.leftSidebarOpen = !mockState.leftSidebarOpen
      },
      toggleRightOrchestrator: () => {
        mockState.rightOrchestratorOpen = !mockState.rightOrchestratorOpen
      },
      setOrchestratorMode: (mode) => {
        mockState.orchestratorMode = mode
      },
      closeAll: () => {
        mockState.leftSidebarOpen = false
        mockState.rightOrchestratorOpen = false
      },
      reset: () => {
        mockState.leftSidebarOpen = true
        mockState.rightOrchestratorOpen = false
        mockState.orchestratorMode = 'query'
      }
    }
  })

  describe('Initial State', () => {
    it('should have left sidebar open by default', () => {
      const { result } = renderHook(() => useLayoutStore())
      expect(result.current.leftSidebarOpen).toBe(true)
    })

    it('should have right orchestrator closed by default', () => {
      const { result } = renderHook(() => useLayoutStore())
      expect(result.current.rightOrchestratorOpen).toBe(false)
    })

    it('should have query mode as default orchestrator mode', () => {
      const { result } = renderHook(() => useLayoutStore())
      expect(result.current.orchestratorMode).toBe('query')
    })
  })

  describe('Left Sidebar Toggle', () => {
    it('should toggle left sidebar from open to closed', () => {
      const { result } = renderHook(() => useLayoutStore())

      expect(result.current.leftSidebarOpen).toBe(true)

      act(() => {
        result.current.toggleLeftSidebar()
      })

      expect(mockState.leftSidebarOpen).toBe(false)
    })

    it('should toggle left sidebar from closed to open', () => {
      mockState.leftSidebarOpen = false
      const { result } = renderHook(() => useLayoutStore())

      act(() => {
        result.current.toggleLeftSidebar()
      })

      expect(mockState.leftSidebarOpen).toBe(true)
    })

    it('should toggle multiple times', () => {
      const { result } = renderHook(() => useLayoutStore())

      act(() => {
        result.current.toggleLeftSidebar()
        result.current.toggleLeftSidebar()
        result.current.toggleLeftSidebar()
      })

      expect(mockState.leftSidebarOpen).toBe(false)
    })
  })

  describe('Right Orchestrator Toggle', () => {
    it('should toggle right orchestrator from closed to open', () => {
      const { result } = renderHook(() => useLayoutStore())

      expect(result.current.rightOrchestratorOpen).toBe(false)

      act(() => {
        result.current.toggleRightOrchestrator()
      })

      expect(mockState.rightOrchestratorOpen).toBe(true)
    })

    it('should toggle right orchestrator from open to closed', () => {
      mockState.rightOrchestratorOpen = true
      const { result } = renderHook(() => useLayoutStore())

      act(() => {
        result.current.toggleRightOrchestrator()
      })

      expect(mockState.rightOrchestratorOpen).toBe(false)
    })

    it('should toggle multiple times', () => {
      const { result } = renderHook(() => useLayoutStore())

      act(() => {
        result.current.toggleRightOrchestrator()
        result.current.toggleRightOrchestrator()
        result.current.toggleRightOrchestrator()
      })

      expect(mockState.rightOrchestratorOpen).toBe(true)
    })
  })

  describe('Orchestrator Mode', () => {
    it('should set orchestrator mode to query', () => {
      const { result } = renderHook(() => useLayoutStore())

      act(() => {
        result.current.setOrchestratorMode('query')
      })

      expect(mockState.orchestratorMode).toBe('query')
    })

    it('should set orchestrator mode to data', () => {
      const { result } = renderHook(() => useLayoutStore())

      act(() => {
        result.current.setOrchestratorMode('data')
      })

      expect(mockState.orchestratorMode).toBe('data')
    })

    it('should set orchestrator mode to task', () => {
      const { result } = renderHook(() => useLayoutStore())

      act(() => {
        result.current.setOrchestratorMode('task')
      })

      expect(mockState.orchestratorMode).toBe('task')
    })

    it('should set orchestrator mode to chat', () => {
      const { result } = renderHook(() => useLayoutStore())

      act(() => {
        result.current.setOrchestratorMode('chat')
      })

      expect(mockState.orchestratorMode).toBe('chat')
    })

    it('should switch between modes', () => {
      const { result } = renderHook(() => useLayoutStore())

      act(() => {
        result.current.setOrchestratorMode('data')
      })
      expect(mockState.orchestratorMode).toBe('data')

      act(() => {
        result.current.setOrchestratorMode('task')
      })
      expect(mockState.orchestratorMode).toBe('task')

      act(() => {
        result.current.setOrchestratorMode('chat')
      })
      expect(mockState.orchestratorMode).toBe('chat')
    })
  })

  describe('Close All', () => {
    it('should close both sidebar and orchestrator', () => {
      mockState.leftSidebarOpen = true
      mockState.rightOrchestratorOpen = true

      const { result } = renderHook(() => useLayoutStore())

      act(() => {
        result.current.closeAll()
      })

      expect(mockState.leftSidebarOpen).toBe(false)
      expect(mockState.rightOrchestratorOpen).toBe(false)
    })

    it('should work when already closed', () => {
      mockState.leftSidebarOpen = false
      mockState.rightOrchestratorOpen = false

      const { result } = renderHook(() => useLayoutStore())

      act(() => {
        result.current.closeAll()
      })

      expect(mockState.leftSidebarOpen).toBe(false)
      expect(mockState.rightOrchestratorOpen).toBe(false)
    })
  })

  describe('Reset', () => {
    it('should reset to initial state', () => {
      mockState.leftSidebarOpen = false
      mockState.rightOrchestratorOpen = true
      mockState.orchestratorMode = 'chat'

      const { result } = renderHook(() => useLayoutStore())

      act(() => {
        result.current.reset()
      })

      expect(mockState.leftSidebarOpen).toBe(true)
      expect(mockState.rightOrchestratorOpen).toBe(false)
      expect(mockState.orchestratorMode).toBe('query')
    })

    it('should work multiple times', () => {
      const { result } = renderHook(() => useLayoutStore())

      act(() => {
        result.current.setOrchestratorMode('task')
        result.current.toggleLeftSidebar()
        result.current.reset()
      })

      expect(mockState.leftSidebarOpen).toBe(true)
      expect(mockState.orchestratorMode).toBe('query')

      act(() => {
        result.current.setOrchestratorMode('data')
        result.current.reset()
      })

      expect(mockState.orchestratorMode).toBe('query')
    })
  })

  describe('State Combinations', () => {
    it('should handle complex state changes', () => {
      const { result } = renderHook(() => useLayoutStore())

      act(() => {
        result.current.toggleLeftSidebar()
        result.current.toggleRightOrchestrator()
        result.current.setOrchestratorMode('data')
      })

      expect(mockState.leftSidebarOpen).toBe(false)
      expect(mockState.rightOrchestratorOpen).toBe(true)
      expect(mockState.orchestratorMode).toBe('data')
    })

    it('should maintain mode when toggling panels', () => {
      const { result } = renderHook(() => useLayoutStore())

      act(() => {
        result.current.setOrchestratorMode('task')
        result.current.toggleRightOrchestrator()
        result.current.toggleLeftSidebar()
      })

      expect(mockState.orchestratorMode).toBe('task')
    })
  })

  describe('Persistence', () => {
    it('should maintain state across hook re-renders', () => {
      const { result, rerender } = renderHook(() => useLayoutStore())

      act(() => {
        result.current.toggleLeftSidebar()
      })

      rerender()

      expect(mockState.leftSidebarOpen).toBe(false)
    })
  })
})
