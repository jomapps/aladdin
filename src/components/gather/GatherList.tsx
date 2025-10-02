'use client'

/**
 * Gather List Component
 * Displays a list of gather items
 */

import { GatherItem } from '@/lib/gather/types'
import GatherCard from './GatherCard'

interface GatherListProps {
  items: GatherItem[]
  projectId: string
  onUpdate: () => void
}

export default function GatherList({ items, projectId, onUpdate }: GatherListProps) {
  return (
    <div className="space-y-4">
      {items.map((item) => (
        <GatherCard
          key={item._id?.toString()}
          item={item}
          projectId={projectId}
          onUpdate={onUpdate}
        />
      ))}
    </div>
  )
}

