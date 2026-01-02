import express from 'express'
import Log from '../models/Log.js'
import TailscaleLog from '../models/TailscaleLog.js'
import Event from '../models/Event.js'
import Agent from '../models/Agent.js'

const router = express.Router()

/**
 * GET /api/stats/dashboard
 * Get dashboard statistics
 */
router.get('/dashboard', async (req, res) => {
  try {
    const timeRange = req.query.timeRange || '24h'
    const hoursMap = {
      '1h': 1,
      '6h': 6,
      '24h': 24,
      '7d': 168,
      '30d': 720
    }
    const hoursAgo = hoursMap[timeRange] || 24
    const since = new Date(Date.now() - hoursAgo * 60 * 60 * 1000)

    // Get data from Log, Event and Agent collections
    const [totalLogs, totalEvents, totalAgents] = await Promise.all([
      Log.countDocuments({
        $or: [
          { timestamp: { $gte: since } },
          { ingested_at: { $gte: since } },
          { createdAt: { $gte: since } },
          { created_at: { $gte: since } }
        ]
      }),
      Event.countDocuments({ '@timestamp': { $gte: since } }),
      Agent.countDocuments()
    ])

    // Severity breakdown from Log collection with normalized fields
    const severityBreakdown = await Log.aggregate([
      {
        $addFields: {
          normTimestamp: { $ifNull: ['$timestamp', '$ingested_at', '$createdAt', '$created_at', new Date()] },
          normSeverity: { $ifNull: ['$severity', '$metadata.severity', '$raw_data.severity', '$raw.severity', 'Unknown'] }
        }
      },
      { $match: { normTimestamp: { $gte: since } } },
      {
        $group: {
          _id: '$normSeverity',
          count: { $sum: 1 }
        }
      }
    ])

    // Event action breakdown from Event collection
    const eventActionBreakdown = await Event.aggregate([
      { $match: { '@timestamp': { $gte: since } } },
      {
        $group: {
          _id: '$event.action',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ])

    // Log type breakdown with normalized fields
    const logTypeBreakdown = await Log.aggregate([
      {
        $addFields: {
          normTimestamp: { $ifNull: ['$timestamp', '$ingested_at', '$createdAt', '$created_at', new Date()] },
          normLogType: { $ifNull: ['$log_type', '$metadata.log_source', '$raw_data.log_source', '$raw.log_type', '$raw.type', 'Unknown'] }
        }
      },
      { $match: { normTimestamp: { $gte: since } } },
      {
        $group: {
          _id: '$normLogType',
          count: { $sum: 1 }
        }
      }
    ])

    // Top endpoints with normalized fields
    const topEndpoints = await Log.aggregate([
      {
        $addFields: {
          normTimestamp: { $ifNull: ['$timestamp', '$ingested_at', '$createdAt', '$created_at', new Date()] },
          normEndpoint: { $ifNull: ['$endpoint', '$metadata.endpoint_name', '$raw_data.endpoint_name', '$raw.endpoint', 'Unknown'] }
        }
      },
      { $match: { normTimestamp: { $gte: since } } },
      {
        $group: {
          _id: '$normEndpoint',
          count: { $sum: 1 }
        }
      },
      { $match: { _id: { $ne: null } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ])

    // Top source IPs from both collections
    const [topSourceIPsFromLogs, topSourceIPsFromEvents] = await Promise.all([
      Log.aggregate([
        {
          $addFields: {
            normTimestamp: { $ifNull: ['$timestamp', '$ingested_at', '$createdAt', '$created_at', new Date()] },
            normSourceIP: {
              $ifNull: ['$source_ip', '$ip_address', '$metadata.ip_address', '$raw_data.src_ip', '$raw.source_ip', '$source.ip', '$client.ip', 'Unknown']
            }
          }
        },
        { $match: { normTimestamp: { $gte: since } } },
        {
          $group: {
            _id: '$normSourceIP',
            count: { $sum: 1 }
          }
        },
        { $match: { _id: { $ne: null } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      Event.aggregate([
        { $match: { '@timestamp': { $gte: since } } },
        {
          $group: {
            _id: { $ifNull: ['$source.ip', '$client.ip', 'Unknown'] },
            count: { $sum: 1 }
          }
        },
        { $match: { _id: { $ne: null } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ])
    ])

    // Merge and sort top source IPs
    const ipMap = new Map()
    topSourceIPsFromLogs.forEach(item => ipMap.set(item._id, (ipMap.get(item._id) || 0) + item.count))
    topSourceIPsFromEvents.forEach(item => ipMap.set(item._id, (ipMap.get(item._id) || 0) + item.count))

    const topSourceIPs = Array.from(ipMap.entries())
      .map(([ip, count]) => ({ _id: ip, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // Get unique hosts from events or agents
    const uniqueHostsFromEvents = await Event.distinct('host.name', { '@timestamp': { $gte: since } })
    const agentsCount = await Agent.countDocuments({ status: 'active' })
    const uniqueHostsCount = Math.max(uniqueHostsFromEvents.length, agentsCount)

    // Get top destination IPs from both collections
    const [topDestIPsFromLogs, topDestIPsFromEvents] = await Promise.all([
      Log.aggregate([
        {
          $addFields: {
            normTimestamp: { $ifNull: ['$timestamp', '$ingested_at', '$createdAt', '$created_at', new Date()] },
            normDestIP: {
              $ifNull: ['$dest_ip', '$raw_data.dst_ip', '$raw.dest_ip', '$destination.ip', '$server.ip', 'Unknown']
            }
          }
        },
        { $match: { normTimestamp: { $gte: since } } },
        {
          $group: {
            _id: '$normDestIP',
            count: { $sum: 1 }
          }
        },
        { $match: { _id: { $ne: null } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      Event.aggregate([
        { $match: { '@timestamp': { $gte: since } } },
        {
          $group: {
            _id: { $ifNull: ['$destination.ip', '$server.ip', 'Unknown'] },
            count: { $sum: 1 }
          }
        },
        { $match: { _id: { $ne: null } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ])
    ])

    // Merge and sort top destination IPs
    const destIpMap = new Map()
    topDestIPsFromLogs.forEach(item => destIpMap.set(item._id, (destIpMap.get(item._id) || 0) + item.count))
    topDestIPsFromEvents.forEach(item => destIpMap.set(item._id, (destIpMap.get(item._id) || 0) + item.count))

    const topDestinationIPs = Array.from(destIpMap.entries())
      .map(([ip, count]) => ({ _id: ip, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    res.json({
      totalLogs,
      totalEvents,
      total: totalLogs + totalEvents,
      severityBreakdown,
      eventActionBreakdown,
      logTypeBreakdown,
      topEndpoints,
      topSourceIPs,
      topDestinationIPs,
      uniqueHosts: uniqueHostsCount,
      totalAgents
    })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * GET /api/stats/severity
 * Get severity statistics
 */
router.get('/severity', async (req, res) => {
  try {
    const timeRange = req.query.timeRange || '24h'
    const hoursAgo = timeRange === '24h' ? 24 : timeRange === '7d' ? 168 : 720

    const since = new Date(Date.now() - hoursAgo * 60 * 60 * 1000)

    const stats = await Log.aggregate([
      {
        $addFields: {
          normTimestamp: { $ifNull: ['$timestamp', '$ingested_at', '$createdAt', '$created_at', new Date()] },
          normSeverity: { $ifNull: ['$severity', '$metadata.severity', '$raw_data.severity', '$raw.severity', 'Unknown'] }
        }
      },
      { $match: { normTimestamp: { $gte: since } } },
      {
        $group: {
          _id: '$normSeverity',
          count: { $sum: 1 }
        }
      }
    ])

    res.json({ data: stats })
  } catch (error) {
    console.error('Error fetching severity stats:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * GET /api/stats/timeline
 * Get events timeline
 */
router.get('/timeline', async (req, res) => {
  try {
    const timeRange = req.query.timeRange || '24h'
    const hoursAgo = timeRange === '24h' ? 24 : timeRange === '7d' ? 168 : 720

    const since = new Date(Date.now() - hoursAgo * 60 * 60 * 1000)

    const timeline = await Log.aggregate([
      {
        $addFields: {
          normTimestamp: { $ifNull: ['$timestamp', '$ingested_at', '$createdAt', '$created_at', new Date()] },
          normSeverity: { $ifNull: ['$severity', '$metadata.severity', '$raw_data.severity', '$raw.severity', 'Unknown'] }
        }
      },
      { $match: { normTimestamp: { $gte: since } } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d %H:00', date: '$normTimestamp' }
          },
          count: { $sum: 1 },
          critical: {
            $sum: { $cond: [{ $eq: ['$normSeverity', 'Critical'] }, 1, 0] }
          },
          high: {
            $sum: { $cond: [{ $eq: ['$normSeverity', 'High'] }, 1, 0] }
          }
        }
      },
      { $sort: { _id: 1 } }
    ])

    res.json({ data: timeline })
  } catch (error) {
    console.error('Error fetching timeline:', error)
    res.status(500).json({ error: error.message })
  }
})

export default router
