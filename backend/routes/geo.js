import express from 'express'
import Log from '../models/Log.js'
import Event from '../models/Event.js'
import { enrichIPWithGeo, enrichIPsBatch } from '../services/geoEnrichment.js'

const router = express.Router()

/**
 * GET /api/geo/logs
 * Get all logs with geolocation data as GeoJSON
 * Enriches IPs with geo data from cache or external API
 */
router.get('/logs', async (req, res) => {
  try {
    const timeRange = req.query.timeRange || '24h'
    const country = req.query.country || null
    const limit = Math.min(parseInt(req.query.limit) || 1000, 5000)

    const hoursMap = {
      '1h': 1,
      '6h': 6,
      '24h': 24,
      '7d': 168,
      '30d': 720
    }
    const hoursAgo = hoursMap[timeRange] || 24
    const since = new Date(Date.now() - hoursAgo * 60 * 60 * 1000)

    // Build query
    let query = { timestamp: { $gte: since } }
    if (country) {
      query['geo.country'] = country
    }

    // Fetch logs with source and dest IPs
    const logs = await Log.find(query)
      .select('source_ip dest_ip timestamp severity log_type endpoint raw')
      .limit(limit)
      .sort({ timestamp: -1 })

    if (logs.length === 0) {
      return res.json({
        success: true,
        type: 'FeatureCollection',
        features: [],
        stats: {
          total: 0,
          enriched: 0,
          failed: 0
        }
      })
    }

    // Collect unique IPs
    const ips = new Set()
    logs.forEach(log => {
      if (log.source_ip) ips.add(log.source_ip)
      if (log.dest_ip) ips.add(log.dest_ip)
    })

    // Batch enrich IPs
    const ipArray = Array.from(ips)
    const geoDataMap = new Map()
    const enrichedGeo = await enrichIPsBatch(ipArray)
    
    enrichedGeo.forEach((geo, idx) => {
      geoDataMap.set(ipArray[idx], geo)
    })

    // Convert logs to GeoJSON features
    const features = []
    let enrichedCount = 0
    let failedCount = 0

    logs.forEach(log => {
      // Create feature for source IP
      if (log.source_ip && geoDataMap.has(log.source_ip)) {
        const geo = geoDataMap.get(log.source_ip)
        if (geo.latitude !== 0 || geo.longitude !== 0) {
          features.push({
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [geo.longitude, geo.latitude]
            },
            properties: {
              ip: log.source_ip,
              type: 'source',
              country: geo.country,
              city: geo.city,
              severity: log.severity,
              logType: log.log_type,
              timestamp: log.timestamp,
              endpoint: log.endpoint,
              isp: geo.isp,
              asn: geo.asn,
              isVPN: geo.is_vpn,
              isProxy: geo.is_proxy,
              isTor: geo.is_tor,
              source: geo.source
            }
          })
          enrichedCount++
        }
      }

      // Create feature for dest IP
      if (log.dest_ip && geoDataMap.has(log.dest_ip)) {
        const geo = geoDataMap.get(log.dest_ip)
        if (geo.latitude !== 0 || geo.longitude !== 0) {
          features.push({
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [geo.longitude, geo.latitude]
            },
            properties: {
              ip: log.dest_ip,
              type: 'destination',
              country: geo.country,
              city: geo.city,
              severity: log.severity,
              logType: log.log_type,
              timestamp: log.timestamp,
              endpoint: log.endpoint,
              isp: geo.isp,
              asn: geo.asn,
              isVPN: geo.is_vpn,
              isProxy: geo.is_proxy,
              isTor: geo.is_tor,
              source: geo.source
            }
          })
          enrichedCount++
        }
      }
    })

    res.json({
      success: true,
      type: 'FeatureCollection',
      features,
      stats: {
        total: logs.length,
        enriched: enrichedCount,
        failed: logs.length * 2 - enrichedCount
      }
    })
  } catch (error) {
    console.error('Error fetching geo logs:', error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

/**
 * GET /api/geo/summary
 * Get geolocation summary aggregated by country/city
 */
router.get('/summary', async (req, res) => {
  try {
    const timeRange = req.query.timeRange || '24h'
    const country = req.query.country || null

    const hoursMap = {
      '1h': 1,
      '6h': 6,
      '24h': 24,
      '7d': 168,
      '30d': 720
    }
    const hoursAgo = hoursMap[timeRange] || 24
    const since = new Date(Date.now() - hoursAgo * 60 * 60 * 1000)

    // Build match query
    let matchQuery = { timestamp: { $gte: since } }
    if (country) {
      matchQuery['geo.country'] = country
    }

    // Aggregate by country and city
    const summary = await Log.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: {
            country: '$geo.country',
            city: '$geo.city',
            lat: '$geo.lat',
            lon: '$geo.lon'
          },
          count: { $sum: 1 },
          critical: {
            $sum: { $cond: [{ $eq: ['$severity', 'Critical'] }, 1, 0] }
          },
          high: {
            $sum: { $cond: [{ $eq: ['$severity', 'High'] }, 1, 0] }
          },
          medium: {
            $sum: { $cond: [{ $eq: ['$severity', 'Medium'] }, 1, 0] }
          },
          low: {
            $sum: { $cond: [{ $eq: ['$severity', 'Low'] }, 1, 0] }
          }
        }
      },
      {
        $project: {
          _id: 0,
          country: '$_id.country',
          city: '$_id.city',
          lat: '$_id.lat',
          lon: '$_id.lon',
          count: 1,
          critical: 1,
          high: 1,
          medium: 1,
          low: 1
        }
      },
      { $sort: { count: -1 } }
    ])

    res.json({
      success: true,
      data: summary
    })
  } catch (error) {
    console.error('Error fetching geo summary:', error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

/**
 * GET /api/geo/ip/:ip
 * Get geolocation data for a specific IP
 */
router.get('/ip/:ip', async (req, res) => {
  try {
    const { ip } = req.params

    const geoData = await enrichIPWithGeo(ip)

    res.json({
      success: true,
      data: geoData
    })
  } catch (error) {
    console.error('Error fetching geo data for IP:', error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

/**
 * POST /api/geo/batch
 * Batch enrich multiple IPs with geolocation
 */
router.post('/batch', async (req, res) => {
  try {
    const { ips } = req.body

    if (!Array.isArray(ips) || ips.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'ips array required'
      })
    }

    const { enrichIPsBatch } = await import('../services/geoEnrichment.js')
    const geoData = await enrichIPsBatch(ips)

    res.json({
      success: true,
      data: geoData
    })
  } catch (error) {
    console.error('Error batch enriching IPs:', error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

export default router
