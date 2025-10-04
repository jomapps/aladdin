/**
 * Scene Editor Component
 *
 * Full scene metadata editor with PayloadCMS integration
 * Handles scene creation, editing, and verification
 */

'use client'

import { useState, useEffect } from 'react'
import { useScenesStore } from '@/stores/scenesStore'
import type { Scene } from '@/stores/scenesStore'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { CheckCircle2, AlertCircle, Loader2, Save, X } from 'lucide-react'
import { toast } from 'sonner'

interface SceneEditorProps {
  scene: Scene | null
  projectId: string
  onClose: () => void
}

export function SceneEditor({ scene, projectId, onClose }: SceneEditorProps) {
  const { updateScene } = useScenesStore()
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    title: scene?.title || '',
    description: scene?.description || '',
    metadata: {
      characters: scene?.metadata?.characters || [],
      location: scene?.metadata?.location || '',
      timeOfDay: scene?.metadata?.timeOfDay || '',
      mood: scene?.metadata?.mood || '',
    },
  })

  const [characterInput, setCharacterInput] = useState('')

  useEffect(() => {
    if (scene) {
      setFormData({
        title: scene.title,
        description: scene.description,
        metadata: {
          characters: scene.metadata?.characters || [],
          location: scene.metadata?.location || '',
          timeOfDay: scene.metadata?.timeOfDay || '',
          mood: scene.metadata?.mood || '',
        },
      })
    }
  }, [scene])

  const handleSave = async () => {
    if (!scene) {
      // Creating new scene
      toast.info('Create scene functionality to be implemented')
      return
    }

    setIsSaving(true)
    try {
      await updateScene(scene.id, formData)
      toast.success('Scene updated successfully')
      onClose()
    } catch (error) {
      toast.error('Failed to update scene')
      console.error('Failed to save scene:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const addCharacter = () => {
    if (characterInput.trim()) {
      setFormData({
        ...formData,
        metadata: {
          ...formData.metadata,
          characters: [...formData.metadata.characters, characterInput.trim()],
        },
      })
      setCharacterInput('')
    }
  }

  const removeCharacter = (index: number) => {
    setFormData({
      ...formData,
      metadata: {
        ...formData.metadata,
        characters: formData.metadata.characters.filter((_, i) => i !== index),
      },
    })
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900 text-white border-slate-800">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {scene ? `Edit Scene ${scene.sceneNumber}` : 'Create New Scene'}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-slate-800/50">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="metadata">Metadata</TabsTrigger>
            <TabsTrigger value="preview">Preview & Verification</TabsTrigger>
          </TabsList>

          {/* Basic Info Tab */}
          <TabsContent value="basic" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="title">Scene Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter scene title"
                className="bg-slate-800/50 border-slate-700"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what happens in this scene"
                rows={6}
                className="bg-slate-800/50 border-slate-700"
              />
            </div>

            {scene && (
              <div className="grid grid-cols-2 gap-4 pt-4">
                <div>
                  <Label className="text-slate-400">Status</Label>
                  <Badge className="mt-1">
                    {scene.status.charAt(0).toUpperCase() + scene.status.slice(1)}
                  </Badge>
                </div>
                {scene.duration && (
                  <div>
                    <Label className="text-slate-400">Duration</Label>
                    <p className="mt-1 text-sm">{scene.duration}s</p>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* Metadata Tab */}
          <TabsContent value="metadata" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Characters</Label>
              <div className="flex gap-2">
                <Input
                  value={characterInput}
                  onChange={(e) => setCharacterInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addCharacter()}
                  placeholder="Add character name"
                  className="bg-slate-800/50 border-slate-700"
                />
                <Button onClick={addCharacter} variant="outline">
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.metadata.characters.map((char, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="gap-2 bg-slate-800/50 border-slate-700"
                  >
                    {char}
                    <X
                      className="h-3 w-3 cursor-pointer hover:text-red-400"
                      onClick={() => removeCharacter(index)}
                    />
                  </Badge>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.metadata.location}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      metadata: { ...formData.metadata, location: e.target.value },
                    })
                  }
                  placeholder="e.g., Downtown Office"
                  className="bg-slate-800/50 border-slate-700"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="timeOfDay">Time of Day</Label>
                <Input
                  id="timeOfDay"
                  value={formData.metadata.timeOfDay}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      metadata: { ...formData.metadata, timeOfDay: e.target.value },
                    })
                  }
                  placeholder="e.g., Morning, Night"
                  className="bg-slate-800/50 border-slate-700"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mood">Mood/Atmosphere</Label>
              <Input
                id="mood"
                value={formData.metadata.mood}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    metadata: { ...formData.metadata, mood: e.target.value },
                  })
                }
                placeholder="e.g., Tense, Romantic, Action-packed"
                className="bg-slate-800/50 border-slate-700"
              />
            </div>
          </TabsContent>

          {/* Preview & Verification Tab */}
          <TabsContent value="preview" className="space-y-4 mt-4">
            {scene?.compositeIterations && scene.compositeIterations > 0 && (
              <div className="space-y-2">
                <Label>Composite Iterations</Label>
                <p className="text-sm text-slate-400">
                  {scene.compositeIterations} iterations completed
                </p>
              </div>
            )}

            {scene?.lastFrameTimecode && (
              <div className="space-y-2">
                <Label>Last Frame</Label>
                <p className="text-sm text-slate-400">{scene.lastFrameTimecode}</p>
              </div>
            )}

            {scene?.verificationStatus && (
              <Alert
                className={
                  scene.verificationStatus === 'verified'
                    ? 'border-green-500/40 bg-green-500/10'
                    : scene.verificationStatus === 'failed'
                      ? 'border-red-500/40 bg-red-500/10'
                      : 'border-slate-700/40 bg-slate-800/40'
                }
              >
                {scene.verificationStatus === 'verified' ? (
                  <CheckCircle2 className="h-4 w-4 text-green-400" />
                ) : scene.verificationStatus === 'failed' ? (
                  <AlertCircle className="h-4 w-4 text-red-400" />
                ) : (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                <AlertDescription>
                  Verification:{' '}
                  {scene.verificationStatus.charAt(0).toUpperCase() +
                    scene.verificationStatus.slice(1)}
                </AlertDescription>
              </Alert>
            )}

            {scene?.thumbnailUrl && (
              <div className="space-y-2">
                <Label>Thumbnail Preview</Label>
                <div className="rounded-lg overflow-hidden border border-slate-700">
                  <img
                    src={scene.thumbnailUrl}
                    alt={scene.title}
                    className="w-full h-auto"
                  />
                </div>
              </div>
            )}

            {!scene && (
              <Alert className="border-slate-700/40 bg-slate-800/40">
                <AlertDescription>
                  Preview will be available after the scene is created and generated.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="gap-2">
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
