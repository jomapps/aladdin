/**
 * Qualification Workflow E2E Tests
 * Tests complete end-to-end qualification pipeline from gather to qualified database
 */

import { test, expect } from '@playwright/test';

test.describe('Qualification Workflow E2E', () => {
  const testProjectId = 'test-project-e2e';

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Setup: Clear any existing test data
  });

  test('should complete full qualification pipeline A→B→C→D', async ({ page }) => {
    // Navigate to project
    await page.goto(`/projects/${testProjectId}/qualify`);

    // Start qualification process
    await page.click('button[data-testid="start-qualification"]');

    // Wait for Phase A (Data Preparation) to complete
    await expect(page.locator('[data-testid="phase-a-status"]')).toHaveText('Completed', {
      timeout: 60000,
    });

    // Verify Phase B (Character Design) starts
    await expect(page.locator('[data-testid="phase-b-status"]')).toHaveText('Running', {
      timeout: 10000,
    });

    // Wait for Phase B to complete
    await expect(page.locator('[data-testid="phase-b-status"]')).toHaveText('Completed', {
      timeout: 120000,
    });

    // Verify Phase C (Visual Style) starts
    await expect(page.locator('[data-testid="phase-c-status"]')).toHaveText('Running', {
      timeout: 10000,
    });

    // Wait for Phase C to complete
    await expect(page.locator('[data-testid="phase-c-status"]')).toHaveText('Completed', {
      timeout: 120000,
    });

    // Verify Phase D (Image Quality) starts
    await expect(page.locator('[data-testid="phase-d-status"]')).toHaveText('Running', {
      timeout: 10000,
    });

    // Wait for Phase D to complete
    await expect(page.locator('[data-testid="phase-d-status"]')).toHaveText('Completed', {
      timeout: 120000,
    });

    // Verify qualification succeeded
    await expect(page.locator('[data-testid="qualification-result"]')).toHaveText('Success');

    // Verify quality score
    const qualityScore = await page.locator('[data-testid="quality-score"]').textContent();
    expect(parseFloat(qualityScore || '0')).toBeGreaterThanOrEqual(0.85);
  });

  test('should execute Phase A tasks in parallel', async ({ page }) => {
    await page.goto(`/projects/${testProjectId}/qualify`);
    await page.click('button[data-testid="start-qualification"]');

    // Monitor parallel execution indicators
    const parallelTasks = page.locator('[data-testid="phase-a-parallel-tasks"]');

    await expect(parallelTasks).toBeVisible();

    // All Phase A tasks should show "Running" simultaneously
    const taskStatuses = await parallelTasks.locator('.task-status').allTextContents();
    const runningTasks = taskStatuses.filter(status => status === 'Running');

    expect(runningTasks.length).toBeGreaterThan(1);
  });

  test('should stop pipeline and display error on department failure', async ({ page }) => {
    // Mock a failing department
    await page.route('**/api/departments/*/execute', async (route) => {
      if (route.request().url().includes('character-design')) {
        await route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Character generation failed' }),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto(`/projects/${testProjectId}/qualify`);
    await page.click('button[data-testid="start-qualification"]');

    // Wait for error to appear
    await expect(page.locator('[data-testid="global-error"]')).toBeVisible({
      timeout: 60000,
    });

    // Verify error message
    const errorText = await page.locator('[data-testid="global-error"]').textContent();
    expect(errorText).toContain('Character generation failed');

    // Verify pipeline stopped
    const pipelineStatus = await page.locator('[data-testid="pipeline-status"]').textContent();
    expect(pipelineStatus).toBe('Failed');

    // Verify subsequent phases did not execute
    await expect(page.locator('[data-testid="phase-c-status"]')).toHaveText('Pending');
    await expect(page.locator('[data-testid="phase-d-status"]')).toHaveText('Pending');
  });

  test('should migrate qualified character to qualified database', async ({ page }) => {
    await page.goto(`/projects/${testProjectId}/qualify`);
    await page.click('button[data-testid="start-qualification"]');

    // Wait for qualification to complete
    await expect(page.locator('[data-testid="qualification-result"]')).toHaveText('Success', {
      timeout: 300000,
    });

    // Navigate to qualified database view
    await page.click('a[href*="/qualified"]');

    // Verify character appears in qualified database
    await expect(page.locator('[data-testid="qualified-characters"]')).toBeVisible();

    const characterCards = page.locator('[data-testid="character-card"]');
    await expect(characterCards).toHaveCount(1);

    // Verify character has required properties
    await expect(characterCards.first().locator('[data-testid="character-name"]')).toBeVisible();
    await expect(characterCards.first().locator('[data-testid="quality-score"]')).toBeVisible();
    await expect(characterCards.first().locator('[data-testid="profile-angles"]')).toBeVisible();
  });

  test('should ingest qualified character into brain', async ({ page }) => {
    await page.goto(`/projects/${testProjectId}/qualify`);
    await page.click('button[data-testid="start-qualification"]');

    // Wait for qualification to complete
    await expect(page.locator('[data-testid="qualification-result"]')).toHaveText('Success', {
      timeout: 300000,
    });

    // Navigate to brain view
    await page.click('a[href*="/brain"]');

    // Verify character node exists in brain
    await page.fill('[data-testid="brain-search"]', 'qualified character');
    await page.click('[data-testid="brain-search-button"]');

    await expect(page.locator('[data-testid="brain-node"]')).toBeVisible();

    // Verify node properties
    const nodeDetails = page.locator('[data-testid="brain-node"]').first();
    await expect(nodeDetails.locator('[data-testid="node-type"]')).toHaveText('concept');
    await expect(nodeDetails.locator('[data-testid="quality-score"]')).toBeVisible();
  });

  test('should handle 20-iteration emergency break in composite generation', async ({ page }) => {
    // Mock slow quality improvement
    let iterationCount = 0;
    await page.route('**/api/composite/generate', async (route) => {
      iterationCount++;
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          success: true,
          qualityScore: 0.70 + iterationCount * 0.005, // Slow improvement
          iteration: iterationCount,
        }),
      });
    });

    await page.goto(`/projects/${testProjectId}/qualify`);
    await page.click('button[data-testid="start-qualification"]');

    // Wait for emergency break warning
    await expect(page.locator('[data-testid="emergency-break-warning"]')).toBeVisible({
      timeout: 120000,
    });

    // Verify iteration count
    const iterations = await page.locator('[data-testid="iteration-count"]').textContent();
    expect(parseInt(iterations || '0')).toBe(20);

    // Verify best result was used despite not meeting threshold
    await expect(page.locator('[data-testid="used-best-result"]')).toBeVisible();
  });

  test('should retry verification up to 5 times', async ({ page }) => {
    let verificationAttempts = 0;

    await page.route('**/api/verify', async (route) => {
      verificationAttempts++;
      const score = verificationAttempts < 5 ? 0.70 : 0.90;

      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          success: true,
          verificationScore: score,
          attempt: verificationAttempts,
        }),
      });
    });

    await page.goto(`/projects/${testProjectId}/qualify`);
    await page.click('button[data-testid="start-qualification"]');

    // Wait for verification retries to complete
    await expect(page.locator('[data-testid="verification-attempts"]')).toHaveText('5', {
      timeout: 60000,
    });

    // Verify final verification passed
    await expect(page.locator('[data-testid="verification-status"]')).toHaveText('Passed');
  });

  test('should enforce max 3 references per composite request', async ({ page }) => {
    await page.goto(`/projects/${testProjectId}/qualify`);

    // Attempt to add 5 references
    await page.click('[data-testid="add-reference-character"]');
    await page.click('[data-testid="add-reference-clothing"]');
    await page.click('[data-testid="add-reference-location"]');
    await page.click('[data-testid="add-reference-prop-1"]');
    await page.click('[data-testid="add-reference-prop-2"]');

    // Start qualification
    await page.click('button[data-testid="start-qualification"]');

    // Verify warning about reference limit
    await expect(page.locator('[data-testid="reference-limit-warning"]')).toBeVisible();
    await expect(page.locator('[data-testid="reference-limit-warning"]')).toContainText(
      'trimmed from 5 to 3'
    );

    // Verify only 3 references used
    const usedReferences = await page
      .locator('[data-testid="used-references"]')
      .locator('.reference-item')
      .count();
    expect(usedReferences).toBe(3);
  });

  test('should generate scene videos with FAL.ai', async ({ page }) => {
    await page.goto(`/projects/${testProjectId}/scenes/generate`);

    // Configure scene
    await page.fill('[data-testid="scene-description"]', 'Aladdin walking through marketplace');
    await page.selectOption('[data-testid="scene-duration"]', '3');

    // Start generation
    await page.click('[data-testid="generate-scene"]');

    // Wait for FAL.ai processing
    await expect(page.locator('[data-testid="generation-status"]')).toHaveText('Processing', {
      timeout: 10000,
    });

    // Wait for completion
    await expect(page.locator('[data-testid="generation-status"]')).toHaveText('Completed', {
      timeout: 120000,
    });

    // Verify video preview
    await expect(page.locator('[data-testid="scene-video-preview"]')).toBeVisible();
    await expect(page.locator('video')).toBeVisible();
  });

  test('should extract last frame from scene video', async ({ page }) => {
    await page.goto(`/projects/${testProjectId}/scenes/1`);

    // Trigger last frame extraction
    await page.click('[data-testid="extract-last-frame"]');

    // Wait for extraction
    await expect(page.locator('[data-testid="last-frame-preview"]')).toBeVisible({
      timeout: 30000,
    });

    // Verify frame properties
    const frameUrl = await page
      .locator('[data-testid="last-frame-image"]')
      .getAttribute('src');
    expect(frameUrl).toBeTruthy();

    // Verify timestamp
    const timestamp = await page.locator('[data-testid="frame-timestamp"]').textContent();
    expect(parseFloat(timestamp || '0')).toBeGreaterThan(0);
  });

  test('should stitch multiple scenes into episode', async ({ page }) => {
    await page.goto(`/projects/${testProjectId}/episodes/create`);

    // Select scenes
    await page.check('[data-testid="scene-1-checkbox"]');
    await page.check('[data-testid="scene-2-checkbox"]');
    await page.check('[data-testid="scene-3-checkbox"]');

    // Configure stitching
    await page.selectOption('[data-testid="transition-type"]', 'crossfade');
    await page.fill('[data-testid="transition-duration"]', '0.5');

    // Start stitching
    await page.click('[data-testid="start-stitching"]');

    // Wait for stitching progress
    await expect(page.locator('[data-testid="stitching-progress"]')).toBeVisible();

    // Wait for completion
    await expect(page.locator('[data-testid="stitching-status"]')).toHaveText('Completed', {
      timeout: 300000,
    });

    // Verify final video
    await expect(page.locator('[data-testid="episode-video"]')).toBeVisible();

    // Verify metadata
    const duration = await page.locator('[data-testid="episode-duration"]').textContent();
    expect(parseFloat(duration || '0')).toBeGreaterThan(0);
  });

  test('should display quality gates between departments', async ({ page }) => {
    await page.goto(`/projects/${testProjectId}/qualify`);
    await page.click('button[data-testid="start-qualification"]');

    // Wait for Phase A to complete
    await expect(page.locator('[data-testid="phase-a-status"]')).toHaveText('Completed', {
      timeout: 60000,
    });

    // Verify quality gate display
    await expect(page.locator('[data-testid="quality-gate-a"]')).toBeVisible();

    const scoreA = await page.locator('[data-testid="quality-gate-a-score"]').textContent();
    expect(parseFloat(scoreA || '0')).toBeGreaterThanOrEqual(0.85);

    // Wait for Phase B
    await expect(page.locator('[data-testid="phase-b-status"]')).toHaveText('Completed', {
      timeout: 120000,
    });

    // Verify all quality gates passed
    const qualityGates = page.locator('[data-testid^="quality-gate-"]');
    const gateCount = await qualityGates.count();

    for (let i = 0; i < gateCount; i++) {
      const gate = qualityGates.nth(i);
      await expect(gate.locator('[data-testid$="-passed"]')).toHaveText('✓ Passed');
    }
  });

  test('should show real-time progress updates', async ({ page }) => {
    await page.goto(`/projects/${testProjectId}/qualify`);
    await page.click('button[data-testid="start-qualification"]');

    // Verify progress bar appears
    await expect(page.locator('[data-testid="progress-bar"]')).toBeVisible();

    // Wait for progress to increase
    const initialProgress = await page.locator('[data-testid="progress-percentage"]').textContent();
    await page.waitForTimeout(10000);
    const updatedProgress = await page.locator('[data-testid="progress-percentage"]').textContent();

    expect(parseInt(updatedProgress || '0')).toBeGreaterThan(parseInt(initialProgress || '0'));

    // Verify ETA is displayed
    await expect(page.locator('[data-testid="estimated-completion"]')).toBeVisible();
  });

  test('should allow retry after error', async ({ page }) => {
    // Mock initial failure
    let attemptCount = 0;
    await page.route('**/api/departments/*/execute', async (route) => {
      attemptCount++;
      if (attemptCount === 1) {
        await route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Temporary failure' }),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto(`/projects/${testProjectId}/qualify`);
    await page.click('button[data-testid="start-qualification"]');

    // Wait for error
    await expect(page.locator('[data-testid="global-error"]')).toBeVisible({
      timeout: 60000,
    });

    // Click retry
    await page.click('[data-testid="retry-button"]');

    // Verify retry succeeded
    await expect(page.locator('[data-testid="qualification-result"]')).toHaveText('Success', {
      timeout: 300000,
    });
  });
});
