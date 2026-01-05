import axios from 'axios'
import Case from '../models/Case.js'
import logger from '../utils/logger.js'

/**
 * CaseService - Hybrid data source service for case management
 * Implements fallback mechanism between TheHive API and MongoDB
 * Provides data normalization and error handling
 */
class CaseService {
  constructor() {
    this.cache = new Map()
    this.cacheTimeout = 5 * 60 * 1000 // 5 minutes
    this.retryConfig = {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 10000
    }
  }

  /**
   * Get recent cases with hybrid data source fallback
   * @param {number} limit - Maximum number of cases to retrieve
   * @returns {Promise<Array>} Array of normalized case objects
   */
  async getRecentCases(limit = 20) {
    const cacheKey = `recent_cases_${limit}`
    
    try {
      // Check cache first
      const cached = this.getCachedResponse(cacheKey)
      if (cached) {
        logger.info('CaseService: Returning cached cases', { source: 'cache', count: cached.length })
        return cached
      }

      // Try TheHive API first
      try {
        const hiveData = await this.fetchFromTheHive(limit)
        if (hiveData && hiveData.length > 0) {
          const normalizedCases = hiveData.map(rawCase => this.normalizeCase(rawCase, 'TheHive'))
          this.setCachedResponse(cacheKey, normalizedCases)
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
        this.setCachedResponse(cacheKey, normalizedCases)
        logger.info('CaseService: Retrieved cases from MongoDB fallback', { count: normalizedCases.length })
      }
      
      return normalizedCases

    } catch (error) {
      logger.error('CaseService: All data sources failed', { error: error.message })
      
      // Try to return cached data as last resort
      const cached = this.getCachedResponse(cacheKey, true) // ignore timeout
      if (cached) {
        logger.info('CaseService: Returning stale cached data due to all sources failing')
        return cached
      }
      
      throw new Error('All data sources unavailable and no cached data available')
    }
  }

  /**
   * Get a specific case by ID
   * @param {string} id - Case ID
   * @returns {Promise<Object|null>} Normalized case object or null
   */
  async getCaseById(id) {
    try {
      // Try TheHive first
      try {
        const hiveCase = await this.fetchCaseFromTheHive(id)
        if (hiveCase) {
          return this.normalizeCase(hiveCase, 'TheHive')
        }
      } catch (hiveError) {
        logger.warn('CaseService: TheHive case fetch failed, trying MongoDB', { 
          id, 
          error: hiveError.message 
        })
      }

      // Fallback to MongoDB
      const mongoCase = await Case.findById(id).lean()
      if (mongoCase) {
        return this.normalizeCase(mongoCase, 'MongoDB')
      }

      return null
    } catch (error) {
      logger.error('CaseService: Failed to get case by ID', { id, error: error.message })
      throw error
    }
  }

  /**
   * Create a new case
   * @param {Object} caseData - Case data to create
   * @returns {Promise<Object>} Created and normalized case object
   */
  async createCase(caseData) {
    try {
      // Always create in MongoDB first
      const mongoCase = new Case({
        ...caseData,
        source: 'MongoDB',
        created_by: caseData.created_by || 'system'
      })
      
      await mongoCase.save()
      logger.info('CaseService: Case created in MongoDB', { id: mongoCase._id })

      // Try to sync to TheHive if available
      try {
        const hiveCase = await this.createCaseInTheHive(caseData)
        if (hiveCase && hiveCase.id) {
          // Update MongoDB case with TheHive ID
          mongoCase.thehive_id = hiveCase.id
          mongoCase.source = 'TheHive'
          await mongoCase.save()
          logger.info('CaseService: Case synced to TheHive', { 
            mongoId: mongoCase._id, 
            hiveId: hiveCase.id 
          })
        }
      } catch (hiveError) {
        logger.warn('CaseService: Failed to sync case to TheHive', { 
          id: mongoCase._id, 
          error: hiveError.message 
        })
      }

      // Clear cache to ensure fresh data
      this.clearCache()
      
      return this.normalizeCase(mongoCase.toObject(), mongoCase.source)
    } catch (error) {
      logger.error('CaseService: Failed to create case', { error: error.message })
      throw error
    }
  }

  /**
   * Update an existing case
   * @param {string} id - Case ID
   * @param {Object} updates - Updates to apply
   * @returns {Promise<Object>} Updated and normalized case object
   */
  async updateCase(id, updates) {
    try {
      // Update in MongoDB
      const mongoCase = await Case.findByIdAndUpdate(
        id, 
        { ...updates, updated_at: new Date() }, 
        { new: true }
      )

      if (!mongoCase) {
        throw new Error(`Case not found: ${id}`)
      }

      logger.info('CaseService: Case updated in MongoDB', { id })

      // Try to sync to TheHive if it has a TheHive ID
      if (mongoCase.thehive_id) {
        try {
          await this.updateCaseInTheHive(mongoCase.thehive_id, updates)
          logger.info('CaseService: Case updated in TheHive', { 
            mongoId: id, 
            hiveId: mongoCase.thehive_id 
          })
        } catch (hiveError) {
          logger.warn('CaseService: Failed to sync case update to TheHive', { 
            id, 
            error: hiveError.message 
          })
        }
      }

      // Clear cache to ensure fresh data
      this.clearCache()
      
      return this.normalizeCase(mongoCase.toObject(), mongoCase.source)
    } catch (error) {
      logger.error('CaseService: Failed to update case', { id, error: error.message })
      throw error
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
   * Fetch cases from MongoDB
   * @private
   * @param {number} limit - Maximum number of cases to retrieve
   * @returns {Promise<Array>} Raw MongoDB case data
   */
  async fetchFromMongoDB(limit) {
    try {
      const cases = await Case.find()
        .sort({ created_at: -1 })
        .limit(limit)
        .lean()
      
      return cases || []
    } catch (error) {
      logger.error('CaseService: MongoDB query failed', { error: error.message })
      throw error
    }
  }

  /**
   * Fetch a specific case from TheHive
   * @private
   * @param {string} id - Case ID
   * @returns {Promise<Object|null>} Raw TheHive case data
   */
  async fetchCaseFromTheHive(id) {
    const client = this.getTheHiveClient()
    if (!client) {
      throw new Error('TheHive client not configured')
    }

    const path = `${process.env.THEHIVE_CASES_PATH || '/api/v1/case'}/${id}`
    
    try {
      const response = await this.retryRequest(() => client.get(path))
      return response.data
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return null
      }
      throw error
    }
  }

  /**
   * Create a case in TheHive
   * @private
   * @param {Object} caseData - Case data
   * @returns {Promise<Object>} Created TheHive case
   */
  async createCaseInTheHive(caseData) {
    const client = this.getTheHiveClient()
    if (!client) {
      throw new Error('TheHive client not configured')
    }

    const path = process.env.THEHIVE_CASES_PATH || '/api/v1/case'
    const payload = {
      title: caseData.title,
      description: caseData.description,
      severity: caseData.severity || 1,
      tags: caseData.tags || [],
      customFields: {
        source: 'SOC Dashboard'
      }
    }

    const response = await this.retryRequest(() => 
      client.post(path, payload)
    )

    return response.data
  }

  /**
   * Update a case in TheHive
   * @private
   * @param {string} hiveId - TheHive case ID
   * @param {Object} updates - Updates to apply
   * @returns {Promise<Object>} Updated TheHive case
   */
  async updateCaseInTheHive(hiveId, updates) {
    const client = this.getTheHiveClient()
    if (!client) {
      throw new Error('TheHive client not configured')
    }

    const path = `${process.env.THEHIVE_CASES_PATH || '/api/v1/case'}/${hiveId}`
    
    const response = await this.retryRequest(() => 
      client.patch(path, updates)
    )

    return response.data
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
      createdAt: this.normalizeTimestamp(rawCase.createdAt || rawCase._createdAt || rawCase.created_at),
      updatedAt: this.normalizeTimestamp(rawCase.updatedAt || rawCase._updatedAt || rawCase.updated_at),
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
   * Normalize severity values across sources
   * @private
   * @param {*} severity - Raw severity value
   * @returns {number} Normalized severity (1-4)
   */
  normalizeSeverity(severity) {
    if (typeof severity === 'number') {
      return Math.max(1, Math.min(4, severity))
    }
    
    if (typeof severity === 'string') {
      switch (severity.toLowerCase()) {
        case 'critical': return 4
        case 'high': return 3
        case 'medium': return 2
        case 'low': return 1
        default: return 1
      }
    }
    
    return 1
  }

  /**
   * Normalize status values across sources
   * @private
   * @param {*} status - Raw status value
   * @returns {string} Normalized status
   */
  normalizeStatus(status) {
    if (!status) return 'Open'
    
    const statusStr = status.toString().toLowerCase()
    const statusMap = {
      'open': 'Open',
      'new': 'Open',
      'inprogress': 'InProgress',
      'in-progress': 'InProgress',
      'in_progress': 'InProgress',
      'resolved': 'Resolved',
      'closed': 'Closed',
      'complete': 'Closed',
      'completed': 'Closed'
    }
    
    return statusMap[statusStr] || 'Open'
  }

  /**
   * Normalize timestamp values across sources
   * @private
   * @param {*} timestamp - Raw timestamp value
   * @returns {Date} Normalized Date object
   */
  normalizeTimestamp(timestamp) {
    if (!timestamp) return new Date()
    
    if (timestamp instanceof Date) return timestamp
    
    if (typeof timestamp === 'number') return new Date(timestamp)
    
    if (typeof timestamp === 'string') return new Date(timestamp)
    
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
        
        const delay = Math.min(
          this.retryConfig.baseDelay * Math.pow(2, attempt),
          this.retryConfig.maxDelay
        )
        
        logger.warn(`CaseService: Request failed, retrying in ${delay}ms`, { 
          attempt: attempt + 1, 
          maxRetries: this.retryConfig.maxRetries,
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