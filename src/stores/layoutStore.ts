import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type OrchestratorMode = 'query' | 'data' | 'task' | 'chat'

interface LayoutState {
  // Sidebar states
  isLeftSidebarOpen: boolean
  isRightOrchestratorOpen: boolean

  // Orchestrator state
  orchestratorMode: OrchestratorMode

  // Mobile state
  isMobileLeftOverlay: boolean
  isMobileRightOverlay: boolean

  // Actions
  toggleLeftSidebar: () => void
  toggleRightOrchestrator: () => void
  setOrchestratorMode: (mode: OrchestratorMode) => void
  setMobileLeftOverlay: (open: boolean) => void
  setMobileRightOverlay: (open: boolean) => void
  closeAllOverlays: () => void
}

export const useLayoutStore = create<LayoutState>()(
  persist(
    (set) => ({
      // Initial states
      isLeftSidebarOpen: true,
      isRightOrchestratorOpen: true,
      orchestratorMode: 'query',
      isMobileLeftOverlay: false,
      isMobileRightOverlay: false,

      // Actions
      toggleLeftSidebar: () => set((state) => ({
        isLeftSidebarOpen: !state.isLeftSidebarOpen
      })),

      toggleRightOrchestrator: () => set((state) => ({
        isRightOrchestratorOpen: !state.isRightOrchestratorOpen
      })),

      setOrchestratorMode: (mode) => set({ orchestratorMode: mode }),

      setMobileLeftOverlay: (open) => set({ isMobileLeftOverlay: open }),

      setMobileRightOverlay: (open) => set({ isMobileRightOverlay: open }),

      closeAllOverlays: () => set({
        isMobileLeftOverlay: false,
        isMobileRightOverlay: false
      }),
    }),
    {
      name: 'layout-storage',
      partialize: (state) => ({
        isLeftSidebarOpen: state.isLeftSidebarOpen,
        isRightOrchestratorOpen: state.isRightOrchestratorOpen,
        orchestratorMode: state.orchestratorMode,
      }),
    }
  )
)
