import winston from 'winston';
import secureConfig from '../config/secureConfig.js';

class SecureLogger {
  constructor() {
    this.logger = this.createSecureLogger();
  }

  createSecureLogger() {
    // Custom format that sanitizes sensitive data
    const sanitizeFormat = winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.printf(({ level, message, timestamp, stack, ...meta }) => {
        // Sanitize meta object
        const sanitizedMeta = secureConfig.sanitizeForLogging(meta);
        
        // Build log message
        let logMessage = `${timestamp} [${level.toUpperCase()}]: ${message}`;
        
        // Add sanitized metadata
        if (Object.keys(sanitizedMeta).length > 0) {
          logMessage += ' ' + JSON.stringify(sanitizedMeta);
        }
        
        // Add stack trace if available
        if (stack) {
          logMessage += `\n${stack}`;
        }
        
        return logMessage;
      })
    );

    // Create logger with secure formatting
    const logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: sanitizeFormat,
      transports: [
        // Error log file
        new winston.transports.File({ 
          filename: 'logs/error.log', 
          level: 'error',
          maxsize: 10485760, // 10MB
          maxFiles: 5
        }),
        // Combined log file
        new winston.transports.File({ 
          filename: 'logs/combined.log',
          maxsize: 10485760, // 10MB
          maxFiles: 10
        })
      ],
      // Handle uncaught exceptions
      exceptionHandlers: [
        new winston.transports.File({ filename: 'logs/exceptions.log' })
      ],
      // Handle unhandled promise rejections
      rejectionHandlers: [
        new winston.transports.File({ filename: 'logs/rejections.log' })
      ]
    });

    // Add console transport for development
    if (process.env.NODE_ENV !== 'production') {
      logger.add(new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          sanitizeFormat
        )
      }));
    }

    return logger;
  }

  // Safe logging methods
  info(message, meta = {}) {
    this.logger.info(message, meta);
  }

  warn(message, meta = {}) {
    this.logger.warn(message, meta);
  }

  error(message, meta = {}) {
    this.logger.error(message, meta);
  }

  debug(message, meta = {}) {
    this.logger.debug(message, meta);
  }

  // Special method for logging API requests (sanitizes headers/body)
  logRequest(req, res, responseTime) {
    const sanitizedHeaders = this.sanitizeHeaders(req.headers);
    const sanitizedBody = this.sanitizeBody(req.body);
    
    this.info('HTTP Request', {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      headers: sanitizedHeaders,
      body: sanitizedBody
    });
  }

  // Sanitize request headers
  sanitizeHeaders(headers) {
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];
    const sanitized = { ...headers };
    
    sensitiveHeaders.forEach(header => {
      if (sanitized[header]) {
        sanitized[header] = '[REDACTED]';
      }
    });
    
    return sanitized;
  }

  // Sanitize request body
  sanitizeBody(body) {
    if (!body || typeof body !== 'object') {
      return body;
    }
    
    return secureConfig.sanitizeForLogging(body);
  }

  // Log security events with higher severity
  logSecurityEvent(event, details = {}) {
    this.error(`SECURITY: ${event}`, {
      ...details,
      timestamp: new Date().toISOString(),
      severity: 'SECURITY'
    });
  }

  // Log Tailscale API calls without exposing credentials
  logTailscaleAPICall(endpoint, success, duration, error = null) {
    const logData = {
      endpoint,
      success,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    };
    
    if (error) {
      logData.error = error.message;
      this.warn('Tailscale API call failed', logData);
    } else {
      this.info('Tailscale API call successful', logData);
    }
  }
}

export default new SecureLogger();
