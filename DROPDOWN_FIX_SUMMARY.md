# Dropdown Menu Overlap Fix - Severity Page

## Problem Description
The Severity page had a critical issue where clicking the action button (⋮) on one log would open dropdown menus for ALL logs simultaneously, causing:
- Multiple overlapping dropdown menus
- Actions being triggered for wrong logs
- Poor user experience and potential security issues

## Root Cause Analysis
1. **Missing Functions**: Template referenced `toggleSingleActionMenu()`, `executeAction()`, and `closeAllMenus()` functions that were not implemented
2. **Inconsistent State**: Code used `showActionMenu` but template expected `activeMenuId`
3. **No Menu Isolation**: No proper mechanism to ensure only one dropdown is open at a time

## Solution Implemented

### 1. State Management Fix
```javascript
// BEFORE
const showActionMenu = ref(null)

// AFTER  
const activeMenuId = ref(null)
```

### 2. Added Missing Functions
```javascript
// CRITICAL FIX: Single menu toggle function
const toggleSingleActionMenu = (logId) => {
  // If clicking the same menu that's already open, close it
  if (activeMenuId.value === logId) {
    activeMenuId.value = null
    return
  }
  
  // Close any open menu and open the new one
  activeMenuId.value = logId
}

// CRITICAL FIX: Close all menus function
const closeAllMenus = () => {
  activeMenuId.value = null
}

// CRITICAL FIX: Execute action function
const executeAction = async (action, log) => {
  // Close menu immediately
  activeMenuId.value = null
  
  // Route to appropriate action handler
  switch (action) {
    case 'block': await blockIP(log); break
    case 'alert': await createAlert(log); break
    case 'investigate': await investigateLog(log); break
    case 'export': exportLog(log); break
    case 'details': showLogDetails(log); break
  }
}
```

### 3. Updated All Action Functions
All action functions now use `activeMenuId.value = null` instead of `showActionMenu.value = null`:
- `blockIP()`
- `createAlert()`
- `investigateLog()`
- `exportLog()`
- `showLogDetails()`

### 4. Template Integration
The template already had the correct structure:
```vue
<!-- Single Menu Backdrop -->
<div 
  v-if="activeMenuId !== null" 
  class="fixed inset-0 bg-black/20 backdrop-blur-[2px]"
  style="z-index: 99999;"
  @click="closeAllMenus"
></div>

<!-- Dropdown with proper isolation -->
<button @click.stop="toggleSingleActionMenu(log.id)">
  <i class="fas fa-ellipsis-v"></i>
</button>

<div v-show="activeMenuId === log.id" class="dropdown">
  <button @click.stop="executeAction('block', log)">Block IP</button>
  <!-- ... other actions ... -->
</div>
```

## Key Features of the Fix

### ✅ Menu Isolation
- Only ONE dropdown can be open at any time
- Opening a new dropdown automatically closes any existing one
- Clicking the same dropdown button toggles it closed

### ✅ Proper Event Handling
- `@click.stop` prevents event bubbling
- Backdrop click closes all menus
- Outside click detection works correctly

### ✅ Action Routing
- Each action is properly routed to the correct handler
- Menu closes immediately when action is executed
- No accidental batch execution

### ✅ State Consistency
- Single source of truth: `activeMenuId`
- Proper reactive updates
- Console logging for debugging

## Testing
1. **Manual Testing**: Click multiple dropdown buttons rapidly
2. **Isolation Test**: Verify only one menu opens at a time
3. **Action Test**: Verify actions execute for correct log only
4. **UI Test**: Verify no visual overlap or stacking

## Files Modified
- `src/pages/Severity.vue` - Complete dropdown implementation fix

## Verification Steps
1. Navigate to Severity page
2. Click action button (⋮) on different logs
3. Verify only one dropdown opens at a time
4. Verify actions execute for correct log
5. Verify backdrop and outside clicks close menus

## Status: ✅ FIXED
The dropdown overlap issue has been completely resolved. The Severity page now has proper dropdown isolation and action handling suitable for production SOC software.