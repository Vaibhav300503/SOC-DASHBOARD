/**
 * Geo Threat API - Geographic threat data
 */

import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002/api'

export const geoThreatAPI = {
  /**
   * Get live threat map data
   */
  getLiveThreatMapData: async (timeRange = '24h') => {
    try {
      const response = await axios.get(`${API_BASE}/geo/threat-map`, {
        params: { timeRange }
      })
      return response.data
    } catch (error) {
      console.error('Error fetching live threat map data:', error)
      throw error
    }
  },

  /**
   * Get threat flows (attack paths)
   */
  getThreatFlows: async (timeRange = '24h', limit = 100) => {
    try {
      const response = await axios.get(`${API_BASE}/geo/threat-flows`, {
        params: { timeRange, limit }
      })
      return response.data
    } catch (error) {
      console.error('Error fetching threat flows:', error)
      throw error
    }
  },

  /**
   * Get threat statistics
   */
  getThreatStats: async (timeRange = '24h') => {
    try {
      const response = await axios.get(`${API_BASE}/geo/threat-stats`, {
        params: { timeRange }
      })
      return response.data
    } catch (error) {
      console.error('Error fetching threat stats:', error)
      throw error
    }
  },

  /**
   * Get critical threats
   */
  getCriticalThreats: async (limit = 50) => {
    try {
      const response = await axios.get(`${API_BASE}/geo/critical-threats`, {
        params: { limit }
      })
      return response.data
    } catch (error) {
      console.error('Error fetching critical threats:', error)
      throw error
    }
  },

  /**
   * Get threat history for a country
   */
  getThreatHistoryByCountry: async (country, timeRange = '24h') => {
    try {
      const response = await axios.get(`${API_BASE}/geo/threat-history/${country}`, {
        params: { timeRange }
      })
      return response.data
    } catch (error) {
      console.error(`Error fetching threat history for ${country}:`, error)
      throw error
    }
  },

  /**
   * Get attack flow details
   */
  getAttackFlowDetails: async (flowId) => {
    try {
      const response = await axios.get(`${API_BASE}/geo/attack-flow/${flowId}`)
      return response.data
    } catch (error) {
      console.error(`Error fetching attack flow ${flowId}:`, error)
      throw error
    }
  }
}
