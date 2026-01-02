import express from 'express'
import Log from '../models/Log.js'
import BlockedIP from '../models/BlockedIP.js'
import SafeIP from '../models/SafeIP.js'
import AlertRule from '../models/AlertRule.js'
import AlertEvent from '../models/AlertEvent.js'
import { verifyToken, requireRole } from '../middleware/auth.js'

const router = express.Router()

/**
 * POST /api/ip-actions/block
 * Block an IP address
 */
router.post('/block', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { ip, reason, severity = 'High' } = req.body

    if (!ip) {
      return res.status(400).json({ success: false, message: 'IP required' })
    }

    // Check if IP is already blocked
    const existingBlock = await BlockedIP.findOne({ ip })
    if (existingBlock) {
      return res.status(400).json({ success: false, message: 'IP already blocked' })
    }

    // Create new blocked IP entry
    const blockedIP = new BlockedIP({
      ip,
      reason: reason || 'Manual block via dashboard',
      severity,
      created_by: req.user.userId
    })

    await blockedIP.save()

    res.json({
      success: true,
      message: `IP ${ip} has been blocked`,
      ip,
      action: 'block',
      data: blockedIP
    })
  } catch (error) {
    console.error('Block IP error:', error)
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'IP already blocked' })
    }
    res.status(500).json({ success: false, message: 'Failed to block IP' })
  }
})

/**
 * POST /api/ip-actions/allow
 * Whitelist an IP address
 */
router.post('/allow', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { ip, notes, confidence = 'Medium' } = req.body

    if (!ip) {
      return res.status(400).json({ success: false, message: 'IP required' })
    }

    // Check if IP is already whitelisted
    const existingSafeIP = await SafeIP.findOne({ ip })
    if (existingSafeIP) {
      return res.status(400).json({ success: false, message: 'IP already whitelisted' })
    }

    // Create new safe IP entry
    const safeIP = new SafeIP({
      ip,
      notes: notes || 'Whitelisted via dashboard',
      confidence,
      created_by: req.user.userId,
      tags: ['whitelisted', 'manual']
    })

    await safeIP.save()

    res.json({
      success: true,
      message: `IP ${ip} has been whitelisted`,
      ip,
      action: 'allow',
      data: safeIP
    })
  } catch (error) {
    console.error('Allow IP error:', error)
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'IP already whitelisted' })
    }
    res.status(500).json({ success: false, message: 'Failed to whitelist IP' })
  }
})

/**
 * GET /api/ip-actions/whois/:ip
 * Get WHOIS information for an IP
 */
router.get('/whois/:ip', verifyToken, async (req, res) => {
  try {
    const { ip } = req.params

    // Placeholder WHOIS data (integrate with real WHOIS API in production)
    const whoisData = {
      ip,
      organization: 'Example Organization',
      country: 'US',
      asn: 'AS12345',
      isp: 'Example ISP',
      registrar: 'ARIN',
      registered: '2020-01-15',
      lastUpdated: new Date().toISOString(),
      // TODO: Integrate with real WHOIS API (e.g., whois.arin.net or ipwhois.io)
    }

    res.json({
      success: true,
      data: whoisData
    })
  } catch (error) {
    console.error('WHOIS lookup error:', error)
    res.status(500).json({ success: false, message: 'Failed to fetch WHOIS data' })
  }
})

/**
 * GET /api/ip-actions/geoip/:ip
 * Get GeoIP information for an IP
 */
router.get('/geoip/:ip', verifyToken, async (req, res) => {
  try {
    const { ip } = req.params

    // Placeholder GeoIP data (integrate with real GeoIP API in production)
    const geoipData = {
      ip,
      country: 'United States',
      countryCode: 'US',
      city: 'New York',
      state: 'NY',
      latitude: 40.7128,
      longitude: -74.0060,
      timezone: 'America/New_York',
      isp: 'Example ISP',
      asn: 'AS12345',
      // TODO: Integrate with real GeoIP API (e.g., MaxMind GeoIP2, ip-api.com)
    }

    res.json({
      success: true,
      data: geoipData
    })
  } catch (error) {
    console.error('GeoIP lookup error:', error)
    res.status(500).json({ success: false, message: 'Failed to fetch GeoIP data' })
  }
})

/**
 * GET /api/ip-actions/threat-intel/:ip
 * Get threat intelligence for an IP
 */
router.get('/threat-intel/:ip', verifyToken, async (req, res) => {
  try {
    const { ip } = req.params

    // Placeholder threat intel data
    const threatData = {
      ip,
      reputation: 'suspicious',
      abuseScore: 75,
      reports: 12,
      lastReported: '2024-11-28',
      threats: ['malware', 'botnet', 'spam'],
      // TODO: Integrate with real threat intel APIs (AbuseIPDB, VirusTotal, etc.)
    }

    res.json({
      success: true,
      data: threatData
    })
  } catch (error) {
    console.error('Threat intel error:', error)
    res.status(500).json({ success: false, message: 'Failed to fetch threat intelligence' })
  }
})

/**
 * GET /api/ip-actions/logs/:ip
 * Get logs related to an IP
 */
router.get('/logs/:ip', verifyToken, async (req, res) => {
  try {
    const { ip } = req.params
    const { timeRange = '24h', limit = 50 } = req.query

    const timeMs = {
      '1h': 3600000,
      '6h': 21600000,
      '24h': 86400000,
      '7d': 604800000,
      '30d': 2592000000
    }[timeRange] || 86400000

    const startTime = new Date(Date.now() - timeMs)

    const logs = await Log.find({
      $or: [
        { source_ip: ip },
        { dest_ip: ip }
      ],
      timestamp: { $gte: startTime }
    })
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))

    res.json({
      success: true,
      ip,
      timeRange,
      count: logs.length,
      logs
    })
  } catch (error) {
    console.error('Fetch logs error:', error)
    res.status(500).json({ success: false, message: 'Failed to fetch logs' })
  }
})

/**
 * POST /api/ip-actions/safe
 * Mark an IP as safe
 */
router.post('/safe', verifyToken, async (req, res) => {
  try {
    const { ip, notes, confidence = 'High' } = req.body

    if (!ip) {
      return res.status(400).json({ success: false, message: 'IP required' })
    }

    // Check if IP is already marked as safe
    const existingSafeIP = await SafeIP.findOne({ ip })
    if (existingSafeIP) {
      return res.status(400).json({ success: false, message: 'IP already marked as safe' })
    }

    // Create new safe IP entry
    const safeIP = new SafeIP({
      ip,
      notes: notes || 'Marked as safe via dashboard',
      confidence,
      created_by: req.user.userId,
      tags: ['safe', 'manual']
    })

    await safeIP.save()

    res.json({
      success: true,
      message: `IP ${ip} marked as safe`,
      ip,
      action: 'mark_safe',
      data: safeIP
    })
  } catch (error) {
    console.error('Mark safe error:', error)
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'IP already marked as safe' })
    }
    res.status(500).json({ success: false, message: 'Failed to mark IP as safe' })
  }
})

/**
 * POST /api/ip-actions/alert-rule
 * Create an alert rule for an IP
 */
router.post('/alert-rule', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { ip, severity = 'HIGH', condition = 'activity', name, description } = req.body

    if (!ip) {
      return res.status(400).json({ success: false, message: 'IP required' })
    }

    // Check if alert rule already exists for this IP
    const existingRule = await AlertRule.findOne({ 
      'condition.ip': ip,
      enabled: true 
    })
    
    if (existingRule) {
      return res.status(400).json({ success: false, message: 'Alert rule already exists for this IP' })
    }

    // Create new alert rule
    const rule = new AlertRule({
      name: name || `IP Alert: ${ip}`,
      description: description || `Alert rule for IP ${ip} based on ${condition}`,
      condition: {
        type: 'ip_activity',
        ip: ip,
        condition: condition,
        threshold: 10
      },
      actions: [
        {
          type: 'notification',
          severity: severity
        }
      ],
      severity: severity,
      created_by: req.user.userId,
      enabled: true
    })

    await rule.save()

    res.json({
      success: true,
      message: `Alert rule created for ${ip}`,
      rule
    })
  } catch (error) {
    console.error('Create alert rule error:', error)
    res.status(500).json({ success: false, message: 'Failed to create alert rule' })
  }
})

/**
 * GET /api/ip-actions/status
 * Get status of all IP management lists
 */
router.get('/status', verifyToken, async (req, res) => {
  try {
    // Get counts from MongoDB collections
    const [blockedCount, safeCount, alertRulesCount] = await Promise.all([
      BlockedIP.countDocuments(),
      SafeIP.countDocuments(),
      AlertRule.countDocuments({ enabled: true })
    ])

    // Get recent entries for display
    const [recentBlocked, recentSafe, recentRules] = await Promise.all([
      BlockedIP.find().sort({ created_at: -1 }).limit(10).populate('created_by', 'email'),
      SafeIP.find().sort({ created_at: -1 }).limit(10).populate('created_by', 'email'),
      AlertRule.find().sort({ created_at: -1 }).limit(10).populate('created_by', 'email')
    ])

    res.json({
      success: true,
      stats: {
        blockedCount,
        safeCount,
        alertRulesCount
      },
      lists: {
        blocked: recentBlocked,
        safe: recentSafe,
        alertRules: recentRules
      }
    })
  } catch (error) {
    console.error('Status error:', error)
    res.status(500).json({ success: false, message: 'Failed to get status' })
  }
})

export default router
