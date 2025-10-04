import { createClient } from '@/lib/supabase/server';

interface ReadinessScores {
  [department: string]: number;
}

interface EvaluationRequest {
  projectId: string;
  gatherDbName: string;
  departments: string[];
}

interface EvaluationResponse {
  taskId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  results?: ReadinessScores;
  error?: string;
}

/**
 * Evaluate if gather data is sufficient for qualification
 * Submits to tasks.ft.tc for AI evaluation and polls for results
 */
export async function checkReadiness(
  projectId: string,
  gatherDbName: string
): Promise<ReadinessScores> {

  const departments = [
    'character',
    'world',
    'visual',
    'story',
    'dialogue',
    'music',
    'sfx',
    'voice'
  ];

  try {
    // Submit evaluation request to tasks.ft.tc
    const taskId = await submitEvaluationRequest({
      projectId,
      gatherDbName,
      departments
    });

    // Poll for results
    const results = await pollForResults(taskId);

    return results;

  } catch (error) {
    console.error('Readiness check failed:', error);
    throw new Error(
      `Failed to evaluate gather data readiness: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}

/**
 * Submit evaluation request to tasks.ft.tc
 */
async function submitEvaluationRequest(request: EvaluationRequest): Promise<string> {
  const supabase = await createClient();

  // Get gather data for evaluation
  const { data: gatherData, error: fetchError } = await supabase
    .from(request.gatherDbName)
    .select('*');

  if (fetchError) {
    throw new Error(`Failed to fetch gather data: ${fetchError.message}`);
  }

  // Prepare evaluation payload
  const evaluationPayload = {
    type: 'qualification_readiness',
    projectId: request.projectId,
    departments: request.departments,
    data: gatherData,
    criteria: {
      character: {
        required_fields: ['name', 'description', 'traits', 'backstory'],
        min_entries: 1
      },
      world: {
        required_fields: ['setting', 'time_period', 'atmosphere'],
        min_entries: 1
      },
      visual: {
        required_fields: ['style', 'color_palette', 'reference_images'],
        min_entries: 1
      },
      story: {
        required_fields: ['plot', 'acts', 'key_events'],
        min_entries: 1
      },
      dialogue: {
        required_fields: ['sample_lines', 'tone'],
        min_entries: 3
      },
      music: {
        required_fields: ['mood', 'genre', 'tempo'],
        min_entries: 1
      },
      sfx: {
        required_fields: ['sound_type', 'description'],
        min_entries: 3
      },
      voice: {
        required_fields: ['character_ref', 'voice_direction'],
        min_entries: 1
      }
    }
  };

  // Submit to tasks.ft.tc
  const response = await fetch('https://tasks.ft.tc/api/evaluate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.TASKS_FT_TC_API_KEY}`
    },
    body: JSON.stringify(evaluationPayload)
  });

  if (!response.ok) {
    throw new Error(`Evaluation submission failed: ${response.statusText}`);
  }

  const { taskId } = await response.json();

  if (!taskId) {
    throw new Error('No task ID received from evaluation service');
  }

  console.log(`📝 Evaluation task submitted: ${taskId}`);
  return taskId;
}

/**
 * Poll for evaluation results
 */
async function pollForResults(
  taskId: string,
  maxAttempts: number = 30,
  intervalMs: number = 2000
): Promise<ReadinessScores> {

  let attempts = 0;

  while (attempts < maxAttempts) {
    try {
      const response = await fetch(`https://tasks.ft.tc/api/evaluate/${taskId}`, {
        headers: {
          'Authorization': `Bearer ${process.env.TASKS_FT_TC_API_KEY}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to poll results: ${response.statusText}`);
      }

      const evaluation: EvaluationResponse = await response.json();

      if (evaluation.status === 'completed' && evaluation.results) {
        console.log('✅ Evaluation completed:', evaluation.results);
        return evaluation.results;
      }

      if (evaluation.status === 'failed') {
        throw new Error(`Evaluation failed: ${evaluation.error || 'Unknown error'}`);
      }

      // Still processing, wait and retry
      console.log(`⏳ Evaluation in progress (${evaluation.status})... attempt ${attempts + 1}/${maxAttempts}`);
      await new Promise(resolve => setTimeout(resolve, intervalMs));
      attempts++;

    } catch (error) {
      console.error('Polling error:', error);
      attempts++;

      if (attempts >= maxAttempts) {
        throw new Error('Evaluation timeout: maximum polling attempts reached');
      }

      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
  }

  throw new Error('Evaluation timeout: no results received');
}

/**
 * Calculate local readiness scores (fallback if tasks.ft.tc is unavailable)
 */
export async function calculateLocalReadiness(
  gatherDbName: string,
  departments: string[]
): Promise<ReadinessScores> {
  const supabase = await createClient();
  const scores: ReadinessScores = {};

  for (const department of departments) {
    const { data, error } = await supabase
      .from(gatherDbName)
      .select('*')
      .eq('department', department);

    if (error || !data) {
      scores[department] = 0;
      continue;
    }

    // Simple scoring based on data completeness
    const requiredFields = getRequiredFields(department);
    const totalFields = requiredFields.length;

    let completedFields = 0;
    for (const field of requiredFields) {
      const hasData = data.some(item => item[field] && item[field].toString().trim().length > 0);
      if (hasData) completedFields++;
    }

    scores[department] = completedFields / totalFields;
  }

  return scores;
}

function getRequiredFields(department: string): string[] {
  const fieldMap: { [key: string]: string[] } = {
    character: ['name', 'description', 'traits', 'backstory'],
    world: ['setting', 'time_period', 'atmosphere'],
    visual: ['style', 'color_palette', 'reference_images'],
    story: ['plot', 'acts', 'key_events'],
    dialogue: ['sample_lines', 'tone'],
    music: ['mood', 'genre', 'tempo'],
    sfx: ['sound_type', 'description'],
    voice: ['character_ref', 'voice_direction']
  };

  return fieldMap[department] || [];
}
