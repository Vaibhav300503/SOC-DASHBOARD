# Tailscale Integration Setup

This guide will help you set up live Tailscale data streaming to your SOC Dashboard.

## Prerequisites

1. Tailscale account with admin access
2. Tailscale API key

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

Create or update the `.env` file in your backend directory:

```bash
# Tailscale Configuration
TAILSCALE_API_KEY=tskey-api-xxxxxxxxxxxxxxxxxxxxxxxx
TAILSCALE_TAILNET=your-tailnet-name@example.com  # Optional, defaults to 'default'
```

## Step 3: Start the Backend

```bash
cd backend
npm start
```

The backend will:
- Connect to Tailscale API
- Start syncing device data every 5 minutes
- Set up WebSocket server for real-time updates

## Step 4: Verify Integration

1. Open the SOC Dashboard
2. Navigate to the **Tailscale** tab
3. You should see:
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

## Troubleshooting

### "Sample Data" Showing
- Check that `TAILSCALE_API_KEY` is set in backend/.env
- Verify the API key has correct permissions
- Check backend console for API errors

### No Live Updates
- Ensure WebSocket connection is established
- Check browser console for WebSocket errors
- Verify backend WebSocket server is running

### API Errors
```bash
# Check API key validity
curl -H "Authorization: Bearer $TAILSCALE_API_KEY" \
     https://api.tailscale.com/api/v2/tailnet/default/devices
```

## Security Notes

- Keep your API key secure and never commit it to version control
- Use read-only permissions when possible
- Regularly rotate your API keys
- Monitor audit logs for suspicious activity

## Advanced Configuration

### Custom Sync Interval
Edit `backend/services/tailscaleSync.js`:
```javascript
this.syncInterval = 2 * 60 * 1000; // 2 minutes
```

### Custom Risk Assessment
Edit `backend/services/tailscaleSync.js` in the `calculateRiskLevel` method.

### WebSocket Endpoints
- `ws://localhost:3001/ws/tailscale` - Real-time updates
- `GET /api/tailscale/dashboard` - Dashboard data
- `GET /api/tailscale/devices` - Device list
- `GET /api/tailscale/recent` - Recent activity
