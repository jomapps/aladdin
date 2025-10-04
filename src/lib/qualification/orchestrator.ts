import { createClient } from '@/lib/supabase/server';
import { checkReadiness } from '@/lib/evaluation/checkReadiness';
import { AladdinAgentRunner } from '@/lib/agents/AladdinAgentRunner';
import { getPayloadClient } from '@/lib/payload';

interface PhaseResult {
  department: string;
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * Main qualification workflow orchestrator
 * Executes phases sequentially: A (parallel) → B → C → D
 * STOPS on any error - no partial qualification
 */
export async function executeQualificationWorkflow(
  projectId: string,
  gatherDbName: string
): Promise<string> {

  const qualifiedDbName = `${gatherDbName}_qualified`;

  try {
    // First, evaluate readiness
    console.log('🔍 Evaluating gather data readiness...');
    const readinessResults = await checkReadiness(projectId, gatherDbName);

    // Check if all departments meet minimum threshold
    const minimumScore = 0.7; // 70% readiness required
    const insufficientDepts = Object.entries(readinessResults)
      .filter(([_, score]) => score < minimumScore)
      .map(([dept]) => dept);

    if (insufficientDepts.length > 0) {
      throw new Error(
        `Insufficient gather data for departments: ${insufficientDepts.join(', ')}. ` +
        `Minimum ${minimumScore * 100}% readiness required.`
      );
    }

    // PHASE A: Execute character, world, and visual departments IN PARALLEL
    console.log('🚀 Phase A: Executing character, world, and visual departments in parallel...');
    const phaseAResults = await executePhaseA(projectId, gatherDbName, qualifiedDbName);

    // Check Phase A results
    const phaseAFailures = phaseAResults.filter(r => !r.success);
    if (phaseAFailures.length > 0) {
      throw new Error(
        `Phase A failed for: ${phaseAFailures.map(f => f.department).join(', ')}. ` +
        `Errors: ${phaseAFailures.map(f => f.error).join('; ')}`
      );
    }

    // PHASE B: Execute story department (depends on Phase A)
    console.log('📖 Phase B: Executing story department...');
    const phaseBResult = await executePhaseB(projectId, gatherDbName, qualifiedDbName, phaseAResults);

    if (!phaseBResult.success) {
      throw new Error(`Phase B (Story) failed: ${phaseBResult.error}`);
    }

    // PHASE C: Execute other departments
    console.log('🎬 Phase C: Executing other departments...');
    const phaseCResults = await executePhaseC(projectId, gatherDbName, qualifiedDbName);

    const phaseCFailures = phaseCResults.filter(r => !r.success);
    if (phaseCFailures.length > 0) {
      throw new Error(
        `Phase C failed for: ${phaseCFailures.map(f => f.department).join(', ')}. ` +
        `Errors: ${phaseCFailures.map(f => f.error).join('; ')}`
      );
    }

    // PHASE D: Ingest all qualified data to brain
    console.log('🧠 Phase D: Ingesting qualified data to brain...');
    const phaseDResult = await executePhaseD(projectId, qualifiedDbName);

    if (!phaseDResult.success) {
      throw new Error(`Phase D (Brain Ingestion) failed: ${phaseDResult.error}`);
    }

    console.log('✅ Qualification workflow completed successfully');
    return qualifiedDbName;

  } catch (error) {
    console.error('❌ Qualification workflow failed:', error);
    throw error; // Re-throw to be caught by API route
  }
}

/**
 * PHASE A: Execute character, world, and visual departments in parallel
 */
async function executePhaseA(
  projectId: string,
  gatherDbName: string,
  qualifiedDbName: string
): Promise<PhaseResult[]> {

  const results = await Promise.all([
    executeCharacterDepartment(projectId, gatherDbName, qualifiedDbName),
    executeWorldDepartment(projectId, gatherDbName, qualifiedDbName),
    executeVisualDepartment(projectId, gatherDbName, qualifiedDbName)
  ]);

  return results;
}

async function executeCharacterDepartment(
  projectId: string,
  gatherDbName: string,
  qualifiedDbName: string
): Promise<PhaseResult> {
  try {
    // Use the new CharacterDepartment with 360° generation
    const { CharacterDepartment } = await import('./characterDepartment');

    console.log('🎭 Starting character department with 360° generation...');
    const department = new CharacterDepartment(projectId);

    // Process all characters through the full pipeline:
    // 1. Generate master reference
    // 2. Generate 6x 360° views in parallel
    // 3. Generate vision-based descriptions
    // 4. Store in qualified DB
    // 5. Ingest to brain service
    const qualifiedData = await department.processGatherCharacters();

    console.log(`✅ Character department complete: ${qualifiedData.length} characters qualified`);

    return { department: 'character', success: true, data: qualifiedData };
  } catch (error) {
    console.error('❌ Character department failed:', error);
    return {
      department: 'character',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function executeWorldDepartment(
  projectId: string,
  gatherDbName: string,
  qualifiedDbName: string
): Promise<PhaseResult> {
  try {
    const supabase = await createClient();
    const payload = await getPayloadClient();
    const runner = new AladdinAgentRunner(
      process.env.OPENROUTER_API_KEY!,
      payload
    );

    // Fetch gather data
    const { data: gatherData, error: fetchError } = await supabase
      .from(gatherDbName)
      .select('*')
      .eq('department', 'world');

    if (fetchError) throw fetchError;

    // Load world department head agent
    const worldAgent = await payload.find({
      collection: 'agents',
      where: {
        agentId: { equals: 'story-head-001' }, // World building by story head
        isActive: { equals: true }
      },
      limit: 1
    });

    if (!worldAgent.docs.length) {
      throw new Error('World department agent not found');
    }

    // Create context prompt for world building
    const contextPrompt = `Analyze and qualify world-building data for project ${projectId}:

${JSON.stringify(gatherData, null, 2)}

Generate a comprehensive story bible including:
- World rules and constraints
- Locations with detailed descriptions
- Timeline of events
- Consistency rules for visual and narrative elements
- Themes and visual style guide

Ensure all qualified data maintains consistency and supports the narrative.`;

    // Execute agent
    const result = await runner.executeAgent(
      worldAgent.docs[0].agentId,
      contextPrompt,
      {
        projectId,
        conversationId: `qualification-world-${projectId}`,
        metadata: { phase: 'world-building', gatherDbName, qualifiedDbName }
      }
    );

    if (result.error) {
      throw new Error(result.error.message);
    }

    // Process and store qualified data
    const qualifiedData = processWorldData(gatherData, result.output);

    const { error: insertError } = await supabase
      .from(qualifiedDbName)
      .insert(qualifiedData);

    if (insertError) throw insertError;

    return { department: 'world', success: true, data: qualifiedData };
  } catch (error) {
    return {
      department: 'world',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function executeVisualDepartment(
  projectId: string,
  gatherDbName: string,
  qualifiedDbName: string
): Promise<PhaseResult> {
  try {
    const supabase = await createClient();
    const payload = await getPayloadClient();
    const runner = new AladdinAgentRunner(
      process.env.OPENROUTER_API_KEY!,
      payload
    );

    // Fetch gather data
    const { data: gatherData, error: fetchError } = await supabase
      .from(gatherDbName)
      .select('*')
      .eq('department', 'visual');

    if (fetchError) throw fetchError;

    // Load visual department head agent
    const visualAgent = await payload.find({
      collection: 'agents',
      where: {
        agentId: { equals: 'visual-head-001' },
        isActive: { equals: true }
      },
      limit: 1
    });

    if (!visualAgent.docs.length) {
      throw new Error('Visual department agent not found');
    }

    // Create context prompt for visual qualification
    const contextPrompt = `Analyze and qualify visual design data for project ${projectId}:

${JSON.stringify(gatherData, null, 2)}

Generate comprehensive visual guidelines including:
- Visual style and art direction
- Color palettes and mood boards
- Lighting and cinematography guidelines
- Visual consistency rules
- Quality standards for image generation

Ensure all qualified data maintains visual coherence and supports the narrative tone.`;

    // Execute agent
    const result = await runner.executeAgent(
      visualAgent.docs[0].agentId,
      contextPrompt,
      {
        projectId,
        conversationId: `qualification-visual-${projectId}`,
        metadata: { phase: 'visual-design', gatherDbName, qualifiedDbName }
      }
    );

    if (result.error) {
      throw new Error(result.error.message);
    }

    // Process and store qualified data
    const qualifiedData = processVisualData(gatherData, result.output);

    const { error: insertError } = await supabase
      .from(qualifiedDbName)
      .insert(qualifiedData);

    if (insertError) throw insertError;

    return { department: 'visual', success: true, data: qualifiedData };
  } catch (error) {
    return {
      department: 'visual',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * PHASE B: Execute story department (depends on Phase A results)
 */
async function executePhaseB(
  projectId: string,
  gatherDbName: string,
  qualifiedDbName: string,
  phaseAResults: PhaseResult[]
): Promise<PhaseResult> {
  try {
    const supabase = await createClient();
    const payload = await getPayloadClient();
    const runner = new AladdinAgentRunner(
      process.env.OPENROUTER_API_KEY!,
      payload
    );

    // Get story data from gather
    const { data: gatherData, error: fetchError } = await supabase
      .from(gatherDbName)
      .select('*')
      .eq('department', 'story');

    if (fetchError) throw fetchError;

    // Load story department head agent
    const storyAgent = await payload.find({
      collection: 'agents',
      where: {
        agentId: { equals: 'story-head-001' },
        isActive: { equals: true }
      },
      limit: 1
    });

    if (!storyAgent.docs.length) {
      throw new Error('Story department agent not found');
    }

    // Process story data using Phase A results for context
    const characterData = phaseAResults.find(r => r.department === 'character')?.data;
    const worldData = phaseAResults.find(r => r.department === 'world')?.data;
    const visualData = phaseAResults.find(r => r.department === 'visual')?.data;

    // Create context prompt for story qualification with Phase A context
    const contextPrompt = `Analyze and qualify story data for project ${projectId} with context from Phase A:

GATHER STORY DATA:
${JSON.stringify(gatherData, null, 2)}

QUALIFIED CHARACTER DATA:
${JSON.stringify(characterData, null, 2)}

QUALIFIED WORLD DATA:
${JSON.stringify(worldData, null, 2)}

QUALIFIED VISUAL DATA:
${JSON.stringify(visualData, null, 2)}

Generate a comprehensive screenplay and scene breakdown including:
- Complete screenplay following industry format
- Detailed scene breakdowns with camera/lighting direction
- Dramatic effect analysis for each scene
- Integration with character arcs and world rules
- Visual consistency with art direction

Ensure all story elements are consistent with the qualified character, world, and visual data from Phase A.`;

    // Execute agent
    const result = await runner.executeAgent(
      storyAgent.docs[0].agentId,
      contextPrompt,
      {
        projectId,
        conversationId: `qualification-story-${projectId}`,
        metadata: {
          phase: 'story-development',
          gatherDbName,
          qualifiedDbName,
          contextData: { characterData, worldData, visualData }
        }
      }
    );

    if (result.error) {
      throw new Error(result.error.message);
    }

    // Process and store qualified data
    const qualifiedData = processStoryData(gatherData, { characterData, worldData }, result.output);

    // Store in qualified database
    const { error: insertError } = await supabase
      .from(qualifiedDbName)
      .insert(qualifiedData);

    if (insertError) throw insertError;

    return { department: 'story', success: true, data: qualifiedData };
  } catch (error) {
    return {
      department: 'story',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * PHASE C: Execute other departments
 */
async function executePhaseC(
  projectId: string,
  gatherDbName: string,
  qualifiedDbName: string
): Promise<PhaseResult[]> {

  const otherDepartments = ['dialogue', 'music', 'sfx', 'voice'];

  const results = await Promise.all(
    otherDepartments.map(dept => executeOtherDepartment(dept, projectId, gatherDbName, qualifiedDbName))
  );

  return results;
}

async function executeOtherDepartment(
  department: string,
  projectId: string,
  gatherDbName: string,
  qualifiedDbName: string
): Promise<PhaseResult> {
  try {
    const supabase = await createClient();

    const { data: gatherData, error: fetchError } = await supabase
      .from(gatherDbName)
      .select('*')
      .eq('department', department);

    if (fetchError) throw fetchError;

    const qualifiedData = processGenericDepartmentData(department, gatherData);

    const { error: insertError } = await supabase
      .from(qualifiedDbName)
      .insert(qualifiedData);

    if (insertError) throw insertError;

    return { department, success: true, data: qualifiedData };
  } catch (error) {
    return {
      department,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * PHASE D: Ingest all qualified data to brain
 */
async function executePhaseD(
  projectId: string,
  qualifiedDbName: string
): Promise<PhaseResult> {
  try {
    const supabase = await createClient();

    // Get all qualified data
    const { data: qualifiedData, error: fetchError } = await supabase
      .from(qualifiedDbName)
      .select('*');

    if (fetchError) throw fetchError;

    // Ingest to brain service
    const brainResponse = await fetch(`${process.env.BRAIN_SERVICE_URL}/ingest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        projectId,
        data: qualifiedData
      })
    });

    if (!brainResponse.ok) {
      throw new Error(`Brain ingestion failed: ${brainResponse.statusText}`);
    }

    return { department: 'brain', success: true };
  } catch (error) {
    return {
      department: 'brain',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Data processing functions
function processCharacterData(data: any[]): any[] {
  // Add qualification logic for character data
  return data.map(item => ({
    ...item,
    qualified: true,
    qualified_at: new Date().toISOString()
  }));
}

function processWorldData(data: any[], agentOutput?: any): any[] {
  // Add qualification logic for world data
  // Merge agent output with original gather data
  return data.map(item => ({
    ...item,
    qualified: true,
    qualified_at: new Date().toISOString(),
    agent_qualified: agentOutput ? {
      storyBible: agentOutput,
      processedBy: 'story-head-001'
    } : undefined
  }));
}

function processVisualData(data: any[], agentOutput?: any): any[] {
  // Add qualification logic for visual data
  // Merge agent output with original gather data
  return data.map(item => ({
    ...item,
    qualified: true,
    qualified_at: new Date().toISOString(),
    agent_qualified: agentOutput ? {
      visualGuidelines: agentOutput,
      processedBy: 'visual-head-001'
    } : undefined
  }));
}

function processStoryData(data: any[], context: { characterData?: any[], worldData?: any[] }, agentOutput?: any): any[] {
  // Add qualification logic for story data with context from Phase A
  // Merge agent output with original gather data
  return data.map(item => ({
    ...item,
    qualified: true,
    qualified_at: new Date().toISOString(),
    context_applied: true,
    agent_qualified: agentOutput ? {
      screenplay: agentOutput,
      processedBy: 'story-head-001',
      contextData: context
    } : undefined
  }));
}

function processGenericDepartmentData(department: string, data: any[]): any[] {
  // Generic qualification logic
  return data.map(item => ({
    ...item,
    department,
    qualified: true,
    qualified_at: new Date().toISOString()
  }));
}
