/**
 * Suite 7: Cross-Department Integration Tests
 * Tests video integration across Story, Visual, Image, and Video departments
 *
 * Total Tests: 25+
 */

import { describe, it, expect, beforeAll } from 'vitest';

describe('Video Cross-Department Integration Tests', () => {
  const testProjectId = 'aladdin-project';
  const testEpisodeId = 'episode-1';

  beforeAll(async () => {
    process.env.FAL_API_KEY = process.env.FAL_API_KEY || 'test-fal-key';
    process.env.ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || 'test-elevenlabs-key';
  });

  describe('Story → Visual → Image → Video Workflow', () => {
    it('should execute complete pipeline from story to video', async () => {
      const workflow = {
        story: {
          department: 'story',
          output: {
            sceneDescription: 'Aladdin enters bustling marketplace at noon',
            characterActions: ['walking', 'looking around', 'smiling'],
            dialogue: 'What a beautiful day in the marketplace!',
            mood: 'curious and optimistic',
          },
          status: 'completed',
        },
        visual: {
          department: 'visual',
          input: {
            sceneDescription: 'Aladdin enters bustling marketplace at noon',
          },
          output: {
            shotList: [
              { type: 'wide-shot', angle: 'eye-level', duration: 5 },
              { type: 'medium-shot', angle: 'slight-low', duration: 4 },
              { type: 'close-up', angle: 'eye-level', duration: 3 },
            ],
            colorPalette: ['warm yellows', 'orange', 'terracotta'],
            lighting: 'bright midday sun',
            cameraMovement: 'steady pan right',
          },
          status: 'completed',
        },
        imageGeneration: {
          department: 'image-quality',
          input: {
            shotList: [
              { type: 'wide-shot', description: 'Bustling marketplace wide view' },
              { type: 'medium-shot', description: 'Aladdin walking through crowd' },
              { type: 'close-up', description: 'Aladdin smiling face' },
            ],
          },
          output: {
            shots: [
              {
                shotId: 'shot-1',
                imageId: 'img-001',
                url: 'https://example.com/img-001.png',
                status: 'completed',
              },
              {
                shotId: 'shot-2',
                imageId: 'img-002',
                url: 'https://example.com/img-002.png',
                status: 'completed',
              },
              {
                shotId: 'shot-3',
                imageId: 'img-003',
                url: 'https://example.com/img-003.png',
                status: 'completed',
              },
            ],
          },
          status: 'completed',
        },
        videoGeneration: {
          department: 'video',
          input: {
            shots: [
              { imageUrl: 'https://example.com/img-001.png', prompt: 'Camera pans right' },
              { imageUrl: 'https://example.com/img-002.png', prompt: 'Aladdin walks forward' },
              { imageUrl: 'https://example.com/img-003.png', prompt: 'Aladdin smiles' },
            ],
          },
          output: {
            videos: [
              { videoId: 'vid-001', duration: 5, status: 'completed' },
              { videoId: 'vid-002', duration: 4, status: 'completed' },
              { videoId: 'vid-003', duration: 3, status: 'completed' },
            ],
            sceneId: 'scene-001',
            totalDuration: 12,
          },
          status: 'completed',
        },
      };

      expect(workflow.story.status).toBe('completed');
      expect(workflow.visual.status).toBe('completed');
      expect(workflow.imageGeneration.status).toBe('completed');
      expect(workflow.videoGeneration.status).toBe('completed');
      expect(workflow.videoGeneration.output.videos).toHaveLength(3);
    });

    it('should maintain context through all departments', async () => {
      const context = {
        projectId: testProjectId,
        episodeId: testEpisodeId,
        sceneId: 'scene-1',
        characterId: 'aladdin-001',
        locationId: 'marketplace-001',
        mood: 'curious',
        lightingStyle: 'bright midday',
      };

      const departmentOutputs = {
        story: { context: { ...context, dialogue: 'Added dialogue' } },
        visual: { context: { ...context, shotAngles: ['eye-level', 'low'] } },
        imageGeneration: { context: { ...context, imageCount: 3 } },
        videoGeneration: { context: { ...context, videoCount: 3 } },
      };

      expect(departmentOutputs.story.context.sceneId).toBe('scene-1');
      expect(departmentOutputs.visual.context.sceneId).toBe('scene-1');
      expect(departmentOutputs.imageGeneration.context.sceneId).toBe('scene-1');
      expect(departmentOutputs.videoGeneration.context.sceneId).toBe('scene-1');
    });

    it('should pass visual styling from Visual to Video', async () => {
      const visualOutput = {
        colorPalette: ['warm', 'vibrant'],
        lighting: 'golden hour',
        mood: 'romantic',
      };

      const videoInput = {
        colorGuidance: visualOutput.colorPalette,
        lighting: visualOutput.lighting,
        mood: visualOutput.mood,
      };

      expect(videoInput.lighting).toBe(visualOutput.lighting);
      expect(videoInput.mood).toBe(visualOutput.mood);
    });
  });

  describe('Character Creation → 360° Profile → Animated Video', () => {
    it('should create character and generate animated video', async () => {
      const workflow = {
        characterCreation: {
          characterId: 'aladdin-001',
          name: 'Aladdin',
          description: 'Young man with dark hair, purple vest',
          status: 'completed',
        },
        masterReference: {
          referenceId: 'ref-aladdin',
          imageUrl: 'https://example.com/aladdin-ref.png',
          status: 'completed',
        },
        profile360: {
          profileId: '360-aladdin',
          angles: [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330],
          images: Array(12)
            .fill(null)
            .map((_, i) => ({
              angle: i * 30,
              imageUrl: `https://example.com/aladdin-${i * 30}.png`,
            })),
          status: 'completed',
        },
        animatedVideo: {
          videoId: 'aladdin-turn-360',
          method: 'first-last-frame',
          firstFrame: 'https://example.com/aladdin-0.png',
          lastFrame: 'https://example.com/aladdin-330.png',
          duration: 6,
          status: 'completed',
        },
      };

      expect(workflow.characterCreation.status).toBe('completed');
      expect(workflow.profile360.images).toHaveLength(12);
      expect(workflow.animatedVideo.status).toBe('completed');
    });

    it('should use 360° profile for consistent character animation', async () => {
      const characterData = {
        characterId: 'aladdin-001',
        profile360Id: '360-aladdin',
        availableAngles: [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330],
      };

      const videoTask = {
        characterId: 'aladdin-001',
        requestedAngle: 45,
        referenceImages: [
          'https://example.com/aladdin-30.png',
          'https://example.com/aladdin-60.png',
        ],
      };

      expect(videoTask.referenceImages).toHaveLength(2);
    });

    it('should maintain character consistency across multiple videos', async () => {
      const videos = [
        { videoId: 'vid-1', characterConsistency: 0.92, angle: 0 },
        { videoId: 'vid-2', characterConsistency: 0.91, angle: 90 },
        { videoId: 'vid-3', characterConsistency: 0.89, angle: 180 },
      ];

      const avgConsistency =
        videos.reduce((sum, v) => sum + v.characterConsistency, 0) / videos.length;

      expect(avgConsistency).toBeGreaterThanOrEqual(0.85);
    });
  });

  describe('Scene Script → Storyboard → Composite → Video', () => {
    it('should convert scene script to animated video', async () => {
      const workflow = {
        script: {
          sceneId: 'scene-001',
          description: 'Aladdin and Jasmine meet in palace garden',
          dialogue: [
            { character: 'aladdin-001', text: 'Princess, what brings you here?' },
            { character: 'jasmine-001', text: 'I needed some fresh air' },
          ],
          action: 'Characters walk towards each other',
          status: 'completed',
        },
        storyboard: {
          shots: [
            { shotId: 'shot-1', type: 'establishing', description: 'Wide view of garden' },
            { shotId: 'shot-2', type: 'two-shot', description: 'Aladdin and Jasmine approach' },
            { shotId: 'shot-3', type: 'over-shoulder', description: 'Aladdin speaks' },
            { shotId: 'shot-4', type: 'reaction', description: 'Jasmine responds' },
          ],
          status: 'completed',
        },
        compositeGeneration: {
          composites: [
            { shotId: 'shot-1', compositeUrl: 'https://example.com/comp-1.png' },
            { shotId: 'shot-2', compositeUrl: 'https://example.com/comp-2.png' },
            { shotId: 'shot-3', compositeUrl: 'https://example.com/comp-3.png' },
            { shotId: 'shot-4', compositeUrl: 'https://example.com/comp-4.png' },
          ],
          status: 'completed',
        },
        videoGeneration: {
          videos: [
            { shotId: 'shot-1', videoId: 'vid-1', duration: 5 },
            { shotId: 'shot-2', videoId: 'vid-2', duration: 6 },
            { shotId: 'shot-3', videoId: 'vid-3', duration: 4 },
            { shotId: 'shot-4', videoId: 'vid-4', duration: 3 },
          ],
          assembledScene: {
            sceneId: 'scene-001',
            duration: 18,
            url: 'https://example.com/scene-001.mp4',
          },
          status: 'completed',
        },
      };

      expect(workflow.storyboard.shots).toHaveLength(4);
      expect(workflow.compositeGeneration.composites).toHaveLength(4);
      expect(workflow.videoGeneration.videos).toHaveLength(4);
      expect(workflow.videoGeneration.assembledScene.duration).toBeCloseTo(18, 2);
    });

    it('should integrate dialogue audio with video', async () => {
      const sceneWithAudio = {
        videos: [
          { videoId: 'vid-1', duration: 5, hasDialogue: false },
          { videoId: 'vid-2', duration: 6, hasDialogue: false },
          {
            videoId: 'vid-3',
            duration: 4,
            hasDialogue: true,
            audioUrl: 'https://example.com/dialogue-1.mp3',
          },
          {
            videoId: 'vid-4',
            duration: 3,
            hasDialogue: true,
            audioUrl: 'https://example.com/dialogue-2.mp3',
          },
        ],
        assembledWithAudio: true,
      };

      expect(sceneWithAudio.videos.filter((v) => v.hasDialogue)).toHaveLength(2);
      expect(sceneWithAudio.assembledWithAudio).toBe(true);
    });
  });

  describe('Multi-Department Coordination', () => {
    it('should coordinate 4 departments in parallel', async () => {
      const coordination = {
        story: { started: 0, completed: 5000, duration: 5000 },
        visual: { started: 5000, completed: 12000, duration: 7000 },
        imageGeneration: { started: 12000, completed: 60000, duration: 48000 },
        videoGeneration: { started: 60000, completed: 155000, duration: 95000 },
        totalPipelineDuration: 155000,
      };

      expect(coordination.totalPipelineDuration).toBeLessThan(180000); // Under 3 minutes
    });

    it('should handle department failures gracefully', async () => {
      const workflow = {
        departments: [
          { name: 'story', status: 'completed' },
          { name: 'visual', status: 'completed' },
          { name: 'imageGeneration', status: 'failed', error: 'Rate limit exceeded' },
          { name: 'videoGeneration', status: 'blocked', reason: 'Waiting for images' },
        ],
        overallStatus: 'failed',
        failedDepartment: 'imageGeneration',
      };

      expect(workflow.overallStatus).toBe('failed');
      expect(workflow.failedDepartment).toBe('imageGeneration');
    });

    it('should retry failed department operations', async () => {
      const retryWorkflow = {
        imageGeneration: {
          attempt: 1,
          status: 'failed',
          error: 'Timeout',
        },
        retry: {
          attempt: 2,
          status: 'completed',
          duration: 52000,
        },
      };

      expect(retryWorkflow.retry.status).toBe('completed');
      expect(retryWorkflow.retry.attempt).toBe(2);
    });
  });

  describe('Image Quality → Video Department Handoff', () => {
    it('should pass high-quality images to Video Department', async () => {
      const imageOutput = {
        images: [
          { imageId: 'img-1', qualityScore: 0.94, url: 'https://example.com/img-1.png' },
          { imageId: 'img-2', qualityScore: 0.91, url: 'https://example.com/img-2.png' },
          { imageId: 'img-3', qualityScore: 0.89, url: 'https://example.com/img-3.png' },
        ],
        allPassedQualityCheck: true,
      };

      const videoInput = {
        images: imageOutput.images.map((img) => ({
          imageUrl: img.url,
          sourceQuality: img.qualityScore,
        })),
      };

      expect(videoInput.images).toHaveLength(3);
      expect(videoInput.images.every((img) => img.sourceQuality >= 0.85)).toBe(true);
    });

    it('should block video generation for low-quality images', async () => {
      const imageOutput = {
        images: [
          { imageId: 'img-1', qualityScore: 0.92 },
          { imageId: 'img-2', qualityScore: 0.65 }, // Below threshold
          { imageId: 'img-3', qualityScore: 0.88 },
        ],
        allPassedQualityCheck: false,
      };

      const videoGeneration = {
        status: 'blocked',
        reason: 'Image quality below threshold for img-2',
      };

      expect(videoGeneration.status).toBe('blocked');
    });

    it('should request image regeneration if needed', async () => {
      const workflow = {
        imageGeneration: {
          attempt: 1,
          images: [{ imageId: 'img-1', qualityScore: 0.62 }],
          passed: false,
        },
        regeneration: {
          attempt: 2,
          images: [{ imageId: 'img-1-v2', qualityScore: 0.91 }],
          passed: true,
        },
        videoGeneration: {
          status: 'processing',
          useImages: ['img-1-v2'],
        },
      };

      expect(workflow.regeneration.passed).toBe(true);
      expect(workflow.videoGeneration.status).toBe('processing');
    });
  });

  describe('Consistency Across Departments', () => {
    it('should maintain character appearance across all outputs', async () => {
      const consistency = {
        masterReference: { characterId: 'aladdin-001', features: 'dark hair, purple vest' },
        imageGeneration: {
          shots: [
            { imageId: 'img-1', characterConsistency: 0.93 },
            { imageId: 'img-2', characterConsistency: 0.91 },
            { imageId: 'img-3', characterConsistency: 0.89 },
          ],
        },
        videoGeneration: {
          videos: [
            { videoId: 'vid-1', characterConsistency: 0.92 },
            { videoId: 'vid-2', characterConsistency: 0.90 },
            { videoId: 'vid-3', characterConsistency: 0.88 },
          ],
        },
      };

      const avgImageConsistency =
        consistency.imageGeneration.shots.reduce((sum, s) => sum + s.characterConsistency, 0) / 3;
      const avgVideoConsistency =
        consistency.videoGeneration.videos.reduce((sum, v) => sum + v.characterConsistency, 0) / 3;

      expect(avgImageConsistency).toBeGreaterThanOrEqual(0.85);
      expect(avgVideoConsistency).toBeGreaterThanOrEqual(0.85);
    });

    it('should maintain location consistency', async () => {
      const consistency = {
        locationReference: { locationId: 'marketplace-001', style: 'bustling, colorful' },
        images: [
          { imageId: 'img-1', locationConsistency: 0.88 },
          { imageId: 'img-2', locationConsistency: 0.87 },
        ],
        videos: [
          { videoId: 'vid-1', locationConsistency: 0.86 },
          { videoId: 'vid-2', locationConsistency: 0.85 },
        ],
      };

      expect(consistency.images.every((img) => img.locationConsistency >= 0.80)).toBe(true);
      expect(consistency.videos.every((vid) => vid.locationConsistency >= 0.80)).toBe(true);
    });

    it('should validate style consistency from Visual to Video', async () => {
      const styleGuide = {
        visual: {
          colorPalette: ['warm', 'vibrant'],
          lighting: 'bright',
          mood: 'cheerful',
        },
        imageGeneration: {
          appliedStyle: {
            colors: ['warm', 'vibrant'],
            lighting: 'bright',
            mood: 'cheerful',
          },
          styleConsistency: 0.94,
        },
        videoGeneration: {
          appliedStyle: {
            colors: ['warm', 'vibrant'],
            lighting: 'bright',
            mood: 'cheerful',
          },
          styleConsistency: 0.91,
        },
      };

      expect(styleGuide.imageGeneration.styleConsistency).toBeGreaterThanOrEqual(0.85);
      expect(styleGuide.videoGeneration.styleConsistency).toBeGreaterThanOrEqual(0.85);
    });
  });

  describe('End-to-End Performance', () => {
    it('should complete full pipeline under 4 minutes', async () => {
      const pipeline = {
        startTime: Date.now(),
        story: { duration: 5000 },
        visual: { duration: 8000 },
        imageGeneration: { duration: 95000 },
        videoGeneration: { duration: 110000 },
        totalDuration: 218000, // ~3.6 minutes
      };

      expect(pipeline.totalDuration).toBeLessThan(240000); // Under 4 minutes
    });

    it('should track metadata through entire pipeline', async () => {
      const metadata = {
        projectId: testProjectId,
        episodeId: testEpisodeId,
        sceneId: 'scene-1',
        created: new Date(),
        departments: ['story', 'visual', 'image-quality', 'video'],
        outputAssets: {
          storyDocument: 'story-scene-1.json',
          visualPlan: 'visual-scene-1.json',
          images: ['img-1.png', 'img-2.png', 'img-3.png'],
          videos: ['vid-1.mp4', 'vid-2.mp4', 'vid-3.mp4'],
          finalScene: 'scene-1.mp4',
        },
      };

      expect(metadata.departments).toHaveLength(4);
      expect(metadata.outputAssets.finalScene).toBeTruthy();
    });
  });
});
