import { NextRequest, NextResponse } from 'next/server';
import { acknowledgeGlobalError } from '@/lib/errors/globalErrorHandler';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const errorId = params.id;
    await acknowledgeGlobalError(errorId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Acknowledge error failed:', error);
    return NextResponse.json(
      { error: 'Failed to acknowledge error' },
      { status: 500 }
    );
  }
}
