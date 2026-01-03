# CORS Fix Guide - Tailscale Frontend & Backend Integration

## Problem
CORS (Cross-Origin Resource Sharing) errors when accessing the frontend on Tailscale IP while backend is on a different Tailscale IP.

## Solution Applied

### 1. Backend CORS Configuration (backend/server.js)
- Updated CORS middleware to use a dynamic origin checker
- Added support for all Tailscale IPs (100.x.x.x pattern)
- Added explicit support for localhost, 192.168.x.x, 10.x.x.x networks
- Enabled credentials, all HTTP methods, and proper headers
- Set CORS cache to 24 hours

### 2. Helmet Security Headers (backend/server.js)
- Added `crossOriginResourcePolicy: { policy: 'cross-origin' }`
- Updated CSP directives to allow connections to all network ranges
- Added WebSocket support (ws: and wss:)

### 3. Preflight Request Handling (backend/server.js)
- Added `app.options('*', cors())` to handle OPTIONS preflight requests
- This ensures browsers can complete CORS handshake

### 4. Frontend Configuration (.env)
- Confirmed API base URL points to Tailscale backend IP
- Added CORS credentials flag

## How to Test

### Step 1: Restart Backend
```bash
# Kill existing backend process
# Then restart:
cd backend
npm start
```

### Step 2: Verify Backend is Running
```bash
# Test from your machine
curl -H "Origin: http://100.100.83.123:3000" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -X OPTIONS http://100.100.83.123:3002/api/tailscale/stats -v
```

You should see CORS headers in the response:
```
Access-Control-Allow-Origin: http://100.100.83.123:3000
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With
```

### Step 3: Access Frontend
- Open browser and navigate to: `http://100.100.83.123:3000`
- Check browser console (F12) for any remaining errors
- Try accessing Tailscale page or Severity page

### Step 4: Check Browser Console
If you still see CORS errors:
1. Open DevTools (F12)
2. Go to Network tab
3. Look for failed requests
4. Check the response headers for `Access-Control-Allow-Origin`

## Allowed Origins

The backend now accepts requests from:
- `http://localhost:*` (all ports)
- `http://100.100.83.123:*` (Tailscale IP - all ports)
- `http://192.168.56.1:*` (Network range)
- `http://10.216.125.8:*` (Network range)
- `http://10.145.3.8:*` (Additional Tailscale network)
- `http://100.68.123.13:*` (MongoDB server network)
- `http://100.108.227.68:*` (TheHive server network)
- Any IP matching pattern `100.x.x.x` (Tailscale network)

## If CORS Still Fails

### Option 1: Check Backend Logs
```bash
# Look for CORS warnings in backend console
# Should show: "CORS request blocked from origin: ..." if there's an issue
```

### Option 2: Verify Frontend is Using Correct API URL
```javascript
// In browser console, check:
console.log(import.meta.env.VITE_API_BASE_URL)
// Should output: http://100.100.83.123:3002/api
```

### Option 3: Clear Browser Cache
- Hard refresh: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
- Or clear cache in DevTools

### Option 4: Check Network Connectivity
```bash
# Verify backend is accessible
ping 100.100.83.123
curl http://100.100.83.123:3002/health
```

## Common CORS Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| `No 'Access-Control-Allow-Origin' header` | Backend not sending CORS headers | Restart backend, check server.js |
| `Credentials mode is 'include' but Access-Control-Allow-Credentials is missing` | Missing credentials header | Check CORS middleware config |
| `Method not allowed` | OPTIONS request not handled | Verify `app.options('*', cors())` is set |
| `Header not allowed` | Missing header in CSP | Update `allowedHeaders` in CORS config |

## Files Modified

1. **backend/server.js**
   - Updated CORS middleware with dynamic origin checker
   - Enhanced Helmet security headers
   - Added preflight request handler

2. **.env**
   - Added CORS credentials flag

## Next Steps

1. Restart the backend server
2. Hard refresh the frontend in browser
3. Test API calls from the Tailscale frontend
4. Monitor browser console for any remaining errors

If issues persist, check the backend console logs for detailed error messages.
