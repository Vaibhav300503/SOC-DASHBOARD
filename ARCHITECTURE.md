# SOC Dashboard - Architecture Documentation

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Vue.js 3 Frontend                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           Navigation & Routing (Vue Router)          │   │
│  └──────────────────────────────────────────────────────┘   │
│                          ↓                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Pages (Dashboard, Analytics, Tailscale, etc.)      │   │
│  └──────────────────────────────────────────────────────┘   │
│                          ↓                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Reusable Components (GeoMap, Charts, Tables)       │   │
│  └──────────────────────────────────────────────────────┘   │
│                          ↓                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  State Management (Pinia Store)                      │   │
│  └──────────────────────────────────────────────────────┘   │
│                          ↓                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Service Layer (API Calls, Data Fetching)           │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                  Backend Services                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   MongoDB    │  │  Tailscale   │  │  WebSocket   │      │
│  │   (Logs)     │  │   (Network)  │  │  (Real-time) │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

## Component Hierarchy

```
App.vue (Root)
├── Navigation Bar
└── Router View
    ├── Dashboard.vue
    │   ├── GeoMap.vue
    │   ├── SeverityChart.vue
    │   ├── IpTable.vue (x2)
    │   └── TailscaleStats.vue
    │
    ├── GeoAnalytics.vue
    │   ├── GeoMap.vue
    │   └── (Tables & Charts)
    │
    ├── IpAnalytics.vue
    │   ├── IpTable.vue
    │   └── (Charts)
    │
    ├── LogTypes.vue
    │   └── (Tables & Filters)
    │
    ├── Endpoints.vue
    │   ├── EndpointTimeline.vue
    │   └── (Tables)
    │
    ├── Severity.vue
    │   └── (Tables & Charts)
    │
    ├── Tailscale.vue
    │   ├── TailscaleStats.vue
    │   └── (Tables & Events)
    │
    └── LogViewer.vue
        └── JsonViewer.vue
```

## Data Flow

### 1. Initial Load
```
App Mount
  ↓
Router Ready
  ↓
Page Component Mount
  ↓
logStore.initializeLogs()
  ↓
Generate Mock Data / Fetch from API
  ↓
Computed Properties Update
  ↓
Components Re-render
```

### 2. User Interaction
```
User Input (Search, Filter, etc.)
  ↓
Component State Update
  ↓
Computed Properties Recalculate
  ↓
Template Re-render
  ↓
UI Updates
```

### 3. Real-time Updates
```
WebSocket Connection
  ↓
Receive New Log Event
  ↓
logStore.addLog(newLog)
  ↓
Computed Properties Update
  ↓
All Subscribed Components Re-render
```

## State Management (Pinia)

### logStore Structure
```javascript
{
  // State
  logs: [],                    // All logs
  tailscaleLogs: [],          // Tailscale-specific logs
  
  // Computed (Getters)
  totalLogs,                  // Total log count
  criticalCount,              // Critical severity count
  severityDistribution,       // Severity breakdown
  logTypeDistribution,        // Log type breakdown
  topSourceIPs,               // Top 10 source IPs
  topDestinationIPs,          // Top 10 dest IPs
  geoHeatmap,                 // Geographic data
  
  // Actions
  initializeLogs(),           // Load initial data
  addLog(log),                // Add single log
  updateLogs(logs),           // Batch update
  clearLogs(),                // Reset state
}
```

## Service Layer

### logService
- `fetchLogs(filters)` - Get logs with optional filters
- `fetchLogsBySeverity(severity)` - Filter by severity
- `fetchLogsByType(logType)` - Filter by log type
- `fetchLogsByIP(ip, timeRange)` - IP-specific logs
- `fetchLogsByEndpoint(endpoint, timeRange)` - Endpoint logs
- `searchLogs(query, regex)` - Advanced search

### tailscaleService
- `fetchTailscaleLogs(filters)` - Get Tailscale logs
- `fetchDevices()` - List connected devices
- `fetchUserSessions()` - Active user sessions
- `fetchPeerConnections()` - Peer-to-peer connections
- `streamEvents(callback)` - Real-time event stream

## Styling Architecture

### TailwindCSS Layers

```css
@layer base {
  /* Global styles */
  body { }
  * { }
}

@layer components {
  /* Reusable component classes */
  .card-glass { }
  .btn-cyber { }
  .input-cyber { }
  .badge-critical { }
  .stat-card { }
  .table-cyber { }
}

@layer utilities {
  /* Custom utilities */
  .animate-pulse-glow { }
  .shadow-glow { }
}
```

### Color System

**Primary Colors**
- Cyber Blue: #5b6dff (Main accent)
- Neon Purple: #b026ff (Secondary)

**Semantic Colors**
- Critical: #ff0055 (Red)
- High: #ff6b35 (Orange)
- Medium: #ffd700 (Yellow)
- Low: #00ff88 (Green)

**Backgrounds**
- Dark 900: #0f172a
- Dark 800: #1e293b
- Dark 700: #334155

## Performance Considerations

### Optimization Strategies

1. **Lazy Loading**
   - Route-based code splitting
   - Component-level lazy loading

2. **Computed Properties**
   - Cached calculations
   - Reactive dependency tracking
   - Automatic memoization

3. **List Rendering**
   - Key-based rendering
   - Virtual scrolling for large lists
   - Pagination support

4. **CSS Optimization**
   - TailwindCSS purging
   - Minimal custom CSS
   - CSS-in-JS where needed

### Bundle Size
- Vue 3: ~34KB (gzipped)
- TailwindCSS: ~15KB (purged)
- Pinia: ~6KB (gzipped)
- Total: ~55KB (estimated)

## Security Architecture

### Input Validation
```javascript
// All user inputs validated before use
const validateIP = (ip) => {
  const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/
  return ipRegex.test(ip)
}
```

### XSS Protection
- Vue's automatic template escaping
- No v-html on user input
- Sanitized JSON display

### CSRF Protection
- Token-based requests
- Same-origin policy
- Secure cookie handling

## Scalability Considerations

### Handling Large Datasets
1. **Pagination**: Implemented in LogViewer
2. **Virtual Scrolling**: For large tables
3. **Filtering**: Reduce dataset before rendering
4. **Lazy Loading**: Load data on demand

### Real-time Scaling
1. **WebSocket Connections**: For live updates
2. **Event Batching**: Group updates
3. **Debouncing**: Limit update frequency
4. **Connection Pooling**: Reuse connections

## Testing Strategy

### Unit Tests
- Store actions and getters
- Component logic
- Service functions

### Integration Tests
- Component interactions
- Store updates
- Service integration

### E2E Tests
- User workflows
- Navigation
- Data persistence

## Deployment Architecture

### Development
```
npm run dev
↓
Vite Dev Server (localhost:3000)
↓
Hot Module Replacement
```

### Production Build
```
npm run build
↓
Vite Build Process
↓
Minified & Optimized dist/
↓
Deploy to CDN/Server
```

### Docker Deployment
```
Dockerfile
↓
Build Image
↓
Run Container
↓
Expose Port 3000
```

## Future Enhancements

1. **Advanced Analytics**
   - Machine learning anomaly detection
   - Predictive threat analysis
   - Behavioral analytics

2. **Enhanced Visualizations**
   - 3D threat maps
   - Network topology diagrams
   - Real-time flow visualization

3. **Integration Expansion**
   - Splunk integration
   - ELK stack support
   - SIEM connectors

4. **Performance**
   - GraphQL API
   - Server-side rendering
   - Progressive Web App

5. **Collaboration**
   - Multi-user support
   - Real-time collaboration
   - Alert sharing

---

**Last Updated**: January 2024
**Version**: 1.0.0
