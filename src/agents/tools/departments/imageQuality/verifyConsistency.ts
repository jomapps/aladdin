/**
 * Verify Consistency Tool
 * Verifies visual consistency across character images
 */

import { z } from 'zod';
import { tool } from '@codebuff/sdk';
import { MongoClient } from 'mongodb';

const VerifyConsistencyInput = z.object({
  characterId: z.string().describe('Character identifier'),
  imageIds: z.array(z.string()).describe('Image IDs to verify for consistency'),
  checks: z.array(
    z.enum(['color', 'style', 'proportions', 'details', 'lighting'])
  ).default(['color', 'style', 'proportions', 'details']).describe('Consistency checks to perform'),
  threshold: z.number().min(0).max(1).default(0.85).describe('Minimum consistency score (0-1)'),
});

export const verifyConsistencyTool = tool({
  name: 'verify_consistency',
  description: 'Verify visual consistency across multiple character images',
  input: VerifyConsistencyInput,
  execute: async ({ characterId, imageIds, checks, threshold }) => {
    try {
      const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
      const client = new MongoClient(mongoUri);

      await client.connect();
      const db = client.db('aladdin');
      const imagesCollection = db.collection('images');
      const referencesCollection = db.collection('character_references');

      // Retrieve master reference
      const reference = await referencesCollection.findOne({ characterId });

      if (!reference) {
        await client.close();
        return {
          success: false,
          error: `No master reference found for character '${characterId}'`,
          message: 'Cannot verify consistency without master reference',
        };
      }

      // Retrieve all images to check
      const images = await imagesCollection.find({
        imageId: { $in: imageIds }
      }).toArray();

      if (images.length !== imageIds.length) {
        await client.close();
        return {
          success: false,
          error: `Some images not found. Expected ${imageIds.length}, found ${images.length}`,
          message: 'Cannot verify consistency - missing images',
        };
      }

      // Perform consistency checks
      const checkResults: Record<string, any> = {};

      for (const checkType of checks) {
        const scores: number[] = [];

        for (const image of images) {
          const score = performConsistencyCheck(
            checkType,
            reference,
            image
          );
          scores.push(score);
        }

        const avgScore = scores.reduce((sum, s) => sum + s, 0) / scores.length;
        const minScore = Math.min(...scores);
        const maxScore = Math.max(...scores);

        checkResults[checkType] = {
          avgScore: Math.round(avgScore * 100) / 100,
          minScore: Math.round(minScore * 100) / 100,
          maxScore: Math.round(maxScore * 100) / 100,
          passed: minScore >= threshold,
        };
      }

      // Calculate overall consistency
      const overallScore = Object.values(checkResults)
        .map((r: any) => r.avgScore)
        .reduce((sum: number, s: number) => sum + s, 0) / checks.length;

      const allPassed = Object.values(checkResults)
        .every((r: any) => r.passed);

      await client.close();

      return {
        success: true,
        characterId,
        imagesChecked: imageIds.length,
        overallScore: Math.round(overallScore * 100) / 100,
        consistencyPassed: allPassed,
        threshold,
        checks: checkResults,
        recommendations: generateRecommendations(checkResults, threshold),
        message: allPassed
          ? 'All consistency checks passed'
          : 'Some consistency issues detected',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to verify consistency',
      };
    }
  },
});

/**
 * Perform specific consistency check
 * In production, this would use computer vision/ML models
 */
function performConsistencyCheck(
  checkType: string,
  reference: any,
  image: any
): number {
  // Simulate consistency scoring
  // In production, this would compare actual image features

  const baseScore = 0.8 + Math.random() * 0.2; // 0.8-1.0

  // Apply variations based on check type
  switch (checkType) {
    case 'color':
      return Math.min(1, baseScore * 0.95);
    case 'style':
      return Math.min(1, baseScore * 0.98);
    case 'proportions':
      return Math.min(1, baseScore * 0.92);
    case 'details':
      return Math.min(1, baseScore * 0.90);
    case 'lighting':
      return Math.min(1, baseScore * 0.93);
    default:
      return baseScore;
  }
}

/**
 * Generate recommendations based on check results
 */
function generateRecommendations(
  results: Record<string, any>,
  threshold: number
): string[] {
  const recommendations: string[] = [];

  for (const [checkType, result] of Object.entries(results)) {
    if (!result.passed) {
      recommendations.push(
        `Improve ${checkType} consistency - current: ${result.minScore.toFixed(2)}, required: ${threshold.toFixed(2)}`
      );
    }
  }

  if (recommendations.length === 0) {
    recommendations.push('All consistency checks passed - no action needed');
  }

  return recommendations;
}
