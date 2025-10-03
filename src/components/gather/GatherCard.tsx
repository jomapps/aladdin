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
    <Card className="mb-4">
      <CardHeader className="px-6 py-5">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
              <span className="font-mono text-xs">{item._id?.toString().slice(-8)}</span>
              <span>•</span>
              <span>{formatDistanceToNow(lastUpdated, { addSuffix: true })}</span>
            </div>
            <p className="text-base text-gray-700 whitespace-normal break-words">{item.summary}</p>
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
                  <div className="border rounded p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">📷 Image</span>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteFile('image')}>
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(item.imageUrl, '_blank')}
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(item.imageUrl, '_blank')}
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>
                )}

                {item.documentUrl && (
                  <div className="border rounded p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">📄 Document</span>
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
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(item.documentUrl, '_blank')}
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
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Content:</label>
                {isEditing ? (
                  <Textarea
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    rows={8}
                    className="font-mono text-sm"
                  />
                ) : (
                  <pre className="text-sm bg-gray-50 p-3 rounded border max-h-64 whitespace-pre-wrap break-words overflow-auto">
                    {item.content}
                  </pre>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Context:</label>
                <p className="text-sm text-gray-600 whitespace-normal break-words">
                  {item.context}
                </p>
              </div>

              {item.extractedText && (
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">
                    Extracted Text:
                  </label>
                  <p className="text-sm text-gray-600 whitespace-normal break-words">
                    {item.extractedText}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-4 pt-4 border-t">
            {isEditing ? (
              <>
                <Button onClick={handleSave} disabled={isSaving} size="sm">
                  <Save className="w-4 h-4 mr-1" />
                  {isSaving ? 'Saving...' : 'Save'}
                </Button>
                <Button onClick={handleCancel} variant="outline" size="sm">
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button onClick={handleEdit} variant="outline" size="sm">
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
