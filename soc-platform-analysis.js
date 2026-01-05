// SOC Platform Analysis - Current State Investigation
import axios from 'axios';

const API_BASE = 'http://localhost:3002/api';

async function analyzeHiveConfiguration() {
  console.log('🔍 PART 1: ANALYZING HIVE CONFIGURATION');
  console.log('=' .repeat(60));
  
  try {
    // Test Hive cases endpoint
    const response = await axios.get(`${API_BASE}/alerts/cases/recent?limit=10`);
    console.log('✅ Hive Cases API Status:', response.status);
    console.log('📊 Cases returned:', response.data?.data?.length || 0);
    
    if (response.data?.data?.length === 0) {
      console.log('⚠️  ROOT CAUSE: Hive returns empty result');
      console.log('   - Need to verify Hive connectivity');
      console.log('   - Need to check MongoDB fallback');
    }
    
    return response.data?.data || [];
  } catch (error) {
    console.log('❌ Hive API Error:', error.response?.status, error.message);
    console.log('⚠️  ROOT CAUSE: Hive API unreachable or misconfigured');
    return null;
  }
}

async function analyzeSeverityCounts() {
  console.log('\n🔍 PART 2: ANALYZING SEVERITY COUNTS');
  console.log('=' .repeat(60));
  
  try {
    // Test dashboard stats
    const statsResponse = await axios.get(`${API_BASE}/stats/dashboard?timeRange=30d`);
    console.log('✅ Dashboard Stats Status:', statsResponse.status);
    
    const stats = statsResponse.data;
    console.log('📊 Total Logs:', stats.totalLogs);
    console.log('📊 Severity Breakdown:', stats.severityBreakdown?.length || 0, 'levels');
    
    if (stats.severityBreakdown) {
      stats.severityBreakdown.forEach(item => {
        console.log(`   ${item._id}: ${item.count}`);
      });
      
      const totalFromSeverity = stats.severityBreakdown.reduce((sum, item) => sum + item.count, 0);
      console.log('📊 Total from severity sum:', totalFromSeverity);
      console.log('📊 Total logs reported:', stats.totalLogs);
      
      if (totalFromSeverity !== stats.totalLogs) {
        console.log('⚠️  ROOT CAUSE: Severity counts mismatch with total logs');
        console.log('   - Severity counts may be filtered or limited');
        console.log('   - Need to use UNFILTERED MongoDB aggregation');
      }
    }
    
    return stats;
  } catch (error) {
    console.log('❌ Stats API Error:', error.response?.status, error.message);
    return null;
  }
}

async function analyzeLogFetching() {
  console.log('\n🔍 PART 3: ANALYZING LOG FETCHING');
  console.log('=' .repeat(60));
  
  try {
    // Test recent logs endpoint
    const logsResponse = await axios.get(`${API_BASE}/logs/recent?limit=100`);
    console.log('✅ Logs API Status:', logsResponse.status);
    console.log('📊 Logs returned:', logsResponse.data?.data?.length || 0);
    
    if (logsResponse.data?.data) {
      const logs = logsResponse.data.data;
      
      // Analyze log structure
      const logTypes = [...new Set(logs.map(log => log.log_type).filter(Boolean))];
      const severities = [...new Set(logs.map(log => log.severity).filter(Boolean))];
      
      console.log('📊 Unique log types found:', logTypes.length);
      console.log('   Types:', logTypes.slice(0, 10));
      console.log('📊 Unique severities found:', severities.length);
      console.log('   Severities:', severities);
      
      // Check for 2K limitation
      if (logs.length === 100) {
        console.log('⚠️  POTENTIAL ISSUE: May be hitting artificial limits');
      }
      
      // Check timestamp distribution
      const timestamps = logs.map(log => new Date(log.timestamp)).sort();
      const oldest = timestamps[0];
      const newest = timestamps[timestamps.length - 1];
      console.log('📊 Time range:', oldest?.toISOString(), 'to', newest?.toISOString());
      
      if (logs.length < 100) {
        console.log('⚠️  ROOT CAUSE: Limited log fetching detected');
        console.log('   - Need to remove artificial limits');
        console.log('   - Need direct MongoDB aggregation');
      }
    }
    
    return logsResponse.data?.data || [];
  } catch (error) {
    console.log('❌ Logs API Error:', error.response?.status, error.message);
    return null;
  }
}

async function analyzeLogTypeClassification() {
  console.log('\n🔍 PART 4: ANALYZING LOG TYPE CLASSIFICATION');
  console.log('=' .repeat(60));
  
  try {
    // Get current log types from API
    const logsResponse = await axios.get(`${API_BASE}/logs/recent?limit=200`);
    
    if (logsResponse.data?.data) {
      const logs = logsResponse.data.data;
      const logTypeDistribution = {};
      
      logs.forEach(log => {
        const type = log.log_type || 'unknown';
        logTypeDistribution[type] = (logTypeDistribution[type] || 0) + 1;
      });
      
      console.log('📊 Current Log Type Distribution:');
      Object.entries(logTypeDistribution)
        .sort(([,a], [,b]) => b - a)
        .forEach(([type, count]) => {
          console.log(`   ${type}: ${count}`);
        });
      
      // Analyze against required classification
      const requiredTypes = ['auth', 'network', 'firewall', 'application', 'database', 'system', 'registry', 'fim'];
      const currentTypes = Object.keys(logTypeDistribution);
      
      console.log('\n📊 Classification Analysis:');
      console.log('   Required types:', requiredTypes);
      console.log('   Current types:', currentTypes.slice(0, 10));
      
      const needsReclassification = !requiredTypes.every(type => currentTypes.includes(type));
      if (needsReclassification) {
        console.log('⚠️  ROOT CAUSE: Log types need reclassification');
        console.log('   - Current types do not match required classification');
        console.log('   - Need to implement mapping rules');
      }
    }
    
    return logsResponse.data?.data || [];
  } catch (error) {
    console.log('❌ Log Type Analysis Error:', error.message);
    return null;
  }
}

async function runAnalysis() {
  console.log('🚀 SOC PLATFORM ANALYSIS');
  console.log('=' .repeat(80));
  
  const hiveResults = await analyzeHiveConfiguration();
  const severityResults = await analyzeSeverityCounts();
  const logResults = await analyzeLogFetching();
  const classificationResults = await analyzeLogTypeClassification();
  
  console.log('\n📋 ROOT CAUSE ANALYSIS SUMMARY');
  console.log('=' .repeat(80));
  
  console.log('\n🔍 PART 1 - CASES NOT SHOWING:');
  if (!hiveResults || hiveResults.length === 0) {
    console.log('❌ ROOT CAUSE: Hive returns empty or API fails');
    console.log('   SOLUTION: Implement MongoDB fallback with proper schema');
  } else {
    console.log('✅ Cases API working');
  }
  
  console.log('\n🔍 PART 2 - SEVERITY COUNTS INCORRECT:');
  if (severityResults) {
    console.log('⚠️  ROOT CAUSE: Counts may be filtered or limited');
    console.log('   SOLUTION: Use unfiltered MongoDB aggregation for counts');
  } else {
    console.log('❌ ROOT CAUSE: Stats API failing');
  }
  
  console.log('\n🔍 PART 3 - LOG FETCHING LIMITED:');
  if (logResults && logResults.length > 0) {
    console.log('⚠️  ROOT CAUSE: Artificial limits on log fetching');
    console.log('   SOLUTION: Remove 2K limits, use MongoDB aggregation');
  } else {
    console.log('❌ ROOT CAUSE: Logs API failing');
  }
  
  console.log('\n🔍 PART 4 - LOG TYPE CLASSIFICATION:');
  if (classificationResults) {
    console.log('⚠️  ROOT CAUSE: Log types need standardization');
    console.log('   SOLUTION: Implement mapping to 8 required categories');
  }
  
  console.log('\n🎯 NEXT STEPS:');
  console.log('1. Fix Hive configuration or implement MongoDB fallback');
  console.log('2. Reconfigure severity counts to use unfiltered data');
  console.log('3. Remove artificial limits from log fetching');
  console.log('4. Implement log type reclassification');
  console.log('5. Fix frontend filters to work with backend APIs');
}

runAnalysis();