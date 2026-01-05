# Log Type Classification Reconfiguration - Requirements

## Overview
Reconfigure the SOC platform's log type classification system to use 8 standardized categories instead of the current varied log types. This will improve filtering, analytics, and overall system consistency.

## Current State Analysis

### Existing Log Types (from MongoDB analysis)
Based on the current system analysis, we have various log types including:
- `UnifiedAuth`
- `windows_defender` 
- `NetworkMonitor`
- `Security`
- `kernel`
- `error`
- `fail`
- `critical`
- And many others stored in `metadata.log_source`

### Current Issues
1. **Inconsistent Classification**: Log types are stored in various fields (`log_type`, `metadata.log_source`, `raw_data.log_source`)
2. **No Standardization**: Current types are vendor-specific or tool-specific
3. **Poor Filtering**: Frontend filtering struggles with inconsistent type names
4. **Analytics Complexity**: Stats aggregation is complicated by varied type names

## Target State

### Required Log Type Categories
The system must classify all logs into exactly these 8 categories:

1. **auth** - Authentication and authorization events
2. **network** - Network traffic, connections, protocols
3. **firewall** - Firewall rules, blocks, allows
4. **application** - Application-specific logs and events
5. **database** - Database operations and queries
6. **system** - Operating system events and processes
7. **registry** - Windows registry modifications
8. **fim** - File Integrity Monitoring events

## User Stories

### As a SOC Analyst
- **US-1**: I want to filter logs by standardized categories so I can quickly find relevant security events
- **US-2**: I want consistent log type names across all views so I don't have to remember vendor-specific terminology
- **US-3**: I want accurate statistics by log type so I can understand our security posture

### As a Security Engineer
- **US-4**: I want to configure log type mapping rules so new log sources are automatically classified
- **US-5**: I want to see log type distribution in dashboards so I can monitor data ingestion
- **US-6**: I want filtering to work consistently across all log views

### As a System Administrator
- **US-7**: I want the classification to be based on existing detection logic so we don't lose context
- **US-8**: I want the system to handle unknown log types gracefully with a default classification

## Acceptance Criteria

### Backend Requirements
- **AC-1**: All logs must be classified into one of the 8 required categories
- **AC-2**: Classification logic must be derived from existing alert rules and detection patterns
- **AC-3**: Unknown or unmatched log types must default to 'system' category
- **AC-4**: API endpoints must return the standardized log_type field consistently
- **AC-5**: Statistics aggregation must use the new classification system
- **AC-6**: Existing logs in MongoDB must be reclassified without data loss

### Frontend Requirements
- **AC-7**: Log type dropdown filters must show only the 8 standardized categories
- **AC-8**: Log display must show the standardized log type names
- **AC-9**: Filtering must work correctly with the new classification system
- **AC-10**: Statistics cards must reflect counts for the new categories

### Data Migration Requirements
- **AC-11**: Existing logs must be migrated to use new classification
- **AC-12**: Original log source information must be preserved in metadata
- **AC-13**: Migration must be reversible if needed
- **AC-14**: No logs should be lost during reclassification

## Technical Requirements

### Classification Logic
The system must implement mapping rules based on analysis of existing log sources:

```javascript
// Example mapping rules (to be refined based on actual data analysis)
const LOG_TYPE_MAPPING = {
  // Authentication logs
  'auth': ['UnifiedAuth', 'login', 'authentication', 'auth', 'logon', 'logoff'],
  
  // Network logs  
  'network': ['NetworkMonitor', 'network', 'tcp', 'udp', 'dns', 'http', 'https'],
  
  // Firewall logs
  'firewall': ['firewall', 'iptables', 'pf', 'windows_firewall'],
  
  // Application logs
  'application': ['application', 'app', 'service', 'web', 'api'],
  
  // Database logs
  'database': ['database', 'sql', 'mysql', 'postgres', 'mongodb'],
  
  // System logs
  'system': ['system', 'kernel', 'syslog', 'windows_defender', 'Security'],
  
  // Registry logs
  'registry': ['registry', 'reg', 'windows_registry'],
  
  // File Integrity Monitoring
  'fim': ['fim', 'file', 'integrity', 'ossec', 'samhain']
};
```

### API Changes Required
1. **GET /api/logs** - Must return standardized `log_type` field
2. **GET /api/logs/recent** - Must use new classification for filtering
3. **GET /api/stats/dashboard** - Must aggregate by new log types
4. **GET /api/logs/search** - Must support filtering by new categories

### Database Schema Updates
- Add `standardized_log_type` field to preserve original classification
- Update aggregation pipelines to use new classification
- Create indexes for efficient filtering by new log types

## Implementation Phases

### Phase 1: Analysis and Mapping
1. Analyze all existing log types in MongoDB
2. Create comprehensive mapping rules
3. Validate mapping against sample data
4. Document classification logic

### Phase 2: Backend Implementation
1. Update log processing pipeline with new classification
2. Modify API endpoints to return standardized types
3. Update statistics aggregation logic
4. Create data migration scripts

### Phase 3: Frontend Updates
1. Update LogsDisplay.vue filtering logic
2. Modify dropdown options to show 8 categories
3. Update statistics displays
4. Test filtering functionality

### Phase 4: Data Migration
1. Run classification migration on existing logs
2. Validate data integrity
3. Update indexes and performance optimization
4. Monitor system performance

## Success Metrics
- All logs classified into 8 categories (100% coverage)
- Filtering response time < 500ms for 10k logs
- Zero data loss during migration
- Frontend filtering works for all 8 categories
- Statistics accurately reflect new classification

## Risks and Mitigation
- **Risk**: Data loss during migration
  - **Mitigation**: Backup database before migration, preserve original fields
- **Risk**: Performance degradation
  - **Mitigation**: Create appropriate indexes, test with production data volume
- **Risk**: Incorrect classification
  - **Mitigation**: Extensive testing with sample data, manual validation of mapping rules

## Dependencies
- MongoDB database access for migration
- Backend API server restart capability
- Frontend deployment for UI updates
- Testing environment for validation

## Timeline Estimate
- Phase 1 (Analysis): 1-2 days
- Phase 2 (Backend): 2-3 days  
- Phase 3 (Frontend): 1-2 days
- Phase 4 (Migration): 1 day
- **Total**: 5-8 days

## Definition of Done
- [ ] All 8 log type categories implemented
- [ ] Backend APIs return standardized log types
- [ ] Frontend filtering works with new categories
- [ ] Statistics reflect new classification
- [ ] Existing data successfully migrated
- [ ] Performance meets requirements
- [ ] Documentation updated
- [ ] Testing completed and passed