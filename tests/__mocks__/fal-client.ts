/**
 * Mock FAL.ai Client
 * Provides mock implementations for FAL.ai API calls
 */

import { vi } from 'vitest';

export const mockFalClient = {
  generateImage: vi.fn(),
  generateImageWithReference: vi.fn(),
  generateVideo: vi.fn(),
  checkStatus: vi.fn(),
  downloadAsset: vi.fn(),
};

// Default mock implementations
mockFalClient.generateImage.mockResolvedValue({
  images: [
    {
      url: 'https://fal.ai/generated/image-123.png',
      width: 1024,
      height: 1024,
      contentType: 'image/png',
    },
  ],
  seed: 12345,
  timings: {
    inference: 2.5,
  },
});

mockFalClient.generateImageWithReference.mockResolvedValue({
  images: [
    {
      url: 'https://fal.ai/generated/ref-image-456.png',
      width: 1536,
      height: 864,
      contentType: 'image/png',
    },
  ],
  seed: 67890,
  timings: {
    inference: 3.2,
  },
});

mockFalClient.generateVideo.mockResolvedValue({
  requestId: 'video-req-123',
  status: 'processing',
});

mockFalClient.checkStatus.mockResolvedValue({
  status: 'completed',
  videoUrl: 'https://fal.ai/videos/video-123.mp4',
  duration: 3.0,
});

mockFalClient.downloadAsset.mockResolvedValue({
  buffer: Buffer.from('mock-asset-data'),
  size: 1024000,
});

export default mockFalClient;
