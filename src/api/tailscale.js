import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002/api'

export const tailscaleAPI = {
  /**
   * Get recent Tailscale logs
   */
  async getRecentLogs(limit = 100, type = null) {
    try {
      const params = { limit }
      if (type) params.type = type

      const response = await axios.get(`${API_BASE}/tailscale/recent`, { params })
      return response.data
    } catch (error) {
      console.error('Error fetching recent Tailscale logs:', error)
      throw error
    }
  },

  /**
   * Get Tailscale statistics
   */
  async getStats(timeRange = '24h') {
    try {
      const response = await axios.get(`${API_BASE}/tailscale/stats`, {
        params: { timeRange }
      })
      return response.data
    } catch (error) {
      console.error('Error fetching Tailscale stats:', error)
      throw error
    }
  },

  /**
   * Get events by type
   */
  async getEventsByType(type, limit = 100) {
    try {
      const response = await axios.get(`${API_BASE}/tailscale/events/${type}`, {
        params: { limit }
      })
      return response.data
    } catch (error) {
      console.error(`Error fetching ${type} events:`, error)
      throw error
    }
  },

  /**
   * Get device list
   */
  async getDevices() {
    try {
      const response = await axios.get(`${API_BASE}/tailscale/recent`, {
        params: { limit: 1000, type: 'device_updated' }
      })
      return response.data
    } catch (error) {
      console.error('Error fetching devices:', error)
      throw error
    }
  },

  /**
   * Get user sessions
   */
  async getUserSessions() {
    try {
      const response = await axios.get(`${API_BASE}/tailscale/recent`, {
        params: { limit: 1000, type: 'auth_success' }
      })
      return response.data
    } catch (error) {
      console.error('Error fetching user sessions:', error)
      throw error
    }
  }
}
