import { createClient } from '@/lib/supabase/server';

export interface GlobalError {
  id: string;
  project_id: string;
  error_type: 'qualification_failed' | 'gather_failed' | 'brain_failed' | 'general';
  error_message: string;
  error_details?: any;
  created_at: string;
  acknowledged: boolean;
}

/**
 * Store a global error that will be visible across all pages
 */
export async function storeGlobalError(
  projectId: string,
  errorType: GlobalError['error_type'],
  errorMessage: string,
  errorDetails?: any
): Promise<void> {
  try {
    const supabase = await createClient();

    await supabase
      .from('global_errors')
      .insert({
        project_id: projectId,
        error_type: errorType,
        error_message: errorMessage,
        error_details: errorDetails,
        created_at: new Date().toISOString(),
        acknowledged: false
      });

  } catch (error) {
    console.error('Failed to store global error:', error);
    // Don't throw - this is a best-effort operation
  }
}

/**
 * Get all unacknowledged global errors for a project
 */
export async function getGlobalErrors(projectId: string): Promise<GlobalError[]> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('global_errors')
      .select('*')
      .eq('project_id', projectId)
      .eq('acknowledged', false)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Failed to fetch global errors:', error);
    return [];
  }
}

/**
 * Acknowledge a global error (mark as read)
 */
export async function acknowledgeGlobalError(errorId: string): Promise<void> {
  try {
    const supabase = await createClient();

    await supabase
      .from('global_errors')
      .update({
        acknowledged: true,
        acknowledged_at: new Date().toISOString()
      })
      .eq('id', errorId);

  } catch (error) {
    console.error('Failed to acknowledge global error:', error);
  }
}

/**
 * Clear all acknowledged errors older than specified days
 */
export async function clearOldErrors(daysOld: number = 7): Promise<void> {
  try {
    const supabase = await createClient();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    await supabase
      .from('global_errors')
      .delete()
      .eq('acknowledged', true)
      .lt('created_at', cutoffDate.toISOString());

  } catch (error) {
    console.error('Failed to clear old errors:', error);
  }
}
