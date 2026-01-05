// Test script to verify data consistency fixes
import axios from 'axios';

async function testDataConsistency() {
    try {
        console.log('🔍 Testing Data Consistency Fixes...\n');
        
        // 1. Test backend dashboard stats
        console.log('📊 Backend Dashboard Stats:');
        const dashboardResponse = await axios.get('http://localhost:3002/api/stats/dashboard');
        const dashboardStats = dashboardResponse.data;
        console.log(`   Total Logs: ${dashboardStats.totalLogs}`);
        console.log(`   Total Events: ${dashboardStats.totalEvents}`);
        console.log(`   Total Cases: ${dashboardStats.totalCases}`);
        console.log(`   Grand Total: ${dashboardStats.total}`);
        
        // 2. Test recent logs fetch with new default limit
        console.log('\n📋 Recent Logs Fetch (with new default limit):');
        const logsResponse = await axios.get('http://localhost:3002/api/logs/recent?limit=2000');
        const logs = logsResponse.data.data || [];
        console.log(`   Fetched Logs: ${logs.length}`);
        console.log(`   Should match or be close to total: ${dashboardStats.totalLogs}`);
        
        // 3. Test severity breakdown consistency
        console.log('\n🎯 Severity Breakdown Comparison:');
        console.log('   Backend Dashboard Stats:');
        dashboardStats.severityBreakdown.forEach(item => {
            console.log(`     ${item._id}: ${item.count}`);
        });
        
        console.log('   From Fetched Logs:');
        const severityCounts = {
            'Critical': 0,
            'High': 0,
            'Medium': 0,
            'Low': 0
        };
        
        logs.forEach(log => {
            const severity = normalizeSeverity(log.severity);
            severityCounts[severity] = (severityCounts[severity] || 0) + 1;
        });
        
        Object.entries(severityCounts).forEach(([severity, count]) => {
            console.log(`     ${severity}: ${count}`);
        });
        
        // 4. Test log growth calculation
        console.log('\n📈 Log Growth Calculation Test:');
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
        
        const recentCount = logs.filter(log => {
            const logTime = new Date(log.timestamp);
            return logTime >= oneHourAgo;
        }).length;
        
        const olderCount = logs.filter(log => {
            const logTime = new Date(log.timestamp);
            return logTime < oneHourAgo;
        }).length;
        
        console.log(`   Recent logs (last hour): ${recentCount}`);
        console.log(`   Older logs: ${olderCount}`);
        
        if (olderCount > 0) {
            const growthPercent = Math.round(((recentCount - olderCount) / olderCount) * 100);
            console.log(`   Growth: ${growthPercent >= 0 ? '+' : ''}${growthPercent}% vs last hour`);
        } else {
            console.log(`   Growth: New data (no older logs to compare)`);
        }
        
        // 5. Summary
        console.log('\n✅ Data Consistency Check:');
        const logsMatch = Math.abs(logs.length - dashboardStats.totalLogs) <= 50; // Allow small variance
        console.log(`   Logs count consistency: ${logsMatch ? '✅ PASS' : '❌ FAIL'}`);
        console.log(`   Dashboard shows: ${dashboardStats.totalLogs}, Fetched: ${logs.length}`);
        
        console.log('\n🎉 Test completed!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Severity normalization (same as Vue component)
function normalizeSeverity(severity) {
    if (!severity) return 'Low';
    const s = String(severity).toLowerCase().trim();
    if (s.includes('critical')) return 'Critical';
    if (s.includes('high')) return 'High';
    if (s.includes('medium')) return 'Medium';
    return 'Low';
}

testDataConsistency();