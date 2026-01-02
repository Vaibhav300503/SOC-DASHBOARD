import { WebSocketServer } from 'ws';
import jwt from 'jsonwebtoken';
import secureConfig from '../config/secureConfig.js';
import secureLogger from '../middleware/secureLogger.js';
import authMiddleware from '../middleware/authMiddleware.js';

class WebSocketManager {
  constructor() {
    this.wss = null;
    this.clients = new Map(); // Use Map instead of Set for better tracking
    this.heartbeatInterval = null;
    this.messageQueue = new Map(); // Queue messages for disconnected clients
    this.throttleMap = new Map(); // Track message throttling
    this.stats = {
      totalConnections: 0,
      activeConnections: 0,
      messagesSent: 0,
      messagesQueued: 0,
      errors: 0
    };
  }

  // Initialize WebSocket server with authentication
  initialize(server) {
    this.wss = new WebSocketServer({ 
      server, 
      path: '/ws/tailscale',
      verifyClient: this.verifyClient.bind(this)
    });
    
    this.setupEventHandlers();
    this.startHeartbeat();
    this.startCleanup();
    
    secureLogger.info('WebSocket server initialized', {
      path: '/ws/tailscale',
      maxConnections: process.env.WS_MAX_CONNECTIONS || 1000
    });
    
    return this.wss;
  }

  // Verify client authentication during handshake
  verifyClient(info) {
    try {
      const token = this.extractTokenFromRequest(info.req);
      
      if (!token) {
        secureLogger.logSecurityEvent('WebSocket connection rejected - No token', {
          ip: info.req.socket.remoteAddress,
          userAgent: info.req.headers['user-agent']
        });
        return false;
      }

      // Verify JWT token
      const decoded = jwt.verify(token, secureConfig.JWT_SECRET);
      
      // Add user info to request for later use
      info.req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
        permissions: decoded.permissions || []
      };
      
      return true;
      
    } catch (error) {
      secureLogger.logSecurityEvent('WebSocket authentication failed', {
        ip: info.req.socket.remoteAddress,
        error: error.message,
        userAgent: info.req.headers['user-agent']
      });
      
      return false;
    }
  }

  // Extract token from WebSocket request
  extractTokenFromRequest(req) {
    // Try query parameter
    if (req.url && req.url.includes('token=')) {
      const urlParams = new URLSearchParams(req.url.split('?')[1]);
      return urlParams.get('token');
    }
    
    // Try Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    
    return null;
  }

  // Setup WebSocket event handlers
  setupEventHandlers() {
    this.wss.on('connection', (ws, req) => {
      this.handleConnection(ws, req);
    });
    
    this.wss.on('error', (error) => {
      secureLogger.error('WebSocket server error', {
        error: error.message,
        stack: error.stack
      });
      this.stats.errors++;
    });
  }

  // Handle new WebSocket connection
  handleConnection(ws, req) {
    const clientId = this.generateClientId();
    const user = req.user;
    
    // Check connection limits
    if (this.clients.size >= (process.env.WS_MAX_CONNECTIONS || 1000)) {
      secureLogger.warn('WebSocket connection rejected - Server full', {
        ip: req.socket.remoteAddress,
        currentConnections: this.clients.size
      });
      
      ws.close(1013, 'Server overloaded');
      return;
    }
    
    // Store client with metadata
    const clientData = {
      id: clientId,
      ws,
      user,
      ip: req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
      connectedAt: Date.now(),
      lastPing: Date.now(),
      messageCount: 0,
      isAlive: true
    };
    
    this.clients.set(clientId, clientData);
    
    // Setup client event handlers
    this.setupClientHandlers(clientId, ws);
    
    // Send welcome message with recent data
    this.sendWelcomeMessage(clientId);
    
    // Update stats
    this.stats.totalConnections++;
    this.stats.activeConnections = this.clients.size;
    
    secureLogger.info('WebSocket client connected', {
      clientId,
      userId: user.id,
      role: user.role,
      ip: req.socket.remoteAddress,
      totalConnections: this.stats.activeConnections
    });
  }

  // Setup event handlers for individual client
  setupClientHandlers(clientId, ws) {
    ws.on('message', (data) => {
      this.handleMessage(clientId, data);
    });
    
    ws.on('pong', () => {
      const client = this.clients.get(clientId);
      if (client) {
        client.lastPing = Date.now();
        client.isAlive = true;
      }
    });
    
    ws.on('close', (code, reason) => {
      this.handleDisconnection(clientId, code, reason);
    });
    
    ws.on('error', (error) => {
      secureLogger.error('WebSocket client error', {
        clientId,
        error: error.message
      });
      this.handleDisconnection(clientId, 1011, 'Client error');
    });
  }

  // Handle incoming messages from clients
  handleMessage(clientId, data) {
    try {
      const client = this.clients.get(clientId);
      if (!client) return;
      
      // Update message count
      client.messageCount++;
      
      // Parse message
      const message = JSON.parse(data.toString());
      
      // Throttle messages if too frequent
      if (!this.checkMessageThrottle(clientId)) {
        secureLogger.warn('WebSocket message throttled', {
          clientId,
          messageCount: client.messageCount
        });
        return;
      }
      
      // Handle different message types
      switch (message.type) {
        case 'ping':
          this.sendToClient(clientId, { type: 'pong', timestamp: Date.now() });
          break;
          
        case 'subscribe':
          this.handleSubscription(clientId, message.channels || []);
          break;
          
        case 'unsubscribe':
          this.handleUnsubscription(clientId, message.channels || []);
          break;
          
        default:
          secureLogger.warn('Unknown WebSocket message type', {
            clientId,
            messageType: message.type
          });
      }
      
    } catch (error) {
      secureLogger.error('WebSocket message handling error', {
        clientId,
        error: error.message
      });
    }
  }

  // Check if client is sending too many messages
  checkMessageThrottle(clientId) {
    const client = this.clients.get(clientId);
    if (!client) return false;
    
    const now = Date.now();
    const windowMs = 60000; // 1 minute
    const maxMessages = 60; // Max 60 messages per minute
    
    if (!client.messageWindowStart) {
      client.messageWindowStart = now;
      client.messageWindowCount = 0;
    }
    
    // Reset window if expired
    if (now - client.messageWindowStart > windowMs) {
      client.messageWindowStart = now;
      client.messageWindowCount = 0;
    }
    
    client.messageWindowCount++;
    
    return client.messageWindowCount <= maxMessages;
  }

  // Handle client disconnection
  handleDisconnection(clientId, code, reason) {
    const client = this.clients.get(clientId);
    if (!client) return;
    
    // Log disconnection
    secureLogger.info('WebSocket client disconnected', {
      clientId,
      userId: client.user.id,
      code,
      reason: reason.toString(),
      duration: Date.now() - client.connectedAt,
      messageCount: client.messageCount
    });
    
    // Remove client
    this.clients.delete(clientId);
    this.throttleMap.delete(clientId);
    
    // Update stats
    this.stats.activeConnections = this.clients.size;
    
    // Cleanup client data
    if (client.ws) {
      client.ws.removeAllListeners();
    }
  }

  // Send welcome message with recent data
  async sendWelcomeMessage(clientId) {
    try {
      // Get recent Tailscale data
      const recentData = await this.getRecentData();
      
      this.sendToClient(clientId, {
        type: 'welcome',
        data: recentData,
        timestamp: Date.now()
      });
      
    } catch (error) {
      secureLogger.error('Failed to send welcome message', {
        clientId,
        error: error.message
      });
    }
  }

  // Get recent data for new connections
  async getRecentData() {
    // This would fetch recent Tailscale data from MongoDB
    // For now, return a placeholder
    return {
      recentActivity: [],
      deviceStats: {
        totalDevices: 0,
        onlineDevices: 0
      }
    };
  }

  // Send message to specific client
  sendToClient(clientId, message) {
    const client = this.clients.get(clientId);
    if (!client || client.ws.readyState !== client.ws.OPEN) {
      return false;
    }
    
    try {
      const messageStr = JSON.stringify(message);
      client.ws.send(messageStr);
      
      this.stats.messagesSent++;
      return true;
      
    } catch (error) {
      secureLogger.error('Failed to send message to client', {
        clientId,
        error: error.message
      });
      
      // Mark client as potentially disconnected
      client.isAlive = false;
      return false;
    }
  }

  // Broadcast message to all clients with filtering
  broadcast(message, filter = null) {
    let sentCount = 0;
    let failedCount = 0;
    
    for (const [clientId, client] of this.clients) {
      // Apply filter if provided
      if (filter && !this.clientMatchesFilter(client, filter)) {
        continue;
      }
      
      if (this.sendToClient(clientId, message)) {
        sentCount++;
      } else {
        failedCount++;
      }
    }
    
    secureLogger.debug('Message broadcasted', {
      messageType: message.type,
      sentCount,
      failedCount,
      totalClients: this.clients.size
    });
    
    return { sentCount, failedCount };
  }

  // Check if client matches filter criteria
  clientMatchesFilter(client, filter) {
    if (filter.role && client.user.role !== filter.role) {
      return false;
    }
    
    if (filter.userId && client.user.id !== filter.userId) {
      return false;
    }
    
    if (filter.permissions && !filter.permissions.some(perm => 
      client.user.permissions.includes(perm)
    )) {
      return false;
    }
    
    return true;
  }

  // Start heartbeat/ping-pong mechanism
  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      for (const [clientId, client] of this.clients) {
        if (!client.isAlive) {
          secureLogger.warn('Terminating inactive WebSocket client', {
            clientId,
            lastPing: client.lastPing
          });
          
          client.ws.terminate();
          this.handleDisconnection(clientId, 1000, 'Inactive');
          continue;
        }
        
        client.isAlive = false;
        
        if (client.ws.readyState === client.ws.OPEN) {
          client.ws.ping();
        }
      }
    }, 30000); // 30 seconds
  }

  // Start cleanup process
  startCleanup() {
    setInterval(() => {
      // Clean up message queues
      for (const [clientId, queue] of this.messageQueue) {
        if (!this.clients.has(clientId)) {
          this.messageQueue.delete(clientId);
        }
      }
      
      // Clean up throttle data
      for (const [clientId, throttle] of this.throttleMap) {
        if (!this.clients.has(clientId)) {
          this.throttleMap.delete(clientId);
        }
      }
      
    }, 60000); // 1 minute
  }

  // Generate unique client ID
  generateClientId() {
    return `ws_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get server statistics
  getStats() {
    return {
      ...this.stats,
      activeConnections: this.clients.size,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage()
    };
  }

  // Graceful shutdown
  shutdown() {
    secureLogger.info('Shutting down WebSocket server...');
    
    // Stop heartbeat
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    
    // Close all connections
    for (const [clientId, client] of this.clients) {
      client.ws.close(1001, 'Server shutdown');
    }
    
    // Close server
    if (this.wss) {
      this.wss.close();
    }
    
    secureLogger.info('WebSocket server shutdown complete');
  }
}

export default new WebSocketManager();
