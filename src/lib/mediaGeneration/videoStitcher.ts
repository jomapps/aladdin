/**
 * Video Stitcher
 * Assembles final video from completed scenes using last-frame.ft.tc
 */

import type { SupabaseClient } from '@supabase/supabase-js';

interface Scene {
  id: string;
  sequence_order: number;
  video_url: string | null;
  video_duration: number | null;
  status: string;
}

interface StitchRequest {
  scenes: Array<{
    videoUrl: string;
    duration: number;
    order: number;
  }>;
  webhookUrl?: string;
}

interface StitchResult {
  videoUrl: string;
  duration: number;
  taskId: string;
}

interface StitchResponse {
  taskId: string;
  status: string;
  pollUrl?: string;
}

interface StitchStatusResponse {
  taskId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: {
    videoUrl: string;
    duration: number;
  };
  error?: string;
  progress?: number;
}

export class VideoStitcher {
  private readonly baseUrl = 'https://last-frame.ft.tc/api/v1';
  private readonly bearerToken = '121972d9789bbedfa0751974b62571b24329330bceee1c792e93b00ce7cd6a67';
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000;

  /**
   * Get all completed scenes for a project in sequence order
   */
  async getCompletedScenes(
    supabase: SupabaseClient,
    projectId: string
  ): Promise<Scene[]> {
    const { data: scenes, error } = await supabase
      .from('scenes')
      .select('id, sequence_order, video_url, video_duration, status')
      .eq('project_id', projectId)
      .eq('status', 'completed')
      .not('video_url', 'is', null)
      .order('sequence_order', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch scenes: ${error.message}`);
    }

    if (!scenes || scenes.length === 0) {
      throw new Error('No completed scenes found for stitching');
    }

    return scenes;
  }

  /**
   * Stitch all scenes into final video
   */
  async stitchScenes(
    supabase: SupabaseClient,
    projectId: string,
    webhookUrl?: string
  ): Promise<StitchResult> {
    // Get completed scenes
    const scenes = await this.getCompletedScenes(supabase, projectId);

    // Validate all scenes have required data
    const validScenes = scenes.filter(s => s.video_url && s.video_duration);

    if (validScenes.length === 0) {
      throw new Error('No valid scenes with video URLs and durations');
    }

    if (validScenes.length !== scenes.length) {
      console.warn(`${scenes.length - validScenes.length} scenes missing video data, skipping`);
    }

    // Prepare stitch request
    const stitchRequest: StitchRequest = {
      scenes: validScenes.map(s => ({
        videoUrl: s.video_url!,
        duration: s.video_duration!,
        order: s.sequence_order,
      })),
      webhookUrl,
    };

    console.log(`Stitching ${validScenes.length} scenes for project ${projectId}...`);

    // Submit stitch task
    const stitchResponse = await this.submitStitch(stitchRequest);

    console.log(`Stitch task submitted: ${stitchResponse.taskId}`);

    // Poll for completion
    const result = await this.pollForCompletion(stitchResponse.taskId);

    if (!result.result?.videoUrl) {
      throw new Error('Stitch completed but no video URL returned');
    }

    // Update project with final video URL
    await this.updateProject(supabase, projectId, result.result.videoUrl, result.result.duration);

    return {
      videoUrl: result.result.videoUrl,
      duration: result.result.duration,
      taskId: stitchResponse.taskId,
    };
  }

  /**
   * Submit stitch request
   */
  private async submitStitch(request: StitchRequest): Promise<StitchResponse> {
    const url = `${this.baseUrl}/stitch`;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.bearerToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            scenes: request.scenes,
            webhook_url: request.webhookUrl,
          }),
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Stitch submission failed: ${response.status} - ${error}`);
        }

        return await response.json();
      } catch (error) {
        if (attempt === this.maxRetries - 1) throw error;
        await this.delay(this.retryDelay * Math.pow(2, attempt));
      }
    }

    throw new Error('Failed to submit stitch after retries');
  }

  /**
   * Poll for stitch completion
   */
  private async pollForCompletion(
    taskId: string,
    timeoutMs: number = 600000, // 10 minutes
    pollIntervalMs: number = 5000
  ): Promise<StitchStatusResponse> {
    const startTime = Date.now();
    const url = `${this.baseUrl}/stitch/status/${taskId}`;

    while (Date.now() - startTime < timeoutMs) {
      try {
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${this.bearerToken}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to get stitch status: ${response.status}`);
        }

        const status: StitchStatusResponse = await response.json();

        if (status.progress) {
          console.log(`Stitch progress: ${status.progress}%`);
        }

        if (status.status === 'completed') {
          return status;
        }

        if (status.status === 'failed') {
          throw new Error(`Video stitch failed: ${status.error || 'Unknown error'}`);
        }

        // Continue polling
        await this.delay(pollIntervalMs);
      } catch (error) {
        console.error('Error polling stitch status:', error);
        await this.delay(pollIntervalMs);
      }
    }

    throw new Error(`Video stitch timed out after ${timeoutMs}ms`);
  }

  /**
   * Update project with final video URL
   */
  private async updateProject(
    supabase: SupabaseClient,
    projectId: string,
    videoUrl: string,
    duration: number
  ): Promise<void> {
    const { error } = await supabase
      .from('projects')
      .update({
        final_video_url: videoUrl,
        final_video_duration: duration,
        updated_at: new Date().toISOString(),
      })
      .eq('id', projectId);

    if (error) {
      throw new Error(`Failed to update project: ${error.message}`);
    }

    console.log(`Project ${projectId} updated with final video URL`);
  }

  /**
   * Get stitch status
   */
  async getStatus(taskId: string): Promise<StitchStatusResponse> {
    const url = `${this.baseUrl}/stitch/status/${taskId}`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${this.bearerToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get status: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Stitch scenes asynchronously with webhook
   */
  async stitchScenesAsync(
    supabase: SupabaseClient,
    projectId: string,
    webhookUrl: string
  ): Promise<{ taskId: string }> {
    const scenes = await this.getCompletedScenes(supabase, projectId);

    const validScenes = scenes.filter(s => s.video_url && s.video_duration);

    if (validScenes.length === 0) {
      throw new Error('No valid scenes with video URLs and durations');
    }

    const stitchRequest: StitchRequest = {
      scenes: validScenes.map(s => ({
        videoUrl: s.video_url!,
        duration: s.video_duration!,
        order: s.sequence_order,
      })),
      webhookUrl,
    };

    const stitchResponse = await this.submitStitch(stitchRequest);

    return { taskId: stitchResponse.taskId };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const videoStitcher = new VideoStitcher();
