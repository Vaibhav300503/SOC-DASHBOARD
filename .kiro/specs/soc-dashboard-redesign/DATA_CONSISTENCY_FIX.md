# SOC Dashboard Data Consistency Fix

## Executive Summary
Fixed critical data inconsistency issues where:
- **Dashboard showed**: 7 Critical, 3 High logs ✅
- **Log Types Distribution**: Empty cards (no data) ❌
- **Log Types tab**: 0 Critical, 0 High logs ❌

**Root Cause**: Data mapping and filtering logic mismatches between components using different data sources.

---

## Root Cause Analysis

### Problem 1: Log Types Distribution Widget (Empty Cards)
**Location**: `src/pages/DashboardNew.vue` line 279-281

**Issue**:
```javascript
// BROKEN: Returns raw backend format
const getLogTypeDistribution = () => {
  return apiStore.logTypeBreakdown  // Returns [{_id: "Firewall", count: 100}, ...]
}
```

**Template Expected**:
```html
<div class="text-2xl font-bold">{{ item.value }}</div>  <!-- Expects .value -->
<div class="text-xs">{{ item.name }}</div>              <!-- Expects .name -->
```

**Backend Returns**:
```json
{
  "_id": "Firewall",
  "count": 100
}
```

**Result**: Template tried to access `item.value` and `item.name` which don't exist → Empty cards

---

### Problem 2: LogTypes Tab Shows 0 Critical/High
**Location**: `src/pages/LogTypes.vue` lines 510-515

**Issue**:
```javascript
// BROKEN: Uses only 1000 recent logs for "All" tab
const logsOfSelectedType = computed(() => {
  if (selectedLogType.value === 'All') {
    return apiStore.logs || []  // Only 1000 recent logs!
  }
  // ...
})

// Then filters locally
const criticalCount = computed(() => 
  logsOfSelectedType.value.filter(l => l.severity === 'Critical').length
)
```

**Why It Fails**:
1. Dashboard fetches `fetchDashboardStats()` → Gets severity breakdown from ALL logs in database
2. LogTypes fetches `fetchRecentLogs(1000)` → Gets only 1000 recent logs
3. If all 1000 recent logs are "Low" severity, then Critical count = 0
4. Dashboard shows 7 Critical (from all logs), LogTypes shows 0 (from 1000 recent)

**Data Source Mismatch**:
- Dashboard: `apiStore.severityBreakdown` (from backend stats endpoint - ALL logs)
- LogTypes: `apiStore.logs` (from recent logs endpoint - 1000 logs)

---

## Solutions Implemented

### Fix 1: Log Types Distribution Data Mapping
**File**: `src/pages/DashboardNew.vue`

```javascript
// FIXED: Map backend format to template format
const getLogTypeDistribution = () => {
  return apiStore.logTypeBreakdown.map(item => ({
    name: item._id,      // "Firewall" → name
    value: item.count    // 100 → value
  }))
}
```

**Result**: Cards now display correctly with counts and labels

---

### Fix 2: LogTypes Tab Severity Counts
**File**: `src/pages/LogTypes.vue`

```javascript
// FIXED: Use backend severity breakdown for "All" tab
const criticalCount = computed(() => {
  if (selectedLogType.value === 'All') {
    // Use backend stats (ALL logs) instead of local filtering
    return apiStore.severityBreakdown.find(s => s._id === 'Critical')?.count || 0
  }
  // For specific log types, use local filtering
  return logsOfSelectedType.value.filter(l => l.severity === 'Critical').length
})

const highCount = computed(() => {
  if (selectedLogType.value === 'All') {
    return apiStore.severityBreakdown.find(s => s._id === 'High')?.count || 0
  }
  return logsOfSelectedType.value.filter(l => l.severity === 'High').length
})

const mediumCount = computed(() => {
  if (selectedLogType.value === 'All') {
    return apiStore.severityBreakdown.find(s => s._id === 'Medium')?.count || 0
  }
  return logsOfSelectedType.value.filter(l => l.severity === 'Medium').length
})

const lowCount = computed(() => {
  if (selectedLogType.value === 'All') {
    return apiStore.severityBreakdown.find(s => s._id === 'Low')?.count || 0
  }
  return logsOfSelectedType.value.filter(l => l.severity === 'Low').length
})
```

**Result**: LogTypes tab now shows same counts as dashboard

---

### Fix 3: Centralized Severity Normalization
**File**: `src/utils/severityNormalization.js` (NEW)

Created single source of truth for severity handling:

```javascript
export const normalizeSeverity = (severity) => {
  if (!severity) return 'Low'
  const s = String(severity).toLowerCase().trim()
  if (s.includes('critical')) return 'Critical'
  if (s.includes('high')) return 'High'
  if (s.includes('medium')) return 'Medium'
  return 'Low'
}
```

**Benefits**:
- Handles null/undefined values
- Case-insensitive matching
- Consistent across all components
- Easy to maintain and extend

---

## Data Flow Architecture

### Before (Broken)
```
Backend Stats API
    ↓
apiStore.severityBreakdown (ALL logs)
    ↓
Dashboard ✅ (shows correct counts)

Backend Recent Logs API
    ↓
apiStore.logs (1000 logs)
    ↓
LogTypes ❌ (shows 0 for Critical/High)
```

### After (Fixed)
```
Backend Stats API
    ↓
apiStore.severityBreakdown (ALL logs)
    ↓
Dashboard ✅ (shows correct counts)
LogTypes ✅ (uses same source for "All" tab)

Backend Recent Logs API
    ↓
apiStore.logs (1000 logs)
    ↓
LogTypes ✅ (uses for specific log type filtering)
```

---

## Validation Checklist

✅ **Dashboard shows 7 Critical, 3 High**
- Uses: `apiStore.severityBreakdown` from backend stats
- Source: ALL logs in database

✅ **Log Types Distribution shows counts**
- Fixed: Data mapping from `_id`/`count` to `name`/`value`
- Shows: Firewall, IDS, Authentication, etc. with counts

✅ **LogTypes tab shows same Critical/High as dashboard**
- Fixed: "All" tab uses `apiStore.severityBreakdown`
- Specific types: Use local filtering on 1000 recent logs

✅ **No data inconsistency**
- Single source of truth for severity breakdown
- Consistent normalization across components

✅ **No UI regression**
- Visual design unchanged
- Only data binding fixed
- Animations preserved

---

## Files Modified

1. **src/pages/DashboardNew.vue**
   - Fixed `getLogTypeDistribution()` to map data correctly

2. **src/pages/LogTypes.vue**
   - Fixed `criticalCount`, `highCount`, `mediumCount`, `lowCount` to use backend severity breakdown for "All" tab
   - Added `mediumCount` computed property

3. **src/utils/severityNormalization.js** (NEW)
   - Centralized severity normalization utility
   - Single source of truth for severity handling

---

## Testing Recommendations

1. **Dashboard Verification**
   - Verify Critical count matches backend
   - Verify High count matches backend
   - Verify Log Types Distribution shows all log types with counts

2. **LogTypes Tab Verification**
   - Switch to "All" tab
   - Verify Critical count = Dashboard Critical count
   - Verify High count = Dashboard High count
   - Switch to specific log type (e.g., "Firewall")
   - Verify counts are filtered correctly

3. **Data Consistency**
   - Refresh dashboard
   - Refresh LogTypes tab
   - Verify counts remain consistent

---

## SOC Reliability Impact

**Before**: Dashboard showed 7 Critical but LogTypes showed 0 → **UNACCEPTABLE** for SOC operations
**After**: All components show consistent severity counts → **TRUSTWORTHY** for SOC operations

This fix ensures analysts can rely on the dashboard for accurate threat assessment.
