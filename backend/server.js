import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import rateLimit from 'express-rate-limit';
import bodyParser from 'body-parser';
import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config()

// Create Express app
const app = express()
const server = createServer(app)
const PORT = process.env.PORT || 3001
const API_PREFIX = '/api'

// Import database connection
import connectDB from './config/db.js';

// Import Tailscale sync service (protected version)
import lockedSyncService from './services/tailscaleSyncLocked.js';

// Import case sync service
import { startCaseSync } from './services/caseSync.js';

// Import log cleanup service
import { startCleanupSchedule } from './services/logCleanupService.js';

// Connect to MongoDB
connectDB();

// Start automatic log cleanup (every 3 mins)
startCleanupSchedule();

// Start Tailscale auto-sync (only if API key is configured)
// if (process.env.TAILSCALE_API_KEY) {
//   lockedSyncService.startAutoSync();
// } else {
//   console.log('⚠️  TAILSCALE_API_KEY not found - Tailscale sync disabled');
// }

// Start TheHive case sync (only if configured)
if (process.env.THEHIVE_BASE_URL && process.env.THEHIVE_API_KEY) {
  startCaseSync(300000); // Sync every 5 minutes
  console.log('✅ TheHive case sync enabled');
} else {
  console.log('⚠️  THEHIVE configuration not found - Case sync disabled');
}


// Routes
import authRoutes from './routes/auth.js'
import tailscaleRoutes from './routes/tailscale.js'
import tailscaleProtectedRoutes from './routes/tailscaleProtected.js'
import { setupTailscaleWebSocket } from './routes/tailscale-websocket.js'
import websocketManager from './services/websocketManager.js'
import websocketBroadcaster from './routes/tailscale-websocket-protected.js'
import logsRoutes from './routes/logs.js'
import statsRoutes from './routes/stats.js'
import topologyRoutes from './routes/topology.js'
import ipRoutes from './routes/ip.js'
import lookupRoutes from './routes/lookup.js'
import exportRoutes from './routes/export.js'
import alertsRoutes from './routes/alerts.js'
import eventsRoutes from './routes/events.js'
import profileRoutes from './routes/profile.js'
import geoRoutes from './routes/geo.js'
import tailscaleStreamRoutes from './routes/tailscale-stream.js'
import agentRoutes from './routes/agents.js'
import casesRoutes from './routes/cases.js'

// Logger setup
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
})

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }))
}

// Middleware
app.use(helmet({
  frameguard: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginOpenerPolicy: false, // Disable COOP header
  originAgentCluster: false, // Disable Origin-Agent-Cluster header
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: [
        "'self'",
        "ws:",
        "wss:",
        "http://localhost:*",
        "http://100.100.83.123:*",
        "http://192.168.56.1:*",
        "http://10.216.125.8:*",
        "http://10.145.3.8:*",
        "http://100.68.123.13:*",
        "http://100.108.227.68:*",
        "ws://localhost:*",
        "ws://100.100.83.123:*",
        "wss://100.100.83.123:*"
      ],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'self'"],
      frameAncestors: [
        "'self'",
        "http://localhost:3000",
        "http://100.100.83.123:3000",
        "http://192.168.56.1:3000",
        "http://10.216.125.8:3000",
        "http://10.145.3.8:3000",
        "http://100.68.123.13:3000",
        "http://100.108.227.68:3000"
      ]
    }
  }
}))
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // List of allowed origins
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://100.100.83.123:3000',  // Tailscale IP - Frontend
      'http://100.100.83.123:3001',  // Tailscale IP - Backend
      'http://100.100.83.123:3002',  // Tailscale IP - Backend
      'http://192.168.56.1:3000',
      'http://192.168.56.1:3001',
      'http://192.168.56.1:3002',
      'http://10.216.125.8:3000',
      'http://10.216.125.8:3001',
      'http://10.216.125.8:3002',
      'http://10.145.3.8:3000',      // Additional Tailscale network
      'http://10.145.3.8:3001',
      'http://10.145.3.8:3002',
      'http://100.68.123.13:3000',   // MongoDB server network
      'http://100.68.123.13:3001',
      'http://100.68.123.13:3002',
      'http://100.108.227.68:3000',  // TheHive server network
      'http://100.108.227.68:3001',
      'http://100.108.227.68:3002'
    ];

    // Check if origin matches allowed list or matches Tailscale pattern
    const isTailscaleIP = /^http:\/\/100\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?$/.test(origin);
    const isAllowed = allowedOrigins.includes(origin) || isTailscaleIP;

    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`CORS request blocked from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 86400 // 24 hours
}))
app.use(bodyParser.json({ limit: '50mb' }))
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }))

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)


// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5000, // limit each IP to 5000 requests per windowMs (relaxed for dashboard polling)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
})
app.use('/api/', limiter)

// Test MongoDB connection
app.get('/api/test/db', async (req, res) => {
  try {
    await mongoose.connection.db.command({ ping: 1 });
    res.json({
      status: 'success',
      message: 'MongoDB connection successful!',
      db: {
        name: mongoose.connection.name,
        host: mongoose.connection.host,
        port: mongoose.connection.port,
        collections: await mongoose.connection.db.listCollections().toArray()
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
      connectionString: (process.env.MONGODB_URI || 'mongodb://ML:MLadmin@100.68.123.13:27017/soc_platform?authSource=admin').replace(/\/\/.*@/, '//***:***@')
    });
  }
});

// API Routes
app.use('/api/', (req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  // console.log('Request headers:', req.headers); // Reduce noise
  next();
})

// Define routes

// Define routes
const routes = [
  { path: '/auth', router: authRoutes },
  { path: '/tailscale', router: tailscaleRoutes },
  { path: '/tailscale-protected', router: tailscaleProtectedRoutes },
  { path: '/logs', router: logsRoutes },
  { path: '/events', router: eventsRoutes },
  { path: '/stats', router: statsRoutes },
  { path: '/topology', router: topologyRoutes },
  { path: '/ip', router: ipRoutes },
  { path: '/lookup', router: lookupRoutes },
  { path: '/export', router: exportRoutes },
  { path: '/alerts', router: alertsRoutes },
  { path: '/events', router: eventsRoutes },
  { path: '/profile', router: profileRoutes },
  { path: '/geo', router: geoRoutes },
  { path: '/tailscale-stream', router: tailscaleStreamRoutes },
  { path: '/agents', router: agentRoutes },
  { path: '/cases', router: casesRoutes }
];

// Register all routes
routes.forEach(({ path, router }) => {
  app.use(`${API_PREFIX}${path}`, router);
  console.log(`Registered route: ${API_PREFIX}${path}`);
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() })
})

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!' });
})

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(err.stack)
  res.status(500).json({ error: 'Internal server error' })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' })
})

// Setup WebSocket for real-time Tailscale streaming
const wss = setupTailscaleWebSocket(server)

// Initialize protected WebSocket manager and broadcaster
websocketManager.initialize(wss)
websocketBroadcaster.initialize(wss)

// Start periodic WebSocket updates
websocketBroadcaster.startPeriodicUpdates(30000) // 30 seconds

const httpServer = server.listen(PORT, '0.0.0.0', () => {
  logger.info(`Server running on port ${PORT}`)
  console.log(`🚀 SOC Dashboard Backend running on port ${PORT}`)
  console.log(`🔌 WebSocket server ready for Tailscale live streaming`)
  console.log(`🌐 Accessible on:`)
  console.log(`   Local:     http://localhost:${PORT}`)
  console.log(`   Tailscale: http://100.100.83.123:${PORT}`)
  console.log(`   Network:   http://192.168.56.1:${PORT}`)
  console.log(`   Network:   http://10.145.3.8:${PORT}`)
  console.log(``)
  console.log(`📡 API Endpoints:`)
  console.log(`   http://100.100.83.123:${PORT}/api/test`)
  console.log(`   http://100.100.83.123:${PORT}/health`)
  console.log(``)
  console.log(`🔗 WebSocket:`)
  console.log(`   ws://100.100.83.123:${PORT}/ws/tailscale`)
})

// Graceful shutdown handler
const gracefulShutdown = async (signal) => {
  console.log(`\n📛 Received ${signal}, starting graceful shutdown...`)

  try {
    // Stop periodic WebSocket updates
    websocketBroadcaster.stopPeriodicUpdates()
    console.log('✅ Stopped periodic WebSocket updates')

    // Stop auto-sync service
    if (lockedSyncService.stopAutoSync) {
      lockedSyncService.stopAutoSync()
      console.log('✅ Stopped Tailscale auto-sync')
    }

    // Stop case sync service
    const { stopCaseSync } = await import('./services/caseSync.js')
    stopCaseSync()
    console.log('✅ Stopped TheHive case sync')

    // Close all WebSocket connections
    if (wss && wss.clients) {
      wss.clients.forEach(client => {
        client.close()
      })
      console.log('✅ Closed all WebSocket connections')
    }

    // Close HTTP server
    httpServer.close(() => {
      console.log('✅ HTTP server closed')
    })

    // Close MongoDB connection
    await mongoose.connection.close()
    console.log('✅ MongoDB connection closed')

    // Exit process after cleanup
    setTimeout(() => {
      console.log('🛑 Process exiting')
      process.exit(0)
    }, 1000)

  } catch (error) {
    console.error('❌ Error during shutdown:', error.message)
    process.exit(1)
  }
}

// Handle shutdown signals
process.on('SIGINT', () => gracefulShutdown('SIGINT'))
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))

export default app
