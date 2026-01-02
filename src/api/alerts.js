import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002/api'

export const alertsAPI = {
  async getRecentAlerts(limit = 50, unreadOnly = false) {
    const params = { limit }
    if (unreadOnly) params.unread_only = 'true'
    const response = await axios.get(`${API_BASE}/alerts/events`, { params })
    return response.data
  },

  async getMetrics(timeRange = '24h') {
    const response = await axios.get(`${API_BASE}/alerts/metrics`, {
      params: { timeRange }
    })
    return response.data
  },

  async getRecentCases(limit = 10) {
    const response = await axios.get(`${API_BASE}/alerts/cases/recent`, {
      params: { limit }
    })
    return response.data
  }
}
