'use client'

import { useState } from 'react'
import { Send, Paperclip } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function MessageInput() {
  const [message, setMessage] = useState('')

  const handleSend = () => {
    if (message.trim()) {
      // TODO: Implement message sending
      console.log('Sending message:', message)
      setMessage('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="p-4 border-t bg-background">
      <div className="flex items-end gap-2">
        <Button variant="ghost" size="icon" className="mb-1">
          <Paperclip className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <Input
            placeholder="Type a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            className="resize-none"
          />
        </div>
        <Button
          size="icon"
          onClick={handleSend}
          disabled={!message.trim()}
          className="mb-1"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
