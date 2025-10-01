/**
 * Error Fallback Component
 *
 * UI displayed when an error is caught by ErrorBoundary
 */

'use client'

import React, { ErrorInfo } from 'react'

interface ErrorFallbackProps {
  error: Error | null
  errorInfo?: ErrorInfo | null
  onReset?: () => void
}

export function ErrorFallback({ error, errorInfo, onReset }: ErrorFallbackProps) {
  const isDevelopment = process.env.NODE_ENV === 'development'

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8">
        {/* Error Icon */}
        <div className="flex items-center justify-center w-16 h-16 mx-auto bg-red-100 rounded-full">
          <svg
            className="w-8 h-8 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        {/* Error Title */}
        <h1 className="mt-6 text-3xl font-bold text-center text-gray-900">
          Something went wrong
        </h1>

        {/* Error Message */}
        <p className="mt-4 text-center text-gray-600">
          We apologize for the inconvenience. An unexpected error has occurred.
        </p>

        {/* Error Details (Development Only) */}
        {isDevelopment && error && (
          <div className="mt-6 p-4 bg-red-50 rounded-lg">
            <h2 className="text-sm font-semibold text-red-800 mb-2">Error Details:</h2>
            <div className="space-y-2">
              <div>
                <p className="text-xs font-medium text-red-700">Message:</p>
                <p className="text-sm text-red-600 font-mono">{error.message}</p>
              </div>
              {error.stack && (
                <div>
                  <p className="text-xs font-medium text-red-700">Stack Trace:</p>
                  <pre className="text-xs text-red-600 font-mono overflow-x-auto whitespace-pre-wrap mt-1">
                    {error.stack}
                  </pre>
                </div>
              )}
              {errorInfo?.componentStack && (
                <div>
                  <p className="text-xs font-medium text-red-700">Component Stack:</p>
                  <pre className="text-xs text-red-600 font-mono overflow-x-auto whitespace-pre-wrap mt-1">
                    {errorInfo.componentStack}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          {onReset && (
            <button
              onClick={onReset}
              className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          )}
          <button
            onClick={() => window.location.href = '/'}
            className="px-6 py-3 bg-gray-200 text-gray-800 font-medium rounded-lg hover:bg-gray-300 transition-colors"
          >
            Go to Home
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            Reload Page
          </button>
        </div>

        {/* Help Text */}
        <p className="mt-8 text-sm text-center text-gray-500">
          If this problem persists, please contact support or check the console for more
          details.
        </p>
      </div>
    </div>
  )
}

/**
 * Minimal Error Fallback for inline errors
 */
export function MinimalErrorFallback({ error, onReset }: ErrorFallbackProps) {
  return (
    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
      <div className="flex items-start">
        <svg
          className="w-5 h-5 text-red-600 mt-0.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800">Error occurred</h3>
          <p className="mt-1 text-sm text-red-700">{error?.message || 'Unknown error'}</p>
          {onReset && (
            <button
              onClick={onReset}
              className="mt-2 text-sm text-red-600 hover:text-red-800 font-medium"
            >
              Try again
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
