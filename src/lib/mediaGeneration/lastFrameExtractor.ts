/**
 * Last Frame Extractor
 * Extracts the last frame from videos using last-frame.ft.tc service
 */

interface LastFrameRequest {
  videoUrl: string;
  webhookUrl?: string;
}

interface LastFrameResult {
  imageUrl: string;
  taskId: string;
  width?: number;
  height?: number;
}

interface ProcessResponse {
  taskId: string;
  status: string;
  pollUrl?: string;
}

interface StatusResponse {
  taskId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: {
    imageUrl: string;
    width?: number;
    height?: number;
  };
  error?: string;
}

export class LastFrameExtractor {
  private readonly baseUrl = 'https://last-frame.ft.tc/api/v1';
  private readonly bearerToken = '121972d9789bbedfa0751974b62571b24329330bceee1c792e93b00ce7cd6a67';
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000;

  /**
   * Extract last frame from video
   */
  async extractLastFrame(request: LastFrameRequest): Promise<LastFrameResult> {
    console.log('Extracting last frame from:', request.videoUrl);

    // Submit extraction task
    const processResponse = await this.submitExtraction(request);

    console.log(`Extraction task submitted: ${processResponse.taskId}`);

    // Poll for completion
    const result = await this.pollForCompletion(processResponse.taskId);

    if (!result.result?.imageUrl) {
      throw new Error('Last frame extraction completed but no image URL returned');
    }

    return {
      imageUrl: result.result.imageUrl,
      taskId: processResponse.taskId,
      width: result.result.width,
      height: result.result.height,
    };
  }

  /**
   * Extract last frame with async webhook
   */
  async extractLastFrameAsync(
    request: LastFrameRequest,
    webhookUrl: string
  ): Promise<{ taskId: string }> {
    const processResponse = await this.submitExtraction({
      ...request,
      webhookUrl,
    });

    return { taskId: processResponse.taskId };
  }

  /**
   * Submit extraction request
   */
  private async submitExtraction(request: LastFrameRequest): Promise<ProcessResponse> {
    const url = `${this.baseUrl}/process`;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.bearerToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            video_url: request.videoUrl,
            webhook_url: request.webhookUrl,
          }),
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Extraction submission failed: ${response.status} - ${error}`);
        }

        return await response.json();
      } catch (error) {
        if (attempt === this.maxRetries - 1) throw error;
        await this.delay(this.retryDelay * Math.pow(2, attempt));
      }
    }

    throw new Error('Failed to submit extraction after retries');
  }

  /**
   * Poll for extraction completion
   */
  private async pollForCompletion(
    taskId: string,
    timeoutMs: number = 300000, // 5 minutes
    pollIntervalMs: number = 3000
  ): Promise<StatusResponse> {
    const startTime = Date.now();
    const url = `${this.baseUrl}/status/${taskId}`;

    while (Date.now() - startTime < timeoutMs) {
      try {
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${this.bearerToken}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to get extraction status: ${response.status}`);
        }

        const status: StatusResponse = await response.json();

        if (status.status === 'completed') {
          return status;
        }

        if (status.status === 'failed') {
          throw new Error(`Last frame extraction failed: ${status.error || 'Unknown error'}`);
        }

        // Continue polling
        await this.delay(pollIntervalMs);
      } catch (error) {
        console.error('Error polling extraction status:', error);
        await this.delay(pollIntervalMs);
      }
    }

    throw new Error(`Last frame extraction timed out after ${timeoutMs}ms`);
  }

  /**
   * Get extraction status
   */
  async getStatus(taskId: string): Promise<StatusResponse> {
    const url = `${this.baseUrl}/status/${taskId}`;

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

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const lastFrameExtractor = new LastFrameExtractor();
