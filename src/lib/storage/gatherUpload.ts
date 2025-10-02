/**
 * Gather File Upload Service
 * Handles file uploads to Cloudflare R2 for the Gather feature
 * Structure: /{projectId}/gather/images/ and /{projectId}/gather/documents/
 */

import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'

export interface UploadOptions {
  projectId: string
  file: File | Buffer
  fileName: string
  fileType: 'image' | 'document'
  contentType: string
}

export interface UploadResult {
  success: boolean
  publicUrl?: string
  fileName?: string
  fileSize?: number
  uploadedAt?: string
  error?: string
}

class GatherUploadService {
  private s3Client: S3Client | null = null
  private bucket: string
  private publicUrl: string

  constructor() {
    this.bucket = process.env.R2_BUCKET_NAME || ''
    this.publicUrl = process.env.R2_PUBLIC_URL || ''

    // Initialize S3 client if R2 credentials are available
    if (process.env.R2_ENDPOINT && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY) {
      this.s3Client = new S3Client({
        region: 'auto',
        endpoint: process.env.R2_ENDPOINT,
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID,
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
        },
      })
    }
  }

  /**
   * Validate file before upload
   */
  private validateFile(file: File | Buffer, fileType: 'image' | 'document'): { valid: boolean; error?: string } {
    const maxSizes = {
      image: 20 * 1024 * 1024, // 20MB
      document: 10 * 1024 * 1024, // 10MB
    }

    const allowedTypes = {
      image: ['image/jpeg', 'image/png', 'image/webp'],
      document: ['application/pdf'],
    }

    // Check file size
    const fileSize = file instanceof File ? file.size : file.length
    if (fileSize > maxSizes[fileType]) {
      return {
        valid: false,
        error: `File too large. Maximum size for ${fileType} is ${fileType === 'image' ? '20MB' : '10MB'}`,
      }
    }

    // Check file type (only for File objects)
    if (file instanceof File) {
      if (!allowedTypes[fileType].includes(file.type)) {
        return {
          valid: false,
          error: `Invalid file type. Allowed types: ${allowedTypes[fileType].join(', ')}`,
        }
      }
    }

    return { valid: true }
  }

  /**
   * Generate file name with timestamp
   * Format: {projectId}-gather-{timestamp}-{original-filename}
   */
  private generateFileName(projectId: string, originalFileName: string): string {
    const timestamp = Date.now()
    const sanitizedName = originalFileName.replace(/[^a-zA-Z0-9.-]/g, '_')
    return `${projectId}-gather-${timestamp}-${sanitizedName}`
  }

  /**
   * Upload file to R2
   */
  async uploadFile(options: UploadOptions): Promise<UploadResult> {
    try {
      if (!this.s3Client) {
        return {
          success: false,
          error: 'R2 storage not configured. Please set R2 environment variables.',
        }
      }

      const { projectId, file, fileName, fileType, contentType } = options

      // Validate file
      const validation = this.validateFile(file, fileType)
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error,
        }
      }

      // Generate file name
      const generatedFileName = this.generateFileName(projectId, fileName)

      // Determine folder path
      const folder = fileType === 'image' ? 'images' : 'documents'
      const key = `${projectId}/gather/${folder}/${generatedFileName}`

      // Convert File to Buffer if needed
      let buffer: Buffer
      if (file instanceof File) {
        const arrayBuffer = await file.arrayBuffer()
        buffer = Buffer.from(arrayBuffer)
      } else {
        buffer = file
      }

      // Upload to R2
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      })

      await this.s3Client.send(command)

      // Generate public URL
      const publicUrl = `${this.publicUrl}/${key}`

      return {
        success: true,
        publicUrl,
        fileName: generatedFileName,
        fileSize: buffer.length,
        uploadedAt: new Date().toISOString(),
      }
    } catch (error) {
      console.error('[GatherUpload] Upload failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      }
    }
  }

  /**
   * Delete file from R2 (optional - files persist by default)
   */
  async deleteFile(projectId: string, fileName: string, fileType: 'image' | 'document'): Promise<boolean> {
    try {
      if (!this.s3Client) {
        console.warn('[GatherUpload] R2 storage not configured')
        return false
      }

      const folder = fileType === 'image' ? 'images' : 'documents'
      const key = `${projectId}/gather/${folder}/${fileName}`

      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      })

      await this.s3Client.send(command)
      return true
    } catch (error) {
      console.error('[GatherUpload] Delete failed:', error)
      return false
    }
  }

  /**
   * Upload image file
   */
  async uploadImage(projectId: string, file: File | Buffer, fileName: string): Promise<UploadResult> {
    const contentType = file instanceof File ? file.type : 'image/jpeg'
    return this.uploadFile({
      projectId,
      file,
      fileName,
      fileType: 'image',
      contentType,
    })
  }

  /**
   * Upload document file (PDF)
   */
  async uploadDocument(projectId: string, file: File | Buffer, fileName: string): Promise<UploadResult> {
    const contentType = file instanceof File ? file.type : 'application/pdf'
    return this.uploadFile({
      projectId,
      file,
      fileName,
      fileType: 'document',
      contentType,
    })
  }
}

// Singleton instance
export const gatherUploadService = new GatherUploadService()

// Helper functions
export async function uploadGatherImage(
  projectId: string,
  file: File | Buffer,
  fileName: string
): Promise<UploadResult> {
  return gatherUploadService.uploadImage(projectId, file, fileName)
}

export async function uploadGatherDocument(
  projectId: string,
  file: File | Buffer,
  fileName: string
): Promise<UploadResult> {
  return gatherUploadService.uploadDocument(projectId, file, fileName)
}

export async function deleteGatherFile(
  projectId: string,
  fileName: string,
  fileType: 'image' | 'document'
): Promise<boolean> {
  return gatherUploadService.deleteFile(projectId, fileName, fileType)
}

