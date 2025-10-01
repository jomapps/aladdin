/**
 * Export Format Handlers
 * Handles different video export formats and their specific configurations
 */

export type ExportFormat = 'mp4' | 'webm' | 'mov' | 'avi';
export type ExportQuality = 'low' | 'medium' | 'high' | 'ultra';

export interface ExportOptions {
  includeAudio?: boolean;
  codec?: string;
  bitrate?: string;
  watermark?: {
    enabled: boolean;
    text?: string;
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  };
  customSettings?: Record<string, any>;
}

export interface ExportJob {
  id: string;
  videoId: string;
  userId: string;
  format: ExportFormat;
  quality: ExportQuality;
  resolution: string;
  fps: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  outputUrl?: string;
  error?: string;
  options: ExportOptions;
}

export interface FormatConfig {
  extension: string;
  mimeType: string;
  defaultCodec: string;
  supportedCodecs: string[];
  qualityPresets: Record<ExportQuality, {
    bitrate: string;
    preset?: string;
    crf?: number;
  }>;
}

export const FORMAT_CONFIGS: Record<ExportFormat, FormatConfig> = {
  mp4: {
    extension: 'mp4',
    mimeType: 'video/mp4',
    defaultCodec: 'libx264',
    supportedCodecs: ['libx264', 'libx265', 'h264_nvenc'],
    qualityPresets: {
      low: { bitrate: '500k', crf: 28 },
      medium: { bitrate: '1500k', crf: 23 },
      high: { bitrate: '5000k', crf: 20 },
      ultra: { bitrate: '10000k', crf: 18 },
    },
  },
  webm: {
    extension: 'webm',
    mimeType: 'video/webm',
    defaultCodec: 'libvpx-vp9',
    supportedCodecs: ['libvpx', 'libvpx-vp9'],
    qualityPresets: {
      low: { bitrate: '400k', crf: 35 },
      medium: { bitrate: '1200k', crf: 31 },
      high: { bitrate: '4000k', crf: 24 },
      ultra: { bitrate: '8000k', crf: 20 },
    },
  },
  mov: {
    extension: 'mov',
    mimeType: 'video/quicktime',
    defaultCodec: 'libx264',
    supportedCodecs: ['libx264', 'prores', 'h264_videotoolbox'],
    qualityPresets: {
      low: { bitrate: '500k', crf: 28 },
      medium: { bitrate: '1500k', crf: 23 },
      high: { bitrate: '5000k', crf: 20 },
      ultra: { bitrate: '10000k', crf: 18 },
    },
  },
  avi: {
    extension: 'avi',
    mimeType: 'video/x-msvideo',
    defaultCodec: 'libxvid',
    supportedCodecs: ['libxvid', 'mpeg4'],
    qualityPresets: {
      low: { bitrate: '500k' },
      medium: { bitrate: '1500k' },
      high: { bitrate: '5000k' },
      ultra: { bitrate: '10000k' },
    },
  },
};

export class FormatHandler {
  static getConfig(format: ExportFormat): FormatConfig {
    return FORMAT_CONFIGS[format];
  }

  static getQualitySettings(format: ExportFormat, quality: ExportQuality) {
    return FORMAT_CONFIGS[format].qualityPresets[quality];
  }

  static validateFormat(format: string): format is ExportFormat {
    return format in FORMAT_CONFIGS;
  }

  static getMimeType(format: ExportFormat): string {
    return FORMAT_CONFIGS[format].mimeType;
  }

  static getExtension(format: ExportFormat): string {
    return FORMAT_CONFIGS[format].extension;
  }
}
