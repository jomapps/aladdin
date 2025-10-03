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
    draft: 'from-slate-500/20 to-slate-700/20 border-white/10',
    processing: 'from-amber-400/30 to-orange-500/20 border-amber-300/30',
    complete: 'from-sky-400/35 to-indigo-500/25 border-sky-300/30',
  }

  return (
    <div
      className={`
        absolute h-full cursor-pointer overflow-hidden rounded-2xl border
        bg-gradient-to-r shadow-[0_20px_60px_-40px_rgba(56,189,248,0.6)] transition-all
        ${statusColors[scene.status]}
        ${isSelected ? 'ring-2 ring-sky-400' : ''}
        hover:brightness-110
      `}
      style={{
        left: `${startPercent}%`,
        width: `${widthPercent}%`,
        minWidth: '40px',
      }}
      onClick={onClick}
      title={scene.name}
    >
      <div className="flex h-full items-center gap-2 overflow-hidden px-3 py-2 text-xs font-semibold text-slate-200">
        {scene.thumbnail && (
          <img
            src={scene.thumbnail}
            alt={scene.name}
            className="h-full w-auto object-cover rounded"
          />
        )}
        <span className="truncate tracking-wide">{scene.name}</span>
      </div>
    </div>
  )
}
