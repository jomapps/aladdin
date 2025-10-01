/**
 * RightOrchestrator Component
 * Main orchestrator component with 4 modes and chat integration
 */

'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLayoutStore } from '@/stores/layoutStore'
import { useOrchestratorStore } from '@/stores/orchestratorStore'
import { useOrchestratorChat } from '@/hooks/orchestrator/useOrchestratorChat'
import { useStreamingResponse } from '@/hooks/orchestrator/useStreamingResponse'
import { cn } from '@/lib/utils'
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

  return (
    <>
      {/* Desktop Orchestrator */}
      <aside
        className={cn(
          'hidden lg:flex flex-col border-l bg-background transition-all duration-300',
          isRightOrchestratorOpen ? 'w-96' : 'w-0 overflow-hidden'
        )}
      >
        <div className="flex flex-col h-full">
          <ModeSelector />
          <ChatArea mode={orchestratorMode} />
          <MessageInput onSend={sendMessage} isLoading={isLoading} />
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isMobileRightOverlay && (
        <>
          <div
            className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileRightOverlay(false)}
          />
          <aside className="fixed right-0 top-0 bottom-0 z-50 w-full sm:w-96 bg-background border-l lg:hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="font-semibold">AI Orchestrator</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileRightOverlay(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex flex-col h-[calc(100%-57px)]">
              <ModeSelector />
              <ChatArea mode={orchestratorMode} />
              <MessageInput onSend={sendMessage} isLoading={isLoading} />
            </div>
          </aside>
        </>
      )}
    </>
  )
}
