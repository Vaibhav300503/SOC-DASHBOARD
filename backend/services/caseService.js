import axios from 'axios'
import Case from '../models/Case.js'
import logger from '../utils/logger.js'
import cache from '../utils/cache.js'
import metricsService from './metricsService.js'
import eventBus from '../utils/eventBus.js'

class CaseService {
  constructor() {
    this.cacheDuration = 60 * 1000 // 1 minute cache for case queries
    this.cache = cache
    this.retryConfig = {
      maxRetries: parseInt(process.env.CASE_SYNC_MAX_RETRIES, 10) || 3,
      baseDelay: parseInt(process.env.CASE_SYNC_RETRY_BASE, 10) || 1000,
      maxDelay: parseInt(process.env.CASE_SYNC_RETRY_MAX, 10) || 8000
    }
    this.metrics = metricsService
    this.validateHiveConfig()
  }

  validateHiveConfig() {
    const { THEHIVE_BASE_URL, THEHIVE_CASES_PATH } = process.env
    if (!THEHIVE_BASE_URL) {
      logger.warn('CaseService: THEHIVE_BASE_URL not configured; remote sync disabled')
      return
    }

    if (THEHIVE_CASES_PATH && !THEHIVE_CASES_PATH.startsWith('/')) {
      logger.warn('CaseService: THEHIVE_CASES_PATH should start with "/"; normalizing automatically', {
        path: THEHIVE_CASES_PATH
      })
      process.env.THEHIVE_CASES_PATH = `/${THEHIVE_CASES_PATH}`
    }
  }

  /**
   * Get recent cases with hybrid data source fallback
   * @param {number} limit - Maximum number of cases to retrieve
   * @returns {Promise<Array>} Array of normalized case objects
   */
  async getRecentCases(limit = 20) {
    const cacheKey = `recent_cases_${limit}`
    const cached = this.cache.get(cacheKey)
    if (cached) {
      logger.info('CaseService: Returning cached cases', { source: 'cache', count: cached.length })
      return cached
    }

    try {
      // Try TheHive API first
      try {
        const hiveData = await this.fetchFromTheHive(limit)
        if (hiveData && hiveData.length > 0) {
          const normalizedCases = hiveData.map(rawCase => this.normalizeCase(rawCase, 'TheHive'))
          this.cache.set(cacheKey, normalizedCases, this.cacheDuration)
          logger.info('CaseService: Retrieved cases from TheHive', { count: normalizedCases.length })
          return normalizedCases
        }
      } catch (hiveError) {
        logger.warn('CaseService: TheHive API failed, falling back to MongoDB', { 
          error: hiveError.message,
          fallback: 'MongoDB'
        })
        this.logFallbackOperation('TheHive', 'MongoDB', hiveError.message)
      }

      // Fallback to MongoDB
      const mongoData = await this.fetchFromMongoDB(limit)
      const normalizedCases = mongoData.map(rawCase => this.normalizeCase(rawCase, 'MongoDB'))
      
      if (normalizedCases.length > 0) {
        this.cache.set(cacheKey, normalizedCases, this.cacheDuration)
        logger.info('CaseService: Retrieved cases from MongoDB fallback', { count: normalizedCases.length })
      }
      
      return normalizedCases

    } catch (error) {
      logger.error('CaseService: All data sources failed', { error: error.message })
      
      // Try to return cached data as last resort
      const cached = this.cache.get(cacheKey)
      if (cached) {
        logger.info('CaseService: Returning stale cached data due to all sources failing')
        return cached
      }
      
      throw new Error('All data sources unavailable and no cached data available')
    }
  }

  /**
   * Fetch cases from TheHive API
   * @private
   * @param {number} limit - Maximum number of cases to retrieve
   * @returns {Promise<Array>} Raw TheHive case data
   */
  async fetchFromTheHive(limit) {
    const client = this.getTheHiveClient()
    if (!client) {
      throw new Error('TheHive client not configured')
    }

    const path = process.env.THEHIVE_CASES_PATH || '/api/v1/case'
    const params = { sort: '-createdAt', range: `0-${limit - 1}` }

    const response = await this.retryRequest(() =>
      client.get(path, { params })
    )

    return Array.isArray(response.data) ? response.data : []
  }

  /**
   * Normalize case data from different sources
   * @private
   * @param {Object} rawCase - Raw case data from source
   * @param {string} source - Data source ('TheHive' or 'MongoDB')
   * @returns {Object} Normalized case object
   */
  normalizeCase(rawCase, source) {
    const normalized = {
      id: rawCase.id || rawCase._id?.toString(),
      title: rawCase.title || 'Untitled Case',
      description: rawCase.description || '',
      severity: this.normalizeSeverity(rawCase.severity),
      status: this.normalizeStatus(rawCase.status),
      owner: rawCase.owner || rawCase.assignee || 'Unassigned',
      source: source,
      tags: Array.isArray(rawCase.tags) ? rawCase.tags : [],
      artifacts: Array.isArray(rawCase.artifacts) ? rawCase.artifacts : [],
      createdAt: this.normalizeTimestamp(rawCase.createdAt || rawCase._createdAt || rawCase.created_at, 'createdAt', rawCase.id || rawCase._id),
      updatedAt: this.normalizeTimestamp(rawCase.updatedAt || rawCase._updatedAt || rawCase.updated_at, 'updatedAt', rawCase.id || rawCase._id),
      created_by: rawCase.created_by || rawCase.createdBy || 'system'
    }

    // Add source-specific fields
    if (source === 'TheHive') {
      normalized.thehive_id = rawCase.id
    } else if (source === 'MongoDB') {
      normalized._id = rawCase._id
      if (rawCase.thehive_id) {
        normalized.thehive_id = rawCase.thehive_id
      }
    }

    return normalized
  }

  /**
   * Normalize timestamp values across sources
   * @private
   * @param {*} timestamp - Raw timestamp value
   * @param {string} field - Field name (createdAt or updatedAt)
   * @param {string} id - Case ID
   * @returns {Date} Normalized Date object
   */
  normalizeTimestamp(timestamp, field, id) {
    if (!timestamp) return new Date()

    if (timestamp instanceof Date) {
      return new Date(timestamp.getTime())
    }

    if (typeof timestamp === 'number') {
      return new Date(timestamp)
    }

    if (typeof timestamp === 'string') {
      // Avoid double offsets; assume timestamps without timezone are UTC
      if (timestamp.includes('T') && !timestamp.includes('Z') && !/[+-]\d{2}:?\d{2}$/.test(timestamp)) {
        return new Date(`${timestamp}Z`)
      }
      return new Date(timestamp)
    }

    logger.warn(`CaseService: Invalid ${field} timestamp for case ${id}`, { timestamp: timestamp.toString() })
    return new Date()
  }

  /**
   * Get TheHive API client
   * @private
   * @returns {Object|null} Axios client or null if not configured
   */
  getTheHiveClient() {
    const { THEHIVE_BASE_URL, THEHIVE_API_KEY, THEHIVE_AUTH_HEADER } = process.env
    
    if (!THEHIVE_BASE_URL || (!THEHIVE_API_KEY && !THEHIVE_AUTH_HEADER)) {
      return null
    }

    const authHeader = THEHIVE_AUTH_HEADER || `Bearer ${THEHIVE_API_KEY}`

    return axios.create({
      baseURL: THEHIVE_BASE_URL,
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json'
      },
      timeout: parseInt(process.env.THEHIVE_TIMEOUT) || 10000
    })
  }

  /**
   * Retry mechanism for API requests
   * @private
   * @param {Function} requestFn - Function that makes the request
   * @returns {Promise} Request response
   */
  async retryRequest(requestFn) {
    let lastError

    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        return await requestFn()
      } catch (error) {
        lastError = error

        if (attempt === this.retryConfig.maxRetries) {
          break
        }

        // Don't retry on 4xx errors (except 429)
        if (error.response && error.response.status >= 400 && error.response.status < 500 && error.response.status !== 429) {
          break
        }

        const backoff = this.retryConfig.baseDelay * Math.pow(2, attempt)
        const jitter = Math.random() * 250
        const delay = Math.min(backoff + jitter, this.retryConfig.maxDelay)

        logger.warn(`CaseService: Request failed, retrying in ${Math.round(delay)}ms`, {
          attempt: attempt + 1,
          maxRetries: this.retryConfig.maxRetries,
          status: error.response?.status,
          error: error.message
        })

        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    throw lastError
  }

  /**
   * Log fallback operations for monitoring
   * @private
   * @param {string} fromSource - Source that failed
   * @param {string} toSource - Fallback source
   * @param {string} reason - Reason for fallback
   */
  logFallbackOperation(fromSource, toSource, reason) {
    logger.warn('CaseService: Data source fallback occurred', {
      from: fromSource,
      to: toSource,
      reason: reason,
      timestamp: new Date().toISOString()
    })
  }

  /**
   * Get cached response
   * @private
   * @param {string} key - Cache key
   * @param {boolean} ignoreTimeout - Whether to ignore cache timeout
   * @returns {*} Cached data or null
   */
  getCachedResponse(key, ignoreTimeout = false) {
    const cached = this.cache.get(key)
    if (!cached) return null
    
    if (!ignoreTimeout && Date.now() - cached.timestamp > this.cacheTimeout) {
      this.cache.delete(key)
      return null
    }
    
    return cached.data
  }

  /**
   * Set cached response
   * @private
   * @param {string} key - Cache key
   * @param {*} data - Data to cache
   */
  setCachedResponse(key, data) {
    this.cache.set(key, {
      data: data,
      timestamp: Date.now()
    })
  }

  /**
   * Clear all cached responses
   * @private
   */
  clearCache() {
    this.cache.clear()
  }
}

// Export singleton instance
export default new CaseService()