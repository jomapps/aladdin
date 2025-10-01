/**
 * MessageList Component
 * Displays list of chat messages
 */

'use client'

import { Message as MessageType, OrchestratorMode } from '@/stores/orchestratorStore'
import Message from './Message'
import { cn } from '@/lib/utils'

interface MessageListProps {
  messages: MessageType[]
  mode: OrchestratorMode
  className?: string
}

export default function MessageList({ messages, mode, className }: MessageListProps) {
  if (messages.length === 0) {
    return null
  }

  return (
    <div className={cn('space-y-4', className)}>
      {messages.map((message) => (
        <Message key={message.id} message={message} mode={mode} />
      ))}
    </div>
  )
}
