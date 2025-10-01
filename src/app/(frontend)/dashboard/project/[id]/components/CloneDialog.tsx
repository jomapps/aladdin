'use client';

/**
 * Clone Content Dialog Component
 */

import { useState } from 'react';
import { useParams } from 'next/navigation';

export interface CloneDialogProps {
  open: boolean;
  onClose: () => void;
  sourceProjectId?: string;
}

export function CloneDialog({ open, onClose, sourceProjectId }: CloneDialogProps) {
  const params = useParams();
  const targetProjectId = params.id as string;

  const [contentType, setContentType] = useState<string>('character');
  const [documentId, setDocumentId] = useState('');
  const [includeMedia, setIncludeMedia] = useState(true);
  const [includeBrainData, setIncludeBrainData] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleClone = async () => {
    if (!documentId || !sourceProjectId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/v1/projects/${targetProjectId}/clone/content`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceProjectId,
          contentType,
          documentId,
          options: {
            includeMedia,
            includeBrainData,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Clone failed');
      }

      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">Clone Content</h2>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            Content cloned successfully!
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Content Type</label>
            <select
              value={contentType}
              onChange={(e) => setContentType(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="character">Character</option>
              <option value="scene">Scene</option>
              <option value="episode">Episode</option>
              <option value="location">Location</option>
              <option value="prop">Prop</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Document ID</label>
            <input
              type="text"
              value={documentId}
              onChange={(e) => setDocumentId(e.target.value)}
              placeholder="char_001"
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={includeMedia}
                onChange={(e) => setIncludeMedia(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm">Include media files</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={includeBrainData}
                onChange={(e) => setIncludeBrainData(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm">Include Brain data</span>
            </label>
          </div>
        </div>

        <div className="mt-6 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-md hover:bg-gray-50"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleClone}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            disabled={loading || !documentId}
          >
            {loading ? 'Cloning...' : 'Clone'}
          </button>
        </div>
      </div>
    </div>
  );
}
