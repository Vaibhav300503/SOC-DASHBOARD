# Log Type Classification Reconfiguration - Design Document

## Architecture Overview

The log type classification reconfiguration will implement a standardized mapping system that transforms existing varied log types into 8 consistent categories while preserving original data for audit and debugging purposes.

## System Components

### 1. Classification Engine
**Location**: `backend/utils/logTypeClassifier.js`

```javascript
class LogTypeClassifier {
  constructor() {
    this.mappingRules = this.loadMappingRules();
  }
  
  classify(logSource, rawData, metadata) {
    // Implementation details in tasks.md
  }
  
  getStandardizedType(originalType) {
    // Map original type to one of 8 categories
  }
}
```

### 2. Database Schema Updates
**Collections Affected**: 
- `raw_logs` (primary collection with 74,901 logs)
- `logs` (if used)
- `events` (if applicable)

**New Fields**:
```javascript
{
  // Existing fields preserved
  log_type: "auth",                    // NEW: Standardized type
  original_log_type: "UnifiedAuth",    // NEW: Original type preserved
  classification_version: "1.0",       // NEW: For future migrations
  classified_at: ISODate(),            // NEW: When classification was applied
  
  // Existing fields
  metadata: {
    log_source: "UnifiedAuth",         // PRESERVED: Original source
    // ... other metadata
  }
}
```

### 3. API Layer Updates
**Endpoints Modified**:
- `GET /api/logs` - Returns standardized log_type
- `GET /api/logs/recent` - Filters by standardized types
- `GET /api/stats/dashboard` - Aggregates by standardized types
- `GET /api/logs/search` - Supports new type filtering

### 4. Frontend Component Updates
**Components Modified**:
- `LogsDisplay.vue` - Updated filtering dropdowns
- `Dashboard.vue` - Updated statistics display
- `Statistics.vue` - Updated charts and metrics

## Classification Logic Design

### Mapping Rules Structure
```javascript
const LOG_TYPE_MAPPING = {
  'auth': {
    patterns: [
      /unified.*auth/i,
      /login/i,
      /authentication/i,
      /logon/i,
      /logoff/i,
      /auth/i
    ],
    keywords: ['auth', 'login', 'authentication', 'logon', 'logoff', 'credential'],
    sources: ['UnifiedAuth', 'ActiveDirectory', 'LDAP']
  },
  
  'network': {
    patterns: [
      /network.*monitor/i,
      /tcp/i,
      /udp/i,
      /dns/i,
      /http/i
    ],
    keywords: ['network', 'tcp', 'udp', 'dns', 'http', 'connection'],
    sources: ['NetworkMonitor', 'Wireshark', 'Netflow']
  },
  
  'firewall': {
    patterns: [
      /firewall/i,
      /iptables/i,
      /pf/i,
      /windows.*firewall/i
    ],
    keywords: ['firewall', 'block', 'allow', 'deny', 'rule'],
    sources: ['WindowsFirewall', 'iptables', 'pfSense']
  },
  
  'application': {
    patterns: [
      /application/i,
      /app/i,
      /service/i,
      /web/i,
      /api/i
    ],
    keywords: ['application', 'app', 'service', 'web', 'api', 'error'],
    sources: ['IIS', 'Apache', 'Nginx', 'Tomcat']
  },
  
  'database': {
    patterns: [
      /database/i,
      /sql/i,
      /mysql/i,
      /postgres/i,
      /mongodb/i
    ],
    keywords: ['database', 'sql', 'query', 'table', 'insert', 'update'],
    sources: ['MySQL', 'PostgreSQL', 'MongoDB', 'MSSQL']
  },
  
  'system': {
    patterns: [
      /system/i,
      /kernel/i,
      /syslog/i,
      /windows.*defender/i,
      /security/i
    ],
    keywords: ['system', 'kernel', 'process', 'service', 'boot', 'shutdown'],
    sources: ['WindowsDefender', 'Syslog', 'EventLog', 'Security']
  },
  
  'registry': {
    patterns: [
      /registry/i,
      /reg/i,
      /windows.*registry/i,
      /hkey/i
    ],
    keywords: ['registry', 'reg', 'hkey', 'modification', 'key'],
    sources: ['WindowsRegistry', 'RegMon']
  },
  
  'fim': {
    patterns: [
      /fim/i,
      /file.*integrity/i,
      /ossec/i,
      /samhain/i,
      /file.*monitor/i
    ],
    keywords: ['fim', 'file', 'integrity', 'modification', 'checksum'],
    sources: ['OSSEC', 'Samhain', 'AIDE', 'Tripwire']
  }
};
```

### Classification Algorithm
```javascript
function classifyLogType(log) {
  const logSource = log.metadata?.log_source || log.log_type || 'unknown';
  const rawData = log.raw_data || {};
  
  // Priority order for classification
  const classificationSources = [
    logSource,
    rawData.type,
    rawData.category,
    log.parsed_data?.event_type,
    extractFromMessage(log.message)
  ];
  
  for (const [category, rules] of Object.entries(LOG_TYPE_MAPPING)) {
    if (matchesCategory(classificationSources, rules)) {
      return category;
    }
  }
  
  // Default fallback
  return 'system';
}
```

## Data Migration Strategy

### Phase 1: Analysis
1. **Inventory Current Types**
   ```javascript
   db.raw_logs.aggregate([
     { $group: { _id: "$metadata.log_source", count: { $sum: 1 } } },
     { $sort: { count: -1 } }
   ])
   ```

2. **Validate Mapping Rules**
   - Test classification against sample data
   - Ensure 100% coverage of existing types
   - Validate no logs are lost

### Phase 2: Migration Script
**Location**: `backend/scripts/migrateLogTypes.js`

```javascript
async function migrateLogTypes() {
  const classifier = new LogTypeClassifier();
  const batchSize = 1000;
  let processed = 0;
  
  const cursor = db.collection('raw_logs').find({});
  
  while (await cursor.hasNext()) {
    const batch = [];
    for (let i = 0; i < batchSize && await cursor.hasNext(); i++) {
      const log = await cursor.next();
      const standardizedType = classifier.classify(log);
      
      batch.push({
        updateOne: {
          filter: { _id: log._id },
          update: {
            $set: {
              log_type: standardizedType,
              original_log_type: log.metadata?.log_source || log.log_type,
              classification_version: '1.0',
              classified_at: new Date()
            }
          }
        }
      });
    }
    
    if (batch.length > 0) {
      await db.collection('raw_logs').bulkWrite(batch);
      processed += batch.length;
      console.log(`Processed ${processed} logs`);
    }
  }
}
```

### Phase 3: Rollback Strategy
```javascript
async function rollbackClassification() {
  await db.collection('raw_logs').updateMany(
    { classification_version: '1.0' },
    {
      $unset: {
        log_type: "",
        original_log_type: "",
        classification_version: "",
        classified_at: ""
      },
      $set: {
        log_type: "$original_log_type"  // Restore original if needed
      }
    }
  );
}
```

## API Design Changes

### Updated Response Format
```javascript
// Before
{
  "_id": "...",
  "timestamp": "2024-01-04T10:00:00Z",
  "severity": "High",
  "log_type": "UnifiedAuth",  // Inconsistent
  "metadata": {
    "log_source": "UnifiedAuth"
  }
}

// After
{
  "_id": "...",
  "timestamp": "2024-01-04T10:00:00Z",
  "severity": "High",
  "log_type": "auth",         // Standardized
  "original_log_type": "UnifiedAuth",
  "metadata": {
    "log_source": "UnifiedAuth"  // Preserved
  }
}
```

### Updated Aggregation Pipelines
```javascript
// Dashboard stats aggregation
const logTypePipeline = [
  {
    $addFields: {
      normTimestamp: { $ifNull: ['$timestamp', '$ingested_at', new Date()] },
      // Use standardized log_type field
      standardizedLogType: { $ifNull: ['$log_type', 'system'] }
    }
  },
  {
    $group: {
      _id: '$standardizedLogType',
      count: { $sum: 1 }
    }
  }
];
```

## Frontend Design Updates

### LogsDisplay.vue Changes
```vue
<template>
  <!-- Log Type Filter -->
  <select v-model="selectedLogType" @change="applyFilters">
    <option value="all">All Types</option>
    <option value="auth">Authentication</option>
    <option value="network">Network</option>
    <option value="firewall">Firewall</option>
    <option value="application">Application</option>
    <option value="database">Database</option>
    <option value="system">System</option>
    <option value="registry">Registry</option>
    <option value="fim">File Integrity</option>
  </select>
</template>

<script>
// Updated available log types
const STANDARD_LOG_TYPES = [
  'auth', 'network', 'firewall', 'application', 
  'database', 'system', 'registry', 'fim'
];
</script>
```

### Statistics Display Updates
```javascript
// Updated statistics calculation
const getLogTypeStats = () => {
  const stats = {};
  STANDARD_LOG_TYPES.forEach(type => {
    stats[type] = filteredLogs.value.filter(log => log.log_type === type).length;
  });
  return stats;
};
```

## Performance Considerations

### Database Indexes
```javascript
// Create indexes for efficient filtering
db.raw_logs.createIndex({ "log_type": 1, "timestamp": -1 });
db.raw_logs.createIndex({ "log_type": 1, "severity": 1 });
db.raw_logs.createIndex({ "original_log_type": 1 }); // For debugging
```

### Caching Strategy
- Cache classification rules in memory
- Cache log type statistics for dashboard
- Implement Redis caching for frequent queries

### Query Optimization
- Use aggregation pipelines instead of multiple queries
- Limit result sets appropriately
- Implement pagination for large datasets

## Testing Strategy

### Unit Tests
- Test classification logic with sample data
- Test mapping rules coverage
- Test edge cases and unknown types

### Integration Tests
- Test API endpoints with new classification
- Test frontend filtering functionality
- Test statistics accuracy

### Performance Tests
- Test migration script with large datasets
- Test query performance with new indexes
- Test frontend responsiveness with filtered data

## Monitoring and Observability

### Metrics to Track
- Classification accuracy rate
- Migration progress and errors
- Query performance before/after
- Frontend filter usage patterns

### Logging
- Log all classification decisions
- Log migration progress and errors
- Log performance metrics

### Alerts
- Alert on classification failures
- Alert on migration errors
- Alert on performance degradation

## Security Considerations

### Data Integrity
- Preserve original log data
- Maintain audit trail of changes
- Implement rollback capability

### Access Control
- Restrict migration script access
- Log administrative actions
- Maintain data confidentiality

## Documentation Updates

### API Documentation
- Update endpoint documentation
- Document new response formats
- Provide migration guides

### User Documentation
- Update filtering instructions
- Document new log type categories
- Provide troubleshooting guides

## Success Criteria

### Technical Success
- 100% log classification coverage
- Zero data loss during migration
- Query performance maintained or improved
- All tests passing

### User Success
- Improved filtering experience
- Consistent log type names
- Accurate statistics and dashboards
- Reduced confusion about log types

## Future Enhancements

### Machine Learning Classification
- Implement ML-based classification for unknown types
- Continuous learning from user feedback
- Automated rule refinement

### Advanced Analytics
- Log type trend analysis
- Anomaly detection by type
- Predictive analytics for security events

### Integration Improvements
- Real-time classification for new logs
- Integration with SIEM tools
- Custom classification rules per organization