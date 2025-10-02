/**
 * Gather API - File Upload Endpoint
 * POST /api/v1/gather/[projectId]/upload - Upload file to R2
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { gatherUploadService } from '@/lib/storage/gatherUpload'

/**
 * POST /api/v1/gather/[projectId]/upload
 * Upload file to Cloudflare R2
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params
    const { searchParams } = new URL(request.url)
    const fileType = searchParams.get('type') as 'image' | 'document'

    if (!fileType || !['image', 'document'].includes(fileType)) {
      return NextResponse.json(
        { error: 'Invalid file type. Must be "image" or "document"' },
        { status: 400 }
      )
    }

    // Validate project exists
    const payload = await getPayload({ config: await config })
    const project = await payload.findByID({
      collection: 'projects',
      id: projectId,
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Get authenticated user
    const { user } = await payload.auth({ headers: request.headers })
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Upload file
    const result = fileType === 'image'
      ? await gatherUploadService.uploadImage(projectId, file, file.name)
      : await gatherUploadService.uploadDocument(projectId, file, file.name)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Upload failed' },
        { status: 500 }
      )
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('[Gather API] Upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}

