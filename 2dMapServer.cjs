const express = require('express');
const path = require('path');
const { createServer } = require('http');
const { Server } = require('ws');

const app = express();
const server = createServer(app);
const wss = new Server({ server });

// Enable CORS for all routes
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Serve static files from specific directory, not root
app.use('/static', express.static(path.join(__dirname)));

// Serve the 2dMap.html file specifically for root route
app.get('/', (req, res) => {
  console.log('Serving 2dMapSimple.html');
  res.sendFile(path.join(__dirname, '2dMapSimple.html'));
});

// Catch all other routes and return 404
app.use((req, res) => {
  console.log('404 for:', req.path);
  res.status(404).send('Not found');
});

// WebSocket for real-time updates
wss.on('connection', (ws) => {
  console.log('Client connected to 2dMap server');
  
  // Send initial sample attack with known coordinates
  const sampleAttack = {
    id: 'sample-attack-123',
    source: { name: 'Maharashtra, IND', lat: 19.7515, lon: 75.7139 },
    destination: { name: 'New York, USA', lat: 40.7128, lon: -74.0060 },
    type: { name: 'SMB (445)', color: '#ff4d4d' },
    timestamp: new Date().toISOString()
  };
  
  ws.send(JSON.stringify({ type: 'attack', data: sampleAttack }));
  
  // Send test attacks from known locations every 3 seconds
  const interval = setInterval(() => {
    const testAttacks = [
      {
        id: 'test-texas-1',
        source: { name: 'Moscow Oblast, RUS', lat: 55.7558, lon: 37.6173 },
        destination: { name: 'Texas, USA', lat: 31.9686, lon: -99.9018 },
        type: { name: 'SSH (22)', color: '#ffee00' }
      },
      {
        id: 'test-guangdong-2',
        source: { name: 'Guangdong, CHN', lat: 23.3790, lon: 113.7633 },
        destination: { name: 'California, USA', lat: 36.7783, lon: -119.4179 },
        type: { name: 'HTTP (80)', color: '#ff00ff' }
      },
      {
        id: 'test-lagos-3',
        source: { name: 'Lagos, NGA', lat: 6.5244, lon: 3.3792 },
        destination: { name: 'Florida, USA', lat: 27.6648, lon: -81.5158 },
        type: { name: 'RDP (3389)', color: '#3d5afe' }
      },
      {
        id: 'test-tokyo-4',
        source: { name: 'Tokyo, JPN', lat: 35.6762, lon: 139.6503 },
        destination: { name: 'England, GBR', lat: 52.3555, lon: -1.1743 },
        type: { name: 'Telnet (23)', color: '#00f2ff' }
      }
    ];
    
    const randomAttack = testAttacks[Math.floor(Math.random() * testAttacks.length)];
    const attack = {
      id: randomAttack.id + '-' + Date.now(),
      ...randomAttack,
      timestamp: new Date().toISOString()
    };
    
    ws.send(JSON.stringify({ type: 'attack', data: attack }));
    console.log('Sent test attack:', attack.source.name, '→', attack.destination.name);
  }, 3000);
  
  ws.on('close', () => {
    clearInterval(interval);
    console.log('Client disconnected from 2dMap server');
  });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`2dMap server running on http://localhost:${PORT}`);
});
