# Live Threat Map - Implementation Guide

## Overview

The Live Threat Map is an enhanced, real-time cyber threat visualization component integrated into the **Geo-Analytics** tab of the SOC Dashboard. It provides real-time global threat detection with live attack flows and a continuous threat ticker.

## Features

### 1. **Real-time Threat Visualization**
- **D3.js-powered world map** with threat markers
- **Color-coded severity levels**: Critical (Red), High (Orange), Medium (Yellow), Low (Cyan)
- **Pulsing animations** for critical threats with visual prominence
- **Responsive design** that adapts to different screen sizes

### 2. **Live Attack Flows**
- **Curved attack paths** showing source-to-destination attack flows
- **Animated attack pulses** indicating active threats
- **Flow filtering** to toggle attack visualization
- **Real-time updates** every 5 seconds

### 3. **Live Threat Ticker**
- **Scrolling threat feed** at the top-left of the map
- **Color-coded threat severity** with left-border indicators
- **Timestamp tracking** for each threat event
- **Auto-scroll animation** through recent threats

### 4. **Interactive Controls**
- **Filter by Severity**: Toggle Critical, High, Medium, Low threats
- **Toggle Flows**: Show/hide attack flow paths
- **Real-time Toggle**: Switch between LIVE and PAUSED modes
- **Reset View**: Return map to default position
- **Filter Panel**: Collapsible advanced filtering options

### 5. **Statistics & Metrics**
- **Threat Level Breakdown**: Count by severity
- **Geographic Coverage**: Number of countries under attack
- **Update Rate**: Real-time refresh rate (5000ms default)
- **Live Counter**: Pulsing indicator for active monitoring

## Architecture

### Component Structure

```
src/components/soc/
├── LiveThreatMap.vue          # Main live threat map component
├── ThreatMap.vue              # Original threat map (legacy)
└── GeoMapEnhanced.vue         # Location-based analysis

src/services/
├── threatService.js           # WebSocket & threat subscription service

src/api/
├── geoThreat.js              # Geo threat API endpoints
└── index.js                  # API exports

src/stores/
└── apiStore.js               # Pinia store with threat data actions

src/pages/
└── GeoAnalytics.vue          # Main page using LiveThreatMap
```

### Data Flow

```
API/Backend → geoThreatAPI → apiStore → LiveThreatMap Component
                                    ↓
                            WebSocket Service
                                    ↓
                         Real-time Threat Updates
```

## Usage

### Basic Implementation

The Live Threat Map is automatically integrated into the **Geo-Analytics** page:

```vue
<!-- src/pages/GeoAnalytics.vue -->
<template>
  <div>
    <!-- Page content -->
    <LiveThreatMap :key="timeRange" />
  </div>
</template>

<script setup>
import LiveThreatMap from '../components/soc/LiveThreatMap.vue'
</script>
```

### API Integration

The component uses the following API endpoints (to be implemented on backend):

```javascript
// Get live threat map data
GET /api/geo/threat-map?timeRange=24h

// Get attack flows
GET /api/geo/threat-flows?timeRange=24h&limit=100

// Get threat statistics
GET /api/geo/threat-stats?timeRange=24h

// Get critical threats
GET /api/geo/critical-threats?limit=50

// Get threat history by country
GET /api/geo/threat-history/:country?timeRange=24h
```

### WebSocket Support

For true real-time updates, connect to the WebSocket endpoint:

```javascript
import { connectThreatWS, subscribeTothreats } from '@/services/threatService'

// Connect to WebSocket
await connectThreatWS('ws://localhost:3002/ws/threats')

// Subscribe to threat events
const unsubscribe = subscribeTothreats((threatData) => {
  console.log('New threat:', threatData)
  // Handle threat update
})

// Clean up
unsubscribe()
```

## Styling & Animations

### Key CSS Animations

The component includes several built-in animations:

```css
/* Threat pulse effect for critical threats */
@keyframes threatPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(255, 45, 120, 0.7); }
  50% { box-shadow: 0 0 0 10px rgba(255, 45, 120, 0); }
}

/* Attack flow glow effect */
@keyframes flowGlow {
  0%, 100% { filter: drop-shadow(0 0 2px rgba(255, 45, 120, 0.6)); }
  50% { filter: drop-shadow(0 0 8px rgba(255, 45, 120, 0.9)); }
}

/* Threat ticker scroll animation */
@keyframes scrollUp {
  0% { transform: translateY(0); }
  100% { transform: translateY(-100%); }
}
```

### Design Tokens

The component uses TailwindCSS for styling with custom color palette:

```javascript
Critical: #FF2D78 (Red)
High:     #FF8B5E (Orange)
Medium:   #FFD700 (Yellow)
Low:      #00E1FF (Cyan)
```

## Performance Considerations

### Optimization Strategies

1. **D3.js Selective Rendering**
   - Only renders visible threats based on filter settings
   - Uses D3.js transitions for smooth animations
   - Clears previous elements before redrawing

2. **Polling Strategy**
   - Default 5-second update interval
   - Can be adjusted via `updateRate` ref
   - Pauses when component is unmounted

3. **Memory Management**
   - Unsubscribes from WebSocket on unmount
   - Clears intervals and event listeners
   - Limits ticker to 8 entries maximum

### Recommended Configuration

For production environments:
- Set update interval to 10-15 seconds for slower networks
- Limit threat markers to top 50 by severity
- Cache geolocation data for 5 minutes

## Customization

### Adjusting Update Rate

```javascript
const updateRate = ref(5000) // milliseconds
```

### Modifying Color Scheme

Edit color constants in the component:

```javascript
const getThreatColor = (severity) => {
  if (severity === 'Critical') return '#ff2d78'  // Customize
  if (severity === 'High') return '#ff8b5e'
  // ...
}
```

### Changing Map Projection

Modify the D3.js projection in `initD3Map()`:

```javascript
// Change from geoNaturalEarth1 to other projections
projection.value = d3.geoMercator()
  .scale(width / 6)
  .translate([width / 2, height / 2])
```

## Backend Requirements

To fully implement the Live Threat Map, the backend should provide:

### Data Models

```javascript
{
  // Threat Data
  country: String,
  city: String,
  lat: Number,
  lon: Number,
  count: Number,
  severity: 'Critical' | 'High' | 'Medium' | 'Low',
  timestamp: ISO8601
}

{
  // Attack Flow
  source: String,
  target: String,
  sourceIP: String,
  targetIP: String,
  severity: String,
  timestamp: ISO8601,
  attackType: String
}
```

### WebSocket Message Format

```json
{
  "type": "threat",
  "timestamp": "2024-01-02T10:00:00Z",
  "source": "USA",
  "target": "India",
  "severity": "Critical",
  "attackType": "DDoS",
  "count": 150
}
```

## Troubleshooting

### Map Not Rendering

1. Check browser console for errors
2. Verify D3.js is properly imported
3. Ensure mapContainer ref is properly bound
4. Check that geoData is available in store

### Real-time Updates Not Working

1. Verify API endpoints are returning data
2. Check network tab for 4xx/5xx errors
3. Enable WebSocket debugging in browser DevTools
4. Fall back to polling by checking console logs

### Performance Issues

1. Reduce `updateRate` or increase interval
2. Decrease max number of threat markers
3. Disable attack flow visualization if not needed
4. Monitor browser DevTools Performance tab

## Future Enhancements

- [ ] 3D Globe view using Three.js
- [ ] Heat map layer for threat density
- [ ] Threat timeline with historical playback
- [ ] Attack details modal on marker click
- [ ] Export threat data to CSV/PDF
- [ ] Integration with alerting system
- [ ] Machine learning anomaly detection
- [ ] Threat intelligence feeds integration

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance Metrics

- Initial Load: ~500ms (with D3.js)
- Threat Update: ~100ms
- Animation Frame Rate: 60 FPS
- Memory Usage: ~15-20MB (with 100+ threats)

## License

Part of the SOC Dashboard project. All rights reserved.
