import { NextRequest, NextResponse } from 'next/server';
import { executeQualificationWorkflow } from '@/lib/qualification/orchestrator';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id;
    const supabase = await createClient();

    // Check if project exists and get gather database name
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, gather_db_name, status')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Check if gather database is already locked
    if (project.status === 'qualifying' || project.status === 'qualified') {
      return NextResponse.json(
        { error: 'Project is already being qualified or has been qualified' },
        { status: 409 }
      );
    }

    // Lock the gather database by updating project status
    const { error: lockError } = await supabase
      .from('projects')
      .update({
        status: 'qualifying',
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId);

    if (lockError) {
      return NextResponse.json(
        { error: 'Failed to lock project for qualification' },
        { status: 500 }
      );
    }

    try {
      // Execute qualification workflow
      // This runs: Phase A (parallel) → B → C → D sequentially
      const qualifiedDbName = await executeQualificationWorkflow(
        projectId,
        project.gather_db_name
      );

      // Update project status to qualified and store qualified DB name
      const { error: updateError } = await supabase
        .from('projects')
        .update({
          status: 'qualified',
          qualified_db_name: qualifiedDbName,
          qualified_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', projectId);

      if (updateError) {
        throw new Error(`Failed to update project status: ${updateError.message}`);
      }

      return NextResponse.json({
        success: true,
        qualifiedDbName,
        message: 'Project qualified successfully'
      });

    } catch (workflowError) {
      // On any error, unlock the database and set error state
      const errorMessage = workflowError instanceof Error
        ? workflowError.message
        : 'Unknown error during qualification';

      await supabase
        .from('projects')
        .update({
          status: 'qualification_failed',
          last_error: errorMessage,
          updated_at: new Date().toISOString()
        })
        .eq('id', projectId);

      // Store global error for display across all pages
      await supabase
        .from('global_errors')
        .insert({
          project_id: projectId,
          error_type: 'qualification_failed',
          error_message: errorMessage,
          created_at: new Date().toISOString()
        });

      return NextResponse.json(
        {
          error: errorMessage,
          details: 'Qualification stopped due to error. No partial qualification applied.'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Qualification API error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
        details: 'Failed to initiate qualification workflow'
      },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id;
    const supabase = await createClient();

    // Get qualification status
    const { data: project, error } = await supabase
      .from('projects')
      .select('id, status, qualified_db_name, qualified_at, last_error')
      .eq('id', projectId)
      .single();

    if (error || !project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      status: project.status,
      qualifiedDbName: project.qualified_db_name,
      qualifiedAt: project.qualified_at,
      lastError: project.last_error
    });

  } catch (error) {
    console.error('Get qualification status error:', error);
    return NextResponse.json(
      { error: 'Failed to get qualification status' },
      { status: 500 }
    );
  }
}
