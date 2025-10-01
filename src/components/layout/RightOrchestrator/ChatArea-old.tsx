'use client'

import { Bot, User } from 'lucide-react'
import { OrchestratorMode } from '@/stores/layoutStore'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface ChatAreaProps {
  mode: OrchestratorMode
}

// Mock messages for demo
const mockMessages: Message[] = [
  {
    id: '1',
    role: 'assistant',
    content: 'Hello! I\'m your AI orchestrator. How can I help you today?',
    timestamp: new Date(),
  },
]

export default function ChatArea({ mode }: ChatAreaProps) {
  const messages = mode === 'chat' ? mockMessages : []

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {mode === 'chat' && (
        <>
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
              <Bot className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-sm">Start a conversation with the AI</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  {message.role === 'user' ? (
                    <User className="h-4 w-4" />
                  ) : (
                    <Bot className="h-4 w-4" />
                  )}
                </div>
                <div
                  className={`flex-1 rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                </div>
              </div>
            ))
          )}
        </>
      )}

      {mode === 'agents' && (
        <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
          <Bot className="h-12 w-12 mb-4 opacity-50" />
          <p className="text-sm font-medium mb-2">AI Agents</p>
          <p className="text-xs">Manage your AI agents here</p>
        </div>
      )}

      {mode === 'tools' && (
        <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
          <Wrench className="h-12 w-12 mb-4 opacity-50" />
          <p className="text-sm font-medium mb-2">Tools</p>
          <p className="text-xs">Available tools and integrations</p>
        </div>
      )}

      {mode === 'history' && (
        <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
          <History className="h-12 w-12 mb-4 opacity-50" />
          <p className="text-sm font-medium mb-2">History</p>
          <p className="text-xs">View your conversation history</p>
        </div>
      )}
    </div>
  )
}

function Wrench({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  )
}

function History({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M3 3v5h5" />
      <path d="M3.05 13A9 9 0 1 0 6 5.3L3 8" />
      <path d="M12 7v5l4 2" />
    </svg>
  )
}
