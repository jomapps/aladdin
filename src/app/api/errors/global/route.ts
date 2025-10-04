import { NextRequest, NextResponse } from 'next/server';
import { getGlobalErrors } from '@/lib/errors/globalErrorHandler';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    const errors = await getGlobalErrors(projectId);

    return NextResponse.json({ errors });
  } catch (error) {
    console.error('Get global errors error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch global errors' },
      { status: 500 }
    );
  }
}
