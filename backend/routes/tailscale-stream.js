import express from 'express'
import TailscaleLog from '../models/TailscaleLog.js'

const router = express.Router()

// Store active SSE connections
const sseClients = new Set()

// Polling for new logs
let lastLogId = null
let pollInterval = null

// Start polling when first client connects
function startPolling() {
  if (pollInterval) return
  
  pollInterval = setInterval(async () => {
    try {
      await pollNewLogs()
    } catch (error) {
      console.error('Error polling Tailscale logs:', error)
    }
  }, 5000) // Poll every 5 seconds
}

// Stop polling when no clients connected
function stopPolling() {
  if (pollInterval) {
    clearInterval(pollInterval)
    pollInterval = null
  }
}

// Poll for new logs
async function pollNewLogs() {
  try {
    let query = {}
    
    // If we have a last log ID, fetch logs after it
    if (lastLogId) {
      query = { _id: { $gt: lastLogId } }
    } else {
      // First run: get logs from last 5 minutes
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
      query = { ts: { $gte: fiveMinutesAgo } }
    }

    const newLogs = await TailscaleLog.find(query)
      .sort({ _id: 1 })
      .limit(100)

    if (newLogs.length > 0) {
      // Broadcast each new log
      newLogs.forEach(log => {
        broadcastTailscaleLog(log.toObject())
        lastLogId = log._id
      })

      // Broadcast updated stats
      const stats = await getTailscaleStats()
      broadcastTailscaleStats(stats)
    }
  } catch (error) {
    console.error('Error in pollNewLogs:', error)
  }
}

// Get Tailscale statistics
async function getTailscaleStats() {
  try {
    const stats = await TailscaleLog.aggregate([
      {
        $facet: {
          total: [{ $count: 'count' }],
          byType: [
            { $group: { _id: '$type', count: { $sum: 1 } } }
          ],
          recent: [
            { $sort: { ts: -1 } },
            { $limit: 1 },
            { $project: { ts: 1, type: 1 } }
          ],
          byUser: [
            { $group: { _id: '$user', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
          ]
        }
      }
    ])

    const result = stats[0] || {}

    return {
      timestamp: new Date(),
      total: result.total?.[0]?.count || 0,
      byType: result.byType || [],
      recentLog: result.recent?.[0] || null,
      topUsers: result.byUser || []
    }
  } catch (error) {
    console.error('Error getting Tailscale stats:', error)
    return {
      timestamp: new Date(),
      total: 0,
      byType: [],
      recentLog: null,
      topUsers: []
    }
  }
}

/**
 * GET /api/tailscale/stream
 * Server-Sent Events (SSE) endpoint for real-time Tailscale log streaming
 * 
 * Usage:
 * const eventSource = new EventSource('/api/tailscale/stream')
 * eventSource.onmessage = (event) => {
 *   const log = JSON.parse(event.data)
 *   console.log('New Tailscale log:', log)
 * }
 */
router.get('/stream', (req, res) => {
  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('Access-Control-Allow-Origin', '*')

  // Send initial connection message
  res.write('data: {"type":"connected","message":"Connected to Tailscale stream"}\n\n')

  // Store client connection
  sseClients.add(res)

  // Start polling if this is the first client
  if (sseClients.size === 1) {
    startPolling()
  }

  // Send recent logs to new client
  sendRecentLogs(res)

  // Keep connection alive with heartbeat
  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n')
  }, 30000)

  // Handle client disconnect
  req.on('close', () => {
    clearInterval(heartbeat)
    sseClients.delete(res)
    
    // Stop polling if no more clients
    if (sseClients.size === 0) {
      stopPolling()
    }
    
    res.end()
  })

  req.on('error', () => {
    clearInterval(heartbeat)
    sseClients.delete(res)
    
    // Stop polling if no more clients
    if (sseClients.size === 0) {
      stopPolling()
    }
    
    res.end()
  })
})

/**
 * Send recent Tailscale logs to a client
 */
async function sendRecentLogs(res) {
  try {
    const logs = await TailscaleLog.find()
      .sort({ ts: -1 })
      .limit(10)

    logs.reverse().forEach(log => {
      const event = {
        type: 'log',
        data: log.toObject()
      }
      res.write(`data: ${JSON.stringify(event)}\n\n`)
    })
  } catch (error) {
    console.error('Error sending recent logs:', error)
  }
}

/**
 * Broadcast a new Tailscale log to all connected clients
 */
export function broadcastTailscaleLog(log) {
  const event = {
    type: 'log',
    data: log
  }

  sseClients.forEach(client => {
    try {
      client.write(`data: ${JSON.stringify(event)}\n\n`)
    } catch (error) {
      console.error('Error broadcasting to client:', error)
      sseClients.delete(client)
    }
  })
}

/**
 * Broadcast stats update to all connected clients
 */
export function broadcastTailscaleStats(stats) {
  const event = {
    type: 'stats',
    data: stats
  }

  sseClients.forEach(client => {
    try {
      client.write(`data: ${JSON.stringify(event)}\n\n`)
    } catch (error) {
      console.error('Error broadcasting stats:', error)
      sseClients.delete(client)
    }
  })
}

/**
 * Get number of connected clients
 */
export function getConnectedClients() {
  return sseClients.size
}

/**
 * Close all connections
 */
export function closeAllConnections() {
  sseClients.forEach(client => {
    try {
      client.end()
    } catch (error) {
      console.error('Error closing client:', error)
    }
  })
  sseClients.clear()
}

export default router
