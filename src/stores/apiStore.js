import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { logsAPI, statsAPI } from '../api/logs'
import { tailscaleAPI } from '../api/tailscale'
import { eventsAPI } from '../api/events'
import { alertsAPI } from '../api/alerts'
import { agentsAPI } from '../api/agents'

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
  const timeRange = ref('24h')

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
  const fetchRecentLogs = async (limit = 100) => {
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
      const data = await logsAPI.search(filters)
      return data
    } catch (err) {
      error.value = err.message
      console.error('Failed to search logs:', err)
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

  // Computed properties
  const totalLogs = computed(() => dashboardStats.value?.totalLogs || 0)
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
    agents
  }
})
