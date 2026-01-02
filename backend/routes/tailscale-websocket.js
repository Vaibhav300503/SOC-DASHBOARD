import express from 'express'
import { createServer } from 'http'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import rateLimit from 'express-rate-limit'
import bodyParser from 'body-parser'
import winston from 'winston'
import WebSocket from 'ws'
import TailscaleLog from '../models/TailscaleLog.js'
import { verifyTailscaleSignature } from '../middleware/hmac.js'
import { validateTailscaleLog } from '../middleware/validation.js'

// Import WebSocket server
import { WebSocketServer } from 'ws';

const router = express.Router()

// WebSocket clients for real-time streaming
const wsClients = new Set()

// WebSocket server for real-time updates
export const setupTailscaleWebSocket = (server) => {
  const wss = new WebSocketServer({ server, path: '/ws/tailscale' })
  
  wss.on('connection', (ws, req) => {
    console.log(' Tailscale WebSocket client connected')
    wsClients.add(ws)
    
    // Send recent logs on connection
    sendRecentLogs(ws)
    
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message)
        console.log(' Received WebSocket message:', data)
      } catch (error) {
        console.error(' Invalid WebSocket message:', error)
      }
    })
    
    ws.on('close', () => {
      console.log(' Tailscale WebSocket client disconnected')
      wsClients.delete(ws)
    })
    
    ws.on('error', (error) => {
      console.error(' WebSocket error:', error)
      wsClients.delete(ws)
    })
  })
  
  return wss
}

// Broadcast new logs to all WebSocket clients
const broadcastToClients = (logData) => {
  const message = JSON.stringify({
    type: 'tailscale_log',
    data: logData,
    timestamp: new Date().toISOString()
  })
  
  wsClients.forEach(client => {
    if (client.readyState === client.OPEN) {
      try {
        client.send(message)
      } catch (error) {
        console.error(' Failed to send to client:', error)
        wsClients.delete(client)
      }
    }
  })
}

// Send recent logs to newly connected client
const sendRecentLogs = async (ws) => {
  try {
    const recentLogs = await TailscaleLog.find()
      .sort({ ts: -1 })
      .limit(20)
    
    const message = JSON.stringify({
      type: 'tailscale_recent',
      data: recentLogs,
      timestamp: new Date().toISOString()
    })
    
    if (ws.readyState === ws.OPEN) {
      ws.send(message)
    }
  } catch (error) {
    console.error('❌ Failed to send recent logs:', error)
  }
}

// Broadcast dashboard updates to all clients
const broadcastDashboardUpdate = (updateType, data) => {
  const message = JSON.stringify({
    type: 'update',
    payload: {
      type: updateType,
      ...data,
      timestamp: new Date().toISOString()
    }
  })
  
  wsClients.forEach(client => {
    if (client.readyState === client.OPEN) {
      try {
        client.send(message)
      } catch (error) {
        console.error(' Failed to send dashboard update:', error)
        wsClients.delete(client)
      }
    }
  })
}

// Export functions for use in other modules
export { broadcastToClients, broadcastDashboardUpdate }

/**
 * POST /api/tailscale/ingest
 * Accept Tailscale audit log stream
 */
router.post('/ingest', verifyTailscaleSignature, async (req, res) => {
  try {
    const logs = Array.isArray(req.body) ? req.body : [req.body]

    // Validate and normalize logs
    const normalizedLogs = logs.map(log => {
      const { error, value } = validateTailscaleLog(log)
      if (error) {
        console.error('Validation error:', error)
        return null
      }
      return {
        ...value,
        source: 'audit_stream',
        ingested_at: new Date()
      }
    }).filter(Boolean)

    if (normalizedLogs.length === 0) {
      return res.status(400).json({ error: 'No valid logs' })
    }

    // Insert into MongoDB
    const result = await TailscaleLog.insertMany(normalizedLogs)

    // Broadcast to WebSocket clients for real-time updates
    result.forEach(log => {
      broadcastToClients(log)
      
      // Also broadcast as activity update
      broadcastDashboardUpdate('activity', {
        activity: {
          _id: log._id,
          type: log.action || 'Tailscale Event',
          user: log.user || 'system',
          ts: log.ts || new Date(),
          details: log.description || `${log.action} event`
        }
      })
    })

    res.json({
      success: true,
      inserted: result.length,
      ids: result.map(r => r._id)
    })
  } catch (error) {
    console.error('Tailscale ingest error:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * POST /api/tailscale/agent
 * Accept logs from local Tailscale agent
 */
router.post('/agent', async (req, res) => {
  try {
    const logs = Array.isArray(req.body) ? req.body : [req.body]

    const normalizedLogs = logs.map(log => ({
      ts: new Date(log.ts || Date.now()),
      type: log.type || 'device_updated',
      node_id: log.node_id,
      user: log.user,
      src: log.src,
      dst: log.dst,
      event: log.event,
      raw: log.raw,
      source: log.source || 'live_stream',
      ingested_at: new Date()
    }))

    const result = await TailscaleLog.insertMany(normalizedLogs)

    // Broadcast to WebSocket clients for real-time updates
    result.forEach(log => {
      broadcastToClients(log)
    })

    res.json({
      success: true,
      inserted: result.length
    })
  } catch (error) {
    console.error('Tailscale agent error:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * GET /api/tailscale/recent
 * Get recent Tailscale logs
 */
router.get('/recent', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 100, 1000)
    const type = req.query.type

    let query = {}
    if (type) query.type = type

    const logs = await TailscaleLog.find(query)
      .sort({ ts: -1 })
      .limit(limit)

    res.json({ data: logs, total: logs.length })
  } catch (error) {
    console.error('Error fetching recent logs:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * GET /api/tailscale/stats
 * Get Tailscale statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const timeRange = req.query.timeRange || '24h'
    const hoursAgo = timeRange === '24h' ? 24 : timeRange === '7d' ? 168 : 720

    const since = new Date(Date.now() - hoursAgo * 60 * 60 * 1000)

    // Active devices
    const activeDevices = await TailscaleLog.distinct('node_id', {
      ts: { $gte: since },
      type: { $in: ['peer_connected', 'device_updated'] }
    })

    // Active users
    const activeUsers = await TailscaleLog.distinct('user', {
      ts: { $gte: since }
    })

    // Peer connections
    const peerConnections = await TailscaleLog.countDocuments({
      ts: { $gte: since },
      type: 'peer_connected'
    })

    // Allowed/Denied events
    const allowedEvents = await TailscaleLog.countDocuments({
      ts: { $gte: since },
      status: 'success'
    })

    const deniedEvents = await TailscaleLog.countDocuments({
      ts: { $gte: since },
      status: 'failed'
    })

    // Events per hour
    const eventsPerHour = await TailscaleLog.aggregate([
      {
        $match: { ts: { $gte: since } }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d %H:00', date: '$ts' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ])

    // Event types distribution
    const eventTypes = await TailscaleLog.aggregate([
      {
        $match: { ts: { $gte: since } }
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ])

    res.json({
      activeDevices: activeDevices.length,
      activeUsers: activeUsers.length,
      peerConnections,
      allowedEvents,
      deniedEvents,
      eventsPerHour,
      eventTypes
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * GET /api/tailscale/events/:type
 * Get events by type
 */
router.get('/events/:type', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 100, 1000)
    const { type } = req.params

    const logs = await TailscaleLog.find({ type })
      .sort({ ts: -1 })
      .limit(limit)

    res.json({ data: logs })
  } catch (error) {
    console.error('Error fetching events:', error)
    res.status(500).json({ error: error.message })
  }
})

export default router
