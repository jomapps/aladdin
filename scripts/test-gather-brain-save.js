/**
 * Test Script: Gather & Brain Save Validation
 * Run this in browser console on the gather page
 */

async function testGatherBrainSave() {
  console.log('🧪 Starting Gather & Brain Save Test\n');
  console.log('=' .repeat(60));

  const results = {
    passed: [],
    failed: [],
  };

  // Get project ID from URL
  const projectId = window.location.pathname.split('/')[3];
  if (!projectId) {
    console.error('❌ Could not determine project ID from URL');
    return;
  }

  console.log(`\n📋 Project ID: ${projectId}\n`);

  // Test 1: Brain Health Check
  console.log('Test 1: Brain Service Health Check');
  try {
    const response = await fetch('/api/v1/brain/health');
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Brain service is healthy:', data);
      results.passed.push('Brain Health Check');
    } else {
      console.error('❌ Brain service health check failed:', response.status);
      results.failed.push('Brain Health Check');
    }
  } catch (error) {
    console.error('❌ Brain health check error:', error.message);
    results.failed.push('Brain Health Check');
  }

  // Test 2: Save Test Message
  console.log('\nTest 2: Save Test Message to Gather & Brain');
  try {
    const response = await fetch(`/api/v1/gather/${projectId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: `Test message for gather & brain validation - ${new Date().toISOString()}`,
      }),
    });

    if (response.ok) {
      const result = await response.json();

      console.log('✅ Gather DB save:', result.success);
      console.log('✅ Brain save:', result.brain?.saved);

      if (result.brain?.saved) {
        console.log('✅ Message saved to both Gather DB and Brain');
        results.passed.push('Gather & Brain Save');
      } else {
        console.warn('⚠️  Message saved to DB only');
        console.error('❌ Brain save error:', result.brain?.error);
        results.failed.push('Brain Save');
        results.passed.push('Gather DB Save');
      }

      // Store item ID for cleanup
      window.__testGatherItemId = result.item._id;
    } else {
      const error = await response.json();
      console.error('❌ Save failed:', error);
      results.failed.push('Gather & Brain Save');
    }
  } catch (error) {
    console.error('❌ Save error:', error.message);
    results.failed.push('Gather & Brain Save');
  }

  // Test 3: Verify Brain Search
  console.log('\nTest 3: Verify Brain Search');
  try {
    const response = await fetch(
      `/api/v1/brain/search?projectId=${projectId}&query=test+message&limit=5`
    );

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Brain search successful');
      console.log(`   Found ${data.results?.length || 0} results`);

      if (data.results?.length > 0) {
        console.log('   First result:', data.results[0]);
        results.passed.push('Brain Search');
      } else {
        console.warn('⚠️  No search results found');
        results.failed.push('Brain Search Results');
      }
    } else {
      console.error('❌ Brain search failed:', response.status);
      results.failed.push('Brain Search');
    }
  } catch (error) {
    console.error('❌ Brain search error:', error.message);
    results.failed.push('Brain Search');
  }

  // Test 4: Check Endpoint Consistency
  console.log('\nTest 4: Endpoint Consistency Check');
  const endpoints = [
    '/api/v1/brain/health',
    '/api/v1/brain/search?projectId=test&query=test&limit=1',
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint);
      if (response.status === 404) {
        console.error(`❌ Endpoint not found: ${endpoint}`);
        results.failed.push(`Endpoint: ${endpoint}`);
      } else {
        console.log(`✅ Endpoint accessible: ${endpoint} (${response.status})`);
        results.passed.push(`Endpoint: ${endpoint}`);
      }
    } catch (error) {
      console.error(`❌ Endpoint error ${endpoint}:`, error.message);
      results.failed.push(`Endpoint: ${endpoint}`);
    }
  }

  // Summary
  console.log('\n' + '=' .repeat(60));
  console.log('\n📊 TEST SUMMARY\n');

  console.log(`✅ Passed (${results.passed.length}):`);
  results.passed.forEach(test => console.log(`   • ${test}`));

  if (results.failed.length > 0) {
    console.log(`\n❌ Failed (${results.failed.length}):`);
    results.failed.forEach(test => console.log(`   • ${test}`));
  }

  const totalTests = results.passed.length + results.failed.length;
  const passRate = ((results.passed.length / totalTests) * 100).toFixed(1);

  console.log(`\n📈 Pass Rate: ${passRate}% (${results.passed.length}/${totalTests})\n`);

  // Cleanup instructions
  if (window.__testGatherItemId) {
    console.log('🧹 Cleanup:');
    console.log(`   To delete test item, run:`);
    console.log(`   await fetch('/api/v1/gather/${projectId}/${window.__testGatherItemId}', { method: 'DELETE' })`);
  }

  console.log('\n' + '=' .repeat(60));

  return {
    passed: results.passed.length,
    failed: results.failed.length,
    total: totalTests,
    passRate: passRate + '%',
  };
}

// Auto-run if in gather page
if (window.location.pathname.includes('/gather')) {
  console.log('🚀 Auto-running Gather & Brain Save Test...\n');
  testGatherBrainSave().then(summary => {
    console.log('\n✨ Test completed. Summary:', summary);
  });
} else {
  console.log('ℹ️  Navigate to gather page and run: testGatherBrainSave()');
}

// Export for manual use
window.testGatherBrainSave = testGatherBrainSave;
