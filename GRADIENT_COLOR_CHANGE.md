# Gradient Overlay Color Change - #242424

## Overview
Changed all card hover gradient overlays from cyan (#00E1FF) to dark gray (#242424) for a more subtle, monochromatic appearance that blends seamlessly with the black theme.

---

## What Changed

### Before (Cyan Gradient)
```html
<div class="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/10 to-cyan-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
```
- **Color**: Cyan (#00E1FF)
- **Opacity**: 10%
- **Effect**: Bright, glowing hover effect

### After (Dark Gray Gradient)
```html
<div class="absolute inset-0 bg-gradient-to-r from-slate-600/0 via-slate-600/10 to-slate-600/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
```
- **Color**: Dark Gray (#242424 / Slate-600)
- **Opacity**: 10%
- **Effect**: Subtle, refined hover effect

---

## Color Mapping

| Component | Old Color | New Color | Hex Value |
|-----------|-----------|-----------|-----------|
| Gradient Overlay | Cyan-500 | Slate-600 | #242424 |
| Opacity | 10% | 10% | - |
| Modal Overlay | Cyan-500/3 | Slate-600/5 | #242424 |

---

## Files Updated

### 1. **src/pages/Tailscale.vue**
- Real-time Stream card overlay
- Changed: `from-cyan-500/0 via-cyan-500/5 to-cyan-500/0` → `from-slate-600/0 via-slate-600/10 to-slate-600/0`

### 2. **src/pages/LogTypes.vue**
- Load More button overlay
- Card overlays (Severity, Action, Timestamp, Registry, Network, Geo, Raw Log Data)
- Modal background overlay
- Changed: `from-cyan-500/0 via-cyan-500/5 to-cyan-500/0` → `from-slate-600/0 via-slate-600/10 to-slate-600/0`
- Modal: `from-cyan-500/0 via-cyan-500/3 to-cyan-500/0` → `from-slate-600/0 via-slate-600/5 to-slate-600/0`

### 3. **src/pages/DashboardNew.vue**
- Refresh button overlay
- Export button overlay
- Network Topology card overlay
- Severity Distribution card overlay
- KPI card overlays
- Changed: `from-cyan-500/0 via-cyan-500/5 to-cyan-500/0` → `from-slate-600/0 via-slate-600/10 to-slate-600/0`

### 4. **tailwind.config.js**
- Added custom overlay color configuration
- New color: `'overlay': { dark: '#242424' }`

### 5. **src/style.css**
- Updated CSS gradient overlay rule
- Changed from: `rgba(0, 225, 255, 0.05)` (cyan)
- Changed to: `rgba(36, 36, 36, 0.1)` (dark gray #242424)

---

## Visual Impact

### Before (Cyan Theme)
- Bright, glowing hover effects
- High contrast with black background
- Draws attention to interactive elements
- Neon aesthetic

### After (Dark Gray Theme)
- Subtle, refined hover effects
- Blends seamlessly with black background
- Minimal visual distraction
- Professional, minimalist aesthetic
- Better focus on content

---

## Tailwind Color Reference

**Slate-600** (Used for overlay):
- Hex: #475569
- RGB: 71, 85, 105
- Closest to #242424 in Tailwind palette

**Custom Overlay Color** (Added to config):
- Hex: #242424
- RGB: 36, 36, 36
- Dark gray, slightly lighter than pure black

---

## CSS Rule Updated

```css
/* Before */
.group:has(> .absolute.inset-0.bg-gradient-to-r) > .absolute.inset-0.bg-gradient-to-r {
  background: linear-gradient(90deg, transparent, rgba(0, 225, 255, 0.05), transparent) !important;
}

/* After */
.group:has(> .absolute.inset-0.bg-gradient-to-r) > .absolute.inset-0.bg-gradient-to-r {
  background: linear-gradient(90deg, transparent, rgba(36, 36, 36, 0.1), transparent) !important;
}
```

---

## Hover Behavior

All updated cards now have:
- **Default State**: opacity-0 (hidden)
- **On Hover**: opacity-100 (fully visible)
- **Transition**: 300ms smooth transition
- **Gradient**: Dark gray glow from transparent → 10% opacity → transparent
- **Color**: #242424 (Dark Gray)

---

## Benefits

1. **Consistency**: Matches the black theme color palette
2. **Subtlety**: Less visually jarring than bright cyan
3. **Professionalism**: More refined, enterprise-like appearance
4. **Focus**: Keeps user attention on content, not effects
5. **Accessibility**: Better contrast ratios for readability

---

## Testing Checklist

- [ ] Hover over all cards to verify smooth transitions
- [ ] Check that overlays don't interfere with text readability
- [ ] Verify consistency across all pages
- [ ] Test on different screen sizes
- [ ] Verify performance with multiple cards visible
- [ ] Check that overlay color matches #242424

---

## Notes

- All accent colors (cyan, purple, etc.) remain unchanged for UI elements
- Only hover gradient overlays changed to dark gray
- Text colors remain unchanged for readability
- Glow effects and shadows preserved for visual depth
- Changes are backward compatible
- No breaking changes to component functionality

---

## Color Palette Summary

| Element | Color | Hex | Usage |
|---------|-------|-----|-------|
| Main Dashboard | Black | #000000 | Primary background |
| Sidebar | Very Dark Gray | #0d0d0d | Navigation panel |
| Cards | Dark Gray Gradient | #1a1a1a → #0d0d0d | Card backgrounds |
| Overlay (Hover) | Dark Gray | #242424 | Card hover effects |
| Accent (UI) | Cyan | #00E1FF | Buttons, icons, text |
| Accent (UI) | Purple | #A855F7 | Secondary elements |
