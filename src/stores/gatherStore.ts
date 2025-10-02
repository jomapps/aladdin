/**
 * Gather Store - Zustand State Management
 * Manages selection mode, editing state, and card states for Gather feature
 */

import { create } from 'zustand'
import { GatherStoreState, GatherCardState } from '@/lib/gather/types'

export const useGatherStore = create<GatherStoreState>((set, get) => ({
  // Selection state
  selectionMode: false,
  selectedCards: [],

  // Editing state
  editingCard: null,

  // Card states (expanded/collapsed)
  cardStates: {},

  // Toggle selection for a card
  toggleSelection: (cardId: string) => {
    set((state) => ({
      selectedCards: state.selectedCards.includes(cardId)
        ? state.selectedCards.filter((id) => id !== cardId)
        : [...state.selectedCards, cardId],
    }))
  },

  // Set edit mode for a card
  setEditMode: (cardId: string, content: any) => {
    set({
      editingCard: { id: cardId, content },
    })
  },

  // Save changes (will be handled by component)
  saveChanges: async () => {
    // This will be implemented in the component
    // Just clear editing state here
    set({ editingCard: null })
  },

  // Cancel edit
  cancelEdit: () => {
    set({ editingCard: null })
  },

  // Toggle expand/collapse for a card
  toggleExpand: (cardId: string) => {
    set((state) => ({
      cardStates: {
        ...state.cardStates,
        [cardId]: {
          ...state.cardStates[cardId],
          isExpanded: !state.cardStates[cardId]?.isExpanded,
        },
      },
    }))
  },

  // Enter selection mode
  enterSelectionMode: () => {
    set({
      selectionMode: true,
      selectedCards: [],
    })
  },

  // Exit selection mode
  exitSelectionMode: () => {
    set({
      selectionMode: false,
      selectedCards: [],
    })
  },

  // Clear selection
  clearSelection: () => {
    set({ selectedCards: [] })
  },
}))

