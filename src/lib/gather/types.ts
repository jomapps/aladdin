/**
 * TypeScript Types for Gather Feature
 */

import { ObjectId } from 'mongodb'

export interface GatherItem {
  _id?: ObjectId | string
  projectId: string
  lastUpdated: Date | string
  content: string // JSON stringified content
  imageUrl?: string
  documentUrl?: string
  summary: string
  context: string
  extractedText?: string
  duplicateCheckScore?: number
  iterationCount?: number
  createdAt: Date | string
  createdBy: string
}

export interface GatherQueryOptions {
  page?: number
  limit?: number
  search?: string
  sort?: 'latest' | 'oldest' | 'a-z' | 'z-a'
  hasImage?: boolean
  hasDocument?: boolean
}

export interface GatherQueryResult {
  items: GatherItem[]
  total: number
  page: number
  pages: number
  hasMore: boolean
}

export interface CreateGatherItemInput {
  content: any
  imageUrl?: string
  documentUrl?: string
  extractedText?: string
}

export interface UpdateGatherItemInput {
  content?: any
  imageUrl?: string
  documentUrl?: string
  extractedText?: string
}

export interface DuplicateMatch {
  id: string
  similarity: number // 0-1 score
  conflicts: Conflict[]
  existingContent: any
}

export interface Conflict {
  field: string
  newValue: any
  existingValue: any
  existingId: string
}

export interface ProcessingResult {
  summary: string
  context: string
  extractedText?: string
  iterationCount: number
  duplicates: DuplicateMatch[]
  enrichedContent: any
}

export interface AIProcessingOptions {
  content: any
  imageUrl?: string
  documentUrl?: string
  projectId: string
  existingItemId?: string
}

export interface EnrichmentResult {
  enrichedContent: any
  isComplete: boolean
  iterationCount: number
}

export interface VisionExtractionResult {
  extractedText: string
  confidence?: number
}

export interface UploadProgress {
  loaded: number
  total: number
  percentage: number
}

export interface BulkAddJob {
  jobId: string
  status: 'processing' | 'completed' | 'failed'
  progress: {
    current: number
    total: number
    percentage: number
  }
  duplicates: DuplicateMatch[]
  completed: string[]
  errors: string[]
}

export interface ConflictResolution {
  action: 'merge' | 'skip' | 'createNew'
  mergedData?: any
}

export interface GatherCardState {
  isExpanded: boolean
  isEditing: boolean
  editedContent?: any
}

export interface SelectionState {
  selectionMode: boolean
  selectedCards: string[]
}

export interface GatherStoreState extends SelectionState {
  editingCard: {
    id: string
    content: any
  } | null
  cardStates: Record<string, GatherCardState>
  
  // Actions
  toggleSelection: (cardId: string) => void
  setEditMode: (cardId: string, content: any) => void
  saveChanges: () => Promise<void>
  cancelEdit: () => void
  toggleExpand: (cardId: string) => void
  enterSelectionMode: () => void
  exitSelectionMode: () => void
  clearSelection: () => void
}

