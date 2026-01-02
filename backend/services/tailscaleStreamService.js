import TailscaleLog from '../models/TailscaleLog.js'

/**
 * Tailscale Stream Service
 * Handles real-time streaming of Tailscale logs to connected clients
 */

let lastLogId = null
let pollInterval = null

/**
 * Start polling for new Tailscale logs
 * Falls back to polling if WebSocket/SSE is not available
 */
export function startPolling(intervalMs = 5000) {
  if (pollInterval) {
    console.log('Polling already started')
    return
  }

  console.log(`Starting Tailscale log polling every ${intervalMs}ms`)

  pollInterval = setInterval(async () => {
    try {
      await pollNewLogs()
    } catch (error) {
      console.error('Error polling Tailscale logs:', error)
    }
  }, intervalMs)
}

/**
 * Stop polling for new logs
 */
export function stopPolling() {
  if (pollInterval) {
    clearInterval(pollInterval)
    pollInterval = null
    console.log('Stopped Tailscale log polling')
  }
}

/**
 * Poll for new Tailscale logs since last check
 */
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
      // Update last log ID
      lastLogId = newLogs[newLogs.length - 1]._id
      
      // Note: Broadcasting is handled by tailscale-stream.js route
      // This service just polls and tracks the last log ID
      console.log(`Found ${newLogs.length} new Tailscale logs`)
    }
  } catch (error) {
    console.error('Error in pollNewLogs:', error)
  }
}

/**
 * Get current Tailscale statistics
 */
export async function getTailscaleStats() {
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
 * Get Tailscale logs with optional filtering
 */
export async function getTailscaleLogs(filters = {}) {
  try {
    const {
      type,
      user,
      limit = 100,
      offset = 0,
      timeRange = '24h'
    } = filters

    const hoursMap = {
      '1h': 1,
      '6h': 6,
      '24h': 24,
      '7d': 168,
      '30d': 720
    }
    const hoursAgo = hoursMap[timeRange] || 24
    const since = new Date(Date.now() - hoursAgo * 60 * 60 * 1000)

    let query = { ts: { $gte: since } }
    if (type) query.type = type
    if (user) query.user = user

    const logs = await TailscaleLog.find(query)
      .sort({ ts: -1 })
      .skip(offset)
      .limit(Math.min(limit, 1000))

    const total = await TailscaleLog.countDocuments(query)

    return {
      data: logs,
      total,
      offset,
      limit,
      hasMore: offset + limit < total
    }
  } catch (error) {
    console.error('Error getting Tailscale logs:', error)
    return {
      data: [],
      total: 0,
      offset: 0,
      limit: 0,
      hasMore: false
    }
  }
}

/**
 * Get Tailscale device activity
 */
export async function getDeviceActivity(deviceId, timeRange = '24h') {
  try {
    const hoursMap = {
      '1h': 1,
      '6h': 6,
      '24h': 24,
      '7d': 168,
      '30d': 720
    }
    const hoursAgo = hoursMap[timeRange] || 24
    const since = new Date(Date.now() - hoursAgo * 60 * 60 * 1000)

    const activity = await TailscaleLog.find({
      $or: [
        { node_id: deviceId },
        { src: deviceId },
        { dst: deviceId }
      ],
      ts: { $gte: since }
    })
      .sort({ ts: -1 })
      .limit(100)

    return activity
  } catch (error) {
    console.error('Error getting device activity:', error)
    return []
  }
}

/**
 * Get Tailscale user sessions
 */
export async function getUserSessions(timeRange = '24h') {
  try {
    const hoursMap = {
      '1h': 1,
      '6h': 6,
      '24h': 24,
      '7d': 168,
      '30d': 720
    }
    const hoursAgo = hoursMap[timeRange] || 24
    const since = new Date(Date.now() - hoursAgo * 60 * 60 * 1000)

    const sessions = await TailscaleLog.aggregate([
      {
        $match: {
          user: { $exists: true, $ne: null },
          ts: { $gte: since }
        }
      },
      {
        $group: {
          _id: '$user',
          count: { $sum: 1 },
          lastSeen: { $max: '$ts' },
          types: { $push: '$type' }
        }
      },
      { $sort: { lastSeen: -1 } }
    ])

    return sessions
  } catch (error) {
    console.error('Error getting user sessions:', error)
    return []
  }
}

export default {
  startPolling,
  stopPolling,
  getTailscaleStats,
  getTailscaleLogs,
  getDeviceActivity,
  getUserSessions
}
