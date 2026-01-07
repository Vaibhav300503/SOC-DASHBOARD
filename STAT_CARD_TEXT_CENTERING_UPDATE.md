# Stat Card Text Centering Update

## Summary
Updated all stat cards across the application to center the text content for better visual alignment and consistency.

## Changes Made

### 1. CSS Updates (`src/style.css`)
Added new styling rules for stat-card text alignment:

```css
/* Stat Card Text Alignment - Center or Slightly Left */
.stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.stat-card .stat-value {
  text-align: center;
}

.stat-card .stat-label {
  text-align: center;
}
```

### 2. StatCard Component Updates (`src/components/common/StatCard.vue`)

#### Header Section
- Changed from `flex items-start justify-between` to `flex flex-col items-center justify-center`
- Added `text-center w-full` for full-width centered text
- Moved icon below label with `mt-2` spacing
- Icon now displays below the label instead of to the right

#### Value Section
- Added `text-center w-full` wrapper
- Changed `origin-left` to `origin-center` for proper scaling
- Centered the value display

#### Change Indicator
- Changed from `flex items-center gap-1` to `flex items-center justify-center gap-1`
- Now centers the change indicator (up/down arrow and percentage)

## Affected Card Types

All stat cards using the following classes are now centered:
- `.stat-card` (base class)
- `.stat-card card-accent-cyan`
- `.stat-card card-accent-red`
- `.stat-card card-accent-orange`
- `.stat-card card-accent-green`
- `.stat-card card-accent-purple`
- `.stat-card card-accent-yellow`

## Pages Affected

All pages using stat cards now display centered text:
1. `src/pages/Dashboard.vue`
2. `src/pages/DashboardNew.vue`
3. `src/pages/DashboardOriginal.vue`
4. `src/pages/Endpoints.vue`
5. `src/pages/IpAnalytics.vue`
6. `src/pages/LogTypes.vue`
7. `src/pages/LogViewer.vue`
8. `src/pages/NetworkTopology.vue`
9. `src/pages/GeoAnalytics.vue`
10. `src/pages/Severity.vue`

## Visual Changes

### Before
- Label and icon on left side
- Value on left side
- Change indicator on left side
- Asymmetrical layout

### After
- Label centered
- Icon centered below label
- Value centered
- Change indicator centered
- Symmetrical, balanced layout

## Example

```html
<!-- Before -->
<div class="stat-card card-accent-red">
  <div class="flex items-start justify-between">
    <div>
      <p>Critical Endpoints</p>
    </div>
    <div class="w-9 h-9"><!-- icon --></div>
  </div>
  <div class="text-3xl font-bold">0</div>
</div>

<!-- After -->
<div class="stat-card card-accent-red">
  <div class="flex flex-col items-center justify-center text-center w-full">
    <div>
      <p>Critical Endpoints</p>
    </div>
    <div class="w-9 h-9 mt-2"><!-- icon --></div>
  </div>
  <div class="text-3xl font-bold text-center w-full">0</div>
</div>
```

## Testing

✅ All stat cards display centered text
✅ Icons display below labels
✅ Values are centered
✅ Change indicators are centered
✅ All card accent colors work correctly
✅ Hover effects still function properly
✅ No layout breaks on responsive sizes

## Files Modified
1. `src/components/common/StatCard.vue` - Component template updates
2. `src/style.css` - CSS styling for stat-card alignment

## Verification
- No diagnostics errors
- All changes applied successfully
- Visual alignment improved across all pages
