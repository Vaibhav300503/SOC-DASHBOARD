/**
 * Geo Threat API (deprecated - using 2dMap.jsx)
 * All functions are deprecated as they were used by Raven threat map components
 */

export const geoThreatAPI = {
  /**
   * Get live threat map data (deprecated)
   */
  getLiveThreatMapData: async (timeRange = '24h') => {
    console.warn('getLiveThreatMapData is deprecated. Use 2dMap.jsx instead.')
    return { data: [] }
  },

  /**
   * Get threat flows (attack paths) (deprecated)
   */
  getThreatFlows: async (timeRange = '24h', limit = 100) => {
    console.warn('getThreatFlows is deprecated. Use 2dMap.jsx instead.')
    return { data: [] }
  },

  /**
   * Get threat statistics (deprecated)
   */
  getThreatStats: async (timeRange = '24h') => {
    console.warn('getThreatStats is deprecated. Use 2dMap.jsx instead.')
    return { stats: {} }
  },

  /**
   * Get critical threats (deprecated)
   */
  getCriticalThreats: async (limit = 50) => {
    console.warn('getCriticalThreats is deprecated. Use 2dMap.jsx instead.')
    return { data: [] }
  },

  /**
   * Get threat heatmap data (deprecated)
   */
  getThreatHeatmap: async (timeRange = '24h') => {
    console.warn('getThreatHeatmap is deprecated. Use 2dMap.jsx instead.')
    return { data: [] }
  },

  /**
   * Get threat history for a country (deprecated)
   */
  getThreatHistoryByCountry: async (country, timeRange = '24h') => {
    console.warn('getThreatHistoryByCountry is deprecated. Use 2dMap.jsx instead.')
    return { data: [] }
  },

  /**
   * Get attack flow details (deprecated)
   */
  getAttackFlowDetails: async (flowId) => {
    console.warn('getAttackFlowDetails is deprecated. Use 2dMap.jsx instead.')
    return { data: {} }
  }
}
