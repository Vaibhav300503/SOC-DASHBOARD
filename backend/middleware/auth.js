import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'
const JWT_EXPIRY = process.env.JWT_EXPIRY || '7d'

/**
 * Generate JWT token
 */
export const generateToken = (userId, email, role) => {
  return jwt.sign(
    { userId, email, role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  )
}

/**
 * Verify JWT token middleware
 */
export const verifyToken = (req, res, next) => {
  // Debug logging
  console.log('Auth middleware - JWT_SECRET:', process.env.JWT_SECRET)
  console.log('Auth middleware - BYPASS_AUTH:', process.env.BYPASS_AUTH)
  
  // Check if auth bypass is enabled
  if (process.env.BYPASS_AUTH === 'true') {
    // Create a mock user for bypass mode
    req.user = {
      userId: 'bypass-user',
      email: 'bypass@localhost',
      role: 'admin'
    }
    return next()
  }

  try {
    const token = req.headers.authorization?.split(' ')[1] || req.cookies?.token
    console.log('Auth middleware - Received token:', token ? token.substring(0, 20) + '...' : 'none')

    if (!token) {
      console.log('Auth middleware - No token provided')
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      })
    }

    // Check if this is a demo token
    if (token.startsWith('eyJ') === false) {
      // Demo token - decode it directly
      try {
        const decoded = JSON.parse(atob(token))
        console.log('Auth middleware - Demo token decoded:', decoded)
        if (decoded.demo === true) {
          req.user = {
            userId: decoded.userId,
            email: decoded.email,
            role: decoded.role
          }
          console.log('Auth middleware - Demo user authenticated:', req.user.email)
          return next()
        }
      } catch (demoError) {
        console.log('Auth middleware - Invalid demo token format:', demoError.message)
        // Invalid demo token format
        return res.status(401).json({
          success: false,
          message: 'Invalid demo token'
        })
      }
    }

    // Real JWT token - verify with secret
    console.log('Auth middleware - Attempting JWT verification with secret:', JWT_SECRET)
    const jwtDecoded = jwt.verify(token, JWT_SECRET)
    console.log('Auth middleware - JWT decoded successfully:', jwtDecoded.email)
    req.user = jwtDecoded
    next()
  } catch (error) {
    console.log('Auth middleware - JWT verification failed:', error.message)
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired',
        code: 'TOKEN_EXPIRED'
      })
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    })
  }
}

/**
 * Alias for verifyToken - used in some routes
 */
export const requireAuth = verifyToken
export const requireRole = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      })
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      })
    }

    next()
  }
}

/**
 * Optional token verification (doesn't fail if no token)
 */
export const optionalToken = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1] || req.cookies?.token

    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET)
      req.user = decoded
    }
  } catch (error) {
    // Silently fail - token is optional
  }

  next()
}
