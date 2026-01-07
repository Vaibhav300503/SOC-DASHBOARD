const express = require('express');
const path = require('path');
const { createServer } = require('http');
const { Server } = require('ws');

const app = express();
const server = createServer(app);
const wss = new Server({ server });

// Serve static files
app.use(express.static(path.join(__dirname)));

// Serve the 2dMap.jsx file as a React app
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '2dMap.html'));
});

// WebSocket for real-time updates
wss.on('connection', (ws) => {
  console.log('Client connected to 2dMap server');
  
  // Send initial sample attack
  const sampleAttack = {
    id: 'sample-attack-123',
    source: { name: 'Maharashtra, IND', lat: 19.7515, lon: 75.7139 },
    destination: { name: 'New York, USA', lat: 40.7128, lon: -74.0060 },
    type: { name: 'SMB (445)', color: '#ff4d4d' },
    timestamp: new Date().toISOString()
  };
  
  ws.send(JSON.stringify({ type: 'attack', data: sampleAttack }));
  
  // Send random attacks every 2 seconds
  const interval = setInterval(() => {
    const attacks = [
      {
        source: { name: 'Moscow Oblast, RUS', lat: 55.7558, lon: 37.6173 },
        destination: { name: 'California, USA', lat: 36.7783, lon: -119.4179 },
        type: { name: 'SSH (22)', color: '#ffee00' }
      },
      {
        source: { name: 'Guangdong, CHN', lat: 23.3790, lon: 113.7633 },
        destination: { name: 'Texas, USA', lat: 31.9686, lon: -99.9018 },
        type: { name: 'HTTP (80)', color: '#ff00ff' }
      },
      {
        source: { name: 'Lagos, NGA', lat: 6.5244, lon: 3.3792 },
        destination: { name: 'Florida, USA', lat: 27.6648, lon: -81.5158 },
        type: { name: 'RDP (3389)', color: '#3d5afe' }
      }
    ];
    
    const randomAttack = attacks[Math.floor(Math.random() * attacks.length)];
    const attack = {
      id: Math.random().toString(36).substr(2, 9),
      ...randomAttack,
      timestamp: new Date().toISOString()
    };
    
    ws.send(JSON.stringify({ type: 'attack', data: attack }));
  }, 2000);
  
  ws.on('close', () => {
    clearInterval(interval);
    console.log('Client disconnected from 2dMap server');
  });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`2dMap server running on http://localhost:${PORT}`);
});
