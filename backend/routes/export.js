import express from 'express'
import { verifyToken } from '../middleware/auth.js'
import Log from '../models/Log.js'
import Event from '../models/Event.js'

const router = express.Router()

/**
 * GET /api/export/logs/csv
 * Export logs as CSV
 */
router.get('/logs/csv', verifyToken, async (req, res) => {
  try {
    const { timeRange = '24h', limit = 1000 } = req.query

    const hoursMap = {
      '1h': 1,
      '6h': 6,
      '24h': 24,
      '7d': 168,
      '30d': 720
    }
    const hoursAgo = hoursMap[timeRange] || 24
    const since = new Date(Date.now() - hoursAgo * 60 * 60 * 1000)

    const logs = await Log.find({ timestamp: { $gte: since } })
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .lean()

    if (!logs || logs.length === 0) {
      return res.json({ success: true, data: 'No logs found', format: 'csv' })
    }

    // Convert to CSV
    const headers = ['timestamp', 'source_ip', 'dest_ip', 'severity', 'log_type', 'endpoint']
    const csvRows = [headers.join(',')]

    logs.forEach(log => {
      const row = [
        log.timestamp?.toISOString() || '',
        log.source_ip || '',
        log.dest_ip || '',
        log.severity || '',
        log.log_type || '',
        log.endpoint || ''
      ]
      csvRows.push(row.map(v => `"${v}"`).join(','))
    })

    const csv = csvRows.join('\n')

    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', 'attachment; filename="logs.csv"')
    res.send(csv)
  } catch (error) {
    console.error('Export logs CSV error:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * GET /api/export/logs/json
 * Export logs as JSON
 */
router.get('/logs/json', verifyToken, async (req, res) => {
  try {
    const { timeRange = '24h', limit = 1000 } = req.query

    const hoursMap = {
      '1h': 1,
      '6h': 6,
      '24h': 24,
      '7d': 168,
      '30d': 720
    }
    const hoursAgo = hoursMap[timeRange] || 24
    const since = new Date(Date.now() - hoursAgo * 60 * 60 * 1000)

    const logs = await Log.find({ timestamp: { $gte: since } })
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .lean()

    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Content-Disposition', 'attachment; filename="logs.json"')
    res.json({
      success: true,
      exportedAt: new Date().toISOString(),
      count: logs?.length || 0,
      data: logs || []
    })
  } catch (error) {
    console.error('Export logs JSON error:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * GET /api/export/events/csv
 * Export events as CSV
 */
router.get('/events/csv', verifyToken, async (req, res) => {
  try {
    const { timeRange = '24h', limit = 1000 } = req.query

    const hoursMap = {
      '1h': 1,
      '6h': 6,
      '24h': 24,
      '7d': 168,
      '30d': 720
    }
    const hoursAgo = hoursMap[timeRange] || 24
    const since = new Date(Date.now() - hoursAgo * 60 * 60 * 1000)

    const events = await Event.find({ '@timestamp': { $gte: since } })
      .sort({ '@timestamp': -1 })
      .limit(parseInt(limit))
      .lean()

    if (!events || events.length === 0) {
      return res.json({ success: true, data: 'No events found', format: 'csv' })
    }

    // Convert to CSV
    const headers = ['timestamp', 'host', 'source_ip', 'dest_ip', 'action', 'severity']
    const csvRows = [headers.join(',')]

    events.forEach(event => {
      const row = [
        event['@timestamp']?.toISOString() || '',
        event.host?.name || '',
        event.source?.ip || '',
        event.destination?.ip || '',
        event.event?.action || '',
        event.event?.severity || ''
      ]
      csvRows.push(row.map(v => `"${v}"`).join(','))
    })

    const csv = csvRows.join('\n')

    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', 'attachment; filename="events.csv"')
    res.send(csv)
  } catch (error) {
    console.error('Export events CSV error:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * GET /api/export/events/json
 * Export events as JSON
 */
router.get('/events/json', verifyToken, async (req, res) => {
  try {
    const { timeRange = '24h', limit = 1000 } = req.query

    const hoursMap = {
      '1h': 1,
      '6h': 6,
      '24h': 24,
      '7d': 168,
      '30d': 720
    }
    const hoursAgo = hoursMap[timeRange] || 24
    const since = new Date(Date.now() - hoursAgo * 60 * 60 * 1000)

    const events = await Event.find({ '@timestamp': { $gte: since } })
      .sort({ '@timestamp': -1 })
      .limit(parseInt(limit))
      .lean()

    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Content-Disposition', 'attachment; filename="events.json"')
    res.json({
      success: true,
      exportedAt: new Date().toISOString(),
      count: events?.length || 0,
      data: events || []
    })
  } catch (error) {
    console.error('Export events JSON error:', error)
    res.status(500).json({ error: error.message })
  }
})

export default router
