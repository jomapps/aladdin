/**
 * Export System Types
 */

export type ExportFormat = 'mp4' | 'webm' | 'mov';

export type ExportQuality = 'low' | 'medium' | 'high' | 'ultra';

export type ExportStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface ExportOptions {
  includeAudio?: boolean;
  codec?: string;
  bitrate?: string;
  watermark?: string;
  startTime?: number;
  endTime?: number;
  filters?: string[];
}

export interface ExportJob {
  id: string;
  videoId: string;
  userId: string;
  format: ExportFormat;
  quality: ExportQuality;
  resolution: string;
  fps: number;
  status: ExportStatus;
  progress: number;
  outputUrl?: string;
  errorMessage?: string;
  createdAt: Date;
  updatedAt?: Date;
  completedAt?: Date;
  options: ExportOptions;
}

export interface ExportPreset {
  name: string;
  format: ExportFormat;
  quality: ExportQuality;
  resolution: string;
  fps: number;
  codec?: string;
  bitrate?: string;
}

export const EXPORT_PRESETS: Record<string, ExportPreset> = {
  'web-720p': {
    name: 'Web HD (720p)',
    format: 'mp4',
    quality: 'high',
    resolution: '1280x720',
    fps: 30,
    codec: 'h264',
    bitrate: '5M',
  },
  'web-1080p': {
    name: 'Web Full HD (1080p)',
    format: 'mp4',
    quality: 'high',
    resolution: '1920x1080',
    fps: 30,
    codec: 'h264',
    bitrate: '8M',
  },
  'web-4k': {
    name: 'Web 4K',
    format: 'mp4',
    quality: 'ultra',
    resolution: '3840x2160',
    fps: 30,
    codec: 'h264',
    bitrate: '20M',
  },
  'social-square': {
    name: 'Social Media (Square)',
    format: 'mp4',
    quality: 'high',
    resolution: '1080x1080',
    fps: 30,
    codec: 'h264',
    bitrate: '6M',
  },
};
