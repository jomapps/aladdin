import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ExportQueue } from '@/lib/export/ExportQueue';
import { prisma } from '@/lib/prisma';
import { ExportFormat, ExportQuality, ExportJobStatus } from '@/types/export';

describe('Export Queue Integration Tests', () => {
  let testUserId: string;
  let testProjectId: string;
  let exportQueue: ExportQueue;

  beforeEach(async () => {
    const user = await prisma.user.create({
      data: {
        email: 'queue-test@test.com',
        name: 'Queue Test User',
        password: 'hashedpassword',
      },
    });
    testUserId = user.id;

    const project = await prisma.project.create({
      data: {
        title: 'Queue Test Project',
        ownerId: testUserId,
      },
    });
    testProjectId = project.id;

    exportQueue = new ExportQueue();
  });

  afterEach(async () => {
    await prisma.exportJob.deleteMany({ where: { userId: testUserId } });
    await prisma.project.delete({ where: { id: testProjectId } });
    await prisma.user.delete({ where: { id: testUserId } });
    await exportQueue.shutdown();
  });

  describe('Export Job Creation', () => {
    it('should create export job', async () => {
      const episode = await prisma.episode.create({
        data: { title: 'Episode', projectId: testProjectId },
      });

      const job = await exportQueue.createJob({
        episodeId: episode.id,
        format: ExportFormat.MP4,
        quality: ExportQuality.HD_1080P,
        userId: testUserId,
      });

      expect(job.id).toBeDefined();
      expect(job.status).toBe(ExportJobStatus.PENDING);
      expect(job.format).toBe(ExportFormat.MP4);
      expect(job.quality).toBe(ExportQuality.HD_1080P);
    });

    it('should store job in database', async () => {
      const episode = await prisma.episode.create({
        data: { title: 'Episode', projectId: testProjectId },
      });

      const job = await exportQueue.createJob({
        episodeId: episode.id,
        format: ExportFormat.WEBM,
        quality: ExportQuality.HD_720P,
        userId: testUserId,
      });

      const dbJob = await prisma.exportJob.findUnique({ where: { id: job.id } });
      expect(dbJob).toBeDefined();
      expect(dbJob?.episodeId).toBe(episode.id);
    });

    it('should assign unique job IDs', async () => {
      const episode = await prisma.episode.create({
        data: { title: 'Episode', projectId: testProjectId },
      });

      const job1 = await exportQueue.createJob({
        episodeId: episode.id,
        format: ExportFormat.MP4,
        quality: ExportQuality.HD_1080P,
        userId: testUserId,
      });

      const job2 = await exportQueue.createJob({
        episodeId: episode.id,
        format: ExportFormat.MP4,
        quality: ExportQuality.HD_1080P,
        userId: testUserId,
      });

      expect(job1.id).not.toBe(job2.id);
    });

    it('should validate export parameters', async () => {
      await expect(
        exportQueue.createJob({
          episodeId: 'non-existent',
          format: ExportFormat.MP4,
          quality: ExportQuality.HD_1080P,
          userId: testUserId,
        })
      ).rejects.toThrow('Episode not found');
    });

    it('should set default export options', async () => {
      const episode = await prisma.episode.create({
        data: { title: 'Episode', projectId: testProjectId },
      });

      const job = await exportQueue.createJob({
        episodeId: episode.id,
        userId: testUserId,
      });

      expect(job.format).toBe(ExportFormat.MP4); // Default
      expect(job.quality).toBe(ExportQuality.HD_1080P); // Default
    });
  });

  describe('Job Status Tracking', () => {
    it('should track job status changes', async () => {
      const episode = await prisma.episode.create({
        data: { title: 'Episode', projectId: testProjectId },
      });

      const job = await exportQueue.createJob({
        episodeId: episode.id,
        format: ExportFormat.MP4,
        quality: ExportQuality.HD_1080P,
        userId: testUserId,
      });

      expect(job.status).toBe(ExportJobStatus.PENDING);

      await exportQueue.startJob(job.id);
      const processing = await exportQueue.getJob(job.id);
      expect(processing.status).toBe(ExportJobStatus.PROCESSING);

      await exportQueue.completeJob(job.id, '/exports/output.mp4');
      const completed = await exportQueue.getJob(job.id);
      expect(completed.status).toBe(ExportJobStatus.COMPLETED);
    });

    it('should track job failure', async () => {
      const episode = await prisma.episode.create({
        data: { title: 'Episode', projectId: testProjectId },
      });

      const job = await exportQueue.createJob({
        episodeId: episode.id,
        format: ExportFormat.MP4,
        quality: ExportQuality.HD_1080P,
        userId: testUserId,
      });

      await exportQueue.startJob(job.id);
      await exportQueue.failJob(job.id, 'Export failed due to missing files');

      const failed = await exportQueue.getJob(job.id);
      expect(failed.status).toBe(ExportJobStatus.FAILED);
      expect(failed.error).toBe('Export failed due to missing files');
    });

    it('should get job status by ID', async () => {
      const episode = await prisma.episode.create({
        data: { title: 'Episode', projectId: testProjectId },
      });

      const job = await exportQueue.createJob({
        episodeId: episode.id,
        format: ExportFormat.MP4,
        quality: ExportQuality.HD_1080P,
        userId: testUserId,
      });

      const status = await exportQueue.getJobStatus(job.id);
      expect(status).toBe(ExportJobStatus.PENDING);
    });

    it('should throw error for non-existent job', async () => {
      await expect(exportQueue.getJob('non-existent-id')).rejects.toThrow('Job not found');
    });

    it('should track job timestamps', async () => {
      const episode = await prisma.episode.create({
        data: { title: 'Episode', projectId: testProjectId },
      });

      const job = await exportQueue.createJob({
        episodeId: episode.id,
        format: ExportFormat.MP4,
        quality: ExportQuality.HD_1080P,
        userId: testUserId,
      });

      expect(job.createdAt).toBeDefined();

      await exportQueue.startJob(job.id);
      const started = await exportQueue.getJob(job.id);
      expect(started.startedAt).toBeDefined();

      await exportQueue.completeJob(job.id, '/exports/output.mp4');
      const completed = await exportQueue.getJob(job.id);
      expect(completed.completedAt).toBeDefined();
    });
  });

  describe('Job Progress Updates', () => {
    it('should update job progress', async () => {
      const episode = await prisma.episode.create({
        data: { title: 'Episode', projectId: testProjectId },
      });

      const job = await exportQueue.createJob({
        episodeId: episode.id,
        format: ExportFormat.MP4,
        quality: ExportQuality.HD_1080P,
        userId: testUserId,
      });

      await exportQueue.startJob(job.id);

      await exportQueue.updateProgress(job.id, 25);
      let updated = await exportQueue.getJob(job.id);
      expect(updated.progress).toBe(25);

      await exportQueue.updateProgress(job.id, 75);
      updated = await exportQueue.getJob(job.id);
      expect(updated.progress).toBe(75);

      await exportQueue.updateProgress(job.id, 100);
      updated = await exportQueue.getJob(job.id);
      expect(updated.progress).toBe(100);
    });

    it('should validate progress values', async () => {
      const episode = await prisma.episode.create({
        data: { title: 'Episode', projectId: testProjectId },
      });

      const job = await exportQueue.createJob({
        episodeId: episode.id,
        format: ExportFormat.MP4,
        quality: ExportQuality.HD_1080P,
        userId: testUserId,
      });

      await exportQueue.startJob(job.id);

      await expect(exportQueue.updateProgress(job.id, -10)).rejects.toThrow('Invalid progress');
      await expect(exportQueue.updateProgress(job.id, 150)).rejects.toThrow('Invalid progress');
    });

    it('should track progress messages', async () => {
      const episode = await prisma.episode.create({
        data: { title: 'Episode', projectId: testProjectId },
      });

      const job = await exportQueue.createJob({
        episodeId: episode.id,
        format: ExportFormat.MP4,
        quality: ExportQuality.HD_1080P,
        userId: testUserId,
      });

      await exportQueue.startJob(job.id);

      await exportQueue.updateProgress(job.id, 20, 'Processing scene 1...');
      await exportQueue.updateProgress(job.id, 50, 'Processing scene 2...');
      await exportQueue.updateProgress(job.id, 80, 'Merging scenes...');

      const updated = await exportQueue.getJob(job.id);
      expect(updated.progressMessage).toBe('Merging scenes...');
    });
  });

  describe('Job Completion Notifications', () => {
    it('should trigger notification on job completion', async () => {
      const episode = await prisma.episode.create({
        data: { title: 'Episode', projectId: testProjectId },
      });

      const job = await exportQueue.createJob({
        episodeId: episode.id,
        format: ExportFormat.MP4,
        quality: ExportQuality.HD_1080P,
        userId: testUserId,
      });

      let notificationReceived = false;
      exportQueue.on('jobCompleted', (completedJob) => {
        if (completedJob.id === job.id) {
          notificationReceived = true;
        }
      });

      await exportQueue.startJob(job.id);
      await exportQueue.completeJob(job.id, '/exports/output.mp4');

      expect(notificationReceived).toBe(true);
    });

    it('should trigger notification on job failure', async () => {
      const episode = await prisma.episode.create({
        data: { title: 'Episode', projectId: testProjectId },
      });

      const job = await exportQueue.createJob({
        episodeId: episode.id,
        format: ExportFormat.MP4,
        quality: ExportQuality.HD_1080P,
        userId: testUserId,
      });

      let failureNotificationReceived = false;
      exportQueue.on('jobFailed', (failedJob) => {
        if (failedJob.id === job.id) {
          failureNotificationReceived = true;
        }
      });

      await exportQueue.startJob(job.id);
      await exportQueue.failJob(job.id, 'Error occurred');

      expect(failureNotificationReceived).toBe(true);
    });

    it('should send email notification on completion', async () => {
      const episode = await prisma.episode.create({
        data: { title: 'Episode', projectId: testProjectId },
      });

      const job = await exportQueue.createJob({
        episodeId: episode.id,
        format: ExportFormat.MP4,
        quality: ExportQuality.HD_1080P,
        userId: testUserId,
        notifyOnCompletion: true,
      });

      await exportQueue.startJob(job.id);
      await exportQueue.completeJob(job.id, '/exports/output.mp4');

      const notifications = await prisma.notification.findMany({
        where: { userId: testUserId, type: 'EXPORT_COMPLETED' },
      });

      expect(notifications.length).toBeGreaterThan(0);
    });

    it('should include download link in notification', async () => {
      const episode = await prisma.episode.create({
        data: { title: 'Episode', projectId: testProjectId },
      });

      const job = await exportQueue.createJob({
        episodeId: episode.id,
        format: ExportFormat.MP4,
        quality: ExportQuality.HD_1080P,
        userId: testUserId,
        notifyOnCompletion: true,
      });

      await exportQueue.startJob(job.id);
      const outputPath = '/exports/output.mp4';
      await exportQueue.completeJob(job.id, outputPath);

      const notification = await prisma.notification.findFirst({
        where: { userId: testUserId, type: 'EXPORT_COMPLETED' },
      });

      expect(notification?.data).toContain(outputPath);
    });
  });

  describe('Concurrent Export Jobs', () => {
    it('should process multiple jobs concurrently', async () => {
      const episode1 = await prisma.episode.create({
        data: { title: 'Episode 1', projectId: testProjectId },
      });
      const episode2 = await prisma.episode.create({
        data: { title: 'Episode 2', projectId: testProjectId },
      });
      const episode3 = await prisma.episode.create({
        data: { title: 'Episode 3', projectId: testProjectId },
      });

      const job1 = await exportQueue.createJob({
        episodeId: episode1.id,
        format: ExportFormat.MP4,
        quality: ExportQuality.HD_1080P,
        userId: testUserId,
      });

      const job2 = await exportQueue.createJob({
        episodeId: episode2.id,
        format: ExportFormat.WEBM,
        quality: ExportQuality.HD_1080P,
        userId: testUserId,
      });

      const job3 = await exportQueue.createJob({
        episodeId: episode3.id,
        format: ExportFormat.MOV,
        quality: ExportQuality.HD_1080P,
        userId: testUserId,
      });

      await Promise.all([
        exportQueue.startJob(job1.id),
        exportQueue.startJob(job2.id),
        exportQueue.startJob(job3.id),
      ]);

      const status1 = await exportQueue.getJob(job1.id);
      const status2 = await exportQueue.getJob(job2.id);
      const status3 = await exportQueue.getJob(job3.id);

      expect(status1.status).toBe(ExportJobStatus.PROCESSING);
      expect(status2.status).toBe(ExportJobStatus.PROCESSING);
      expect(status3.status).toBe(ExportJobStatus.PROCESSING);
    });

    it('should respect concurrent job limit', async () => {
      exportQueue.setMaxConcurrentJobs(2);

      const episodes = await Promise.all(
        Array.from({ length: 5 }, (_, i) =>
          prisma.episode.create({
            data: { title: `Episode ${i + 1}`, projectId: testProjectId },
          })
        )
      );

      const jobs = await Promise.all(
        episodes.map((episode) =>
          exportQueue.createJob({
            episodeId: episode.id,
            format: ExportFormat.MP4,
            quality: ExportQuality.HD_1080P,
            userId: testUserId,
          })
        )
      );

      await Promise.all(jobs.map((job) => exportQueue.startJob(job.id)));

      const processingJobs = await prisma.exportJob.findMany({
        where: { status: ExportJobStatus.PROCESSING },
      });

      expect(processingJobs.length).toBeLessThanOrEqual(2);
    });

    it('should queue jobs when limit is reached', async () => {
      exportQueue.setMaxConcurrentJobs(1);

      const episode1 = await prisma.episode.create({
        data: { title: 'Episode 1', projectId: testProjectId },
      });
      const episode2 = await prisma.episode.create({
        data: { title: 'Episode 2', projectId: testProjectId },
      });

      const job1 = await exportQueue.createJob({
        episodeId: episode1.id,
        format: ExportFormat.MP4,
        quality: ExportQuality.HD_1080P,
        userId: testUserId,
      });

      const job2 = await exportQueue.createJob({
        episodeId: episode2.id,
        format: ExportFormat.MP4,
        quality: ExportQuality.HD_1080P,
        userId: testUserId,
      });

      await exportQueue.startJob(job1.id);
      await exportQueue.startJob(job2.id);

      const status1 = await exportQueue.getJob(job1.id);
      const status2 = await exportQueue.getJob(job2.id);

      expect(status1.status).toBe(ExportJobStatus.PROCESSING);
      expect(status2.status).toBe(ExportJobStatus.PENDING);
    });
  });

  describe('Export Queue Prioritization', () => {
    it('should prioritize high-priority jobs', async () => {
      const episode1 = await prisma.episode.create({
        data: { title: 'Low Priority', projectId: testProjectId },
      });
      const episode2 = await prisma.episode.create({
        data: { title: 'High Priority', projectId: testProjectId },
      });

      const lowJob = await exportQueue.createJob({
        episodeId: episode1.id,
        format: ExportFormat.MP4,
        quality: ExportQuality.HD_1080P,
        userId: testUserId,
        priority: 1,
      });

      const highJob = await exportQueue.createJob({
        episodeId: episode2.id,
        format: ExportFormat.MP4,
        quality: ExportQuality.HD_1080P,
        userId: testUserId,
        priority: 10,
      });

      const nextJob = await exportQueue.getNextJob();
      expect(nextJob.id).toBe(highJob.id);
    });

    it('should process jobs in priority order', async () => {
      const episodes = await Promise.all(
        Array.from({ length: 3 }, (_, i) =>
          prisma.episode.create({
            data: { title: `Episode ${i + 1}`, projectId: testProjectId },
          })
        )
      );

      const jobs = await Promise.all([
        exportQueue.createJob({
          episodeId: episodes[0].id,
          format: ExportFormat.MP4,
          quality: ExportQuality.HD_1080P,
          userId: testUserId,
          priority: 1,
        }),
        exportQueue.createJob({
          episodeId: episodes[1].id,
          format: ExportFormat.MP4,
          quality: ExportQuality.HD_1080P,
          userId: testUserId,
          priority: 5,
        }),
        exportQueue.createJob({
          episodeId: episodes[2].id,
          format: ExportFormat.MP4,
          quality: ExportQuality.HD_1080P,
          userId: testUserId,
          priority: 10,
        }),
      ]);

      const firstJob = await exportQueue.getNextJob();
      expect(firstJob.priority).toBe(10);
    });

    it('should allow manual priority adjustment', async () => {
      const episode = await prisma.episode.create({
        data: { title: 'Episode', projectId: testProjectId },
      });

      const job = await exportQueue.createJob({
        episodeId: episode.id,
        format: ExportFormat.MP4,
        quality: ExportQuality.HD_1080P,
        userId: testUserId,
        priority: 1,
      });

      await exportQueue.updatePriority(job.id, 10);

      const updated = await exportQueue.getJob(job.id);
      expect(updated.priority).toBe(10);
    });
  });

  describe('Job Timeout Handling', () => {
    it('should timeout stalled jobs', async () => {
      const episode = await prisma.episode.create({
        data: { title: 'Episode', projectId: testProjectId },
      });

      const job = await exportQueue.createJob({
        episodeId: episode.id,
        format: ExportFormat.MP4,
        quality: ExportQuality.HD_1080P,
        userId: testUserId,
        timeout: 100, // 100ms timeout
      });

      await exportQueue.startJob(job.id);

      // Wait for timeout
      await new Promise((resolve) => setTimeout(resolve, 200));

      await exportQueue.checkTimeouts();

      const timedOut = await exportQueue.getJob(job.id);
      expect(timedOut.status).toBe(ExportJobStatus.FAILED);
      expect(timedOut.error).toContain('timeout');
    });

    it('should not timeout jobs in progress', async () => {
      const episode = await prisma.episode.create({
        data: { title: 'Episode', projectId: testProjectId },
      });

      const job = await exportQueue.createJob({
        episodeId: episode.id,
        format: ExportFormat.MP4,
        quality: ExportQuality.HD_1080P,
        userId: testUserId,
        timeout: 5000, // 5 second timeout
      });

      await exportQueue.startJob(job.id);
      await exportQueue.updateProgress(job.id, 50);

      await new Promise((resolve) => setTimeout(resolve, 100));
      await exportQueue.checkTimeouts();

      const status = await exportQueue.getJob(job.id);
      expect(status.status).toBe(ExportJobStatus.PROCESSING);
    });

    it('should allow configurable timeout duration', async () => {
      const episode = await prisma.episode.create({
        data: { title: 'Episode', projectId: testProjectId },
      });

      const job = await exportQueue.createJob({
        episodeId: episode.id,
        format: ExportFormat.MP4,
        quality: ExportQuality.HD_1080P,
        userId: testUserId,
        timeout: 60000, // 1 minute
      });

      expect(job.timeout).toBe(60000);
    });
  });
});
