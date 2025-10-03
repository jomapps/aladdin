/**
 * RightOrchestrator Component
 * Slide-in AI chat modal with fixed height and clean black/white/grey design
 */

'use client'

import { useEffect } from 'react'
import { ChevronLeft, MessageCircle } from 'lucide-react'
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { useLayoutStore } from '@/stores/layoutStore'
import { useOrchestratorStore } from '@/stores/orchestratorStore'
import { useOrchestratorChat } from '@/hooks/orchestrator/useOrchestratorChat'
import { useStreamingResponse } from '@/hooks/orchestrator/useStreamingResponse'
import { cn } from '@/lib/utils'
import ModeSelector from './ModeSelector'
import ChatArea from './ChatArea'
import MessageInput from './MessageInput'

interface RightOrchestratorProps {
  projectId: string
}

export default function RightOrchestrator({ projectId }: RightOrchestratorProps) {
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
    projectId,
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
    <>
      {/* Floating Toggle Button */}
      {!isOpen && (
        <Button
          onClick={() => toggleRightOrchestrator()}
          className={cn(
            'fixed right-0 top-1/2 -translate-y-1/2 z-40',
            'rounded-l-full rounded-r-none',
            'h-16 w-12 px-2',
            'bg-zinc-900 dark:bg-zinc-100',
            'text-white dark:text-black',
            'hover:bg-zinc-800 dark:hover:bg-zinc-200',
            'shadow-lg',
            'transition-all duration-300',
            'flex items-center justify-center',
            'border-l border-t border-b border-zinc-700 dark:border-zinc-300',
          )}
          title="Open AI Assistant"
        >
          <div className="flex flex-col items-center gap-1">
            <ChevronLeft className="h-5 w-5" />
            <MessageCircle className="h-4 w-4" />
          </div>
        </Button>
      )}

      {/* Sheet Modal */}
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
    </>
  )
}
