/**
 * Mock Tasks Service (tasks.ft.tc)
 * Provides mock implementations for task queue and stitching service
 */

import { vi } from 'vitest';

export const mockTasksService = {
  createTask: vi.fn(),
  getTask: vi.fn(),
  updateTask: vi.fn(),
  stitchVideos: vi.fn(),
  checkStitchingStatus: vi.fn(),
  downloadResult: vi.fn(),
};

// Default mock implementations
mockTasksService.createTask.mockResolvedValue({
  taskId: 'task-123',
  status: 'queued',
  createdAt: new Date(),
});

mockTasksService.getTask.mockResolvedValue({
  taskId: 'task-123',
  status: 'completed',
  result: {
    success: true,
    data: {},
  },
  completedAt: new Date(),
});

mockTasksService.updateTask.mockResolvedValue({
  success: true,
});

mockTasksService.stitchVideos.mockResolvedValue({
  jobId: 'stitch-job-456',
  status: 'processing',
  estimatedCompletion: new Date(Date.now() + 180000), // 3 minutes
});

mockTasksService.checkStitchingStatus.mockResolvedValue({
  jobId: 'stitch-job-456',
  status: 'completed',
  videoUrl: 'https://tasks.ft.tc/results/stitched-video.mp4',
  duration: 10.5,
  fileSize: 52428800,
});

mockTasksService.downloadResult.mockResolvedValue({
  buffer: Buffer.from('mock-video-data'),
  size: 52428800,
  contentType: 'video/mp4',
});

export default mockTasksService;
