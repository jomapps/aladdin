/**
 * MessageInput Component
 * Message input with send button and orchestrator integration
 */

'use client'

import { useState, useRef, KeyboardEvent } from 'react'
import { Send, Paperclip, Loader } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useLayoutStore } from '@/stores/layoutStore'

interface MessageInputProps {
  onSend: (content: string) => Promise<void>
  isLoading: boolean
}

const placeholders = {
  query: 'Ask about your project...',
  data: 'Describe the data to add...',
  task: 'What task should I execute?',
  chat: 'Ask me anything...',
}

export default function MessageInput({ onSend, isLoading }: MessageInputProps) {
  const [message, setMessage] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { orchestratorMode } = useLayoutStore()

  async function handleSend() {
    if (!message.trim() || isLoading) return

    const content = message.trim()
    setMessage('')

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    await onSend(content)
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Auto-resize textarea
  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setMessage(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = `${Math.min(e.target.scrollHeight, 128)}px`
  }

  const placeholder = placeholders[orchestratorMode]

  return (
    <div className="p-4 bg-white dark:bg-zinc-950">
      <div className="flex items-end gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="mb-1 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
          disabled
          title="Attachments coming soon"
        >
          <Paperclip className="h-4 w-4" />
        </Button>

        <textarea
          ref={textareaRef}
          value={message}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={cn(
            'flex-1 resize-none rounded-lg border bg-white dark:bg-zinc-950',
            'border-zinc-200 dark:border-zinc-800',
            'px-4 py-2 text-zinc-900 dark:text-zinc-100',
            'placeholder:text-zinc-400 dark:placeholder:text-zinc-600',
            'focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100',
            'max-h-32 min-h-[44px]',
            'disabled:bg-zinc-50 dark:disabled:bg-zinc-900 disabled:text-zinc-400 dark:disabled:text-zinc-600 disabled:cursor-not-allowed',
          )}
          rows={1}
          disabled={isLoading}
        />

        <Button
          size="icon"
          onClick={handleSend}
          disabled={!message.trim() || isLoading}
          className="mb-1 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200"
        >
          {isLoading ? <Loader className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>

      <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-2">
        Press{' '}
        <kbd className="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded font-mono text-xs">
          Enter
        </kbd>{' '}
        to send,
        <kbd className="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded font-mono text-xs ml-1">
          Shift+Enter
        </kbd>{' '}
        for new line
      </p>
    </div>
  )
}
