'use client';

/**
 * Video Export Dialog Component
 */

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { EXPORT_PRESETS } from '@/lib/export/types';

export interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
  videoId: string;
}

export function ExportDialog({ open, onClose, videoId }: ExportDialogProps) {
  const params = useParams();
  const projectId = params.id as string;

  const [preset, setPreset] = useState('web-1080p');
  const [format, setFormat] = useState('mp4');
  const [quality, setQuality] = useState('high');
  const [loading, setLoading] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  useEffect(() => {
    if (jobId) {
      const interval = setInterval(async () => {
        try {
          const response = await fetch(`/api/v1/projects/${projectId}/export/${jobId}`);
          const data = await response.json();

          setStatus(data.status);
          setProgress(data.progress);

          if (data.status === 'completed') {
            setDownloadUrl(data.url);
            clearInterval(interval);
          } else if (data.status === 'failed') {
            clearInterval(interval);
          }
        } catch (err) {
          console.error('Failed to fetch job status:', err);
        }
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [jobId, projectId]);

  const handleExport = async () => {
    setLoading(true);

    try {
      const selectedPreset = EXPORT_PRESETS[preset];

      const response = await fetch(`/api/v1/projects/${projectId}/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId,
          format: selectedPreset.format,
          quality: selectedPreset.quality,
          resolution: selectedPreset.resolution,
          fps: selectedPreset.fps,
          options: {
            codec: selectedPreset.codec,
            bitrate: selectedPreset.bitrate,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Export failed');
      }

      setJobId(data.id);
      setStatus('pending');
    } catch (err: any) {
      console.error('Export error:', err);
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (downloadUrl) {
      window.open(`/api/v1/projects/${projectId}/export/${jobId}/download`, '_blank');
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">Export Video</h2>

        {!jobId ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Export Preset</label>
              <select
                value={preset}
                onChange={(e) => setPreset(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              >
                {Object.entries(EXPORT_PRESETS).map(([key, p]) => (
                  <option key={key} value={key}>
                    {p.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {EXPORT_PRESETS[preset].resolution} @ {EXPORT_PRESETS[preset].fps}fps
              </p>
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
                onClick={handleExport}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                disabled={loading}
              >
                Start Export
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Status: {status}</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-blue-600 h-2.5 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {status === 'completed' && (
              <button
                onClick={handleDownload}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Download
              </button>
            )}

            {status === 'failed' && (
              <div className="text-red-600 text-sm">Export failed. Please try again.</div>
            )}

            <button
              onClick={onClose}
              className="w-full px-4 py-2 border rounded-md hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
