/**
 * Brain Service Integration Tests
 * Tests the REST API endpoints at brain.ft.tc
 */

import axios from 'axios';

const BRAIN_API_URL = 'https://brain.ft.tc';
const API_KEY = 'ae6e18cb408bc7128f23585casdlaelwlekoqdsldsa';

const axiosInstance = axios.create({
  baseURL: BRAIN_API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY}`
  },
  timeout: 30000
});

async function testHealthEndpoint() {
  console.log('\n🔍 Test 1: Health Endpoint');
  console.log('='.repeat(50));

  try {
    const response = await axiosInstance.get('/api/v1/health');
    console.log('✅ Status:', response.status);
    console.log('✅ Response:', JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Health check failed:', error.response?.status, error.response?.data || error.message);
    return false;
  }
}

async function testAddNode() {
  console.log('\n🔍 Test 2: Add Node to Knowledge Graph');
  console.log('='.repeat(50));

  try {
    const nodeData = {
      type: 'gather',
      content: 'Test gather item from integration test',
      projectId: '68df4dab400c86a6a8cf40c6',
      properties: {
        summary: 'Test summary',
        context: 'Test context',
        createdAt: new Date().toISOString()
      }
    };

    console.log('Request:', JSON.stringify(nodeData, null, 2));

    const response = await axiosInstance.post('/api/v1/nodes', nodeData);
    console.log('✅ Status:', response.status);
    console.log('✅ Response:', JSON.stringify(response.data, null, 2));
    return response.data.node;
  } catch (error) {
    console.error('❌ Add node failed:', error.response?.status);
    console.error('Error details:', JSON.stringify(error.response?.data, null, 2) || error.message);
    return null;
  }
}

async function testSemanticSearch() {
  console.log('\n🔍 Test 3: Semantic Search');
  console.log('='.repeat(50));

  try {
    const searchQuery = {
      query: 'test gather item',
      project_id: '68df4dab400c86a6a8cf40c6',
      type: 'gather',
      top_k: 5,
      threshold: 0.7
    };

    console.log('Request:', JSON.stringify(searchQuery, null, 2));

    const response = await axiosInstance.post('/api/v1/search', searchQuery);
    console.log('✅ Status:', response.status);
    console.log('✅ Response:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('❌ Search failed:', error.response?.status);
    console.error('Error details:', JSON.stringify(error.response?.data, null, 2) || error.message);
    return null;
  }
}

async function testStats() {
  console.log('\n🔍 Test 4: Get Statistics');
  console.log('='.repeat(50));

  try {
    const response = await axiosInstance.get('/api/v1/stats');
    console.log('✅ Status:', response.status);
    console.log('✅ Response:', JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Stats failed:', error.response?.status);
    console.error('Error details:', JSON.stringify(error.response?.data, null, 2) || error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('\n' + '='.repeat(50));
  console.log('🧪 BRAIN SERVICE INTEGRATION TESTS');
  console.log('='.repeat(50));
  console.log('Base URL:', BRAIN_API_URL);
  console.log('API Key:', API_KEY.substring(0, 20) + '...');

  const results = {
    health: false,
    addNode: false,
    search: false,
    stats: false
  };

  // Test 1: Health
  results.health = await testHealthEndpoint();

  // Test 2: Add Node
  const node = await testAddNode();
  results.addNode = node !== null;

  // Test 3: Search
  const searchResults = await testSemanticSearch();
  results.search = searchResults !== null;

  // Test 4: Stats
  results.stats = await testStats();

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(50));

  const passed = Object.values(results).filter(r => r).length;
  const total = Object.keys(results).length;

  Object.entries(results).forEach(([test, result]) => {
    console.log(`${result ? '✅' : '❌'} ${test}: ${result ? 'PASSED' : 'FAILED'}`);
  });

  console.log('\n' + '='.repeat(50));
  console.log(`Results: ${passed}/${total} tests passed`);
  console.log('='.repeat(50) + '\n');

  process.exit(passed === total ? 0 : 1);
}

// Run tests
runAllTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
