import express from 'express'
import User from '../models/User.js'
import { generateToken, verifyToken } from '../middleware/auth.js'

const router = express.Router()

/**
 * POST /api/auth/register
 * Register a new user (admin only or dev mode)
 */
router.post('/register', (req, res, next) => {
  console.log('REGISTER ENDPOINT HIT!')
  next()
}, async (req, res) => {
  try {
    console.log('Registration request received:', req.body)
    const { email, password, name, role } = req.body

    // Validate input
    if (!email || !password) {
      console.log('Missing email or password')
      return res.status(400).json({
        success: false,
        message: 'Email and password required'
      })
    }

    // Check if user exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      console.log('User already exists:', email)
      return res.status(409).json({
        success: false,
        message: 'User already exists'
      })
    }

    // Split name into firstName and lastName
    const nameParts = (name || '').split(' ')
    const firstName = nameParts[0] || email.split('@')[0]
    const lastName = nameParts.slice(1).join(' ') || ''

    // Generate username from email
    const username = email.split('@')[0] + Math.floor(Math.random() * 1000)

    console.log('Creating user:', { email, username, firstName, lastName })

    // Create user
    const user = new User({
      email,
      password_hash: password, // Will be hashed by pre-save hook
      username,
      firstName,
      lastName,
      role: role || 'analyst'
    })

    await user.save()
    console.log('User saved successfully:', user._id)

    // Generate token
    const token = generateToken(user._id, user.email, user.role)

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: user.toJSON()
    })
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Registration failed'
    })
  }
})

/**
 * POST /api/auth/login
 * Login user and return JWT token
 */
router.post('/login', async (req, res) => {
  try {
    console.log('Login request received for email:', req.body.email)
    const { email, password } = req.body

    // Validate input
    if (!email || !password) {
      console.log('Missing email or password')
      return res.status(400).json({
        success: false,
        message: 'Email and password required'
      })
    }

    // Find user
    console.log('Looking for user with email:', email)
    const user = await User.findOne({ email })
    console.log('User found:', user ? 'YES' : 'NO')
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      })
    }

    // Check if user is active
    if (!user.is_active) {
      console.log('User account is inactive')
      return res.status(403).json({
        success: false,
        message: 'User account is inactive'
      })
    }

    // Verify password
    console.log('Comparing password...')
    const isPasswordValid = await user.comparePassword(password)
    console.log('Password valid:', isPasswordValid)
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      })
    }

    // Update last login
    user.last_login = new Date()
    await user.save()

    // Generate token
    const token = generateToken(user._id, user.email, user.role)

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: user.toJSON()
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({
      success: false,
      message: 'Login failed'
    })
  }
})

/**
 * GET /api/auth/me
 * Get current user info (requires auth)
 */
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password_hash')
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    res.json({
      success: true,
      user: user.toJSON()
    })
  } catch (error) {
    console.error('Get user error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to get user info'
    })
  }
})

/**
 * POST /api/auth/logout
 * Logout user (frontend clears token)
 */
router.post('/logout', verifyToken, (req, res) => {
  res.json({
    success: true,
    message: 'Logout successful'
  })
})

/**
 * POST /api/auth/refresh
 * Refresh JWT token
 */
router.post('/refresh', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    const newToken = generateToken(user._id, user.email, user.role)

    res.json({
      success: true,
      token: newToken,
      user: user.toJSON()
    })
  } catch (error) {
    console.error('Token refresh error:', error)
    res.status(500).json({
      success: false,
      message: 'Token refresh failed'
    })
  }
})

/**
 * PATCH /api/auth/me
 * Update user profile (name, email)
 */
router.patch('/me', verifyToken, async (req, res) => {
  try {
    const { name } = req.body
    const user = await User.findById(req.user.userId)

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    // Update fields
    if (name) user.name = name

    await user.save()

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: user.toJSON()
    })
  } catch (error) {
    console.error('Update profile error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    })
  }
})

/**
 * POST /api/auth/change-password
 * Change user password
 */
router.post('/change-password', verifyToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current and new password required'
      })
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      })
    }

    const user = await User.findById(req.user.userId)

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    // Verify current password
    const isValid = await user.comparePassword(currentPassword)
    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      })
    }

    // Update password
    user.password_hash = newPassword
    await user.save()

    res.json({
      success: true,
      message: 'Password changed successfully'
    })
  } catch (error) {
    console.error('Change password error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to change password'
    })
  }
})

export default router
