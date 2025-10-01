import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { VideoExporter } from '@/lib/export/VideoExporter';
import { prisma } from '@/lib/prisma';
import { ExportFormat, ExportQuality } from '@/types/export';
import fs from 'fs/promises';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';

describe('Video Exporter Integration Tests', () => {
  let testUserId: string;
  let testProjectId: string;
  let exporter: VideoExporter;

  beforeEach(async () => {
    const user = await prisma.user.create({
      data: {
        email: 'export-test@test.com',
        name: 'Export Test User',
        password: 'hashedpassword',
      },
    });
    testUserId = user.id;

    const project = await prisma.project.create({
      data: {
        title: 'Export Test Project',
        ownerId: testUserId,
      },
    });
    testProjectId = project.id;

    exporter = new VideoExporter();
  });

  afterEach(async () => {
    await prisma.episode.deleteMany({ where: { projectId: testProjectId } });
    await prisma.scene.deleteMany({ where: { projectId: testProjectId } });
    await prisma.project.delete({ where: { id: testProjectId } });
    await prisma.user.delete({ where: { id: testUserId } });
  });

  describe('MP4 Export (H.264)', () => {
    it('should export episode to MP4 format', async () => {
      const episode = await prisma.episode.create({
        data: {
          title: 'Test Episode',
          projectId: testProjectId,
        },
      });

      const scene = await prisma.scene.create({
        data: {
          title: 'Scene 1',
          videoFile: '/test-assets/scene1.mp4',
          duration: 30,
          episodeId: episode.id,
          projectId: testProjectId,
        },
      });

      const result = await exporter.export({
        episodeId: episode.id,
        format: ExportFormat.MP4,
        quality: ExportQuality.HD_1080P,
        userId: testUserId,
      });

      expect(result.success).toBe(true);
      expect(result.outputPath).toContain('.mp4');
      expect(result.format).toBe(ExportFormat.MP4);

      // Verify file exists
      const fileExists = await fs.access(result.outputPath).then(() => true).catch(() => false);
      expect(fileExists).toBe(true);
    });

    it('should use H.264 codec for MP4', async () => {
      const episode = await prisma.episode.create({
        data: { title: 'Episode', projectId: testProjectId },
      });

      await prisma.scene.create({
        data: {
          title: 'Scene',
          videoFile: '/test-assets/scene.mp4',
          duration: 10,
          episodeId: episode.id,
          projectId: testProjectId,
        },
      });

      const result = await exporter.export({
        episodeId: episode.id,
        format: ExportFormat.MP4,
        quality: ExportQuality.HD_720P,
        userId: testUserId,
      });

      expect(result.codec).toBe('libx264');
    });

    it('should set appropriate bitrate for MP4 quality', async () => {
      const episode = await prisma.episode.create({
        data: { title: 'Episode', projectId: testProjectId },
      });

      await prisma.scene.create({
        data: {
          title: 'Scene',
          videoFile: '/test-assets/scene.mp4',
          duration: 15,
          episodeId: episode.id,
          projectId: testProjectId,
        },
      });

      const result = await exporter.export({
        episodeId: episode.id,
        format: ExportFormat.MP4,
        quality: ExportQuality.UHD_4K,
        userId: testUserId,
      });

      expect(result.bitrate).toContain('8000k'); // 4K bitrate
    });

    it('should export MP4 with audio track', async () => {
      const episode = await prisma.episode.create({
        data: { title: 'Episode', projectId: testProjectId },
      });

      await prisma.scene.create({
        data: {
          title: 'Scene',
          videoFile: '/test-assets/scene-with-audio.mp4',
          audioFile: '/test-assets/audio.mp3',
          duration: 20,
          episodeId: episode.id,
          projectId: testProjectId,
        },
      });

      const result = await exporter.export({
        episodeId: episode.id,
        format: ExportFormat.MP4,
        quality: ExportQuality.HD_1080P,
        includeAudio: true,
        userId: testUserId,
      });

      expect(result.hasAudio).toBe(true);
    });
  });

  describe('WebM Export (VP9)', () => {
    it('should export episode to WebM format', async () => {
      const episode = await prisma.episode.create({
        data: { title: 'Episode', projectId: testProjectId },
      });

      await prisma.scene.create({
        data: {
          title: 'Scene',
          videoFile: '/test-assets/scene.mp4',
          duration: 25,
          episodeId: episode.id,
          projectId: testProjectId,
        },
      });

      const result = await exporter.export({
        episodeId: episode.id,
        format: ExportFormat.WEBM,
        quality: ExportQuality.HD_1080P,
        userId: testUserId,
      });

      expect(result.success).toBe(true);
      expect(result.outputPath).toContain('.webm');
      expect(result.format).toBe(ExportFormat.WEBM);
    });

    it('should use VP9 codec for WebM', async () => {
      const episode = await prisma.episode.create({
        data: { title: 'Episode', projectId: testProjectId },
      });

      await prisma.scene.create({
        data: {
          title: 'Scene',
          videoFile: '/test-assets/scene.mp4',
          duration: 10,
          episodeId: episode.id,
          projectId: testProjectId,
        },
      });

      const result = await exporter.export({
        episodeId: episode.id,
        format: ExportFormat.WEBM,
        quality: ExportQuality.HD_720P,
        userId: testUserId,
      });

      expect(result.codec).toBe('libvpx-vp9');
    });

    it('should use Opus audio codec for WebM', async () => {
      const episode = await prisma.episode.create({
        data: { title: 'Episode', projectId: testProjectId },
      });

      await prisma.scene.create({
        data: {
          title: 'Scene',
          videoFile: '/test-assets/scene.mp4',
          audioFile: '/test-assets/audio.mp3',
          duration: 15,
          episodeId: episode.id,
          projectId: testProjectId,
        },
      });

      const result = await exporter.export({
        episodeId: episode.id,
        format: ExportFormat.WEBM,
        quality: ExportQuality.HD_1080P,
        includeAudio: true,
        userId: testUserId,
      });

      expect(result.audioCodec).toBe('libopus');
    });
  });

  describe('MOV Export (ProRes)', () => {
    it('should export episode to MOV format', async () => {
      const episode = await prisma.episode.create({
        data: { title: 'Episode', projectId: testProjectId },
      });

      await prisma.scene.create({
        data: {
          title: 'Scene',
          videoFile: '/test-assets/scene.mp4',
          duration: 30,
          episodeId: episode.id,
          projectId: testProjectId,
        },
      });

      const result = await exporter.export({
        episodeId: episode.id,
        format: ExportFormat.MOV,
        quality: ExportQuality.UHD_4K,
        userId: testUserId,
      });

      expect(result.success).toBe(true);
      expect(result.outputPath).toContain('.mov');
      expect(result.format).toBe(ExportFormat.MOV);
    });

    it('should use ProRes codec for MOV', async () => {
      const episode = await prisma.episode.create({
        data: { title: 'Episode', projectId: testProjectId },
      });

      await prisma.scene.create({
        data: {
          title: 'Scene',
          videoFile: '/test-assets/scene.mp4',
          duration: 20,
          episodeId: episode.id,
          projectId: testProjectId,
        },
      });

      const result = await exporter.export({
        episodeId: episode.id,
        format: ExportFormat.MOV,
        quality: ExportQuality.HD_1080P,
        userId: testUserId,
      });

      expect(result.codec).toBe('prores_ks');
    });

    it('should use high bitrate for ProRes quality', async () => {
      const episode = await prisma.episode.create({
        data: { title: 'Episode', projectId: testProjectId },
      });

      await prisma.scene.create({
        data: {
          title: 'Scene',
          videoFile: '/test-assets/scene.mp4',
          duration: 25,
          episodeId: episode.id,
          projectId: testProjectId,
        },
      });

      const result = await exporter.export({
        episodeId: episode.id,
        format: ExportFormat.MOV,
        quality: ExportQuality.UHD_4K,
        userId: testUserId,
      });

      expect(result.bitrate).toContain('20000k'); // ProRes 4K
    });
  });

  describe('Scene Assembly for Export', () => {
    it('should assemble scenes in correct order', async () => {
      const episode = await prisma.episode.create({
        data: { title: 'Episode', projectId: testProjectId },
      });

      await prisma.scene.createMany({
        data: [
          { title: 'Scene 1', order: 1, duration: 10, episodeId: episode.id, projectId: testProjectId, videoFile: '/test-assets/scene1.mp4' },
          { title: 'Scene 2', order: 2, duration: 15, episodeId: episode.id, projectId: testProjectId, videoFile: '/test-assets/scene2.mp4' },
          { title: 'Scene 3', order: 3, duration: 20, episodeId: episode.id, projectId: testProjectId, videoFile: '/test-assets/scene3.mp4' },
        ],
      });

      const result = await exporter.export({
        episodeId: episode.id,
        format: ExportFormat.MP4,
        quality: ExportQuality.HD_1080P,
        userId: testUserId,
      });

      expect(result.totalDuration).toBe(45); // 10 + 15 + 20
      expect(result.sceneCount).toBe(3);
    });

    it('should skip scenes without video files', async () => {
      const episode = await prisma.episode.create({
        data: { title: 'Episode', projectId: testProjectId },
      });

      await prisma.scene.createMany({
        data: [
          { title: 'Scene 1', order: 1, duration: 10, episodeId: episode.id, projectId: testProjectId, videoFile: '/test-assets/scene1.mp4' },
          { title: 'Scene 2', order: 2, duration: 15, episodeId: episode.id, projectId: testProjectId }, // No video
          { title: 'Scene 3', order: 3, duration: 20, episodeId: episode.id, projectId: testProjectId, videoFile: '/test-assets/scene3.mp4' },
        ],
      });

      const result = await exporter.export({
        episodeId: episode.id,
        format: ExportFormat.MP4,
        quality: ExportQuality.HD_1080P,
        userId: testUserId,
      });

      expect(result.sceneCount).toBe(2); // Only scenes with video
    });

    it('should handle transitions between scenes', async () => {
      const episode = await prisma.episode.create({
        data: { title: 'Episode', projectId: testProjectId },
      });

      await prisma.scene.createMany({
        data: [
          { title: 'Scene 1', order: 1, duration: 10, episodeId: episode.id, projectId: testProjectId, videoFile: '/test-assets/scene1.mp4', transition: 'FADE' },
          { title: 'Scene 2', order: 2, duration: 15, episodeId: episode.id, projectId: testProjectId, videoFile: '/test-assets/scene2.mp4', transition: 'CUT' },
        ],
      });

      const result = await exporter.export({
        episodeId: episode.id,
        format: ExportFormat.MP4,
        quality: ExportQuality.HD_1080P,
        includeTransitions: true,
        userId: testUserId,
      });

      expect(result.transitionsApplied).toBe(true);
    });
  });

  describe('Audio Track Merging', () => {
    it('should merge multiple audio tracks', async () => {
      const episode = await prisma.episode.create({
        data: { title: 'Episode', projectId: testProjectId },
      });

      await prisma.scene.createMany({
        data: [
          { title: 'Scene 1', duration: 10, episodeId: episode.id, projectId: testProjectId, videoFile: '/test-assets/scene1.mp4', audioFile: '/test-assets/audio1.mp3' },
          { title: 'Scene 2', duration: 15, episodeId: episode.id, projectId: testProjectId, videoFile: '/test-assets/scene2.mp4', audioFile: '/test-assets/audio2.mp3' },
        ],
      });

      const result = await exporter.export({
        episodeId: episode.id,
        format: ExportFormat.MP4,
        quality: ExportQuality.HD_1080P,
        includeAudio: true,
        userId: testUserId,
      });

      expect(result.hasAudio).toBe(true);
      expect(result.audioTracks).toBe(2);
    });

    it('should mix dialogue and background music', async () => {
      const episode = await prisma.episode.create({
        data: { title: 'Episode', projectId: testProjectId },
      });

      await prisma.scene.create({
        data: {
          title: 'Scene',
          duration: 20,
          episodeId: episode.id,
          projectId: testProjectId,
          videoFile: '/test-assets/scene.mp4',
          audioFile: '/test-assets/dialogue.mp3',
          musicFile: '/test-assets/background.mp3',
        },
      });

      const result = await exporter.export({
        episodeId: episode.id,
        format: ExportFormat.MP4,
        quality: ExportQuality.HD_1080P,
        includeAudio: true,
        mixAudio: true,
        userId: testUserId,
      });

      expect(result.audioMixed).toBe(true);
    });

    it('should normalize audio levels', async () => {
      const episode = await prisma.episode.create({
        data: { title: 'Episode', projectId: testProjectId },
      });

      await prisma.scene.create({
        data: {
          title: 'Scene',
          duration: 15,
          episodeId: episode.id,
          projectId: testProjectId,
          videoFile: '/test-assets/scene.mp4',
          audioFile: '/test-assets/loud-audio.mp3',
        },
      });

      const result = await exporter.export({
        episodeId: episode.id,
        format: ExportFormat.MP4,
        quality: ExportQuality.HD_1080P,
        includeAudio: true,
        normalizeAudio: true,
        userId: testUserId,
      });

      expect(result.audioNormalized).toBe(true);
    });
  });

  describe('Quality Settings', () => {
    it('should export at 720p resolution', async () => {
      const episode = await prisma.episode.create({
        data: { title: 'Episode', projectId: testProjectId },
      });

      await prisma.scene.create({
        data: {
          title: 'Scene',
          duration: 10,
          episodeId: episode.id,
          projectId: testProjectId,
          videoFile: '/test-assets/scene.mp4',
        },
      });

      const result = await exporter.export({
        episodeId: episode.id,
        format: ExportFormat.MP4,
        quality: ExportQuality.HD_720P,
        userId: testUserId,
      });

      expect(result.resolution).toBe('1280x720');
    });

    it('should export at 1080p resolution', async () => {
      const episode = await prisma.episode.create({
        data: { title: 'Episode', projectId: testProjectId },
      });

      await prisma.scene.create({
        data: {
          title: 'Scene',
          duration: 10,
          episodeId: episode.id,
          projectId: testProjectId,
          videoFile: '/test-assets/scene.mp4',
        },
      });

      const result = await exporter.export({
        episodeId: episode.id,
        format: ExportFormat.MP4,
        quality: ExportQuality.HD_1080P,
        userId: testUserId,
      });

      expect(result.resolution).toBe('1920x1080');
    });

    it('should export at 4K resolution', async () => {
      const episode = await prisma.episode.create({
        data: { title: 'Episode', projectId: testProjectId },
      });

      await prisma.scene.create({
        data: {
          title: 'Scene',
          duration: 10,
          episodeId: episode.id,
          projectId: testProjectId,
          videoFile: '/test-assets/scene.mp4',
        },
      });

      const result = await exporter.export({
        episodeId: episode.id,
        format: ExportFormat.MP4,
        quality: ExportQuality.UHD_4K,
        userId: testUserId,
      });

      expect(result.resolution).toBe('3840x2160');
    });

    it('should adjust bitrate based on quality', async () => {
      const episode = await prisma.episode.create({
        data: { title: 'Episode', projectId: testProjectId },
      });

      await prisma.scene.create({
        data: {
          title: 'Scene',
          duration: 10,
          episodeId: episode.id,
          projectId: testProjectId,
          videoFile: '/test-assets/scene.mp4',
        },
      });

      const result720p = await exporter.export({
        episodeId: episode.id,
        format: ExportFormat.MP4,
        quality: ExportQuality.HD_720P,
        userId: testUserId,
      });

      const result4k = await exporter.export({
        episodeId: episode.id,
        format: ExportFormat.MP4,
        quality: ExportQuality.UHD_4K,
        userId: testUserId,
      });

      expect(parseInt(result4k.bitrate)).toBeGreaterThan(parseInt(result720p.bitrate));
    });
  });

  describe('Export Progress Tracking', () => {
    it('should report progress during export', async () => {
      const episode = await prisma.episode.create({
        data: { title: 'Episode', projectId: testProjectId },
      });

      await prisma.scene.create({
        data: {
          title: 'Scene',
          duration: 30,
          episodeId: episode.id,
          projectId: testProjectId,
          videoFile: '/test-assets/large-scene.mp4',
        },
      });

      const progressUpdates: number[] = [];

      const result = await exporter.export({
        episodeId: episode.id,
        format: ExportFormat.MP4,
        quality: ExportQuality.HD_1080P,
        userId: testUserId,
        onProgress: (progress) => {
          progressUpdates.push(progress);
        },
      });

      expect(progressUpdates.length).toBeGreaterThan(0);
      expect(progressUpdates[progressUpdates.length - 1]).toBe(100);
    });

    it('should estimate remaining time', async () => {
      const episode = await prisma.episode.create({
        data: { title: 'Episode', projectId: testProjectId },
      });

      await prisma.scene.create({
        data: {
          title: 'Scene',
          duration: 60,
          episodeId: episode.id,
          projectId: testProjectId,
          videoFile: '/test-assets/scene.mp4',
        },
      });

      const result = await exporter.export({
        episodeId: episode.id,
        format: ExportFormat.MP4,
        quality: ExportQuality.HD_1080P,
        userId: testUserId,
      });

      expect(result.estimatedTime).toBeDefined();
    });
  });

  describe('Export Cleanup', () => {
    it('should clean up temporary files after export', async () => {
      const episode = await prisma.episode.create({
        data: { title: 'Episode', projectId: testProjectId },
      });

      await prisma.scene.create({
        data: {
          title: 'Scene',
          duration: 10,
          episodeId: episode.id,
          projectId: testProjectId,
          videoFile: '/test-assets/scene.mp4',
        },
      });

      const result = await exporter.export({
        episodeId: episode.id,
        format: ExportFormat.MP4,
        quality: ExportQuality.HD_1080P,
        userId: testUserId,
      });

      // Check that temp files are removed
      const tempDir = path.dirname(result.tempFiles[0] || '');
      const tempFiles = await fs.readdir(tempDir).catch(() => []);

      expect(tempFiles.length).toBe(0);
    });

    it('should clean up on export failure', async () => {
      const episode = await prisma.episode.create({
        data: { title: 'Episode', projectId: testProjectId },
      });

      await prisma.scene.create({
        data: {
          title: 'Scene',
          duration: 10,
          episodeId: episode.id,
          projectId: testProjectId,
          videoFile: '/test-assets/corrupt-video.mp4', // Corrupt file
        },
      });

      try {
        await exporter.export({
          episodeId: episode.id,
          format: ExportFormat.MP4,
          quality: ExportQuality.HD_1080P,
          userId: testUserId,
        });
      } catch (error) {
        // Expected to fail
      }

      // Verify cleanup occurred despite failure
      const tempDir = '/tmp/aladdin-exports';
      const tempFiles = await fs.readdir(tempDir).catch(() => []);

      expect(tempFiles.length).toBe(0);
    });

    it('should optionally keep temporary files', async () => {
      const episode = await prisma.episode.create({
        data: { title: 'Episode', projectId: testProjectId },
      });

      await prisma.scene.create({
        data: {
          title: 'Scene',
          duration: 10,
          episodeId: episode.id,
          projectId: testProjectId,
          videoFile: '/test-assets/scene.mp4',
        },
      });

      const result = await exporter.export({
        episodeId: episode.id,
        format: ExportFormat.MP4,
        quality: ExportQuality.HD_1080P,
        userId: testUserId,
        keepTempFiles: true,
      });

      expect(result.tempFiles.length).toBeGreaterThan(0);

      // Verify temp files exist
      for (const tempFile of result.tempFiles) {
        const exists = await fs.access(tempFile).then(() => true).catch(() => false);
        expect(exists).toBe(true);
      }
    });
  });
});
