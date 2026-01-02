import express from 'express'
import Log from '../models/Log.js'
import BlockedIP from '../models/BlockedIP.js'
import SafeIP from '../models/SafeIP.js'
import { verifyToken, requireRole } from '../middleware/auth.js'

const router = express.Router()

/**
 * POST /api/ip-management/block
 * Block an IP address with MongoDB persistence
 */
router.post('/block', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { ip, reason, severity = 'High', expires_at } = req.body

    if (!ip) {
      return res.status(400).json({ success: false, message: 'IP required' })
    }

    // Check if already blocked
    const existing = await BlockedIP.findOne({ ip })
    if (existing) {
      return res.status(409).json({ success: false, message: 'IP already blocked' })
    }

    const blocked = new BlockedIP({
      ip,
      reason: reason || 'Manual block',
      severity,
      created_by: req.user.id,
      expires_at: expires_at ? new Date(expires_at) : null
    })

    await blocked.save()

    res.json({
      success: true,
      message: `IP ${ip} has been blocked`,
      data: blocked
    })
  } catch (error) {
    console.error('Block IP error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

/**
 * POST /api/ip-management/allow
 * Remove IP from blocklist
 */
router.post('/allow', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { ip } = req.body

    if (!ip) {
      return res.status(400).json({ success: false, message: 'IP required' })
    }

    const result = await BlockedIP.deleteOne({ ip })

    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: 'IP not found in blocklist' })
    }

    res.json({
      success: true,
      message: `IP ${ip} has been removed from blocklist`
    })
  } catch (error) {
    console.error('Allow IP error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

/**
 * POST /api/ip-management/safe
 * Mark IP as safe
 */
router.post('/safe', verifyToken, async (req, res) => {
  try {
    const { ip, notes, confidence = 'Medium' } = req.body

    if (!ip) {
      return res.status(400).json({ success: false, message: 'IP required' })
    }

    const existing = await SafeIP.findOne({ ip })
    if (existing) {
      return res.status(409).json({ success: false, message: 'IP already marked as safe' })
    }

    const safe = new SafeIP({
      ip,
      notes,
      confidence,
      created_by: req.user.id
    })

    await safe.save()

    res.json({
      success: true,
      message: `IP ${ip} marked as safe`,
      data: safe
    })
  } catch (error) {
    console.error('Mark safe error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

/**
 * GET /api/ip-management/status
 * Get IP management status
 */
router.get('/status', verifyToken, async (req, res) => {
  try {
    const blockedCount = await BlockedIP.countDocuments()
    const safeCount = await SafeIP.countDocuments()

    const blocked = await BlockedIP.find().select('ip severity created_at').limit(100)
    const safe = await SafeIP.find().select('ip confidence created_at').limit(100)

    res.json({
      success: true,
      stats: {
        blockedCount,
        safeCount
      },
      lists: {
        blocked,
        safe
      }
    })
  } catch (error) {
    console.error('Status error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

/**
 * GET /api/ip-management/check/:ip
 * Check if IP is blocked or safe
 */
router.get('/check/:ip', verifyToken, async (req, res) => {
  try {
    const { ip } = req.params

    const blocked = await BlockedIP.findOne({ ip })
    const safe = await SafeIP.findOne({ ip })

    res.json({
      success: true,
      ip,
      status: blocked ? 'blocked' : safe ? 'safe' : 'unknown',
      blocked: blocked || null,
      safe: safe || null
    })
  } catch (error) {
    console.error('Check IP error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

/**
 * DELETE /api/ip-management/safe/:ip
 * Remove IP from safe list
 */
router.delete('/safe/:ip', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { ip } = req.params

    const result = await SafeIP.deleteOne({ ip })

    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: 'IP not found in safe list' })
    }

    res.json({
      success: true,
      message: `IP ${ip} removed from safe list`
    })
  } catch (error) {
    console.error('Delete safe IP error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

export default router
