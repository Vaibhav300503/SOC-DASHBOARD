import express from 'express'
import Log from '../models/Log.js'
import { verifyToken, requireRole } from '../middleware/auth.js'

const router = express.Router()

/**
 * GET /api/topology
 * Get network topology graph data
 * Uses topology_coords and topology_edges from MongoDB
 */
router.get('/', verifyToken, async (req, res) => {
  try {
    const { timeRange = '24h', minFlows = 1 } = req.query

    const db = req.app.locals.db
    const topologyCoordsColl = db.collection('topology_coords')
    const topologyEdgesColl = db.collection('topology_edges')

    // Try to get from topology collections first
    let nodes = await topologyCoordsColl.find({}).toArray()
    let edges = await topologyEdgesColl.find({}).toArray()

    // If no topology data, generate from logs
    if (nodes.length === 0 || edges.length === 0) {
      // Convert time range to milliseconds
      const timeMs = {
        '1h': 3600000,
        '6h': 21600000,
        '24h': 86400000,
        '7d': 604800000,
        '30d': 2592000000
      }[timeRange] || 86400000

      const startTime = new Date(Date.now() - timeMs)

      // Aggregation pipeline to build topology from logs
      const pipeline = [
        {
          $addFields: {
            normTimestamp: { $ifNull: ['$timestamp', '$ingested_at', '$createdAt', '$created_at', new Date()] },
            normSeverity: { $ifNull: ['$severity', '$metadata.severity', '$raw_data.severity', '$raw.severity', 'Low'] },
            normSourceIP: { $ifNull: ['$source_ip', '$ip_address', '$metadata.ip_address', '$raw_data.src_ip', '$raw.source_ip', '$source.ip', '$client.ip', 'Unknown'] },
            normDestIP: { $ifNull: ['$dest_ip', '$raw_data.dst_ip', '$raw.dest_ip', '$destination.ip', '$server.ip', 'Unknown'] },
            normBytes: { $ifNull: [{ $add: ['$raw.bytes_in', '$raw.bytes_out'] }, '$raw.bytes', '$metadata.bytes', '$raw_data.bytes', 0] },
            normProtocol: { $ifNull: ['$raw.protocol', '$metadata.protocol', '$raw_data.protocol', 'TCP'] }
          }
        },
        {
          $match: {
            normTimestamp: { $gte: startTime }
          }
        },
        {
          $group: {
            _id: {
              source: '$normSourceIP',
              dest: '$normDestIP'
            },
            bytes: { $sum: '$normBytes' },
            flows: { $sum: 1 },
            severity: { $max: '$normSeverity' },
            protocols: { $push: '$normProtocol' },
            lastSeen: { $max: '$normTimestamp' }
          }
        },
        {
          $match: {
            flows: { $gte: parseInt(minFlows) }
          }
        },
        {
          $sort: { flows: -1 }
        }
      ]

      const logEdges = await Log.aggregate(pipeline)

      // Extract unique IPs and build nodes
      const nodeMap = new Map()

      logEdges.forEach(edge => {
        if (!nodeMap.has(edge._id.source)) {
          nodeMap.set(edge._id.source, {
            node: edge._id.source,
            type: isInternalIP(edge._id.source) ? 'internal' : 'external',
            coords: { x: Math.random() * 400, y: Math.random() * 400 },
            alerts: 0,
            meta: {}
          })
        }
        if (!nodeMap.has(edge._id.dest)) {
          nodeMap.set(edge._id.dest, {
            node: edge._id.dest,
            type: isInternalIP(edge._id.dest) ? 'internal' : 'external',
            coords: { x: Math.random() * 400, y: Math.random() * 400 },
            alerts: 0,
            meta: {}
          })
        }
      })

      nodes = Array.from(nodeMap.values())
      edges = logEdges.map(edge => ({
        source: edge._id.source,
        target: edge._id.dest,
        bytes: edge.bytes,
        flows: edge.flows,
        severity: mapSeverity(edge.severity)
      }))
    } else {
      // Format edges from topology collection
      edges = edges.map(edge => ({
        source: edge.source,
        target: edge.target,
        bytes: edge.bytes || 0,
        flows: edge.flows || 0,
        severity: edge.severity || 'LOW'
      }))
    }

    res.json({
      success: true,
      nodes: nodes.length > 0 ? nodes : [],
      edges: edges.length > 0 ? edges : [],
      stats: {
        totalNodes: nodes.length,
        totalEdges: edges.length,
        totalFlows: edges.reduce((sum, e) => sum + (e.flows || 0), 0),
        totalBytes: edges.reduce((sum, e) => sum + (e.bytes || 0), 0),
        timeRange,
        generatedAt: new Date()
      }
    })
  } catch (error) {
    console.error('Topology error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to get topology data',
      nodes: [],
      edges: []
    })
  }
})

/**
 * GET /api/topology/node/:ip
 * Get details for a specific node
 */
router.get('/node/:ip', verifyToken, async (req, res) => {
  try {
    const { ip } = req.params
    const { timeRange = '24h' } = req.query

    const timeMs = {
      '1h': 3600000,
      '6h': 21600000,
      '24h': 86400000,
      '7d': 604800000,
      '30d': 2592000000
    }[timeRange] || 86400000

    const startTime = new Date(Date.now() - timeMs)

    // Get logs for this IP (as source or dest)
    const logs = await Log.find({
      $or: [
        { source_ip: ip },
        { dest_ip: ip },
        { ip_address: ip },
        { 'metadata.ip_address': ip },
        { 'raw_data.src_ip': ip },
        { 'raw_data.dst_ip': ip }
      ],
      $or: [
        { timestamp: { $gte: startTime } },
        { ingested_at: { $gte: startTime } },
        { created_at: { $gte: startTime } },
        { createdAt: { $gte: startTime } }
      ]
    })
      .sort({ timestamp: -1 })
      .limit(100)

    const normalizedLogs = logs.map(log => {
      const doc = log.toObject();
      return {
        ...doc,
        timestamp: doc.timestamp || doc.ingested_at || doc.created_at || doc.createdAt,
        severity: doc.severity || doc.metadata?.severity || doc.raw_data?.severity || 'Low',
        log_type: doc.log_type || doc.metadata?.log_source || doc.raw_data?.log_source || 'System',
        endpoint: doc.endpoint || doc.metadata?.endpoint_name || doc.raw_data?.endpoint_name || 'Unknown',
        source_ip: doc.source_ip || doc.ip_address || doc.metadata?.ip_address || doc.raw_data?.src_ip || '0.0.0.0',
        dest_ip: doc.dest_ip || doc.raw_data?.dst_ip || '0.0.0.0'
      }
    });

    // Get connections
    const outbound = await Log.aggregate([
      {
        $match: {
          source_ip: ip,
          timestamp: { $gte: startTime }
        }
      },
      {
        $group: {
          _id: '$dest_ip',
          flows: { $sum: 1 },
          bytes: { $sum: { $add: ['$raw.bytes_in', '$raw.bytes_out'] } }
        }
      },
      { $sort: { flows: -1 } },
      { $limit: 10 }
    ])

    const inbound = await Log.aggregate([
      {
        $match: {
          dest_ip: ip,
          timestamp: { $gte: startTime }
        }
      },
      {
        $group: {
          _id: '$source_ip',
          flows: { $sum: 1 },
          bytes: { $sum: { $add: ['$raw.bytes_in', '$raw.bytes_out'] } }
        }
      },
      { $sort: { flows: -1 } },
      { $limit: 10 }
    ])

    // Get severity breakdown
    const severity = await Log.aggregate([
      {
        $match: {
          $or: [
            { source_ip: ip },
            { dest_ip: ip }
          ],
          timestamp: { $gte: startTime }
        }
      },
      {
        $group: {
          _id: '$severity',
          count: { $sum: 1 }
        }
      }
    ])

    res.json({
      success: true,
      ip,
      type: isInternalIP(ip) ? 'inside' : 'outside',
      stats: {
        totalLogs: logs.length,
        outbound,
        inbound,
        severity
      },
      recentLogs: logs.slice(0, 20)
    })
  } catch (error) {
    console.error('Node details error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to get node details'
    })
  }
})

/**
 * GET /api/topology/stats
 * Get topology statistics
 */
router.get('/stats', verifyToken, async (req, res) => {
  try {
    const { timeRange = '24h' } = req.query

    const timeMs = {
      '1h': 3600000,
      '6h': 21600000,
      '24h': 86400000,
      '7d': 604800000,
      '30d': 2592000000
    }[timeRange] || 86400000

    const startTime = new Date(Date.now() - timeMs)

    // Get stats with normalization
    const aggregation = await Log.aggregate([
      {
        $addFields: {
          normTimestamp: { $ifNull: ['$timestamp', '$ingested_at', '$createdAt', '$created_at', new Date()] },
          normProtocol: { $ifNull: ['$raw.protocol', '$metadata.protocol', '$raw_data.protocol', 'TCP'] },
          normEndpoint: { $ifNull: ['$endpoint', '$metadata.endpoint_name', '$raw_data.endpoint_name', 'Unknown'] },
          normSourceIP: { $ifNull: ['$source_ip', '$ip_address', '$metadata.ip_address', '$raw_data.src_ip', 'Unknown'] },
          normDestIP: { $ifNull: ['$dest_ip', '$raw_data.dst_ip', 'Unknown'] }
        }
      },
      {
        $match: { normTimestamp: { $gte: startTime } }
      },
      {
        $facet: {
          totals: [
            { $count: 'count' }
          ],
          uniqueSources: [
            { $group: { _id: '$normSourceIP' } },
            { $count: 'count' }
          ],
          uniqueDestinations: [
            { $group: { _id: '$normDestIP' } },
            { $count: 'count' }
          ],
          topProtocols: [
            { $group: { _id: '$normProtocol', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
          ],
          topEndpoints: [
            { $group: { _id: '$normEndpoint', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
          ]
        }
      }
    ])

    const result = aggregation[0]

    res.json({
      success: true,
      stats: {
        totalLogs: result.totals[0]?.count || 0,
        uniqueSourceIPs: result.uniqueSources[0]?.count || 0,
        uniqueDestIPs: result.uniqueDestinations[0]?.count || 0,
        topProtocols: result.topProtocols,
        topEndpoints: result.topEndpoints,
        timeRange
      }
    })
  } catch (error) {
    console.error('Stats error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to get topology stats'
    })
  }
})

/**
 * Helper function to check if IP is internal
 */
function isInternalIP(ip) {
  const internalRanges = [
    /^10\./,
    /^172\.(1[6-9]|2[0-9]|3[01])\./,
    /^192\.168\./,
    /^127\./,
    /^localhost$/i
  ]
  return internalRanges.some(range => range.test(ip))
}

/**
 * GET /api/topology/india
 * Get India-centric network topology
 * Filters for India-based IPs and connections
 */
router.get('/india', verifyToken, async (req, res) => {
  try {
    const { timeRange = '24h', minFlows = 1 } = req.query

    // Convert time range to milliseconds
    const timeMs = {
      '1h': 3600000,
      '6h': 21600000,
      '24h': 86400000,
      '7d': 604800000,
      '30d': 2592000000
    }[timeRange] || 86400000

    const startTime = new Date(Date.now() - timeMs)

    // Aggregation pipeline for India-focused topology
    const pipeline = [
      {
        $match: {
          timestamp: { $gte: startTime },
          // Filter for India-based connections
          $or: [
            { 'geo.country': 'India' },
            { 'source_geo.country': 'India' },
            { 'dest_geo.country': 'India' }
          ]
        }
      },
      {
        $group: {
          _id: {
            source: '$source_ip',
            dest: '$dest_ip'
          },
          bytes: { $sum: { $add: ['$raw.bytes_in', '$raw.bytes_out'] } },
          flows: { $sum: 1 },
          severity: { $max: '$severity' },
          protocols: { $push: '$raw.protocol' },
          lastSeen: { $max: '$timestamp' }
        }
      },
      {
        $match: {
          flows: { $gte: parseInt(minFlows) }
        }
      }
    ]

    const edges = await Log.aggregate(pipeline)

    // Build nodes from edges
    const nodeMap = new Map()
    edges.forEach(edge => {
      const { source, dest } = edge._id

      if (!nodeMap.has(source)) {
        nodeMap.set(source, {
          id: source,
          type: isInternalIP(source) ? 'internal' : 'external',
          inbound: 0,
          outbound: 0,
          alerts: 0,
          severity: 'Low'
        })
      }

      if (!nodeMap.has(dest)) {
        nodeMap.set(dest, {
          id: dest,
          type: isInternalIP(dest) ? 'internal' : 'external',
          inbound: 0,
          outbound: 0,
          alerts: 0,
          severity: 'Low'
        })
      }

      const sourceNode = nodeMap.get(source)
      const destNode = nodeMap.get(dest)

      sourceNode.outbound += edge.flows
      destNode.inbound += edge.flows
      sourceNode.severity = edge.severity
      destNode.severity = edge.severity
    })

    const nodes = Array.from(nodeMap.values())

    res.json({
      success: true,
      nodes,
      edges: edges.map(e => ({
        source: e._id.source,
        target: e._id.dest,
        flows: e.flows,
        bytes: e.bytes,
        severity: e.severity,
        protocols: [...new Set(e.protocols)],
        lastSeen: e.lastSeen
      })),
      stats: {
        nodeCount: nodes.length,
        edgeCount: edges.length,
        timeRange,
        timezone: 'Asia/Kolkata'
      }
    })
  } catch (error) {
    console.error('Error fetching India topology:', error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

/**
 * Helper function to map severity to color
 */
function mapSeverity(severity) {
  const severityMap = {
    'Critical': 'red',
    'High': 'orange',
    'Medium': 'yellow',
    'Low': 'green'
  }
  return severityMap[severity] || 'gray'
}

export default router
