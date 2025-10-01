import { describe, it, expect, beforeAll } from '@jest/globals';
import { BrainClient } from '@/lib/brain/client';

describe('Brain Validation Integration Tests', () => {
  let client: BrainClient;
  const testProjectId = 'test-project-validation-int';

  beforeAll(() => {
    client = new BrainClient({
      baseUrl: process.env.BRAIN_SERVICE_URL || 'http://localhost:8000',
      timeout: 30000,
    });
  });

  describe('Quality Score Calculation', () => {
    it('should give high score to well-developed character', async () => {
      const result = await client.validateContent({
        projectId: testProjectId,
        type: 'character',
        data: {
          name: 'Elizabeth Bennett',
          age: 20,
          occupation: 'Gentlewoman',
          personality: 'Quick-witted, independent, values intelligence and integrity',
          backstory: 'Second of five daughters in a family of modest means',
          goals: 'Find a marriage based on love and respect, not convenience',
          conflicts: 'Class prejudice, family pressure, pride vs prejudice',
          relationships: 'Complex dynamic with Mr. Darcy, close to sister Jane',
          arc: 'Learns to overcome first impressions and recognize true character',
        },
      });

      expect(result.qualityRating).toBeGreaterThanOrEqual(0.80);
      expect(result.brainValidated).toBe(true);
    });

    it('should give medium score to moderately developed character', async () => {
      const result = await client.validateContent({
        projectId: testProjectId,
        type: 'character',
        data: {
          name: 'Tom Anderson',
          age: 42,
          occupation: 'Teacher',
          personality: 'Patient and kind',
          backstory: 'Has taught for 15 years',
        },
      });

      expect(result.qualityRating).toBeGreaterThan(0.40);
      expect(result.qualityRating).toBeLessThan(0.80);
    });

    it('should give low score to poorly developed character', async () => {
      const result = await client.validateContent({
        projectId: testProjectId,
        type: 'character',
        data: {
          name: 'Guy',
          age: 30,
        },
      });

      expect(result.qualityRating).toBeLessThan(0.60);
      expect(result.brainValidated).toBe(false);
    });

    it('should give zero score to empty character', async () => {
      const result = await client.validateContent({
        projectId: testProjectId,
        type: 'character',
        data: {},
      });

      expect(result.qualityRating).toBeLessThanOrEqual(0.20);
      expect(result.brainValidated).toBe(false);
    });

    it('should calculate quality for location data', async () => {
      const result = await client.validateContent({
        projectId: testProjectId,
        type: 'location',
        data: {
          name: 'Gotham City',
          description: 'A sprawling metropolis plagued by corruption and crime',
          atmosphere: 'Dark, oppressive, rain-soaked streets',
          significance: 'Home to both hero and villains, reflects moral decay',
          history: 'Once prosperous, now fallen into darkness',
          inhabitants: 'Mix of desperate citizens and dangerous criminals',
        },
      });

      expect(result.qualityRating).toBeGreaterThanOrEqual(0.60);
    });

    it('should calculate quality for scene data', async () => {
      const result = await client.validateContent({
        projectId: testProjectId,
        type: 'scene',
        data: {
          title: 'The Confrontation',
          description: 'Hero confronts villain in abandoned warehouse',
          purpose: 'Resolve central conflict, reveal villain motivation',
          conflict: 'Ideological clash between justice and revenge',
          emotionalBeat: 'Anger transforms to understanding',
          stakes: 'City safety, moral integrity of hero',
        },
      });

      expect(result.qualityRating).toBeGreaterThanOrEqual(0.60);
    });
  });

  describe('Threshold Enforcement', () => {
    const QUALITY_THRESHOLD = 0.60;

    it('should accept content above threshold', async () => {
      const result = await client.validateContent({
        projectId: testProjectId,
        type: 'character',
        data: {
          name: 'Strong Character',
          age: 35,
          occupation: 'Astronaut',
          personality: 'Brave, analytical, team-oriented',
          backstory: 'Former military pilot with extensive training',
          goals: 'Lead successful Mars mission',
          conflicts: 'Fear of failure, family back home',
        },
      });

      expect(result.qualityRating).toBeGreaterThanOrEqual(QUALITY_THRESHOLD);
      expect(result.brainValidated).toBe(true);
    });

    it('should reject content below threshold', async () => {
      const result = await client.validateContent({
        projectId: testProjectId,
        type: 'character',
        data: {
          name: 'Weak Character',
          age: 25,
        },
      });

      expect(result.qualityRating).toBeLessThan(QUALITY_THRESHOLD);
      expect(result.brainValidated).toBe(false);
    });

    it('should handle content exactly at threshold', async () => {
      // This would require crafting data to hit exactly 0.60
      // Placeholder for threshold boundary testing
      expect(QUALITY_THRESHOLD).toBe(0.60);
    });
  });

  describe('Contradiction Detection', () => {
    it('should detect age contradictions', async () => {
      const result = await client.validateContent({
        projectId: testProjectId,
        type: 'character',
        data: {
          name: 'Time Traveler',
          age: 25,
          backstory: 'A 60-year-old veteran who has seen many wars',
        },
      });

      expect(result.contradictions.length).toBeGreaterThan(0);
      expect(
        result.contradictions.some(c =>
          c.toLowerCase().includes('age') || c.toLowerCase().includes('contradiction')
        )
      ).toBe(true);
    });

    it('should detect personality contradictions', async () => {
      const result = await client.validateContent({
        projectId: testProjectId,
        type: 'character',
        data: {
          name: 'Conflicted Person',
          personality: 'Shy and introverted',
          backstory: 'Worked as a stand-up comedian for 10 years',
        },
      });

      expect(result.contradictions.length).toBeGreaterThan(0);
    });

    it('should detect occupation contradictions', async () => {
      const result = await client.validateContent({
        projectId: testProjectId,
        type: 'character',
        data: {
          name: 'Career Confusion',
          occupation: 'Brain surgeon',
          age: 18,
          backstory: 'Just graduated high school',
        },
      });

      expect(result.contradictions.length).toBeGreaterThan(0);
    });

    it('should not flag false positives', async () => {
      const result = await client.validateContent({
        projectId: testProjectId,
        type: 'character',
        data: {
          name: 'Consistent Character',
          age: 40,
          occupation: 'Professor',
          personality: 'Intellectual, patient, curious',
          backstory: 'PhD in physics, teaching for 15 years',
        },
      });

      expect(result.contradictions.length).toBe(0);
    });
  });

  describe('Suggestion Generation', () => {
    it('should suggest missing critical fields', async () => {
      const result = await client.validateContent({
        projectId: testProjectId,
        type: 'character',
        data: {
          name: 'Incomplete Character',
        },
      });

      expect(result.suggestions.length).toBeGreaterThan(0);
      expect(
        result.suggestions.some(s =>
          s.toLowerCase().includes('personality') ||
          s.toLowerCase().includes('backstory')
        )
      ).toBe(true);
    });

    it('should suggest depth improvements', async () => {
      const result = await client.validateContent({
        projectId: testProjectId,
        type: 'character',
        data: {
          name: 'Shallow Character',
          age: 30,
          occupation: 'Doctor',
          personality: 'Nice',
        },
      });

      expect(result.suggestions.length).toBeGreaterThan(0);
    });

    it('should suggest relationship development', async () => {
      const result = await client.validateContent({
        projectId: testProjectId,
        type: 'character',
        data: {
          name: 'Lonely Character',
          age: 35,
          occupation: 'Detective',
          personality: 'Solitary and focused',
          backstory: 'Works alone on cases',
        },
      });

      expect(
        result.suggestions.some(s =>
          s.toLowerCase().includes('relationship') ||
          s.toLowerCase().includes('connection')
        )
      ).toBe(true);
    });

    it('should not suggest for complete character', async () => {
      const result = await client.validateContent({
        projectId: testProjectId,
        type: 'character',
        data: {
          name: 'Complete Character',
          age: 35,
          occupation: 'Architect',
          personality: 'Creative, detail-oriented, passionate about sustainable design',
          backstory: 'Grew up in urban poverty, became first in family to attend university',
          goals: 'Design affordable eco-friendly housing for underserved communities',
          conflicts: 'Corporate pressure vs ethical principles, work-life balance',
          relationships: 'Mentors young designers, estranged from traditional family',
          arc: 'Learns to compromise without losing core values',
        },
      });

      expect(result.qualityRating).toBeGreaterThanOrEqual(0.80);
      expect(result.suggestions.length).toBe(0);
    });
  });

  describe('Multi-Field Validation', () => {
    it('should validate all character fields together', async () => {
      const result = await client.validateContent({
        projectId: testProjectId,
        type: 'character',
        data: {
          name: 'Multi-Field Test',
          age: 42,
          occupation: 'Ship Captain',
          personality: 'Authoritative but fair, haunted by past decisions',
          backstory: '20 years at sea, lost crew in storm',
          goals: 'Retire safely after one last voyage',
          conflicts: 'Duty vs safety, pride vs caution',
          relationships: 'Protective of crew, estranged from daughter',
          arc: 'Learns to trust crew and share burden of command',
        },
      });

      expect(result.qualityRating).toBeGreaterThanOrEqual(0.60);
      expect(result.brainValidated).toBe(true);
      expect(result.contradictions.length).toBe(0);
    });

    it('should validate location with all fields', async () => {
      const result = await client.validateContent({
        projectId: testProjectId,
        type: 'location',
        data: {
          name: 'The Old Manor',
          description: 'Victorian mansion on windswept cliff',
          atmosphere: 'Gothic, mysterious, isolated',
          significance: 'Site of original family curse',
          history: 'Built 1850, site of multiple tragedies',
          inhabitants: 'Current owner and ghostly presence',
        },
      });

      expect(result.qualityRating).toBeGreaterThanOrEqual(0.60);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long text fields', async () => {
      const longText = 'A'.repeat(10000);
      const result = await client.validateContent({
        projectId: testProjectId,
        type: 'character',
        data: {
          name: 'Long Story',
          backstory: longText,
        },
      });

      expect(result).toBeDefined();
    });

    it('should handle special characters', async () => {
      const result = await client.validateContent({
        projectId: testProjectId,
        type: 'character',
        data: {
          name: "O'Brien-Smith (III)",
          occupation: 'Engineer & Designer',
          personality: 'Complex: α > β',
        },
      });

      expect(result).toBeDefined();
    });

    it('should handle unicode characters', async () => {
      const result = await client.validateContent({
        projectId: testProjectId,
        type: 'character',
        data: {
          name: '李明 (Li Ming)',
          occupation: '外交官',
          personality: 'Diplomatic and culturally aware 🌍',
        },
      });

      expect(result).toBeDefined();
    });

    it('should handle null in nested fields', async () => {
      const result = await client.validateContent({
        projectId: testProjectId,
        type: 'character',
        data: {
          name: 'Test',
          metadata: {
            field1: null,
            field2: undefined,
          },
        },
      });

      expect(result).toBeDefined();
    });

    it('should handle array fields', async () => {
      const result = await client.validateContent({
        projectId: testProjectId,
        type: 'character',
        data: {
          name: 'Multi-Talent',
          skills: ['coding', 'design', 'management'],
          languages: ['English', 'Spanish', 'Mandarin'],
        },
      });

      expect(result).toBeDefined();
    });
  });
});
