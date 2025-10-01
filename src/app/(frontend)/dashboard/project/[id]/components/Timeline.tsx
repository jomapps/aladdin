'use client'

/**
 * Video Timeline Component
 * Phase 7: Production Polish
 */

import { useState, useRef, useEffect } from 'react'
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
  const [isDragging, setIsDragging] = useState(false)
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

  const currentTimePercent = (currentTime / duration) * 100

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Controls */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2">
          <button
            onClick={handleZoomOut}
            className="p-2 hover:bg-white rounded border border-gray-300 transition-colors"
            title="Zoom out"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          <span className="text-sm text-gray-600 min-w-[60px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            className="p-2 hover:bg-white rounded border border-gray-300 transition-colors"
            title="Zoom in"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </button>
        </div>

        <div className="text-sm font-mono text-gray-700">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>

        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-white rounded border border-gray-300 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Timeline Track */}
      <div className="relative p-4 overflow-x-auto">
        <div
          ref={timelineRef}
          className="relative h-24 bg-gray-100 rounded cursor-pointer"
          style={{ width: `${100 * zoom}%`, minWidth: '100%' }}
          onClick={handleTimelineClick}
        >
          {/* Time markers */}
          <div className="absolute inset-x-0 top-0 h-6 border-b border-gray-300">
            {[0, 0.25, 0.5, 0.75, 1].map((fraction) => (
              <div
                key={fraction}
                className="absolute top-0 h-full border-l border-gray-400"
                style={{ left: `${fraction * 100}%` }}
              >
                <span className="absolute top-0 left-1 text-xs text-gray-600">
                  {formatTime(duration * fraction)}
                </span>
              </div>
            ))}
          </div>

          {/* Scene clips */}
          <div className="absolute inset-x-0 top-6 bottom-0 p-2">
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
            className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10 pointer-events-none"
            style={{ left: `${currentTimePercent}%` }}
          >
            <div className="absolute -top-1 -left-2 w-4 h-4 bg-red-500 rounded-sm" />
          </div>
        </div>
      </div>
    </div>
  )
}
