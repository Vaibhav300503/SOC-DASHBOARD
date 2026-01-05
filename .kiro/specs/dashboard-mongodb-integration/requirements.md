# Requirements Document

## Introduction

This specification defines the requirements for enhancing the SOC Dashboard to use MongoDB as a fallback data source for cases when TheHive API is unavailable, and to ensure proper alert storage and counting in MongoDB for accurate dashboard metrics.

## Glossary

- **Dashboard**: The main SOC (Security Operations Center) dashboard interface
- **TheHive**: External case management system API
- **MongoDB**: Primary database for storing cases and alerts
- **Case**: Security incident or investigation record
- **Alert**: Security event notification requiring attention
- **Fallback_Mechanism**: System that switches to alternative data source when primary source fails
- **API_Store**: Frontend state management for API data
- **Alert_Metrics**: Statistical data about alert counts and status

## Requirements

### Requirement 1: MongoDB Cases Fallback

**User Story:** As a security analyst, I want the dashboard to show cases from MongoDB when TheHive API is unavailable, so that I can continue monitoring security incidents without interruption.

#### Acceptance Criteria

1. WHEN TheHive API is unavailable or returns empty results, THE Dashboard SHALL retrieve cases from MongoDB cases collection
2. WHEN MongoDB cases are displayed, THE Dashboard SHALL indicate the data source as "MongoDB" 
3. WHEN both TheHive and MongoDB are unavailable, THE Dashboard SHALL display an appropriate error message
4. THE Case_Display SHALL normalize field names between TheHive and MongoDB sources for consistent rendering
5. THE System SHALL attempt TheHive API first, then fallback to MongoDB automatically

### Requirement 2: Alert Storage Enhancement

**User Story:** As a security administrator, I want all alerts to be properly stored in MongoDB, so that dashboard alert counts are accurate and reliable.

#### Acceptance Criteria

1. WHEN an alert is created, THE System SHALL store it in MongoDB AlertEvent collection immediately
2. WHEN alert metrics are calculated, THE System SHALL query MongoDB AlertEvent collection for accurate counts
3. THE Alert_Creation_Process SHALL ensure all required fields are populated in MongoDB
4. THE System SHALL maintain alert status tracking (read/unread, acknowledged) in MongoDB
5. WHEN alerts are updated, THE System SHALL persist changes to MongoDB immediately

### Requirement 3: Hybrid Data Source Management

**User Story:** As a system architect, I want clear separation between TheHive and MongoDB data sources, so that the system can operate reliably with either source.

#### Acceptance Criteria

1. THE API_Store SHALL implement separate methods for TheHive and MongoDB case retrieval
2. THE System SHALL provide clear error handling for each data source independently
3. WHEN data source switching occurs, THE System SHALL log the fallback operation
4. THE Dashboard SHALL display data source indicators for transparency
5. THE System SHALL cache successful data source responses to reduce API calls

### Requirement 4: Dashboard Metrics Accuracy

**User Story:** As a security manager, I want accurate alert and case counts on the dashboard, so that I can make informed decisions about security operations.

#### Acceptance Criteria

1. THE Dashboard SHALL display total alert count from MongoDB AlertEvent collection
2. THE Dashboard SHALL display critical alert count filtered by severity from MongoDB
3. THE Dashboard SHALL display case count from the active data source (TheHive or MongoDB)
4. WHEN metrics are refreshed, THE System SHALL query the most current data from MongoDB
5. THE System SHALL handle concurrent alert creation without losing count accuracy

### Requirement 5: Error Handling and Resilience

**User Story:** As a security analyst, I want the dashboard to handle data source failures gracefully, so that I can continue working even when external systems are down.

#### Acceptance Criteria

1. WHEN TheHive API fails, THE System SHALL log the error and switch to MongoDB automatically
2. WHEN MongoDB is unavailable, THE System SHALL display cached data if available
3. THE System SHALL provide retry mechanisms for failed API calls
4. WHEN all data sources fail, THE Dashboard SHALL display informative error messages
5. THE System SHALL recover automatically when data sources become available again

### Requirement 6: Data Consistency and Synchronization

**User Story:** As a security administrator, I want consistent data representation across different sources, so that analysts can work with unified information regardless of the data source.

#### Acceptance Criteria

1. THE System SHALL normalize case field names between TheHive and MongoDB formats
2. THE System SHALL maintain consistent severity levels across data sources
3. THE System SHALL preserve case metadata when switching between sources
4. THE System SHALL handle timestamp format differences between sources
5. THE System SHALL ensure case status values are consistent across sources