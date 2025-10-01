import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'

/**
 * POST /api/v1/projects
 * Create a new project
 */
export async function POST(req: NextRequest) {
  try {
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    // Get authenticated user
    const { user } = await payload.auth({ headers: req.headers })

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { name, description, type = 'movie', genre, status = 'active' } = body

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Project name is required' }, { status: 400 })
    }

    // Create slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')

    // Create project in PayloadCMS
    const project = await payload.create({
      collection: 'projects',
      data: {
        name: name.trim(),
        slug,
        description: description?.trim() || '',
        type,
        genre: genre ? [genre] : [],
        status,
        phase: 'expansion',
        owner: user.id,
        team: [
          {
            user: user.id,
            role: 'owner',
          },
        ],
      },
    })

    return NextResponse.json(
      {
        id: project.id,
        name: project.name,
        slug: project.slug,
        description: project.description,
        type: project.type,
        status: project.status,
        createdAt: project.createdAt,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error creating project:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create project' },
      { status: 500 }
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

    // Get authenticated user
    const { user } = await payload.auth({ headers: req.headers })

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get query parameters
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    // Fetch projects where user is owner or team member
    const projects = await payload.find({
      collection: 'projects',
      where: {
        or: [
          { owner: { equals: user.id } },
          { 'team.user': { equals: user.id } },
        ],
      },
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
      { status: 500 }
    )
  }
}

