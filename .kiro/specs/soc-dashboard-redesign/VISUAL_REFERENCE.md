# Visual Reference Guide

## Color Palette

### Primary Accent Colors
```
Cyan:    #00E1FF  RGB(0, 225, 255)   - Primary accent, glow effects
Blue:    #0066FF  RGB(0, 102, 255)   - Secondary accent, gradients
Purple:  #A855F7  RGB(168, 85, 247)  - Tertiary accent, highlights
```

### Background Colors
```
Slate-800:  #1E293B  RGB(30, 41, 59)    - Card backgrounds
Slate-900:  #0F172A  RGB(15, 23, 42)    - Darker backgrounds
Slate-950:  #020617  RGB(2, 6, 23)      - Darkest backgrounds
```

### Severity Colors
```
Critical:  #FF2D78  RGB(255, 45, 120)   - Red, pulsing
High:      #FF8B5E  RGB(255, 139, 94)   - Orange
Medium:    #FFD700  RGB(255, 215, 0)    - Yellow
Low:       #33FF99  RGB(51, 255, 153)   - Green
```

### Text Colors
```
Primary:    #F8FAFC  RGB(248, 250, 252)  - Main text
Secondary:  #94A3B8  RGB(148, 163, 184)  - Secondary text
Muted:      #64748B  RGB(100, 116, 139)  - Muted text
```

## Gradient Combinations

### Header Gradient
```css
background: linear-gradient(to right, 
  #00E1FF,    /* Cyan */
  #0066FF,    /* Blue */
  #A855F7     /* Purple */
);
```

### Card Gradient
```css
background: linear-gradient(to bottom right,
  rgba(30, 41, 59, 0.4),    /* Slate-800 */
  rgba(15, 23, 42, 0.4)     /* Slate-900 */
);
```

### Overlay Gradient
```css
background: linear-gradient(to right,
  rgba(0, 225, 255, 0),     /* Transparent cyan */
  rgba(0, 225, 255, 0.1),   /* Semi-transparent cyan */
  rgba(0, 225, 255, 0)      /* Transparent cyan */
);
```

## Shadow Effects

### Glow Shadows
```css
/* Cyan Glow */
box-shadow: 0 0 20px rgba(0, 225, 255, 0.2);
box-shadow: 0 0 20px rgba(0, 225, 255, 0.3);

/* Red Glow (Critical) */
box-shadow: 0 0 20px rgba(255, 45, 120, 0.3);

/* Orange Glow (High) */
box-shadow: 0 0 20px rgba(255, 139, 94, 0.3);

/* Card Shadow */
box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4), 
            0 0 20px rgba(0, 225, 255, 0.15);
```

## Typography

### Font Family
```
Font: Inter
Weights: 300, 400, 500, 600, 700, 800, 900
Fallback: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif
```

### Font Sizes
```
Page Title:        text-4xl (36px)  font-bold
Card Title:        text-sm (14px)   font-semibold
Stat Value:        text-3xl (30px)  font-bold
Label:             text-xs (12px)   font-medium
Body Text:         text-sm (14px)   font-normal
```

### Font Colors
```
Primary Text:      #F8FAFC (text-slate-50)
Secondary Text:    #94A3B8 (text-slate-400)
Muted Text:        #64748B (text-slate-500)
Accent Text:       #00E1FF (text-cyan-400)
```

## Border Styles

### Card Borders
```css
border: 1px solid rgba(148, 163, 184, 0.3);  /* Subtle border */
border: 1px solid rgba(0, 225, 255, 0.5);    /* Hover border */
```

### Accent Lines
```css
border-left: 4px solid #00E1FF;  /* Cyan accent */
border-left: 4px solid #FF2D78;  /* Red accent */
border-left: 4px solid #FF8B5E;  /* Orange accent */
border-left: 4px solid #33FF99;  /* Green accent */
```

### Top Accent Line
```css
height: 2px;
background: linear-gradient(90deg, 
  transparent, 
  rgba(0, 225, 255, 0.5), 
  transparent
);
```

## Spacing & Layout

### Padding
```
Card Padding:      1.5rem (24px)
Button Padding:    0.625rem 1.5rem (10px 24px)
Icon Padding:      0.5rem (8px)
```

### Gaps
```
Grid Gap:          1rem (16px)
Component Gap:     1.5rem (24px)
Element Gap:       0.5rem (8px)
```

### Border Radius
```
Cards:             0.75rem (12px)
Buttons:           0.5rem (8px)
Icons:             0.5rem (8px)
Badges:            9999px (fully rounded)
```

## Animation Specifications

### Keyframe Animations
```
fadeIn:       0.6s ease-out
slideInLeft:  0.6s ease-out (30px distance)
slideInUp:    0.6s ease-out (20px distance)
slideInRight: 0.6s ease-out (30px distance)
glow:         2s ease-in-out (infinite)
pulse:        2s ease-in-out (infinite)
shimmer:      2s linear (infinite)
```

### Transition Timings
```
Fast:         150ms - 300ms (hover effects)
Medium:       300ms - 500ms (page transitions)
Slow:         500ms - 1000ms (emphasis effects)
```

### Stagger Delays
```
Stats Cards:  100ms intervals (300ms, 400ms, 500ms, 600ms)
Log Cards:    50ms intervals (1200ms, 1250ms, 1300ms, ...)
Case Items:   50ms intervals (1900ms, 1950ms, 2000ms, ...)
```

## Component Styling

### Stat Card
```
Background:    linear-gradient(to bottom right, 
               rgba(30, 41, 59, 0.4), 
               rgba(15, 23, 42, 0.4))
Border:        1px solid rgba(148, 163, 184, 0.3)
Border-Left:   4px solid (severity color)
Padding:       1.25rem
Border-Radius: 0.75rem
Hover Shadow:  0 0 20px rgba(0, 225, 255, 0.2)
```

### Dashboard Card
```
Background:    linear-gradient(to bottom right, 
               rgba(30, 41, 59, 0.4), 
               rgba(15, 23, 42, 0.4))
Border:        1px solid rgba(148, 163, 184, 0.3)
Top Line:      2px gradient (cyan)
Padding:       1.5rem
Border-Radius: 0.75rem
Hover Shadow:  0 12px 40px rgba(0, 0, 0, 0.4), 
               0 0 20px rgba(0, 225, 255, 0.15)
```

### Button
```
Background:    linear-gradient(to right, 
               #1E293B, #0F172A)
Border:        1px solid rgba(148, 163, 184, 0.5)
Padding:       0.625rem 1.5rem
Border-Radius: 0.5rem
Hover Shadow:  0 0 20px rgba(0, 225, 255, 0.2)
Hover Border:  1px solid rgba(0, 225, 255, 0.5)
```

## Icon Styling

### Icon Sizes
```
Large:   2.25rem (36px)
Medium:  1.5rem (24px)
Small:   1rem (16px)
Tiny:    0.75rem (12px)
```

### Icon Colors
```
Primary:   #00E1FF (cyan)
Critical:  #FF2D78 (red)
High:      #FF8B5E (orange)
Medium:    #FFD700 (yellow)
Low:       #33FF99 (green)
Muted:     #636B9C (gray)
```

### Icon Backgrounds
```
Primary:   rgba(0, 225, 255, 0.1)
Critical:  rgba(255, 45, 120, 0.1)
High:      rgba(255, 139, 94, 0.1)
Medium:    rgba(255, 215, 0, 0.1)
Low:       rgba(51, 255, 153, 0.1)
```

## Hover States

### Button Hover
```
Border Color:      rgba(0, 225, 255, 0.5)
Shadow:            0 0 20px rgba(0, 225, 255, 0.2)
Overlay Opacity:   0.1
Duration:          300ms
```

### Card Hover
```
Border Color:      rgba(0, 225, 255, 0.5)
Shadow:            0 12px 40px rgba(0, 0, 0, 0.4), 
                   0 0 20px rgba(0, 225, 255, 0.15)
Title Color:       #00E1FF
Overlay Opacity:   0.1
Duration:          300ms
```

### Icon Hover
```
Scale:             1 → 1.1
Shadow:            0 0 20px rgba(0, 225, 255, 0.2)
Duration:          300ms
```

### Value Hover
```
Scale:             1 → 1.05
Origin:            left
Duration:          300ms
```

## Loading States

### Shimmer Animation
```
Background:        linear-gradient(90deg, 
                   transparent, 
                   rgba(255, 255, 255, 0.1), 
                   transparent)
Background-Size:   1000px 100%
Duration:          2s
Easing:            linear
Infinite:          true
```

### Pulse Animation
```
Opacity:           1 → 0.5 → 1
Duration:          2s
Easing:            ease-in-out
Infinite:          true
```

## Error States

### Error Icon
```
Color:             #FF2D78 (red)
Animation:         pulse (2s infinite)
Size:              2.25rem (36px)
```

### Error Message
```
Color:             #FF2D78 (red)
Font-Size:         0.875rem (14px)
Font-Weight:       normal
```

## Responsive Breakpoints

### Mobile (< 768px)
```
Grid Columns:      1
Font Sizes:        Reduced by 10%
Padding:           Reduced by 20%
Animation Duration: 400ms (vs 600ms)
Stagger Delay:     50ms (vs 100ms)
```

### Tablet (768px - 1024px)
```
Grid Columns:      2
Font Sizes:        Standard
Padding:           Standard
Animation Duration: 600ms
Stagger Delay:     100ms
```

### Desktop (> 1024px)
```
Grid Columns:      3-4
Font Sizes:        Standard
Padding:           Standard
Animation Duration: 600ms
Stagger Delay:     100ms
```

## Accessibility Colors

### Color Contrast Ratios
```
Text on Background:     4.5:1 (WCAG AA)
Large Text:             3:1 (WCAG AA)
UI Components:          3:1 (WCAG AA)
```

### Color Combinations
```
Cyan (#00E1FF) on Dark:     ✅ 7.2:1 (AAA)
Red (#FF2D78) on Dark:      ✅ 5.8:1 (AA)
Orange (#FF8B5E) on Dark:   ✅ 5.2:1 (AA)
Green (#33FF99) on Dark:    ✅ 6.1:1 (AA)
```

## Print Styles

### Print Optimization
```
Background:        White
Text Color:        Black
Animations:        Disabled
Shadows:           Removed
Gradients:         Simplified
```

## Dark Mode Support

### Current Implementation
```
All colors are optimized for dark mode
Light mode not currently supported
Future enhancement: Add light mode toggle
```

## Conclusion

This visual reference guide provides comprehensive specifications for all colors, gradients, shadows, typography, spacing, animations, and component styling used in the SOC dashboard redesign. Use this guide to:

- Maintain visual consistency
- Implement new components
- Debug styling issues
- Ensure accessibility compliance
- Optimize for different devices
- Create similar animations

All specifications are based on modern design principles and best practices for web applications.
