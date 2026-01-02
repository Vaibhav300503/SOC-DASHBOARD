import jwt from 'jsonwebtoken';
import secureConfig from '../config/secureConfig.js';
import secureLogger from './secureLogger.js';

class AuthMiddleware {
  constructor() {
    this.JWT_SECRET = secureConfig.JWT_SECRET;
    this.bypassAuth = process.env.NODE_ENV === 'development' && process.env.BYPASS_AUTH === 'true';
    console.log('AuthMiddleware: NODE_ENV=', process.env.NODE_ENV);
    console.log('AuthMiddleware: BYPASS_AUTH=', process.env.BYPASS_AUTH);
    console.log('AuthMiddleware: bypassAuth=', this.bypassAuth);
  }

  // JWT verification middleware
  verifyToken(req, res, next) {
    console.log('verifyToken called for:', req.originalUrl);
    console.log('bypassAuth:', this.bypassAuth);
    // Bypass authentication in development if explicitly allowed
    if (this.bypassAuth) {
      console.log('Bypassing authentication for:', req.originalUrl);
      req.user = { id: 'dev-user', role: 'admin' };
      return next();
    }

    const token = this.extractToken(req);
    
    if (!token) {
      secureLogger.logSecurityEvent('Unauthorized access attempt - No token', {
        ip: req.ip,
        url: req.originalUrl,
        method: req.method,
        userAgent: req.get('User-Agent')
      });
      
      return res.status(401).json({
        error: 'Access token required',
        code: 'TOKEN_MISSING'
      });
    }

    try {
      const decoded = jwt.verify(token, this.JWT_SECRET);
      
      // Validate token structure
      if (!decoded.id || !decoded.role) {
        throw new Error('Invalid token structure');
      }
      
      // Add user info to request
      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
        permissions: decoded.permissions || []
      };
      
      // Log successful authentication
      secureLogger.info('User authenticated', {
        userId: req.user.id,
        role: req.user.role,
        ip: req.ip,
        url: req.originalUrl
      });
      
      next();
      
    } catch (error) {
      let errorMessage = 'Invalid token';
      let errorCode = 'TOKEN_INVALID';
      
      if (error.name === 'TokenExpiredError') {
        errorMessage = 'Token expired';
        errorCode = 'TOKEN_EXPIRED';
      } else if (error.name === 'JsonWebTokenError') {
        errorMessage = 'Malformed token';
        errorCode = 'TOKEN_MALFORMED';
      }
      
      secureLogger.logSecurityEvent(`Unauthorized access attempt - ${errorMessage}`, {
        ip: req.ip,
        url: req.originalUrl,
        method: req.method,
        userAgent: req.get('User-Agent'),
        errorCode,
        tokenPreview: token.substring(0, 20) + '...'
      });
      
      return res.status(401).json({
        error: errorMessage,
        code: errorCode
      });
    }
  }

  // Role-based access control
  requireRole(requiredRole) {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      const userRole = req.user.role;
      
      // Role hierarchy: admin > analyst > viewer
      const roleHierarchy = {
        'viewer': 1,
        'analyst': 2,
        'admin': 3
      };
      
      const userRoleLevel = roleHierarchy[userRole] || 0;
      const requiredRoleLevel = roleHierarchy[requiredRole] || 0;
      
      if (userRoleLevel < requiredRoleLevel) {
        secureLogger.logSecurityEvent('Insufficient permissions', {
          userId: req.user.id,
          userRole,
          requiredRole,
          ip: req.ip,
          url: req.originalUrl
        });
        
        return res.status(403).json({
          error: 'Insufficient permissions',
          code: 'INSUFFICIENT_PERMISSIONS',
          required: requiredRole,
          current: userRole
        });
      }
      
      next();
    };
  }

  // Permission-based access control
  requirePermission(permission) {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      const userPermissions = req.user.permissions || [];
      
      if (!userPermissions.includes(permission)) {
        secureLogger.logSecurityEvent('Permission denied', {
          userId: req.user.id,
          requiredPermission: permission,
          userPermissions,
          ip: req.ip,
          url: req.originalUrl
        });
        
        return res.status(403).json({
          error: 'Permission denied',
          code: 'PERMISSION_DENIED',
          required: permission
        });
      }
      
      next();
    };
  }

  // Extract token from various sources
  extractToken(req) {
    // Try Authorization header first
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    
    // Try query parameter (for WebSocket connections)
    if (req.query && req.query.token) {
      return req.query.token;
    }
    
    // Try cookie
    if (req.cookies && req.cookies.token) {
      return req.cookies.token;
    }
    
    return null;
  }

  // WebSocket authentication
  authenticateWebSocket(socket, next) {
    try {
      // Extract token from WebSocket query or handshake
      const token = socket.handshake.query.token || 
                    socket.handshake.auth.token ||
                    this.extractTokenFromHeaders(socket.handshake.headers);
      
      if (!token) {
        secureLogger.logSecurityEvent('WebSocket connection rejected - No token', {
          ip: socket.handshake.address,
          userAgent: socket.handshake.headers['user-agent']
        });
        
        return next(new Error('Authentication required'));
      }

      // Verify JWT
      const decoded = jwt.verify(token, this.JWT_SECRET);
      
      // Add user info to socket
      socket.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
        permissions: decoded.permissions || []
      };
      
      secureLogger.info('WebSocket authenticated', {
        userId: socket.user.id,
        role: socket.user.role,
        ip: socket.handshake.address
      });
      
      next();
      
    } catch (error) {
      secureLogger.logSecurityEvent('WebSocket authentication failed', {
        ip: socket.handshake.address,
        error: error.message,
        userAgent: socket.handshake.headers['user-agent']
      });
      
      next(new Error('Authentication failed'));
    }
  }

  extractTokenFromHeaders(headers) {
    const authHeader = headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    return null;
  }

  // Generate JWT token
  generateToken(user) {
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      permissions: user.permissions || []
    };
    
    const options = {
      expiresIn: process.env.JWT_EXPIRES_IN || '24h',
      issuer: 'soc-dashboard',
      audience: 'soc-dashboard'
    };
    
    return jwt.sign(payload, this.JWT_SECRET, options);
  }

  // Refresh token
  refreshToken(token) {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET, { ignoreExpiration: true });
      
      // Check if token is not too old (max 7 days)
      const tokenAge = Date.now() - (decoded.iat * 1000);
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
      
      if (tokenAge > maxAge) {
        throw new Error('Token too old for refresh');
      }
      
      // Generate new token with same payload
      const newPayload = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
        permissions: decoded.permissions || []
      };
      
      return jwt.sign(newPayload, this.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '24h',
        issuer: 'soc-dashboard',
        audience: 'soc-dashboard'
      });
      
    } catch (error) {
      throw new Error('Token refresh failed');
    }
  }
}

export default new AuthMiddleware();
