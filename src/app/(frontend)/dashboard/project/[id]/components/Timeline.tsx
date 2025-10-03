'use client'

/**
 * Video Timeline Component
 * Phase 7: Production Polish
 */

import { useState, useRef } from 'react'
import TimelineClip from './TimelineClip'

interface Scene {
  id: string
  name: string
  startTime: number
  duration: number
  thumbnail?: string
  status: 'draft' | 'processing' | 'complete'
}

interface TimelineProps {
  scenes: Scene[]
  duration: number
  currentTime?: number
  onSeek?: (time: number) => void
  onSceneSelect?: (sceneId: string) => void
}

export default function Timeline({
  scenes,
  duration,
  currentTime = 0,
  onSeek,
  onSceneSelect,
}: TimelineProps) {
  const [zoom, setZoom] = useState(1)
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null)
  const timelineRef = useRef<HTMLDivElement>(null)

  const handleZoomIn = () => setZoom((prev) => Math.min(prev * 1.5, 10))
  const handleZoomOut = () => setZoom((prev) => Math.max(prev / 1.5, 0.5))

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current || !onSeek) return

    const rect = timelineRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const time = (x / rect.width) * duration
    onSeek(Math.max(0, Math.min(time, duration)))
  }

  const handleSceneClick = (sceneId: string) => {
    setSelectedSceneId(sceneId)
    if (onSceneSelect) {
      onSceneSelect(sceneId)
    }
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const currentTimePercent = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-950/70 text-white">
      {/* Controls */}
      <div className="flex flex-col gap-3 border-b border-slate-700/60 bg-slate-900/60 px-4 py-4 text-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={handleZoomOut}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-600/70 bg-slate-900/60 transition hover:border-sky-400/40 hover:bg-slate-900/80"
            title="Zoom out"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          <span className="min-w-[60px] text-center text-sm text-slate-200">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-600/70 bg-slate-900/60 transition hover:border-sky-400/40 hover:bg-slate-900/80"
            title="Zoom in"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </button>
        </div>

        <div className="text-sm font-mono text-slate-200">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>

        <div className="inline-flex items-center gap-2">
          <button
            className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-600/70 bg-slate-900/60 px-4 font-semibold uppercase tracking-[0.3em] text-xs text-slate-100 transition hover:border-sky-400/40 hover:bg-slate-900/80"
          >
            Preview
          </button>
        </div>
      </div>

      {/* Timeline Track */}
      <div className="relative overflow-x-auto px-4 py-6">
        <div
          ref={timelineRef}
          className="relative h-28 cursor-pointer rounded-2xl border border-slate-700/60 bg-slate-900/60"
          style={{ width: `${100 * zoom}%`, minWidth: '100%' }}
          onClick={handleTimelineClick}
        >
          {/* Time markers */}
          <div className="absolute inset-x-0 top-0 h-7 border-b border-slate-700/60">
            {[0, 0.25, 0.5, 0.75, 1].map((fraction) => (
              <div
                key={fraction}
                className="absolute top-0 h-full border-l border-slate-700/60"
                style={{ left: `${fraction * 100}%` }}
              >
                <span className="absolute left-2 top-1 text-[10px] font-medium uppercase tracking-[0.3em] text-slate-200">
                  {formatTime(duration * fraction)}
                </span>
              </div>
            ))}
          </div>

          {/* Scene clips */}
          <div className="absolute inset-x-0 top-7 bottom-0 px-3 py-3">
            {scenes.map((scene) => (
              <TimelineClip
                key={scene.id}
                scene={scene}
                duration={duration}
                isSelected={selectedSceneId === scene.id}
                onClick={() => handleSceneClick(scene.id)}
              />
            ))}
          </div>

          {/* Playhead */}
          <div
            className="pointer-events-none absolute top-0 bottom-0 w-0.5 bg-sky-400"
            style={{ left: `${currentTimePercent}%` }}
          >
            <div className="absolute -top-1 -left-2 h-4 w-4 rounded-sm bg-sky-400" />
          </div>
        </div>
      </div>
    </div>
  )
}
