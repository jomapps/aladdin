/**
 * useProject Hook
 *
 * Simple hook to access project context
 */

'use client'

import { useProjectContext } from './ProjectContext'

export function useProject() {
  return useProjectContext()
}
