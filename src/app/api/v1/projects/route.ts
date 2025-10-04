import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import slugify from 'slugify'
import { customAlphabet } from 'nanoid'
import { authenticateRequest } from '@/lib/auth/devAuth'

// Create a nanoid generator with lowercase letters and numbers, 4 characters
const generateId = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 4)

/**
 * POST /api/v1/projects
 * Create a new project
 */
export async function POST(req: NextRequest) {
  try {
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    // Authenticate user (auto-login in development)
    const { userId } = await authenticateRequest(req, payload)

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { name, description, type = 'movie', genre, status = 'active' } = body

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Project name is required' }, { status: 400 })
    }

    // Create slug from name using slugify + 4-character unique ID
    const baseSlug = slugify(name, {
      lower: true,
      strict: true, // Remove special characters
      trim: true,
    })

    // Ensure slug is not empty (fallback to 'project')
    const slug = baseSlug || 'project'

    // Make slug unique by appending 4-character ID
    const uniqueId = generateId()
    const uniqueSlug = `${slug}-${uniqueId}`

    // Prepare genre array (PayloadCMS expects array of objects with 'genre' field)
    const genreArray = genre && genre.trim() ? [{ genre: genre.trim() }] : []

    // Create project in PayloadCMS
    const project = await payload.create({
      collection: 'projects',
      data: {
        name: name.trim(),
        slug: uniqueSlug,
        logline: description?.trim() || '',
        type,
        genre: genreArray,
        status,
        phase: 'expansion',
        owner: userId, // Set the authenticated user as owner
      },
    })

    return NextResponse.json(
      {
        id: project.id,
        name: project.name,
        slug: project.slug,
        logline: project.logline,
        type: project.type,
        status: project.status,
        phase: project.phase,
        createdAt: project.createdAt,
      },
      { status: 201 },
    )
  } catch (error: any) {
    console.error('Error creating project:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create project' },
      { status: 500 },
    )
  }
}

/**
 * GET /api/v1/projects
 * Get all projects for the authenticated user
 */
export async function GET(req: NextRequest) {
  try {
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    // Authenticate user (auto-login in development)
    const { userId } = await authenticateRequest(req, payload)

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get query parameters
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    // Fetch all projects (no user filtering - authentication is just for access)
    const projects = await payload.find({
      collection: 'projects',
      page,
      limit,
      sort: '-createdAt',
    })

    return NextResponse.json({
      projects: projects.docs,
      totalPages: projects.totalPages,
      totalDocs: projects.totalDocs,
      page: projects.page,
      hasNextPage: projects.hasNextPage,
      hasPrevPage: projects.hasPrevPage,
    })
  } catch (error: any) {
    console.error('Error fetching projects:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch projects' },
      { status: 500 },
    )
  }
}
