import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://100.100.83.123:3002/api'

const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`
})

export const tailscaleAPI = {
  /**
   * Get recent Tailscale logs
   */
  async getRecentLogs(limit = 100, type = null) {
    try {
      const params = { limit }
      if (type) params.type = type

      const response = await axios.get(`${API_BASE}/tailscale/recent`, { 
        params,
        headers: getAuthHeaders()
      })
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
        params: { timeRange },
        headers: getAuthHeaders()
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
        params: { limit },
        headers: getAuthHeaders()
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
      const response = await axios.get(`${API_BASE}/tailscale/devices`, {
        headers: getAuthHeaders()
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
        params: { limit: 1000, type: 'auth_success' },
        headers: getAuthHeaders()
      })
      return response.data
    } catch (error) {
      console.error('Error fetching user sessions:', error)
      throw error
    }
  }
}
