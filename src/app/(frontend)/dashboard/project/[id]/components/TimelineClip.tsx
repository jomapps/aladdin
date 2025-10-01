'use client'

/**
 * Timeline Clip Component
 * Phase 7: Production Polish
 */

interface Scene {
  id: string
  name: string
  startTime: number
  duration: number
  thumbnail?: string
  status: 'draft' | 'processing' | 'complete'
}

interface TimelineClipProps {
  scene: Scene
  duration: number
  isSelected: boolean
  onClick: () => void
}

export default function TimelineClip({ scene, duration, isSelected, onClick }: TimelineClipProps) {
  const startPercent = (scene.startTime / duration) * 100
  const widthPercent = (scene.duration / duration) * 100

  const statusColors = {
    draft: 'bg-gray-300 border-gray-400',
    processing: 'bg-yellow-200 border-yellow-400',
    complete: 'bg-blue-200 border-blue-400',
  }

  return (
    <div
      className={`
        absolute h-full rounded cursor-pointer transition-all
        border-2
        ${statusColors[scene.status]}
        ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
        hover:brightness-95
      `}
      style={{
        left: `${startPercent}%`,
        width: `${widthPercent}%`,
        minWidth: '40px',
      }}
      onClick={onClick}
      title={scene.name}
    >
      <div className="h-full p-1 flex items-center overflow-hidden">
        {scene.thumbnail && (
          <img
            src={scene.thumbnail}
            alt={scene.name}
            className="h-full w-auto object-cover rounded"
          />
        )}
        <span className="text-xs font-medium text-gray-800 ml-1 truncate">{scene.name}</span>
      </div>
    </div>
  )
}
