/**
 * Message Component
 * Single message with mode-specific rendering
 */

'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Message as MessageType, OrchestratorMode } from '@/stores/orchestratorStore'
import { User, Bot } from 'lucide-react'
import { cn } from '@/lib/utils'
import CodeBlock from './CodeBlock'
import QueryResults from './QueryResults'
import DataPreview from './DataPreview'
import TaskProgress from './TaskProgress'

interface MessageProps {
  message: MessageType
  mode: OrchestratorMode
}

export default function Message({ message, mode }: MessageProps) {
  const isUser = message.role === 'user'

  return (
    <div className={cn('flex gap-3', isUser && 'flex-row-reverse')}>
      {/* Avatar */}
      <div className="flex-shrink-0">
        <div className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center',
          isUser ? 'bg-blue-100' : 'bg-purple-100'
        )}>
          {isUser ? (
            <User className="w-4 h-4 text-blue-600" />
          ) : (
            <Bot className="w-4 h-4 text-purple-600" />
          )}
        </div>
      </div>

      {/* Content */}
      <div className={cn('flex-1 space-y-3', isUser && 'flex flex-col items-end')}>
        {/* Main message */}
        <div className={cn(
          'rounded-lg px-4 py-2 max-w-[85%]',
          isUser
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 text-gray-900'
        )}>
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ children }) => <p className={isUser ? 'text-white' : 'text-gray-900'}>{children}</p>,
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
                      className={cn(
                        'px-1.5 py-0.5 rounded text-sm font-mono',
                        isUser
                          ? 'bg-blue-700 text-white'
                          : 'bg-gray-200 text-purple-600'
                      )}
                      {...props}
                    >
                      {children}
                    </code>
                  )
                },
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        </div>

        {/* Metadata - mode-specific content */}
        {!isUser && message.metadata && (
          <div className="max-w-[85%] space-y-3">
            {/* Query results */}
            {mode === 'query' && message.metadata.queryResults && (
              <QueryResults results={message.metadata.queryResults} />
            )}

            {/* Data preview */}
            {mode === 'data' && message.metadata.dataPreview && (
              <DataPreview preview={message.metadata.dataPreview} />
            )}

            {/* Task progress */}
            {mode === 'task' && message.metadata.taskProgress && (
              <TaskProgress progress={message.metadata.taskProgress} />
            )}

            {/* Code blocks */}
            {message.metadata.codeBlocks?.map((block, index) => (
              <CodeBlock
                key={index}
                code={block.code}
                language={block.language}
                filename={block.filename}
              />
            ))}
          </div>
        )}

        {/* Timestamp */}
        <div className={cn('text-xs text-gray-400', isUser && 'text-right')}>
          {new Date(message.timestamp).toLocaleTimeString()}
        </div>
      </div>
    </div>
  )
}
