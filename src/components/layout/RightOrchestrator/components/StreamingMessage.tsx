/**
 * StreamingMessage Component
 * Displays streaming message with typing indicator
 */

'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn } from '@/lib/utils'
import CodeBlock from './CodeBlock'

interface StreamingMessageProps {
  content: string
  className?: string
}

export default function StreamingMessage({ content, className }: StreamingMessageProps) {
  return (
    <div className={cn('flex gap-3 animate-fadeIn', className)}>
      {/* Avatar */}
      <div className="flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
          <div className="w-2 h-2 bg-purple-600 rounded-full animate-pulse" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 space-y-2">
        <div className="prose prose-sm max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code: ({ node, inline, className, children, ...props }) => {
                const match = /language-(\w+)/.exec(className || '')
                const language = match ? match[1] : ''

                if (!inline && language) {
                  return (
                    <CodeBlock
                      code={String(children).replace(/\n$/, '')}
                      language={language}
                    />
                  )
                }

                return (
                  <code
                    className="px-1.5 py-0.5 rounded bg-gray-100 text-purple-600 text-sm font-mono"
                    {...props}
                  >
                    {children}
                  </code>
                )
              },
            }}
          >
            {content}
          </ReactMarkdown>
        </div>

        {/* Typing indicator */}
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <div className="flex gap-1">
            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <span>Thinking...</span>
        </div>
      </div>
    </div>
  )
}
