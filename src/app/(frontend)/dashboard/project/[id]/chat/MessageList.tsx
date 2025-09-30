'use client'

/**
 * Message List Component
 * Displays chat messages with role-based styling
 */

import { useEffect, useRef } from 'react'
import type { Message } from './ChatInterface'
import ContentCard from './ContentCard'

export interface MessageListProps {
  messages: Message[]
}

export default function MessageList({ messages }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <div className="text-center">
          <p className="text-lg font-medium mb-2">Start a conversation</p>
          <p className="text-sm">
            Ask the AI agents to help develop your project
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-6">
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
      <div ref={messagesEndRef} />
    </div>
  )
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user'
  const isSystem = message.role === 'system'

  // System messages
  if (isSystem) {
    return (
      <div className="flex justify-center">
        <div className="bg-blue-50 text-blue-700 text-sm px-4 py-2 rounded-full border border-blue-200">
          {message.content}
        </div>
      </div>
    )
  }

  // User and assistant messages
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-2xl ${isUser ? 'ml-12' : 'mr-12'}`}>
        {/* Agent name for assistant messages */}
        {!isUser && message.agentId && (
          <div className="text-xs text-gray-500 mb-1 ml-3">
            {getAgentName(message.agentId)}
          </div>
        )}

        {/* Message bubble */}
        <div
          className={`rounded-2xl px-4 py-3 ${
            isUser
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-900 border border-gray-200'
          }`}
        >
          <p className="whitespace-pre-wrap">{message.content}</p>

          {/* Timestamp */}
          <div
            className={`text-xs mt-2 ${
              isUser ? 'text-blue-200' : 'text-gray-500'
            }`}
          >
            {formatTime(message.timestamp)}
          </div>
        </div>

        {/* Content cards for agent responses */}
        {!isUser && hasStructuredContent(message.content) && (
          <div className="mt-3">
            <ContentCard content={message.content} />
          </div>
        )}
      </div>
    </div>
  )
}

function getAgentName(agentId: string): string {
  const agentNames: Record<string, string> = {
    'master-orchestrator': 'Master Orchestrator',
    'character-department-head': 'Character Department',
    'hair-stylist-specialist': 'Hair Stylist',
    default: 'AI Agent'
  }
  return agentNames[agentId] || agentNames.default
}

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).format(date)
}

function hasStructuredContent(content: string): boolean {
  // Check if content has JSON-like structure for cards
  try {
    JSON.parse(content)
    return true
  } catch {
    return false
  }
}
