import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { logsAPI, statsAPI } from '../api/logs'
import { tailscaleAPI } from '../api/tailscale'
import { eventsAPI } from '../api/events'
import { alertsAPI } from '../api/alerts'
import { agentsAPI } from '../api/agents'
import { geoThreatAPI } from '../api/geoThreat'

export const useAPIStore = defineStore('api', () => {
  // State
  const logs = ref([])
  const events = ref([])
  const alerts = ref([])
  const tailscaleLogs = ref([])
  const geoData = ref([])
  const agents = ref([])
  const dashboardStats = ref(null)
  const eventStats = ref(null)
  const alertMetrics = ref(null)
  const tailscaleStats = ref(null)
  const notifications = ref([])
  const hiveCases = ref([])
  const loading = ref(false)
  const error = ref(null)
  const timeRange = ref('30d')

  // Fetch dashboard statistics
  const fetchDashboardStats = async () => {
    loading.value = true
    error.value = null
    try {
      const data = await statsAPI.getDashboardStats(timeRange.value)
      dashboardStats.value = data
      return data
    } catch (err) {
      error.value = err.message
      console.error('Failed to fetch dashboard stats:', err)
    } finally {
      loading.value = false
    }
  }

  const fetchAlertMetrics = async () => {
    loading.value = true
    error.value = null
    try {
      const data = await alertsAPI.getMetrics(timeRange.value)
      alertMetrics.value = data.data || null
      return data
    } catch (err) {
      error.value = err.message
      console.error('Failed to fetch alert metrics:', err)
    } finally {
      loading.value = false
    }
  }

  const fetchRecentAlerts = async (limit = 50) => {
    loading.value = true
    error.value = null
    try {
      const data = await alertsAPI.getRecentAlerts(limit)
      alerts.value = data.data || []
      return data
    } catch (err) {
      error.value = err.message
      console.error('Failed to fetch recent alerts:', err)
    } finally {
      loading.value = false
    }
  }

  // Fetch recent logs
  const fetchRecentLogs = async (limit = 999999) => {
    loading.value = true
    error.value = null
    try {
      const data = await logsAPI.getRecent(limit)
      const logsArray = data.data || (Array.isArray(data) ? data : [])

      if (logsArray.length > 0) {
        logs.value = logsArray
      } else {
        console.warn('Real logs empty, keeping existing or using fallback in component')
        // No change here - let the component handle it or keep current logs
      }
      return data
    } catch (err) {
      error.value = err.message
      console.error('Failed to fetch recent logs:', err)
    } finally {
      loading.value = false
    }
  }

  // Fetch geolocation data
  const fetchGeoData = async () => {
    loading.value = true
    error.value = null
    try {
      const data = await logsAPI.getGeoData(timeRange.value)
      geoData.value = data.data || []
      return data
    } catch (err) {
      error.value = err.message
      console.error('Failed to fetch geo data:', err)
    } finally {
      loading.value = false
    }
  }

  // Fetch live threat flows for visualization
  const fetchLiveThreats = async (limit = 10) => {
    try {
      const data = await logsAPI.getThreats(limit)
      return data.data || []
    } catch (err) {
      console.error('Failed to fetch live threats:', err)
      return []
    }
  }

  // Fetch logs by IP
  const fetchLogsByIP = async (ip, timeRangeValue = timeRange.value) => {
    loading.value = true
    error.value = null
    try {
      const data = await logsAPI.getLogsByIP(ip, timeRangeValue)
      return data
    } catch (err) {
      error.value = err.message
      console.error(`Failed to fetch logs for IP ${ip}:`, err)
      return { logs: [], stats: { total: 0, critical: 0, high: 0, medium: 0, low: 0 } }
    } finally {
      loading.value = false
    }
  }

  // Fetch logs by severity
  const fetchLogsBySeverity = async (severity, limit = 100) => {
    loading.value = true
    error.value = null
    try {
      const data = await logsAPI.getLogsBySeverity(severity, limit)
      return data
    } catch (err) {
      error.value = err.message
      console.error(`Failed to fetch logs for severity ${severity}:`, err)
    } finally {
      loading.value = false
    }
  }

  // Fetch logs by endpoint
  const fetchLogsByEndpoint = async (endpoint, timeRangeValue = timeRange.value) => {
    loading.value = true
    error.value = null
    try {
      const data = await logsAPI.getLogsByEndpoint(endpoint, timeRangeValue)
      return data
    } catch (err) {
      error.value = err.message
      console.error(`Failed to fetch logs for endpoint ${endpoint}:`, err)
    } finally {
      loading.value = false
    }
  }

  // Fetch Tailscale stats
  const fetchTailscaleStats = async () => {
    loading.value = true
    error.value = null
    try {
      const data = await tailscaleAPI.getStats(timeRange.value)
      tailscaleStats.value = data
      return data
    } catch (err) {
      error.value = err.message
      console.error('Failed to fetch Tailscale stats:', err)
    } finally {
      loading.value = false
    }
  }

  // Fetch Tailscale logs
  const fetchTailscaleLogs = async (limit = 100) => {
    loading.value = true
    error.value = null
    try {
      const data = await tailscaleAPI.getRecentLogs(limit)
      tailscaleLogs.value = data.data || []
      return data
    } catch (err) {
      error.value = err.message
      console.error('Failed to fetch Tailscale logs:', err)
    } finally {
      loading.value = false
    }
  }

  // Search logs
  const searchLogs = async (filters) => {
    loading.value = true
    error.value = null
    try {
      // Map frontend filters to backend params
      const params = {
        limit: filters.limit || 50,
        page: filters.page || 1,
        severity: filters.severity,
        logType: filters.logType,
        timeRange: filters.timeRange,
        search: filters.q
      }

      // Use the list endpoint which supports full filtering
      const data = await logsAPI.getAll(params)
      return data
    } catch (err) {
      error.value = err.message
      console.error('Failed to search logs:', err)
      return { data: [], total: 0 }
    } finally {
      loading.value = false
    }
  }

  // Fetch recent events
  const fetchRecentEvents = async (limit = 100) => {
    loading.value = true
    error.value = null
    try {
      const data = await eventsAPI.getRecent(limit)
      events.value = data.data || []
      return data
    } catch (err) {
      error.value = err.message
      console.error('Failed to fetch recent events:', err)
    } finally {
      loading.value = false
    }
  }

  // Fetch event statistics
  const fetchEventStats = async () => {
    loading.value = true
    error.value = null
    try {
      const data = await eventsAPI.getStats(timeRange.value)
      eventStats.value = data
      return data
    } catch (err) {
      error.value = err.message
      console.error('Failed to fetch event stats:', err)
    } finally {
      loading.value = false
    }
  }

  // Fetch topology data
  const fetchTopologyData = async (limit = 1000) => {
    loading.value = true
    error.value = null
    try {
      const data = await eventsAPI.getTopology(limit, timeRange.value)
      return data
    } catch (err) {
      error.value = err.message
      console.error('Failed to fetch topology data:', err)
    } finally {
      loading.value = false
    }
  }

  // Fetch events by IP
  const fetchEventsByIP = async (ip) => {
    loading.value = true
    error.value = null
    try {
      const data = await eventsAPI.getEventsByIP(ip, timeRange.value)
      return data
    } catch (err) {
      error.value = err.message
      console.error(`Failed to fetch events for IP ${ip}:`, err)
    } finally {
      loading.value = false
    }
  }

  // No changes needed here, just removing the duplicates I added earlier if they exist
  const searchEvents = async (filters) => {
    loading.value = true
    error.value = null
    try {
      const data = await eventsAPI.search(filters)
      return data
    } catch (err) {
      error.value = err.message
      console.error('Failed to search events:', err)
    } finally {
      loading.value = false
    }
  }

  // Fetch agents
  const fetchAgents = async () => {
    loading.value = true
    try {
      const data = await agentsAPI.getAll()
      agents.value = data.data || []
    } catch (err) {
      console.error('Failed to fetch agents:', err)
    } finally {
      loading.value = false
    }
  }

  // Fetch recent Hive cases
  const fetchRecentCases = async (limit = 10) => {
    try {
      const response = await alertsAPI.getRecentCases(limit)
      hiveCases.value = response.data || []
      return response
    } catch (err) {
      console.error('Failed to fetch Hive cases:', err)
      return []
    }
  }

  // Fetch live threat map data (deprecated - using 2dMap.jsx)
  const fetchLiveThreatMapData = async (timeRange = '24h') => {
    console.warn('fetchLiveThreatMapData is deprecated. Use 2dMap.jsx instead.')
    return []
  }

  // Fetch threat flows
  const fetchThreatFlows = async (timeRange = '24h', limit = 100) => {
    loading.value = true
    error.value = null
    try {
      const data = await geoThreatAPI.getThreatFlows(timeRange, limit)
      return data
    } catch (err) {
      error.value = err.message
      console.error('Failed to fetch threat flows:', err)
      return { success: false, data: [] }
    } finally {
      loading.value = false
    }
  }

  // Fetch threat statistics
  const fetchThreatStats = async (timeRange = '24h') => {
    loading.value = true
    error.value = null
    try {
      const data = await geoThreatAPI.getThreatStats(timeRange)
      return data
    } catch (err) {
      error.value = err.message
      console.error('Failed to fetch threat stats:', err)
      return { success: false, stats: {} }
    } finally {
      loading.value = false
    }
  }

  // Computed properties
  const totalLogs = computed(() => {
    const logs = dashboardStats.value?.totalLogs || 0
    const cases = dashboardStats.value?.totalCases || 0
    return logs + cases
  })
  const totalEvents = computed(() => dashboardStats.value?.totalEvents || 0)
  const total = computed(() => dashboardStats.value?.total || 0)
  const severityBreakdown = computed(() => dashboardStats.value?.severityBreakdown || [])
  const eventActionBreakdown = computed(() => dashboardStats.value?.eventActionBreakdown || [])
  const logTypeBreakdown = computed(() => dashboardStats.value?.logTypeBreakdown || [])
  const topEndpoints = computed(() => dashboardStats.value?.topEndpoints || [])
  const topSourceIPs = computed(() => dashboardStats.value?.topSourceIPs || [])
  const topDestinationIPs = computed(() => dashboardStats.value?.topDestinationIPs || [])
  const uniqueHosts = computed(() => dashboardStats.value?.uniqueHosts || 0)
  const totalAlerts = computed(() => alertMetrics.value?.totalAlerts || 0)
  const criticalAlerts = computed(() => alertMetrics.value?.criticalAlerts || 0)
  const analyzedAlerts = computed(() => alertMetrics.value?.analyzedAlerts || 0)
  const criticalLogs = computed(() => {
    const breakdown = severityBreakdown.value
    const critical = breakdown.find(s => s._id === 'Critical')
    return critical?.count || 0
  })
  const highLogs = computed(() => {
    const breakdown = severityBreakdown.value
    const high = breakdown.find(s => s._id === 'High')
    return high?.count || 0
  })
  const mediumLogs = computed(() => {
    const breakdown = severityBreakdown.value
    const medium = breakdown.find(s => s._id === 'Medium')
    return medium?.count || 0
  })

  // Aggregate logs by source IP with real severity data
  const aggregatedSourceIPs = computed(() => {
    const ipMap = new Map()

    logs.value.forEach(log => {
      const ip = log.source_ip
      if (!ip) return

      if (!ipMap.has(ip)) {
        ipMap.set(ip, {
          _id: ip,
          ip: ip,
          count: 0,
          severity: 'Low',
          severityPriority: 1,
          lastSeen: null,
          firstSeen: null,
          endpoints: new Set(),
          logTypes: new Set()
        })
      }

      const entry = ipMap.get(ip)
      entry.count += 1
      entry.endpoints.add(log.endpoint)
      entry.logTypes.add(log.log_type)

      // Update timestamps
      const logTime = new Date(log.timestamp)
      if (!entry.lastSeen || logTime > entry.lastSeen) {
        entry.lastSeen = logTime
      }
      if (!entry.firstSeen || logTime < entry.firstSeen) {
        entry.firstSeen = logTime
      }

      // Update severity to HIGHEST PRIORITY from actual log severity (NOT count-based)
      // CRITICAL: Use actual severity field, not event count
      const logSeverity = log.severity || 'Low'
      const severityPriority = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 }
      const logPriority = severityPriority[logSeverity] || 1

      // Only update if this log has higher severity priority
      if (logPriority > entry.severityPriority) {
        entry.severity = logSeverity
        entry.severityPriority = logPriority
      }
    })

    // Convert to array and sort by count descending
    return Array.from(ipMap.values())
      .map(entry => ({
        ...entry,
        endpoints: Array.from(entry.endpoints),
        logTypes: Array.from(entry.logTypes)
      }))
      .sort((a, b) => b.count - a.count)
  })

  // Aggregate logs by destination IP with real severity data
  const aggregatedDestinationIPs = computed(() => {
    const ipMap = new Map()

    logs.value.forEach(log => {
      const ip = log.dest_ip
      if (!ip) return

      if (!ipMap.has(ip)) {
        ipMap.set(ip, {
          _id: ip,
          ip: ip,
          count: 0,
          severity: 'Low',
          severityPriority: 1,
          lastSeen: null,
          firstSeen: null,
          endpoints: new Set(),
          logTypes: new Set()
        })
      }

      const entry = ipMap.get(ip)
      entry.count += 1
      entry.endpoints.add(log.endpoint)
      entry.logTypes.add(log.log_type)

      // Update timestamps
      const logTime = new Date(log.timestamp)
      if (!entry.lastSeen || logTime > entry.lastSeen) {
        entry.lastSeen = logTime
      }
      if (!entry.firstSeen || logTime < entry.firstSeen) {
        entry.firstSeen = logTime
      }

      // Update severity to HIGHEST PRIORITY from actual log severity (NOT count-based)
      // CRITICAL: Use actual severity field, not event count
      const logSeverity = log.severity || 'Low'
      const severityPriority = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 }
      const logPriority = severityPriority[logSeverity] || 1

      if (logPriority > entry.severityPriority) {
        entry.severity = logSeverity
        entry.severityPriority = logPriority
      }
    })

    // Convert to array and sort by count descending
    return Array.from(ipMap.values())
      .map(entry => ({
        ...entry,
        endpoints: Array.from(entry.endpoints),
        logTypes: Array.from(entry.logTypes)
      }))
      .sort((a, b) => b.count - a.count)
  })

  return {
    // State
    logs,
    events,
    alerts,
    tailscaleLogs,
    geoData,
    agents,
    dashboardStats,
    eventStats,
    alertMetrics,
    tailscaleStats,
    notifications,
    hiveCases,
    loading,
    error,
    timeRange,

    // Actions
    fetchDashboardStats,
    fetchRecentLogs,
    fetchGeoData,
    fetchLiveThreats,
    fetchLogsByIP,
    fetchLogsBySeverity,
    fetchLogsByEndpoint,
    fetchTailscaleStats,
    fetchTailscaleLogs,
    searchLogs,
    fetchRecentEvents,
    fetchEventStats,
    fetchAlertMetrics,
    fetchRecentAlerts,
    fetchTopologyData,
    fetchEventsByIP,
    searchEvents,
    fetchAgents,
    fetchRecentCases,
    fetchThreatFlows,
    fetchThreatStats,

    // Computed
    totalLogs,
    totalEvents,
    total,
    severityBreakdown,
    eventActionBreakdown,
    logTypeBreakdown,
    topEndpoints,
    topSourceIPs,
    topDestinationIPs,
    uniqueHosts,
    totalAlerts,
    criticalAlerts,
    analyzedAlerts,
    criticalLogs,
    highLogs,
    mediumLogs,
    aggregatedSourceIPs,
    aggregatedDestinationIPs,
    agents
  }
})
