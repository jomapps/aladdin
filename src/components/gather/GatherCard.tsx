'use client'

/**
 * Gather Card Component
 * Displays a single gather item with expand/collapse, edit, and delete functionality
 */

import { useState } from 'react'
import { ChevronDown, ChevronUp, Edit, Save, Trash2, X, ExternalLink, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { GatherItem } from '@/lib/gather/types'
import { formatDistanceToNow } from 'date-fns'

interface GatherCardProps {
  item: GatherItem
  projectId: string
  onUpdate: () => void
}

export default function GatherCard({ item, projectId, onUpdate }: GatherCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editedContent, setEditedContent] = useState(item.content)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleEdit = () => {
    setIsEditing(true)
    setEditedContent(item.content)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch(`/api/v1/gather/${projectId}/${item._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: JSON.parse(editedContent),
        }),
      })

      if (!response.ok) throw new Error('Failed to save')

      setIsEditing(false)
      onUpdate()
    } catch (error) {
      console.error('Save error:', error)
      alert('Failed to save changes')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditedContent(item.content)
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this item?')) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/v1/gather/${projectId}/${item._id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete')

      onUpdate()
    } catch (error) {
      console.error('Delete error:', error)
      alert('Failed to delete item')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeleteFile = async (fileType: 'image' | 'document') => {
    if (!confirm(`Are you sure you want to remove this ${fileType}?`)) return

    try {
      const response = await fetch(`/api/v1/gather/${projectId}/${item._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          [fileType === 'image' ? 'imageUrl' : 'documentUrl']: null,
        }),
      })

      if (!response.ok) throw new Error('Failed to remove file')

      onUpdate()
    } catch (error) {
      console.error('Remove file error:', error)
      alert('Failed to remove file')
    }
  }

  const lastUpdated =
    typeof item.lastUpdated === 'string' ? new Date(item.lastUpdated) : item.lastUpdated

  return (
    <Card className="mb-4 border-slate-800/70 bg-slate-900/70 text-slate-100 shadow-[0_20px_80px_-60px_rgba(15,23,42,0.8)]">
      <CardHeader className="px-6 py-5">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-400">
              <span className="font-mono text-[11px] text-slate-300">
                {item._id?.toString().slice(-8)}
              </span>
              <span>•</span>
              <span className="text-slate-400">
                {formatDistanceToNow(lastUpdated, { addSuffix: true })}
              </span>
            </div>
            <p className="break-words text-base font-medium text-white">{item.summary}</p>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <Button variant="ghost" size="sm" onClick={() => setIsExpanded(!isExpanded)}>
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={handleDelete} disabled={isDeleting}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="px-6 pb-6">
          <div className={item.imageUrl || item.documentUrl ? 'grid grid-cols-2 gap-4' : ''}>
            {/* Media Column */}
            {(item.imageUrl || item.documentUrl) && (
              <div className="space-y-2">
                {item.imageUrl && (
                  <div className="rounded-2xl border border-slate-800/70 bg-slate-950/50 p-4">
                    <div className="mb-2 flex items-center justify-between text-sm font-medium text-slate-200">
                      <span>📷 Image</span>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteFile('image')}>
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(item.imageUrl, '_blank')}
                        className="border-slate-700/70 bg-slate-900/60 text-slate-100 hover:border-sky-400/40 hover:bg-slate-900/80"
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(item.imageUrl, '_blank')}
                        className="border-slate-700/70 bg-slate-900/60 text-slate-100 hover:border-sky-400/40 hover:bg-slate-900/80"
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>
                )}

                {item.documentUrl && (
                  <div className="rounded-2xl border border-slate-800/70 bg-slate-950/50 p-4">
                    <div className="mb-2 flex items-center justify-between text-sm font-medium text-slate-200">
                      <span>📄 Document</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteFile('document')}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(item.documentUrl, '_blank')}
                        className="border-slate-700/70 bg-slate-900/60 text-slate-100 hover:border-sky-400/40 hover:bg-slate-900/80"
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(item.documentUrl, '_blank')}
                        className="border-slate-700/70 bg-slate-900/60 text-slate-100 hover:border-sky-400/40 hover:bg-slate-900/80"
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Content Column */}
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Content
                </label>
                {isEditing ? (
                  <Textarea
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    rows={8}
                    className="font-mono text-sm"
                  />
                ) : (
                  <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-xl border border-slate-800/70 bg-slate-950/50 p-4 text-sm text-slate-100">
                    {item.content}
                  </pre>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Context
                </label>
                <p className="whitespace-normal break-words text-sm text-slate-200">
                  {item.context}
                </p>
              </div>

              {item.extractedText && (
                <div>
                  <label className="mb-1 block text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Extracted Text
                  </label>
                  <p className="whitespace-normal break-words text-sm text-slate-200">
                    {item.extractedText}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="mt-5 flex gap-2 border-t border-slate-800/70 pt-4">
            {isEditing ? (
              <>
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  size="sm"
                  className="border-sky-400/40 bg-sky-500/20 text-white hover:border-sky-400/60 hover:bg-sky-500/30"
                >
                  <Save className="w-4 h-4 mr-1" />
                  {isSaving ? 'Saving...' : 'Save'}
                </Button>
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  size="sm"
                  className="border-slate-700/70 bg-slate-900/60 text-white hover:border-sky-400/40 hover:bg-slate-900/80"
                >
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={handleEdit}
                  variant="outline"
                  size="sm"
                  className="border-slate-700/70 bg-slate-900/60 text-white hover:border-sky-400/40 hover:bg-slate-900/80"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                <Button
                  onClick={handleDelete}
                  variant="destructive"
                  size="sm"
                  disabled={isDeleting}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  {isDeleting ? 'Deleting...' : 'Delete Card'}
                </Button>
              </>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  )
}
