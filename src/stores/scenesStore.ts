/**
 * Scenes Store
 *
 * Manages state for scene generation and editing including:
 * - Scene list with status tracking
 * - Scene generation triggers
 * - Scene metadata editing
 * - Video preview states
 */

import { create } from 'zustand'

export interface Scene {
  id: string
  sceneNumber: number
  title: string
  description: string
  status: 'draft' | 'generating' | 'ready' | 'failed'
  videoUrl: string | null
  thumbnailUrl: string | null
  duration: number | null
  metadata: {
    characters: string[]
    location: string
    timeOfDay: string
    mood: string
  }
  compositeIterations: number
  lastFrameTimecode: string | null
  createdAt: string
  updatedAt: string
  generationProgress: number // 0-100
  verificationStatus: 'pending' | 'verified' | 'failed' | null
  error: string | null
}

interface ScenesState {
  scenes: Scene[]
  selectedScene: Scene | null
  isLoading: boolean

  // Actions
  fetchScenes: (projectId: string) => Promise<void>
  generateScene: (projectId: string, sceneId: string) => Promise<void>
  updateScene: (sceneId: string, updates: Partial<Scene>) => Promise<void>
  selectScene: (scene: Scene | null) => void
  deleteScene: (sceneId: string) => Promise<void>
}

export const useScenesStore = create<ScenesState>((set, get) => ({
  scenes: [],
  selectedScene: null,
  isLoading: false,

  fetchScenes: async (projectId: string) => {
    set({ isLoading: true })

    try {
      const response = await fetch(`/api/projects/${projectId}/scenes`)

      if (!response.ok) {
        throw new Error('Failed to fetch scenes')
      }

      const data = await response.json()
      set({ scenes: data.scenes || [] })
    } catch (error) {
      console.error('[ScenesStore] Failed to fetch scenes:', error)
    } finally {
      set({ isLoading: false })
    }
  },

  generateScene: async (projectId: string, sceneId: string) => {
    try {
      // Update local state to show generating
      const scenes = get().scenes.map((scene) =>
        scene.id === sceneId
          ? { ...scene, status: 'generating' as const, generationProgress: 0 }
          : scene
      )
      set({ scenes })

      const response = await fetch(`/api/projects/${projectId}/scenes/${sceneId}/generate`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to generate scene')
      }

      const data = await response.json()

      // Update with server response
      const updatedScenes = get().scenes.map((scene) =>
        scene.id === sceneId ? { ...scene, ...data.scene } : scene
      )
      set({ scenes: updatedScenes })
    } catch (error) {
      console.error('[ScenesStore] Failed to generate scene:', error)

      // Update to failed state
      const scenes = get().scenes.map((scene) =>
        scene.id === sceneId
          ? { ...scene, status: 'failed' as const, error: String(error) }
          : scene
      )
      set({ scenes })
    }
  },

  updateScene: async (sceneId: string, updates: Partial<Scene>) => {
    try {
      const response = await fetch(`/api/scenes/${sceneId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        throw new Error('Failed to update scene')
      }

      const data = await response.json()

      // Update local state
      const scenes = get().scenes.map((scene) =>
        scene.id === sceneId ? { ...scene, ...data.scene } : scene
      )
      set({ scenes })

      // Update selected scene if it's the one being updated
      if (get().selectedScene?.id === sceneId) {
        set({ selectedScene: { ...get().selectedScene!, ...data.scene } })
      }
    } catch (error) {
      console.error('[ScenesStore] Failed to update scene:', error)
      throw error
    }
  },

  selectScene: (scene: Scene | null) => {
    set({ selectedScene: scene })
  },

  deleteScene: async (sceneId: string) => {
    try {
      const response = await fetch(`/api/scenes/${sceneId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete scene')
      }

      // Remove from local state
      const scenes = get().scenes.filter((scene) => scene.id !== sceneId)
      set({ scenes })

      // Clear selected scene if it was deleted
      if (get().selectedScene?.id === sceneId) {
        set({ selectedScene: null })
      }
    } catch (error) {
      console.error('[ScenesStore] Failed to delete scene:', error)
      throw error
    }
  },
}))
