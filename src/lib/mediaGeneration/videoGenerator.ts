/**
 * Video Generator
 * Submits video generation tasks to tasks.ft.tc and handles completion
 */

import { taskService } from '../services/taskServiceClient.js';

interface VideoGenerationParams {
  prompt: string;
  sceneMetadata: {
    narration: string;
    visualDescription: string;
    duration?: number;
    style?: string;
  };
  webhookUrl?: string;
}

interface VideoGenerationResult {
  videoUrl: string;
  duration: number;
  taskId: string;
}

export class VideoGenerator {
  private readonly defaultTimeout = 600000; // 10 minutes

  /**
   * Build video prompt from scene metadata
   */
  private buildVideoPrompt(metadata: VideoGenerationParams['sceneMetadata']): string {
    const parts: string[] = [];

    // Visual description is primary
    if (metadata.visualDescription) {
      parts.push(metadata.visualDescription);
    }

    // Add narration context
    if (metadata.narration) {
      parts.push(`Narration context: "${metadata.narration}"`);
    }

    // Add style if specified
    if (metadata.style) {
      parts.push(`Style: ${metadata.style}`);
    }

    // Add duration hint if specified
    if (metadata.duration) {
      parts.push(`Target duration: ${metadata.duration} seconds`);
    }

    return parts.join('\n\n');
  }

  /**
   * Generate video for a scene
   */
  async generateVideo(params: VideoGenerationParams): Promise<VideoGenerationResult> {
    const prompt = this.buildVideoPrompt(params.sceneMetadata);

    console.log('Submitting video generation task...');
    console.log('Prompt:', prompt);

    // Submit task to tasks.ft.tc
    const taskResponse = await taskService.submitTask({
      type: 'video_generation',
      payload: {
        prompt: params.prompt || prompt,
        metadata: params.sceneMetadata,
      },
      webhookUrl: params.webhookUrl,
    });

    console.log(`Task submitted: ${taskResponse.taskId}`);

    // Poll for completion
    const result = await taskService.pollTaskStatus(
      taskResponse.taskId,
      this.defaultTimeout,
      5000 // Poll every 5 seconds
    );

    if (result.status === 'failed') {
      throw new Error(`Video generation failed: ${result.error || 'Unknown error'}`);
    }

    if (!result.result?.videoUrl) {
      throw new Error('Video generation completed but no video URL returned');
    }

    return {
      videoUrl: result.result.videoUrl,
      duration: result.result.duration || params.sceneMetadata.duration || 0,
      taskId: taskResponse.taskId,
    };
  }

  /**
   * Generate video with async webhook
   */
  async generateVideoAsync(
    params: VideoGenerationParams,
    webhookUrl: string
  ): Promise<{ taskId: string }> {
    const prompt = this.buildVideoPrompt(params.sceneMetadata);

    const taskResponse = await taskService.submitTask({
      type: 'video_generation',
      payload: {
        prompt: params.prompt || prompt,
        metadata: params.sceneMetadata,
      },
      webhookUrl,
    });

    return { taskId: taskResponse.taskId };
  }

  /**
   * Get video generation status
   */
  async getStatus(taskId: string) {
    return taskService.pollTaskStatus(taskId, 0); // No polling, just get current status
  }
}

// Export singleton instance
export const videoGenerator = new VideoGenerator();
