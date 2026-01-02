import express from 'express'
import Event from '../models/Event.js'

const router = express.Router()

/**
 * GET /api/events/recent
 * Get recent events from MongoDB
 */
router.get('/recent', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 100, 1000)
    const action = req.query.action
    const host = req.query.host

    let query = {}
    if (action) query['event.action'] = action
    if (host) query['host.name'] = host

    const events = await Event.find(query)
      .sort({ '@timestamp': -1 })
      .limit(limit)

    // Transform events to match frontend expected format
    const transformedEvents = events.map(event => ({
      id: event._id,
      timestamp: event['@timestamp'],
      source_ip: event.source?.ip || event.client?.ip,
      dest_ip: event.destination?.ip || event.server?.ip,
      source_port: event.source?.port || event.client?.port,
      dest_port: event.destination?.port || event.server?.port,
      protocol: event.network?.transport || 'unknown',
      action: event.event?.action || 'unknown',
      user: event.user?.name || 'unknown',
      process: event.process?.name || 'unknown',
      host: event.host?.name || 'unknown',
      bytes: event.network?.bytes || 0,
      packets: event.network?.packets || 0,
      duration: event.event?.duration || 0,
      category: event.event?.category?.[0] || 'network',
      tags: event.tags || [],
      severity: getSeverityFromEvent(event),
      message: `${event.event?.action || 'Unknown'} from ${event.source?.ip || event.client?.ip} to ${event.destination?.ip || event.server?.ip}`,
      raw: event
    }))

    res.json({ 
      data: transformedEvents, 
      total: transformedEvents.length 
    })
  } catch (error) {
    console.error('Error fetching recent events:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * GET /api/events/stats
 * Get event statistics
 */
router.get('/stats', async (req, res) => {
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

    const stats = await Event.aggregate([
      {
        $match: {
          '@timestamp': { $gte: since }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          unique_ips: { $addToSet: '$source.ip' },
          unique_hosts: { $addToSet: '$host.name' },
          actions: { $addToSet: '$event.action' },
          total_bytes: { $sum: '$network.bytes' },
          total_packets: { $sum: '$network.packets' },
          critical: {
            $sum: { $cond: [{ $eq: [{ $ifNull: ['$event.action', ''] }, 'connection_denied'] }, 1, 0] }
          },
          high: {
            $sum: { $cond: [{ $in: ['$event.action', ['file_open', 'process_executed']] }, 1, 0] }
          }
        }
      }
    ])

    const result = stats[0] || {
      total: 0,
      unique_ips: [],
      unique_hosts: [],
      actions: [],
      total_bytes: 0,
      total_packets: 0,
      critical: 0,
      high: 0
    }

    res.json({
      total: result.total,
      unique_ips: result.unique_ips.length,
      unique_hosts: result.unique_hosts.length,
      actions: result.actions.length,
      total_bytes: result.total_bytes,
      total_packets: result.total_packets,
      critical: result.critical,
      high: result.high,
      medium: result.total - result.critical - result.high
    })
  } catch (error) {
    console.error('Error fetching event stats:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * GET /api/events/topology
 * Get network topology data from events
 */
router.get('/topology', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 1000, 5000)
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

    const events = await Event.find({
      '@timestamp': { $gte: since },
      'source.ip': { $exists: true },
      'destination.ip': { $exists: true }
    })
      .sort({ '@timestamp': -1 })
      .limit(limit)

    // Build topology data
    const connections = []
    const ipStats = new Map()

    events.forEach(event => {
      const sourceIp = event.source?.ip || event.client?.ip
      const destIp = event.destination?.ip || event.server?.ip

      if (sourceIp && destIp && sourceIp !== destIp) {
        const connection = {
          source: sourceIp,
          target: destIp,
          value: event.network?.bytes || 1,
          action: event.event?.action || 'unknown',
          timestamp: event['@timestamp'],
          severity: getSeverityFromEvent(event)
        }
        connections.push(connection)

        // Update IP stats
        if (!ipStats.has(sourceIp)) {
          ipStats.set(sourceIp, { connections: 0, bytes: 0, severity: 'Normal' })
        }
        if (!ipStats.has(destIp)) {
          ipStats.set(destIp, { connections: 0, bytes: 0, severity: 'Normal' })
        }

        ipStats.get(sourceIp).connections++
        ipStats.get(sourceIp).bytes += event.network?.bytes || 1
        ipStats.get(destIp).connections++
        ipStats.get(destIp).bytes += event.network?.bytes || 1

        // Update severity
        const severity = getSeverityFromEvent(event)
        if (severity === 'Critical' || severity === 'High') {
          ipStats.get(sourceIp).severity = severity
          ipStats.get(destIp).severity = severity
        }
      }
    })

    res.json({
      connections,
      nodes: Array.from(ipStats.entries()).map(([ip, stats]) => ({
        id: ip,
        connections: stats.connections,
        bytes: stats.bytes,
        severity: stats.severity
      })),
      total: connections.length
    })
  } catch (error) {
    console.error('Error fetching topology data:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * GET /api/events/ip/:ip
 * Get events for specific IP
 */
router.get('/ip/:ip', async (req, res) => {
  try {
    const { ip } = req.params
    const limit = Math.min(parseInt(req.query.limit) || 100, 1000)
    const timeRange = req.query.timeRange || '24h'
    const hoursAgo = timeRange === '24h' ? 24 : timeRange === '7d' ? 168 : 720

    const since = new Date(Date.now() - hoursAgo * 60 * 60 * 1000)

    const events = await Event.find({
      $or: [
        { 'source.ip': ip },
        { 'destination.ip': ip },
        { 'client.ip': ip },
        { 'server.ip': ip }
      ],
      '@timestamp': { $gte: since }
    })
      .sort({ '@timestamp': -1 })
      .limit(limit)

    // Aggregate stats
    const stats = await Event.aggregate([
      {
        $match: {
          $or: [
            { 'source.ip': ip },
            { 'destination.ip': ip },
            { 'client.ip': ip },
            { 'server.ip': ip }
          ],
          '@timestamp': { $gte: since }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          unique_targets: { $addToSet: '$destination.ip' },
          total_bytes: { $sum: '$network.bytes' },
          actions: { $addToSet: '$event.action' },
          critical: {
            $sum: { $cond: [{ $eq: [{ $ifNull: ['$event.action', ''] }, 'connection_denied'] }, 1, 0] }
          },
          high: {
            $sum: { $cond: [{ $in: ['$event.action', ['file_open', 'process_executed']] }, 1, 0] }
          }
        }
      }
    ])

    const result = stats[0] || {
      total: 0,
      unique_targets: [],
      total_bytes: 0,
      actions: [],
      critical: 0,
      high: 0
    }

    res.json({
      ip,
      events: events.map(event => ({
        id: event._id,
        timestamp: event['@timestamp'],
        source_ip: event.source?.ip || event.client?.ip,
        dest_ip: event.destination?.ip || event.server?.ip,
        action: event.event?.action || 'unknown',
        host: event.host?.name || 'unknown',
        bytes: event.network?.bytes || 0,
        severity: getSeverityFromEvent(event),
        raw: event
      })),
      stats: {
        total: result.total,
        unique_targets: result.unique_targets.length,
        total_bytes: result.total_bytes,
        actions: result.actions.length,
        critical: result.critical,
        high: result.high,
        medium: result.total - result.critical - result.high
      }
    })
  } catch (error) {
    console.error('Error fetching IP events:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * GET /api/events/search
 * Search events with filters
 */
router.get('/search', async (req, res) => {
  try {
    const {
      action,
      host,
      sourceIp,
      destIp,
      protocol,
      limit = 100,
      offset = 0
    } = req.query

    let query = {}
    if (action) query['event.action'] = action
    if (host) query['host.name'] = host
    if (sourceIp) query['source.ip'] = sourceIp
    if (destIp) query['destination.ip'] = destIp
    if (protocol) query['network.transport'] = protocol

    const events = await Event.find(query)
      .sort({ '@timestamp': -1 })
      .limit(Math.min(parseInt(limit), 1000))
      .skip(parseInt(offset))

    const total = await Event.countDocuments(query)

    res.json({ 
      data: events.map(event => ({
        id: event._id,
        timestamp: event['@timestamp'],
        source_ip: event.source?.ip || event.client?.ip,
        dest_ip: event.destination?.ip || event.server?.ip,
        action: event.event?.action || 'unknown',
        host: event.host?.name || 'unknown',
        protocol: event.network?.transport || 'unknown',
        severity: getSeverityFromEvent(event),
        raw: event
      })),
      total 
    })
  } catch (error) {
    console.error('Error searching events:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * Helper function to determine severity from event
 */
function getSeverityFromEvent(event) {
  const action = event.event?.action || ''
  const tags = event.tags || []
  
  if (action === 'connection_denied' || tags.includes('threat')) {
    return 'Critical'
  } else if (action === 'file_open' || action === 'process_executed' || tags.includes('suspicious')) {
    return 'High'
  } else if (action === 'network_flow') {
    return 'Medium'
  }
  return 'Low'
}

export default router
