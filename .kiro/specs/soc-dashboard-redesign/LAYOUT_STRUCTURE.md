# SOC Dashboard Layout Structure

## Visual Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          Browser Window                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────┐  ┌──────────────────────────────────────────────┐   │
│  │              │  │                                              │   │
│  │  SIDEBAR     │  │         MAIN CONTENT AREA                   │   │
│  │  (Fixed)     │  │         (Responsive)                        │   │
│  │              │  │                                              │   │
│  │  z-40        │  │  ┌────────────────────────────────────────┐ │   │
│  │              │  │  │  Top Navigation Bar                    │ │   │
│  │  280px/80px  │  │  │  (Sticky)                              │ │   │
│  │              │  │  └────────────────────────────────────────┘ │   │
│  │              │  │                                              │   │
│  │  • Logo      │  │  ┌────────────────────────────────────────┐ │   │
│  │  • Nav Items │  │  │  Dashboard Content                     │ │   │
│  │  • User Menu │  │  │  • Stat Cards                          │ │   │
│  │              │  │  │  • Charts                              │ │   │
│  │              │  │  │  • Tables                              │ │   │
│  │              │  │  │  • Visualizations                      │ │   │
│  │              │  │  └────────────────────────────────────────┘ │   │
│  │              │  │                                              │   │
│  └──────────────┘  └──────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## Component Hierarchy

```
App.vue (Root)
├── LeftSidebar.vue (Fixed, z-40)
│   ├── Logo Section
│   ├── SidebarNavigation.vue
│   │   ├── Navigation Items (router-link)
│   │   ├── Divider
│   │   └── Tools Section
│   └── User Section
│       ├── User Profile Button
│       └── User Menu Dropdown
│
└── MainContent Wrapper (ml-offset)
    └── MainContent.vue (z-10)
        ├── Top Navigation Bar
        │   ├── Page Title
        │   ├── Notification Center
        │   └── Profile Dropdown
        │
        ├── Main Content Area
        │   └── router-view
        │       └── Dashboard Pages
        │           ├── DashboardNew.vue
        │           ├── GeoAnalytics.vue
        │           ├── IpAnalytics.vue
        │           └── Other Pages
        │
        └── Toast Notifications
```

## CSS Layout Properties

### LeftSidebar.vue
```css
/* Fixed positioning */
position: fixed;
left: 0;
top: 0;
height: 100vh;
z-index: 40;

/* Width transitions */
width: 280px; /* expanded */
width: 80px;  /* collapsed */
transition: width 300ms ease;

/* Styling */
background: linear-gradient(180deg, #0A0B14 0%, #10121E 100%);
border-right: 1px solid rgba(148, 163, 184, 0.3);
```

### MainContent Wrapper (App.vue)
```css
/* Margin offset */
margin-left: 280px; /* expanded */
margin-left: 80px;  /* collapsed */
transition: margin-left 300ms ease;

/* Responsive */
@media (max-width: 768px) {
  margin-left: 80px; /* auto-collapse on mobile */
}
```

### MainContent.vue
```css
/* Full height layout */
min-height: 100vh;
background: radial-gradient(ellipse at top, #1e1b4b 0%, #0f172a 50%, #020617 100%);

/* Sticky top nav */
position: sticky;
top: 0;
z-index: 30;
```

## State Management

### useSidebarStore.js
```javascript
// State
isCollapsed: boolean (default: false)

// Actions
toggleSidebar(): void
setCollapsed(value: boolean): void

// Persistence
localStorage.getItem('sidebarCollapsed')
localStorage.setItem('sidebarCollapsed', value)
```

## Responsive Breakpoints

### Desktop (1024px+)
```
┌──────────────┬──────────────────────────────────┐
│              │                                  │
│   SIDEBAR    │      MAIN CONTENT               │
│   280px      │      Flex: 1                    │
│              │                                  │
└──────────────┴──────────────────────────────────┘
```

### Tablet (768px - 1023px)
```
┌──────────────┬──────────────────────────────────┐
│              │                                  │
│   SIDEBAR    │      MAIN CONTENT               │
│   80px       │      Flex: 1                    │
│   (icons)    │                                  │
└──────────────┴──────────────────────────────────┘
```

### Mobile (< 768px)
```
┌──────────────┬──────────────────────────────────┐
│              │                                  │
│   SIDEBAR    │      MAIN CONTENT               │
│   80px       │      Flex: 1                    │
│   (icons)    │                                  │
└──────────────┴──────────────────────────────────┘
```

## Z-Index Layering

```
z-50  ├─ Toast Notifications
      ├─ Modals/Dialogs
      ├─ Dropdowns
      │
z-40  ├─ LeftSidebar (Fixed)
      │
z-30  ├─ MainContent Top Nav (Sticky)
      │
z-10  ├─ MainContent (Main Area)
      │
z-0   └─ Background
```

## Sidebar States

### Expanded State
```
┌──────────────────────────────────────────────────────┐
│ ┌──────────────┐                                     │
│ │ [SOC Logo]   │                                     │
│ ├──────────────┤                                     │
│ │ 📊 Dashboard │                                     │
│ │ 🌍 Geo       │                                     │
│ │ 🔗 IP        │                                     │
│ │ 📋 Logs      │                                     │
│ │ 🖥️  Endpoints │                                     │
│ │ ⚠️  Severity  │                                     │
│ │ 🔗 Tailscale │                                     │
│ │ 📄 Viewer    │                                     │
│ ├──────────────┤                                     │
│ │ ⚙️  Settings  │                                     │
│ │ ❓ Help      │                                     │
│ ├──────────────┤                                     │
│ │ 👤 User      │                                     │
│ │    Analyst   │                                     │
│ └──────────────┘                                     │
└──────────────────────────────────────────────────────┘
  280px
```

### Collapsed State
```
┌──────────────────────────────────────────────────────┐
│ ┌────┐                                               │
│ │ ◆  │                                               │
│ ├────┤                                               │
│ │ 📊 │ ← Tooltip: Dashboard                          │
│ │ 🌍 │ ← Tooltip: Geo Analytics                      │
│ │ 🔗 │ ← Tooltip: IP Analytics                       │
│ │ 📋 │ ← Tooltip: Log Types                          │
│ │ 🖥️  │ ← Tooltip: Endpoints                         │
│ │ ⚠️  │ ← Tooltip: Severity                          │
│ │ 🔗 │ ← Tooltip: Tailscale                         │
│ │ 📄 │ ← Tooltip: Log Viewer                         │
│ ├────┤                                               │
│ │ ⚙️  │ ← Tooltip: Settings                          │
│ │ ❓ │ ← Tooltip: Help                               │
│ ├────┤                                               │
│ │ 👤 │ ← Tooltip: User Menu                          │
│ └────┘                                               │
└──────────────────────────────────────────────────────┘
  80px
```

## Color Scheme

### Sidebar
```
Background: linear-gradient(180deg, #0A0B14 0%, #10121E 100%)
Border: rgba(148, 163, 184, 0.3)
Text: #F8FAFC (bright)
Hover: rgba(30, 41, 59, 0.5)
Active: rgba(0, 225, 255, 0.1)
```

### Navigation Items
```
Default:
  Text: #94A3B8 (slate-400)
  Background: transparent
  Border: transparent

Hover:
  Text: #E2E8F0 (slate-200)
  Background: rgba(30, 41, 59, 0.5)
  Border: transparent

Active:
  Text: #00E1FF (cyan-400)
  Background: rgba(0, 225, 255, 0.1)
  Border: 1px solid rgba(0, 225, 255, 0.3)
  Shadow: 0 0 15px rgba(0, 225, 255, 0.1)
```

### Main Content
```
Background: radial-gradient(ellipse at top, #1e1b4b 0%, #0f172a 50%, #020617 100%)
Cards: rgba(15, 23, 42, 0.4)
Text: #F8FAFC (bright)
Accents: #00E1FF (cyan) / #A855F7 (purple)
```

## Animation Timings

```
Sidebar Collapse/Expand: 300ms ease
Card Hover: 300ms ease
Navigation Highlight: 200ms ease
Page Transition: 300ms ease
Loading Animation: 2s infinite
Glow Effect: 2s ease-in-out infinite
```

## Accessibility Features

### Keyboard Navigation
- Tab: Navigate through sidebar items
- Enter/Space: Activate navigation items
- Escape: Close dropdowns
- Arrow Keys: Navigate menu items (optional)

### Focus Management
- Clear focus indicators on all interactive elements
- Logical tab order through sidebar
- Focus trap in modals/dropdowns

### Screen Reader Support
- Semantic HTML structure
- ARIA labels on icon-only buttons
- Role attributes on custom components
- Live regions for notifications

### Color Contrast
- Text on background: WCAG AA compliant
- Interactive elements: Minimum 4.5:1 ratio
- Borders and dividers: Sufficient contrast

## Performance Considerations

### Rendering
- Fixed sidebar prevents layout recalculation
- CSS transitions for smooth animations
- Minimal re-renders with Pinia store
- Virtual scrolling for large lists

### Memory
- localStorage for state persistence
- Proper cleanup of event listeners
- Debounced updates for real-time data
- Lazy loading for components

### Network
- Optimized bundle size
- Lazy route loading
- Efficient API calls
- Caching strategies

## Browser Compatibility

### Supported Features
- CSS Grid and Flexbox
- CSS Custom Properties
- Backdrop Filter
- CSS Transitions
- ES6+ JavaScript

### Browser Support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Troubleshooting

### Sidebar Overlapping Content
**Solution**: Ensure MainContent wrapper has proper margin-left offset
```vue
<div :class="[
  'transition-all duration-sidebar',
  sidebarStore.isCollapsed ? 'ml-sidebar-collapsed' : 'ml-sidebar-expanded'
]">
```

### Sidebar Not Collapsing
**Solution**: Check useSidebarStore is properly imported and used
```javascript
import { useSidebarStore } from '../../stores/sidebarStore'
const sidebarStore = useSidebarStore()
```

### State Not Persisting
**Solution**: Verify localStorage is enabled and sidebarStore is initializing correctly
```javascript
if (typeof window !== 'undefined') {
  const saved = localStorage.getItem('sidebarCollapsed')
  if (saved !== null) {
    isCollapsed.value = saved === 'true'
  }
}
```

### Animations Not Smooth
**Solution**: Check CSS transitions are applied and browser supports them
```css
transition: all 300ms ease;
```

---

**Last Updated**: January 3, 2026
**Version**: 1.0
**Status**: Complete
