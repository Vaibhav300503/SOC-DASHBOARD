# Log Viewer Critical & Medium Severity Fix

## Problem
Users were unable to see Critical and Medium severity logs when filtering in the Log Viewer, even though the counts were correct.

## Root Causes
1. **Backend Severity Assignment**: The backend was only assigning three severity levels (High, Medium, Low) but the frontend expected four (Critical, High, Medium, Low)
2. **Missing Critical Pattern**: The backend regex patterns didn't include "Critical" severity
3. **Frontend Filter Normalization**: The severity filter value wasn't being normalized before comparison

## Solutions Implemented

### 1. Frontend Changes

#### src/pages/LogViewer.vue
- Added loading overlay that displays when filtering logs
- Shows "Filtering Logs..." message with spinner during filter operations
- Added `isSearching` state from useSearch composable
- Added debug logging to console to track severity breakdown and sample logs

#### src/utils/searchFiltering.js
- Updated `applySeverityFilter()` function to normalize both log severity AND filter value before comparison
- Ensures consistent comparison regardless of case or format

### 2. Backend Changes

#### backend/routes/logs.js
- Updated all 3 severity assignment pipelines to include "Critical" severity
- New severity assignment order:
  1. **Critical**: `/critical|alert|emergency|severe|attack|breach/i`
  2. **High**: `/security|intrusion|malware|Security|warning/i`
  3. **Medium**: `/error|fail|medium|kernel/i`
  4. **Low**: default

#### backend/routes/stats.js
- Updated severity assignment in `/api/stats` endpoint (main stats)
- Updated severity assignment in `/api/stats/severity` endpoint
- Updated severity assignment in `/api/stats/timeline` endpoint
- All now include the same Critical severity pattern

## How It Works Now

1. **Backend Processing**:
   - When logs are fetched, the backend examines the `metadata.log_source` field
   - Applies regex patterns to assign severity levels
   - Returns logs with proper severity classification

2. **Frontend Filtering**:
   - When user selects a severity filter (Critical, High, Medium, Low)
   - The filter value is normalized to match backend output
   - Logs are filtered using the normalized values
   - Loading overlay shows during filtering
   - Results display with proper severity badges

3. **Data Flow**:
   ```
   Backend assigns severity → Frontend receives logs → User filters by severity
   → Frontend normalizes filter value → Logs are filtered → Results displayed
   ```

## Testing

To verify the fix works:

1. Open Log Viewer page
2. Select "Critical" from Severity dropdown
3. Observe loading overlay appears
4. Wait for logs to filter
5. Critical severity logs should now display
6. Repeat for "Medium" severity

## Files Modified

- `src/pages/LogViewer.vue` - Added loading overlay and debug logging
- `src/utils/searchFiltering.js` - Fixed severity filter normalization
- `backend/routes/logs.js` - Updated 3 severity assignment pipelines
- `backend/routes/stats.js` - Updated 3 severity assignment pipelines

## Notes

- The severity assignment is based on `metadata.log_source` field patterns
- If logs don't have matching patterns, they default to "Low" severity
- The loading overlay provides visual feedback during filtering operations
- Debug logs in browser console show severity breakdown for troubleshooting
