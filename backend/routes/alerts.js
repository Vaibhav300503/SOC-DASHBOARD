import express from 'express'
import AlertRule from '../models/AlertRule.js'
import AlertEvent from '../models/AlertEvent.js'
import { verifyToken, requireRole } from '../middleware/auth.js'
import { handleAlertIntegrations } from '../services/alertIntegrations.js'
import { getRecentCases } from '../services/thehiveIntegration.js'

const router = express.Router()

// Store for SSE clients
const alertClients = new Set()

/**
 * POST /api/alerts/rules
 * Create alert rule
 */
router.post('/rules', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { name, description, condition, actions, severity = 'High' } = req.body

    if (!name || !condition) {
      return res.status(400).json({ success: false, message: 'Name and condition required' })
    }

    const rule = new AlertRule({
      name,
      description,
      condition,
      actions: actions || [],
      severity,
      created_by: req.user.userId
    })

    await rule.save()

    res.json({
      success: true,
      message: 'Alert rule created',
      data: rule
    })
  } catch (error) {
    console.error('Create rule error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

/**
 * POST /api/alerts/events
 * Create alert event
 */
router.post('/events', verifyToken, async (req, res) => {
  try {
    const { title, description, severity, source_ip, dest_ip, log_id, rule_id } = req.body

    if (!title || !description) {
      return res.status(400).json({ success: false, message: 'Title and description required' })
    }

    const event = new AlertEvent({
      title,
      description,
      severity: severity || 'Medium',
      source_ip,
      dest_ip,
      log_id,
      rule_id,
      created_by: req.user?.userId || 'system',
      read: false
    })

    await event.save()

    // Broadcast to SSE clients
    alertClients.forEach(client => {
      if (client.readyState === 1) { // OPEN
        client.send(JSON.stringify({
          type: 'new_alert',
          data: event
        }))
      }
    })

    // Fire-and-forget downstream integrations (TheHive, Cortex)
    // Do not await to keep alert creation latency low
    handleAlertIntegrations(event).catch(err => {
      console.error('Alert integration error:', err?.message || err)
    })

    res.json({
      success: true,
      message: 'Alert event created',
      data: event
    })
  } catch (error) {
    console.error('Create event error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

/**
 * GET /api/alerts/rules
 * List alert rules
 */
router.get('/rules', verifyToken, async (req, res) => {
  try {
    const rules = await AlertRule.find()
      .populate('created_by', 'email name')
      .sort({ created_at: -1 })

    res.json({
      success: true,
      data: rules
    })
  } catch (error) {
    console.error('List rules error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

/**
 * GET /api/alerts/rules/:id
 * Get specific rule
 */
router.get('/rules/:id', verifyToken, async (req, res) => {
  try {
    const rule = await AlertRule.findById(req.params.id)
      .populate('created_by', 'email name')

    if (!rule) {
      return res.status(404).json({ success: false, message: 'Rule not found' })
    }

    res.json({
      success: true,
      data: rule
    })
  } catch (error) {
    console.error('Get rule error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

/**
 * PATCH /api/alerts/rules/:id
 * Update alert rule
 */
router.patch('/rules/:id', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { name, description, condition, actions, severity, enabled } = req.body

    const rule = await AlertRule.findByIdAndUpdate(
      req.params.id,
      {
        name,
        description,
        condition,
        actions,
        severity,
        enabled,
        updated_at: new Date()
      },
      { new: true }
    )

    if (!rule) {
      return res.status(404).json({ success: false, message: 'Rule not found' })
    }

    res.json({
      success: true,
      message: 'Alert rule updated',
      data: rule
    })
  } catch (error) {
    console.error('Update rule error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

/**
 * DELETE /api/alerts/rules/:id
 * Delete alert rule
 */
router.delete('/rules/:id', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const result = await AlertRule.deleteOne({ _id: req.params.id })

    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: 'Rule not found' })
    }

    res.json({
      success: true,
      message: 'Alert rule deleted'
    })
  } catch (error) {
    console.error('Delete rule error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

/**
 * GET /api/alerts/events
 * List alert events
 */
router.get('/events', verifyToken, async (req, res) => {
  try {
    const { limit = 50, skip = 0, unread_only = false } = req.query

    let query = {}
    if (unread_only === 'true') {
      query.read = false
    }

    const events = await AlertEvent.find(query)
      .populate('rule_id', 'name severity')
      .sort({ created_at: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))

    const total = await AlertEvent.countDocuments(query)
    const unread = await AlertEvent.countDocuments({ read: false })

    res.json({
      success: true,
      data: events,
      pagination: {
        total,
        limit: parseInt(limit),
        skip: parseInt(skip),
        unread
      }
    })
  } catch (error) {
    console.error('List events error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

router.get('/metrics', verifyToken, async (req, res) => {
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

    const [
      totalAlerts,
      criticalAlerts,
      highAlerts,
      unreadAlerts,
      analyzedAlerts,
      runningAnalysis
    ] = await Promise.all([
      AlertEvent.countDocuments({}),
      AlertEvent.countDocuments({ severity: 'Critical' }),
      AlertEvent.countDocuments({ severity: 'High' }),
      AlertEvent.countDocuments({ read: false }),
      AlertEvent.countDocuments({ analysis_status: 'completed' }),
      AlertEvent.countDocuments({ analysis_status: 'running' })
    ])

    const recentCritical = await AlertEvent.countDocuments({
      severity: 'Critical',
      created_at: { $gte: since }
    })

    const cases = await getRecentCases(20)

    res.json({
      success: true,
      data: {
        totalAlerts,
        criticalAlerts,
        highAlerts,
        unreadAlerts,
        analyzedAlerts,
        runningAnalysis,
        recentCritical,
        casesCount: Array.isArray(cases) ? cases.length : 0
      }
    })
  } catch (error) {
    console.error('Alert metrics error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

/**
 * PATCH /api/alerts/events/:id/read
 * Mark event as read
 */
router.patch('/events/:id/read', verifyToken, async (req, res) => {
  try {
    const event = await AlertEvent.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true }
    )

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' })
    }

    res.json({
      success: true,
      message: 'Event marked as read',
      data: event
    })
  } catch (error) {
    console.error('Mark read error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

/**
 * DELETE /api/alerts/events/:id
 * Delete alert event
 */
router.delete('/events/:id', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const result = await AlertEvent.deleteOne({ _id: req.params.id })

    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: 'Alert event not found' })
    }

    res.json({
      success: true,
      message: 'Alert event deleted'
    })
  } catch (error) {
    console.error('Delete event error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

/**
 * PATCH /api/alerts/events/mark-all-read
 * Mark all events as read
 */
router.patch('/events/mark-all-read', verifyToken, async (req, res) => {
  try {
    const result = await AlertEvent.updateMany(
      { read: false },
      { read: true }
    )

    res.json({
      success: true,
      message: `Marked ${result.modifiedCount} events as read`
    })
  } catch (error) {
    console.error('Mark all read error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

/**
 * GET /api/alerts/stream
 * SSE endpoint for real-time alerts
 */
router.get('/stream', verifyToken, (req, res) => {
  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('Access-Control-Allow-Origin', '*')

  // Send initial connection message
  res.write('data: {"type":"connected","message":"Connected to alerts stream"}\n\n')

  // Add client to set
  alertClients.add(res)

  // Send heartbeat every 30 seconds
  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n')
  }, 30000)

  // Cleanup on disconnect
  req.on('close', () => {
    clearInterval(heartbeat)
    alertClients.delete(res)
  })
})

/**
 * Internal function to broadcast alert to all connected clients
 */
export const broadcastAlert = (alert) => {
  alertClients.forEach(client => {
    try {
      client.write(`data: ${JSON.stringify(alert)}\n\n`)
    } catch (error) {
      alertClients.delete(client)
    }
  })
}

/**
 * POST /api/alerts/cortex/webhook
 * Webhook endpoint for Cortex analyzer job updates.
 * Secured with shared secret header.
 */
router.post('/cortex/webhook', async (req, res) => {
  try {
    const expectedSecret = process.env.CORTEX_WEBHOOK_SECRET
    if (!expectedSecret) {
      return res.status(503).json({ success: false, message: 'Cortex webhook not configured' })
    }

    const provided = req.headers['x-integration-secret'] || req.headers['x-webhook-secret']
    if (!provided || provided !== expectedSecret) {
      return res.status(401).json({ success: false, message: 'Unauthorized' })
    }

    const payload = req.body || {}
    const jobId = payload.jobId || payload.id || payload._id
    if (!jobId) {
      return res.status(400).json({ success: false, message: 'Missing job identifier' })
    }

    const status = (payload.status || '').toLowerCase()
    let analysisStatus = 'completed'
    if (['waiting', 'in-progress', 'running'].includes(status)) analysisStatus = 'running'
    else if (['failed', 'error'].includes(status)) analysisStatus = 'error'

    const event = await AlertEvent.findOne({ cortex_job_ids: jobId })
    if (!event) {
      return res.status(404).json({ success: false, message: 'Alert event not found for job' })
    }

    event.analysis_status = analysisStatus
    event.analysis_summary = payload.report || payload.summary || payload
    event.last_updated = new Date()
    await event.save()

    // Broadcast analysis update over SSE
    broadcastAlert({
      type: 'analysis_update',
      data: event
    })

    res.json({ success: true })
  } catch (error) {
    console.error('Cortex webhook error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

/**
 * POST /api/alerts/thehive/webhook
 * Webhook endpoint for TheHive alert/case updates.
 * Secured with shared secret header.
 */
router.post('/thehive/webhook', async (req, res) => {
  try {
    const expectedSecret = process.env.THEHIVE_WEBHOOK_SECRET
    if (!expectedSecret) {
      return res.status(503).json({ success: false, message: 'TheHive webhook not configured' })
    }

    const provided = req.headers['x-integration-secret'] || req.headers['x-webhook-secret']
    if (!provided || provided !== expectedSecret) {
      return res.status(401).json({ success: false, message: 'Unauthorized' })
    }

    const payload = req.body || {}
    const alertId = payload.alertId || payload.alert_id
    const caseId = payload.caseId || payload.case_id

    if (!alertId && !caseId) {
      return res.status(400).json({ success: false, message: 'Missing TheHive identifiers' })
    }

    const query = {}
    if (alertId) query.thehive_alert_id = alertId
    if (caseId) query.thehive_case_id = caseId

    const event = await AlertEvent.findOne(query)
    if (!event) {
      return res.status(404).json({ success: false, message: 'Alert event not found for TheHive IDs' })
    }

    event.metadata = {
      ...(event.metadata || {}),
      thehive: payload
    }
    if (caseId && !event.thehive_case_id) {
      event.thehive_case_id = caseId
    }
    event.last_updated = new Date()
    await event.save()

    // Broadcast case/alert update over SSE
    broadcastAlert({
      type: 'thehive_update',
      data: event
    })

    res.json({ success: true })
  } catch (error) {
    console.error('TheHive webhook error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

router.get('/cases/recent', verifyToken, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 10, 50)
    const cases = await getRecentCases(limit)

    res.json({
      success: true,
      data: cases
    })
  } catch (error) {
    console.error('Recent cases error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

export default router
