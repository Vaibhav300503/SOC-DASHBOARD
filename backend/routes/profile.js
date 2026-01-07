import express from 'express'
import User from '../models/User.js'
import authMiddleware from '../middleware/authMiddleware.js'
import multer from 'multer'
import path from 'path'

const router = express.Router()

// Configure multer for avatar uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/avatars/')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname))
  }
})

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('Only image files are allowed'))
    }
  }
})

/**
 * GET /api/profile
 * Get current user profile
 */
// Middleware wrapper to preserve context
const requireAuth = (req, res, next) => {
  return authMiddleware.verifyToken(req, res, next)
}

router.get('/', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    res.json({
      success: true,
      data: {
        ...user.toJSON(),
        profileCompletion: user.profileCompletion,
        fullName: user.fullName
      }
    })
  } catch (error) {
    console.error('Get profile error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

/**
 * PUT /api/profile
 * Update user profile
 */
router.put('/', requireAuth, async (req, res) => {
  try {
    const { firstName, lastName, department, phone, bio, preferences } = req.body
    const userId = req.user.userId

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    // Update allowed fields
    if (firstName) user.firstName = firstName
    if (lastName) user.lastName = lastName
    if (department) user.department = department
    if (phone !== undefined) user.phone = phone
    if (bio !== undefined) user.bio = bio
    if (preferences) user.preferences = { ...user.preferences, ...preferences }

    await user.save()

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        ...user.toJSON(),
        profileCompletion: user.profileCompletion,
        fullName: user.fullName
      }
    })
  } catch (error) {
    console.error('Update profile error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

/**
 * POST /api/profile/avatar
 * Upload avatar image
 */
router.post('/avatar', requireAuth, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' })
    }

    const user = await User.findById(req.user.userId)
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    // Update avatar path
    user.avatar = `/uploads/avatars/${req.file.filename}`
    await user.save()

    res.json({
      success: true,
      message: 'Avatar uploaded successfully',
      data: {
        avatar: user.avatar,
        profileCompletion: user.profileCompletion
      }
    })
  } catch (error) {
    console.error('Avatar upload error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

/**
 * GET /api/profile/stats
 * Get user activity statistics
 */
router.get('/stats', requireAuth, async (req, res) => {
  try {
    // In development with bypassed auth, create mock stats
    if (process.env.NODE_ENV === 'development' && process.env.BYPASS_AUTH === 'true') {
      return res.json({
        success: true,
        data: {
          loginCount: 42,
          lastLogin: new Date(),
          lastActivity: new Date(),
          activity: {
            lastActivity: new Date(),
            totalLogins: 42,
            totalSessions: 38,
            avgSessionDuration: 3600,
            mostActiveHour: 14,
            loginStreak: 7
          },
          alertsCreated: 15,
          logsViewed: 1250,
          reportsGenerated: 8,
          profileCompletion: 85,
          joinDate: new Date('2024-01-01')
        }
      })
    }

    const user = await User.findById(req.user.userId)
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    // Get additional stats from other collections using Mongoose models
    // We assume 'Reports' might refer to Cases or a specific Report model if it existed. 
    // For now mapping Reports -> Cases created by user.
    // We import models dynamically to avoid circular dependencies if any, or just standard import.
    // Better to have top-level imports, but let's check if they are available.

    // Using dynamic imports for models to ensure they are loaded
    const { default: AlertEvent } = await import('../models/AlertEvent.js')
    const { default: Case } = await import('../models/Case.js')
    // const { default: Log } = await import('../models/Log.js') // If we wanted logs viewed counts

    const [alertCount, reportCount] = await Promise.all([
      AlertEvent.countDocuments({ created_by: req.user.userId }),
      Case.countDocuments({ created_by: req.user.userId })
    ])

    // For logsViewed, we stick to the user.activity counter as there isn't a robust 'ViewedLog' collection

    res.json({
      success: true,
      data: {
        loginCount: user.loginCount,
        lastLogin: user.last_login,
        lastActivity: user.activity.lastActivity,
        activity: user.activity,
        // Override the simple counters with real DB counts where possible
        alertsCreated: alertCount,
        reportsGenerated: reportCount,
        logsViewed: user.activity.loginsViewed, // or user.activity.logsViewed if the schema had it, falling back to loginsViewed
        profileCompletion: user.profileCompletion,
        joinDate: user.created_at
      }
    })
  } catch (error) {
    console.error('Get profile stats error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

/**
 * POST /api/profile/logout
 * Logout user and record activity
 */
router.post('/logout', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
    if (user) {
      user.recordActivity('loginsViewed')
    }

    res.json({
      success: true,
      message: 'Logged out successfully'
    })
  } catch (error) {
    console.error('Logout error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

/**
 * DELETE /api/profile
 * Delete user account (soft delete)
 */
router.delete('/', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    // Soft delete by deactivating
    user.is_active = false
    user.email = `deleted_${Date.now()}_${user.email}`
    await user.save()

    res.json({
      success: true,
      message: 'Account deleted successfully'
    })
  } catch (error) {
    console.error('Delete account error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

export default router
