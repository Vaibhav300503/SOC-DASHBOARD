# Tailscale Integration Setup

This guide will help you set up live Tailscale data streaming to your SOC Dashboard and configure both frontend and backend for Tailscale access.

## Prerequisites

1. Tailscale account with admin access
2. Tailscale API key
3. Tailscale installed and running on your machine

## Quick Start

### Option 1: Use Startup Scripts (Recommended)

**Windows:**
```bash
# Double-click or run in Command Prompt
start-tailscale.bat
```

**Linux/Mac:**
```bash
chmod +x start-tailscale.sh
./start-tailscale.sh
```

### Option 2: Manual Start

**Start Backend:**
```bash
cd backend
npm start
```

**Start Frontend:**
```bash
npm run dev:tailscale
```

## Access URLs

### Frontend (SOC Dashboard)
- **Local**: http://localhost:3000
- **Tailscale**: http://100.100.83.123:3000
- **Network**: http://192.168.56.1:3000

### Backend (API Server)
- **Local**: http://localhost:3002
- **Tailscale**: http://100.100.83.123:3002
- **Network**: http://192.168.56.1:3002

### API Endpoints
- **Health Check**: http://100.100.83.123:3002/health
- **Test API**: http://100.100.83.123:3002/api/test
- **Database Test**: http://100.100.83.123:3002/api/test/db
- **Tailscale Data**: http://100.100.83.123:3002/api/tailscale/dashboard

### WebSocket Endpoints
- **Live Tailscale Stream**: ws://100.100.83.123:3002/ws/tailscale
- **Real-time Updates**: ws://100.100.83.123:3002/ws

## Step 1: Generate Tailscale API Key

1. Go to [Tailscale Admin Console](https://login.tailscale.com/admin)
2. Navigate to **Settings** > **API Keys**
3. Click **Generate API Key**
4. Give it a descriptive name (e.g., "SOC Dashboard")
5. Select the required permissions:
   - Read devices
   - Read audit logs
   - Read ACL
6. Copy the generated API key

## Step 2: Configure Backend

The backend is already configured with your Tailscale API key in `backend/.env`:

```bash
# Tailscale Configuration
TAILSCALE_API_KEY=tskey-api-kXcsQErYoB21CNTRL-rswFxS1pXaUTJA9ukCCRbU1xmd3DthUDj
TAILNET=tusharyadav9813@gmail.com
TAILSCALE_HMAC_SECRET=tskey-webhook-k4E5mU8XgD11CNTRL-YFe5y26zbYjZgW3MkhrfXjKKpdLcwDhF

# Server Configuration
PORT=3002
NODE_ENV=development
```

## Step 3: Configure Frontend

The frontend is configured to use Tailscale IPs in `.env`:

```bash
# Frontend API Configuration for Tailscale Access
VITE_API_BASE_URL=http://100.100.83.123:3002/api
VITE_WS_URL=ws://100.100.83.123:3002/ws
```

## Step 4: Verify Integration

1. Start both services using the startup script
2. Open the SOC Dashboard at http://100.100.83.123:3000
3. Navigate to the **Tailscale** tab
4. You should see:
   - Green status indicator showing "Connected"
   - Real device data from your Tailscale network
   - Live updates when devices connect/disconnect

## Features

### Real-time Updates
- Device connections/disconnections
- New device registrations
- IP address changes
- Location updates

### Dashboard Metrics
- Total devices in network
- Online/offline status
- Risk assessment
- Geographic distribution

### Recent Activity
- Connection events
- Authentication attempts
- Policy changes

## Network Configuration

### Backend CORS Configuration
The backend accepts connections from:
- localhost:3000
- 100.100.83.123:3000 (Tailscale)
- 192.168.56.1:3000 (Local network)
- 10.145.3.8:3000 (Additional network)
- Any 100.x.x.x:3000 (Tailscale network range)

### Frontend Proxy Configuration
The frontend proxies API calls to:
- Backend: http://localhost:3002/api
- WebSocket: ws://localhost:3002/ws

## Troubleshooting

### "Sample Data" Showing
- Check that `TAILSCALE_API_KEY` is set in backend/.env
- Verify the API key has correct permissions
- Check backend console for API errors

### No Live Updates
- Ensure WebSocket connection is established
- Check browser console for WebSocket errors
- Verify backend WebSocket server is running

### Connection Refused
- Ensure both frontend and backend are running
- Check that ports 3000 and 3002 are not blocked
- Verify Tailscale is running and connected

### API Errors
```bash
# Test backend connectivity
curl http://100.100.83.123:3002/health

# Test API functionality
curl http://100.100.83.123:3002/api/test

# Test Tailscale API integration
curl http://100.100.83.123:3002/api/tailscale/dashboard
```

### CORS Errors
If you see CORS errors in the browser console:
1. Check that the frontend URL is in the backend CORS configuration
2. Ensure the backend is running on the correct port (3002)
3. Verify the frontend is making requests to the correct backend URL

## Security Notes

- Keep your API key secure and never commit it to version control
- Use read-only permissions when possible
- Regularly rotate your API keys
- Monitor audit logs for suspicious activity
- The backend listens on 0.0.0.0 for Tailscale access

## Advanced Configuration

### Custom Sync Interval
Edit `backend/services/tailscaleSync.js`:
```javascript
this.syncInterval = 2 * 60 * 1000; // 2 minutes
```

### Custom Risk Assessment
Edit `backend/services/tailscaleSync.js` in the `calculateRiskLevel` method.

### Additional Tailscale Networks
To add more Tailscale IP ranges, update `backend/server.js`:
```javascript
origin: [
  // Add your Tailscale IPs here
  'http://100.x.x.x:3000'
]
```

## Testing Tailscale Access

### Test Backend
```bash
# Health check
curl http://100.100.83.123:3002/health

# API test
curl http://100.100.83.123:3002/api/test

# Database connectivity
curl http://100.100.83.123:3002/api/test/db
```

### Test Frontend
1. Open http://100.100.83.123:3000 in your browser
2. Check browser console for any errors
3. Navigate to different pages to ensure API connectivity
4. Test WebSocket connection in the Tailscale tab

### Test WebSocket
```javascript
// In browser console
const ws = new WebSocket('ws://100.100.83.123:3002/ws/tailscale');
ws.onopen = () => console.log('WebSocket connected');
ws.onmessage = (event) => console.log('Received:', event.data);
```
