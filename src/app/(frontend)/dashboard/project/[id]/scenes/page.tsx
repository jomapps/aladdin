'use client'

/**
 * Scenes Page
 *
 * Scene list with generation controls and video preview
 */

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useScenesStore } from '@/stores/scenesStore'
import { SceneEditor } from '@/components/scenes/SceneEditor'
import { VideoTimeline } from '@/components/scenes/VideoTimeline'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Film,
  Play,
  Edit3,
  Trash2,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Plus,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export default function ScenesPage() {
  const params = useParams()
  const projectId = params.id as string

  const { scenes, selectedScene, isLoading, fetchScenes, generateScene, selectScene, deleteScene } =
    useScenesStore()

  const [isEditorOpen, setIsEditorOpen] = useState(false)

  useEffect(() => {
    if (projectId) {
      fetchScenes(projectId)
    }
  }, [projectId, fetchScenes])

  const handleGenerateScene = async (sceneId: string) => {
    try {
      await generateScene(projectId, sceneId)
      toast.success('Scene generation started')
    } catch (error) {
      toast.error('Failed to generate scene')
    }
  }

  const handleEditScene = (scene: typeof scenes[0]) => {
    selectScene(scene)
    setIsEditorOpen(true)
  }

  const handleDeleteScene = async (sceneId: string) => {
    if (confirm('Are you sure you want to delete this scene?')) {
      try {
        await deleteScene(sceneId)
        toast.success('Scene deleted')
      } catch (error) {
        toast.error('Failed to delete scene')
      }
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ready':
        return <CheckCircle2 className="h-5 w-5 text-green-400" />
      case 'generating':
        return <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
      case 'failed':
        return <AlertCircle className="h-5 w-5 text-red-400" />
      default:
        return <Film className="h-5 w-5 text-slate-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready':
        return 'bg-green-500/20 text-green-300 border-green-500/40'
      case 'generating':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40'
      case 'failed':
        return 'bg-red-500/20 text-red-300 border-red-500/40'
      default:
        return 'bg-slate-500/20 text-slate-300 border-slate-500/40'
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl space-y-6 px-6 py-10">
        <Skeleton className="h-12 w-96 bg-slate-800/60" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64 bg-slate-800/60" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-6 py-10 text-white">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">Scenes</h1>
          <p className="mt-2 text-sm text-slate-400">
            Manage and generate video scenes for your project
          </p>
        </div>
        <Button
          onClick={() => {
            selectScene(null)
            setIsEditorOpen(true)
          }}
          className="gap-2 bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Create Scene
        </Button>
      </div>

      {/* Scenes Grid */}
      {scenes.length === 0 ? (
        <Alert className="border-slate-700/40 bg-slate-800/40">
          <Film className="h-4 w-4" />
          <AlertDescription>
            No scenes created yet. Create your first scene to get started.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {scenes.map((scene) => (
            <Card
              key={scene.id}
              className={cn(
                'group relative overflow-hidden border transition-all hover:border-blue-500/40',
                scene.status === 'generating'
                  ? 'border-blue-500/40 bg-blue-500/5'
                  : 'border-slate-800/60 bg-slate-900/40'
              )}
            >
              {/* Thumbnail/Preview */}
              <div className="relative aspect-video w-full overflow-hidden bg-slate-950">
                {scene.thumbnailUrl ? (
                  <img
                    src={scene.thumbnailUrl}
                    alt={scene.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Film className="h-12 w-12 text-slate-700" />
                  </div>
                )}

                {/* Status Overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                  {scene.status === 'ready' && scene.videoUrl && (
                    <Button
                      size="icon"
                      onClick={() => selectScene(scene)}
                      className="h-12 w-12 rounded-full bg-white/90 text-black hover:bg-white"
                    >
                      <Play className="h-6 w-6" />
                    </Button>
                  )}
                </div>
              </div>

              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">Scene {scene.sceneNumber}</span>
                      {getStatusIcon(scene.status)}
                    </div>
                    <CardTitle className="mt-1 text-base text-white">{scene.title}</CardTitle>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                <p className="line-clamp-2 text-sm text-slate-400">{scene.description}</p>

                <div className="flex flex-wrap gap-2">
                  <Badge className={cn('border text-xs', getStatusColor(scene.status))}>
                    {scene.status.charAt(0).toUpperCase() + scene.status.slice(1)}
                  </Badge>
                  {scene.duration && (
                    <Badge variant="outline" className="text-xs">
                      {scene.duration}s
                    </Badge>
                  )}
                  {scene.compositeIterations > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {scene.compositeIterations} iterations
                    </Badge>
                  )}
                </div>

                {/* Metadata */}
                {scene.metadata && (
                  <div className="text-xs text-slate-500">
                    {scene.metadata.location && <div>📍 {scene.metadata.location}</div>}
                    {scene.metadata.timeOfDay && <div>🕐 {scene.metadata.timeOfDay}</div>}
                  </div>
                )}

                {/* Verification Status */}
                {scene.verificationStatus && scene.verificationStatus !== 'pending' && (
                  <Badge
                    className={cn(
                      'text-xs',
                      scene.verificationStatus === 'verified'
                        ? 'bg-green-500/20 text-green-300'
                        : 'bg-red-500/20 text-red-300'
                    )}
                  >
                    {scene.verificationStatus === 'verified' ? 'Verified' : 'Verification Failed'}
                  </Badge>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  {scene.status === 'draft' && (
                    <Button
                      size="sm"
                      onClick={() => handleGenerateScene(scene.id)}
                      className="flex-1 gap-2"
                    >
                      <Play className="h-3 w-3" />
                      Generate
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEditScene(scene)}
                    className="gap-2"
                  >
                    <Edit3 className="h-3 w-3" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteScene(scene.id)}
                    className="gap-2 border-red-500/40 text-red-400 hover:bg-red-500/10"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Scene Editor Dialog */}
      {isEditorOpen && (
        <SceneEditor
          scene={selectedScene}
          projectId={projectId}
          onClose={() => {
            setIsEditorOpen(false)
            selectScene(null)
          }}
        />
      )}

      {/* Video Timeline for Preview */}
      {selectedScene?.videoUrl && (
        <VideoTimeline
          scene={selectedScene}
          onClose={() => selectScene(null)}
        />
      )}
    </div>
  )
}
