import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002/api'

export const eventsAPI = {
  /**
   * Get recent events
   */
  async getRecent(limit = 100, action = null, host = null) {
    try {
      const params = { limit }
      if (action) params.action = action
      if (host) params.host = host

      const response = await axios.get(`${API_BASE}/events/recent`, { params })
      return response.data
    } catch (error) {
      console.error('Error fetching recent events:', error)
      throw error
    }
  },

  /**
   * Get event statistics
   */
  async getStats(timeRange = '24h') {
    try {
      const response = await axios.get(`${API_BASE}/events/stats`, {
        params: { timeRange }
      })
      return response.data
    } catch (error) {
      console.error('Error fetching event stats:', error)
      throw error
    }
  },

  /**
   * Get network topology data from events
   */
  async getTopology(limit = 1000, timeRange = '24h') {
    try {
      const response = await axios.get(`${API_BASE}/events/topology`, {
        params: { limit, timeRange }
      })
      return response.data
    } catch (error) {
      console.error('Error fetching topology data:', error)
      throw error
    }
  },

  /**
   * Get events for specific IP
   */
  async getEventsByIP(ip, timeRange = '24h', limit = 100) {
    try {
      const response = await axios.get(`${API_BASE}/events/ip/${ip}`, {
        params: { timeRange, limit }
      })
      return response.data
    } catch (error) {
      console.error(`Error fetching events for IP ${ip}:`, error)
      throw error
    }
  },

  /**
   * Search events with filters
   */
  async search(filters = {}) {
    try {
      const response = await axios.get(`${API_BASE}/events/search`, {
        params: {
          limit: filters.limit || 100,
          offset: filters.offset || 0,
          action: filters.action,
          host: filters.host,
          sourceIp: filters.sourceIp,
          destIp: filters.destIp,
          protocol: filters.protocol
        }
      })
      return response.data
    } catch (error) {
      console.error('Error searching events:', error)
      throw error
    }
  }
}
