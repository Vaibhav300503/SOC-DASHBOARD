import express from 'express'
import Log from '../models/Log.js'
import { verifyToken } from '../middleware/auth.js'
import { Parser } from 'json2csv'

const router = express.Router()

/**
 * GET /api/export/logs
 * Export logs in CSV or JSON format
 */
router.get('/logs', verifyToken, async (req, res) => {
  try {
    const { format = 'json', severity, log_type, timeRange = '24h', limit = 10000 } = req.query

    // Build query
    let query = {}

    if (severity) {
      query.severity = severity
    }

    if (log_type) {
      query.log_type = log_type
    }

    if (timeRange) {
      const timeMs = {
        '1h': 3600000,
        '6h': 21600000,
        '24h': 86400000,
        '7d': 604800000,
        '30d': 2592000000
      }[timeRange] || 86400000

      const startTime = new Date(Date.now() - timeMs)
      query.timestamp = { $gte: startTime }
    }

    // Fetch logs
    const logs = await Log.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .lean()

    if (format === 'csv') {
      // Convert to CSV
      const fields = [
        'timestamp',
        'source_ip',
        'dest_ip',
        'severity',
        'log_type',
        'endpoint',
        'raw.action',
        'raw.protocol',
        'raw.port'
      ]

      const json2csvParser = new Parser({ fields })
      const csv = json2csvParser.parse(logs)

      res.setHeader('Content-Type', 'text/csv')
      res.setHeader('Content-Disposition', `attachment; filename="logs_${Date.now()}.csv"`)
      res.send(csv)
    } else {
      // JSON format
      res.setHeader('Content-Type', 'application/json')
      res.setHeader('Content-Disposition', `attachment; filename="logs_${Date.now()}.json"`)
      res.json({
        success: true,
        count: logs.length,
        data: logs
      })
    }
  } catch (error) {
    console.error('Export error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

/**
 * GET /api/export/alerts
 * Export alerts
 */
router.get('/alerts', verifyToken, async (req, res) => {
  try {
    const { format = 'json', limit = 5000 } = req.query

    // This would require AlertEvent model - placeholder for now
    const alerts = []

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv')
      res.setHeader('Content-Disposition', `attachment; filename="alerts_${Date.now()}.csv"`)
      res.send('timestamp,severity,title,source_ip,status\n')
    } else {
      res.setHeader('Content-Type', 'application/json')
      res.setHeader('Content-Disposition', `attachment; filename="alerts_${Date.now()}.json"`)
      res.json({
        success: true,
        count: alerts.length,
        data: alerts
      })
    }
  } catch (error) {
    console.error('Export alerts error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

export default router
