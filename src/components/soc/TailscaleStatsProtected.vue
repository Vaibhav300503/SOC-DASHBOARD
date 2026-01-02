<template>
  <div class="card-glass p-6 rounded-xl">
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-3">
        <h3 class="text-lg font-semibold text-slate-dark-50">Tailscale Network Status</h3>
        <div class="flex items-center gap-2 text-xs">
          <div :class="[
            'w-2 h-2 rounded-full',
            connectionStatus.indicator
          ]"></div>
          <span class="text-slate-dark-400">{{ connectionStatus.text }}</span>
        </div>
      </div>
      <button 
        @click="refreshData" 
        :disabled="loading"
        class="px-3 py-1 bg-cyber-500/20 text-cyber-400 rounded-lg hover:bg-cyber-500/30 transition-colors text-sm disabled:opacity-50"
      >
        <i class="fas fa-sync-alt mr-2" :class="{ 'animate-spin': loading }"></i>
        Refresh
      </button>
    </div>
    
    <!-- Configuration Notice -->
    <div v-if="!isConfigured" class="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
      <div class="flex items-start gap-3">
        <i class="fas fa-exclamation-triangle text-yellow-500 mt-1"></i>
        <div>
          <div class="text-sm font-medium text-yellow-500">Tailscale API Not Configured</div>
          <div class="text-xs text-slate-dark-400 mt-1">
            To get live data, configure TAILSCALE_API_KEY in your backend .env file
          </div>
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div v-if="error" class="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
      <div class="flex items-start gap-3">
        <i class="fas fa-exclamation-circle text-red-500 mt-1"></i>
        <div>
          <div class="text-sm font-medium text-red-500">Connection Error</div>
          <div class="text-xs text-slate-dark-400 mt-1">{{ error }}</div>
          <button 
            @click="retryConnection"
            class="mt-2 text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded hover:bg-red-500/30"
          >
            Retry
          </button>
        </div>
      </div>
    </div>
    
    <!-- Main Stats Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="stat-card">
        <div class="flex items-center justify-between">
          <div>
            <div class="stat-value">{{ safeValue(dashboardData.deviceStats?.totalDevices, 0) }}</div>
            <div class="stat-label">Total Devices</div>
          </div>
          <i class="fas fa-server text-cyber-500 text-3xl opacity-20"></i>
        </div>
      </div>

      <div class="stat-card">
        <div class="flex items-center justify-between">
          <div>
            <div class="stat-value text-green-400">{{ safeValue(dashboardData.deviceStats?.onlineDevices, 0) }}</div>
            <div class="stat-label">Online Now</div>
          </div>
          <i class="fas fa-wifi text-neon-green text-3xl opacity-20"></i>
        </div>
      </div>

      <div class="stat-card">
        <div class="flex items-center justify-between">
          <div>
            <div class="stat-value text-red-400">{{ safeValue(dashboardData.deviceStats?.criticalRisk, 0) }}</div>
            <div class="stat-label">Critical Risk</div>
          </div>
          <i class="fas fa-exclamation-triangle text-neon-red text-3xl opacity-20"></i>
        </div>
      </div>

      <div class="stat-card">
        <div class="flex items-center justify-between">
          <div>
            <div class="stat-value">{{ safeValue(dashboardData.geoDistribution?.length, 0) }}</div>
            <div class="stat-label">Countries</div>
          </div>
          <i class="fas fa-globe text-neon-purple text-3xl opacity-20"></i>
        </div>
      </div>
    </div>

    <!-- Risk Distribution -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
      <div class="bg-slate-dark-900/50 rounded-lg p-4 border border-slate-dark-700/50">
        <div class="text-xs text-slate-dark-400 uppercase tracking-wide mb-2">High Risk Devices</div>
        <div class="text-2xl font-bold text-neon-orange">{{ safeValue(dashboardData.deviceStats?.highRisk, 0) }}</div>
        <div class="text-xs text-slate-dark-500 mt-1">Require attention</div>
      </div>

      <div class="bg-slate-dark-900/50 rounded-lg p-4 border border-slate-dark-700/50">
        <div class="text-xs text-slate-dark-400 uppercase tracking-wide mb-2">Offline Devices</div>
        <div class="text-2xl font-bold text-slate-dark-400">{{ safeValue(dashboardData.deviceStats?.offlineDevices, 0) }}</div>
        <div class="text-xs text-slate-dark-500 mt-1">Not connected</div>
      </div>

      <div class="bg-slate-dark-900/50 rounded-lg p-4 border border-slate-dark-700/50">
        <div class="text-xs text-slate-dark-400 uppercase tracking-wide mb-2">Last Sync</div>
        <div class="text-sm font-bold text-cyber-400">{{ formatLastSync(dashboardData.syncStatus?.lastSyncTime) }}</div>
        <div class="text-xs text-slate-dark-500 mt-1">{{ syncStatusText }}</div>
      </div>
    </div>

    <!-- Recent Activity -->
    <div class="mt-6">
      <h4 class="text-sm font-medium text-slate-dark-400 mb-3">Recent Activity</h4>
      <div v-if="safeArray(dashboardData.recentActivity).length === 0" class="text-center py-8 text-slate-dark-500">
        <i class="fas fa-info-circle text-2xl mb-2 opacity-50"></i>
        <div class="text-sm">No recent activity</div>
      </div>
      <div v-else class="space-y-2">
        <div 
          v-for="activity in safeArray(dashboardData.recentActivity).slice(0, 3)" 
          :key="safeString(activity?._id, Math.random())"
          class="bg-slate-dark-900/30 rounded-lg p-3 border border-slate-dark-700/30"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <i class="fas fa-terminal text-cyber-400 text-sm"></i>
              <div>
                <div class="text-sm text-slate-dark-200">{{ safeString(activity?.type, 'Unknown Event') }}</div>
                <div class="text-xs text-slate-dark-500">{{ safeString(activity?.user, 'system') }}</div>
              </div>
            </div>
            <div class="text-xs text-slate-dark-500">
              {{ formatTime(activity?.ts) }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useAPIStore } from '../../stores/apiStore'
import { useTailscaleWebSocket } from '../../services/tailscaleWebSocket'
import { useAuthStore } from '../../stores/authStore'

const apiStore = useAPIStore()
const authStore = useAuthStore()
const { connect, disconnect, subscribe } = useTailscaleWebSocket()

const loading = ref(false)
const error = ref(null)
const dashboardData = ref({})
const isConfigured = ref(false)
const retryCount = ref(0)
const maxRetries = 3
let unsubscribe = null
let refreshInterval = null

// Computed properties for safe data access
const connectionStatus = computed(() => {
  if (error.value) {
    return { indicator: 'bg-red-500', text: 'Error' }
  }
  if (!isConfigured.value) {
    return { indicator: 'bg-yellow-500', text: 'Sample Data' }
  }
  if (dashboardData.value.syncStatus?.status === 'success') {
    return { indicator: 'bg-green-500', text: 'Connected' }
  }
  return { indicator: 'bg-yellow-500', text: 'Connecting...' }
})

const syncStatusText = computed(() => {
  const status = dashboardData.value.syncStatus
  if (!status) return 'Unknown'
  
  if (status.syncInProgress) return 'Sync in progress...'
  if (status.status === 'success') return 'Sync successful'
  return 'Sync pending'
})

// Safe value helpers
const safeValue = (value, defaultValue = 0) => {
  if (value === null || value === undefined || value === 'undefined') {
    return defaultValue
  }
  
  if (typeof value === 'string' && !isNaN(value)) {
    return parseInt(value, 10) || defaultValue
  }
  
  if (typeof value === 'number' && (isNaN(value) || !isFinite(value))) {
    return defaultValue
  }
  
  return value
}

const safeArray = (value) => {
  if (!value || !Array.isArray(value)) {
    return []
  }
  return value.filter(item => item !== null && item !== undefined)
}

const safeString = (value, defaultValue = '') => {
  if (value === null || value === undefined) {
    return defaultValue
  }
  return String(value)
}

const refreshData = async () => {
  if (loading.value) return
  
  loading.value = true
  error.value = null
  
  try {
    // Get auth token
    const token = authStore.token
    if (!token) {
      throw new Error('Authentication required')
    }
    
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/tailscale-protected/dashboard`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (response.status === 401) {
      authStore.logout()
      throw new Error('Session expired - please login again')
    }
    
    if (response.status === 403) {
      throw new Error('Insufficient permissions to view Tailscale data')
    }
    
    if (!response.ok) {
      if (response.status === 404) {
        console.log('Tailscale endpoint not found, using sample data')
        dashboardData.value = getSafeSampleData()
        isConfigured.value = false
        return
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const data = await response.json()
    
    // Validate response structure
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid response format')
    }
    
    // Sanitize and validate data
    dashboardData.value = sanitizeDashboardData(data)
    isConfigured.value = true
    retryCount.value = 0 // Reset retry count on success
    
  } catch (err) {
    console.error('Error fetching Tailscale dashboard data:', err)
    error.value = err.message || 'Failed to fetch data'
    
    // Use sample data on error
    dashboardData.value = getSafeSampleData()
    isConfigured.value = false
    
    // Auto-retry for network errors
    if (retryCount.value < maxRetries && err.message.includes('fetch')) {
      retryCount.value++
      setTimeout(() => {
        console.log(`Retrying connection... (${retryCount.value}/${maxRetries})`)
        refreshData()
      }, 2000 * retryCount.value)
    }
    
  } finally {
    loading.value = false
  }
}

// Sanitize dashboard data to prevent crashes
const sanitizeDashboardData = (data) => {
  return {
    deviceStats: {
      totalDevices: safeValue(data.deviceStats?.totalDevices),
      onlineDevices: safeValue(data.deviceStats?.onlineDevices),
      offlineDevices: safeValue(data.deviceStats?.offlineDevices),
      criticalRisk: safeValue(data.deviceStats?.criticalRisk),
      highRisk: safeValue(data.deviceStats?.highRisk),
      mediumRisk: safeValue(data.deviceStats?.mediumRisk),
      lowRisk: safeValue(data.deviceStats?.lowRisk)
    },
    geoDistribution: safeArray(data.geoDistribution).map(item => ({
      country: safeString(item?._id || item?.country),
      count: safeValue(item?.count),
      devices: safeArray(item?.devices)
    })),
    recentActivity: safeArray(data.recentActivity).map(activity => ({
      _id: safeString(activity?._id),
      type: safeString(activity?.type),
      user: safeString(activity?.user),
      ts: activity?.ts || new Date().toISOString(),
      details: safeString(activity?.details)
    })),
    syncStatus: {
      lastSyncTime: data.syncStatus?.lastSyncTime || null,
      status: safeString(data.syncStatus?.status, 'unknown'),
      syncInProgress: Boolean(data.syncStatus?.syncInProgress)
    }
  }
}

// Safe sample data for fallback
const getSafeSampleData = () => {
  return {
    deviceStats: {
      totalDevices: 0,
      onlineDevices: 0,
      offlineDevices: 0,
      criticalRisk: 0,
      highRisk: 0,
      mediumRisk: 0,
      lowRisk: 0
    },
    geoDistribution: [],
    recentActivity: [],
    syncStatus: {
      lastSyncTime: null,
      status: 'sample',
      syncInProgress: false
    }
  }
}

const formatLastSync = (timestamp) => {
  if (!timestamp) return 'Never'
  
  try {
    const date = new Date(timestamp)
    if (isNaN(date.getTime())) return 'Invalid'
    
    const now = new Date()
    const diffMinutes = Math.floor((now - date) / 60000)
    
    if (diffMinutes < 1) return 'Just now'
    if (diffMinutes < 60) return `${diffMinutes}m ago`
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`
    return date.toLocaleDateString()
  } catch {
    return 'Invalid'
  }
}

const formatTime = (timestamp) => {
  if (!timestamp) return 'Unknown'
  
  try {
    const date = new Date(timestamp)
    if (isNaN(date.getTime())) return 'Invalid'
    return date.toLocaleTimeString()
  } catch {
    return 'Invalid'
  }
}

const retryConnection = () => {
  error.value = null
  retryCount.value = 0
  refreshData()
}

onMounted(() => {
  // Initial data fetch
  refreshData()
  
  // Connect to WebSocket for real-time updates
  connect()
  
  // Subscribe to real-time updates
  unsubscribe = subscribe('update', (data) => {
    try {
      console.log('Received Tailscale update:', data)
      
      // Update dashboard data safely
      if (data.type === 'device_update' && data.deviceStats) {
        dashboardData.value.deviceStats = {
          ...dashboardData.value.deviceStats,
          ...sanitizeDeviceStats(data.deviceStats)
        }
      } else if (data.type === 'activity' && data.activity) {
        const newActivity = sanitizeActivity(data.activity)
        dashboardData.value.recentActivity = [
          newActivity,
          ...safeArray(dashboardData.value.recentActivity).slice(0, 9)
        ]
      } else if (data.type === 'sync_status' && data.syncStatus) {
        dashboardData.value.syncStatus = {
          ...dashboardData.value.syncStatus,
          ...data.syncStatus
        }
      }
      
      isConfigured.value = true
      error.value = null
      
    } catch (err) {
      console.error('Error processing WebSocket update:', err)
      // Don't crash the component on WebSocket errors
    }
  })
  
  // Auto-refresh every 30 seconds as fallback
  refreshInterval = setInterval(() => {
    if (!error.value) {
      refreshData()
    }
  }, 30000)
})

onUnmounted(() => {
  if (unsubscribe) {
    unsubscribe()
  }
  disconnect()
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})

// Helper function to sanitize device stats
const sanitizeDeviceStats = (stats) => {
  return {
    totalDevices: safeValue(stats.totalDevices),
    onlineDevices: safeValue(stats.onlineDevices),
    offlineDevices: safeValue(stats.offlineDevices),
    criticalRisk: safeValue(stats.criticalRisk),
    highRisk: safeValue(stats.highRisk)
  }
}

// Helper function to sanitize activity
const sanitizeActivity = (activity) => {
  return {
    _id: safeString(activity._id || `activity_${Date.now()}`),
    type: safeString(activity.type),
    user: safeString(activity.user),
    ts: activity.ts || new Date().toISOString(),
    details: safeString(activity.details)
  }
}
</script>
