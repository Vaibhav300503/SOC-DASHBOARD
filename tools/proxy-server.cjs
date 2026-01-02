const http = require('http');
const httpProxy = require('http-proxy');

// Create proxy server
const proxy = httpProxy.createProxyServer({
  target: 'http://localhost:3002',
  changeOrigin: true
});

// Create HTTP server on port 80
const server = http.createServer((req, res) => {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // Proxy the request
  proxy.web(req, res, (err) => {
    console.error('Proxy error:', err);
    res.writeHead(502);
    res.end('Bad Gateway');
  });
});

// Start server on port 80
server.listen(80, () => {
  console.log('Reverse proxy running on port 80');
  console.log('Forwarding to http://localhost:3002');
  console.log('Use this URL in Tailscale: http://152.59.172.216/api/tailscale/ingest');
});

// Handle errors
proxy.on('error', (err, req, res) => {
  console.error('Proxy error:', err);
  res.writeHead(502);
  res.end('Bad Gateway');
});
