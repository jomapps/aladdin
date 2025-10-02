/**
 * RightOrchestrator Component
 * Slide-in AI chat modal with fixed height and clean black/white/grey design
 */

'use client'

import { useEffect } from 'react'
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { useLayoutStore } from '@/stores/layoutStore'
import { useOrchestratorStore } from '@/stores/orchestratorStore'
import { useOrchestratorChat } from '@/hooks/orchestrator/useOrchestratorChat'
import { useStreamingResponse } from '@/hooks/orchestrator/useStreamingResponse'
import ModeSelector from './ModeSelector'
import ChatArea from './ChatArea'
import MessageInput from './MessageInput'

// For now, use a fixed project ID - this should be passed from the parent component
const PROJECT_ID = 'demo-project'

export default function RightOrchestrator() {
  const {
    isRightOrchestratorOpen,
    isMobileRightOverlay,
    orchestratorMode,
    toggleRightOrchestrator,
    setMobileRightOverlay,
  } = useLayoutStore()

  const { conversationId, setPanelOpen } = useOrchestratorStore()

  // Initialize orchestrator chat
  const { sendMessage, isLoading } = useOrchestratorChat({
    projectId: PROJECT_ID,
  })

  // Initialize streaming connection
  useStreamingResponse(conversationId)

  // Update panel state
  useEffect(() => {
    setPanelOpen(isRightOrchestratorOpen || isMobileRightOverlay)
  }, [isRightOrchestratorOpen, isMobileRightOverlay, setPanelOpen])

  // Handle suggestion click - fill input with suggestion text
  const handleSuggestionClick = (text: string) => {
    const textarea = document.querySelector('textarea[placeholder*="Ask"]') as HTMLTextAreaElement
    if (textarea) {
      textarea.value = text
      textarea.focus()
      const event = new Event('input', { bubbles: true })
      textarea.dispatchEvent(event)
    }
  }

  // Determine if sheet should be open
  const isOpen = isRightOrchestratorOpen || isMobileRightOverlay

  // Handle close
  const handleClose = () => {
    if (isMobileRightOverlay) {
      setMobileRightOverlay(false)
    } else {
      toggleRightOrchestrator()
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <SheetContent
        side="right"
        className="w-full sm:w-[480px] p-0 bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800"
      >
        {/* Accessibility */}
        <SheetTitle className="sr-only">AI Assistant</SheetTitle>
        <SheetDescription className="sr-only">
          AI-powered assistant for your project with Query, Data, Task, and Chat modes
        </SheetDescription>

        {/* Fixed height container */}
        <div className="flex flex-col h-full">
          {/* Header with mode selector */}
          <div className="flex-shrink-0 border-b border-zinc-200 dark:border-zinc-800">
            <div className="px-4 py-3">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                AI Assistant
              </h2>
            </div>
            <ModeSelector />
          </div>

          {/* Scrollable chat area */}
          <div className="flex-1 overflow-hidden">
            <ChatArea mode={orchestratorMode} onSuggestionClick={handleSuggestionClick} />
          </div>

          {/* Fixed input at bottom */}
          <div className="flex-shrink-0 border-t border-zinc-200 dark:border-zinc-800">
            <MessageInput onSend={sendMessage} isLoading={isLoading} />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
