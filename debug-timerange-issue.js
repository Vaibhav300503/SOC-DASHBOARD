// Debug script to verify the timeRange issue
import axios from 'axios';

const BASE_URL = 'http://localhost:3002/api';

async function debugTimeRangeIssue() {
  console.log('🔍 DEBUGGING TIME RANGE ISSUE');
  console.log('=' .repeat(60));
  
  // Test different time ranges to confirm the issue
  const timeRanges = ['1h', '6h', '24h', '7d', '30d'];
  
  console.log('\n📊 Testing dashboard stats with different time ranges:');
  
  for (const timeRange of timeRanges) {
    try {
      const response = await axios.get(`${BASE_URL}/stats/dashboard?timeRange=${timeRange}`);
      const data = response.data;
      
      console.log(`\n⏰ ${timeRange}:`);
      console.log(`  Total Logs: ${data.totalLogs}`);
      console.log(`  Severity Breakdown: ${data.severityBreakdown?.length || 0} categories`);
      
      if (data.severityBreakdown && data.severityBreakdown.length > 0) {
        data.severityBreakdown.forEach(item => {
          console.log(`    ${item._id}: ${item.count}`);
        });
      } else {
        console.log('    ❌ NO SEVERITY DATA');
      }
      
    } catch (error) {
      console.log(`  ❌ Error for ${timeRange}: ${error.message}`);
    }
  }
  
  console.log('\n🎯 CONCLUSION:');
  console.log('If 24h shows 0 logs but 30d shows data, then:');
  console.log('1. Frontend is using 24h by default');
  console.log('2. All logs are older than 24 hours');
  console.log('3. Dashboard shows zero counts because of wrong time range');
  
  console.log('\n🔧 SOLUTION:');
  console.log('Change default timeRange from "24h" to "30d" or "7d"');
}

debugTimeRangeIssue();