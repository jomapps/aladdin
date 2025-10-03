/**
 * Project Layout Client Component
 * Handles responsive padding for fixed RightOrchestrator sidebar
 */

'use client'

import { useLayoutStore } from '@/stores/layoutStore'
import RightOrchestrator from '@/components/layout/RightOrchestrator'
import { cn } from '@/lib/utils'

interface ProjectLayoutClientProps {
  children: React.ReactNode
  projectId: string
  projectName?: string
}

export default function ProjectLayoutClient({
  children,
  projectId,
  projectName,
}: ProjectLayoutClientProps) {
  const { isRightOrchestratorOpen } = useLayoutStore()

  // Calculate the padding based on sidebar state
  const getPaddingStyle = () => {
    if (!isRightOrchestratorOpen) return {}

    // On large screens, add padding equal to 30% with min/max constraints
    return {
      paddingRight: 'clamp(350px, 30%, 500px)',
    }
  }

  return (
    <>
      {/* Main content with dynamic right padding */}
      <div
        className="transition-all duration-300 h-full hidden lg:block"
        style={getPaddingStyle()}
      >
        {children}
      </div>

      {/* Mobile/Tablet: Full width content (no padding) */}
      <div className="lg:hidden h-full">
        {children}
      </div>

      {/* AI Chat - Fixed position sidebar */}
      <RightOrchestrator projectId={projectId} projectName={projectName} />
    </>
  )
}
