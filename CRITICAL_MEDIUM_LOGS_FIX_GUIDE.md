# Critical & Medium Logs Not Showing - Complete Fix Guide

## Problem
When filtering by "Critical" or "Medium" severity in Log Viewer, no logs appear even though the count shows they exist.

## Root Cause
Your logs in MongoDB don't have severity values populated, and the backend is trying to assign severity dynamically based on `metadata.log_source` patterns. Since your logs don't have matching metadata, they all default to "Low" severity.

## Solution

### Step 1: Ensure MongoDB is Running
First, make sure MongoDB is running:
```bash
# Windows
mongod

# Or if using MongoDB as a service
net start MongoDB
```

### Step 2: Create Test Logs with Proper Severity

Run this command from the backend directory to create test logs:
```bash
node scripts/createTestLogs.js
```

This will create:
- 5 Critical logs
- 10 High logs
- 15 Medium logs
- 20 Low logs

### Step 3: Verify the Logs Were Created

Check MongoDB directly:
```bash
mongosh
use soc-platform
db.raw_logs.aggregate([
  { $group: { _id: "$severity", count: { $sum: 1 } } },
  { $sort: { count: -1 } }
])
```

You should see output like:
```
{ _id: 'Low', count: 20 }
{ _id: 'Medium', count: 15 }
{ _id: 'High', count: 10 }
{ _id: 'Critical', count: 5 }
```

### Step 4: Test the Log Viewer

1. Refresh the Log Viewer page
2. Select "Critical" from the Severity dropdown
3. You should now see 5 Critical logs
4. Try "Medium" - you should see 15 Medium logs
5. Try "High" - you should see 10 High logs

## If You Have Existing Logs

If you already have logs in your database and want to populate their severity:

### Option A: Use the Populate Script
```bash
node scripts/populateSeverity.js
```

This script will:
1. Analyze each log's content
2. Assign appropriate severity based on patterns
3. Update all logs in the database

### Option B: Manual MongoDB Update

Connect to MongoDB and run:
```javascript
db.raw_logs.updateMany(
  { severity: { $in: [null, ''] } },
  [
    {
      $set: {
        severity: {
          $cond: [
            { $regexMatch: { input: { $ifNull: ['$metadata.log_source', ''] }, regex: /critical|alert|emergency/i } },
            'Critical',
            {
              $cond: [
                { $regexMatch: { input: { $ifNull: ['$metadata.log_source', ''] }, regex: /security|intrusion|malware/i } },
                'High',
                {
                  $cond: [
                    { $regexMatch: { input: { $ifNull: ['$metadata.log_source', ''] }, regex: /error|fail|medium/i } },
                    'Medium',
                    'Low'
                  ]
                }
              ]
            }
          ]
        }
      }
    }
  ]
)
```

## How the Fix Works

### Frontend (LogViewer.vue)
- Added loading overlay when filtering
- Shows "Filtering Logs..." message
- Displays debug info in console

### Frontend (searchFiltering.js)
- Normalizes severity filter value before comparison
- Ensures consistent matching

### Backend (logs.js & stats.js)
- Updated severity assignment to check multiple fields
- Includes Critical severity pattern
- Falls back to existing severity field if populated

## Severity Assignment Rules

The backend now assigns severity based on these patterns (in order):

1. **Critical**: `critical|alert|emergency|severe|attack|breach|malicious`
2. **High**: `security|intrusion|malware|warning|unauthorized|denied|blocked`
3. **Medium**: `error|fail|medium|kernel|exception|timeout`
4. **Low**: Everything else (default)

## Testing

After creating test logs, verify filtering works:

1. **Critical Filter**: Should show 5 logs
2. **High Filter**: Should show 10 logs
3. **Medium Filter**: Should show 15 logs
4. **Low Filter**: Should show 20 logs
5. **All Severities**: Should show 50 logs total

## Troubleshooting

### Still no logs showing?
1. Check browser console for errors
2. Check backend logs for API errors
3. Verify MongoDB is running: `mongosh`
4. Verify logs exist: `db.raw_logs.countDocuments()`

### Logs show but with wrong severity?
1. Run `node scripts/populateSeverity.js` to re-assign severity
2. Or manually update logs in MongoDB

### Loading overlay stuck?
1. Check network tab in browser DevTools
2. Verify backend API is responding
3. Check backend logs for errors

## Files Modified

- `src/pages/LogViewer.vue` - Added loading overlay
- `src/utils/searchFiltering.js` - Fixed severity normalization
- `backend/routes/logs.js` - Updated severity assignment (3 places)
- `backend/routes/stats.js` - Updated severity assignment (3 places)
- `backend/scripts/createTestLogs.js` - NEW: Create test logs
- `backend/scripts/populateSeverity.js` - NEW: Populate existing logs

## Next Steps

1. Start MongoDB
2. Run `node scripts/createTestLogs.js`
3. Refresh Log Viewer
4. Test filtering by severity
5. Verify all severities show logs correctly
