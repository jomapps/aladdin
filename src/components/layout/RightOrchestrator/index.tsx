/**
 * RightOrchestrator Component
 * Fixed right sidebar AI chat with 30% width and collapse functionality
 */

'use client'

import { useEffect } from 'react'
import { ChevronRight, ChevronLeft, X, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLayoutStore } from '@/stores/layoutStore'
import { useOrchestratorStore } from '@/stores/orchestratorStore'
import { useOrchestratorChat } from '@/hooks/orchestrator/useOrchestratorChat'
import { useStreamingResponse } from '@/hooks/orchestrator/useStreamingResponse'
import { cn } from '@/lib/utils'
import ModeSelector from './ModeSelector'
import ChatArea from './ChatArea'
import MessageInput from './MessageInput'
import GatherButtons from './GatherButtons'

interface RightOrchestratorProps {
  projectId: string
  projectName?: string
}

export default function RightOrchestrator({ projectId, projectName }: RightOrchestratorProps) {
  const {
    isRightOrchestratorOpen,
    isMobileRightOverlay,
    orchestratorMode,
    toggleRightOrchestrator,
    setMobileRightOverlay,
  } = useLayoutStore()

  const { conversationId, setPanelOpen, setMode, clearMessages, messages } = useOrchestratorStore()

  // Initialize orchestrator chat
  const { sendMessage, isLoading } = useOrchestratorChat({
    projectId,
  })

  // Initialize streaming connection
  useStreamingResponse(conversationId)

  // Sync mode between stores on mount and when orchestratorMode changes
  useEffect(() => {
    setMode(orchestratorMode)
  }, [orchestratorMode, setMode])

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

  // Add effect to adjust body margin when sidebar opens/closes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const root = document.documentElement
      if (isRightOrchestratorOpen) {
        root.style.setProperty('--right-sidebar-width', '30%')
        root.style.setProperty('--right-sidebar-min-width', '350px')
      } else {
        root.style.setProperty('--right-sidebar-width', '0px')
        root.style.setProperty('--right-sidebar-min-width', '0px')
      }
    }
  }, [isRightOrchestratorOpen])

  return (
    <>
      {/* Desktop Sidebar - Fixed Position */}
      <aside
        className={cn(
          'hidden lg:flex flex-col fixed top-0 right-0 h-screen z-[60]',
          'border-l border-white/10 bg-slate-950/90 backdrop-blur-xl shadow-[0_40px_120px_-60px_rgba(56,189,248,0.6)] transition-all duration-300',
          isRightOrchestratorOpen ? 'w-[30%] min-w-[350px] max-w-[500px]' : 'w-0 overflow-hidden',
        )}
      >
        {/* Collapse Button */}
        {isRightOrchestratorOpen && (
          <Button
            onClick={toggleRightOrchestrator}
            size="sm"
            variant="ghost"
            className={cn(
              'absolute -left-10 top-1/2 -translate-y-1/2 z-10',
              'h-16 w-10 px-1 rounded-l-md rounded-r-none',
              'border border-r-0 border-white/15 bg-white/10 text-slate-100 backdrop-blur',
              'hover:border-sky-400/40 hover:bg-slate-900/70',
              'shadow-[0_24px_70px_-45px_rgba(56,189,248,0.7)]',
            )}
            title="Collapse AI Assistant"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        )}

        {/* Fixed height container */}
        <div className="flex flex-col h-full">
          {/* Header with mode selector */}
          <div className="flex-shrink-0 border-b border-white/10">
            <div className="px-5 py-4 flex items-start justify-between gap-3">
              <h2 className="text-lg font-semibold tracking-wide text-slate-100">AI Assistant</h2>
              <div className="flex items-center gap-2">
                {messages.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearMessages}
                    className="h-7 px-2 text-xs text-slate-300 hover:text-sky-200"
                    title="Clear all messages"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Clear
                  </Button>
                )}
                <div className="text-[11px] leading-tight text-right whitespace-pre-wrap break-words max-w-[60%]">
                  {projectName ? (
                    <span className="font-semibold text-sky-200 animate-pulse">{projectName}</span>
                  ) : (
                    <span className="relative inline-flex items-center">
                      <span className="absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75 animate-ping" />
                      <span className="relative inline-flex font-bold text-sky-300 animate-pulse">
                        GLOBAL
                      </span>
                    </span>
                  )}
                </div>
              </div>
            </div>
            <ModeSelector />
          </div>

          {/* Scrollable chat area */}
          <div className="flex-1 overflow-hidden">
            <ChatArea mode={orchestratorMode} onSuggestionClick={handleSuggestionClick} />
          </div>

          {/* Gather Buttons - Conditional on route */}
          <GatherButtons projectId={projectId} />

          {/* Fixed input at bottom */}
          <div className="flex-shrink-0 border-t border-white/10">
            <MessageInput onSend={sendMessage} isLoading={isLoading} />
          </div>
        </div>
      </aside>

      {/* Floating Expand Button (when collapsed) */}
      {!isRightOrchestratorOpen && (
        <Button
          onClick={toggleRightOrchestrator}
          className={cn(
            'hidden lg:flex fixed right-0 top-1/2 -translate-y-1/2 z-40',
            'rounded-l-full rounded-r-none',
            'h-16 w-12 px-2',
            'bg-slate-950/90 text-slate-100',
            'hover:bg-slate-900/80',
            'shadow-[0_24px_70px_-45px_rgba(56,189,248,0.7)]',
            'transition-all duration-300',
            'flex-col items-center justify-center gap-1',
            'border-l border-t border-b border-white/15',
          )}
          title="Open AI Assistant"
        >
          <ChevronLeft className="h-5 w-5" />
          <span className="text-[10px] font-medium">AI</span>
        </Button>
      )}

      {/* Mobile Overlay */}
      {isMobileRightOverlay && (
        <>
          <div
            className="fixed inset-0 z-[55] bg-background/80 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileRightOverlay(false)}
          />
          <aside className="fixed right-0 top-0 bottom-0 z-[60] w-[90%] max-w-md border-l border-white/10 bg-slate-950/95 backdrop-blur-xl shadow-[0_40px_120px_-60px_rgba(56,189,248,0.6)] lg:hidden">
            <div className="flex items-center justify-between border-b border-white/10 p-4">
              <h2 className="text-lg font-semibold text-slate-100">AI Assistant</h2>
              <Button
                variant="ghost"
                size="icon"
                className="text-slate-300 hover:text-sky-200"
                onClick={() => setMobileRightOverlay(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex flex-col h-[calc(100%-4rem)]">
              <div className="flex-shrink-0 border-b border-white/10">
                <ModeSelector />
              </div>
              <div className="flex-1 overflow-hidden">
                <ChatArea mode={orchestratorMode} onSuggestionClick={handleSuggestionClick} />
              </div>
              {/* Gather Buttons - Conditional on route */}
              <GatherButtons projectId={projectId} />
              <div className="flex-shrink-0 border-t border-white/10">
                <MessageInput onSend={sendMessage} isLoading={isLoading} />
              </div>
            </div>
          </aside>
        </>
      )}
    </>
  )
}
