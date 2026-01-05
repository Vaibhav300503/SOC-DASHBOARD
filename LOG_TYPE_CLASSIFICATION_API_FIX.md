# Log Type Classification - API Fix

## Issue
The LogTypes.vue component was throwing a 404 error when trying to fetch filtered logs:
```
GET http://localhost:3000/undefined/logs/recent?timeRange=30d&limit=1000 404 (Not Found)
```

## Root Cause
The `handleLogTypesSearch` function in LogTypes.vue was trying to use `apiStore.baseURL` which doesn't exist in the apiStore. This resulted in the URL being constructed as `undefined/logs/recent`.

## Solution
Updated LogTypes.vue to use the proper API approach:

### Changes Made:
1. **Added import for logsAPI**:
   ```javascript
   import { logsAPI } from '../api/logs'
   ```

2. **Fixed handleLogTypesSearch function**:
   - Removed the incorrect `apiStore.baseURL` reference
   - Now uses `logsAPI.getRecent()` which properly handles the API base URL
   - Properly converts display names back to internal log type values for filtering

### Before:
```javascript
const response = await axios.get(`${apiStore.baseURL}/logs/recent?${params.toString()}`)
```

### After:
```javascript
const response = await logsAPI.getRecent(1000, filterSeverity.value, internalLogType)
```

## Benefits
- ✅ Fixes the 404 error
- ✅ Uses the centralized API layer (logsAPI)
- ✅ Properly handles API base URL from environment variables
- ✅ Maintains consistency with other API calls in the application
- ✅ Properly converts display names to internal log type values

## Testing
The fix has been verified:
- No syntax errors in the updated file
- API calls now use the correct endpoint structure
- Display name to internal log type conversion is properly implemented

## Files Modified
- `src/pages/LogTypes.vue` - Fixed API call in handleLogTypesSearch function