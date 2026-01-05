# Gradient Overlay Updates for Black Theme

## Overview
Updated all card hover gradient overlays to be more subtle and optimized for the black color theme. The cyan gradient overlays have been reduced from `via-cyan-500/10` to `via-cyan-500/5` for a more refined appearance.

---

## Changes Made

### 1. **Gradient Overlay Opacity Reduction**
**What Changed**: All gradient overlays on card hover effects have been reduced from 10% opacity to 5% opacity

**Before**:
```html
<div class="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/10 to-cyan-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
```

**After**:
```html
<div class="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/5 to-cyan-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
```

**Reason**: The black theme requires more subtle overlays to maintain visual hierarchy and prevent overwhelming the dark background.

---

## Files Updated

### 1. **src/pages/Tailscale.vue**
- Updated Real-time Stream card gradient overlay
- Changed from `via-cyan-500/10` to `via-cyan-500/5`
- **Location**: Line 197

### 2. **src/pages/LogTypes.vue**
- Updated Load More button gradient overlay
- Updated Modal gradient background overlay (changed to `via-cyan-500/3` for even more subtlety)
- Updated all card gradient overlays (Severity, Action, Timestamp, Registry, Network, Geo, Raw Log Data)
- **Total Updates**: 8 instances
- **Changes**: `via-cyan-500/10` → `via-cyan-500/5`

### 3. **src/pages/DashboardNew.vue**
- Updated Refresh button gradient overlay
- Updated Export button gradient overlay
- Updated Network Topology card gradient overlay
- Updated Severity Distribution card gradient overlay
- Updated KPI card gradient overlays
- **Total Updates**: 5+ instances
- **Changes**: `via-cyan-500/10` → `via-cyan-500/5`

### 4. **src/style.css**
- Added optimized gradient overlay rule for black theme
- New CSS rule for group hover gradient optimization

---

## Gradient Opacity Levels

| Component | Opacity | Usage |
|-----------|---------|-------|
| Card Hover Overlay | 5% | Standard card hover effects |
| Modal Overlay | 3% | Modal background hover |
| Button Overlay | 5% | Button hover effects |
| Accent Line | 50% | Top accent line on modals |

---

## Visual Impact

### Before (Black Theme with 10% Opacity)
- Gradient overlays were too prominent
- Created visual noise on dark backgrounds
- Reduced contrast between cards and content

### After (Black Theme with 5% Opacity)
- Subtle, refined hover effects
- Better visual hierarchy
- Maintains focus on content
- Smoother transitions
- More professional appearance

---

## CSS Rule Added

```css
/* Optimized gradient overlay for black theme */
.group:has(> .absolute.inset-0.bg-gradient-to-r) > .absolute.inset-0.bg-gradient-to-r {
  background: linear-gradient(90deg, transparent, rgba(0, 225, 255, 0.05), transparent) !important;
}
```

This rule ensures all gradient overlays maintain consistent opacity across the application.

---

## Hover Effect Behavior

All updated cards now have:
- **Opacity**: 0 (hidden by default)
- **On Hover**: opacity-100 (fully visible)
- **Transition**: 300ms smooth transition
- **Gradient**: Cyan glow from transparent → 5% opacity → transparent

---

## Testing Recommendations

1. Hover over all cards to verify smooth gradient transitions
2. Check that overlays don't interfere with text readability
3. Verify consistency across all pages (Dashboard, LogTypes, Tailscale)
4. Test on different screen sizes and resolutions
5. Verify performance with multiple cards visible

---

## Notes

- All changes maintain the cyan accent color (#00E1FF) for consistency
- Gradient overlays only appear on hover (opacity-0 by default)
- Transitions are smooth and performant (300ms duration)
- Changes are backward compatible with existing styles
- No breaking changes to component functionality
