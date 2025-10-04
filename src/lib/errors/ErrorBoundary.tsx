'use client'

/**
 * React Error Boundary Component
 * Phase 7: Production Polish
 */

import { Component, ReactNode } from 'react'
import { logError } from './logger'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: any) => void
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    // Log error
    logError('ErrorBoundary', error, {
      componentStack: errorInfo.componentStack,
    })

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
    })
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-6 py-16 text-slate-100">
          <div className="pointer-events-none absolute inset-0 opacity-80" aria-hidden>
            <div className="absolute inset-0 bg-[linear-gradient(160deg,#020617_0%,#050b19_55%,#0b172f_100%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(900px_circle_at_20%_80%,rgba(56,189,248,0.35),transparent_70%)] mix-blend-screen" />
            <div className="absolute inset-0 bg-[radial-gradient(800px_circle_at_80%_20%,rgba(124,58,237,0.32),transparent_72%)] mix-blend-screen" />
          </div>

          <div className="relative z-10 w-full max-w-lg space-y-6 rounded-3xl border border-white/12 bg-white/6 p-8 shadow-[0_55px_160px_-85px_rgba(56,189,248,0.85)] backdrop-blur-xl">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-400/40 bg-amber-500/15 text-2xl shadow-[0_30px_90px_-60px_rgba(249,115,22,0.8)]">
                ⚠️
              </div>
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-slate-100">
                  Something went wrong
                </h2>
                <p className="text-sm text-slate-300">
                  We&rsquo;re sorry, but something unexpected happened. Please try again.
                </p>
              </div>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="rounded-2xl border border-white/10 bg-white/6 p-4 text-sm text-slate-200">
                <summary className="cursor-pointer text-slate-300 hover:text-sky-200">
                  Error details (development only)
                </summary>
                <pre className="mt-3 max-h-48 overflow-auto rounded-xl border border-white/10 bg-slate-950/80 p-3 text-xs text-slate-200">
                  {this.state.error.message}
                  {'\n\n'}
                  {this.state.error.stack}
                </pre>
              </details>
            )}

            <div className="flex gap-3">
              <button
                onClick={this.handleReset}
                className="flex-1 rounded-xl border border-sky-400/40 bg-sky-500/20 px-4 py-3 font-semibold text-sky-100 transition hover:border-sky-300/60 hover:bg-sky-500/30"
              >
                Try Again
              </button>
              <button
                onClick={() => (window.location.href = '/dashboard')}
                className="flex-1 rounded-xl border border-white/15 bg-white/10 px-4 py-3 font-semibold text-slate-100 transition hover:border-white/25 hover:bg-white/16"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Wrapper component for easier use
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode,
): React.ComponentType<P> {
  return function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    )
  }
}
