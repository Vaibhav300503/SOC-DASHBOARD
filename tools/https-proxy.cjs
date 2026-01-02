const https = require('https');
const http = require('http');
const httpProxy = require('http-proxy');
const fs = require('fs');

// Create proxy server
const proxy = httpProxy.createProxyServer({
  target: 'http://localhost:3002',
  changeOrigin: true
});

// Try to create self-signed certificate if it doesn't exist
const keyPath = './server.key';
const certPath = './server.cert';

if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
  console.log('Generating self-signed certificate...');
  const { execSync } = require('child_process');
  try {
    execSync('openssl req -x509 -newkey rsa:4096 -keyout server.key -out server.cert -days 365 -nodes -subj "/CN=localhost"', { stdio: 'inherit' });
  } catch (err) {
    console.log('OpenSSL not found. Please install OpenSSL or generate certificates manually.');
    process.exit(1);
  }
}

// Read certificates
const options = {
  key: fs.readFileSync(keyPath),
  cert: fs.readFileSync(certPath)
};

// Create HTTPS server on port 443
const server = https.createServer(options, (req, res) => {
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

// Also create HTTP server that redirects to HTTPS
const httpServer = http.createServer((req, res) => {
  res.writeHead(301, { 'Location': `https://${req.headers.host}${req.url}` });
  res.end();
});

// Start servers
httpServer.listen(80, () => {
  console.log('HTTP server running on port 80 (redirects to HTTPS)');
});

server.listen(443, () => {
  console.log('HTTPS proxy running on port 443');
  console.log('Forwarding to http://localhost:3002');
  console.log('Use this URL in Tailscale: https://152.59.172.216/api/tailscale/ingest');
});

// Handle errors
proxy.on('error', (err, req, res) => {
  console.error('Proxy error:', err);
  res.writeHead(502);
  res.end('Bad Gateway');
});
