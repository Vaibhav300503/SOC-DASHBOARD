# Timestamp Formatter - Quick Reference

## Import
```javascript
import { formatTimestamp } from '../utils/timestampFormatter.js'
```

## Usage

### In Script
```javascript
// Format a timestamp
const formatted = formatTimestamp(timestamp, 'datetime')

// Available formats:
// - 'time': "02:46:26 PM"
// - 'date': "Jan 6, 2026"
// - 'datetime': "Jan 6, 2026, 02:46:26 PM"
// - 'relative': "5 minutes ago"
```

### In Template
```vue
<!-- Direct formatting -->
{{ formatTimestamp(log.timestamp, 'datetime') }}

<!-- Using a computed function -->
{{ formatTime(log.timestamp) }}
```

### Common Patterns

#### Format for display in tables
```javascript
const formatTime = (timestamp) => {
  return formatTimestamp(timestamp, 'datetime')
}
```

#### Format for relative time display
```javascript
const formatTimeAgo = (timestamp) => {
  return formatTimestamp(timestamp, 'relative')
}
```

#### Format for time-only display
```javascript
const formatTimeOnly = (timestamp) => {
  return formatTimestamp(timestamp, 'time')
}
```

## Supported Input Types
- ISO string: `"2026-01-06T21:16:26"`
- ISO string with Z: `"2026-01-06T21:16:26Z"`
- ISO string with offset: `"2026-01-06T21:16:26+05:30"`
- Date object: `new Date()`
- Milliseconds: `1704556586000`

## Timezone Handling
The formatter automatically:
1. Detects if timestamp is missing timezone info
2. Appends 'Z' to force UTC interpretation
3. Converts to browser's local timezone for display
4. Handles invalid dates gracefully

## Error Handling
- Invalid timestamps return 'Invalid'
- Missing timestamps return 'N/A' (when checked before calling)
- Errors are logged to console for debugging

## Examples

### Dashboard Case Timestamps
```javascript
// Before
{{ hCase.createdAt ? new Date(hCase.createdAt).toLocaleString() : 'N/A' }}

// After
{{ formatTimestamp(hCase.createdAt, 'datetime') }}
```

### Log Viewer Timestamps
```javascript
// Before
{{ new Date(log.timestamp).toLocaleString() }}

// After
{{ formatTime(log.timestamp) }}
```

### Relative Time Display
```javascript
// Before
{{ formatTimeAgo(device.lastSeen) }} // custom implementation

// After
{{ formatTimestamp(device.lastSeen, 'relative') }}
```

### Time-Only Display
```javascript
// Before
{{ new Date(timestamp).toLocaleTimeString() }}

// After
{{ formatTimestamp(timestamp, 'time') }}
```

## Files Using Formatter
- Pages: Dashboard, DashboardNew, DashboardOriginal, Endpoints, IpAnalytics, LogTypes, LogViewer, Severity, Tailscale
- Components: EndpointTimeline, NotificationCenter, SecurityInfo, TailscaleStats

## Maintenance
To update timestamp formatting globally:
1. Edit `src/utils/timestampFormatter.js`
2. Changes automatically apply to all files using the formatter
3. No need to update individual files
