'use client'

/**
 * Send Message Form Component
 * Input form for sending chat messages
 */

import { useState, KeyboardEvent } from 'react'

export interface SendMessageFormProps {
  onSend: (content: string) => void
  disabled?: boolean
}

export default function SendMessageForm({ onSend, disabled = false }: SendMessageFormProps) {
  const [message, setMessage] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!message.trim() || disabled) return

    onSend(message)
    setMessage('')
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    // Submit on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-4">
      <div className="flex gap-3">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            disabled
              ? 'Connecting...'
              : 'Type a message... (Enter to send, Shift+Enter for new line)'
          }
          disabled={disabled}
          rows={3}
          className="flex-1 resize-none rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
        <button
          type="submit"
          disabled={disabled || !message.trim()}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          Send
        </button>
      </div>

      <div className="mt-2 text-xs text-gray-500">
        💡 Try: &quot;Create a cyberpunk detective character named Sarah&quot;
      </div>
    </form>
  )
}
