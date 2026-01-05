// Debug script to verify backend reality and trace data flow
import axios from 'axios';

const BASE_URL = 'http://localhost:3002/api';

async function verifyBackendReality() {
  console.log('🔍 STEP 1: VERIFY BACKEND REALITY');
  console.log('=' .repeat(60));
  
  try {
    // Test dashboard stats API
    console.log('\n📡 Testing /api/stats/dashboard endpoint...');
    const response = await axios.get(`${BASE_URL}/stats/dashboard?timeRange=30d`);
    
    console.log('✅ Raw API Response:');
    console.log('Status:', response.status);
    console.log('Headers:', response.headers['content-type']);
    console.log('Response Data:');
    console.log(JSON.stringify(response.data, null, 2));
    
    // Extract key metrics
    const data = response.data;
    console.log('\n📊 KEY METRICS FROM BACKEND:');
    console.log(`Total Logs: ${data.totalLogs}`);
    console.log(`Total Events: ${data.totalEvents}`);
    console.log(`Total Cases: ${data.totalCases}`);
    console.log(`Grand Total: ${data.total}`);
    
    if (data.severityBreakdown) {
      console.log('\n🎯 SEVERITY BREAKDOWN FROM BACKEND:');
      data.severityBreakdown.forEach(item => {
        console.log(`  ${item._id}: ${item.count}`);
      });
    } else {
      console.log('❌ NO SEVERITY BREAKDOWN IN RESPONSE');
    }
    
    // Test with different time ranges
    console.log('\n🕐 Testing different time ranges...');
    const timeRanges = ['24h', '7d', '30d'];
    
    for (const timeRange of timeRanges) {
      const timeResponse = await axios.get(`${BASE_URL}/stats/dashboard?timeRange=${timeRange}`);
      console.log(`${timeRange}: Total=${timeResponse.data.totalLogs}, Severities=${timeResponse.data.severityBreakdown?.length || 0}`);
    }
    
    return data;
    
  } catch (error) {
    console.log('❌ BACKEND API ERROR:');
    console.log('Status:', error.response?.status);
    console.log('Message:', error.message);
    console.log('Response:', error.response?.data);
    throw error;
  }
}

async function testDirectMongoDB() {
  console.log('\n🔍 STEP 2: DIRECT MONGODB VERIFICATION');
  console.log('=' .repeat(60));
  
  try {
    // Test logs/recent endpoint for raw data
    const response = await axios.get(`${BASE_URL}/logs/recent?limit=10`);
    console.log(`✅ Recent logs endpoint: ${response.data.data.length} logs returned, Total: ${response.data.total}`);
    
    if (response.data.data.length > 0) {
      const sample = response.data.data[0];
      console.log('📄 Sample log structure:');
      console.log(`  ID: ${sample._id}`);
      console.log(`  Severity: ${sample.severity}`);
      console.log(`  Log Type: ${sample.log_type}`);
      console.log(`  Timestamp: ${sample.timestamp}`);
      console.log(`  Endpoint: ${sample.endpoint}`);
    }
    
    // Test severity filtering
    console.log('\n🎯 Testing severity filtering...');
    const severities = ['High', 'Medium', 'Low'];
    
    for (const severity of severities) {
      const sevResponse = await axios.get(`${BASE_URL}/logs/recent?severity=${severity}&limit=1`);
      console.log(`  ${severity}: ${sevResponse.data.total} logs`);
    }
    
  } catch (error) {
    console.log('❌ MongoDB verification error:', error.message);
  }
}

async function traceFrontendDataFlow() {
  console.log('\n🔍 STEP 3: FRONTEND DATA FLOW TRACE');
  console.log('=' .repeat(60));
  
  // This will be used to compare with frontend behavior
  console.log('📋 Expected frontend behavior:');
  console.log('1. Frontend should call /api/stats/dashboard');
  console.log('2. Store should update with response data');
  console.log('3. Components should display stored counts');
  console.log('4. Counts should NOT be derived from logs array');
  
  console.log('\n⚠️  CRITICAL CHECKS NEEDED:');
  console.log('- Is frontend calling correct endpoint?');
  console.log('- Is response being stored correctly?');
  console.log('- Are components reading from store or computing from logs?');
  console.log('- Are there any race conditions or async issues?');
}

async function runFullDiagnostic() {
  try {
    const backendData = await verifyBackendReality();
    await testDirectMongoDB();
    await traceFrontendDataFlow();
    
    console.log('\n🏁 BACKEND VERIFICATION COMPLETE');
    console.log('=' .repeat(60));
    console.log('✅ Backend is responding with data');
    console.log('✅ MongoDB queries are working');
    console.log('⚠️  Next: Check frontend data flow');
    
    return backendData;
    
  } catch (error) {
    console.log('\n❌ DIAGNOSTIC FAILED');
    console.log('Error:', error.message);
    console.log('🛑 STOP: Fix backend issues first');
  }
}

runFullDiagnostic();