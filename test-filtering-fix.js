// Test script to verify log filtering fix
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
            case 'Firewall':
                return lowerLogType.includes('firewall') || 
                       lowerLogType.includes('fw') ||
                       lowerLogType.includes('pfsense') ||
                       lowerLogType.includes('iptables');
            case 'IDS':
                return lowerLogType.includes('ids') || 
                       lowerLogType.includes('intrusion') ||
                       lowerLogType.includes('snort') ||
                       lowerLogType.includes('suricata');
            case 'Authentication':
                return lowerLogType.includes('auth') || 
                       lowerLogType.includes('login') ||
                       lowerLogType.includes('unifiedauth') ||
                       lowerLogType.includes('sso') ||
                       lowerLogType.includes('ldap');
            case 'App':
                return lowerLogType.includes('app') || 
                       lowerLogType.includes('application') ||
                       lowerLogType.includes('service') ||
                       lowerLogType.includes('web');
            case 'System':
                return lowerLogType.includes('system') || 
                       lowerLogType.includes('sys') ||
                       lowerLogType.includes('windows') ||
                       lowerLogType.includes('defender') ||
                       lowerLogType.includes('os') ||
                       lowerLogType.includes('kernel');
            default:
                return logType === selectedType;
        }
    });
}

async function testFiltering() {
    try {
        console.log('🔍 Testing Log Filtering Fix...\n');
        
        // Fetch logs from backend
        const response = await axios.get('http://localhost:3002/api/logs/recent?limit=20');
        const logs = response.data.data || [];
        
        console.log(`📊 Total logs fetched: ${logs.length}`);
        
        // Show unique log types
        const uniqueLogTypes = [...new Set(logs.map(l => l.log_type))];
        console.log(`📋 Unique log types: ${uniqueLogTypes.join(', ')}\n`);
        
        // Test each filter
        const filterTypes = ['All', 'Authentication', 'System', 'Firewall', 'IDS', 'App'];
        
        filterTypes.forEach(filterType => {
            const filtered = filterLogsByType(logs, filterType);
            console.log(`🔸 ${filterType}: ${filtered.length} logs`);
            
            if (filtered.length > 0 && filterType !== 'All') {
                const sampleTypes = filtered.slice(0, 3).map(l => l.log_type);
                console.log(`   Sample types: ${sampleTypes.join(', ')}`);
            }
        });
        
        console.log('\n✅ Filtering test completed!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testFiltering();