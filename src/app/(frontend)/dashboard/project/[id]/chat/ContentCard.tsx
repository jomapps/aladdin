'use client'

/**
 * Content Card Component
 * Displays structured content (characters, scenes, etc.) in card format
 */

export interface ContentCardProps {
  content: string
}

export default function ContentCard({ content }: ContentCardProps) {
  try {
    const data = JSON.parse(content)

    // Character card
    if (data.type === 'character' || data.character) {
      return <CharacterCard data={data} />
    }

    // Scene card
    if (data.type === 'scene' || data.scene) {
      return <SceneCard data={data} />
    }

    // Generic data card
    return <GenericCard data={data} />
  } catch {
    return null
  }
}

function CharacterCard({ data }: { data: any }) {
  const character = data.character || data

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {character.name}
          </h3>
          {character.role && (
            <span className="inline-block mt-1 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
              {character.role}
            </span>
          )}
        </div>
        {character.qualityRating && (
          <div className="text-right">
            <div className="text-xs text-gray-500">Quality</div>
            <div className="text-lg font-bold text-green-600">
              {(character.qualityRating * 100).toFixed(0)}%
            </div>
          </div>
        )}
      </div>

      {character.personality && character.personality.traits && (
        <div className="mb-3">
          <h4 className="text-sm font-medium text-gray-700 mb-1">
            Personality Traits
          </h4>
          <div className="flex flex-wrap gap-1">
            {character.personality.traits.map((trait: string, i: number) => (
              <span
                key={i}
                className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
              >
                {trait}
              </span>
            ))}
          </div>
        </div>
      )}

      {character.backstory && (
        <div className="mb-3">
          <h4 className="text-sm font-medium text-gray-700 mb-1">Backstory</h4>
          <p className="text-sm text-gray-600">{character.backstory}</p>
        </div>
      )}

      {character.appearance && character.appearance.hairstyle && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-1">Hairstyle</h4>
          <p className="text-sm text-gray-600">
            {character.appearance.hairstyle.style} -{' '}
            {character.appearance.hairstyle.color}
          </p>
        </div>
      )}
    </div>
  )
}

function SceneCard({ data }: { data: any }) {
  const scene = data.scene || data

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {scene.name || 'Scene'}
      </h3>
      {scene.description && (
        <p className="text-sm text-gray-600">{scene.description}</p>
      )}
    </div>
  )
}

function GenericCard({ data }: { data: any }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <pre className="text-xs text-gray-700 overflow-x-auto">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  )
}
