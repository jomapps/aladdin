/**
 * Export Queue Manager
 * Manages export job queue with priority and concurrency control
 */

import { ExportJob } from './formatHandlers';

export class ExportQueue {
  private jobs: Map<string, ExportJob>;
  private queue: string[];
  private processing: Set<string>;
  private maxConcurrent = 3;

  constructor() {
    this.jobs = new Map();
    this.queue = [];
    this.processing = new Set();
  }

  async addJob(job: ExportJob): Promise<void> {
    this.jobs.set(job.id, job);
    this.queue.push(job.id);
  }

  async getJob(jobId: string): Promise<ExportJob | null> {
    return this.jobs.get(jobId) || null;
  }

  async updateJobStatus(
    jobId: string,
    status: ExportJob['status'],
    progress?: number
  ): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) return;

    job.status = status;
    if (progress !== undefined) job.progress = progress;
    if (status === 'processing' && !job.startedAt) job.startedAt = new Date();
  }

  async completeJob(jobId: string, outputUrl: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) return;

    job.status = 'completed';
    job.progress = 100;
    job.completedAt = new Date();
    job.outputUrl = outputUrl;

    this.processing.delete(jobId);
  }

  async failJob(jobId: string, error: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) return;

    job.status = 'failed';
    job.error = error;
    job.completedAt = new Date();

    this.processing.delete(jobId);
  }

  async cancelJob(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) return;

    job.status = 'cancelled';
    job.completedAt = new Date();

    this.processing.delete(jobId);
    this.queue = this.queue.filter(id => id !== jobId);
  }

  async getUserJobs(userId: string, limit = 20): Promise<ExportJob[]> {
    const userJobs = Array.from(this.jobs.values())
      .filter(job => job.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);

    return userJobs;
  }

  getQueueStats() {
    return {
      total: this.jobs.size,
      pending: this.queue.length,
      processing: this.processing.size,
      maxConcurrent: this.maxConcurrent,
    };
  }
}
