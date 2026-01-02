import dotenv from 'dotenv';
import crypto from 'crypto';

// Secure environment configuration
class SecureConfig {
  constructor() {
    this.sensitiveKeys = [
      'TAILSCALE_API_KEY',
      'MONGODB_URI',
      'JWT_SECRET',
      'DATABASE_PASSWORD',
      'API_SECRET_KEY'
    ];
    
    this.loadAndValidateEnv();
  }

  loadAndValidateEnv() {
    // Load environment variables
    dotenv.config();
    
    // Validate required environment variables
    const required = ['PORT', 'MONGODB_URI', 'JWT_SECRET'];
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
    
    // Sanitize sensitive values
    this.sanitizeEnvironment();
  }

  // Sanitize environment to prevent secret leakage
  sanitizeEnvironment() {
    this.sensitiveKeys.forEach(key => {
      if (process.env[key]) {
        // Store original value for internal use
        const original = process.env[key];
        
        // Try to mask the property, but handle Windows Node.js limitations
        try {
          Object.defineProperty(process.env, key, {
            get: () => original,
            enumerable: false, // Hide from console.log(process.env)
            configurable: true // Make configurable to avoid Windows issues
          });
        } catch (error) {
          // Fallback: just store internally if property definition fails
          this[`_${key}`] = original;
        }
      }
    });
  }

  // Safe getter for API key with validation
  getTailscaleAPIKey() {
    const apiKey = process.env.TAILSCALE_API_KEY;
    
    if (!apiKey) {
      return null;
    }
    
    // Validate API key format
    if (!apiKey.startsWith('tskey-api-')) {
      console.error('❌ Invalid Tailscale API key format');
      return null;
    }
    
    // Validate API key length
    if (apiKey.length < 20) {
      console.error('❌ Tailscale API key too short');
      return null;
    }
    
    return apiKey;
  }

  // Secure MongoDB URI builder
  getMongoURI() {
    const uri = process.env.MONGODB_URI;
    
    if (!uri) {
      throw new Error('MongoDB URI is required');
    }
    
    // Validate URI format
    try {
      const url = new URL(uri);
      
      // Check for secure connection in production
      if (process.env.NODE_ENV === 'production' && url.protocol !== 'mongodb:') {
        console.warn('⚠️  Consider using MongoDB with SSL/TLS in production');
      }
      
      return uri;
    } catch (error) {
      throw new Error(`Invalid MongoDB URI: ${error.message}`);
    }
  }

  // Mask sensitive values for logging
  maskSensitiveValue(value, key) {
    if (!value || !this.sensitiveKeys.includes(key)) {
      return value;
    }
    
    if (value.length <= 8) {
      return '*'.repeat(value.length);
    }
    
    // Show first 3 and last 3 characters
    return value.substring(0, 3) + '*'.repeat(value.length - 6) + value.substring(value.length - 3);
  }

  // Sanitize object for logging (remove sensitive fields)
  sanitizeForLogging(obj) {
    const sanitized = { ...obj };
    
    Object.keys(sanitized).forEach(key => {
      if (this.sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive.toLowerCase()))) {
        sanitized[key] = this.maskSensitiveValue(sanitized[key], key);
      }
      
      // Recursively sanitize nested objects
      if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        sanitized[key] = this.sanitizeForLogging(sanitized[key]);
      }
    });
    
    return sanitized;
  }

  // Validate environment is production-ready
  validateProductionConfig() {
    const issues = [];
    
    if (process.env.NODE_ENV === 'production') {
      // Check for production security settings
      if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
        issues.push('JWT_SECRET must be at least 32 characters in production');
      }
      
      if (process.env.FRONTEND_URL && process.env.FRONTEND_URL.includes('localhost')) {
        issues.push('FRONTEND_URL should not be localhost in production');
      }
      
      if (!process.env.TAILSCALE_API_KEY) {
        issues.push('TAILSCALE_API_KEY is required in production');
      }
      
      // Check for HTTPS
      if (!process.env.FORCE_HTTPS) {
        issues.push('Consider setting FORCE_HTTPS=true in production');
      }
    }
    
    return issues;
  }

  // Generate secure random secrets
  static generateSecureSecret(length = 64) {
    return crypto.randomBytes(length).toString('hex');
  }

  // Hash sensitive data for comparison
  static hashSensitiveData(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
  }
}

export default new SecureConfig();
