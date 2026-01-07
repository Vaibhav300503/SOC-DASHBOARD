/**
 * Log Classification Middleware
 * Applies standardized log type classification to incoming logs
 * Part of Task 2.1: Update Log Processing Pipeline
 */

import LogTypeClassifier from '../utils/logTypeClassifier.js';
import severityClassifier from '../utils/severityClassifier.js';

class LogClassificationMiddleware {
  constructor() {
    this.classifier = new LogTypeClassifier();
  }

  /**
   * Middleware function to classify logs during ingestion
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Next middleware function
   */
  classifyLogs = (req, res, next) => {
    try {
      // Handle both single log and array of logs
      let logs = Array.isArray(req.body) ? req.body : [req.body];

      // Apply classification to each log
      logs = logs.map(log => this.classifyLog(log));

      // Update request body with classified logs
      req.body = Array.isArray(req.body) ? logs : logs[0];

      next();
    } catch (error) {
      console.error('Error in log classification middleware:', error);
      // Don't fail the request, just log the error and continue
      next();
    }
  };

  /**
   * Classify a single log entry
   * @param {Object} log - The log entry to classify
   * @returns {Object} - The log with classification applied
   */
  classifyLog(log) {
    try {
      // Get the standardized log type
      const standardizedType = this.classifier.classify(log);

      // Preserve original log type information
      const originalLogType = log.metadata?.log_source || log.log_type || 'unknown';

      // Get classification metadata
      const classificationMetadata = this.classifier.getClassificationMetadata();

      // Calculate severity
      const severity = severityClassifier.classify(log);

      // Return log with classification applied
      return {
        ...log,
        log_type: standardizedType,
        original_log_type: originalLogType,
        severity: severity,
        ...classificationMetadata
      };

    } catch (error) {
      console.error('Error classifying individual log:', error);
      // Return original log if classification fails
      return {
        ...log,
        log_type: 'system', // default fallback
        original_log_type: log.metadata?.log_source || log.log_type || 'unknown',
        classification_version: '1.0',
        classified_at: new Date(),
        classification_error: error.message
      };
    }
  }

  /**
   * Batch classify existing logs (for migration)
   * @param {Array<Object>} logs - Array of log documents
   * @returns {Array<Object>} - Array of classified logs
   */
  classifyBatch(logs) {
    return logs.map(log => this.classifyLog(log));
  }

  /**
   * Get classification statistics for a batch of logs
   * @param {Array<Object>} logs - Array of log documents
   * @returns {Object} - Classification statistics
   */
  getClassificationStats(logs) {
    const stats = {
      total: logs.length,
      auth: 0,
      network: 0,
      firewall: 0,
      application: 0,
      database: 0,
      system: 0,
      registry: 0,
      fim: 0
    };

    logs.forEach(log => {
      const logType = this.classifier.classify(log);
      if (stats.hasOwnProperty(logType)) {
        stats[logType]++;
      }
    });

    return stats;
  }
}

// Create singleton instance
const logClassificationMiddleware = new LogClassificationMiddleware();

export default logClassificationMiddleware;
export { LogClassificationMiddleware };