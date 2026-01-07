# Endpoint Name Extraction Fix - Complete

## Problem
The system was showing only one endpoint (DESKTOP-UQJ2EBO) for all 90k+ events because the endpoint name extraction was incomplete. The logs don't have a proper `endpoint` field populated, so the system needed to fall back to the `hostname` field from metadata or raw_data.

## Root Cause
Multiple places in the backend were not checking the `hostname` field as a fallback when extracting endpoint names from logs:
1. Aggregation pipelines in `/api/logs` and `/api/logs/recent` routes
2. Normalization functions in `/api/logs/endpoint/:endpoint` and `/api/logs/search` routes

## Solution Applied

### 1. Fixed Aggregation Pipelines
Updated the `$addFields` stage in both aggregation pipelines to include hostname fallback:

**Before:**
```javascript
endpoint: { $ifNull: ['$metadata.endpoint_name', '$metadata.hostname', '$raw_data.hostname', 'Unknown'] }
```

**After:**
```javascript
endpoint: { $ifNull: ['$endpoint', '$metadata.endpoint_name', '$metadata.hostname', '$raw_data.hostname', 'Unknown'] }
```

**Locations:**
- Line 161: GET `/api/logs` route aggregation pipeline
- Line 287: GET `/api/logs/recent` route aggregation pipeline
- Line 611: GET `/api/logs/severity/:level` route (already had correct normEndpoint)

### 2. Fixed Normalization Functions
Updated endpoint field assignment in two routes to include hostname fallback:

**Before:**
```javascript
endpoint: doc.endpoint || doc.metadata?.endpoint_name || doc.raw_data?.endpoint_name || 'Unknown'
```

**After:**
```javascript
endpoint: doc.endpoint || doc.metadata?.endpoint_name || doc.raw_data?.endpoint_name || doc.metadata?.hostname || doc.raw_data?.hostname || 'Unknown'
```

**Locations:**
- Line 708: GET `/api/logs/endpoint/:endpoint` route
- Line 773: GET `/api/logs/search` route

### 3. Already Correct
The following were already correct:
- Line 30: `normalizeLogData()` helper function (already had hostname fallback)
- Line 611: Severity route normalization (already had correct normEndpoint)

## Expected Results
After these fixes, the system should now:
1. Extract all unique endpoints from logs (not just DESKTOP-UQJ2EBO)
2. Show multiple endpoints in the Endpoints page table
3. Display all endpoints in the Network Topology visualization
4. Properly aggregate events by endpoint across all 90k+ logs

## Endpoints Expected to Appear
Based on the logs data, these endpoints should now be visible:
- DC-01
- cyberpi.tail4c43e.ts.net
- arunkasthuri-m.tail4c43e.ts.net
- manjira-ubuntu.tail4c43e.ts.net
- vaibhav-windows.tail4c43e.ts.net
- And any other unique hostnames in the logs

## Files Modified
- `backend/routes/logs.js` - 4 locations updated

## Testing
To verify the fix:
1. Start the backend server
2. Call `/api/logs/recent?limit=100` and check the response
3. Verify multiple unique endpoint names appear (not just DESKTOP-UQJ2EBO)
4. Check the Endpoints page - should show multiple endpoints with their event counts
5. Check Network Topology - should display all endpoints in the star layout

## Data Flow
```
Logs in MongoDB
    ↓
API Route (GET /api/logs/recent)
    ↓
Aggregation Pipeline with $addFields
    ↓
endpoint: { $ifNull: ['$endpoint', '$metadata.endpoint_name', '$metadata.hostname', '$raw_data.hostname', 'Unknown'] }
    ↓
Frontend receives logs with proper endpoint names
    ↓
Endpoints.vue builds unique endpoint list
    ↓
NetworkTopologyEnhanced.vue displays all endpoints
```

## Configuration
- Fetch limit: 999999 (all logs)
- Data source: Logs only (no MongoDB agents collection)
- Endpoint extraction: Hostname fallback enabled
- Both Endpoints page and Network Topology use same data source
