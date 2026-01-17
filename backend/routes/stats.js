import express from 'express'
import Log from '../models/Log.js'
import TailscaleLog from '../models/TailscaleLog.js'
import Event from '../models/Event.js'
import Agent from '../models/Agent.js'
import Case from '../models/Case.js'
import { STANDARD_LOG_TYPES } from '../config/logTypeMappings.js'

const router = express.Router()

// Helper function to normalize severity values
const normalizeSeverity = (severity) => {
  if (!severity) return 'Info'  // Changed from 'Low' to 'Info'
  const s = String(severity).toLowerCase().trim()
  if (s.includes('critical')) return 'Critical'
  if (s.includes('high')) return 'High'
  if (s.includes('medium')) return 'Medium'
  if (s.includes('info')) return 'Info'
  if (s.includes('low')) return 'Low'
  return 'Info'
}

/**
 * GET /api/stats/dashboard
 * Get dashboard statistics - FIXED to use MongoDB as single source of truth
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

    // Get total counts from all collections
    const [totalLogs, totalEvents, totalCases, totalAgents] = await Promise.all([
      timeRange === 'all' ? Log.countDocuments({}) : Log.countDocuments({
        $or: [
          { timestamp: { $gte: since } },
          { ingested_at: { $gte: since } },
          { createdAt: { $gte: since } },
          { created_at: { $gte: since } }
        ]
      }),
      timeRange === 'all' ? Event.countDocuments({}) : Event.countDocuments({ '@timestamp': { $gte: since } }),
      timeRange === 'all' ? Case.countDocuments({}) : Case.countDocuments({ created_at: { $gte: since } }),
      Agent.countDocuments()
    ])

    // Severity breakdown from Log collection with proper field mapping
    const logSeverityPipeline = [
      {
        $addFields: {
          normTimestamp: { $ifNull: ['$timestamp', '$ingested_at', '$createdAt', '$created_at', new Date()] },
          // Assign severity based on stored field - default to Info
          assignedSeverity: { $ifNull: ['$severity', 'Info'] }
        }
      }
    ]

    if (timeRange !== 'all') {
      logSeverityPipeline.push({ $match: { normTimestamp: { $gte: since } } })
    }

    logSeverityPipeline.push({
      $group: {
        _id: '$assignedSeverity',
        count: { $sum: 1 }
      }
    })

    const logSeverityBreakdown = await Log.aggregate(logSeverityPipeline)

    // Severity breakdown from Cases collection
    const caseSeverityQuery = timeRange === 'all' ? {} : { created_at: { $gte: since } }
    const caseSeverityBreakdown = await Case.aggregate([
      { $match: caseSeverityQuery },
      {
        $group: {
          _id: '$severity',
          count: { $sum: 1 }
        }
      }
    ])

    // Merge and normalize severity breakdowns from both logs and cases
    const severityMap = new Map()

    logSeverityBreakdown.forEach(item => {
      const normalized = normalizeSeverity(item._id)
      severityMap.set(normalized, (severityMap.get(normalized) || 0) + item.count)
    })

    caseSeverityBreakdown.forEach(item => {
      const normalized = normalizeSeverity(item._id)
      severityMap.set(normalized, (severityMap.get(normalized) || 0) + item.count)
    })

    const severityBreakdown = Array.from(severityMap.entries()).map(([severity, count]) => ({
      _id: severity,
      count
    }))

    // Event action breakdown from Event collection
    const eventActionQuery = timeRange === 'all' ? {} : { '@timestamp': { $gte: since } }
    const eventActionBreakdown = await Event.aggregate([
      { $match: eventActionQuery },
      {
        $group: {
          _id: '$event.action',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ])

    // Log type breakdown with standardized fields
    const logTypePipeline = [
      {
        $addFields: {
          normTimestamp: { $ifNull: ['$timestamp', '$ingested_at', '$createdAt', '$created_at', new Date()] },
          // Use standardized log_type if available, otherwise classify on-the-fly
          // Check BOTH top-level log_source AND metadata.log_source
          standardizedLogType: {
            $cond: {
              if: { $ne: ['$log_type', null] },
              then: '$log_type',
              else: {
                $switch: {
                  branches: [
                    // Network - check top level log_source first
                    { case: { $regexMatch: { input: { $ifNull: ['$log_source', ''] }, regex: /network.*snapshot|network.*monitor|tailscale/i } }, then: 'Network' },
                    // Authentication
                    { case: { $regexMatch: { input: { $ifNull: ['$log_source', ''] }, regex: /unified.*auth|windows.*auth|authentication/i } }, then: 'Authentication' },
                    // Firewall
                    { case: { $regexMatch: { input: { $ifNull: ['$log_source', ''] }, regex: /firewall/i } }, then: 'Firewall' },
                    // Application
                    { case: { $regexMatch: { input: { $ifNull: ['$log_source', ''] }, regex: /application|nginx|apache|web.*api/i } }, then: 'Application' },
                    // Database
                    { case: { $regexMatch: { input: { $ifNull: ['$log_source', ''] }, regex: /database|sql|mysql|postgres|mongodb/i } }, then: 'Database' },
                    // Registry
                    { case: { $regexMatch: { input: { $ifNull: ['$log_source', ''] }, regex: /registry|reg|hkey/i } }, then: 'Registry' },
                    // FIM
                    { case: { $regexMatch: { input: { $ifNull: ['$log_source', ''] }, regex: /fim|file.*integrity/i } }, then: 'File Integrity' },
                    // Fallback: Check metadata.log_source
                    { case: { $regexMatch: { input: { $ifNull: ['$metadata.log_source', ''] }, regex: /network.*snapshot|network.*monitor|tailscale/i } }, then: 'Network' },
                    { case: { $regexMatch: { input: { $ifNull: ['$metadata.log_source', ''] }, regex: /unified.*auth|windows.*auth|authentication/i } }, then: 'Authentication' },
                    { case: { $regexMatch: { input: { $ifNull: ['$metadata.log_source', ''] }, regex: /firewall/i } }, then: 'Firewall' }
                  ],
                  default: 'System'
                }
              }
            }
          }
        }
      }
    ]

    if (timeRange !== 'all') {
      logTypePipeline.push({ $match: { normTimestamp: { $gte: since } } })
    }

    logTypePipeline.push({
      $group: {
        _id: '$standardizedLogType',
        count: { $sum: 1 }
      }
    })

    const logTypeBreakdown = await Log.aggregate(logTypePipeline)

    // Top endpoints with normalized fields
    const topEndpointsPipeline = [
      {
        $addFields: {
          normTimestamp: { $ifNull: ['$timestamp', '$ingested_at', '$createdAt', '$created_at', new Date()] },
          normEndpoint: { $ifNull: ['$endpoint', '$metadata.endpoint_name', '$raw_data.endpoint_name', '$raw.endpoint', 'Unknown'] }
        }
      }
    ]

    if (timeRange !== 'all') {
      topEndpointsPipeline.push({ $match: { normTimestamp: { $gte: since } } })
    }

    topEndpointsPipeline.push(
      {
        $group: {
          _id: '$normEndpoint',
          count: { $sum: 1 }
        }
      },
      { $match: { _id: { $ne: null } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    )

    const topEndpoints = await Log.aggregate(topEndpointsPipeline)

    // Top source IPs from both collections
    const topSourceIPsFromLogsPipeline = [
      {
        $addFields: {
          normTimestamp: { $ifNull: ['$timestamp', '$ingested_at', '$createdAt', '$created_at', new Date()] },
          normSourceIP: {
            $ifNull: ['$source_ip', '$ip_address', '$metadata.ip_address', '$raw_data.src_ip', '$raw.source_ip', '$source.ip', '$client.ip', 'Unknown']
          }
        }
      }
    ]

    if (timeRange !== 'all') {
      topSourceIPsFromLogsPipeline.push({ $match: { normTimestamp: { $gte: since } } })
    }

    topSourceIPsFromLogsPipeline.push(
      {
        $group: {
          _id: '$normSourceIP',
          count: { $sum: 1 }
        }
      },
      { $match: { _id: { $ne: null } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    )

    const eventSourceIPsQuery = timeRange === 'all' ? {} : { '@timestamp': { $gte: since } }
    const [topSourceIPsFromLogs, topSourceIPsFromEvents] = await Promise.all([
      Log.aggregate(topSourceIPsFromLogsPipeline),
      Event.aggregate([
        { $match: eventSourceIPsQuery },
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
    const uniqueHostsFromEvents = timeRange === 'all'
      ? await Event.distinct('host.name')
      : await Event.distinct('host.name', { '@timestamp': { $gte: since } })
    const agentsCount = await Agent.countDocuments({ status: 'active' })
    const uniqueHostsCount = Math.max(uniqueHostsFromEvents.length, agentsCount)

    // Get top destination IPs from both collections
    const topDestIPsFromLogsPipeline = [
      {
        $addFields: {
          normTimestamp: { $ifNull: ['$timestamp', '$ingested_at', '$createdAt', '$created_at', new Date()] },
          normDestIP: {
            $ifNull: ['$dest_ip', '$raw_data.dst_ip', '$raw.dest_ip', '$destination.ip', '$server.ip', 'Unknown']
          }
        }
      }
    ]

    if (timeRange !== 'all') {
      topDestIPsFromLogsPipeline.push({ $match: { normTimestamp: { $gte: since } } })
    }

    topDestIPsFromLogsPipeline.push(
      {
        $group: {
          _id: '$normDestIP',
          count: { $sum: 1 }
        }
      },
      { $match: { _id: { $ne: null } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    )

    const eventDestIPsQuery = timeRange === 'all' ? {} : { '@timestamp': { $gte: since } }
    const [topDestIPsFromLogs, topDestIPsFromEvents] = await Promise.all([
      Log.aggregate(topDestIPsFromLogsPipeline),
      Event.aggregate([
        { $match: eventDestIPsQuery },
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
      totalCases,
      total: totalLogs + totalEvents + totalCases,
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
 * Get severity statistics - FIXED to use MongoDB as single source of truth
 */
router.get('/severity', async (req, res) => {
  try {
    const timeRange = req.query.timeRange || '24h'
    const hoursAgo = timeRange === '24h' ? 24 : timeRange === '7d' ? 168 : 720

    const pipeline = [
      {
        $addFields: {
          normTimestamp: { $ifNull: ['$timestamp', '$ingested_at', '$createdAt', '$created_at', new Date()] },
          // Assign severity based on stored field - default to Info
          assignedSeverity: { $ifNull: ['$severity', 'Info'] }
        }
      }
    ]

    if (timeRange !== 'all') {
      const since = new Date(Date.now() - hoursAgo * 60 * 60 * 1000)
      pipeline.push({ $match: { normTimestamp: { $gte: since } } })
    }

    pipeline.push({
      $group: {
        _id: '$assignedSeverity',
        count: { $sum: 1 }
      }
    })

    const stats = await Log.aggregate(pipeline)

    // Normalize severity values
    const normalizedStats = stats.map(item => ({
      _id: normalizeSeverity(item._id),
      count: item.count
    }))

    res.json({ data: normalizedStats })
  } catch (error) {
    console.error('Error fetching severity stats:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * GET /api/stats/timeline
 * Get events timeline - FIXED to use MongoDB as single source of truth
 */
router.get('/timeline', async (req, res) => {
  try {
    const timeRange = req.query.timeRange || '24h'
    const hoursAgo = timeRange === '24h' ? 24 : timeRange === '7d' ? 168 : 720

    const pipeline = [
      {
        $addFields: {
          normTimestamp: { $ifNull: ['$timestamp', '$ingested_at', '$createdAt', '$created_at', new Date()] },
          // Assign severity based on stored field - default to Info
          assignedSeverity: { $ifNull: ['$severity', 'Info'] }
        }
      }
    ]

    if (timeRange !== 'all') {
      const since = new Date(Date.now() - hoursAgo * 60 * 60 * 1000)
      pipeline.push({ $match: { normTimestamp: { $gte: since } } })
    }

    pipeline.push(
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d %H:00', date: '$normTimestamp' }
          },
          count: { $sum: 1 },
          critical: {
            $sum: { $cond: [{ $eq: ['$assignedSeverity', 'Critical'] }, 1, 0] }
          },
          high: {
            $sum: { $cond: [{ $eq: ['$assignedSeverity', 'High'] }, 1, 0] }
          },
          medium: {
            $sum: { $cond: [{ $eq: ['$assignedSeverity', 'Medium'] }, 1, 0] }
          },
          low: {
            $sum: { $cond: [{ $eq: ['$assignedSeverity', 'Low'] }, 1, 0] }
          }
        }
      },
      { $sort: { _id: 1 } }
    )

    const timeline = await Log.aggregate(pipeline)

    res.json({ data: timeline })
  } catch (error) {
    console.error('Error fetching timeline:', error)
    res.status(500).json({ error: error.message })
  }
})

export default router
