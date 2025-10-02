'use client'

/**
 * Animated Progress Component
 *
 * Shows animated progress bar with elapsed time counter
 * Used during department evaluation processing
 */

import { useEffect, useState } from 'react'

export function AnimatedProgress() {
  const [elapsedTime, setElapsedTime] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime((prev) => prev + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  return (
    <div className="space-y-2">
      <div className="relative h-2 bg-secondary rounded-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 animate-pulse" />
        <div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          style={{
            animation: 'shimmer 2s infinite',
          }}
        />
      </div>
      <div className="text-xs text-muted-foreground text-center">
        Time: {formatTime(elapsedTime)}
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  )
}
