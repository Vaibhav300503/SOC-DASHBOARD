// Test script to verify statistics fix
import axios from 'axios';

// Filtering logic from Vue component
function filterLogsByType(logs, selectedType) {
    if (selectedType === 'All') {
        return logs;
    }

    return logs.filter(log => {
        const logType = log.log_type || 'System';
        const lowerLogType = logType.toLowerCase();
        
        switch (selectedType) {
            case 'Authentication':
                return lowerLogType.includes('auth') || 
                       lowerLogType.includes('login') ||
                       lowerLogType.includes('unifiedauth') ||
                       lowerLogType.includes('sso') ||
                       lowerLogType.includes('ldap');
            case 'System':
                return lowerLogType.includes('system') || 
                       lowerLogType.includes('sys') ||
                       lowerLogType.includes('windows') ||
                       lowerLogType.includes('defender') ||
                       lowerLogType.includes('os') ||
                       lowerLogType.includes('kernel');
            case 'App':
                return lowerLogType.includes('app') || 
                       lowerLogType.includes('application') ||
                       lowerLogType.includes('service') ||
                       lowerLogType.includes('web');
            default:
                return logType === selectedType;
        }
    });
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

function countBySeverity(logs, severity) {
    return logs.filter(log => {
        const normalizedSeverity = normalizeSeverity(log.severity);
        return normalizedSeverity === severity;
    }).length;
}

async function testStatistics() {
    try {
        console.log('📊 Testing Statistics Fix...\n');
        
        // Fetch logs from backend
        const response = await axios.get('http://localhost:3002/api/logs/recent?limit=100');
        const allLogs = response.data.data || [];
        
        console.log(`📋 Total logs fetched: ${allLogs.length}\n`);
        
        // Test statistics for different log types
        const filterTypes = ['All', 'Authentication', 'System', 'App'];
        
        filterTypes.forEach(filterType => {
            const filteredLogs = filterLogsByType(allLogs, filterType);
            
            const critical = countBySeverity(filteredLogs, 'Critical');
            const high = countBySeverity(filteredLogs, 'High');
            const medium = countBySeverity(filteredLogs, 'Medium');
            const low = countBySeverity(filteredLogs, 'Low');
            const total = filteredLogs.length;
            
            console.log(`🔸 ${filterType} Logs Statistics:`);
            console.log(`   Total: ${total}`);
            console.log(`   Critical: ${critical}`);
            console.log(`   High: ${high}`);
            console.log(`   Medium: ${medium}`);
            console.log(`   Low: ${low}`);
            console.log(`   Sum: ${critical + high + medium + low} (should equal total: ${total})`);
            console.log('');
        });
        
        console.log('✅ Statistics test completed!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testStatistics();