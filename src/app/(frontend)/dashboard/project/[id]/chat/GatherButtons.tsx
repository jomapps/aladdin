'use client'

/**
 * Gather Buttons Component
 * Conditional buttons for adding chat messages to Gather
 * Visible only on /gather and /project-readiness routes
 */

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Package, PackagePlus, Loader2 } from 'lucide-react'
import { useGatherStore } from '@/stores/gatherStore'

interface GatherButtonsProps {
  projectId: string
  messages: Array<{
    id: string
    role: string
    content: string
  }>
}

export default function GatherButtons({ projectId, messages }: GatherButtonsProps) {
  const pathname = usePathname()
  const { isSelectionMode, enterSelectionMode, exitSelectionMode } = useGatherStore()
  const [isProcessing, setIsProcessing] = useState(false)

  // Only show on /gather or /project-readiness routes
  const shouldShowButtons =
    pathname.includes('/gather') || pathname.includes('/project-readiness')

  if (!shouldShowButtons) {
    return null
  }

  const handleAddAll = async () => {
    if (messages.length === 0) {
      alert('No messages to add')
      return
    }

    if (!confirm(`Add all ${messages.length} messages to Gather? This may take a few moments.`)) {
      return
    }

    setIsProcessing(true)

    try {
      // Filter only assistant messages (AI responses)
      const assistantMessages = messages.filter((m) => m.role === 'assistant')

      if (assistantMessages.length === 0) {
        alert('No AI messages to add')
        return
      }

      // Process messages one by one
      let successCount = 0
      let errorCount = 0

      for (const message of assistantMessages) {
        try {
          const response = await fetch(`/api/v1/gather/${projectId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              content: message.content,
            }),
          })

          if (response.ok) {
            successCount++
          } else {
            errorCount++
          }
        } catch (error) {
          console.error('Failed to add message:', error)
          errorCount++
        }
      }

      alert(
        `Added ${successCount} messages to Gather.${errorCount > 0 ? ` ${errorCount} failed.` : ''}`
      )

      // Refresh the page to show updated gather count
      window.location.reload()
    } catch (error) {
      console.error('Failed to add all messages:', error)
      alert('Failed to add messages to Gather')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleToggleSelection = () => {
    if (isSelectionMode) {
      exitSelectionMode()
    } else {
      enterSelectionMode()
    }
  }

  return (
    <div className="flex items-center gap-2 border-t border-gray-200 bg-white px-4 py-3">
      <Button
        variant="outline"
        size="sm"
        onClick={handleToggleSelection}
        disabled={isProcessing}
      >
        <Package className="w-4 h-4 mr-2" />
        {isSelectionMode ? 'Cancel Selection' : 'Select Messages'}
      </Button>

      <Button
        variant="default"
        size="sm"
        onClick={handleAddAll}
        disabled={isProcessing || messages.length === 0}
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <PackagePlus className="w-4 h-4 mr-2" />
            Add All to Gather ({messages.filter((m) => m.role === 'assistant').length})
          </>
        )}
      </Button>

      {isSelectionMode && (
        <span className="text-sm text-gray-600 ml-auto">
          Select messages to add to Gather
        </span>
      )}
    </div>
  )
}

