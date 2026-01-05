// Test script to verify MongoDB data consistency fixes
import axios from 'axios';

const BASE_URL = 'http://localhost:3002/api';

async function testAPI(endpoint, description) {
  try {
    console.log(`\n🧪 Testing: ${description}`);
    console.log(`📡 GET ${endpoint}`);
    
    const response = await axios.get(`${BASE_URL}${endpoint}`);
    const data = response.data;
    
    console.log(`✅ Status: ${response.status}`);
    
    if (data.data && Array.isArray(data.data)) {
      console.log(`📊 Records returned: ${data.data.length}`);
      if (data.total !== undefined) {
        console.log(`📈 Total in DB: ${data.total}`);
      }
      
      // Show sample record structure
      if (data.data.length > 0) {
        const sample = data.data[0];
        console.log(`📄 Sample record fields:`, Object.keys(sample));
        console.log(`🎯 Sample severity: ${sample.severity}`);
        console.log(`📝 Sample log_type: ${sample.log_type}`);
        console.log(`🖥️ Sample endpoint: ${sample.endpoint}`);
      }
    } else if (data.totalLogs !== undefined) {
      // Dashboard stats format
      console.log(`📊 Total Logs: ${data.totalLogs}`);
      console.log(`📊 Total Events: ${data.totalEvents}`);
      console.log(`📊 Total Cases: ${data.totalCases}`);
      console.log(`📊 Grand Total: ${data.total}`);
      
      if (data.severityBreakdown) {
        console.log(`🎯 Severity Breakdown:`);
        data.severityBreakdown.forEach(item => {
          console.log(`   ${item._id}: ${item.count}`);
        });
      }
      
      if (data.logTypeBreakdown) {
        console.log(`📝 Log Type Breakdown (top 5):`);
        data.logTypeBreakdown.slice(0, 5).forEach(item => {
          console.log(`   ${item._id}: ${item.count}`);
        });
      }
    } else {
      console.log(`📊 Response:`, JSON.stringify(data, null, 2));
    }
    
  } catch (error) {
    console.log(`❌ Error: ${error.response?.status || error.message}`);
    if (error.response?.data) {
      console.log(`📄 Error details:`, error.response.data);
    }
  }
}

async function runTests() {
  console.log('🚀 Starting MongoDB Data Consistency Tests');
  console.log('=' .repeat(60));
  
  // Test 1: Dashboard stats (should show all logs, not limited to 2K)
  await testAPI('/stats/dashboard', 'Dashboard Statistics (All Data)');
  
  // Test 2: Recent logs without filters (should show real data)
  await testAPI('/logs/recent?limit=10', 'Recent Logs (No Filters)');
  
  // Test 3: Severity filtering (should work now)
  await testAPI('/logs/recent?severity=High&limit=10', 'High Severity Logs');
  await testAPI('/logs/recent?severity=Medium&limit=10', 'Medium Severity Logs');
  await testAPI('/logs/recent?severity=Low&limit=10', 'Low Severity Logs');
  
  // Test 4: Log type filtering (should use metadata.log_source)
  await testAPI('/logs/recent?logType=Security&limit=10', 'Security Log Type');
  await testAPI('/logs/recent?logType=kernel&limit=10', 'Kernel Log Type');
  
  // Test 5: All logs endpoint with higher limit
  await testAPI('/logs?limit=100', 'All Logs (100 limit)');
  
  // Test 6: Severity stats
  await testAPI('/stats/severity', 'Severity Statistics');
  
  // Test 7: Timeline data
  await testAPI('/stats/timeline', 'Timeline Data');
  
  console.log('\n' + '=' .repeat(60));
  console.log('🏁 Tests completed!');
  console.log('\n📋 Key things to verify:');
  console.log('✓ Total logs should be ~74,901 (not limited to 2K)');
  console.log('✓ Severity filtering should return results (not empty)');
  console.log('✓ Log types should use metadata.log_source values');
  console.log('✓ All endpoints should return real MongoDB data');
}

runTests().catch(console.error);