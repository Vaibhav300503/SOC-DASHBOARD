import express from 'express'
import Log from '../models/Log.js'
import Event from '../models/Event.js'
import { validateLog, validateLogArray } from '../middleware/validation.js'
import { enrichGeoData, enrichGeoDataBatch } from '../middleware/geoip.js'
import logClassificationMiddleware from '../middleware/logClassification.js'
import severityClassifier from '../utils/severityClassifier.js'
import LogTypeClassifier from '../utils/logTypeClassifier.js'

const router = express.Router()
const classifier = new LogTypeClassifier()

// Helper function to normalize log data
const normalizeLogData = (log) => {
  const doc = log.toObject ? log.toObject() : log;
  return {
    ...doc,
    timestamp: doc.timestamp || doc.ingested_at || doc.created_at || doc.createdAt,
    severity: doc.severity || severityClassifier.classify(doc),
    log_type: doc.log_type || doc.log_source || doc.metadata?.log_source || doc.raw_data?.log_source || 'System',
    endpoint: doc.endpoint || doc.endpoint_name || doc.metadata?.endpoint_name || doc.raw_data?.endpoint_name || doc.hostname || doc.metadata?.hostname || doc.raw_data?.hostname || 'Unknown',
    source_ip: doc.source_ip || doc.src_ip || doc.ip_address || doc.metadata?.ip_address || doc.raw_data?.src_ip || '0.0.0.0',
    dest_ip: doc.dest_ip || doc.dst_ip || doc.raw_data?.dst_ip || '0.0.0.0',
    // Include network fields for display
    protocol: doc.protocol || doc.raw_data?.protocol || null,
    src_port: doc.src_port || doc.raw_data?.src_port || null,
    dst_port: doc.dst_port || doc.raw_data?.dst_port || null,
    status: doc.status || doc.raw_data?.status || null
  }
}

/**
 * GET /api/logs/endpoints/aggregated
 * Get aggregated endpoint data (optimized for topology)
 * Much faster than fetching all logs
 */
router.get('/endpoints/aggregated', async (req, res) => {
  try {
    console.log('📊 Aggregating endpoints from logs...')

    const pipeline = [
      {
        $addFields: {
          endpoint: { $ifNull: ['$endpoint', '$metadata.endpoint_name', '$metadata.hostname', '$raw_data.hostname', 'Unknown'] },
          severity: { $ifNull: ['$severity', 'Low'] }
        }
      },
      {
        $group: {
          _id: '$endpoint',
          endpoint_name: { $first: '$endpoint' },
          hostname: { $first: { $ifNull: ['$metadata.hostname', '$raw_data.hostname', '$endpoint'] } },
          ip_address: { $first: { $ifNull: ['$source_ip', '$ip_address', '$raw_data.ip_address', 'N/A'] } },
          os_type: { $first: { $ifNull: ['$metadata.os_type', '$raw_data.os_type', 'Unknown'] } },
          eventCount: { $sum: 1 },
          criticalCount: { $sum: { $cond: [{ $eq: ['$severity', 'High'] }, 1, 0] } },
          last_seen: { $max: '$timestamp' }
        }
      },
      {
        $sort: { eventCount: -1 }
      },
      {
        $project: {
          _id: 1,
          endpoint_name: 1,
          hostname: 1,
          ip_address: 1,
          os_type: 1,
          eventCount: 1,
          criticalCount: 1,
          last_seen: 1,
          status: {
            $cond: [{ $gt: ['$criticalCount', 0] }, 'degraded', 'active']
          }
        }
      }
    ]

    const endpoints = await Log.aggregate(pipeline)

    console.log(`✅ Aggregated ${endpoints.length} unique endpoints`)

    res.json({
      success: true,
      data: endpoints,
      total: endpoints.length
    })
  } catch (error) {
    console.error('Error aggregating endpoints:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * POST /api/logs/ingest
 * Accept JSON logs from various sources with automatic classification
 */
router.post('/ingest', logClassificationMiddleware.classifyLogs, async (req, res) => {
  try {
    let logs = Array.isArray(req.body) ? req.body : [req.body]

    // Validate array
    const { error: arrayError } = validateLogArray(logs)
    if (arrayError && logs.length > 1) {
      return res.status(400).json({ error: 'Invalid log array format' })
    }

    // Normalize and enrich logs (classification already applied by middleware)
    const normalizedLogs = logs.map(log => {
      const { error, value } = validateLog(log)
      if (error) {
        console.error('Validation error:', error)
        return null
      }

      // Enrich with geolocation
      const enriched = enrichGeoData(value)

      return {
        ...enriched,
        source: log.source || 'api',
        ingested_at: new Date()
      }
    }).filter(Boolean)

    if (normalizedLogs.length === 0) {
      return res.status(400).json({ error: 'No valid logs' })
    }

    // Insert into MongoDB
    const result = await Log.insertMany(normalizedLogs)

    res.json({
      success: true,
      inserted: result.length,
      ids: result.map(r => r._id),
      classification_stats: logClassificationMiddleware.getClassificationStats(normalizedLogs)
    })
  } catch (error) {
    console.error('Log ingest error:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * GET /api/logs
 * Get all logs with optional filtering - Updated to use standardized log types
 */
router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100
    const severity = req.query.severity
    const logType = req.query.logType
    const timeRange = req.query.timeRange || '24h'
    const action = req.query.action
    const sourceIp = req.query.sourceIp
    const destIp = req.query.destIp
    const endpoint = req.query.endpoint
    const page = parseInt(req.query.page) || 1
    const skip = (page - 1) * limit

    // Build aggregation pipeline
    const pipeline = []

    // Initial match conditions
    const initialMatch = {}

    // Time range filter (if specified)
    if (timeRange !== 'all') {
      const hoursMap = {
        '1h': 1,
        '6h': 6,
        '24h': 24,
        '7d': 168,
        '30d': 720
      }
      const hoursAgo = hoursMap[timeRange] || 24
      const since = new Date(Date.now() - hoursAgo * 60 * 60 * 1000)

      initialMatch.$or = [
        { timestamp: { $gte: since } },
        { ingested_at: { $gte: since } },
        { created_at: { $gte: since } },
        { createdAt: { $gte: since } }
      ]
    }

    // Optimize: Apply severity filter EARLY since it's now indexed and populated
    if (severity) {
      initialMatch.severity = severity
    }

    if (Object.keys(initialMatch).length > 0) {
      pipeline.push({ $match: initialMatch })
    }

    // Add field mapping with standardized log types
    pipeline.push({
      $addFields: {
        id: '$_id',
        // Use standardized log_type if available, otherwise classify on-the-fly
        // Check BOTH top-level log_source AND metadata.log_source
        log_type: {
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
        },
        original_log_type: { $ifNull: ['$log_source', '$original_log_type', '$metadata.log_source', 'unknown'] },
        endpoint: { $ifNull: ['$hostname', '$endpoint', '$endpoint_name', '$metadata.endpoint_name', '$metadata.hostname', '$raw_data.hostname', 'Unknown'] },
        // Map src_ip/dst_ip from top level fields 
        source_ip: { $ifNull: ['$source_ip', '$src_ip', '$ip_address', '$metadata.ip_address', '$raw_data.src_ip', 'N/A'] },
        dest_ip: { $ifNull: ['$dest_ip', '$dst_ip', '$raw_data.dst_ip', 'N/A'] },
        // Assign severity - default to Info for null values
        severity: { $ifNull: ['$severity', 'Info'] },
        protocol: { $ifNull: ['$protocol', '$raw_data.protocol', 'N/A'] },
        src_port: { $ifNull: ['$src_port', '$raw_data.src_port', null] },
        dst_port: { $ifNull: ['$dst_port', '$raw_data.dst_port', null] },
        status: { $ifNull: ['$status', '$raw_data.status', 'N/A'] },
        action: { $ifNull: ['$raw_data.status', '$status', '$parsed_data.event_action', 'N/A'] }
      }
    })

    // Apply filters after field mapping
    const matchConditions = {}
    // Severity is handled in initial match for performance
    if (logType) matchConditions.log_type = logType
    if (action) matchConditions.action = action
    if (sourceIp) matchConditions.source_ip = sourceIp
    if (destIp) matchConditions.dest_ip = destIp
    if (endpoint) matchConditions.endpoint = endpoint

    if (Object.keys(matchConditions).length > 0) {
      pipeline.push({ $match: matchConditions })
    }

    // Get total count for pagination (before skip/limit)
    const countPipeline = [...pipeline, { $count: "total" }]
    const countResult = await Log.aggregate(countPipeline)
    const total = countResult.length > 0 ? countResult[0].total : 0

    // Add pagination
    pipeline.push(
      { $sort: { timestamp: -1 } },
      { $skip: skip },
      { $limit: limit }
    )

    // Project final fields
    pipeline.push({
      $project: {
        _id: 1,
        id: 1,
        timestamp: 1,
        severity: 1,
        source_ip: 1,
        dest_ip: 1,
        log_type: 1,
        original_log_type: 1,
        endpoint: 1,
        raw: '$raw_data',
        raw_data: 1,
        metadata: 1,
        geo: 1,
        protocol: 1,
        src_port: 1,
        dst_port: 1,
        status: 1,
        action: 1,
        classification_version: 1,
        classified_at: 1
      }
    })

    const logs = await Log.aggregate(pipeline)

    res.json({
      data: logs,
      total,
      page,
      pages: Math.ceil(total / limit),
      hasMore: page * limit < total
    })
  } catch (error) {
    console.error('Error fetching all logs:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * GET /api/logs/recent
 * Get recent logs - Updated to use standardized log types
 */
router.get('/recent', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 999999, 999999)
    const severity = req.query.severity
    const logType = req.query.logType

    // Build aggregation pipeline
    const pipeline = []

    // Add fields mapping first with standardized log types
    pipeline.push({
      $addFields: {
        id: '$_id',
        // Use standardized log_type if available, otherwise classify on-the-fly
        log_type: {
          $cond: {
            if: { $ne: ['$log_type', null] },
            then: '$log_type',
            else: {
              $switch: {
                branches: [
                  // Authentication
                  { case: { $regexMatch: { input: { $ifNull: ['$metadata.log_source', ''] }, regex: /unified.*auth|windows.*auth|authentication/i } }, then: 'auth' },
                  // Network
                  { case: { $regexMatch: { input: { $ifNull: ['$metadata.log_source', ''] }, regex: /network.*snapshot|network.*monitor|tailscale/i } }, then: 'network' },
                  // Firewall
                  { case: { $regexMatch: { input: { $ifNull: ['$metadata.log_source', ''] }, regex: /firewall/i } }, then: 'firewall' },
                  // Application
                  { case: { $regexMatch: { input: { $ifNull: ['$metadata.log_source', ''] }, regex: /application|nginx|apache|web.*api/i } }, then: 'application' },
                  // Database
                  { case: { $regexMatch: { input: { $ifNull: ['$metadata.log_source', ''] }, regex: /database|sql|mysql|postgres|mongodb/i } }, then: 'database' },
                  // Registry
                  { case: { $regexMatch: { input: { $ifNull: ['$metadata.log_source', ''] }, regex: /registry|reg|hkey/i } }, then: 'registry' },
                  // FIM
                  { case: { $regexMatch: { input: { $ifNull: ['$metadata.log_source', ''] }, regex: /fim|file.*integrity/i } }, then: 'fim' }
                ],
                default: 'system'
              }
            }
          }
        },
        original_log_type: { $ifNull: ['$original_log_type', '$metadata.log_source', 'unknown'] },
        endpoint: { $ifNull: ['$endpoint', '$metadata.endpoint_name', '$metadata.hostname', '$raw_data.hostname', 'Unknown'] },
        source_ip: { $ifNull: ['$ip_address', '$raw_data.src_ip', 'Unknown'] },
        // Assign severity based on stored field
        severity: { $ifNull: ['$severity', 'Low'] },
        protocol: { $ifNull: ['$raw_data.protocol', 'N/A'] },
        port: { $ifNull: ['$raw_data.src_port', 'N/A'] },
        action: { $ifNull: ['$raw_data.status', '$parsed_data.event_action', 'N/A'] }
      }
    })

    // Add filters after field mapping
    const matchConditions = {}

    if (severity) {
      matchConditions.severity = severity
    }

    if (logType) {
      matchConditions.log_type = logType
    }

    if (Object.keys(matchConditions).length > 0) {
      pipeline.push({ $match: matchConditions })
    }

    // Sort and limit
    pipeline.push(
      { $sort: { timestamp: -1 } },
      { $limit: limit }
    )

    // Project final fields
    pipeline.push({
      $project: {
        _id: 1,
        id: 1,
        timestamp: 1,
        severity: 1,
        source_ip: 1,
        dest_ip: 1,
        log_type: 1,
        original_log_type: 1,
        endpoint: 1,
        raw: '$raw_data',
        raw_data: 1,
        metadata: 1,
        geo: 1,
        protocol: 1,
        port: 1,
        action: 1,
        classification_version: 1,
        classified_at: 1
      }
    })

    const logs = await Log.aggregate(pipeline)

    // Get total count for the same filters (without limit)
    const countPipeline = pipeline.slice(0, -2) // Remove sort and limit
    countPipeline.push({ $count: "total" })
    const countResult = await Log.aggregate(countPipeline)
    const total = countResult.length > 0 ? countResult[0].total : 0

    res.json({ data: logs, total })
  } catch (error) {
    console.error('Error fetching recent logs:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * GET /api/logs/geo
 * Get geolocation aggregation for map
 * Supports India-centric filtering
 */
router.get('/geo', async (req, res) => {
  try {
    const timeRange = req.query.timeRange || '24h'
    const country = req.query.country || null // Filter by country (e.g., 'India')
    const severity = req.query.severity || null // Filter by severity

    const hoursMap = {
      '1h': 1,
      '6h': 6,
      '24h': 24,
      '7d': 168,
      '30d': 720
    }
    const hoursAgo = hoursMap[timeRange] || 24

    const since = new Date(Date.now() - hoursAgo * 60 * 60 * 1000)

    // Aggregate from Log collection (raw_logs)
    const logGeoData = await Log.aggregate([
      {
        $addFields: {
          normTimestamp: { $ifNull: ['$timestamp', '$ingested_at', '$createdAt', '$created_at', new Date()] },
          rawSeverity: { $ifNull: ['$severity', '$metadata.severity', '$raw_data.severity', '$raw.severity', 'Low'] },
          normSourceIP: { $ifNull: ['$source_ip', '$ip_address', '$metadata.ip_address', '$raw_data.src_ip', '$raw.source_ip', '$source.ip', '$client.ip', 'Unknown'] }
        }
      },
      {
        $addFields: {
          normSeverity: {
            $switch: {
              branches: [
                { case: { $gte: [{ $indexOfCP: [{ $toLower: { $toString: '$rawSeverity' } }, 'critical'] }, 0] }, then: 'Critical' },
                { case: { $gte: [{ $indexOfCP: [{ $toLower: { $toString: '$rawSeverity' } }, 'high'] }, 0] }, then: 'High' },
                { case: { $gte: [{ $indexOfCP: [{ $toLower: { $toString: '$rawSeverity' } }, 'medium'] }, 0] }, then: 'Medium' },
                { case: { $gte: [{ $indexOfCP: [{ $toLower: { $toString: '$rawSeverity' } }, 'low'] }, 0] }, then: 'Low' }
              ],
              default: 'Low'
            }
          }
        }
      },
      {
        $match: {
          normTimestamp: { $gte: since },
          normSourceIP: { $ne: 'Unknown' }
        }
      },
      {
        $group: {
          _id: {
            country: { $ifNull: ['$geo.country', 'Unknown'] },
            city: { $ifNull: ['$geo.city', 'Unknown'] },
            lat: { $ifNull: ['$geo.lat', '$geo.latitude', 0] },
            lon: { $ifNull: ['$geo.lon', '$geo.longitude', 0] }
          },
          count: { $sum: 1 },
          critical: { $sum: { $cond: [{ $eq: ['$normSeverity', 'Critical'] }, 1, 0] } },
          high: { $sum: { $cond: [{ $eq: ['$normSeverity', 'High'] }, 1, 0] } },
          medium: { $sum: { $cond: [{ $eq: ['$normSeverity', 'Medium'] }, 1, 0] } },
          low: { $sum: { $cond: [{ $eq: ['$normSeverity', 'Low'] }, 1, 0] } }
        }
      }
    ])

    // Aggregate from Event collection
    const eventGeoData = await Event.aggregate([
      {
        $match: {
          '@timestamp': { $gte: since },
          'source.ip': { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: {
            country: { $ifNull: ['$source.geo.country_name', 'Unknown'] },
            city: { $ifNull: ['$source.geo.city_name', 'Unknown'] },
            lat: { $ifNull: ['$source.geo.location.lat', 0] },
            lon: { $ifNull: ['$source.geo.location.lon', 0] }
          },
          count: { $sum: 1 },
          critical: { $sum: { $cond: [{ $eq: ['$event.severity', 'Critical'] }, 1, 0] } },
          high: { $sum: { $cond: [{ $eq: ['$event.severity', 'High'] }, 1, 0] } },
          medium: { $sum: { $cond: [{ $eq: ['$event.severity', 'Medium'] }, 1, 0] } },
          low: { $sum: { $cond: [{ $eq: ['$event.severity', 'Low'] }, 1, 0] } }
        }
      }
    ])

    // Merge the results
    const geoMap = new Map()

    const processResults = (results) => {
      results.forEach(item => {
        const key = `${item._id.country}-${item._id.city}`
        if (!geoMap.has(key)) {
          geoMap.set(key, {
            country: item._id.country,
            city: item._id.city,
            lat: item._id.lat,
            lon: item._id.lon,
            count: 0,
            critical: 0,
            high: 0,
            medium: 0,
            low: 0
          })
        }
        const entry = geoMap.get(key)
        entry.count += item.count
        entry.critical += item.critical
        entry.high += item.high
        entry.medium += item.medium
        entry.low += item.low
      })
    }

    processResults(logGeoData)
    processResults(eventGeoData)

    // Fallback logic if still empty
    if (geoMap.size === 0) {
      // Create some global samples if no data to show something
      geoMap.set('United States-New York', { country: 'United States', city: 'New York', lat: 40.7128, lon: -74.0060, count: 0, critical: 0, high: 0, medium: 0, low: 0 })
      geoMap.set('United Kingdom-London', { country: 'United Kingdom', city: 'London', lat: 51.5074, lon: -0.1278, count: 0, critical: 0, high: 0, medium: 0, low: 0 })
      geoMap.set('Germany-Berlin', { country: 'Germany', city: 'Berlin', lat: 52.5200, lon: 13.4050, count: 0, critical: 0, high: 0, medium: 0, low: 0 })
    }

    res.json({ success: true, data: Array.from(geoMap.values()) })
  } catch (error) {
    console.error('Error fetching geo data:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * GET /api/logs/ip/:ip
 * Get logs for specific IP
 */
router.get('/ip/:ip', async (req, res) => {
  try {
    const { ip } = req.params
    const limit = Math.min(parseInt(req.query.limit) || 100, 1000)
    const timeRange = req.query.timeRange || '24h'
    const hoursAgo = timeRange === '24h' ? 24 : timeRange === '7d' ? 168 : 720

    const since = new Date(Date.now() - hoursAgo * 60 * 60 * 1000)

    const logs = await Log.find({
      $or: [
        { source_ip: ip },
        { dest_ip: ip }
      ],
      timestamp: { $gte: since }
    })
    const normalizedLogs = logs.map(normalizeLogData);

    // Aggregate stats with normalization
    const stats = await Log.aggregate([
      {
        $addFields: {
          normTimestamp: { $ifNull: ['$timestamp', '$ingested_at', '$createdAt', '$created_at', new Date()] },
          rawSeverity: { $ifNull: ['$severity', '$metadata.severity', '$raw_data.severity', '$raw.severity', 'Low'] },
          normSourceIP: { $ifNull: ['$source_ip', '$ip_address', '$metadata.ip_address', '$raw_data.src_ip', '$raw.source_ip', '$source.ip', '$client.ip', 'Unknown'] },
          normDestIP: { $ifNull: ['$dest_ip', '$raw_data.dst_ip', '$raw.dest_ip', '$destination.ip', '$server.ip', 'Unknown'] }
        }
      },
      {
        $addFields: {
          normSeverity: {
            $switch: {
              branches: [
                { case: { $gte: [{ $indexOfCP: [{ $toLower: { $toString: '$rawSeverity' } }, 'critical'] }, 0] }, then: 'Critical' },
                { case: { $gte: [{ $indexOfCP: [{ $toLower: { $toString: '$rawSeverity' } }, 'high'] }, 0] }, then: 'High' },
                { case: { $gte: [{ $indexOfCP: [{ $toLower: { $toString: '$rawSeverity' } }, 'medium'] }, 0] }, then: 'Medium' },
                { case: { $gte: [{ $indexOfCP: [{ $toLower: { $toString: '$rawSeverity' } }, 'low'] }, 0] }, then: 'Low' }
              ],
              default: 'Low'
            }
          }
        }
      },
      {
        $match: {
          $or: [
            { normSourceIP: ip },
            { normDestIP: ip },
            { source_ip: ip },
            { dest_ip: ip },
            { ip_address: ip },
            { 'metadata.ip_address': ip }
          ],
          normTimestamp: { $gte: since }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          critical: { $sum: { $cond: [{ $eq: ['$normSeverity', 'Critical'] }, 1, 0] } },
          high: { $sum: { $cond: [{ $eq: ['$normSeverity', 'High'] }, 1, 0] } },
          medium: { $sum: { $cond: [{ $eq: ['$normSeverity', 'Medium'] }, 1, 0] } },
          low: { $sum: { $cond: [{ $eq: ['$normSeverity', 'Low'] }, 1, 0] } }
        }
      }
    ])

    res.json({
      ip,
      logs: normalizedLogs,
      stats: stats[0] || { total: 0, critical: 0, high: 0, medium: 0, low: 0 }
    })
  } catch (error) {
    console.error('Error fetching IP logs:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * GET /api/logs/severity/:level
 * Get logs by severity
 */
router.get('/severity/:level', async (req, res) => {
  try {
    const { level } = req.params
    const limit = parseInt(req.query.limit) || 100

    // Optimized query using the existing index (severity is now populated)
    const logs = await Log.find({ severity: level })
      .sort({ timestamp: -1 })
      .limit(limit)

    res.json({ data: logs, total: logs.length })
  } catch (error) {
    console.error('Error fetching severity logs:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * GET /api/logs/endpoint/:endpoint
 * Get logs for specific endpoint
 */
router.get('/endpoint/:endpoint', async (req, res) => {
  try {
    const { endpoint } = req.params
    const limit = Math.min(parseInt(req.query.limit) || 100, 1000)
    const timeRange = req.query.timeRange || '24h'
    const hoursAgo = timeRange === '24h' ? 24 : timeRange === '7d' ? 168 : 720

    const since = new Date(Date.now() - hoursAgo * 60 * 60 * 1000)

    const logs = await Log.find({
      $or: [
        { endpoint: endpoint },
        { 'metadata.endpoint_name': endpoint },
        { 'raw_data.endpoint_name': endpoint },
        { 'raw.endpoint': endpoint }
      ],
      $or: [
        { timestamp: { $gte: since } },
        { ingested_at: { $gte: since } },
        { created_at: { $gte: since } },
        { createdAt: { $gte: since } }
      ]
    })
      .sort({ timestamp: -1 })
      .limit(limit)

    const normalizedLogs = logs.map(log => {
      const doc = log.toObject();
      return {
        ...doc,
        timestamp: doc.timestamp || doc.ingested_at || doc.created_at || doc.createdAt,
        severity: doc.severity || doc.metadata?.severity || doc.raw_data?.severity || 'Low',
        log_type: doc.log_type || doc.metadata?.log_source || doc.raw_data?.log_source || 'System',
        endpoint: doc.endpoint || doc.metadata?.endpoint_name || doc.raw_data?.endpoint_name || doc.metadata?.hostname || doc.raw_data?.hostname || 'Unknown',
        source_ip: doc.source_ip || doc.ip_address || doc.metadata?.ip_address || doc.raw_data?.src_ip || '0.0.0.0',
        dest_ip: doc.dest_ip || doc.raw_data?.dst_ip || '0.0.0.0'
      }
    });

    res.json({ data: normalizedLogs })
  } catch (error) {
    console.error('Error fetching endpoint logs:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * GET /api/logs/search
 * Search logs with filters
 */
router.get('/search', async (req, res) => {
  try {
    const {
      severity,
      logType,
      endpoint,
      sourceIp,
      destIp,
      limit = 100,
      offset = 0
    } = req.query

    let query = {}
    if (severity) {
      query.$or = query.$or || []
      query.$or.push({ severity }, { 'metadata.severity': severity }, { 'raw_data.severity': severity }, { 'raw.severity': severity })
    }
    if (logType) {
      query.$or = query.$or || []
      query.$or.push({ log_type: logType }, { 'metadata.log_source': logType }, { 'raw_data.log_source': logType }, { 'raw.log_type': logType })
    }
    if (endpoint) {
      query.$or = query.$or || []
      query.$or.push({ endpoint }, { 'metadata.endpoint_name': endpoint }, { 'raw_data.endpoint_name': endpoint }, { 'raw.endpoint': endpoint })
    }
    if (sourceIp) {
      query.$or = query.$or || []
      query.$or.push({ source_ip: sourceIp }, { ip_address: sourceIp }, { 'metadata.ip_address': sourceIp }, { 'raw_data.src_ip': sourceIp })
    }
    if (destIp) {
      query.$or = query.$or || []
      query.$or.push({ dest_ip: destIp }, { 'raw_data.dst_ip': destIp }, { 'destination.ip': destIp })
    }

    const logs = await Log.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset))

    const total = await Log.countDocuments(query)

    const normalizedLogs = logs.map(log => {
      const doc = log.toObject();
      return {
        ...doc,
        timestamp: doc.timestamp || doc.ingested_at || doc.created_at || doc.createdAt,
        severity: doc.severity || doc.metadata?.severity || doc.raw_data?.severity || 'Low',
        log_type: doc.log_type || doc.metadata?.log_source || doc.raw_data?.log_source || 'System',
        endpoint: doc.endpoint || doc.metadata?.endpoint_name || doc.raw_data?.endpoint_name || doc.metadata?.hostname || doc.raw_data?.hostname || 'Unknown',
        source_ip: doc.source_ip || doc.ip_address || doc.metadata?.ip_address || doc.raw_data?.src_ip || '0.0.0.0',
        dest_ip: doc.dest_ip || doc.raw_data?.dst_ip || '0.0.0.0'
      }
    });

    res.json({ data: normalizedLogs, total })
  } catch (error) {
    console.error('Error searching logs:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * POST /api/logs/registry/ingest
 * Accept registry logs from Windows monitoring
 */
router.post('/registry/ingest', async (req, res) => {
  try {
    const RegistryLog = (await import('../models/RegistryLog.js')).default

    let logs = Array.isArray(req.body) ? req.body : [req.body]

    const registryLogs = logs.map(log => ({
      ...log,
      timestamp: log.timestamp ? new Date(log.timestamp) : new Date(),
      log_type: 'Registry'
    }))

    const insertedLogs = await RegistryLog.insertMany(registryLogs)

    res.json({
      success: true,
      message: `Processed ${insertedLogs.length} registry logs`,
      data: insertedLogs
    })
  } catch (error) {
    console.error('Registry ingestion error:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * GET /api/logs/registry
 * Get registry logs with filtering
 */
router.get('/registry', async (req, res) => {
  try {
    const RegistryLog = (await import('../models/RegistryLog.js')).default

    const {
      severity,
      computer,
      user,
      action,
      limit = 100,
      offset = 0
    } = req.query

    let query = {}
    if (severity) query.severity = severity
    if (computer) query.computer = computer
    if (user) query.user = user
    if (action) query['raw.action'] = action

    const logs = await RegistryLog.find(query)
      .sort({ timestamp: -1 })
      .limit(Math.min(parseInt(limit), 1000))
      .skip(parseInt(offset))

    const total = await RegistryLog.countDocuments(query)

    res.json({ data: logs, total })
  } catch (error) {
    console.error('Error fetching registry logs:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * GET /api/logs/registry/stats
 * Get registry log statistics
 */
router.get('/registry/stats', async (req, res) => {
  try {
    const RegistryLog = (await import('../models/RegistryLog.js')).default

    const stats = await Promise.all([
      RegistryLog.countDocuments({}),
      RegistryLog.countDocuments({ severity: 'Critical' }),
      RegistryLog.countDocuments({ severity: 'High' }),
      RegistryLog.countDocuments({ severity: 'Medium' }),
      RegistryLog.countDocuments({ severity: 'Low' }),
      RegistryLog.aggregate([
        { $group: { _id: '$raw.action', count: { $sum: 1 } } }
      ])
    ])

    res.json({
      total: stats[0],
      critical: stats[1],
      high: stats[2],
      medium: stats[3],
      low: stats[4],
      actionBreakdown: stats[5]
    })
  } catch (error) {
    console.error('Error fetching registry stats:', error)
    res.status(500).json({ error: error.message })
  }
})

export default router

