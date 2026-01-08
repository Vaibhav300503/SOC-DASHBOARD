import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002/api'

export const logsAPI = {
  /**
   * Get all logs with filtering and pagination
   */
  async getAll(filters = {}) {
    try {
      const params = {
        limit: filters.limit || 100,
        page: filters.page || 1,
        timeRange: filters.timeRange || '24h',
        severity: filters.severity || null,
        logType: filters.logType || null,
        action: filters.action || null
      }

      const response = await axios.get(`${API_BASE}/logs`, { params })
      return response.data
    } catch (error) {
      console.error('Error fetching all logs:', error)
      throw error
    }
  },

  /**
   * Get recent logs
   */
  async getRecent(limit = 100, severity = null, logType = null) {
    try {
      const params = { limit }
      if (severity) params.severity = severity
      if (logType) params.logType = logType

      const response = await axios.get(`${API_BASE}/logs/recent`, { params })
      return response.data
    } catch (error) {
      console.error('Error fetching recent logs:', error)
      throw error
    }
  },

  /**
   * Get geolocation data for map
   */
  async getGeoData(timeRange = '24h') {
    try {
      const response = await axios.get(`${API_BASE}/logs/geo`, {
        params: { timeRange }
      })
      return response.data
    } catch (error) {
      console.error('Error fetching geo data:', error)
      throw error
    }
  },

  /**
   * Get recently active threats for map visualization
   */
  async getThreats(limit = 10) {
    try {
      const response = await axios.get(`${API_BASE}/geo/threats`, {
        params: { limit }
      })
      return response.data
    } catch (error) {
      console.error('Error fetching threat flows:', error)
      throw error
    }
  },

  /**
   * Get logs for specific IP
   */
  async getLogsByIP(ip, timeRange = '24h', limit = 100) {
    try {
      const response = await axios.get(`${API_BASE}/logs/ip/${ip}`, {
        params: { timeRange, limit }
      })
      return response.data
    } catch (error) {
      console.error(`Error fetching logs for IP ${ip}:`, error)
      throw error
    }
  },

  /**
   * Get logs by severity
   */
  async getLogsBySeverity(severity, limit = 100) {
    try {
      const response = await axios.get(`${API_BASE}/logs/severity/${severity}`, {
        params: { limit }
      })
      return response.data
    } catch (error) {
      console.error(`Error fetching ${severity} logs:`, error)
      throw error
    }
  },

  /**
   * Get logs for endpoint
   */
  async getLogsByEndpoint(endpoint, timeRange = '24h', limit = 100) {
    try {
      const response = await axios.get(`${API_BASE}/logs/endpoint/${endpoint}`, {
        params: { timeRange, limit }
      })
      return response.data
    } catch (error) {
      console.error(`Error fetching logs for endpoint ${endpoint}:`, error)
      throw error
    }
  },

  /**
   * Search logs with filters
   */
  async search(filters = {}) {
    try {
      const response = await axios.get(`${API_BASE}/logs/search`, {
        params: {
          limit: filters.limit || 100,
          offset: filters.offset || 0,
          severity: filters.severity,
          logType: filters.logType,
          endpoint: filters.endpoint,
          sourceIp: filters.sourceIp,
          destIp: filters.destIp
        }
      })
      return response.data
    } catch (error) {
      console.error('Error searching logs:', error)
      throw error
    }
  },

  /**
   * Get registry logs
   */
  async getRegistryLogs(filters = {}) {
    try {
      const response = await axios.get(`${API_BASE}/logs/registry`, {
        params: {
          limit: filters.limit || 100,
          offset: filters.offset || 0,
          severity: filters.severity,
          computer: filters.computer,
          user: filters.user,
          action: filters.action
        }
      })
      return response.data
    } catch (error) {
      console.error('Error fetching registry logs:', error)
      throw error
    }
  },

  /**
   * Get registry statistics
   */
  async getRegistryStats() {
    try {
      const response = await axios.get(`${API_BASE}/logs/registry/stats`)
      return response.data
    } catch (error) {
      console.error('Error fetching registry stats:', error)
      throw error
    }
  },

  /**
   * Ingest registry logs
   */
  async ingestRegistryLogs(logs) {
    try {
      const response = await axios.post(`${API_BASE}/logs/registry/ingest`, logs)
      return response.data
    } catch (error) {
      console.error('Error ingesting registry logs:', error)
      throw error
    }
  }
}

export const statsAPI = {
  /**
   * Get dashboard statistics
   */
  async getDashboardStats(timeRange = '24h') {
    try {
      const response = await axios.get(`${API_BASE}/stats/dashboard`, {
        params: { timeRange }
      })
      return response.data
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
      throw error
    }
  },

  /**
   * Get severity statistics
   */
  async getSeverityStats(timeRange = '24h') {
    try {
      const response = await axios.get(`${API_BASE}/stats/severity`, {
        params: { timeRange }
      })
      return response.data
    } catch (error) {
      console.error('Error fetching severity stats:', error)
      throw error
    }
  },

  /**
   * Get timeline data
   */
  async getTimeline(timeRange = '24h') {
    try {
      const response = await axios.get(`${API_BASE}/stats/timeline`, {
        params: { timeRange }
      })
      return response.data
    } catch (error) {
      console.error('Error fetching timeline:', error)
      throw error
    }
  }
}
