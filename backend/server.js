import express from 'express'
import { createServer } from 'http'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import rateLimit from 'express-rate-limit'
import bodyParser from 'body-parser'
import winston from 'winston'

// Load environment variables
dotenv.config()

// Create Express app
const app = express()
const server = createServer(app)
const PORT = process.env.PORT || 3001

// Import database connection
import connectDB from './config/db.js'

// Import Tailscale sync service (protected version)
import lockedSyncService from './services/tailscaleSyncLocked.js'

// Connect to MongoDB
connectDB()

// Start Tailscale auto-sync (only if API key is configured)
if (process.env.TAILSCALE_API_KEY) {
  lockedSyncService.startAutoSync();
} else {
  console.log('⚠️  TAILSCALE_API_KEY not found - Tailscale sync disabled');
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
app.use(helmet())
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://100.100.83.123:3000',
    'http://192.168.56.1:3000',
    'http://10.216.125.8:3000'
  ],
  credentials: true
}))
app.use(bodyParser.json({ limit: '50mb' }))
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }))

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
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
      connectionString: 'mongodb://ML:MLadmin@100.68.123.13:27017/soc_platform?authSource=admin'
    });
  }
});

// API Routes
const API_PREFIX = '/api';

// Apply rate limiting to all API routes
app.use(API_PREFIX, (req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

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
  { path: '/agents', router: agentRoutes }
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
  console.log(`   http://localhost:${PORT}`)
  console.log(`   http://100.100.83.123:${PORT}`)
  console.log(`   http://192.168.56.1:${PORT}`)
  console.log(`   http://10.216.125.8:${PORT}`)
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
