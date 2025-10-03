/**
 * ChatArea Component
 * Scrollable message area with mode-specific rendering
 */

'use client'

import { useEffect, useRef } from 'react'
import { useOrchestratorStore } from '@/stores/orchestratorStore'
import { OrchestratorMode } from '@/stores/layoutStore'
import MessageList from './components/MessageList'
import StreamingMessage from './components/StreamingMessage'
import QueryMode from './modes/QueryMode'
import DataMode from './modes/DataMode'
import TaskMode from './modes/TaskMode'
import ChatMode from './modes/ChatMode'

interface ChatAreaProps {
  mode: OrchestratorMode
  onSuggestionClick?: (text: string) => void
}

export default function ChatArea({ mode, onSuggestionClick }: ChatAreaProps) {
  const { messages, isStreaming, currentStreamingMessage, getMessagesByMode } =
    useOrchestratorStore()
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, currentStreamingMessage])

  // Filter messages by current mode
  const modeMessages = getMessagesByMode(mode)

  return (
    <div ref={scrollRef} className="h-full overflow-y-auto p-4 bg-white dark:bg-zinc-950">
      {/* Mode-specific welcome message */}
      {modeMessages.length === 0 && !isStreaming && (
        <div className="h-full flex items-center justify-center">
          {mode === 'query' && <QueryMode.Welcome onSuggestionClick={onSuggestionClick} />}
          {mode === 'data' && <DataMode.Welcome />}
          {mode === 'task' && <TaskMode.Welcome />}
          {mode === 'chat' && <ChatMode.Welcome onSuggestionClick={onSuggestionClick} />}
        </div>
      )}

      {/* Message list */}
      {modeMessages.length > 0 && <MessageList messages={modeMessages} mode={mode} />}

      {/* Streaming indicator */}
      {isStreaming && currentStreamingMessage && (
        <div className="mt-4">
          <StreamingMessage content={currentStreamingMessage} />
        </div>
      )}

      {/* Empty streaming state */}
      {isStreaming && !currentStreamingMessage && (
        <div className="mt-4 flex gap-3 animate-fadeIn">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
              <div className="w-2 h-2 bg-zinc-900 dark:bg-zinc-100 rounded-full animate-pulse" />
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-zinc-600 dark:text-zinc-400">
            <div className="flex gap-1">
              <div
                className="w-2 h-2 bg-zinc-400 dark:bg-zinc-600 rounded-full animate-bounce"
                style={{ animationDelay: '0ms' }}
              />
              <div
                className="w-2 h-2 bg-zinc-400 dark:bg-zinc-600 rounded-full animate-bounce"
                style={{ animationDelay: '150ms' }}
              />
              <div
                className="w-2 h-2 bg-zinc-400 dark:bg-zinc-600 rounded-full animate-bounce"
                style={{ animationDelay: '300ms' }}
              />
            </div>
            <span>Thinking...</span>
          </div>
        </div>
      )}
    </div>
  )
}
