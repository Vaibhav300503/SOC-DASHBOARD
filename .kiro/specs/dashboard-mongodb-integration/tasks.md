# Implementation Plan: Dashboard MongoDB Integration

## Overview

This implementation plan converts the hybrid data source design into discrete coding tasks that build incrementally. Each task focuses on implementing specific components while ensuring proper integration and testing of the fallback mechanism between TheHive API and MongoDB.

## Tasks

- [x] 1. Set up backend service infrastructure
  - Create CaseService class with hybrid data source methods
  - Set up MongoDB connection utilities for case operations
  - Implement basic error handling and logging structure
  - _Requirements: 3.1, 3.2, 5.1_

- [x] 1.1 Write property test for service infrastructure
  - **Property 7: Error Handling Independence**
  - **Validates: Requirements 3.2**

- [ ] 2. Implement TheHive API integration
  - [ ] 2.1 Create TheHive API client with timeout handling
    - Implement HTTP client with proper error handling
    - Add authentication and request timeout configuration
    - _Requirements: 1.5, 5.3_

  - [ ] 2.2 Implement fetchFromTheHive method
    - Add case retrieval from TheHive API
    - Handle API response parsing and error scenarios
    - _Requirements: 1.1, 1.5_

  - [ ] 2.3 Write property test for TheHive integration
    - **Property 14: API Retry Mechanism**
    - **Validates: Requirements 5.3**

- [ ] 3. Implement MongoDB fallback functionality
  - [ ] 3.1 Create fetchFromMongoDB method
    - Implement MongoDB case queries with sorting
    - Add proper error handling for database operations
    - _Requirements: 1.1, 1.5_

  - [ ] 3.2 Implement hybrid case retrieval logic
    - Create getRecentCases method with fallback logic
    - Add automatic switching between data sources
    - _Requirements: 1.1, 1.5, 5.1_

  - [ ] 3.3 Write property test for fallback mechanism
    - **Property 1: Fallback Mechanism Consistency**
    - **Validates: Requirements 1.1, 1.5**

- [ ] 4. Implement data normalization
  - [ ] 4.1 Create case data normalization function
    - Implement normalizeCase method for both data sources
    - Handle field mapping between TheHive and MongoDB formats
    - Add source indicator to normalized cases
    - _Requirements: 1.2, 1.4, 6.1, 6.2, 6.4, 6.5_

  - [ ] 4.2 Write property test for data normalization
    - **Property 3: Data Normalization Consistency**
    - **Validates: Requirements 1.4, 6.1, 6.2, 6.4, 6.5**

  - [ ] 4.3 Write property test for data source indication
    - **Property 2: Data Source Indication**
    - **Validates: Requirements 1.2**

- [ ] 5. Checkpoint - Ensure backend service tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Enhance alert storage system
  - [ ] 6.1 Update alert creation endpoints
    - Modify POST /api/alerts/events for immediate MongoDB storage
    - Add validation for required alert fields
    - _Requirements: 2.1, 2.3_

  - [ ] 6.2 Implement alert status tracking
    - Add alert status update functionality in MongoDB
    - Ensure immediate persistence of status changes
    - _Requirements: 2.4, 2.5_

  - [ ] 6.3 Write property test for alert persistence
    - **Property 4: MongoDB Alert Persistence**
    - **Validates: Requirements 2.1, 2.3, 2.5**

  - [ ] 6.4 Write property test for alert status tracking
    - **Property 6: Alert Status Persistence**
    - **Validates: Requirements 2.4**

- [ ] 7. Implement enhanced metrics calculation
  - [ ] 7.1 Create MongoDB-based metrics endpoints
    - Implement GET /api/alerts/metrics with MongoDB queries
    - Add critical alert count filtering by severity
    - _Requirements: 2.2, 4.1, 4.2_

  - [ ] 7.2 Add case count metrics from active data source
    - Implement case counting from hybrid data source
    - Ensure metrics refresh queries current data
    - _Requirements: 4.3, 4.4_

  - [ ] 7.3 Write property test for metrics accuracy
    - **Property 5: Alert Metrics Accuracy**
    - **Validates: Requirements 2.2, 4.1, 4.2, 4.3**

  - [ ] 7.4 Write property test for concurrent alert handling
    - **Property 12: Concurrent Alert Handling**
    - **Validates: Requirements 4.5**

- [ ] 8. Implement caching and retry mechanisms
  - [ ] 8.1 Add response caching functionality
    - Implement caching for successful data source responses
    - Add cache timeout and invalidation logic
    - _Requirements: 3.5, 5.2_

  - [ ] 8.2 Implement retry and recovery mechanisms
    - Add exponential backoff for failed API calls
    - Implement automatic recovery when sources become available
    - _Requirements: 5.3, 5.5_

  - [ ] 8.3 Write property test for caching behavior
    - **Property 10: Response Caching Behavior**
    - **Validates: Requirements 3.5**

  - [ ] 8.4 Write property test for service recovery
    - **Property 15: Service Recovery Behavior**
    - **Validates: Requirements 5.5**

- [ ] 9. Checkpoint - Ensure backend functionality is complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 10. Update frontend API store
  - [ ] 10.1 Enhance API store with error handling
    - Add casesLoading, casesError, and casesSource state properties
    - Implement enhanced fetchRecentCases with error handling
    - Add retryCaseFetch method for manual retry
    - _Requirements: 3.2, 5.2, 5.3_

  - [ ] 10.2 Integrate with new backend endpoints
    - Update API calls to use new hybrid case endpoint
    - Add metrics fetching from enhanced endpoints
    - _Requirements: 2.2, 4.1, 4.2, 4.3_

  - [ ] 10.3 Write unit tests for API store enhancements
    - Test state management and error handling
    - Test retry mechanisms and loading states
    - _Requirements: 3.2, 5.3_

- [ ] 11. Update dashboard UI components
  - [ ] 11.1 Add data source indicators to dashboard
    - Display source badges for cases (TheHive/MongoDB)
    - Add visual indicators for data source transparency
    - _Requirements: 1.2, 3.4_

  - [ ] 11.2 Enhance error handling UI
    - Add informative error messages for data source failures
    - Implement retry buttons for failed requests
    - Add loading states for better user experience
    - _Requirements: 1.3, 5.2, 5.4_

  - [ ] 11.3 Update metrics display
    - Ensure dashboard shows accurate counts from MongoDB
    - Add real-time metrics refresh functionality
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [ ] 11.4 Write unit tests for UI components
    - Test data source indicator display
    - Test error handling and retry functionality
    - _Requirements: 1.2, 3.4, 5.2_

- [ ] 12. Implement logging and monitoring
  - [ ] 12.1 Add fallback operation logging
    - Log all data source switching events
    - Add structured logging for error scenarios
    - _Requirements: 3.3, 5.1_

  - [ ] 12.2 Add metadata preservation during fallback
    - Ensure case metadata is preserved during source switching
    - Add validation for data integrity during fallback
    - _Requirements: 6.3_

  - [ ] 12.3 Write property test for fallback logging
    - **Property 8: Fallback Logging**
    - **Validates: Requirements 3.3, 5.1**

  - [ ] 12.4 Write property test for metadata preservation
    - **Property 16: Metadata Preservation**
    - **Validates: Requirements 6.3**

- [ ] 13. Integration and end-to-end testing
  - [ ] 13.1 Wire all components together
    - Connect CaseService to API routes
    - Integrate enhanced API store with dashboard components
    - Ensure proper error propagation through all layers
    - _Requirements: All requirements_

  - [ ] 13.2 Write integration tests
    - Test complete case retrieval flow with fallback
    - Test alert storage and metrics calculation end-to-end
    - Test error recovery scenarios
    - _Requirements: All requirements_

- [ ] 14. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks were marked as required to ensure comprehensive testing from the beginning
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The implementation builds incrementally from backend services to frontend integration