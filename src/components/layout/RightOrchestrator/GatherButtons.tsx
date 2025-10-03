'use client'

/**
 * Gather Buttons Component for RightOrchestrator
 * Conditional buttons for adding orchestrator chat messages to Gather
 * Visible only on /gather and /project-readiness routes
 */

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Package, PackagePlus, Loader2 } from 'lucide-react'
import { useGatherStore } from '@/stores/gatherStore'
import { useOrchestratorStore, Message } from '@/stores/orchestratorStore'

interface GatherButtonsProps {
  projectId: string
}

export default function GatherButtons({ projectId }: GatherButtonsProps) {
  const pathname = usePathname()
  const { messages } = useOrchestratorStore()
  const { selectionMode, selectedMessages, enterSelectionMode, exitSelectionMode } =
    useGatherStore()
  const [isProcessing, setIsProcessing] = useState(false)

  // Only show on /gather or /project-readiness routes
  const shouldShowButtons = pathname.includes('/gather') || pathname.includes('/project-readiness')

  if (!shouldShowButtons) {
    return null
  }

  // Filter out empty messages and get valid messages (both user and AI)
  const validMessages = messages.filter((m) => m.content && m.content.trim())

  const handleAddAll = async () => {
    if (validMessages.length === 0) {
      alert('No messages to add')
      return
    }

    if (
      !confirm(`Add all ${validMessages.length} messages to Gather? This may take a few moments.`)
    ) {
      return
    }

    await processMessages(validMessages)
  }

  const handleAddSelected = async () => {
    if (selectedMessages.length === 0) {
      alert('No messages selected')
      return
    }

    const messagesToAdd = validMessages.filter((m) => selectedMessages.includes(m.id))

    if (messagesToAdd.length === 0) {
      alert('Selected messages not found')
      return
    }

    if (
      !confirm(
        `Add ${messagesToAdd.length} selected message${messagesToAdd.length > 1 ? 's' : ''} to Gather?`,
      )
    ) {
      return
    }

    await processMessages(messagesToAdd)
    exitSelectionMode()
  }

  const processMessages = async (messagesToProcess: Message[]) => {
    setIsProcessing(true)

    try {
      // Process messages one by one
      let successCount = 0
      let errorCount = 0
      let brainFailCount = 0

      for (const message of messagesToProcess) {
        try {
          const response = await fetch(`/api/v1/gather/${projectId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              content: message.content,
            }),
          })

          if (response.ok) {
            const result = await response.json()

            // Check brain save status
            if (!result.brain?.saved) {
              brainFailCount++
              console.warn('[Gather] Brain save failed for message:', {
                messageId: message.id,
                error: result.brain?.error,
              })
            }

            successCount++
          } else {
            errorCount++
          }
        } catch (error) {
          console.error('Failed to add message:', error)
          errorCount++
        }
      }

      const message = `Added ${successCount} message${successCount !== 1 ? 's' : ''} to Gather.${errorCount > 0 ? ` ${errorCount} failed.` : ''}${brainFailCount > 0 ? ` ⚠️ ${brainFailCount} saved to DB only (Brain save failed).` : ''}`
      alert(message)

      // Refresh the page to show updated gather count
      window.location.reload()
    } catch (error) {
      console.error('Failed to add messages:', error)
      alert('Failed to add messages to Gather')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleToggleSelection = () => {
    if (selectionMode) {
      exitSelectionMode()
    } else {
      enterSelectionMode()
    }
  }

  return (
    <div className="flex items-center gap-2 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-3">
      {!selectionMode ? (
        <>
          {/* Normal mode buttons */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleSelection}
            disabled={isProcessing || validMessages.length === 0}
            className="text-xs"
          >
            <Package className="w-3 h-3 mr-1.5" />
            Select Messages
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={handleAddAll}
            disabled={isProcessing || validMessages.length === 0}
            className="text-xs"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <PackagePlus className="w-3 h-3 mr-1.5" />
                Add All ({validMessages.length})
              </>
            )}
          </Button>
        </>
      ) : (
        <>
          {/* Selection mode buttons */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleSelection}
            disabled={isProcessing}
            className="text-xs"
          >
            Cancel
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={handleAddSelected}
            disabled={isProcessing || selectedMessages.length === 0}
            className="text-xs"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <PackagePlus className="w-3 h-3 mr-1.5" />
                Add Selected ({selectedMessages.length})
              </>
            )}
          </Button>

          <span className="text-xs text-zinc-600 dark:text-zinc-400 ml-auto">
            Click messages to select
          </span>
        </>
      )}
    </div>
  )
}
