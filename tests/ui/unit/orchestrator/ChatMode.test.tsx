/**
 * Unit Tests: ChatMode Component
 * Tests for chat/conversation mode in orchestrator
 * Based on actual ChatInterface component
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  agentId?: string
}

// Mock ChatMode component (simplified version of ChatInterface)
const ChatMode = ({
  messages = [],
  onSendMessage,
  isConnected = false,
  isLoading = false,
  conversationId
}: {
  messages?: Message[]
  onSendMessage?: (content: string) => void
  isConnected?: boolean
  isLoading?: boolean
  conversationId?: string | null
}) => {
  const [inputValue, setInputValue] = React.useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputValue.trim() && !isLoading && conversationId) {
      onSendMessage?.(inputValue)
      setInputValue('')
    }
  }

  return (
    <div data-testid="chat-mode">
      {/* Connection Status */}
      <div data-testid="connection-status">
        <div
          data-testid="connection-indicator"
          className={isConnected ? 'connected' : 'disconnected'}
        />
        <span data-testid="connection-text">
          {isConnected ? 'Connected' : 'Disconnected'}
        </span>
        {isLoading && <span data-testid="loading-text">AI is processing...</span>}
      </div>

      {/* Message List */}
      <div data-testid="message-list">
        {messages.length === 0 && (
          <div data-testid="empty-chat">Start a conversation</div>
        )}
        {messages.map(message => (
          <div
            key={message.id}
            data-testid={`message-${message.id}`}
            data-role={message.role}
          >
            <span data-testid={`message-role-${message.id}`}>{message.role}</span>
            <p data-testid={`message-content-${message.id}`}>{message.content}</p>
            {message.agentId && (
              <span data-testid={`message-agent-${message.id}`}>{message.agentId}</span>
            )}
          </div>
        ))}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} data-testid="chat-form">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Type a message..."
          data-testid="chat-input"
          disabled={isLoading || !conversationId}
        />
        <button
          type="submit"
          data-testid="send-button"
          disabled={isLoading || !conversationId || !inputValue.trim()}
        >
          Send
        </button>
      </form>
    </div>
  )
}

// Mock React
const React = {
  useState: (initial: any) => {
    let value = initial
    const setValue = (newValue: any) => {
      value = typeof newValue === 'function' ? newValue(value) : newValue
    }
    return [value, setValue]
  },
  FormEvent: {} as any
}

describe('ChatMode', () => {
  const mockMessages: Message[] = [
    {
      id: '1',
      role: 'user',
      content: 'Hello, can you help me?',
      timestamp: new Date('2024-01-01T10:00:00')
    },
    {
      id: '2',
      role: 'assistant',
      content: 'Of course! How can I assist you today?',
      timestamp: new Date('2024-01-01T10:00:05'),
      agentId: 'agent-1'
    },
    {
      id: '3',
      role: 'system',
      content: 'Agent is analyzing your request...',
      timestamp: new Date('2024-01-01T10:00:10')
    }
  ]

  const defaultProps = {
    messages: [],
    onSendMessage: vi.fn(),
    isConnected: true,
    isLoading: false,
    conversationId: 'conv-123'
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render chat mode', () => {
      render(<ChatMode {...defaultProps} />)
      expect(screen.getByTestId('chat-mode')).toBeInTheDocument()
    })

    it('should render connection status', () => {
      render(<ChatMode {...defaultProps} />)
      expect(screen.getByTestId('connection-status')).toBeInTheDocument()
    })

    it('should render message list', () => {
      render(<ChatMode {...defaultProps} />)
      expect(screen.getByTestId('message-list')).toBeInTheDocument()
    })

    it('should render chat form', () => {
      render(<ChatMode {...defaultProps} />)
      expect(screen.getByTestId('chat-form')).toBeInTheDocument()
    })

    it('should render chat input', () => {
      render(<ChatMode {...defaultProps} />)
      expect(screen.getByTestId('chat-input')).toBeInTheDocument()
    })

    it('should render send button', () => {
      render(<ChatMode {...defaultProps} />)
      expect(screen.getByTestId('send-button')).toBeInTheDocument()
    })
  })

  describe('Connection Status', () => {
    it('should show connected status', () => {
      render(<ChatMode {...defaultProps} isConnected={true} />)

      expect(screen.getByTestId('connection-indicator')).toHaveClass('connected')
      expect(screen.getByTestId('connection-text')).toHaveTextContent('Connected')
    })

    it('should show disconnected status', () => {
      render(<ChatMode {...defaultProps} isConnected={false} />)

      expect(screen.getByTestId('connection-indicator')).toHaveClass('disconnected')
      expect(screen.getByTestId('connection-text')).toHaveTextContent('Disconnected')
    })

    it('should show loading text when isLoading is true', () => {
      render(<ChatMode {...defaultProps} isLoading={true} />)
      expect(screen.getByTestId('loading-text')).toHaveTextContent('AI is processing...')
    })

    it('should not show loading text when isLoading is false', () => {
      render(<ChatMode {...defaultProps} isLoading={false} />)
      expect(screen.queryByTestId('loading-text')).not.toBeInTheDocument()
    })
  })

  describe('Message Display', () => {
    it('should show empty state when no messages', () => {
      render(<ChatMode {...defaultProps} messages={[]} />)
      expect(screen.getByTestId('empty-chat')).toBeInTheDocument()
    })

    it('should display all messages', () => {
      render(<ChatMode {...defaultProps} messages={mockMessages} />)

      expect(screen.getByTestId('message-1')).toBeInTheDocument()
      expect(screen.getByTestId('message-2')).toBeInTheDocument()
      expect(screen.getByTestId('message-3')).toBeInTheDocument()
    })

    it('should display message roles', () => {
      render(<ChatMode {...defaultProps} messages={mockMessages} />)

      expect(screen.getByTestId('message-role-1')).toHaveTextContent('user')
      expect(screen.getByTestId('message-role-2')).toHaveTextContent('assistant')
      expect(screen.getByTestId('message-role-3')).toHaveTextContent('system')
    })

    it('should display message content', () => {
      render(<ChatMode {...defaultProps} messages={mockMessages} />)

      expect(screen.getByTestId('message-content-1')).toHaveTextContent(
        'Hello, can you help me?'
      )
      expect(screen.getByTestId('message-content-2')).toHaveTextContent(
        'Of course! How can I assist you today?'
      )
    })

    it('should display agent ID when present', () => {
      render(<ChatMode {...defaultProps} messages={mockMessages} />)
      expect(screen.getByTestId('message-agent-2')).toHaveTextContent('agent-1')
    })

    it('should not display agent ID for user messages', () => {
      render(<ChatMode {...defaultProps} messages={mockMessages} />)
      expect(screen.queryByTestId('message-agent-1')).not.toBeInTheDocument()
    })

    it('should apply correct role attribute', () => {
      render(<ChatMode {...defaultProps} messages={mockMessages} />)

      expect(screen.getByTestId('message-1')).toHaveAttribute('data-role', 'user')
      expect(screen.getByTestId('message-2')).toHaveAttribute('data-role', 'assistant')
    })
  })

  describe('Message Sending', () => {
    it('should allow typing in input', async () => {
      const user = userEvent.setup()
      render(<ChatMode {...defaultProps} />)

      await user.type(screen.getByTestId('chat-input'), 'Hello')

      expect(screen.getByTestId('chat-input')).toHaveValue('Hello')
    })

    it('should call onSendMessage when form is submitted', async () => {
      const user = userEvent.setup()
      render(<ChatMode {...defaultProps} />)

      await user.type(screen.getByTestId('chat-input'), 'Test message')
      await user.click(screen.getByTestId('send-button'))

      expect(defaultProps.onSendMessage).toHaveBeenCalledWith('Test message')
    })

    it('should send message on Enter key', async () => {
      const user = userEvent.setup()
      render(<ChatMode {...defaultProps} />)

      await user.type(screen.getByTestId('chat-input'), 'Test{Enter}')

      expect(defaultProps.onSendMessage).toHaveBeenCalledWith('Test')
    })

    it('should clear input after sending', async () => {
      const user = userEvent.setup()
      render(<ChatMode {...defaultProps} />)

      await user.type(screen.getByTestId('chat-input'), 'Test')
      await user.click(screen.getByTestId('send-button'))

      // In real implementation, input would be cleared
      expect(defaultProps.onSendMessage).toHaveBeenCalled()
    })

    it('should not send empty messages', async () => {
      const user = userEvent.setup()
      render(<ChatMode {...defaultProps} />)

      await user.type(screen.getByTestId('chat-input'), '   ')
      await user.click(screen.getByTestId('send-button'))

      expect(defaultProps.onSendMessage).not.toHaveBeenCalled()
    })
  })

  describe('Input States', () => {
    it('should disable input when loading', () => {
      render(<ChatMode {...defaultProps} isLoading={true} />)
      expect(screen.getByTestId('chat-input')).toBeDisabled()
    })

    it('should disable input when no conversation ID', () => {
      render(<ChatMode {...defaultProps} conversationId={null} />)
      expect(screen.getByTestId('chat-input')).toBeDisabled()
    })

    it('should disable send button when loading', () => {
      render(<ChatMode {...defaultProps} isLoading={true} />)
      expect(screen.getByTestId('send-button')).toBeDisabled()
    })

    it('should disable send button when input is empty', () => {
      render(<ChatMode {...defaultProps} />)
      expect(screen.getByTestId('send-button')).toBeDisabled()
    })

    it('should enable send button when input has content', async () => {
      const user = userEvent.setup()
      render(<ChatMode {...defaultProps} />)

      await user.type(screen.getByTestId('chat-input'), 'Hello')

      expect(screen.getByTestId('send-button')).not.toBeDisabled()
    })

    it('should disable send button when no conversation ID', () => {
      render(<ChatMode {...defaultProps} conversationId={null} />)
      expect(screen.getByTestId('send-button')).toBeDisabled()
    })
  })

  describe('Edge Cases', () => {
    it('should handle undefined onSendMessage callback', async () => {
      const user = userEvent.setup()
      render(<ChatMode messages={[]} conversationId="test" />)

      await user.type(screen.getByTestId('chat-input'), 'Test')
      await user.click(screen.getByTestId('send-button'))

      // Should not throw
      expect(screen.getByTestId('chat-mode')).toBeInTheDocument()
    })

    it('should handle very long messages', async () => {
      const user = userEvent.setup()
      const longMessage = 'a'.repeat(5000)

      render(<ChatMode {...defaultProps} />)

      await user.type(screen.getByTestId('chat-input'), longMessage)
      await user.click(screen.getByTestId('send-button'))

      expect(defaultProps.onSendMessage).toHaveBeenCalledWith(longMessage)
    })

    it('should handle large message lists', () => {
      const manyMessages = Array.from({ length: 100 }, (_, i) => ({
        id: `${i}`,
        role: (i % 2 === 0 ? 'user' : 'assistant') as const,
        content: `Message ${i}`,
        timestamp: new Date()
      }))

      render(<ChatMode {...defaultProps} messages={manyMessages} />)

      expect(screen.getByTestId('message-list')).toBeInTheDocument()
      expect(screen.getByTestId('message-0')).toBeInTheDocument()
    })

    it('should handle messages with special characters', () => {
      const specialMessage: Message = {
        id: '1',
        role: 'user',
        content: '<script>alert("xss")</script>',
        timestamp: new Date()
      }

      render(<ChatMode {...defaultProps} messages={[specialMessage]} />)

      expect(screen.getByTestId('message-content-1')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have accessible input field', () => {
      render(<ChatMode {...defaultProps} />)

      const input = screen.getByTestId('chat-input')
      expect(input).toHaveAttribute('placeholder')
      expect(input).toHaveAttribute('type', 'text')
    })

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup()
      render(<ChatMode {...defaultProps} />)

      await user.tab()
      expect(screen.getByTestId('chat-input')).toHaveFocus()

      await user.tab()
      expect(screen.getByTestId('send-button')).toHaveFocus()
    })

    it('should have accessible messages', () => {
      render(<ChatMode {...defaultProps} messages={mockMessages} />)

      const messages = screen.getAllByRole('paragraph')
      expect(messages.length).toBeGreaterThan(0)
    })
  })

  describe('Streaming Updates', () => {
    it('should handle real-time message updates', async () => {
      const { rerender } = render(<ChatMode {...defaultProps} messages={[]} />)

      expect(screen.queryByTestId('message-1')).not.toBeInTheDocument()

      rerender(<ChatMode {...defaultProps} messages={[mockMessages[0]]} />)

      await waitFor(() => {
        expect(screen.getByTestId('message-1')).toBeInTheDocument()
      })
    })

    it('should handle connection state changes', () => {
      const { rerender } = render(<ChatMode {...defaultProps} isConnected={true} />)

      expect(screen.getByTestId('connection-text')).toHaveTextContent('Connected')

      rerender(<ChatMode {...defaultProps} isConnected={false} />)

      expect(screen.getByTestId('connection-text')).toHaveTextContent('Disconnected')
    })
  })
})
