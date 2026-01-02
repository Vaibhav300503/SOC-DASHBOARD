# SOC Dashboard - Security Operations Center

A modern, production-ready Security Operations Center (SOC) dashboard built with Vue.js 3, TailwindCSS, and Pinia state management. Features real-time threat monitoring, geolocation analytics, IP-based threat analysis, and Tailscale integration.

## 🎨 Design Features

- **Modern Cybersecurity Theme**: Cyber blue (#5b6dff) and neon purple (#b026ff) accents
- **Glassmorphism UI**: Soft cards with backdrop blur effects
- **High-Contrast Design**: Optimized for 24/7 SOC operations
- **Responsive Grid Layout**: Works seamlessly on all screen sizes
- **Real-time Data Visualization**: Live threat indicators and activity streams

## 📊 Features Implemented

### 1. **Global Dashboard Overview**
- Real-time log counter
- Severity distribution (Critical/High/Medium/Low)
- Log type breakdown (Firewall/IDS/Authentication/App/System)
- Top 10 source and destination IPs
- Global geolocation heatmap
- Tailscale activity summary

### 2. **Geolocation Analytics**
- Interactive world map with threat hotspots
- Geographic distribution table (Country/City/ASN/Hit Count)
- Top countries by event volume
- Severity distribution by region
- Real-time heat visualization

### 3. **IP-Based Analytics**
- IP lookup and search
- Time-range filtering (24h/7d/30d/90d)
- Associated endpoints analysis
- Severity distribution per IP
- Alert count tracking
- IP activity trends

### 4. **Log Types Page**
- Categorized logs: Firewall, IDS, Authentication, App, System
- Advanced filtering by severity, time range, action
- Detailed log table with export
- Severity distribution charts

### 5. **Endpoint-Specific Activity**
- Endpoint search and discovery
- Activity timeline with severity indicators
- Error rate analysis
- Top attacking IPs per endpoint
- Related logs viewer

### 6. **Severity-Based Logs**
- Tabs for each severity level
- Severity-specific statistics
- Top source IPs for each severity
- Detailed event breakdown
- Protocol and port analysis

### 7. **Dedicated Tailscale Page**
- Device list with status
- User sessions tracking
- Peer connections monitoring
- Subnet routers management
- Exit node usage
- Tailscale logs viewer
- Real-time events stream
- Network health metrics

### 8. **Log Viewer Page**
- Universal JSON log viewer
- Advanced search with regex support
- Multi-field filtering
- Expandable JSON tree view
- Pagination with results summary
- Top IPs and endpoints analysis
- Export functionality

## 🏗️ Project Structure

```
cyart/
├── index.html                          # Entry point
├── package.json                        # Dependencies
├── vite.config.js                      # Vite configuration
├── tailwind.config.js                  # TailwindCSS config
├── postcss.config.js                   # PostCSS config
│
├── src/
│   ├── main.js                         # Vue app initialization
│   ├── App.vue                         # Root component with navigation
│   ├── style.css                       # Global styles + Tailwind
│   │
│   ├── router/
│   │   └── index.js                    # Vue Router configuration
│   │
│   ├── stores/
│   │   └── logStore.js                 # Pinia store for log data
│   │
│   ├── services/
│   │   └── logService.js               # Mock API service layer
│   │
│   ├── pages/
│   │   ├── Dashboard.vue               # Main overview dashboard
│   │   ├── GeoAnalytics.vue            # Geolocation analysis
│   │   ├── IpAnalytics.vue             # IP-based analytics
│   │   ├── LogTypes.vue                # Categorized logs
│   │   ├── Endpoints.vue               # Endpoint activity
│   │   ├── Severity.vue                # Severity-based logs
│   │   ├── Tailscale.vue               # Tailscale integration
│   │   └── LogViewer.vue               # Universal log viewer
│   │
│   └── components/
│       └── soc/
│           ├── GeoMap.vue              # World map heatmap
│           ├── SeverityChart.vue       # Severity distribution
│           ├── IpTable.vue             # IP statistics table
│           ├── EndpointTimeline.vue    # Activity timeline
│           ├── TailscaleStats.vue      # Tailscale metrics
│           └── JsonViewer.vue          # JSON display component
```

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The application will be available at `http://localhost:3000`

## 📦 Dependencies

```json
{
  "vue": "^3.3.4",
  "vue-router": "^4.2.4",
  "pinia": "^2.1.4",
  "axios": "^1.5.0",
  "apexcharts": "^3.44.0",
  "vue3-apexcharts": "^1.4.1",
  "leaflet": "^1.9.4",
  "date-fns": "^2.30.0"
}
```

## 🔌 Integration Points

### MongoDB Integration
Replace mock data in `src/stores/logStore.js` with actual MongoDB queries:

```javascript
// Example: Replace generateMockLogs() with:
const logs = await logService.fetchLogs({
  timeRange: '24h',
  severity: ['Critical', 'High']
})
```

### Tailscale Integration
Update `src/services/logService.js` with real Tailscale API calls:

```javascript
// Example: Replace mock with real API
const devices = await tailscaleService.fetchDevices()
const sessions = await tailscaleService.fetchUserSessions()
```

### Real-time Updates
Implement WebSocket connections in services:

```javascript
// Example: Real-time log streaming
const ws = new WebSocket('ws://your-backend/logs')
ws.onmessage = (event) => {
  const log = JSON.parse(event.data)
  logStore.addLog(log)
}
```

## 🎯 Mock Data Format

### MongoDB Log Format
```javascript
{
  id: "log-123",
  timestamp: "2024-01-15T14:32:45Z",
  source_ip: "192.168.1.100",
  dest_ip: "10.0.0.50",
  endpoint: "endpoint-1",
  severity: "Critical",
  log_type: "Firewall",
  geo: {
    country: "US",
    city: "New York",
    lat: 40.7128,
    lon: -74.0060
  },
  raw: {
    action: "DENY",
    protocol: "TCP",
    port: 443,
    bytes_in: 1024,
    bytes_out: 2048
  }
}
```

### Tailscale Log Format
```javascript
{
  id: "ts-456",
  ts: "2024-01-15T14:32:45Z",
  type: "peer_connected",
  node_id: "node-1",
  user: "john.doe",
  src: "100.64.1.1",
  dst: "100.64.1.2",
  event: "Peer connection established",
  status: "success"
}
```

## 🎨 Customization

### Color Scheme
Edit `tailwind.config.js` to customize colors:

```javascript
colors: {
  'cyber': { /* Blue theme */ },
  'neon': { /* Accent colors */ },
  'slate-dark': { /* Dark backgrounds */ }
}
```

### Theme Variants
- **Cyber Blue**: Primary accent (#5b6dff)
- **Neon Purple**: Secondary accent (#b026ff)
- **Neon Red**: Critical alerts (#ff0055)
- **Neon Orange**: High priority (#ff6b35)
- **Neon Green**: Success/Low severity (#00ff88)

## 📈 Performance Optimization

- Lazy-loaded route components
- Computed properties for reactive filtering
- Efficient list rendering with keys
- Debounced search queries
- Optimized CSS with TailwindCSS purging

## 🔒 Security Considerations

- Input validation on all search fields
- XSS protection via Vue's template escaping
- CSRF tokens for API requests (when connected to backend)
- Secure WebSocket connections (wss://)
- Environment variables for sensitive data

## 🧪 Testing

Create test files in `src/__tests__/`:

```bash
# Unit tests for stores
npm run test:unit

# E2E tests with Playwright
npm run test:e2e
```

## 📝 API Integration Guide

### Step 1: Update Log Service
```javascript
// src/services/logService.js
export const logService = {
  async fetchLogs(filters) {
    const response = await axios.post('/api/logs', filters)
    return response.data
  }
}
```

### Step 2: Update Store
```javascript
// src/stores/logStore.js
const fetchLogs = async () => {
  const data = await logService.fetchLogs()
  logs.value = data
}
```

### Step 3: Call in Components
```javascript
onMounted(async () => {
  await logStore.fetchLogs()
})
```

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Netlify
```bash
npm run build
# Upload dist/ folder to Netlify
```

### Deploy to Vercel
```bash
vercel deploy
```

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "preview"]
```

## 📚 Documentation

- [Vue 3 Documentation](https://vuejs.org/)
- [TailwindCSS Documentation](https://tailwindcss.com/)
- [Pinia Documentation](https://pinia.vuejs.org/)
- [Vue Router Documentation](https://router.vuejs.org/)

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Submit a pull request

## 📄 License

MIT License - feel free to use this dashboard in your projects

## 🗄️ MongoDB Integration & Data Usage

### Database Connection

The SOC Dashboard uses MongoDB as the primary data source. All dashboard components, charts, tables, and analytics pull real data from MongoDB collections.

**MongoDB URI:**
```
mongodb://192.168.1.35:27017/soc_logs
```

### Collections Overview

| Collection | Purpose | Documents |
|-----------|---------|-----------|
| `logs` | Network security logs | Firewall, IDS, DNS logs |
| `events` | System and network events | Auditbeat, Filebeat events |
| `blocked_ips` | Blocked/blacklisted IPs | IP blocks with reasons |
| `safe_list` | Whitelisted IPs | Trusted IPs |
| `topology_coords` | Network topology nodes | Node positions and metadata |
| `topology_edges` | Network connections | Edge data between nodes |
| `alerts_rules` | Alert rule definitions | Rule conditions and actions |
| `alerts_events` | Alert notifications | Generated alerts |
| `tailscale_logs` | Tailscale activity | VPN connection logs |
| `users` | User accounts | Authentication data |

### Auto-Seeding Empty Collections

If any collection is empty, the system will automatically seed it with minimal sample data to ensure the dashboard always displays something.

**Run seeding script:**
```bash
cd backend
node scripts/seed-mongodb.js
```

**Output:**
```
✓ Connected to MongoDB
✓ Seeded logs collection with 3 entries
✓ Seeded events collection with 2 entries
✓ Seeded topology_coords collection with 2 entries
✓ Seeded topology_edges collection with 1 entry
✅ Database seeding completed successfully!
```

### Data Flow Architecture

```
MongoDB Collections
        ↓
Backend API Routes (/api/*)
        ↓
Frontend API Clients (src/api/*.js)
        ↓
Pinia Stores (src/stores/*.js)
        ↓
Vue Components (src/pages/*.vue)
        ↓
UI Display (Charts, Tables, Maps)
```

### Backend API Endpoints

All endpoints read from MongoDB and return real data or empty arrays if no data exists.

**Logs API:**
```
GET    /api/logs/recent                    - Recent logs
GET    /api/logs/geo                       - Geolocation data
GET    /api/logs/ip/:ip                    - Logs for specific IP
GET    /api/logs/search                    - Search logs
POST   /api/logs/ingest                    - Ingest new logs
```

**Events API:**
```
GET    /api/events/recent                  - Recent events
GET    /api/events/stats                   - Event statistics
GET    /api/events/topology                - Topology data
GET    /api/events/ip/:ip                  - Events for IP
GET    /api/events/search                  - Search events
```

**IP Management:**
```
POST   /api/ip/block                       - Block an IP
POST   /api/ip/allow                       - Whitelist an IP
GET    /api/ip/blocked                     - List blocked IPs
GET    /api/ip/safe                        - List safe IPs
DELETE /api/ip/block/:id                   - Unblock an IP
```

**Lookups:**
```
GET    /api/lookup/whois/:ip               - WHOIS information
GET    /api/lookup/geoip/:ip               - GeoIP information
GET    /api/lookup/ti/:ip                  - Threat intelligence
```

**Export:**
```
GET    /api/export/logs/csv                - Export logs as CSV
GET    /api/export/logs/json               - Export logs as JSON
GET    /api/export/events/csv              - Export events as CSV
GET    /api/export/events/json             - Export events as JSON
```

**Topology:**
```
GET    /api/topology                       - Full topology graph
GET    /api/topology/node/:ip              - Node details
GET    /api/topology/stats                 - Topology statistics
GET    /api/topology/india                 - India-centric topology
```

### Frontend Data Consumption

All frontend components use the API store to fetch real MongoDB data:

**Example - Dashboard Component:**
```javascript
// src/pages/Dashboard.vue
import { useAPIStore } from '../stores/apiStore'

const apiStore = useAPIStore()

onMounted(async () => {
  // Fetch real data from MongoDB
  await apiStore.fetchDashboardStats()
  await apiStore.fetchRecentEvents()
  await apiStore.fetchGeoData()
})

// Display real data
const totalEvents = computed(() => apiStore.total || 0)
const criticalCount = computed(() => 
  apiStore.severityBreakdown.find(s => s._id === 'Critical')?.count || 0
)
```

### Empty State Handling

All components gracefully handle empty MongoDB collections:

- **No logs?** → Shows "0" and empty tables
- **No events?** → Displays "No events found"
- **No topology data?** → Shows "No connections available"
- **No geo data?** → Displays empty map with "No data"

**Example:**
```javascript
const geoTableData = computed(() => {
  if (!apiStore.geoData || apiStore.geoData.length === 0) {
    return [] // Empty array, UI shows "No data found"
  }
  return apiStore.geoData.sort((a, b) => b.count - a.count)
})
```

### Verifying MongoDB Data

**Check if collections have data:**
```bash
mongosh mongodb://192.168.1.35:27017/soc_logs

# Count documents in each collection
db.logs.countDocuments()
db.events.countDocuments()
db.blocked_ips.countDocuments()
db.topology_coords.countDocuments()

# View sample document
db.events.findOne()
db.logs.findOne()
```

**Expected output:**
```
soc_logs> db.events.countDocuments()
42

soc_logs> db.logs.countDocuments()
156

soc_logs> db.events.findOne()
{
  _id: ObjectId('...'),
  '@timestamp': ISODate('2025-01-01T12:00:00Z'),
  host: { name: 'server-1', ip: '192.168.1.10' },
  source: { ip: '192.168.1.10', port: 49434 },
  destination: { ip: '8.8.8.8', port: 53 },
  event: { action: 'network_flow', severity: 'Low' },
  ...
}
```

### What to Do If Database is Empty

1. **Run seeding script** (creates minimal sample data):
   ```bash
   node backend/scripts/seed-mongodb.js
   ```

2. **Ingest real logs** via API:
   ```bash
   curl -X POST http://localhost:3001/api/logs/ingest \
     -H "Content-Type: application/json" \
     -d '{
       "timestamp": "2025-01-01T12:00:00Z",
       "source_ip": "192.168.1.10",
       "dest_ip": "8.8.8.8",
       "severity": "LOW",
       "log_type": "DNS"
     }'
   ```

3. **Import from file** (if you have existing logs):
   ```bash
   mongoimport --uri mongodb://192.168.1.35:27017/soc_logs \
     --collection logs \
     --file logs.json \
     --jsonArray
   ```

4. **Dashboard will auto-populate** with real data once MongoDB has documents

### Performance Optimization

- **Indexes created automatically** on key fields (timestamp, IP addresses, severity)
- **Queries limited to 1000 documents** by default
- **Time-range filtering** reduces query scope (24h, 7d, 30d options)
- **Aggregation pipelines** for efficient data processing

### Troubleshooting

**Issue: Dashboard shows "0" for all metrics**
- Check MongoDB connection: `mongosh mongodb://192.168.1.35:27017/soc_logs`
- Verify collections exist: `show collections`
- Run seeding script: `node backend/scripts/seed-mongodb.js`

**Issue: API returns empty arrays**
- Check backend logs for errors
- Verify MongoDB is running: `mongosh --eval "db.adminCommand('ping')"`
- Check network connectivity to MongoDB server

**Issue: Slow dashboard loading**
- Check MongoDB indexes: `db.logs.getIndexes()`
- Verify network latency to MongoDB server
- Check backend server logs for slow queries

---

## 🗺️ Geo-Mapping & Live Tailscale Streaming

### Geo-Mapping Features

#### Interactive World Map
- **Leaflet.js Integration**: Open-source, lightweight map library with OpenStreetMap tiles
- **GeoJSON Support**: All logs converted to GeoJSON format for mapping
- **Marker Clustering**: Automatic clustering of markers at different zoom levels
- **Severity Color Coding**: Markers colored by event severity (Critical=Red, High=Orange, Medium=Yellow, Low=Green)
- **Interactive Popups**: Click markers to see IP, location, severity, and log details

#### Geolocation Enrichment
- **Automatic IP Enrichment**: IPs automatically enriched with geolocation data
- **Free APIs Used**:
  - `ipwho.is` - Primary geolocation provider (no auth required)
  - `ipapi.co` - Fallback provider (no auth required)
- **Intelligent Caching**: 
  - In-memory cache (1 hour TTL) for fast lookups
  - MongoDB persistence for long-term caching
  - Auto-cleanup of cache entries older than 30 days
- **Private IP Mapping**: Internal IPs mapped to India cities for context

#### Backend Endpoints
```
GET    /api/geo/logs              - Get all logs as GeoJSON with enriched geo data
GET    /api/geo/summary           - Get aggregated geolocation summary by country/city
GET    /api/geo/ip/:ip            - Get geolocation data for specific IP
POST   /api/geo/batch             - Batch enrich multiple IPs
```

#### Frontend Components
- **GeoMapLeaflet.vue**: Interactive map component with:
  - Real-time marker updates
  - Zoom and pan controls
  - Reset view button
  - Heatmap toggle (extensible)
  - Live statistics (total markers, countries, critical/high events)
  - Geolocation data table with filtering

#### Usage Example
```javascript
// Fetch geo data for map
const response = await fetch('/api/geo/logs?timeRange=24h&limit=1000')
const geoData = await response.json()

// Access GeoJSON features
geoData.features.forEach(feature => {
  console.log(feature.properties.ip, feature.properties.country)
})
```

### Live Tailscale Streaming

#### Server-Sent Events (SSE) Implementation
- **Endpoint**: `GET /api/tailscale-stream/stream`
- **Protocol**: HTTP/1.1 Server-Sent Events (no WebSocket required)
- **Fallback**: Automatic polling every 5 seconds if SSE unavailable
- **Auto-Reconnect**: Exponential backoff reconnection (max 5 attempts)

#### Real-time Features
- **Live Log Streaming**: New Tailscale logs pushed to clients in real-time
- **Statistics Updates**: Aggregated stats broadcast every 30 seconds
- **Connection Management**: Heartbeat every 30 seconds to keep connection alive
- **Error Handling**: Graceful degradation with automatic reconnection

#### Backend Services
- **tailscaleStreamService.js**: Polling and broadcasting service
  - Polls MongoDB for new logs every 5 seconds
  - Broadcasts to all connected SSE clients
  - Maintains connection state and statistics

- **tailscale-stream.js**: SSE route handler
  - Manages client connections
  - Sends recent logs on connection
  - Broadcasts new logs and stats

#### Frontend Service
- **tailscaleStreamService.js**: Client-side stream consumer
  - Singleton service for managing SSE connection
  - Event-based architecture with subscribe/unsubscribe
  - Automatic reconnection with exponential backoff
  - Error and connection status tracking

#### Usage Example
```javascript
import { tailscaleStreamService } from '@/services/tailscaleStreamService'

// Connect to stream
tailscaleStreamService.connect()

// Subscribe to events
const unsubscribe = tailscaleStreamService.on('log', (log) => {
  console.log('New Tailscale log:', log)
})

// Handle stats updates
tailscaleStreamService.on('stats', (stats) => {
  console.log('Updated stats:', stats)
})

// Cleanup
unsubscribe()
tailscaleStreamService.disconnect()
```

#### Event Types
```javascript
// Connection events
'connected'      - Stream connected successfully
'disconnected'   - Stream disconnected
'error'          - Stream error occurred

// Data events
'log'            - New Tailscale log entry
'log:peer_connected'    - Specific log type
'log:peer_disconnected' - Specific log type
'stats'          - Statistics update

// Reconnection events
'reconnect_failed' - Max reconnection attempts reached
```

#### Tailscale.vue Integration
- Real-time device list updates
- Live user session tracking
- Automatic stats refresh
- Real-time event stream display
- Connection status indicator (green = live, red = disconnected)

#### Polling Fallback
If SSE is unavailable:
- Automatically falls back to polling every 5 seconds
- Polls `/api/tailscale-stream/stream` endpoint
- Same event structure as SSE
- Transparent to frontend code

#### Performance Considerations
- **Memory**: In-memory cache limited to 1 hour TTL
- **Database**: MongoDB indexes on timestamp and IP fields
- **Network**: Heartbeat every 30 seconds keeps connection alive
- **Scalability**: Supports multiple concurrent SSE clients
- **Cleanup**: Auto-cleanup of old geo cache entries

#### Troubleshooting

**Map not showing data:**
- Check `/api/geo/logs` endpoint returns valid GeoJSON
- Verify MongoDB has log entries with valid timestamps
- Check browser console for Leaflet errors

**Tailscale stream not connecting:**
- Verify backend is running on port 3001
- Check `/api/tailscale-stream/stream` endpoint is accessible
- Look for CORS errors in browser console
- Check MongoDB has TailscaleLog collection

**Geolocation enrichment slow:**
- First request for IP will call external API (5-10s)
- Subsequent requests use cache (instant)
- Check MongoDB connection for cache operations
- Monitor rate limits on ipwho.is and ipapi.co

---

## 🔌 API Endpoints Reference

### IP Management
```
POST   /api/ip-management/block          - Block an IP
POST   /api/ip-management/allow          - Remove IP from blocklist
POST   /api/ip-management/safe           - Mark IP as safe
GET    /api/ip-management/status         - Get IP management status
GET    /api/ip-management/check/:ip      - Check IP status
DELETE /api/ip-management/safe/:ip       - Remove from safe list
```

### Alerts
```
POST   /api/alerts/rules                 - Create alert rule
GET    /api/alerts/rules                 - List alert rules
GET    /api/alerts/rules/:id             - Get specific rule
PATCH  /api/alerts/rules/:id             - Update alert rule
DELETE /api/alerts/rules/:id             - Delete alert rule
GET    /api/alerts/events                - List alert events
PATCH  /api/alerts/events/:id/read       - Mark event as read
PATCH  /api/alerts/events/mark-all-read  - Mark all as read
GET    /api/alerts/stream                - SSE stream for real-time alerts
```

### Exports
```
GET    /api/export/logs                  - Export logs (CSV/JSON)
GET    /api/export/alerts                - Export alerts (CSV/JSON)
```

### Lookups
```
GET    /api/lookup/whois?ip=             - WHOIS lookup
GET    /api/lookup/geoip?ip=             - GeoIP lookup
GET    /api/lookup/threat-intel?ip=      - Threat intelligence
GET    /api/lookup/dns?domain=           - DNS lookup
```

### Example Curl Commands

**Block an IP:**
```bash
curl -X POST http://localhost:3001/api/ip-management/block \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "ip": "192.168.1.100",
    "reason": "Suspicious activity",
    "severity": "High"
  }'
```

**Export logs as CSV:**
```bash
curl http://localhost:3001/api/export/logs?format=csv&timeRange=24h \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -o logs.csv
```

**Get WHOIS data:**
```bash
curl http://localhost:3001/api/lookup/whois?ip=8.8.8.8 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Create alert rule:**
```bash
curl -X POST http://localhost:3001/api/alerts/rules \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Critical Alert",
    "description": "Alert on critical events",
    "condition": {
      "type": "severity",
      "value": "Critical",
      "operator": "equals"
    },
    "actions": [
      { "type": "email", "target": "admin@example.com" }
    ],
    "severity": "Critical"
  }'
```

## 🔐 Environment Variables

Create a `.env` file in the backend directory:

```env
# Server
PORT=3001
NODE_ENV=development

# MongoDB
MONGO_URI=mongodb://localhost:27017/soc_dashboard

# JWT
JWT_SECRET=your_secret_key_here
JWT_EXPIRY=7d

# Frontend
FRONTEND_URL=http://localhost:3000

# External APIs (Optional - for real integrations)
WHOIS_API_KEY=your_key
GEOIP_API_KEY=your_key
ABUSEIPDB_API_KEY=your_key
VIRUSTOTAL_API_KEY=your_key

# Email (for alerts)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

## 🆘 Support

For issues, questions, or feature requests, please open an issue or contact the development team.

---

**Built with ❤️ for modern SOC operations**
