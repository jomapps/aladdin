/**
 * Message Component
 * Single message with mode-specific rendering
 */

'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Message as MessageType, OrchestratorMode } from '@/stores/orchestratorStore'
import { User, Bot, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useGatherStore } from '@/stores/gatherStore'
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
  const { selectionMode, selectedMessages, toggleMessageSelection } = useGatherStore()
  const isSelected = selectedMessages.includes(message.id)

  const handleClick = () => {
    if (selectionMode) {
      toggleMessageSelection(message.id)
    }
  }

  return (
    <div
      className={cn(
        'flex gap-3 relative',
        isUser && 'flex-row-reverse',
        selectionMode && 'cursor-pointer',
        isSelected && 'bg-blue-50 dark:bg-blue-950/20 rounded-lg p-2 -m-2',
      )}
      onClick={handleClick}
    >
      {/* Selection Checkbox */}
      {selectionMode && (
        <div className="absolute -left-2 top-1/2 -translate-y-1/2 z-10">
          <div
            className={cn(
              'w-5 h-5 rounded border-2 flex items-center justify-center transition-colors',
              isSelected
                ? 'bg-blue-600 border-blue-600'
                : 'bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700',
            )}
          >
            {isSelected && <Check className="w-3 h-3 text-white" />}
          </div>
        </div>
      )}

      {/* Avatar */}
      <div className="flex-shrink-0">
        <div
          className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center',
            isUser ? 'bg-blue-100 dark:bg-blue-900' : 'bg-purple-100 dark:bg-purple-900',
          )}
        >
          {isUser ? (
            <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          ) : (
            <Bot className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          )}
        </div>
      </div>

      {/* Content */}
      <div className={cn('flex-1 space-y-3', isUser && 'flex flex-col items-end')}>
        {/* Main message */}
        <div
          className={cn(
            'rounded-lg px-4 py-2 max-w-[85%]',
            isUser
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-zinc-100',
          )}
        >
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ children }) => (
                  <p className={isUser ? 'text-white' : 'text-gray-900'}>{children}</p>
                ),
                code: ({ node, inline, className, children, ...props }) => {
                  const match = /language-(\w+)/.exec(className || '')
                  const language = match ? match[1] : ''

                  if (!inline && language) {
                    return (
                      <CodeBlock code={String(children).replace(/\n$/, '')} language={language} />
                    )
                  }

                  return (
                    <code
                      className={cn(
                        'px-1.5 py-0.5 rounded text-sm font-mono',
                        isUser ? 'bg-blue-700 text-white' : 'bg-gray-200 text-purple-600',
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
