import express from 'express'
import { verifyToken } from '../middleware/auth.js'

const router = express.Router()

/**
 * GET /api/lookup/whois/:ip
 * Get WHOIS information for an IP
 */
router.get('/whois/:ip', verifyToken, async (req, res) => {
  try {
    const { ip } = req.params

    // Mock WHOIS data - in production, integrate with actual WHOIS API
    const whoisData = {
      ip,
      organization: 'Sample Organization',
      country: 'IN',
      city: 'Mumbai',
      isp: 'Sample ISP',
      asn: 'AS12345',
      registrar: 'APNIC',
      registeredDate: '2020-01-01',
      lastUpdated: new Date().toISOString()
    }

    res.json({
      success: true,
      data: whoisData
    })
  } catch (error) {
    console.error('WHOIS lookup error:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * GET /api/lookup/geoip/:ip
 * Get GeoIP information for an IP
 */
router.get('/geoip/:ip', verifyToken, async (req, res) => {
  try {
    const { ip } = req.params

    // Mock GeoIP data - in production, integrate with actual GeoIP API
    const geoipData = {
      ip,
      country: 'India',
      countryCode: 'IN',
      city: 'Mumbai',
      latitude: 19.0760,
      longitude: 72.8777,
      timezone: 'Asia/Kolkata',
      isp: 'Sample ISP',
      type: 'residential'
    }

    res.json({
      success: true,
      data: geoipData
    })
  } catch (error) {
    console.error('GeoIP lookup error:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * GET /api/lookup/ti/:ip
 * Get Threat Intelligence information for an IP
 */
router.get('/ti/:ip', verifyToken, async (req, res) => {
  try {
    const { ip } = req.params
    const db = req.app.locals.db

    // Check if IP is in blocked list
    const blockedIpsColl = db.collection('blocked_ips')
    const isBlocked = await blockedIpsColl.findOne({ ip, active: true })

    // Check if IP is in safe list
    const safeIpsColl = db.collection('safe_list')
    const isSafe = await safeIpsColl.findOne({ ip, active: true })

    const tiData = {
      ip,
      reputation: isBlocked ? 'malicious' : isSafe ? 'safe' : 'unknown',
      threatLevel: isBlocked ? 'high' : 'low',
      isBlocked: !!isBlocked,
      isSafe: !!isSafe,
      lastSeen: new Date().toISOString(),
      reports: []
    }

    res.json({
      success: true,
      data: tiData
    })
  } catch (error) {
    console.error('TI lookup error:', error)
    res.status(500).json({ error: error.message })
  }
})

export default router
