import express from 'express'
import { verifyToken } from '../middleware/auth.js'

const router = express.Router()

/**
 * POST /api/ip/block
 * Block an IP address
 */
router.post('/block', verifyToken, async (req, res) => {
  try {
    const { ip, reason, duration } = req.body

    if (!ip) {
      return res.status(400).json({ error: 'IP address required' })
    }

    const db = req.app.locals.db
    const blockedIpsColl = db.collection('blocked_ips')

    // Check if already blocked
    const existing = await blockedIpsColl.findOne({ ip })
    if (existing) {
      return res.status(400).json({ error: 'IP already blocked' })
    }

    // Block the IP
    const result = await blockedIpsColl.insertOne({
      ip,
      reason: reason || 'Manual block',
      blockedAt: new Date(),
      duration: duration || null,
      blockedBy: req.user?.id || 'system',
      active: true
    })

    res.json({
      success: true,
      message: `IP ${ip} blocked successfully`,
      id: result.insertedId
    })
  } catch (error) {
    console.error('Block IP error:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * POST /api/ip/allow
 * Allow/whitelist an IP address
 */
router.post('/allow', verifyToken, async (req, res) => {
  try {
    const { ip, reason } = req.body

    if (!ip) {
      return res.status(400).json({ error: 'IP address required' })
    }

    const db = req.app.locals.db
    const safeIpsColl = db.collection('safe_list')

    // Check if already whitelisted
    const existing = await safeIpsColl.findOne({ ip })
    if (existing) {
      return res.status(400).json({ error: 'IP already whitelisted' })
    }

    // Whitelist the IP
    const result = await safeIpsColl.insertOne({
      ip,
      reason: reason || 'Manual whitelist',
      whitelistedAt: new Date(),
      whitelistedBy: req.user?.id || 'system',
      active: true
    })

    res.json({
      success: true,
      message: `IP ${ip} whitelisted successfully`,
      id: result.insertedId
    })
  } catch (error) {
    console.error('Allow IP error:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * GET /api/ip/blocked
 * Get list of blocked IPs
 */
router.get('/blocked', verifyToken, async (req, res) => {
  try {
    const db = req.app.locals.db
    const blockedIpsColl = db.collection('blocked_ips')

    const blocked = await blockedIpsColl
      .find({ active: true })
      .sort({ blockedAt: -1 })
      .limit(100)
      .toArray()

    res.json({
      success: true,
      data: blocked || [],
      total: blocked.length
    })
  } catch (error) {
    console.error('Get blocked IPs error:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * GET /api/ip/safe
 * Get list of safe/whitelisted IPs
 */
router.get('/safe', verifyToken, async (req, res) => {
  try {
    const db = req.app.locals.db
    const safeIpsColl = db.collection('safe_list')

    const safe = await safeIpsColl
      .find({ active: true })
      .sort({ whitelistedAt: -1 })
      .limit(100)
      .toArray()

    res.json({
      success: true,
      data: safe || [],
      total: safe.length
    })
  } catch (error) {
    console.error('Get safe IPs error:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * DELETE /api/ip/block/:id
 * Unblock an IP
 */
router.delete('/block/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params
    const db = req.app.locals.db
    const blockedIpsColl = db.collection('blocked_ips')

    const result = await blockedIpsColl.updateOne(
      { _id: new (require('mongodb')).ObjectId(id) },
      { $set: { active: false, unblockedAt: new Date() } }
    )

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'IP not found' })
    }

    res.json({ success: true, message: 'IP unblocked' })
  } catch (error) {
    console.error('Unblock IP error:', error)
    res.status(500).json({ error: error.message })
  }
})

export default router
