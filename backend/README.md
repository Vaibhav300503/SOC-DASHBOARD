# SOC Dashboard Backend

Express.js backend for SOC Dashboard with MongoDB integration.

## Features

- ✅ Log ingestion from multiple sources
- ✅ Tailscale audit log streaming
- ✅ Geolocation enrichment
- ✅ HMAC signature verification
- ✅ RESTful API endpoints
- ✅ MongoDB with TTL indexes
- ✅ Rate limiting
- ✅ CORS support

## Project Structure

```
backend/
├── server.js                 # Main server file
├── package.json             # Dependencies
├── .env.example             # Environment template
├── models/
│   ├── Log.js              # Log schema
│   └── TailscaleLog.js      # Tailscale log schema
├── routes/
│   ├── logs.js             # Log endpoints
│   ├── tailscale.js        # Tailscale endpoints
│   └── stats.js            # Statistics endpoints
├── middleware/
│   ├── validation.js       # Input validation
│   ├── hmac.js            # HMAC verification
│   └── geoip.js           # Geolocation enrichment
└── agents/
    ├── tailscale-agent.py  # Python log agent
    └── tailscale-agent.service  # Systemd service
```

## API Endpoints

### Logs

- `POST /api/logs/ingest` - Ingest logs
- `GET /api/logs/recent` - Get recent logs
- `GET /api/logs/geo` - Get geolocation data
- `GET /api/logs/ip/:ip` - Get logs for IP
- `GET /api/logs/severity/:level` - Get logs by severity
- `GET /api/logs/endpoint/:endpoint` - Get endpoint logs
- `GET /api/logs/search` - Search with filters

### Tailscale

- `POST /api/tailscale/ingest` - Ingest audit logs
- `POST /api/tailscale/agent` - Ingest from local agent
- `GET /api/tailscale/recent` - Get recent logs
- `GET /api/tailscale/stats` - Get statistics
- `GET /api/tailscale/events/:type` - Get events by type

### Statistics

- `GET /api/stats/dashboard` - Dashboard statistics
- `GET /api/stats/severity` - Severity statistics
- `GET /api/stats/timeline` - Timeline data

## Quick Start

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your MongoDB URI

# Start development server
npm run dev

# Server runs on http://localhost:3001
```

## Environment Variables

```bash
MONGO_URI=mongodb://ML:MLadmin@100.68.123.13:27017/soc_platform?authSource=admin
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
TAILSCALE_HMAC_SECRET=your_secret_key
LOG_LEVEL=info
```

## Log Format

### Standard Log
```json
{
  "timestamp": "2024-01-15T14:32:45Z",
  "source_ip": "192.168.1.100",
  "dest_ip": "10.0.0.50",
  "endpoint": "endpoint-1",
  "severity": "Critical",
  "log_type": "Firewall",
  "geo": {
    "country": "US",
    "city": "New York",
    "lat": 40.7128,
    "lon": -74.0060
  },
  "raw": {
    "action": "DENY",
    "protocol": "TCP",
    "port": 443
  }
}
```

### Tailscale Log
```json
{
  "ts": "2024-01-15T14:32:45Z",
  "type": "peer_connected",
  "node_id": "123456",
  "user": "john@example.com",
  "src": "100.64.1.1",
  "dst": "100.64.1.2",
  "event": "Peer connected"
}
```

## Testing

```bash
# Health check
curl http://localhost:3001/health

# Ingest single log
curl -X POST http://localhost:3001/api/logs/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "timestamp": "2024-01-15T14:32:45Z",
    "source_ip": "192.168.1.100",
    "dest_ip": "10.0.0.50",
    "endpoint": "test",
    "severity": "High",
    "log_type": "Firewall"
  }'

# Get recent logs
curl http://localhost:3001/api/logs/recent?limit=10

# Get dashboard stats
curl http://localhost:3001/api/stats/dashboard
```

## Deployment

See [../DEPLOYMENT.md](../DEPLOYMENT.md) for production deployment instructions.

## Integration

See [../BACKEND_INTEGRATION.md](../BACKEND_INTEGRATION.md) for detailed integration guide.

---

**Version**: 1.0.0  
**Last Updated**: January 2024
