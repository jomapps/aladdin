/**
 * CodeBlock Component
 * Displays code with syntax highlighting and copy button
 */

'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CodeBlockProps {
  code: string
  language?: string
  filename?: string
  className?: string
}

export default function CodeBlock({ code, language = 'typescript', filename, className }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy code:', error)
    }
  }

  return (
    <div className={cn('relative group rounded-lg overflow-hidden border border-gray-200', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-2">
          {filename && (
            <span className="text-sm font-medium text-gray-700">{filename}</span>
          )}
          <span className="text-xs text-gray-500 uppercase">{language}</span>
        </div>

        {/* Copy button */}
        <button
          onClick={handleCopy}
          className={cn(
            'flex items-center gap-1 px-2 py-1 rounded text-xs',
            'transition-colors',
            copied
              ? 'bg-green-100 text-green-700'
              : 'hover:bg-gray-200 text-gray-600'
          )}
          title={copied ? 'Copied!' : 'Copy code'}
        >
          {copied ? (
            <>
              <Check className="w-3 h-3" />
              Copied
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              Copy
            </>
          )}
        </button>
      </div>

      {/* Code content */}
      <div className="p-4 bg-gray-900 overflow-x-auto">
        <pre className="text-sm text-gray-100 font-mono">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  )
}
