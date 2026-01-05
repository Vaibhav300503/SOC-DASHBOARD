# Log Type Classification Reconfiguration

## Overview
This spec defines the reconfiguration of the SOC platform's log type classification system to use 8 standardized categories instead of the current varied log types. This will improve filtering, analytics, and overall system consistency.

## Quick Start

### Current Problem
- Log types are inconsistent (UnifiedAuth, windows_defender, NetworkMonitor, etc.)
- Filtering is unreliable due to varied type names
- Statistics are difficult to aggregate across different log sources
- Frontend dropdowns show too many vendor-specific types

### Target Solution
- Standardize all logs into 8 categories: `auth`, `network`, `firewall`, `application`, `database`, `system`, `registry`, `fim`
- Preserve original log source information for audit purposes
- Update all APIs and frontend components to use standardized types
- Migrate existing 74,901 logs in MongoDB to new classification

## Files in This Spec

### Core Documents
- **[requirements.md](./requirements.md)** - Detailed requirements, user stories, and acceptance criteria
- **[design.md](./design.md)** - Technical architecture and implementation design
- **[tasks.md](./tasks.md)** - Detailed implementation tasks with timelines

### Key Implementation Areas

#### Backend Changes
- `backend/utils/logTypeClassifier.js` - New classification engine
- `backend/routes/logs.js` - Updated API endpoints
- `backend/routes/stats.js` - Updated statistics aggregation
- `backend/scripts/migrateLogTypes.js` - Data migration script

#### Frontend Changes
- `src/components/soc/LogsDisplay.vue` - Updated filtering dropdowns
- `src/pages/DashboardNew.vue` - Updated statistics display
- `src/utils/logTypeConstants.js` - Standardized type definitions

#### Database Changes
- Add `log_type` field with standardized values
- Preserve `original_log_type` for audit trail
- Create indexes for efficient filtering
- Migrate 74,901 existing logs

## Implementation Timeline

| Phase | Duration | Key Deliverables |
|-------|----------|------------------|
| **Phase 1: Analysis** | 1-2 days | Mapping rules, validation |
| **Phase 2: Backend** | 2-3 days | Updated APIs, migration scripts |
| **Phase 3: Frontend** | 1-2 days | Updated components, filtering |
| **Phase 4: Migration** | 1 day | Data migration, testing |
| **Total** | **5-8 days** | **Complete reconfiguration** |

## The 8 Standardized Categories

1. **auth** - Authentication and authorization events
2. **network** - Network traffic, connections, protocols  
3. **firewall** - Firewall rules, blocks, allows
4. **application** - Application-specific logs and events
5. **database** - Database operations and queries
6. **system** - Operating system events and processes
7. **registry** - Windows registry modifications
8. **fim** - File Integrity Monitoring events

## Success Criteria

### Technical Success
- ✅ 100% log classification coverage
- ✅ Zero data loss during migration
- ✅ Query performance maintained or improved
- ✅ All tests passing

### User Success
- ✅ Improved filtering experience
- ✅ Consistent log type names
- ✅ Accurate statistics and dashboards
- ✅ Reduced confusion about log types

## Getting Started

### For Developers
1. Read [requirements.md](./requirements.md) for complete context
2. Review [design.md](./design.md) for technical architecture
3. Follow [tasks.md](./tasks.md) for step-by-step implementation

### For Stakeholders
1. Review user stories in [requirements.md](./requirements.md)
2. Understand the business impact and timeline
3. Approve the implementation approach

### For QA/Testing
1. Review acceptance criteria in [requirements.md](./requirements.md)
2. Understand the testing strategy in [tasks.md](./tasks.md)
3. Prepare test cases for the 8 standardized categories

## Key Decisions Made

### Why These 8 Categories?
- **Industry Standard**: Aligns with common SIEM and SOC categorizations
- **Comprehensive Coverage**: Covers all major log types in security operations
- **User Friendly**: Easy to understand and remember for analysts
- **Scalable**: Can accommodate new log sources within existing categories

### Why Preserve Original Types?
- **Audit Trail**: Maintain complete history of log sources
- **Debugging**: Easier troubleshooting with original context
- **Rollback**: Ability to revert if needed
- **Compliance**: Some regulations require original log preservation

### Migration Strategy
- **Batch Processing**: Handle large dataset efficiently
- **Zero Downtime**: Migration runs without service interruption
- **Validation**: Comprehensive checks ensure data integrity
- **Rollback Ready**: Complete rollback capability if issues arise

## Risks and Mitigation

### High Risk Items
- **Data Loss During Migration**
  - *Mitigation*: Comprehensive backups, validation scripts, rollback procedures
- **Performance Degradation**
  - *Mitigation*: Proper indexing, query optimization, performance testing
- **User Confusion**
  - *Mitigation*: Clear documentation, training, gradual rollout

### Medium Risk Items
- **Classification Accuracy**
  - *Mitigation*: Extensive testing, manual validation, feedback loops
- **API Compatibility**
  - *Mitigation*: Backward compatibility where possible, versioning strategy

## Support and Maintenance

### Post-Implementation
- Monitor classification accuracy and user feedback
- Refine mapping rules based on new log sources
- Performance monitoring and optimization
- User training and documentation updates

### Future Enhancements
- Machine learning-based classification
- Custom classification rules per organization
- Integration with external threat intelligence
- Advanced analytics and reporting

## Contact and Questions

For questions about this specification:
- **Technical Questions**: Backend/Frontend development teams
- **Business Questions**: SOC operations team
- **Implementation**: Project manager and development leads

---

*This specification is part of the SOC platform improvement initiative to standardize log type classification and improve operational efficiency.*