/**
 * Export Storage Manager
 * Handles storage and retrieval of exported video files
 */

import { ExportJob } from './formatHandlers';
import { FormatHandler } from './formatHandlers';
import fs from 'fs';
import path from 'path';

export class ExportStorage {
  private storageDir = process.env.EXPORT_STORAGE_DIR || '/tmp/exports';

  constructor() {
    this.ensureStorageDir();
  }

  private ensureStorageDir(): void {
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }
  }

  async uploadExport(sourcePath: string, job: ExportJob): Promise<string> {
    const extension = FormatHandler.getExtension(job.format);
    const filename = `${job.id}.${extension}`;
    const destPath = path.join(this.storageDir, filename);

    // In production, this would upload to S3/CloudFlare R2/etc
    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, destPath);
    }

    // Return public URL
    return `/api/export/${job.id}/download`;
  }

  async getExportPath(jobId: string, format: string): Promise<string> {
    const extension = FormatHandler.getExtension(format as any);
    return path.join(this.storageDir, `${jobId}.${extension}`);
  }

  async deleteExport(jobId: string, format: string): Promise<void> {
    const exportPath = await this.getExportPath(jobId, format);
    if (fs.existsSync(exportPath)) {
      fs.unlinkSync(exportPath);
    }
  }

  async getStorageStats() {
    const files = fs.readdirSync(this.storageDir);
    let totalSize = 0;

    for (const file of files) {
      const filePath = path.join(this.storageDir, file);
      const stats = fs.statSync(filePath);
      totalSize += stats.size;
    }

    return {
      files: files.length,
      totalSize,
      directory: this.storageDir,
    };
  }
}
