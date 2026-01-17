/**
 * Log Type Classifier
 * Classifies logs into 8 standardized categories based on analysis of existing data
 * Part of Task 1.2: Create Comprehensive Mapping Rules
 */

import { LOG_TYPE_MAPPINGS } from '../config/logTypeMappings.js';

class LogTypeClassifier {
  constructor() {
    this.mappingRules = LOG_TYPE_MAPPINGS;
    this.defaultCategory = 'system';
    this.classificationVersion = '1.0';
  }

  /**
   * Classify a log entry into one of the 8 standardized categories
   * @param {Object} log - The log document
   * @returns {string} - The standardized log type category
   */
  classify(log) {
    try {
      // Extract potential log type sources in priority order
      const logSources = this.extractLogSources(log);

      // Try to classify using each source
      for (const source of logSources) {
        if (!source) continue;

        const category = this.matchCategory(source);
        if (category) {
          return category;
        }
      }

      // Return default category if no match found
      return this.defaultCategory;

    } catch (error) {
      console.error('Error classifying log:', error);
      return this.defaultCategory;
    }
  }

  /**
   * Extract potential log type sources from log document
   * @param {Object} log - The log document
   * @returns {Array<string>} - Array of potential log sources in priority order
   */
  extractLogSources(log) {
    const sources = [];

    // Priority 1: log_source at TOP LEVEL (agent logs send this at root)
    if (log.log_source) {
      sources.push(log.log_source);
    }

    // Priority 2: metadata.log_source (primary field based on analysis)
    if (log.metadata?.log_source) {
      sources.push(log.metadata.log_source);
    }

    // Priority 3: raw_data.log_source (fallback)
    if (log.raw_data?.log_source) {
      sources.push(log.raw_data.log_source);
    }

    // Priority 4: log_type field (if exists)
    if (log.log_type) {
      sources.push(log.log_type);
    }

    // Priority 5: raw_data.type
    if (log.raw_data?.type) {
      sources.push(log.raw_data.type);
    }

    // Priority 6: Extract from message or other fields
    if (log.message) {
      const extractedType = this.extractFromMessage(log.message);
      if (extractedType) {
        sources.push(extractedType);
      }
    }

    return sources.filter(Boolean);
  }

  /**
   * Match a log source to a category using mapping rules
   * @param {string} logSource - The log source string
   * @returns {string|null} - The matched category or null
   */
  matchCategory(logSource) {
    const normalizedSource = logSource.toLowerCase().trim();

    // Check each category's mapping rules
    for (const [category, rules] of Object.entries(this.mappingRules)) {
      // Check exact matches first
      if (rules.exactMatches && rules.exactMatches.includes(logSource)) {
        return category;
      }

      // Check pattern matches
      if (rules.patterns) {
        for (const pattern of rules.patterns) {
          if (pattern.test(normalizedSource)) {
            return category;
          }
        }
      }

      // Check keyword matches
      if (rules.keywords) {
        for (const keyword of rules.keywords) {
          if (normalizedSource.includes(keyword.toLowerCase())) {
            return category;
          }
        }
      }

      // Check source name matches
      if (rules.sources) {
        for (const sourceName of rules.sources) {
          if (normalizedSource.includes(sourceName.toLowerCase())) {
            return category;
          }
        }
      }
    }

    return null;
  }

  /**
   * Extract log type information from message content
   * @param {string} message - The log message
   * @returns {string|null} - Extracted type or null
   */
  extractFromMessage(message) {
    if (!message || typeof message !== 'string') {
      return null;
    }

    const normalizedMessage = message.toLowerCase();

    // Look for common patterns in messages
    const patterns = [
      { pattern: /authentication|login|logon|auth/i, type: 'authentication' },
      { pattern: /network|tcp|udp|connection/i, type: 'network' },
      { pattern: /firewall|block|deny|allow/i, type: 'firewall' },
      { pattern: /application|app|service/i, type: 'application' },
      { pattern: /database|sql|query/i, type: 'database' },
      { pattern: /registry|reg|hkey/i, type: 'registry' },
      { pattern: /file.*integrity|fim/i, type: 'fim' }
    ];

    for (const { pattern, type } of patterns) {
      if (pattern.test(normalizedMessage)) {
        return type;
      }
    }

    return null;
  }

  /**
   * Get classification metadata
   * @returns {Object} - Classification metadata
   */
  getClassificationMetadata() {
    return {
      classification_version: this.classificationVersion,
      classified_at: new Date(),
      classifier: 'LogTypeClassifier'
    };
  }

  /**
   * Classify multiple logs in batch
   * @param {Array<Object>} logs - Array of log documents
   * @returns {Array<Object>} - Array of classification results
   */
  classifyBatch(logs) {
    return logs.map(log => ({
      _id: log._id,
      original_log_type: log.metadata?.log_source || log.log_type || 'unknown',
      standardized_log_type: this.classify(log),
      ...this.getClassificationMetadata()
    }));
  }

  /**
   * Get statistics about classification coverage
   * @param {Array<string>} logSources - Array of log sources to analyze
   * @returns {Object} - Coverage statistics
   */
  getCoverageStats(logSources) {
    const stats = {
      total: logSources.length,
      classified: 0,
      unclassified: 0,
      categoryBreakdown: {},
      unclassifiedSources: []
    };

    // Initialize category breakdown
    Object.keys(this.mappingRules).forEach(category => {
      stats.categoryBreakdown[category] = 0;
    });
    stats.categoryBreakdown[this.defaultCategory] = 0;

    logSources.forEach(source => {
      const category = this.matchCategory(source) || this.defaultCategory;

      if (category === this.defaultCategory && !this.matchCategory(source)) {
        stats.unclassified++;
        stats.unclassifiedSources.push(source);
      } else {
        stats.classified++;
      }

      stats.categoryBreakdown[category]++;
    });

    stats.coveragePercentage = ((stats.classified / stats.total) * 100).toFixed(2);

    return stats;
  }

  /**
   * Validate classification rules against known log sources
   * @param {Array<Object>} logSourceData - Array of {_id: source, count: number}
   * @returns {Object} - Validation results
   */
  validateRules(logSourceData) {
    const validation = {
      totalSources: logSourceData.length,
      totalLogs: logSourceData.reduce((sum, item) => sum + item.count, 0),
      categoryStats: {},
      unclassifiedSources: [],
      coverageByVolume: 0
    };

    // Initialize category stats
    Object.keys(this.mappingRules).forEach(category => {
      validation.categoryStats[category] = {
        sources: 0,
        logs: 0,
        sourceNames: []
      };
    });
    validation.categoryStats[this.defaultCategory] = {
      sources: 0,
      logs: 0,
      sourceNames: []
    };

    let classifiedLogs = 0;

    logSourceData.forEach(item => {
      const source = item._id;
      const count = item.count;
      const category = this.matchCategory(source) || this.defaultCategory;

      validation.categoryStats[category].sources++;
      validation.categoryStats[category].logs += count;
      validation.categoryStats[category].sourceNames.push(`${source} (${count})`);

      if (category !== this.defaultCategory || this.matchCategory(source)) {
        classifiedLogs += count;
      } else {
        validation.unclassifiedSources.push({ source, count });
      }
    });

    validation.coverageByVolume = ((classifiedLogs / validation.totalLogs) * 100).toFixed(2);

    return validation;
  }
}

export default LogTypeClassifier;